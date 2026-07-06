const { Router } = require("express");
const { groqReasoning } = require("../lib/groq");
const { toolDefinitions, toolHandlers } = require("../tools/index");
const { SYSTEM_PROMPT } = require("../prompts/systemPrompt");
const { fetchKnowledgeBase } = require("../lib/knowledgeBase");
const { processFile, uploadKrsToStorage } = require("../lib/fileUpload");
const { simpanPesan } = require("../lib/chatSession");

const router = Router();
const MODEL_REASONING = process.env.MODEL_REASONING;

// Pengaman deterministik: hapus label seperti "Catatan admin:", "Catatan dari admin:",
// "Alasan:", "Alasan dari admin:" kalau model tetap menulisnya walau dilarang di prompt.
function bersihkanLabelCatatan(text) {
  if (!text) return text;
  return text
    .replace(/\b(Catatan(\s+dari)?\s+admin(nya)?|Keterangan\s+admin(nya)?|Alasan(\s+dari\s+admin)?|Admin\s+menyebutkan|Admin\s+mengatakan)\s*:?\s*/gi, "")
    .trimStart();
}

// Model kadang menulis nama tool dengan noise token di belakangnya (mis. dari model open-source
// yang kurang rapi) — potong sebelum dicocokkan ke toolHandlers.
function sanitizeToolCallName(name) {
  return name.replace(/<\|[^|]*\|>[^"]*$/, "").trim();
}

// Jalankan semua tool_calls dari satu balasan model, kembalikan pesan "tool" untuk
// dikirim balik ke model + kode_tiket kalau ada buat_tiket yang berhasil.
async function jalankanToolCalls(toolCalls, krsStoragePath) {
  let tiketBaru = null;
  const messages = [];
  for (const toolCall of toolCalls) {
    const fnName = toolCall.function.name;
    const fnArgs = JSON.parse(toolCall.function.arguments);
    const handler = toolHandlers[fnName];

    let toolResult;
    try {
      if (fnName === "buat_tiket" && krsStoragePath) {
        fnArgs.krs_url = krsStoragePath;
      }
      toolResult = handler ? await handler(fnArgs) : { error: `Tool tidak dikenal: ${fnName}` };
      if (fnName === "buat_tiket" && toolResult?.kode_tiket) {
        tiketBaru = toolResult.kode_tiket;
      }
    } catch (err) {
      toolResult = { error: err.message };
    }

    messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
  }
  return { messages, tiketBaru };
}

function sanitizeToolCalls(message) {
  return {
    ...message,
    tool_calls: message.tool_calls.map((tc) => ({
      ...tc,
      function: { ...tc.function, name: sanitizeToolCallName(tc.function.name) },
    })),
  };
}

router.post("/", async (req, res) => {
  const { messages, npm, file } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Field messages (array) wajib diisi" });
  }

  if (npm && !/^\d{8}$/.test(npm)) {
    return res.status(400).json({ error: "NPM tidak valid" });
  }

  try {
    const kbText = await fetchKnowledgeBase();

    // Proses file jika ada
    let fileContext = null;
    let krsStoragePath = null;
    if (file) {
      try {
        const result = await processFile(file);
        if (file.type === "pdf" && result) {
          try {
            krsStoragePath = await uploadKrsToStorage(file.base64, npm || "unknown");
          } catch (err) {
            console.error("Gagal upload KRS:", err);
            return res.status(500).json({ error: "Gagal mengupload file KRS. Silakan coba lagi." });
          }
          fileContext = `\n\n[Mahasiswa melampirkan file PDF KRS dengan isi berikut:]\n${result.text}${krsStoragePath ? `\n[krs_path: ${krsStoragePath}]` : ""}`;
        } else {
          fileContext = result;
        }
      } catch (err) {
        console.error("Error memproses file:", err);
        return res.status(400).json({ error: "Gagal memproses file yang dikirim" });
      }
    }

    // Bersihkan field frontend-only dan gabungkan konteks file
    const processedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (fileContext && processedMessages.length > 0) {
      const lastMsg = processedMessages[processedMessages.length - 1];
      if (lastMsg.role === "user") {
        processedMessages[processedMessages.length - 1] = {
          role: lastMsg.role,
          content: (lastMsg.content ? lastMsg.content + "\n" : "") + fileContext,
        };
      }
    }

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const conversation = [
      { role: "system", content: SYSTEM_PROMPT + kbText + `\n\n[Waktu saat ini: ${now}] WIB` },
      ...processedMessages,
    ];

    const response = await groqReasoning.chat.completions.create({
      model: MODEL_REASONING,
      messages: conversation,
      tools: toolDefinitions,
      tool_choice: "auto",
    });

    const choice = response.choices[0];

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      await simpanPesan(npm, "user", lastUserMessage.content);
    }

    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      const reply = bersihkanLabelCatatan(choice.message.content);
      await simpanPesan(npm, "assistant", reply);
      return res.json({ reply });
    }

    let tiketBaru = null;

    const sanitizedChoiceMessage = sanitizeToolCalls(choice.message);
    const firstRound = await jalankanToolCalls(sanitizedChoiceMessage.tool_calls, krsStoragePath);
    tiketBaru = firstRound.tiketBaru;

    let currentMessages = [...conversation, sanitizedChoiceMessage, ...firstRound.messages];
    let finalChoice;

    for (let i = 0; i < 5; i++) {
      const finalResponse = await groqReasoning.chat.completions.create({
        model: MODEL_REASONING,
        messages: currentMessages,
        tools: toolDefinitions,
        tool_choice: "auto",
      });

      finalChoice = finalResponse.choices[0];

      if (!finalChoice.message.tool_calls || finalChoice.message.tool_calls.length === 0) {
        break;
      }

      const sanitizedFinalMessage = sanitizeToolCalls(finalChoice.message);
      const round = await jalankanToolCalls(sanitizedFinalMessage.tool_calls, krsStoragePath);
      if (round.tiketBaru) tiketBaru = round.tiketBaru;

      currentMessages = [...currentMessages, sanitizedFinalMessage, ...round.messages];
    }

    const reply = bersihkanLabelCatatan(finalChoice.message.content) ?? "Maaf, saya tidak dapat memproses permintaan tersebut saat ini. Silakan coba lagi.";
    await simpanPesan(npm, "assistant", reply);
    res.json({ reply, ...(tiketBaru ? { tiket_id: tiketBaru } : {}) });
  } catch (err) {
    console.error("Error pada /chat:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;

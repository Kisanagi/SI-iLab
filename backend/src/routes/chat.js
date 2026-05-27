const { Router } = require("express");
const { groqReasoning, groqVision } = require("../lib/groq");
const supabase = require("../lib/supabase");
const { toolDefinitions, toolHandlers } = require("../tools/index");
const pdfParse = require("pdf-parse");

const router = Router();

const SYSTEM_PROMPT = `Kamu adalah asisten sistem informasi laboratorium iLab yang membantu mahasiswa.

=== ATURAN KNOWLEDGE BASE ===
Jawab pertanyaan umum (jam lab, aturan, prosedur) HANYA dari knowledge base yang tersedia. Jangan menambahkan informasi dari luar knowledge base.
Jika informasi tidak ada di knowledge base, jawab hanya dengan: "Maaf, saya tidak memiliki informasi tersebut. Silakan hubungi admin iLab langsung." Jangan mengarang atau menambahkan jawaban lain.

=== SAPAAN & PERCAKAPAN BIASA ===
Jika mahasiswa mengirim sapaan santai seperti "halo", "hai", "hei", "selamat pagi/siang/sore/malam", "permisi", "kak", "min", atau sapaan sejenisnya, balas dengan ramah dan natural. Perkenalkan diri sebagai asisten iLab dan tanyakan ada yang bisa dibantu. Jangan balas sapaan dengan "Maaf, saya tidak memiliki informasi tersebut."
Jika mahasiswa mengirim kalimat percakapan biasa seperti "oke", "baik", "terima kasih", "makasih", "oke kak", "siap", "noted", atau ungkapan singkat sejenisnya, balas dengan ramah dan natural seperti "Baik, ada lagi yang bisa saya bantu?" tanpa perlu mencari di knowledge base. Jangan balas kalimat seperti ini dengan "Maaf, saya tidak memiliki informasi tersebut."
Jika mahasiswa mengirim pertanyaan singkat seperti "kenapa", "kenapa kak", "gimana", "kok", "maksudnya", "terus gimana" atau sejenisnya, jawab berdasarkan konteks percakapan sebelumnya. Jangan jawab dengan "Maaf, saya tidak memiliki informasi tersebut."

=== PEMBUATAN TIKET ===
Jika mahasiswa memerlukan tindakan admin, kumpulkan semua data yang diperlukan terlebih dahulu sebelum memanggil tool buat_tiket.
Setelah tiket berhasil dibuat, sampaikan nomor tiket kepada mahasiswa dan WAJIB minta mereka untuk menyimpan atau mencatat nomor tiket tersebut karena diperlukan untuk mengecek status tiket nantinya.
Kalau mahasiswa tidak jadi melakukan tindakan yang memerlukan tiket, atau menyatakan batal/gajadi/tidak jadi di tengah proses pengisian data, HENTIKAN alur pengisian data sepenuhnya. Jangan kirim form lagi. Cukup akhiri percakapan dengan baik tanpa menyebut soal tiket.
Setelah tiket berhasil dibuat, WAJIB cek waktu sekarang yang ada di konteks. Bandingkan dengan jam operasional lab yang ada di knowledge base. Jika saat ini di luar jam operasional, beritahu mahasiswa secara pasti (JANGAN gunakan kata "jika") bahwa tiket akan diproses saat lab buka kembali. Jika masih dalam jam operasional, tidak perlu menyebut soal jam.

=== KATEGORI ENROLLMENT ===
Khusus kategori Enrollment (course belum muncul/terdaftar), tanyakan semua data berikut dalam satu pesan sekaligus:
Nama :
NPM :
Kelas :
Email :
No HP :
Nama Praktikum :
Kode Mata Kuliah :
Tunggu mahasiswa mengisi semua data tersebut, baru buat tiket. Jangan buat tiket jika ada data yang belum diisi.

=== KATEGORI PENGULANGAN PRAKTIKUM ===
Khusus kategori Pendaftaran Pengulangan Praktikum, Pengulangan Praktikum, Ngulang Praktikum (Apapun Chat mahasiswa untuk Mengulang Praktikum). WAJIB tampilkan dulu isi prosedur pengulangan praktikum dari knowledge base secara langsung TANPA kalimat pembuka seperti "Berikut prosedur..." atau "Berdasarkan knowledge base..." - langsung tulis isi prosedurnya saja. Setelah menampilkan prosedur, minta mahasiswa mengisi format berikut dalam satu pesan sekaligus. Sebelum data diri ucapkan Silahkan isi data diri dibawah ini :
Format data diri:
Nama:
NPM:
Email:
Kelas Asli:
Kelas Pengulangan:
Praktikum yang diulang:
Kode Mata Kuliah:
(Kode mata kuliah dapat dilihat di KRS)
Tunggu mahasiswa mengisi semua data tersebut, baru buat tiket. Jangan buat tiket jika ada data yang belum diisi.
PENTING untuk kategori Pendaftaran Pengulangan Praktikum: mahasiswa WAJIB melampirkan file KRS (PDF). Jika belum upload KRS, minta mahasiswa upload KRS terlebih dahulu sebelum tiket dibuat. Jangan buat tiket pengulangan tanpa KRS.

=== PENANGANAN FILE ===
Jika mahasiswa melampirkan gambar, gunakan deskripsi gambar yang diberikan untuk memahami permasalahan mereka.
Jika mahasiswa melampirkan file PDF KRS, lakukan hal berikut secara WAJIB:
1. Bandingkan NPM yang diisi mahasiswa di form dengan NPM yang tertera di KRS. Jika berbeda, TOLAK dan minta mahasiswa memastikan kembali datanya. JANGAN buat tiket.
2. Bandingkan Nama yang diisi mahasiswa di form dengan Nama yang tertera di KRS. Jika berbeda, TOLAK dan minta klarifikasi. JANGAN buat tiket.
3. Pastikan mata kuliah yang ingin diulang benar-benar tercantum di KRS. Jika tidak ada, TOLAK dan beritahu mahasiswa bahwa mata kuliah tersebut tidak ditemukan di KRS mereka. JANGAN buat tiket.
4. Hanya jika NPM, Nama, dan mata kuliah semuanya COCOK antara form dan KRS, baru boleh membuat tiket.

=== CEK STATUS TIKET ===
Jika mahasiswa ingin cek status tiket, minta nomor tiket atau NPM lalu panggil tool cek_status.
Jika mahasiswa menyebutkan kode tiket (contoh: TKT-001, TKT-002) dalam bentuk apapun seperti "TKT-001 sudah?", "gimana TKT-002?", "cek TKT-003", langsung panggil tool cek_status tanpa bertanya lagi.
Saat menyampaikan hasil cek status, selalu sertakan catatan_admin jika ada. Jika status tiket "Ditolak", sampaikan dengan jelas bahwa tiket ditolak beserta alasannya dari catatan_admin. Contoh: "Tiket TKT-001 kamu ditolak. Alasan dari admin: [catatan_admin]." Jika status bukan Ditolak dan ada catatan_admin, sampaikan juga sebagai informasi tambahan dari admin.

=== ATURAN UMUM BALASAN ===
Selalu balas ramah dalam Bahasa Indonesia.
Jangan jawab pertanyaan diluar lab iLab. Tolak dengan sopan dan jelaskan bahwa kamu hanya bisa membantu terkait iLab.
PENTING: Balas dalam teks biasa tanpa format Markdown. Jangan gunakan simbol **, *, #, -, angka diikuti titik untuk list, atau tanda formatting lainnya. Tulis seperti percakapan natural sehari-hari. Jika ingin membuat list, tulis dalam bentuk kalimat biasa atau gunakan tanda strip sederhana tanpa spasi berlebih.`;

const MODEL_REASONING = process.env.MODEL_REASONING;
const MODEL_VISION = process.env.MODEL_VISION;

async function fetchKnowledgeBase() {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("topik, konten")
    .order("topik", { ascending: true });

  if (error || !data || data.length === 0) return "";

  const kbText = data.map((k) => `- ${k.topik}: ${k.konten}`).join("\n");
  return `\n\nKNOWLEDGE BASE:\n${kbText}`;
}

async function simpanPesan(npm, role, content) {
  if (!npm) return;
  await supabase.from("chat_sessions").insert({ npm, role, content });
}

async function uploadKrsToStorage(base64, npm) {
  const buffer = Buffer.from(base64, "base64");
  const fileName = `${npm}_${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from("KRS-File")
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (error) throw new Error(`Gagal upload KRS: ${error.message}`);
  return fileName;
}

async function processFile(file) {
  if (!file) return null;

  if (file.type === "pdf") {
    const buffer = Buffer.from(file.base64, "base64");
    const pdfData = await pdfParse(buffer);
    return { text: pdfData.text, buffer };
  }

  if (file.type === "image") {
    const visionResponse = await groqVision.chat.completions.create({
      model: MODEL_VISION,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Deskripsikan isi gambar ini secara detail dalam Bahasa Indonesia. Jika ada teks, tuliskan semua teksnya.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`,
              },
            },
          ],
        },
      ],
    });
    const description = visionResponse.choices[0].message.content;
    return `\n\n[Mahasiswa melampirkan gambar dengan deskripsi berikut:]\n${description}`;
  }

  return null;
}

router.post("/", async (req, res) => {
  const { messages, npm, file } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res
      .status(400)
      .json({ error: "Field messages (array) wajib diisi" });
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
          // Upload ke storage segera
          try {
            krsStoragePath = await uploadKrsToStorage(
              file.base64,
              npm || "unknown",
            );
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
        return res
          .status(400)
          .json({ error: "Gagal memproses file yang dikirim" });
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
          content:
            (lastMsg.content ? lastMsg.content + "\n" : "") + fileContext,
        };
      }
    }

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
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
      const reply = choice.message.content;
      await simpanPesan(npm, "assistant", reply);
      return res.json({ reply });
    }

    // Sanitize nama tool di choice.message sebelum masuk ke history
    // Groq validasi nama tool di conversation history — nama kotor akan di-reject
    const sanitizedChoiceMessage = {
      ...choice.message,
      tool_calls: choice.message.tool_calls.map((tc) => ({
        ...tc,
        function: {
          ...tc.function,
          name: tc.function.name.replace(/<\|[^|]*\|>[^"]*$/, "").trim(),
        },
      })),
    };

    const toolCallMessages = [sanitizedChoiceMessage];

    for (const toolCall of sanitizedChoiceMessage.tool_calls) {
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments);

      const handler = toolHandlers[fnName];
      if (!handler) {
        return res.status(500).json({ error: `Tool tidak dikenal: ${fnName}` });
      }

      let toolResult;
      try {
        // Inject krs_url dari storage jika ada dan tool adalah buat_tiket
        if (fnName === "buat_tiket" && krsStoragePath) {
          fnArgs.krs_url = krsStoragePath;
        }
        toolResult = await handler(fnArgs);
      } catch (err) {
        toolResult = { error: err.message };
      }

      toolCallMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    let currentMessages = [...conversation, ...toolCallMessages];
    let finalChoice;

    for (let i = 0; i < 5; i++) {
      const finalResponse = await groqReasoning.chat.completions.create({
        model: MODEL_REASONING,
        messages: currentMessages,
        tools: toolDefinitions,
        tool_choice: "auto",
      });

      finalChoice = finalResponse.choices[0];

      // Model sudah menghasilkan teks — selesai
      if (!finalChoice.message.tool_calls || finalChoice.message.tool_calls.length === 0) {
        break;
      }

      // Sanitize nama tool sebelum dimasukkan ke history
      const sanitizedFinalMessage = {
        ...finalChoice.message,
        tool_calls: finalChoice.message.tool_calls.map((tc) => ({
          ...tc,
          function: {
            ...tc.function,
            name: tc.function.name.replace(/<\|[^|]*\|>[^"]*$/, "").trim(),
          },
        })),
      };

      // Model memanggil tool lagi — eksekusi lalu lanjut iterasi
      const extraMessages = [sanitizedFinalMessage];
      for (const toolCall of sanitizedFinalMessage.tool_calls) {
        const fnName = toolCall.function.name;
        const fnArgs = JSON.parse(toolCall.function.arguments);
        const handler = toolHandlers[fnName];
        let toolResult;
        try {
          if (fnName === "buat_tiket" && krsStoragePath) fnArgs.krs_url = krsStoragePath;
          toolResult = handler ? await handler(fnArgs) : { error: `Tool tidak dikenal: ${fnName}` };
        } catch (err) {
          toolResult = { error: err.message };
        }
        extraMessages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
      }
      currentMessages = [...currentMessages, ...extraMessages];
    }

    const reply = finalChoice.message.content ?? "Maaf, saya tidak dapat memproses permintaan tersebut saat ini. Silakan coba lagi.";
    await simpanPesan(npm, "assistant", reply);
    res.json({ reply });
  } catch (err) {
    console.error("Error pada /chat:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;

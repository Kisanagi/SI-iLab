import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import ChatBubble from "../components/ChatBubble.jsx";

const GREETING = {
  role: "assistant",
  content: "Halo! Saya asisten iLab. Ada yang bisa saya bantu? 😊",
};

const MAX_FILE_SIZE_MB = 10;

export default function Chat() {
  const [npm, setNpm] = useState(() => localStorage.getItem("npm") || "");
  const [npmInput, setNpmInput] = useState("");
  const [showNpmPopup, setShowNpmPopup] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const isWelcomeScreen = messages.length === 1 && !loadingHistory;

  useEffect(() => {
    if (!npm) {
      setShowNpmPopup(true);
    } else {
      fetchHistory(npm);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function fetchHistory(npmValue) {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/history/${npmValue}`);
      if (data.length > 0) {
        setMessages([
          GREETING,
          ...data.map((d) => ({ role: d.role, content: d.content })),
        ]);
      }
    } catch (err) {
      console.error("Gagal fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleNpmSubmit(e) {
    e.preventDefault();
    const trimmed = npmInput.trim();
    if (!trimmed) return;
    if (!/^\d{8}$/.test(trimmed)) {
      alert("NPM harus berupa 8 digit angka.");
      return;
    }
    localStorage.setItem("npm", trimmed);
    setNpm(trimmed);
    setShowNpmPopup(false);
    fetchHistory(trimmed);
  }

  async function handleClearHistory() {
    if (!confirm("Hapus semua riwayat chat?")) return;
    try {
      await api.delete(`/history/${npm}`);
      setMessages([GREETING]);
    } catch {
      alert("Gagal menghapus riwayat");
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      alert("Hanya file gambar (JPG, PNG, WEBP) atau PDF yang diperbolehkan");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setAttachedFile({
        name: file.name,
        type: isImage ? "image" : "pdf",
        mimeType: file.type,
        base64,
        preview: isImage ? ev.target.result : null,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removeAttachedFile() {
    setAttachedFile(null);
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && !attachedFile) || loading) return;

    const fileToSend = attachedFile;
    const displayContent = text || "";
    const userMessage = {
      role: "user",
      content: displayContent,
      imagePreview: fileToSend?.type === "image" ? fileToSend.preview : null,
      fileName: fileToSend?.type === "pdf" ? fileToSend.name : null,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setAttachedFile(null);
    setLoading(true);

    try {
      const history = nextMessages.filter((m) => m !== GREETING).slice(-20);
      const payload = { messages: history, npm };
      if (fileToSend) {
        payload.file = {
          type: fileToSend.type,
          mimeType: fileToSend.mimeType,
          base64: fileToSend.base64,
        };
      }

      const { data } = await api.post("/chat", payload);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Popup NPM */}
      {showNpmPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Selamat datang!
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Masukkan NPM kamu untuk menyimpan riwayat chat.
            </p>
            <form onSubmit={handleNpmSubmit} className="space-y-3">
              <input
                type="text"
                value={npmInput}
                onChange={(e) => setNpmInput(e.target.value)}
                placeholder="Contoh: 12345678"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
              <button
                type="submit"
                disabled={!npmInput.trim()}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Mulai Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 shadow-md shrink-0 flex items-center justify-between">
        {/* Kiri: ikon bot + judul + status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Asisten Lab</p>
            <p className="text-xs text-blue-200 leading-tight flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Online
            </p>
          </div>
        </div>

        {/* Kanan: tombol hapus chat */}
        {npm && (
          <button
            onClick={handleClearHistory}
            title="Hapus riwayat"
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-300/40 hover:border-white/60 px-3 py-1.5 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Hapus chat
          </button>
        )}
      </header>

      {/* NPM badge */}
      {npm && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 text-xs text-primary flex items-center justify-center gap-2">
          <span>
            NPM: <span className="font-semibold">{npm}</span>
          </span>
          <span className="text-blue-200">·</span>
          <button
            onClick={() => {
              localStorage.removeItem("npm");
              setNpm("");
              setNpmInput("");
              setMessages([GREETING]);
              setShowNpmPopup(true);
            }}
            className="underline hover:text-primary-dark transition-colors"
          >
            Ganti
          </button>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loadingHistory ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Memuat riwayat chat...
          </div>
        ) : isWelcomeScreen ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/gunadarma.png"
                  alt="Universitas Gunadarma"
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" /></svg>';
                  }}
                />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full" />
              <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Selamat datang di iLab
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Ceritakan kendala praktikum Anda, atau ketik pertanyaan untuk
              memulai.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                imagePreview={msg.imagePreview}
                fileName={msg.fileName}
              />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-200 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  <span className="animate-pulse">Mengetik...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Preview file terlampir */}
      {attachedFile && (
        <div className="shrink-0 bg-white border-t border-gray-100 px-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 w-fit max-w-full">
              {attachedFile.preview ? (
                <img
                  src={attachedFile.preview}
                  alt="preview"
                  className="h-10 w-10 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-red-500">PDF</span>
                </div>
              )}
              <span className="text-xs text-gray-700 truncate max-w-[180px]">
                {attachedFile.name}
              </span>
              <button
                onClick={removeAttachedFile}
                className="text-gray-400 hover:text-gray-600 shrink-0 ml-1 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-1">
        <form onSubmit={sendMessage}>
          <div className="flex gap-2 max-w-3xl mx-auto items-end">
            {/* Tombol upload file */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || loadingHistory || showNpmPopup}
              title="Lampirkan gambar atau PDF"
              className="shrink-0 mb-1.5 text-gray-400 hover:text-primary disabled:opacity-40 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (mis. 'saya ada masalah dengan praktikum')"
              disabled={loading || loadingHistory || showNpmPopup}
              rows={1}
              className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light disabled:opacity-60 resize-none overflow-hidden"
              style={{ minHeight: "38px" }}
            />

            {/* Tombol kirim bulat */}
            <button
              type="submit"
              disabled={
                (!input.trim() && !attachedFile) ||
                loading ||
                loadingHistory ||
                showNpmPopup
              }
              title="Kirim"
              className="shrink-0 mb-0.5 w-9 h-9 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Hint bawah input */}
        <div className="max-w-3xl mx-auto mt-1.5 pb-2">
          <p className="text-xs text-gray-400">
            Tekan <kbd className="font-semibold">Enter</kbd> untuk kirim ·{" "}
            <kbd className="font-semibold">Shift + Enter</kbd> baris baru
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center text-xs text-gray-400">
        <span>© 2026 iLab — Asisten Praktikum</span>
        <button
          onClick={() => navigate("/admin/login")}
          className="hover:text-gray-600 transition-colors"
        >
          Admin
        </button>
      </footer>
    </div>
  );
}

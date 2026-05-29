import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import ChatBubble from "../components/ChatBubble.jsx";
import NpmPopup from "../components/NpmPopup.jsx";
import WelcomeScreen from "../components/WelcomeScreen.jsx";
import ChatInput from "../components/ChatInput.jsx";

const MAX_FILE_SIZE_MB = 10;

export default function Chat() {
  const [npm, setNpm] = useState(() => localStorage.getItem("npm") || "");
  const [npmInput, setNpmInput] = useState("");
  const [showNpmPopup, setShowNpmPopup] = useState(false);
  const [popupClosing, setPopupClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const isWelcomeScreen = messages.length === 0 && !loadingHistory;

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
        setMessages([...data.map((d) => ({ role: d.role, content: d.content }))]);
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
    setPopupClosing(true);
    setTimeout(() => {
      setShowNpmPopup(false);
      setPopupClosing(false);
      fetchHistory(trimmed);
    }, 180);
  }

  async function handleClearHistory() {
    if (!confirm("Hapus semua riwayat chat?")) return;
    try {
      await api.delete(`/history/${npm}`);
      setMessages([]);
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
    const userMessage = {
      role: "user",
      content: text || "",
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
      const history = nextMessages.slice(-10);
      const payload = { messages: history, npm };
      if (fileToSend) {
        payload.file = {
          type: fileToSend.type,
          mimeType: fileToSend.mimeType,
          base64: fileToSend.base64,
        };
      }

      const { data } = await api.post("/chat", payload);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      {showNpmPopup && (
        <NpmPopup
          npmInput={npmInput}
          setNpmInput={setNpmInput}
          popupClosing={popupClosing}
          handleNpmSubmit={handleNpmSubmit}
        />
      )}

      {/* Header */}
      <header className="bg-primary text-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-md shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
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
        {npm && (
          <button
            onClick={handleClearHistory}
            title="Hapus riwayat"
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-300/40 hover:border-white/60 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus chat
          </button>
        )}
      </header>

      {/* NPM badge */}
      {npm && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 text-xs text-primary flex items-center justify-center gap-2">
          <span>NPM: <span className="font-semibold">{npm}</span></span>
          <span className="text-blue-200">·</span>
          <button
            onClick={() => {
              localStorage.removeItem("npm");
              setNpm("");
              setNpmInput("");
              setMessages([]);
              setShowNpmPopup(true);
            }}
            className="underline hover:text-primary-dark transition-colors"
          >
            Ganti
          </button>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
        {loadingHistory ? (
          <div className="text-center text-gray-400 text-sm py-8">Memuat riwayat chat...</div>
        ) : isWelcomeScreen ? (
          <WelcomeScreen />
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

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleKeyDown={handleKeyDown}
        sendMessage={sendMessage}
        loading={loading}
        loadingHistory={loadingHistory}
        showNpmPopup={showNpmPopup}
        attachedFile={attachedFile}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        handleFileSelect={handleFileSelect}
        removeAttachedFile={removeAttachedFile}
      />

      {/* Footer */}
      <footer className="shrink-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-center text-xs text-gray-400">
        <span onClick={() => navigate("/admin/login")} className="cursor-default select-none">
          © 2026 Universitas Gunadarma · iLab
        </span>
      </footer>
    </div>
  );
}

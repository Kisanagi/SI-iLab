import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import TicketSection from "../components/TicketSection.jsx";
import KnowledgeBaseSection from "../components/KnowledgeBaseSection.jsx";
import TicketCard from "../components/TicketCard.jsx";

const STATUS_LIST = ["Menunggu", "Diproses", "Selesai", "Ditolak"];

const KATEGORI_OPTIONS = [
  { label: "Semua", value: "Semua" },
  { label: "Enrollment", value: "Enrollment" },
  { label: "Pengulangan", value: "Pendaftaran Pengulangan Praktikum" },
  { label: "Kendala Akun", value: "Kendala Akun" },
  { label: "Lainnya", value: "Lainnya" },
];

const STAT_DOT = {
  Menunggu: "bg-gray-400",
  Diproses: "bg-blue-500",
  Selesai: "bg-green-500",
  Ditolak: "bg-red-500",
};

const STAT_NUM = {
  Menunggu: "text-gray-700",
  Diproses: "text-blue-600",
  Selesai: "text-green-600",
  Ditolak: "text-red-600",
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorTickets, setErrorTickets] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const [kbList, setKbList] = useState([]);
  const [loadingKb, setLoadingKb] = useState(true);
  const [kbForm, setKbForm] = useState({ topik: "", konten: "" });
  const [kbSaving, setKbSaving] = useState(false);
  const [kbError, setKbError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [activeTab, setActiveTab] = useState("tiket");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");

  const navigate = useNavigate();
  const kbFormRef = useRef(null);
  const kbScrollRef = useRef(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get("/tickets");
      setTickets(data);
      setErrorTickets("");
    } catch {
      setErrorTickets("Gagal memuat tiket. Pastikan Anda masih login.");
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchKb = useCallback(async () => {
    setLoadingKb(true);
    try {
      const { data } = await api.get("/knowledge-base");
      setKbList(data);
    } catch {
      setKbError("Gagal memuat knowledge base.");
    } finally {
      setLoadingKb(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchKb();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchKb]);

  // Kalau tiket yang dipilih terhapus, reset selectedTicket
  useEffect(() => {
    if (selectedTicketId && !tickets.find((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null);
    }
  }, [tickets, selectedTicketId]);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  }

  async function handleKbSubmit(e) {
    e.preventDefault();
    if (!kbForm.topik.trim() || !kbForm.konten.trim()) return;
    setKbSaving(true);
    setKbError("");
    try {
      if (editingId) {
        await api.put(`/knowledge-base/${editingId}`, kbForm);
      } else {
        await api.post("/knowledge-base", kbForm);
      }
      setKbForm({ topik: "", konten: "" });
      setEditingId(null);
      await fetchKb();
    } catch {
      setKbError("Gagal menyimpan. Coba lagi.");
    } finally {
      setKbSaving(false);
    }
  }

  function handleKbEdit(item) {
    setKbForm({ topik: item.topik, konten: item.konten });
    setEditingId(item.id);
    setActiveTab("kb");
    setTimeout(() => {
      if (kbScrollRef.current) {
        kbScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (kbFormRef.current) {
        kbFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  async function handleKbDelete(topik) {
    if (!confirm(`Hapus topik "${topik}"?`)) return;
    try {
      await api.delete(`/knowledge-base/${encodeURIComponent(topik)}`);
      await fetchKb();
    } catch {
      alert("Gagal menghapus topik");
    }
  }

  function handleKbCancel() {
    setKbForm({ topik: "", konten: "" });
    setEditingId(null);
    setKbError("");
  }

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = filterStatus === "Semua" || t.status === filterStatus;
    const matchKategori = filterKategori === "Semua" || t.kategori === filterKategori;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (t.nama_mahasiswa || "").toLowerCase().includes(q) ||
      (t.npm || "").toLowerCase().includes(q) ||
      (t.kode_tiket || "").toLowerCase().includes(q);
    return matchStatus && matchKategori && matchSearch;
  });

  const stats = STATUS_LIST.map((s) => ({
    label: s,
    count: tickets.filter((t) => t.status === s).length,
  }));

  const waitingCount = tickets.filter((t) => t.status === "Menunggu").length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Dashboard Admin</p>
            <p className="text-xs text-blue-200 leading-tight">iLab</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-300/40 hover:border-white/60 px-3 py-1.5 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — stats + filter */}
        <aside className="w-52 shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ringkasan</p>
          <div className="space-y-2 mb-6">
            {stats.map(({ label, count }) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STAT_DOT[label]}`} />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className={`font-bold text-sm ${STAT_NUM[label]}`}>{count}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {["Semua", ...STATUS_LIST].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Kategori</p>
          <div className="flex flex-wrap gap-1.5">
            {KATEGORI_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilterKategori(value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterKategori === value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Middle — tabs + list tiket */}
        <div className="w-80 shrink-0 flex flex-col border-r border-gray-200 bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button
              onClick={() => setActiveTab("tiket")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeTab === "tiket"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tiket Masuk
              {waitingCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {waitingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("kb")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeTab === "kb"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Knowledge Base
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full leading-none">
                {kbList.length}
              </span>
            </button>
          </div>

          {activeTab === "tiket" && (
            <>
              <div className="p-3 border-b border-gray-100 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NPM, atau kode tiket..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <TicketSection
                tickets={tickets}
                loadingTickets={loadingTickets}
                errorTickets={errorTickets}
                filteredTickets={filteredTickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
            </>
          )}

          {activeTab === "kb" && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-4 text-center">
              Kelola knowledge base di panel sebelah kanan
            </div>
          )}
        </div>

        {/* Right — detail tiket atau KB section */}
        {activeTab === "tiket" && (
          <div className="flex-1 overflow-y-auto">
            {selectedTicket ? (
              <div className="p-5">
                <TicketCard ticket={selectedTicket} onUpdated={fetchTickets} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">Pilih tiket untuk melihat detail</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "kb" && (
          <div ref={kbScrollRef} className="flex-1 overflow-y-auto p-5">
            <KnowledgeBaseSection
              kbList={kbList}
              loadingKb={loadingKb}
              kbForm={kbForm}
              setKbForm={setKbForm}
              kbSaving={kbSaving}
              kbError={kbError}
              editingId={editingId}
              handleKbSubmit={handleKbSubmit}
              handleKbEdit={handleKbEdit}
              handleKbDelete={handleKbDelete}
              handleKbCancel={handleKbCancel}
              kbFormRef={kbFormRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}

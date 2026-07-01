import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import StatsCards from "../components/StatsCards.jsx";
import TicketSection from "../components/TicketSection.jsx";
import KnowledgeBaseSection from "../components/KnowledgeBaseSection.jsx";
import TicketCard from "../components/TicketCard.jsx";

const STATUS_LIST = ["Menunggu", "Diproses", "Selesai", "Ditolak"];

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

  useEffect(() => {
    if (selectedTicketId && !tickets.find((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null);
    }
  }, [tickets, selectedTicketId]);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  }

  async function handleDeleteTicket(ticket) {
    if (!confirm(`Hapus tiket "${ticket.kode_tiket} — ${ticket.judul}"?`)) return;
    try {
      await api.delete(`/tickets/${ticket.id}`);
      if (selectedTicketId === ticket.id) setSelectedTicketId(null);
      await fetchTickets();
    } catch {
      alert('Gagal menghapus tiket');
    }
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
      if (kbScrollRef.current) kbScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      if (kbFormRef.current) kbFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (t.nama_mahasiswa || "").toLowerCase().includes(q) ||
      (t.npm || "").toLowerCase().includes(q) ||
      (t.kode_tiket || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = STATUS_LIST.map((s) => ({
    label: s,
    count: tickets.filter((t) => t.status === s).length,
  }));

  const waitingCount = tickets.filter((t) => t.status === "Menunggu").length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-md sticky top-0 z-10">
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

      {/* Main content */}
      <main ref={kbScrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* Stats */}
          <StatsCards stats={stats} />

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab("tiket")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                activeTab === "tiket"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Tiket Masuk
              <span className={`text-xs px-1.5 py-0.5 rounded-full leading-none font-semibold ${
                activeTab === "tiket" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {waitingCount > 0 ? waitingCount : tickets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("kb")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                activeTab === "kb"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Knowledge Base
              <span className={`text-xs px-1.5 py-0.5 rounded-full leading-none font-semibold ${
                activeTab === "kb" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {kbList.length}
              </span>
            </button>
          </div>

          {/* Konten tab */}
          {activeTab === "tiket" && (
            <TicketSection
              tickets={tickets}
              loadingTickets={loadingTickets}
              errorTickets={errorTickets}
              filteredTickets={filteredTickets}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onSelectTicket={setSelectedTicketId}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {activeTab === "kb" && (
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
          )}
        </div>
      </main>

      {/* Modal detail tiket */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedTicketId(null)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs text-gray-400">{selectedTicket.kode_tiket}</p>
                <h2 className="font-semibold text-gray-800">{selectedTicket.judul}</h2>
              </div>
              <button
                onClick={() => setSelectedTicketId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <TicketCard ticket={selectedTicket} onUpdated={fetchTickets} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

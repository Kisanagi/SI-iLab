import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import StatsCards from "../components/StatsCards.jsx";
import TicketSection from "../components/TicketSection.jsx";
import KnowledgeBaseSection from "../components/KnowledgeBaseSection.jsx";

const STATUS_LIST = ["Menunggu", "Diproses", "Selesai", "Ditolak"];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorTickets, setErrorTickets] = useState("");

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
  const scrollContainerRef = useRef(null);

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
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
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

      <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto px-4 py-5 flex flex-col">
        <StatsCards stats={stats} />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 shrink-0">
          <button
            onClick={() => setActiveTab("tiket")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "tiket" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Tiket Masuk
            {tickets.filter((t) => t.status === "Menunggu").length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {tickets.filter((t) => t.status === "Menunggu").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("kb")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "kb" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Knowledge Base
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full leading-none">
              {kbList.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-0.5">
          {activeTab === "tiket" && (
            <TicketSection
              tickets={tickets}
              loadingTickets={loadingTickets}
              errorTickets={errorTickets}
              fetchTickets={fetchTickets}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filteredTickets={filteredTickets}
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
      </div>
    </div>
  );
}

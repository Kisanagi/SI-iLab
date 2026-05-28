import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import TicketCard from "../components/TicketCard.jsx";

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
        kbFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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

  const STAT_STYLE = {
    Menunggu: {
      card: "border-gray-200",
      badge: "bg-gray-100 text-gray-500",
      num: "text-gray-700",
    },
    Diproses: {
      card: "border-blue-200",
      badge: "bg-blue-50 text-blue-500",
      num: "text-blue-600",
    },
    Selesai: {
      card: "border-green-200",
      badge: "bg-green-50 text-green-500",
      num: "text-green-600",
    },
    Ditolak: {
      card: "border-red-200",
      badge: "bg-red-50 text-red-500",
      num: "text-red-600",
    },
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">
              Dashboard Admin
            </p>
            <p className="text-xs text-blue-200 leading-tight">iLab</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </header>

      <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto px-4 py-5 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 shrink-0">
          {stats.map(({ label, count }) => (
            <div
              key={label}
              className={`bg-white rounded-xl border ${STAT_STYLE[label].card} p-3 sm:p-4 shadow-sm flex flex-col items-center`}
            >
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${STAT_STYLE[label].badge}`}
              >
                {label}
              </span>
              <p
                className={`text-2xl sm:text-3xl font-bold ${STAT_STYLE[label].num}`}
              >
                {count}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 shrink-0">
          <button
            onClick={() => setActiveTab("tiket")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "tiket"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
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
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
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
              activeTab === "kb"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Knowledge Base
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full leading-none">
              {kbList.length}
            </span>
          </button>
        </div>

        {/* Tab Content - scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-0.5">
          {/* Tab: Tiket */}
          {activeTab === "tiket" && (
            <>
              {errorTickets && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                  {errorTickets}
                </div>
              )}

              {/* Search & Filter */}
              {!loadingTickets && tickets.length > 0 && (
                <div className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NPM, atau kode tiket..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {["Semua", ...STATUS_LIST].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filterStatus === s
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loadingTickets ? (
                <div className="text-center text-gray-400 py-16 text-sm">
                  Memuat tiket...
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mb-3 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  <p className="text-sm">Belum ada tiket masuk.</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center text-gray-400 py-16 text-sm">
                  Tidak ada tiket yang sesuai pencarian.
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onUpdated={fetchTickets}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab: Knowledge Base */}
          {activeTab === "kb" && (
            <div className="space-y-5 pb-4">
              {/* Form tambah/edit */}
              <div
                ref={kbFormRef}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        editingId
                          ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          : "M12 4v16m8-8H4"
                      }
                    />
                  </svg>
                  {editingId ? "Edit Topik" : "Tambah Topik Baru"}
                </h2>
                {kbError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
                    {kbError}
                  </div>
                )}
                <form onSubmit={handleKbSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topik
                    </label>
                    <input
                      type="text"
                      value={kbForm.topik}
                      onChange={(e) =>
                        setKbForm({ ...kbForm, topik: e.target.value })
                      }
                      placeholder="Contoh: Jam Operasional Lab"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konten
                    </label>
                    <textarea
                      value={kbForm.konten}
                      onChange={(e) =>
                        setKbForm({ ...kbForm, konten: e.target.value })
                      }
                      placeholder="Contoh: Lab buka Senin-Jumat pukul 08.00-17.00 WIB..."
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={
                        kbSaving ||
                        !kbForm.topik.trim() ||
                        !kbForm.konten.trim()
                      }
                      className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {kbSaving
                        ? "Menyimpan..."
                        : editingId
                          ? "Update"
                          : "Simpan"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleKbCancel}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List KB */}
              <div>
                <h2 className="font-semibold text-gray-700 text-sm mb-3 px-1">
                  Daftar Topik ({kbList.length})
                </h2>
                {loadingKb ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Memuat knowledge base...
                  </div>
                ) : kbList.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-200 text-sm">
                    Belum ada topik. Tambahkan topik pertama di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {kbList.map((item) => (
                      <div
                        key={item.topik}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">
                              {item.topik}
                            </p>
                            <p className="text-gray-500 text-sm mt-1 whitespace-pre-wrap">
                              {item.konten}
                            </p>
                            {item.updated_at && (
                              <p className="text-xs text-gray-300 mt-2">
                                Diupdate:{" "}
                                {new Date(item.updated_at).toLocaleString(
                                  "id-ID",
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3 shrink-0">
                            <button
                              onClick={() => handleKbEdit(item)}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleKbDelete(item.topik)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

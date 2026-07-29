import { useState, useRef } from "react";
import api from "../lib/api.js";

export default function KnowledgeBaseSection({ kbList, loadingKb, onChanged }) {
  const [kbForm, setKbForm] = useState({ topik: "", konten: "" });
  const [kbSaving, setKbSaving] = useState(false);
  const [kbError, setKbError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchKb, setSearchKb] = useState("");
  const [showForm, setShowForm] = useState(false);
  const kbFormRef = useRef(null);

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
      setShowForm(false);
      await onChanged();
    } catch {
      setKbError("Gagal menyimpan. Coba lagi.");
    } finally {
      setKbSaving(false);
    }
  }

  function handleEditItem(item) {
    setKbForm({ topik: item.topik, konten: item.konten });
    setEditingId(item.id);
    setKbError("");
    setShowForm(true);
    setTimeout(() => {
      kbFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handleKbDelete(topik) {
    if (!confirm(`Hapus topik "${topik}"?`)) return;
    try {
      await api.delete(`/knowledge-base/${encodeURIComponent(topik)}`);
      await onChanged();
    } catch {
      alert("Gagal menghapus topik");
    }
  }

  function handleCancelForm() {
    setKbForm({ topik: "", konten: "" });
    setEditingId(null);
    setKbError("");
    setShowForm(false);
  }

  const filteredKb = kbList.filter(
    (item) =>
      !searchKb ||
      item.topik.toLowerCase().includes(searchKb.toLowerCase()) ||
      item.konten.toLowerCase().includes(searchKb.toLowerCase())
  );

  return (
    <div>
      {/* Form tambah/edit */}
      {showForm && (
        <div ref={kbFormRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            {editingId ? "Edit Topik" : "Tambah Topik Baru"}
          </h2>
          {kbError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
              {kbError}
            </div>
          )}
          <form onSubmit={handleKbSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topik</label>
              <input
                type="text"
                value={kbForm.topik}
                onChange={(e) => setKbForm({ ...kbForm, topik: e.target.value })}
                placeholder="Contoh: Jam Operasional Lab"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
              <textarea
                value={kbForm.konten}
                onChange={(e) => setKbForm({ ...kbForm, konten: e.target.value })}
                placeholder="Contoh: Lab buka Senin-Jumat pukul 08.00-17.00 WIB..."
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light resize-y"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={kbSaving || !kbForm.topik.trim() || !kbForm.konten.trim()}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {kbSaving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + tambah button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchKb}
          onChange={(e) => setSearchKb(e.target.value)}
          placeholder="Cari topik knowledge base..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Topik
          </button>
        )}
      </div>

      {/* Tabel KB */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingKb ? (
          <div className="text-center text-gray-400 py-16 text-sm">Memuat knowledge base...</div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 600 }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Judul Topik</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell whitespace-nowrap">Diperbarui</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredKb.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-16 text-sm">
                      {kbList.length === 0 ? "Belum ada topik." : "Tidak ada topik yang sesuai."}
                    </td>
                  </tr>
                ) : (
                  filteredKb.map((item) => (
                    <tr key={item.topik} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-sm text-gray-800">{item.topik}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 whitespace-pre-wrap">{item.konten}</p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-xs text-gray-500 whitespace-nowrap">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleKbDelete(item.topik)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

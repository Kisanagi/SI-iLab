export default function KnowledgeBaseSection({
  kbList,
  loadingKb,
  kbForm,
  setKbForm,
  kbSaving,
  kbError,
  editingId,
  handleKbSubmit,
  handleKbEdit,
  handleKbDelete,
  handleKbCancel,
  kbFormRef,
}) {
  return (
    <div className="space-y-5 pb-4">
      {/* Form tambah/edit */}
      <div ref={kbFormRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={editingId
                ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                : "M12 4v16m8-8H4"}
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
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
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
          <div className="text-center text-gray-400 py-8 text-sm">Memuat knowledge base...</div>
        ) : kbList.length === 0 ? (
          <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-200 text-sm">
            Belum ada topik. Tambahkan topik pertama di atas.
          </div>
        ) : (
          <div className="space-y-2">
            {kbList.map((item) => (
              <div key={item.topik} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.topik}</p>
                    <p className="text-gray-500 text-sm mt-1 whitespace-pre-wrap">{item.konten}</p>
                    {item.updated_at && (
                      <p className="text-xs text-gray-300 mt-2">
                        Diupdate: {new Date(item.updated_at).toLocaleString("id-ID")}
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
  );
}

import { useState } from 'react';
import api from '../lib/api.js';

const STATUS_COLOR = {
  Menunggu: 'bg-gray-100 text-gray-600',
  Diproses: 'bg-blue-100 text-blue-700',
  Selesai: 'bg-green-100 text-green-700',
  Ditolak: 'bg-red-100 text-red-700',
};

export default function TicketCard({ ticket, onUpdated }) {
  const [status, setStatus] = useState(ticket.status);
  const [catatanAdmin, setCatatanAdmin] = useState(ticket.catatan_admin || '');
  const [catatanDraft, setCatatanDraft] = useState('');
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [catatanLoading, setCatatanLoading] = useState(false);
  const [catatanError, setCatatanError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  async function handleViewKrs() {
    try {
      const { data } = await api.get(`/tickets/${ticket.id}/krs`);
      window.open(data.url, '_blank');
    } catch {
      alert('File KRS tidak tersedia');
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/tickets/${ticket.id}`);
      onUpdated();
    } catch {
      alert('Gagal menghapus tiket');
    } finally {
      setShowConfirmDelete(false);
    }
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setStatusLoading(true);
    try {
      await api.patch(`/tickets/${ticket.id}`, { status: newStatus });
      onUpdated();
    } catch {
      alert('Gagal memperbarui status tiket');
      setStatus(ticket.status);
    } finally {
      setStatusLoading(false);
    }
  }

  function handleStartEdit() {
    setCatatanDraft(catatanAdmin);
    setCatatanError('');
    setIsEditingCatatan(true);
  }

  function handleCancelEdit() {
    setIsEditingCatatan(false);
    setCatatanDraft('');
    setCatatanError('');
  }

  async function handleSaveCatatan() {
    if (status === 'Ditolak' && !catatanDraft.trim()) {
      setCatatanError('Catatan wajib diisi saat menolak tiket.');
      return;
    }
    setCatatanLoading(true);
    setCatatanError('');
    try {
      await api.patch(`/tickets/${ticket.id}`, { status, catatan_admin: catatanDraft });
      setCatatanAdmin(catatanDraft);
      setIsEditingCatatan(false);
      setCatatanDraft('');
      onUpdated();
    } catch {
      alert('Gagal menyimpan catatan');
    } finally {
      setCatatanLoading(false);
    }
  }

  const detailEntries = ticket.detail ? Object.entries(ticket.detail) : [];

  const formattedDate = new Date(ticket.created_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

      {/* Modal konfirmasi hapus */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-2">Hapus Tiket?</h3>
            <p className="text-sm text-gray-500 mb-1">Tiket berikut akan dihapus permanen:</p>
            <p className="text-sm font-semibold text-gray-700 mb-4">
              {ticket.kode_tiket} — {ticket.judul}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{ticket.kode_tiket || `#${ticket.id.slice(0, 8)}`}</p>
          <h3 className="font-semibold text-gray-800">{ticket.judul}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {ticket.nama_mahasiswa} — {ticket.npm}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {ticket.kategori}
        </span>
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </div>

      {detailEntries.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detail</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {detailEntries.map(([key, val]) => (
              <div key={key} className="flex flex-col">
                <dt className="text-gray-500 capitalize text-xs">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-gray-800 font-medium text-sm break-words">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Catatan Admin */}
      <div className="mt-3 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Catatan Admin{status === 'Ditolak' && <span className="text-red-500 ml-1">*</span>}
          </label>
          {!isEditingCatatan && (
            <button
              onClick={handleStartEdit}
              className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {catatanAdmin ? 'Edit' : '+ Tambah Catatan'}
            </button>
          )}
        </div>

        {isEditingCatatan ? (
          <>
            <textarea
              value={catatanDraft}
              onChange={(e) => { setCatatanDraft(e.target.value); setCatatanError(''); }}
              placeholder={status === 'Ditolak' ? 'Wajib isi alasan penolakan...' : 'Tambahkan catatan untuk mahasiswa...'}
              rows={2}
              autoFocus
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                catatanError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-light'
              }`}
            />
            {catatanError && <p className="text-xs text-red-500 mt-1">{catatanError}</p>}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveCatatan}
                disabled={catatanLoading}
                className="text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                {catatanLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={catatanLoading}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </>
        ) : (
          <div className={`text-sm rounded-lg px-3 py-2 min-h-[38px] ${
            catatanAdmin
              ? 'bg-yellow-50 border border-yellow-200 text-gray-700'
              : 'bg-gray-50 border border-dashed border-gray-200 text-gray-400 italic'
          }`}>
            {catatanAdmin || 'Belum ada catatan.'}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-600 shrink-0">Ubah status:</label>
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={statusLoading}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-light disabled:opacity-60"
          >
            <option>Menunggu</option>
            <option>Diproses</option>
            <option>Selesai</option>
            <option>Ditolak</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {ticket.krs_url && (
            <button
              onClick={handleViewKrs}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              Lihat KRS
            </button>
          )}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Hapus tiket
          </button>
        </div>
      </div>
    </div>
  );
}

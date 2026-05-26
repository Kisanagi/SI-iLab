import { useState } from 'react';
import api from '../lib/api.js';

const STATUS_COLOR = {
  Menunggu: 'bg-gray-100 text-gray-600',
  Diproses: 'bg-blue-100 text-blue-700',
  Selesai: 'bg-green-100 text-green-700',
};

export default function TicketCard({ ticket, onUpdated }) {
  const [status, setStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);

  async function handleViewKrs() {
    try {
      const { data } = await api.get(`/tickets/${ticket.id}/krs`);
      window.open(data.url, '_blank');
    } catch {
      alert('File KRS tidak tersedia');
    }
  }

  async function handleDelete() {
    if (!confirm(`Hapus tiket "${ticket.judul}"?`)) return;
    try {
      await api.delete(`/tickets/${ticket.id}`);
      onUpdated();
    } catch {
      alert('Gagal menghapus tiket');
    }
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await api.patch(`/tickets/${ticket.id}`, { status: newStatus });
      setStatus(newStatus);
      onUpdated();
    } catch {
      alert('Gagal memperbarui status tiket');
    } finally {
      setLoading(false);
    }
  }

  const detailEntries = ticket.detail ? Object.entries(ticket.detail) : [];

  const formattedDate = new Date(ticket.created_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{ticket.kode_tiket || `#${ticket.id.slice(0, 8)}`}</p>
          <h3 className="font-semibold text-gray-800">{ticket.judul}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {ticket.nama_mahasiswa} — {ticket.npm}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[status]}`}>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 shrink-0">Ubah status:</label>
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={loading}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-light disabled:opacity-60"
          >
            <option>Menunggu</option>
            <option>Diproses</option>
            <option>Selesai</option>
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
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Hapus tiket
          </button>
        </div>
      </div>
    </div>
  );
}

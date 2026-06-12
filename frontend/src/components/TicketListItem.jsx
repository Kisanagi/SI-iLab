const STATUS_COLOR = {
  Menunggu: 'bg-gray-100 text-gray-600',
  Diproses: 'bg-blue-100 text-blue-700',
  Selesai: 'bg-green-100 text-green-700',
  Ditolak: 'bg-red-100 text-red-700',
};

export default function TicketListItem({ ticket, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors select-none ${
        isSelected
          ? 'bg-blue-50 border-l-2 border-l-primary'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs text-gray-400">{ticket.kode_tiket}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[ticket.status]}`}>
          {ticket.status}
        </span>
      </div>
      <p className="font-semibold text-sm text-gray-800 leading-snug truncate">{ticket.judul}</p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{ticket.nama_mahasiswa} — {ticket.npm}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ticket.kategori}</span>
        <span className="text-xs text-gray-300">
          {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}

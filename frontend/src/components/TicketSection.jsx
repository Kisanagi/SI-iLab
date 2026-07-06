import { STATUS_LIST, STATUS_COLOR } from "../lib/ticketStatus.js";

export default function TicketSection({
  tickets,
  loadingTickets,
  errorTickets,
  filteredTickets,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onSelectTicket,
  onDeleteTicket,
}) {
  return (
    <div>
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, NPM, atau kode tiket..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
        <div className="flex gap-2 flex-wrap">
          {["Semua", ...STATUS_LIST].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel */}
      {errorTickets && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          {errorTickets}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingTickets ? (
          <div className="text-center text-gray-400 py-16 text-sm">Memuat tiket...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Tiket</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Judul</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Pemohon</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell whitespace-nowrap">Kategori</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell whitespace-nowrap">Waktu</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-16 text-sm">
                      {tickets.length === 0 ? "Belum ada tiket masuk." : "Tidak ada tiket yang sesuai."}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">{ticket.kode_tiket}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-sm text-gray-800">{ticket.judul}</p>
                        {ticket.ringkasan && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ticket.ringkasan}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="text-sm font-medium text-gray-700 whitespace-nowrap">{ticket.nama_mahasiswa}</p>
                        <p className="text-xs text-gray-400">{ticket.npm}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {ticket.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-500 whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[ticket.status]}`}>
                            {ticket.status}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteTicket(ticket); }}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
                          >
                            Hapus
                          </button>
                        </div>
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

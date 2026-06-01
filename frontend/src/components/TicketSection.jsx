import TicketCard from "./TicketCard.jsx";

const STATUS_LIST = ["Menunggu", "Diproses", "Selesai", "Ditolak"];

// label = tampilan tombol, value = nilai kategori di database
const KATEGORI_OPTIONS = [
  { label: "Semua", value: "Semua" },
  { label: "Enrollment", value: "Enrollment" },
  { label: "Pengulangan", value: "Pendaftaran Pengulangan Praktikum" },
  { label: "Kendala Akun", value: "Kendala Akun" },
  { label: "Lainnya", value: "Lainnya" },
];

export default function TicketSection({
  tickets,
  loadingTickets,
  errorTickets,
  fetchTickets,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterKategori,
  setFilterKategori,
  filteredTickets,
}) {
  return (
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
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
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
          <div>
            <p className="text-xs text-gray-400 mb-1">Kategori</p>
            <div className="flex gap-2 flex-wrap">
              {KATEGORI_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilterKategori(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterKategori === value
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loadingTickets ? (
        <div className="text-center text-gray-400 py-16 text-sm">Memuat tiket...</div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
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
            <TicketCard key={ticket.id} ticket={ticket} onUpdated={fetchTickets} />
          ))}
        </div>
      )}
    </>
  );
}

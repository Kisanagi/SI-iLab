import TicketListItem from "./TicketListItem.jsx";

export default function TicketSection({
  tickets,
  loadingTickets,
  errorTickets,
  filteredTickets,
  selectedTicketId,
  onSelectTicket,
}) {
  if (loadingTickets) {
    return <div className="flex-1 text-center text-gray-400 py-16 text-sm">Memuat tiket...</div>;
  }

  if (errorTickets) {
    return (
      <div className="m-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
        {errorTickets}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="text-sm">Belum ada tiket masuk.</p>
      </div>
    );
  }

  if (filteredTickets.length === 0) {
    return (
      <div className="flex-1 text-center text-gray-400 py-16 text-sm">
        Tidak ada tiket yang sesuai.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredTickets.map((ticket) => (
        <TicketListItem
          key={ticket.id}
          ticket={ticket}
          isSelected={ticket.id === selectedTicketId}
          onClick={() => onSelectTicket(ticket.id)}
        />
      ))}
    </div>
  );
}

import { STAT_DOT, STAT_NUM } from "../lib/ticketStatus.js";

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, count }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAT_DOT[label]}`} />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
          <span className={`font-bold text-xl ${STAT_NUM[label]}`}>{count}</span>
        </div>
      ))}
    </div>
  );
}

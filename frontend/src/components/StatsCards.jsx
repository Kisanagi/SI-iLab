const STAT_STYLE = {
  Menunggu: { card: "border-gray-200", badge: "bg-gray-100 text-gray-500", num: "text-gray-700" },
  Diproses: { card: "border-blue-200", badge: "bg-blue-50 text-blue-500", num: "text-blue-600" },
  Selesai:  { card: "border-green-200", badge: "bg-green-50 text-green-500", num: "text-green-600" },
  Ditolak:  { card: "border-red-200", badge: "bg-red-50 text-red-500", num: "text-red-600" },
};

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 shrink-0">
      {stats.map(({ label, count }) => (
        <div
          key={label}
          className={`bg-white rounded-xl border ${STAT_STYLE[label].card} p-3 sm:p-4 shadow-sm flex flex-col items-center`}
        >
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${STAT_STYLE[label].badge}`}>
            {label}
          </span>
          <p className={`text-2xl sm:text-3xl font-bold ${STAT_STYLE[label].num}`}>
            {count}
          </p>
        </div>
      ))}
    </div>
  );
}

const STAT_DOT = {
  Menunggu: "bg-gray-400",
  Diproses: "bg-blue-500",
  Selesai: "bg-green-500",
  Ditolak: "bg-red-500",
};

const STAT_NUM = {
  Menunggu: "text-gray-700",
  Diproses: "text-blue-600",
  Selesai: "text-green-600",
  Ditolak: "text-red-600",
};

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

export default function ResultCard({ icon, label, value, unit, color = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</div>
        <div className={`text-xl font-bold ${color}`}>
          {value}
          <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  )
}

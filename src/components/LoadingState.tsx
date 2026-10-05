export default function LoadingState() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
      <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="h-10 w-10 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="glass-card p-6 space-y-3 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
        ))}
      </div>
    </div>
  )
}

import { AlertTriangle, RefreshCw, ServerOff } from 'lucide-react'

interface ErrorStateProps {
  message: string
  detail?: string
  onRetry?: () => void
}

export default function ErrorState({ message, detail, onRetry }: ErrorStateProps) {
  const isNotTrained = detail === 'not_trained' || message.includes('503') || message.includes('not_trained')

  if (isNotTrained) {
    return (
      <div className="glass-card p-8 flex flex-col items-center text-center gap-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ServerOff className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-1">Models not trained yet</h3>
          <p className="text-slate-400 text-sm max-w-md">
            The ML models haven't been trained. Run the following command from the backend directory to train:
          </p>
          <code className="mt-3 block bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-green-400 text-sm font-mono">
            python train.py
          </code>
          <p className="text-slate-500 text-xs mt-2">
            Or trigger training via <code className="text-blue-400">POST /api/train</code>
          </p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost">
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card p-8 flex flex-col items-center text-center gap-4 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-rose-400" />
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">Something went wrong</h3>
        <p className="text-slate-400 text-sm max-w-md">{message}</p>
        {detail && (
          <p className="text-slate-500 text-xs mt-1 font-mono">{detail}</p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  )
}

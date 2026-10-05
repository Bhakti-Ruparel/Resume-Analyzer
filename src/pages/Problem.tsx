import { useCallback, useState } from 'react'
import { HelpCircle, ArrowRight, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getProblem } from '../api/endpoints'
import SectionHeader from '../components/SectionHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { ProblemResponse } from '../types/api'

export default function Problem() {
  const { data, loading, error, refetch } = useApi(useCallback(() => getProblem(), []))
  const [whyOpen, setWhyOpen] = useState(false)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null
  if ('status' in data) return <ErrorState message="Backend not trained yet" detail="not_trained" onRetry={refetch} />

  const prob = data as ProblemResponse

  const pills = [
    { label: 'Task',               value: prob.task_type,       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Input',              value: prob.input,           color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'Output',             value: prob.output,          color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { label: 'Primary Evaluation', value: prob.primary_metric,  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        step="02"
        title={prob.title}
        subtitle="What exactly are we trying to solve, and why does it matter?"
        icon={<HelpCircle className="w-3.5 h-3.5" />}
      />

      {/* Info pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {pills.map((pill) => (
          <div key={pill.label} className={`glass-card p-4 border ${pill.color}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{pill.label}</div>
            <div className="text-sm font-medium">{pill.value}</div>
          </div>
        ))}
      </div>

      {/* Problem diagram */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-white font-semibold mb-4">The Classification Task</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Input */}
          <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">INPUT</div>
            <div className="text-slate-300 text-sm font-medium mb-1">Unstructured Resume Text</div>
            <div className="text-xs text-slate-500 font-mono bg-black/30 rounded p-2 mt-2 leading-relaxed">
              "{prob.example.input}"
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-gradient-to-b from-blue-500/10 to-purple-500/10 border border-white/10">
              <span className="text-xs text-slate-400 font-medium">NLP +</span>
              <span className="text-xs text-slate-400 font-medium">Machine Learning</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />
          </div>

          {/* Output */}
          <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">OUTPUT</div>
            <div className="text-slate-300 text-sm font-medium mb-1">Predicted Category</div>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25">
              <span className="text-green-400 font-bold text-sm">{prob.example.output}</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">1 of {prob.num_classes} categories</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-6">
        <p className="text-slate-300 leading-relaxed">{prob.description}</p>
      </div>

      {/* Why not accuracy */}
      <div className="glass-card border border-amber-500/20 bg-amber-500/5 overflow-hidden">
        <button
          className="w-full p-5 flex items-center justify-between text-left"
          onClick={() => setWhyOpen(!whyOpen)}
          aria-expanded={whyOpen}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 font-semibold text-sm">Why not accuracy alone?</span>
          </div>
          {whyOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {whyOpen && (
          <div className="px-5 pb-5 animate-slide-up">
            <p className="text-slate-300 text-sm leading-relaxed">{prob.metric_rationale}</p>
          </div>
        )}
      </div>

      {/* All categories */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">All {prob.num_classes} Categories</h3>
        <div className="flex flex-wrap gap-2">
          {prob.categories.map((cat) => (
            <span key={cat} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

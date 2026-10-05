import { useCallback } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle2, ArrowDown, Info } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getDataQuality } from '../api/endpoints'
import SectionHeader from '../components/SectionHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { DataQualityResponse } from '../types/api'

const PIPELINE_STEPS = [
  { label: 'Raw Dataset',       desc: 'Load CSV with all 2,484 rows',                            icon: '📂' },
  { label: 'Missing Text Check', desc: 'Find rows where Resume_str is NaN or empty',              icon: '🔍' },
  { label: 'Duplicate Check',   desc: 'Detect fully duplicate rows and duplicate resume texts',   icon: '🔁' },
  { label: 'Leakage Check',     desc: 'Identify Resume_html and ID as information-leaking columns', icon: '🚫' },
  { label: 'Clean Dataset',     desc: 'Drop problematic rows; exclude ID and Resume_html columns', icon: '✅' },
  { label: 'Training',          desc: 'Feed clean Resume_str + Category into the ML pipeline',    icon: '🚀' },
]

export default function DataQuality() {
  const { data, loading, error, refetch } = useApi(useCallback(() => getDataQuality(), []))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null
  if ('status' in data) return <ErrorState message="Backend not trained yet" detail="not_trained" onRetry={refetch} />

  const q = data as DataQualityResponse

  const metrics = [
    { label: 'Missing Resumes', value: q.missing_resumes,  isIssue: q.missing_resumes > 0 },
    { label: 'Duplicate Rows',  value: q.duplicate_rows,   isIssue: q.duplicate_rows > 0 },
    { label: 'Duplicate Texts', value: q.duplicate_texts,  isIssue: q.duplicate_texts > 0 },
    { label: 'Empty Resumes',   value: q.empty_resumes,    isIssue: q.empty_resumes > 0 },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        step="04"
        title="What problems did we find in the data?"
        subtitle="Before training any model, we audit the dataset for quality issues that could distort learning."
        icon={<ShieldCheck className="w-3.5 h-3.5" />}
      />

      {/* Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className={`glass-card p-5 border ${m.isIssue ? 'border-amber-500/25' : 'border-green-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {m.isIssue
                ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                : <CheckCircle2 className="w-4 h-4 text-green-400" />
              }
              <span className="text-xs text-slate-500">{m.label}</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${m.isIssue ? 'text-amber-400' : 'text-green-400'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Usable records */}
      <div className="glass-card p-5 flex items-center gap-4 border border-green-500/20 bg-green-500/5">
        <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-widest">Usable Records After Cleaning</div>
          <div className="text-4xl font-black text-green-400 tabular-nums">{q.usable_records.toLocaleString()}</div>
          <div className="text-slate-400 text-xs mt-0.5">Ready for training and evaluation</div>
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-6">Data Quality Pipeline</h2>
        <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-full">
              <div className="pipeline-step w-full animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="text-xl flex-shrink-0">{step.icon}</span>
                <div>
                  <div className="text-slate-200 text-sm font-medium">{step.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{step.desc}</div>
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowDown className="w-4 h-4 text-slate-700 my-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Callout cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-300 font-semibold text-sm mb-1">Important: Resume_html Leakage</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                <code className="text-amber-300">Resume_html</code> contains the exact same resume information formatted as HTML.
                Using it alongside <code className="text-blue-300">Resume_str</code> would introduce redundant features and artificially inflate performance — a form of data leakage.
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-300 font-semibold text-sm mb-1">Important: ID is Not a Feature</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                The <code className="text-blue-300">ID</code> column is an arbitrary numeric row identifier.
                Including it as a predictive feature would teach the model to memorize row numbers rather than learning language patterns — a classic overfitting trap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

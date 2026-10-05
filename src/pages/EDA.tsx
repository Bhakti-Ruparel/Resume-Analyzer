import { useCallback } from 'react'
import { BarChart2, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { useApi } from '../hooks/useApi'
import { getDatasetSummary, getEDA } from '../api/endpoints'
import SectionHeader from '../components/SectionHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { DatasetSummary, EDAResponse } from '../types/api'

export default function EDA() {
  const { data: ds, loading: dsLoading, error: dsError, refetch: dsRefetch } = useApi(useCallback(() => getDatasetSummary(), []))
  const { data: eda, loading: edaLoading, error: edaError, refetch: edaRefetch } = useApi(useCallback(() => getEDA(), []))

  const loading = dsLoading || edaLoading
  const error = dsError || edaError

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => { dsRefetch(); edaRefetch() }} />
  if (!ds || !eda) return null
  if ('status' in ds || 'status' in eda) return <ErrorState message="Backend not trained yet" detail="not_trained" />

  const dataset = ds as DatasetSummary
  const edaData = eda as EDAResponse

  // Class count bar data
  const classBarData = Object.entries(dataset.class_counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  const maxCount = Math.max(...classBarData.map((d) => d.count))
  const minCount = Math.min(...classBarData.map((d) => d.count))

  function getBarColor(count: number): string {
    if (count === minCount) return '#f59e0b'
    if (count <= minCount * 1.5) return '#f97316'
    if (count >= maxCount * 0.85) return '#10b981'
    return '#3b82f6'
  }

  // Word count bar data
  const wordCountData = Object.entries(edaData.word_count_by_class)
    .sort(([, a], [, b]) => b.mean - a.mean)
    .map(([name, wc]) => ({ name, min: wc.min, max: wc.max, mean: Math.round(wc.mean) }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111118] border border-white/10 rounded-lg p-3 text-xs shadow-xl">
          <p className="text-white font-semibold mb-1">{label}</p>
          {payload.map((p) => (
            <p key={p.name} className="text-slate-300">{p.name}: <span className="text-blue-300 font-mono">{p.value}</span></p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        step="05"
        title="Exploratory Data Analysis"
        subtitle="Understanding class distribution, text length, and vocabulary before choosing a model."
        icon={<BarChart2 className="w-3.5 h-3.5" />}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Imbalance Ratio</div>
          <div className="text-3xl font-bold text-amber-400">{dataset.imbalance_ratio}×</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Smallest Class</div>
          <div className="text-lg font-bold text-rose-400">{dataset.smallest_class}</div>
          <div className="text-slate-500 text-xs">{dataset.class_counts[dataset.smallest_class]} samples</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Largest Class</div>
          <div className="text-lg font-bold text-green-400">{dataset.largest_class}</div>
          <div className="text-slate-500 text-xs">{dataset.class_counts[dataset.largest_class]} samples</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Avg Words</div>
          <div className="text-3xl font-bold text-blue-400">{Math.round(dataset.avg_words)}</div>
        </div>
      </div>

      {/* Class distribution chart */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-1">Class Distribution</h2>
        <p className="text-slate-500 text-xs mb-5">
          <span className="text-amber-400">Amber/Orange</span> = minority classes (imbalanced) · <span className="text-green-400">Green</span> = majority classes
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={classBarData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Resumes" radius={[4, 4, 0, 0]}>
              {classBarData.map((entry) => (
                <Cell key={entry.name} fill={getBarColor(entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Word count by class */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-1">Word Count by Class (Mean)</h2>
        <p className="text-slate-500 text-xs mb-5">Average number of words per resume in each category</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={wordCountData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="mean" name="Avg Words" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Why imbalance matters */}
      <div className="glass-card p-6 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-300 font-semibold mb-2">Why Class Imbalance Matters</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              With a <strong className="text-amber-300">{dataset.imbalance_ratio}× imbalance</strong> between the largest and smallest classes,
              a naive model could achieve seemingly high accuracy by predicting only the majority classes.
              For example, if it always predicts <em>INFORMATION-TECHNOLOGY</em> it gets those right but fails on <em>BPO</em> entirely.
              <br /><br />
              This is why we use <strong className="text-amber-300">Macro-F1</strong> as the primary metric — it computes F1 for each class
              independently and takes the unweighted average, penalizing poor performance on minority classes equally.
              We also use <code className="text-amber-300 font-mono">class_weight='balanced'</code> in our classifiers to counteract the imbalance during training.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

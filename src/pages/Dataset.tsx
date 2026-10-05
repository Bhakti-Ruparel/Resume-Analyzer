import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Database, AlertTriangle, Info } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import NotAvailable from '../components/NotAvailable';
import { getEDA, getDataQuality } from '../api/endpoints';
import type { EDAResponse, DataQualityResponse } from '../types';

// Static fallback class list (for column info card)
const COLUMNS = [
  { name: 'ID',          status: 'EXCLUDED', reason: 'Identifier — no semantic meaning for prediction.',         color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { name: 'Resume_str',  status: 'USED',     reason: 'Primary resume text — main input feature.',                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Resume_html', status: 'EXCLUDED', reason: 'Redundant HTML version of Resume_str.',                    color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { name: 'Category',    status: 'TARGET',   reason: 'Ground-truth label — the class we are predicting.',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
];

const BAR_COLORS = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444',
  '#06b6d4','#84cc16','#f97316','#ec4899','#6366f1',
  '#14b8a6','#a855f7','#22c55e','#eab308','#3b82f6',
  '#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4',
  '#84cc16','#f97316','#ec4899','#6366f1',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="text-slate-400">{label}</div>
        <div className="text-white font-bold">{payload[0].value} resumes</div>
      </div>
    );
  }
  return null;
};

export default function Dataset() {
  const [eda, setEda] = useState<EDAResponse | null>(null);
  const [quality, setQuality] = useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEDA(), getDataQuality()]).then(([e, q]) => {
      setEda(e);
      setQuality(q);
      setLoading(false);
    });
  }, []);

  const classData = eda
    ? Object.entries(eda.class_distribution)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={2}
        title="Dataset & EDA"
        subtitle="Understanding the data before touching the model."
      />

      {/* Static summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <MetricCard value="2,484" label="Total Resumes" color="blue" icon={<Database className="w-5 h-5" />} />
        <MetricCard value="24"    label="Categories"    color="purple" />
        <MetricCard value="811"   label="Avg Words"     color="amber" sub="per resume" />
        <MetricCard value="5.45×" label="Imbalance Ratio" color="green" sub="largest ÷ smallest class" />
      </div>

      {/* Data Quality Scorecard */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-10">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Data Quality Report
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Missing Text',    value: quality?.missing_count    ?? 1,     warn: true },
            { label: 'Duplicate Rows',  value: quality?.duplicate_rows   ?? 0,     warn: false },
            { label: 'Duplicate Texts', value: quality?.duplicate_texts  ?? 2,     warn: true },
            { label: 'Empty Resumes',   value: quality?.empty_resumes    ?? 1,     warn: true },
            { label: 'Usable Records',  value: quality?.usable_records   ?? 2481,  warn: false },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[#0d0d14] border border-[#1e1e2e] p-4 text-center">
              <div className={`text-2xl font-bold tabular-nums ${item.warn && item.value > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {item.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          Resume_html was excluded — it contains the same content in HTML format and would introduce data redundancy.
        </div>
      </div>

      {/* Column decisions */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-10">
        <h2 className="text-base font-semibold text-white mb-5">Column Decisions</h2>
        <div className="space-y-3">
          {COLUMNS.map((col) => (
            <div key={col.name} className="flex items-center gap-4 rounded-xl bg-[#0d0d14] border border-[#1e1e2e] p-4">
              <code className="text-sm font-mono text-white w-28 flex-shrink-0">{col.name}</code>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex-shrink-0 ${col.color}`}>
                {col.status}
              </span>
              <span className="text-sm text-slate-400">{col.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class Distribution Chart */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-10">
        <h2 className="text-base font-semibold text-white mb-1">Class Distribution</h2>
        <p className="text-xs text-slate-500 mb-5">
          {loading ? 'Loading from backend…' : eda
            ? 'Live data from backend analysis.'
            : 'Static reference data (backend not running).'}
        </p>
        {loading ? (
          <div className="h-80 flex items-center justify-center text-slate-500 text-sm">Loading…</div>
        ) : classData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={classData} layout="vertical" margin={{ left: 90, right: 20, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={85} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {classData.map((_, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NotAvailable message="Class distribution not available — run python backend/data_analysis.py" />
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-[#0d0d14] border border-[#1e1e2e] p-3">
            <div className="text-lg font-bold text-blue-400">{eda ? Object.entries(eda.class_distribution).reduce((a,b) => a[1]>b[1]?a:b)[0] : 'IT / Biz Dev'}</div>
            <div className="text-xs text-slate-500">Largest class</div>
          </div>
          <div className="rounded-lg bg-[#0d0d14] border border-[#1e1e2e] p-3">
            <div className="text-lg font-bold text-amber-400">{eda ? Object.entries(eda.class_distribution).reduce((a,b) => a[1]<b[1]?a:b)[0] : 'BPO'}</div>
            <div className="text-xs text-slate-500">Smallest class</div>
          </div>
          <div className="rounded-lg bg-[#0d0d14] border border-[#1e1e2e] p-3">
            <div className="text-lg font-bold text-purple-400">5.45×</div>
            <div className="text-xs text-slate-500">Imbalance ratio</div>
          </div>
        </div>
      </div>

      {/* Length stats */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
        <h2 className="text-base font-semibold text-white mb-5">Resume Length Statistics</h2>
        {eda ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Words',    value: Math.round(eda.word_count_stats.avg) },
              { label: 'Median Words', value: Math.round(eda.word_count_stats.median) },
              { label: 'Min Words',    value: eda.word_count_stats.min },
              { label: 'Max Words',    value: eda.word_count_stats.max },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[#0d0d14] border border-[#1e1e2e] p-4 text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Words', value: 811 },
              { label: 'Max Words', value: 5190 },
              { label: 'Avg Chars', value: '6,295' },
              { label: 'Imbalance', value: '5.45×' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[#0d0d14] border border-[#1e1e2e] p-4 text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy, Info } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import NotAvailable from '../components/NotAvailable';
import { getEvaluation } from '../api/endpoints';
import type { EvaluationResponse } from '../types';

// Hardcoded fallback — exact metrics from training run
const STATIC_MODELS = [
  { name: 'Logistic Regression', shortName: 'LR',  accuracy: 0.6620, macroF1: 0.6169, key: 'lr',  color: '#3b82f6' },
  { name: 'LinearSVC',           shortName: 'SVC', accuracy: 0.6821, macroF1: 0.6335, key: 'svc', color: '#8b5cf6' },
  { name: 'Word2Vec + NN',       shortName: 'NN',  accuracy: 0.4869, macroF1: 0.4202, key: 'nn',  color: '#10b981' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }} className="font-bold">
            {p.name}: {Number(p.value).toFixed(4)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Evaluation() {
  const [liveData, setLiveData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvaluation().then((d) => { setLiveData(d); setLoading(false); });
  }, []);

  // Merge live + static
  const models = liveData
    ? liveData.models.map((m, i) => ({
        name: m.name,
        shortName: STATIC_MODELS[i]?.shortName ?? m.key.toUpperCase(),
        accuracy: m.accuracy,
        macroF1: m.macro_f1,
        key: m.key,
        color: STATIC_MODELS[i]?.color ?? '#3b82f6',
      }))
    : STATIC_MODELS;

  const bestKey = liveData?.best_model_key ?? 'svc';

  const chartData = models.map((m) => ({
    name: m.shortName,
    Accuracy: m.accuracy,
    'Macro-F1': m.macroF1,
    color: m.color,
  }));

  const radarData = models.map((m) => ({
    metric: m.shortName,
    Accuracy: +(m.accuracy * 100).toFixed(1),
    macroF1: +(m.macroF1 * 100).toFixed(1),
  }));
  void radarData; // reserved for future radar chart

  // Per-class F1 for best model
  const bestModel = liveData?.models.find((m) => m.key === bestKey);
  const perClassData = bestModel
    ? Object.entries(bestModel.per_class_f1)
        .map(([cat, f1]) => ({ cat, f1: +f1.toFixed(4) }))
        .sort((a, b) => b.f1 - a.f1)
    : [];

  // Confusion matrix
  const confMatrix = bestModel?.confusion_matrix ?? null;
  const classNames = bestModel?.class_names ?? [];

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={5}
        title="Model Evaluation"
        subtitle="Comparing all 3 models. Primary metric is Macro-F1 — equal weight to all 24 classes."
      />

      {/* Why Macro-F1 callout */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-8 text-sm">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-300 font-semibold">Why Macro-F1?</span>
          <span className="text-slate-300 ml-2">
            Accuracy rewards predicting frequent classes. With a 5.45× imbalance, a model that ignores BPO
            (22 samples) can still hit 68% accuracy. Macro-F1 averages F1 across all 24 classes equally — poor
            performance on minority classes cannot be hidden.
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-8">
        <h2 className="text-base font-semibold text-white mb-5">Model Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {['Model', 'Representation', 'Accuracy', 'Macro-F1', ''].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 font-semibold pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr
                  key={m.key}
                  className={`border-b border-[#1e1e2e] last:border-0 ${m.key === bestKey ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="py-3.5 pr-4 font-medium text-white">{m.name}</td>
                  <td className="py-3.5 pr-4 text-slate-400 text-xs font-mono">
                    {m.key === 'nn' ? 'Word2Vec (mean pool)' : 'TF-IDF (1–2 gram)'}
                  </td>
                  <td className="py-3.5 pr-4 tabular-nums text-white">{m.accuracy.toFixed(4)}</td>
                  <td className={`py-3.5 pr-4 tabular-nums font-bold ${m.key === bestKey ? 'text-amber-400' : 'text-white'}`}>
                    {m.macroF1.toFixed(4)}
                  </td>
                  <td className="py-3.5">
                    {m.key === bestKey && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Trophy className="w-3 h-3" /> BEST
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!liveData && (
          <p className="text-xs text-slate-600 mt-3">
            Showing hardcoded training results. Start backend to load live data.
          </p>
        )}
      </div>

      {/* Bar chart comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Accuracy Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ bottom: 0, top: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Accuracy" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={entry.name === (models.find(m=>m.key===bestKey)?.shortName) ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Macro-F1 Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ bottom: 0, top: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Macro-F1" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={entry.name === (models.find(m=>m.key===bestKey)?.shortName) ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best model card */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Best Model</h2>
        </div>
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <div className="text-2xl font-bold text-white">TF-IDF + LinearSVC</div>
            <div className="text-sm text-slate-400 mt-0.5">Selected on highest Macro-F1</div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 tabular-nums">0.6821</div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 tabular-nums">0.6335</div>
              <div className="text-xs text-slate-500">Macro-F1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-class F1 (live only) */}
      {perClassData.length > 0 && (
        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-8">
          <h2 className="text-sm font-semibold text-white mb-4">Per-Class F1 Score — Best Model</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perClassData} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <XAxis type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cat" tick={{ fill: '#94a3b8', fontSize: 10 }} width={95} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="f1" radius={[0, 4, 4, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confusion matrix (live only) */}
      {confMatrix && classNames.length > 0 ? (
        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Confusion Matrix — Best Model</h2>
          <p className="text-xs text-slate-500 mb-4">Rows = Actual, Columns = Predicted. Darker cell = more predictions.</p>
          <div className="overflow-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `80px repeat(${classNames.length}, 18px)` }}>
              {/* Header row */}
              <div />
              {classNames.map((c) => (
                <div key={c} className="text-[7px] text-slate-600 overflow-hidden" style={{ writingMode: 'vertical-rl', height: 60 }}>
                  {c.slice(0, 8)}
                </div>
              ))}
              {/* Data rows */}
              {confMatrix.flatMap((row, ri) => [
                <div key={`label-${ri}`} className="text-[8px] text-slate-400 flex items-center truncate pr-1">
                  {classNames[ri]?.slice(0, 10)}
                </div>,
                ...row.map((val, ci) => {
                  const max = Math.max(...row);
                  const intensity = max > 0 ? val / max : 0;
                  const bg = ri === ci
                    ? `rgba(139,92,246,${0.2 + intensity * 0.8})`
                    : `rgba(59,130,246,${intensity * 0.6})`;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className="w-[18px] h-[18px] rounded-[2px]"
                      style={{ background: bg }}
                      title={`${classNames[ri]} → ${classNames[ci]}: ${val}`}
                    />
                  );
                }),
              ])}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Confusion Matrix</h2>
          <NotAvailable message="Confusion matrix available after training — run python backend/train.py" />
        </div>
      )}
    </div>
  );
}

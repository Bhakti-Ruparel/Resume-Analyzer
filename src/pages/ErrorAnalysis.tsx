import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import NotAvailable from '../components/NotAvailable';
import { getErrors } from '../api/endpoints';
import type { ErrorAnalysisResponse, ErrorItem } from '../types';

const PAGE_SIZE = 10;

export default function ErrorAnalysis() {
  const [data, setData] = useState<ErrorAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ErrorItem | null>(null);

  useEffect(() => {
    getErrors().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <SectionHeader step={6} title="Error Analysis" subtitle="Where does the best model fail?" />
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-fade-in">
        <SectionHeader step={6} title="Error Analysis" subtitle="Where does the best model fail?" />
        <NotAvailable message="Error analysis not available — run python backend/train.py to generate error_analysis.json" />
      </div>
    );
  }

  const { errors, confusion_pairs } = data;
  const totalPages = Math.ceil(errors.length / PAGE_SIZE);
  const pageErrors = errors.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const errorRate = errors.length > 0 ? ((errors.length / 496) * 100).toFixed(1) : '–';
  const topPair = confusion_pairs[0];

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={6}
        title="Error Analysis"
        subtitle="Where does the best model (TF-IDF + LinearSVC) fail? 50 misclassified examples examined."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-[#111118] border border-[#1e1e2e] p-5 text-center">
          <div className="text-3xl font-bold text-red-400 tabular-nums">{errors.length}</div>
          <div className="text-xs text-slate-500 mt-1">Errors Analysed</div>
        </div>
        <div className="rounded-xl bg-[#111118] border border-[#1e1e2e] p-5 text-center">
          <div className="text-3xl font-bold text-amber-400 tabular-nums">~{errorRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Error Rate (sample)</div>
        </div>
        <div className="rounded-xl bg-[#111118] border border-[#1e1e2e] p-5 text-center">
          {topPair ? (
            <>
              <div className="text-sm font-bold text-white">{topPair.true}</div>
              <div className="text-xs text-slate-500 my-1">↔</div>
              <div className="text-sm font-bold text-white">{topPair.pred}</div>
              <div className="text-xs text-slate-500 mt-1">Most Confused Pair</div>
            </>
          ) : (
            <div className="text-slate-500 text-sm">—</div>
          )}
        </div>
      </div>

      {/* Top confusion pairs */}
      {confusion_pairs.length > 0 && (
        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-8">
          <h2 className="text-sm font-semibold text-white mb-4">Top Confusion Pairs</h2>
          <div className="space-y-2">
            {confusion_pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[#0d0d14] border border-[#1e1e2e] px-4 py-3">
                <span className="text-xs font-mono text-slate-600 w-5">{i + 1}</span>
                <span className="text-sm font-semibold text-white">{pair.true}</span>
                <ArrowRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{pair.pred}</span>
                <span className="ml-auto text-xs font-mono text-slate-400 bg-[#111118] border border-[#1e1e2e] px-2 py-0.5 rounded">
                  {pair.count}×
                </span>
                <div className="w-24 h-1.5 rounded-full bg-[#111118] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                    style={{ width: `${(pair.count / (confusion_pairs[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error table */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Misclassified Samples</h2>
          <div className="text-xs text-slate-500">Click any row for details</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {['Actual', 'Predicted', 'Confidence', 'Resume Snippet'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 font-semibold pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageErrors.map((err, i) => (
                <tr
                  key={i}
                  onClick={() => setSelected(err)}
                  className="border-b border-[#1e1e2e] last:border-0 cursor-pointer hover:bg-white/3 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="text-xs font-bold text-white bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      {err.true_label}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-bold text-white bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      {err.predicted_label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-300 text-xs">{(err.confidence * 100).toFixed(1)}%</td>
                  <td className="py-3 text-slate-400 text-xs truncate max-w-xs">{err.resume_snippet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e1e2e]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-500">Page {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Error Detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">Actual</span>
                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  {selected.true_label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">Predicted</span>
                <span className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                  {selected.predicted_label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">Confidence</span>
                <span className="text-sm font-bold text-white">{(selected.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">Resume Snippet</div>
                <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
                  {selected.resume_snippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

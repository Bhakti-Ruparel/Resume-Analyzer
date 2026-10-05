import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import SectionHeader from '../components/SectionHeader';
import { predictText, predictFile } from '../api/endpoints';
import type { PredictResponse } from '../types';

const STAGES = [
  'File received',
  'Text extracted',
  'Text preprocessed',
  'Features generated',
  'Model executed',
  'Prediction generated',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="text-slate-400">{label}</div>
        <div className="text-white font-bold">{(payload[0].value * 100).toFixed(1)}%</div>
      </div>
    );
  }
  return null;
};

export default function Predict() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const animateStages = async () => {
    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i);
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const runPrediction = async () => {
    if (!file && !text.trim()) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setStageIdx(-1);

    const stagePromise = animateStages();

    const res = file ? await predictFile(file) : await predictText(text);

    await stagePromise;

    if (res) {
      setResult(res);
    } else {
      setError('Prediction failed — make sure the backend is running (uvicorn backend.main:app --port 8000)');
    }
    setProcessing(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
  }, []);

  const chartData = result
    ? Object.entries(result.all_scores)
        .map(([cat, score]) => ({ cat, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    : [];

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={8}
        title="Predict Resume Category"
        subtitle="Upload a resume or paste text — the pipeline runs in real time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-150 p-10 text-center
              ${dragging
                ? 'border-blue-500 bg-blue-500/10'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-[#1e1e2e] hover:border-blue-500/40 hover:bg-white/3 bg-[#111118]'}`}
          >
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setError(null); setResult(null); }
              }}
            />
            {file ? (
              <>
                <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <div className="text-sm font-semibold text-white">{file.name}</div>
                <div className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                <div className="text-xs text-emerald-400 mt-2">Click to change file</div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <div className="text-sm font-semibold text-white">Drop your resume here</div>
                <div className="text-xs text-slate-500 mt-1">or click to browse</div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {['PDF', 'DOCX', 'TXT'].map((t) => (
                    <span key={t} className="text-[10px] font-mono text-slate-500 bg-[#0d0d14] border border-[#1e1e2e] px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e1e2e]" />
            <span className="text-xs text-slate-600">OR paste text</span>
            <div className="flex-1 h-px bg-[#1e1e2e]" />
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setFile(null); setError(null); setResult(null); }}
            placeholder="Paste resume text here..."
            rows={6}
            className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none font-mono scrollbar-thin"
          />

          {/* Submit */}
          <button
            onClick={runPrediction}
            disabled={processing || (!file && !text.trim())}
            className="w-full btn-primary py-3 text-base"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Zap className="w-4 h-4" /> Analyze Resume</>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="space-y-5">
          {/* Processing stages */}
          {(processing || result) && (
            <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Processing Pipeline</h3>
              <div className="space-y-2">
                {STAGES.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    {i <= stageIdx ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : i === stageIdx + 1 && processing ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#1e1e2e] flex-shrink-0" />
                    )}
                    <span className={`text-sm ${i <= stageIdx ? 'text-slate-200' : 'text-slate-600'}`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 text-center animate-slide-up">
                <div className="text-xs text-slate-500 mb-1">PREDICTED CATEGORY</div>
                <div className="text-3xl font-black text-gradient mb-3">{result.category}</div>
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-semibold px-4 py-1.5 rounded-full">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Probability chart */}
              {chartData.length > 0 && (
                <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 animate-slide-up">
                  <h3 className="text-sm font-semibold text-white mb-4">Top 10 Class Probabilities</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 90, right: 20, top: 4, bottom: 4 }}>
                      <XAxis type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="cat" tick={{ fill: '#94a3b8', fontSize: 10 }} width={85} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={i === 0 ? '#8b5cf6' : '#3b82f6'} opacity={i === 0 ? 1 : 0.5} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Placeholder when idle */}
          {!processing && !result && (
            <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-10 text-center">
              <Zap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Upload a resume and click "Analyze Resume" to see the prediction.</p>
              <p className="text-xs text-slate-600 mt-2">Requires the FastAPI backend to be running on port 8000.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Trophy, ArrowRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

const MODELS = [
  {
    id: 'lr',
    name: 'TF-IDF + Logistic Regression',
    family: 'Linear Classifier',
    repr: 'TF-IDF (1–2 gram, 50k features)',
    accuracy: 0.6620,
    macroF1: 0.6169,
    isBest: false,
    color: 'border-blue-500/30 bg-blue-500/5',
    accent: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    arch: ['TF-IDF Vector', 'LogReg (C=5.0)', '24 Classes'],
    why: 'Fast, interpretable baseline. class_weight="balanced" corrects for class imbalance. Outputs calibrated probabilities.',
    hyperparams: [
      { k: 'max_features', v: '50,000' },
      { k: 'ngram_range', v: '(1, 2)' },
      { k: 'C', v: '5.0' },
      { k: 'class_weight', v: 'balanced' },
      { k: 'solver', v: 'lbfgs' },
    ],
  },
  {
    id: 'svc',
    name: 'TF-IDF + LinearSVC',
    family: 'Support Vector Machine',
    repr: 'TF-IDF (1–2 gram, 50k features)',
    accuracy: 0.6821,
    macroF1: 0.6335,
    isBest: true,
    color: 'border-purple-500/40 bg-purple-500/5',
    accent: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    arch: ['TF-IDF Vector', 'LinearSVC (C=1.0)', '24 Classes'],
    why: 'Hinge loss + margin maximization consistently outperforms LR on text. class_weight="balanced" handles the 5.45× imbalance.',
    hyperparams: [
      { k: 'max_features', v: '50,000' },
      { k: 'ngram_range', v: '(1, 2)' },
      { k: 'C', v: '1.0' },
      { k: 'class_weight', v: 'balanced' },
      { k: 'max_iter', v: '2,000' },
    ],
  },
  {
    id: 'nn',
    name: 'Word2Vec + PyTorch NN',
    family: 'Deep Learning',
    repr: 'Word2Vec (mean pooling, dim=100)',
    accuracy: 0.4869,
    macroF1: 0.4202,
    isBest: false,
    color: 'border-emerald-500/30 bg-emerald-500/5',
    accent: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    arch: ['W2V Embedding', 'Mean Pooling', 'Dense(256)→ReLU→Drop', 'Dense(128)→ReLU→Drop', 'Softmax(24)'],
    why: 'Tests dense semantic representations. Mean pooling of 100-dim word vectors fed into a feedforward network. Underperforms TF-IDF on this domain-specific corpus.',
    hyperparams: [
      { k: 'vector_size', v: '100' },
      { k: 'window', v: '5' },
      { k: 'epochs', v: '30' },
      { k: 'dropout', v: '0.3' },
      { k: 'optimizer', v: 'Adam (lr=1e-3)' },
    ],
  },
];

export default function Models() {
  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={4}
        title="Model Comparison"
        subtitle="Three model families tested on the same 80/20 stratified split. Primary metric: Macro-F1."
      />

      {/* Model cards */}
      <div className="grid grid-cols-1 gap-6 mb-10">
        {MODELS.map((m) => (
          <div key={m.id} className={`rounded-2xl border p-6 relative ${m.color}`}>
            {m.isBest && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> BEST MODEL
              </div>
            )}

            <div className="flex items-start gap-4 mb-5">
              <div>
                <div className={`text-xs font-bold mb-1 ${m.badge.split(' ').slice(-1)[0]} px-2 py-0.5 rounded border inline-block ${m.badge}`}>
                  {m.family}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{m.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{m.repr}</p>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${m.isBest ? 'text-amber-400' : m.accent}`}>
                  {m.accuracy.toFixed(4)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Accuracy</div>
              </div>
              <div className="rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${m.isBest ? 'text-amber-400' : m.accent}`}>
                  {m.macroF1.toFixed(4)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Macro-F1 ✦ Primary</div>
              </div>
            </div>

            {/* Architecture flow */}
            <div className="mb-5">
              <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Architecture</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {m.arch.map((a, i) => (
                  <div key={a} className="flex items-center gap-1.5">
                    <span className="text-xs bg-[#0a0a0f] border border-[#1e1e2e] text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                      {a}
                    </span>
                    {i < m.arch.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Hyperparams */}
            <div className="mb-5">
              <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Key Hyperparameters</div>
              <div className="flex flex-wrap gap-2">
                {m.hyperparams.map((h) => (
                  <span key={h.k} className="text-xs bg-[#0a0a0f] border border-[#1e1e2e] text-slate-400 px-2 py-1 rounded-lg font-mono">
                    {h.k}={h.v}
                  </span>
                ))}
              </div>
            </div>

            {/* Why */}
            <div className={`rounded-lg border p-3 text-sm text-slate-300 leading-relaxed ${m.color}`}>
              <span className={`text-xs font-bold ${m.accent} block mb-1`}>WHY THIS MODEL?</span>
              {m.why}
            </div>
          </div>
        ))}
      </div>

      {/* Representation explanation */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6">
        <h2 className="text-base font-semibold text-white mb-4">Feature Representations Compared</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-5">
            <div className="text-sm font-bold text-blue-400 mb-2">TF-IDF</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sparse 50k-dimensional vector. Each dimension is a word or bigram weighted by its document frequency vs. corpus frequency. Captures statistical importance of domain-specific terms (e.g. "machine learning", "financial analysis").
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
            <div className="text-sm font-bold text-emerald-400 mb-2">Word2Vec (Mean Pooling)</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dense 100-dimensional vector per document. Each word maps to a learned embedding; the document vector is the average of its word embeddings. Captures semantic similarity, but mean pooling loses word order and weighting information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

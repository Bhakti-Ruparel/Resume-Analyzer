import { useCallback } from 'react'
import { Layers, CheckCircle2, XCircle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getFeatures } from '../api/endpoints'
import SectionHeader from '../components/SectionHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { FeaturesResponse } from '../types/api'

export default function Features() {
  const { data, loading, error, refetch } = useApi(useCallback(() => getFeatures(), []))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null
  if ('status' in data) return <ErrorState message="Backend not trained yet" detail="not_trained" onRetry={refetch} />

  const feat = data as FeaturesResponse

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        step="07"
        title="Feature Representations"
        subtitle="How raw text becomes numbers the model can learn from — and why we chose two very different approaches."
        icon={<Layers className="w-3.5 h-3.5" />}
      />

      {/* TF-IDF */}
      <div className="glass-card p-6 border border-blue-500/20 space-y-5">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-bold">
            APPROACH A
          </div>
          <h2 className="text-white font-bold text-lg">{feat.tfidf.name}</h2>
        </div>

        {/* Params */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'max_features', value: feat.tfidf.max_features.toLocaleString() },
            { label: 'ngram_range',  value: `(${feat.tfidf.ngram_range[0]}, ${feat.tfidf.ngram_range[1]})` },
            { label: 'sublinear_tf', value: feat.tfidf.sublinear_tf ? 'True' : 'False' },
          ].map((p) => (
            <div key={p.label} className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-slate-500 font-mono mb-0.5">{p.label}</div>
              <div className="text-blue-300 font-mono font-semibold text-sm">{p.value}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Why TF-IDF?</p>
          <p className="text-slate-300 text-sm leading-relaxed">{feat.tfidf.why_chosen}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pros</p>
            <ul className="space-y-1">
              {feat.tfidf.pros.map((p) => <li key={p} className="text-slate-400 text-xs flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs text-rose-400 font-semibold mb-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cons</p>
            <ul className="space-y-1">
              {feat.tfidf.cons.map((c) => <li key={c} className="text-slate-400 text-xs flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Word2Vec */}
      <div className="glass-card p-6 border border-purple-500/20 space-y-5">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-bold">
            APPROACH B
          </div>
          <h2 className="text-white font-bold text-lg">{feat.word2vec.name}</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'vector_size', value: String(feat.word2vec.vector_size) },
            { label: 'window',      value: String(feat.word2vec.window) },
            { label: 'min_count',   value: String(feat.word2vec.min_count) },
          ].map((p) => (
            <div key={p.label} className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-slate-500 font-mono mb-0.5">{p.label}</div>
              <div className="text-purple-300 font-mono font-semibold text-sm">{p.value}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Why Word2Vec?</p>
          <p className="text-slate-300 text-sm leading-relaxed">{feat.word2vec.why_chosen}</p>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Document Vector Method</p>
          <p className="text-slate-300 text-sm">{feat.word2vec.document_vector_method}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pros</p>
            <ul className="space-y-1">
              {feat.word2vec.pros.map((p) => <li key={p} className="text-slate-400 text-xs flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs text-rose-400 font-semibold mb-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cons</p>
            <ul className="space-y-1">
              {feat.word2vec.cons.map((c) => <li key={c} className="text-slate-400 text-xs flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* PyTorch NN Architecture */}
      <div className="glass-card p-6 border border-green-500/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-bold">
            NEURAL NET (B)
          </div>
          <h2 className="text-white font-bold text-lg">{feat.neural_network.name}</h2>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Why a Neural Network?</p>
          <p className="text-slate-300 text-sm leading-relaxed">{feat.neural_network.why_chosen}</p>
        </div>

        {/* Architecture diagram */}
        <div className="flex flex-wrap items-center gap-2 justify-center py-4">
          {[
            { label: `Linear(${feat.neural_network.input_size}, 256)`, color: 'bg-blue-500/15 border-blue-500/25 text-blue-300' },
            { label: 'ReLU', color: 'bg-white/5 border-white/10 text-slate-400', small: true },
            { label: `Dropout(${feat.neural_network.dropout})`, color: 'bg-white/5 border-white/10 text-slate-400', small: true },
            { label: 'Linear(256, 128)', color: 'bg-purple-500/15 border-purple-500/25 text-purple-300' },
            { label: 'ReLU', color: 'bg-white/5 border-white/10 text-slate-400', small: true },
            { label: `Dropout(${feat.neural_network.dropout})`, color: 'bg-white/5 border-white/10 text-slate-400', small: true },
            { label: `Linear(128, ${feat.neural_network.output_size})`, color: 'bg-green-500/15 border-green-500/25 text-green-300' },
          ].map((node, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${node.color}`}>
                {node.label}
              </div>
              {i < 6 && <span className="text-slate-600">→</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Optimizer', value: feat.neural_network.optimizer },
            { label: 'Loss',      value: feat.neural_network.loss },
            { label: 'Epochs',    value: String(feat.neural_network.epochs) },
          ].map((p) => (
            <div key={p.label} className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-slate-500 font-mono mb-0.5">{p.label}</div>
              <div className="text-green-300 font-mono font-semibold text-sm">{p.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold">TF-IDF vs Word2Vec — Side by Side</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-widest font-semibold">Property</th>
                <th className="text-left px-6 py-3 text-blue-400 text-xs uppercase tracking-widest font-semibold">TF-IDF</th>
                <th className="text-left px-6 py-3 text-purple-400 text-xs uppercase tracking-widest font-semibold">Word2Vec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                ['Type',            'Statistical',      'Neural / Learned'],
                ['Representation',  'Sparse (50k dims)','Dense (100 dims)'],
                ['Semantic Similarity', 'No',           'Yes'],
                ['Interpretable',   '✓ (weights)',      '✗ (embeddings)'],
                ['Training Speed',  'Very fast',        'Moderate'],
                ['OOV Handling',    'Ignored',          'Zero vector'],
                ['Best with',       'Linear classifiers','Neural networks'],
              ].map(([prop, tfidf, w2v]) => (
                <tr key={prop}>
                  <td className="px-6 py-3 text-slate-400 font-medium">{prop}</td>
                  <td className="px-6 py-3 text-slate-300">{tfidf}</td>
                  <td className="px-6 py-3 text-slate-300">{w2v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

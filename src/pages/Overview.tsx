import { FileText, Tag, Brain, Zap, ArrowDown, CheckCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';

const PIPELINE_STEPS = [
  'Raw Resume',
  'Data Cleaning',
  'Exploratory Analysis',
  'Text Preprocessing',
  'Feature Engineering',
  'Model Training',
  'Evaluation',
  'Best Model Selected',
  'Prediction',
];

const WHY_CARDS = [
  {
    title: 'Data-Driven',
    desc: 'We analyse the dataset thoroughly before selecting models — class distribution, length, vocabulary.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    title: 'Semantic + Statistical',
    desc: 'We compare TF-IDF (statistical) with Word2Vec (semantic) to find the best text representation.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    title: 'Evidence-Based',
    desc: 'Models are selected on Macro-F1, not accuracy, because the dataset has class imbalance.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function Overview() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative mb-12 rounded-2xl overflow-hidden border border-[#1e1e2e] bg-[#111118] p-10">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="absolute inset-0 bg-glow-purple pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
            <Zap className="w-3 h-3" />
            SAMATRIX HACKATHON 2026
          </div>
          <h1 className="text-5xl font-black text-gradient mb-3 leading-tight">
            ResumeForge
          </h1>
          <p className="text-xl text-slate-300 font-medium mb-2">
            AI-Powered Resume Classification Intelligence
          </p>
          <p className="text-slate-400 text-base max-w-xl">
            From <span className="text-white font-semibold">2,484 resumes</span> to{' '}
            <span className="text-white font-semibold">24 intelligent career categories</span> — using NLP, classical ML and deep learning.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            Best Macro-F1: <span className="font-bold ml-1">0.6335</span>
            <span className="text-slate-500 ml-1">— TF-IDF + LinearSVC</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <MetricCard value="2,484" label="Total Resumes" icon={<FileText className="w-5 h-5" />} color="blue" />
        <MetricCard value="24" label="Career Categories" icon={<Tag className="w-5 h-5" />} color="purple" />
        <MetricCard value="3" label="Models Compared" icon={<Brain className="w-5 h-5" />} color="amber" />
        <MetricCard value="0.6335" label="Best Macro-F1" icon={<Zap className="w-5 h-5" />} color="green" sub="TF-IDF + LinearSVC" />
      </div>

      {/* Pipeline */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-6">ML Pipeline Overview</h2>
        <div className="flex flex-col items-center gap-0">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center w-full max-w-sm">
              <div className={`w-full text-center px-5 py-3 rounded-xl border font-medium text-sm transition-all
                ${i === 7
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40 text-white'
                  : 'bg-[#111118] border-[#1e1e2e] text-slate-300'}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-xs font-mono text-slate-500 mr-2">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowDown className="w-4 h-4 text-slate-600 my-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Why cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-6">Why this approach?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY_CARDS.map((c) => (
            <div key={c.title} className={`rounded-xl border p-6 ${c.bg}`}>
              <div className={`text-sm font-bold mb-2 ${c.color}`}>{c.title}</div>
              <p className="text-slate-300 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

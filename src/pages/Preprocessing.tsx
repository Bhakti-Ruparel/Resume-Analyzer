import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

const STEPS = [
  {
    id: 1,
    name: 'Lowercase Normalization',
    why: 'Creates consistent token representations — "Python" and "PYTHON" become the same token "python", reducing vocabulary size without losing meaning.',
    before: 'Experienced Python Developer with AWS Expertise',
    after:  'experienced python developer with aws expertise',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 2,
    name: 'Remove URLs & Emails',
    why: 'URLs (https://linkedin.com/...) and email addresses carry no semantic meaning for job classification and add noise to the vocabulary.',
    before: 'Contact: john.doe@gmail.com — Portfolio: https://github.com/johndoe',
    after:  'Contact: — Portfolio:',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 3,
    name: 'HTML Tag Removal',
    why: 'Resume_str may contain residual HTML markup. Tags like <b>, <p>, <br> are structural, not semantic, and must be stripped before tokenization.',
    before: '<b>Skills:</b> <ul><li>Python</li><li>SQL</li></ul>',
    after:  'Skills:  Python SQL',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 4,
    name: 'Special Character Removal',
    why: 'Non-alphanumeric characters (except spaces) are removed. This normalizes punctuation and formatting differences across resumes.',
    before: 'B.Tech (C.S.E) — 8.7 CGPA | 2019–2023',
    after:  'btech cse 87 cgpa 20192023',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 5,
    name: 'Whitespace Normalization',
    why: 'Multiple consecutive spaces, tabs, and newlines collapse into a single space. This ensures consistent tokenization boundaries.',
    before: 'machine   learning    engineer\n\n  with  experience',
    after:  'machine learning engineer with experience',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 6,
    name: 'Tokenization',
    why: 'Text is split on whitespace into individual tokens — the unit of analysis for both TF-IDF vectorization and Word2Vec training.',
    before: 'experienced python developer aws sql',
    after:  "['experienced', 'python', 'developer', 'aws', 'sql']",
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
];

const TECH_TERMS = ['Python', 'C++', 'SQL', 'AWS', 'TensorFlow', 'Java', '.NET', 'NLP', 'Docker', 'React'];

function StepCard({ step, isOpen, onToggle }: {
  step: typeof STEPS[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${step.color}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.color}`}>
          {String(step.id).padStart(2, '0')}
        </span>
        <span className="font-semibold text-white flex-1">{step.name}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-white/10 pl-3">
            <span className="text-xs font-bold text-slate-500 block mb-1">WHY?</span>
            {step.why}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-mono text-red-400 mb-1.5">BEFORE</div>
              <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {step.before}
              </pre>
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-400 mb-1.5">AFTER</div>
              <pre className="bg-[#0a0a0f] border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {step.after}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Preprocessing() {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]));

  const toggle = (id: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={3}
        title="Text Preprocessing Pipeline"
        subtitle="Turning raw resume text into clean, model-ready input — the same pipeline runs during training AND prediction."
      />

      {/* Pipeline flow header */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {['Raw Resume', 'Lowercase', 'Remove URLs/Emails', 'Strip HTML', 'Remove Punct.', 'Normalize Space', 'Tokenize', 'Feature Vector'].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 bg-[#0d0d14] border border-[#1e1e2e] px-3 py-1.5 rounded-lg whitespace-nowrap">
                {s}
              </span>
              {i < arr.length - 1 && <span className="text-slate-600 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Expandable steps */}
      <div className="space-y-3 mb-10">
        {STEPS.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            isOpen={openSteps.has(step.id)}
            onToggle={() => toggle(step.id)}
          />
        ))}
      </div>

      {/* Technical term preservation */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Technical Term Preservation</h2>
        </div>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Technical terms are the primary discriminators between resume categories. The pipeline is designed to
          preserve them — <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded text-xs">c++</code> stays
          as <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded text-xs">c</code> after special
          char removal, but terms like Python, SQL, AWS survive intact as single-token features.
        </p>
        <div className="flex flex-wrap gap-2">
          {TECH_TERMS.map((t) => (
            <span key={t} className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

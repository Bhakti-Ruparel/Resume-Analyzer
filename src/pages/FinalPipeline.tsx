import { useState } from 'react';
import { ArrowDown, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';

const STEPS = [
  {
    step: 1,
    name: 'Resume Upload',
    icon: '📄',
    desc: 'Accept PDF, DOCX, or plain TXT file from the user.',
    what: 'The user uploads their resume in any supported format.',
    why: 'Resumes exist in multiple formats. Accepting all three maximises usability.',
    how: 'FastAPI UploadFile endpoint. PyPDF2 for PDF, python-docx for DOCX.',
  },
  {
    step: 2,
    name: 'Text Extraction',
    icon: '🔍',
    desc: 'Extract raw text content from the uploaded file.',
    what: 'Convert binary file bytes into a plain text string.',
    why: 'Models consume text — not binary formats.',
    how: 'PdfReader.extract_text() / Document().paragraphs / UTF-8 decode.',
  },
  {
    step: 3,
    name: 'Text Cleaning',
    icon: '🧹',
    desc: 'Lowercase, remove URLs/emails/HTML, normalize whitespace.',
    what: 'Apply the same preprocessing pipeline used during training.',
    why: 'The feature extractor was fitted on cleaned text. Inconsistent preprocessing causes distribution shift.',
    how: 'preprocessor.preprocess() — same function as train.py.',
  },
  {
    step: 4,
    name: 'TF-IDF Vectorization',
    icon: '🔢',
    desc: 'Convert cleaned text into a 50k-dimensional sparse vector.',
    what: 'Transform the text into a numerical representation.',
    why: 'ML models cannot consume raw strings. TF-IDF captures term importance across the corpus.',
    how: 'Fitted TfidfVectorizer loaded from lr_pipeline.pkl / svc_pipeline.pkl. Same vocabulary as training.',
  },
  {
    step: 5,
    name: 'LinearSVC Inference',
    icon: '🧠',
    desc: 'The trained SVM classifies the feature vector.',
    what: 'The best model predicts which of 24 classes this resume belongs to.',
    why: 'LinearSVC achieved Macro-F1 = 0.6335 — highest among the 3 models.',
    how: 'pipeline.predict() returns the class index. decision_function() gives confidence scores.',
  },
  {
    step: 6,
    name: 'Label Decoding',
    icon: '🏷️',
    desc: 'Map the numeric prediction back to a category name.',
    what: 'Convert integer class index → human-readable category string.',
    why: 'The model internally works with integers 0–23.',
    how: 'LabelEncoder.inverse_transform() loaded from label_encoder.pkl.',
  },
  {
    step: 7,
    name: 'Confidence Scoring',
    icon: '📊',
    desc: 'Compute probability scores for all 24 categories.',
    what: 'Quantify the model\'s certainty about its top prediction.',
    why: 'A confidence score helps users understand how decisive the prediction is.',
    how: 'Softmax over LinearSVC decision_function values gives approximate probabilities.',
  },
];

export default function FinalPipeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        step={7}
        title="Final Inference Pipeline"
        subtitle="From uploaded resume to predicted career category — every step explained."
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Pipeline steps */}
        <div className="flex-1 min-w-0">
          {STEPS.map((s, i) => (
            <div key={s.step}>
              <button
                onClick={() => setActiveStep(activeStep === s.step ? null : s.step)}
                className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 flex items-center gap-4
                  ${activeStep === s.step
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-[#111118] border-[#1e1e2e] hover:bg-white/5 hover:border-white/10'}`}
              >
                <span className="text-2xl flex-shrink-0 w-8 text-center">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600">STEP {s.step}</span>
                    <span className={`text-sm font-semibold ${activeStep === s.step ? 'text-blue-300' : 'text-white'}`}>
                      {s.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{s.desc}</div>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${activeStep === s.step ? 'rotate-90 text-blue-400' : 'text-slate-600'}`} />
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="w-4 h-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-6">
            {activeStep ? (
              (() => {
                const s = STEPS.find((x) => x.step === activeStep)!;
                return (
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 animate-fade-in">
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <div className="text-xs font-mono text-blue-400 mb-1">STEP {s.step}</div>
                    <h3 className="text-lg font-bold text-white mb-4">{s.name}</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="text-xs font-bold text-blue-400 mb-1">WHAT?</div>
                        <p className="text-slate-300 leading-relaxed">{s.what}</p>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-400 mb-1">WHY?</div>
                        <p className="text-slate-300 leading-relaxed">{s.why}</p>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-400 mb-1">HOW?</div>
                        <p className="text-slate-300 leading-relaxed">{s.how}</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 text-center">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm text-slate-500">Click any pipeline step to see its details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-white">Ready to try it?</div>
          <div className="text-sm text-slate-400 mt-0.5">Upload a resume and see the pipeline in action.</div>
        </div>
        <Link
          to="/predict"
          className="flex items-center gap-2 btn-primary"
        >
          <Zap className="w-4 h-4" />
          Predict Resume
        </Link>
      </div>
    </div>
  );
}

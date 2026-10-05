import type { AnalysisResult } from '../types/resume'

// ---------------------------------------------------------------------------
// Configuration — set via .env
// ---------------------------------------------------------------------------
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
const IS_DEMO  = import.meta.env.VITE_DEMO_MODE === 'true'

// ---------------------------------------------------------------------------
// Demo data — only used when VITE_DEMO_MODE=true
// Clearly isolated; never mixed with real API responses.
// ---------------------------------------------------------------------------
export const DEMO_DATA: AnalysisResult = {
  summary:
    'This candidate demonstrates strong full-stack development skills with notable experience in Python and JavaScript ecosystems. Communication and problem-solving strengths are evident throughout the project descriptions. Cloud and DevOps exposure is an area where the profile could be meaningfully strengthened.',
  score: 82,
  scoreMax: 100,
  scoreLabel: 'Strong',
  skills: [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'Machine Learning', 'NLP', 'SQL', 'Git', 'REST APIs', 'FastAPI',
  ],
  skillCategories: [
    { name: 'Programming',  skills: ['Python', 'JavaScript', 'TypeScript'] },
    { name: 'Frontend',     skills: ['React', 'HTML', 'CSS', 'Tailwind CSS'] },
    { name: 'AI / ML',      skills: ['Machine Learning', 'NLP', 'Scikit-learn', 'Pandas'] },
    { name: 'Backend',      skills: ['Node.js', 'FastAPI', 'REST APIs', 'SQL'] },
    { name: 'Tools',        skills: ['Git', 'VS Code', 'Postman', 'Linux'] },
  ],
  strengths: [
    'Strong programming fundamentals across multiple languages',
    'Demonstrated ML / NLP project experience with practical outcomes',
    'Clear, quantified writing in project and experience descriptions',
    'Breadth across frontend and backend development',
  ],
  weaknesses: [
    'Limited cloud platform experience (AWS / GCP / Azure)',
    'No containerisation experience (Docker / Kubernetes)',
    'Missing CI/CD pipeline references',
    'No open-source contributions or public GitHub profile mentioned',
  ],
  recommendations: [
    'Add an AWS or GCP certification to strengthen cloud credentials',
    'Mention Docker or Kubernetes usage in any relevant project',
    'Quantify impact with metrics — e.g. "reduced latency by 30%"',
    'Link to a GitHub profile or live demos directly in the resume',
    'Include a concise professional summary at the top of the resume',
  ],
  experience: [
    {
      company: 'Acme Corp',
      role: 'Software Engineer',
      duration: '2022 – Present',
      description:
        'Built and maintained REST APIs and ML pipelines for automated document processing, reducing manual review time by 40%.',
    },
    {
      company: 'StartupXYZ',
      role: 'Frontend Developer (Intern)',
      duration: '2021 – 2022',
      description:
        'Developed reusable React components and optimised bundle size, improving page load speed by 35%.',
    },
  ],
  education: [
    {
      institution: 'State University of Technology',
      degree: 'B.Tech',
      field: 'Computer Science & Engineering',
      year: '2022',
    },
  ],
}

// ---------------------------------------------------------------------------
// API options — extend as the PS becomes clearer
// ---------------------------------------------------------------------------
export interface AnalyzeOptions {
  /** For job-match PS variant: raw text of a job description */
  jobDescription?: string
}

// ---------------------------------------------------------------------------
// Core API call
// ---------------------------------------------------------------------------

/**
 * Send a resume file to the FastAPI backend for analysis.
 *
 * Endpoint: POST /api/analyze
 * Body:     multipart/form-data
 *   - file            : File (required)
 *   - job_description : string (optional, for matching tasks)
 *
 * Returns the raw JSON from the backend, typed as AnalysisResult.
 * All fields are optional — the UI handles partial responses gracefully.
 *
 * When VITE_DEMO_MODE=true, returns DEMO_DATA after a short delay
 * instead of calling the backend.
 */
export async function analyzeResume(
  file: File,
  options: AnalyzeOptions = {},
): Promise<AnalysisResult> {
  // ── Demo mode ─────────────────────────────────────────────────────────────
  if (IS_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 2800))
    return DEMO_DATA
  }

  // ── Real API ──────────────────────────────────────────────────────────────
  const form = new FormData()
  form.append('file', file)
  if (options.jobDescription) {
    form.append('job_description', options.jobDescription)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    })
  } catch {
    throw {
      message: 'Could not reach the analysis server',
      detail: `Make sure the backend is running at ${API_URL}`,
    }
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const json = await response.json()
      detail = json.detail ?? json.message ?? detail
    } catch { /* ignore */ }
    throw { message: 'Analysis failed', detail, status: response.status }
  }

  return response.json() as Promise<AnalysisResult>
}

/**
 * Lightweight health check — returns true if the backend responds 200.
 * Used by the Header to show the "AI Engine Ready" status dot.
 */
export async function healthCheck(): Promise<boolean> {
  if (IS_DEMO) return true
  try {
    const res = await fetch(`${API_URL}/api/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

export { IS_DEMO }

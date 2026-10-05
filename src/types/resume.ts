// ---------------------------------------------------------------------------
// resume.ts — Flexible API response types
//
// All fields are intentionally optional. The exact shape depends on the
// backend problem statement (not yet revealed). The UI degrades gracefully
// whether the backend returns one field or all of them.
// ---------------------------------------------------------------------------

export interface Skill {
  name: string
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category?: string
  score?: number
}

export interface SkillCategory {
  name: string
  skills: string[]
  color?: string
}

export interface JobMatch {
  title?: string
  company?: string
  score?: number          // 0–100
  matchedSkills?: string[]
  missingSkills?: string[]
  description?: string
}

export interface ExperienceEntry {
  company?: string
  role?: string
  duration?: string
  startDate?: string
  endDate?: string
  description?: string
  highlights?: string[]
}

export interface EducationEntry {
  institution?: string
  degree?: string
  field?: string
  year?: string
  gpa?: string
}

export interface AnalysisResult {
  // ── Core ──────────────────────────────────────────────────────────────────
  summary?: string
  score?: number          // e.g. 0–100
  scoreMax?: number       // defaults to 100
  scoreLabel?: string     // e.g. "Strong", "Average"

  // ── Skills ────────────────────────────────────────────────────────────────
  skills?: string[] | Skill[]
  skillCategories?: SkillCategory[]

  // ── Background ────────────────────────────────────────────────────────────
  experience?: ExperienceEntry[]
  education?: EducationEntry[]

  // ── Insights ──────────────────────────────────────────────────────────────
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]

  // ── Job Match (matching-type PS) ──────────────────────────────────────────
  jobMatch?: JobMatch
  matches?: JobMatch[]

  // ── Classification (classification-type PS) ───────────────────────────────
  category?: string
  categoryConfidence?: number   // 0–1

  // ── Ranking (ranking-type PS) ─────────────────────────────────────────────
  rank?: number
  rankTotal?: number

  // ── Pass-through ──────────────────────────────────────────────────────────
  metadata?: Record<string, unknown>
  rawData?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Application state types
// ---------------------------------------------------------------------------

export type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error'

export interface AnalysisStage {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
}

export interface ApiError {
  message: string
  detail?: string
  status?: number
}

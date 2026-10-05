import type { Skill } from '../types/resume'

/** Format raw bytes into a human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Normalise a skill entry — string or object — to its display name */
export function getSkillName(skill: string | Skill): string {
  return typeof skill === 'string' ? skill : skill.name
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Convert a 0–1 confidence value to a percentage string */
export function toPercent(value: number): string {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`
}

/** Derive a colour class from a 0–100 score */
export function scoreColorClass(score: number): { text: string; stroke: string; bar: string } {
  if (score >= 80) return { text: 'text-emerald-400', stroke: '#34d399', bar: 'bg-emerald-400' }
  if (score >= 60) return { text: 'text-amber-400',   stroke: '#fbbf24', bar: 'bg-amber-400'   }
  return              { text: 'text-red-400',          stroke: '#f87171', bar: 'bg-red-400'     }
}

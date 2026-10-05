# ResumeForge — AI Resume Intelligence

**SAMATRIX Hackathon 2026**

A modern, flexible Resume Intelligence Dashboard built with React + Vite + TypeScript + Tailwind CSS.  
Designed to connect to a FastAPI backend for AI-powered resume analysis.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

### Install & run

```bash
cd resume-forge
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

Create a `.env` file in the `resume-forge/` directory (copy from `.env.example`):

```env
# FastAPI backend URL
VITE_API_URL=http://localhost:8000

# Demo mode — set to true to skip the backend and use sample data
VITE_DEMO_MODE=false
```

### Demo mode

Set `VITE_DEMO_MODE=true` to run the full UI with built-in sample data.  
Demo results are always clearly labelled **"DEMO DATA"** — they are never mixed with real API responses.

---

## Connecting the FastAPI Backend

The frontend sends the resume to:

```
POST /api/analyze
Content-Type: multipart/form-data

Body fields:
  file             File     (required) — the resume file
  job_description  string   (optional) — for job-matching PS variants
```

The backend should return JSON. **All fields are optional** — the UI renders whatever is present and hides cards for missing data:

```jsonc
{
  "summary":            "string",
  "score":              82,
  "scoreMax":           100,
  "scoreLabel":         "Strong",
  "skills":             ["Python", "React", ...],
  "skillCategories":    [{ "name": "AI / ML", "skills": [...] }],
  "strengths":          ["..."],
  "weaknesses":         ["..."],
  "recommendations":    ["..."],
  "experience":         [{ "role": "...", "company": "...", "duration": "..." }],
  "education":          [{ "degree": "...", "institution": "...", "year": "..." }],
  "jobMatch":           { "score": 92, "matchedSkills": [...], "missingSkills": [...] },
  "category":           "Data Scientist",
  "categoryConfidence": 0.91
}
```

Other supported endpoints (prepare these in FastAPI as needed):

| Endpoint          | Method | Purpose                          |
|-------------------|--------|----------------------------------|
| `POST /api/analyze` | POST | Main analysis endpoint           |
| `POST /api/match`   | POST | Job description matching         |
| `POST /api/extract` | POST | Skill / entity extraction only   |
| `GET  /api/health`  | GET  | Health check (drives status dot) |

---

## Adapting the Result Schema (when the PS is released)

The app is built to adapt in minutes:

| What changed          | What to update                                           |
|-----------------------|----------------------------------------------------------|
| New response fields   | Add to `src/types/resume.ts`                             |
| New card needed       | Create `src/components/MyNewCard.tsx`, add to `ResultsDashboard.tsx` |
| Show/hide a section   | Toggle the guard in `ResultsDashboard.tsx`              |
| Different endpoint    | Change the URL/method in `src/services/api.ts`           |
| Extra upload input    | Add state + field in `src/pages/Home.tsx`, pass to `analyzeResume()` |

### PS variant examples

| Final PS               | Change needed                                         |
|------------------------|-------------------------------------------------------|
| Resume → Score         | Backend returns `score` + `summary` → already works  |
| Resume → Skill Extract | Backend returns `skills` / `skillCategories` → works |
| Resume → Job Match     | Backend returns `jobMatch` → `JobMatchCard` renders   |
| Resume → Classification| Backend returns `category` → `CategoryCard` renders  |
| Resume → Ranking       | Add `rank`/`rankTotal` to response + new card         |

---

## Project Structure

```
resume-forge/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Fixed top bar with status indicator
│   │   ├── ResumeUploader.tsx    # Drag-and-drop upload zone
│   │   ├── AnalysisLoader.tsx    # Animated stage-by-stage loader
│   │   ├── ResultsDashboard.tsx  # Orchestrates all result cards
│   │   ├── ScoreCard.tsx         # Circular score ring
│   │   ├── SummaryCard.tsx       # AI narrative summary
│   │   ├── SkillsCard.tsx        # Skill chips, optional categories
│   │   ├── StrengthsCard.tsx     # Strengths + areas to improve
│   │   ├── RecommendationsCard.tsx
│   │   ├── ExperienceCard.tsx
│   │   ├── EducationCard.tsx
│   │   ├── JobMatchCard.tsx      # Job match score + skill diff
│   │   ├── CategoryCard.tsx      # Classification result
│   │   └── ErrorCard.tsx         # Error state with retry
│   ├── pages/
│   │   └── Home.tsx              # Main page — manages upload/analysis state
│   ├── services/
│   │   ├── api.ts                # Core API calls + demo data
│   │   └── resumeApi.ts          # Re-exports (add future endpoints here)
│   ├── types/
│   │   └── resume.ts             # All TypeScript types (flexible, optional fields)
│   ├── utils/
│   │   └── format.ts             # File size, colour helpers
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                 # Tailwind + custom utilities
├── .env                          # Local environment (gitignored)
├── .env.example                  # Template to share with team
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Build

```bash
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview the production build locally
```

---

## Tech Stack

| Layer     | Choice                        |
|-----------|-------------------------------|
| Framework | React 18 + TypeScript         |
| Bundler   | Vite 5                        |
| Styling   | Tailwind CSS 3                |
| Icons     | Lucide React                  |
| Utilities | clsx                          |
| Backend   | FastAPI (separate repo/server)|

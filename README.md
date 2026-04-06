# TalentAI — Umurava AI Hackathon Frontend

> AI-powered talent screening dashboard built for the Umurava AI Hackathon.
> Theme: *"An innovation challenge to build AI Products for the Human Resources Industry"*

---

## 🧠 What It Does

TalentAI is a recruiter-facing web application that:
- Accepts job postings (manual entry or Umurava platform profiles)
- Ingests applicants via structured talent profiles, CSV uploads, or PDF resumes
- Triggers Gemini-powered AI screening across all candidates at once
- Returns a ranked shortlist (Top 10 or Top 20) with per-candidate reasoning
- Lets recruiters compare top candidates side-by-side
- Keeps humans in control — AI shortlists, humans decide

---

## 🏗️ Architecture

```
talentai-frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── dashboard/              # Overview + job list
│   │   ├── jobs/
│   │   │   ├── new/                # Create job + AI skill suggestions
│   │   │   └── [id]/
│   │   │       ├── applicants/     # Applicant ingestion per job
│   │   │       └── shortlist/      # Ranked shortlist + AI reasoning
│   │   ├── upload/                 # CSV / PDF upload with preview
│   │   └── compare/                # Side-by-side candidate comparison
│   │
│   ├── components/
│   │   ├── layout/                 # Sidebar, Topbar
│   │   ├── ui/                     # StatCard, ScoreBadge, ScoreBar, etc.
│   │   ├── jobs/                   # JobCard
│   │   ├── applicants/             # ApplicantRow, UploadDropzone
│   │   └── screening/              # CandidateCard, ScreeningOverlay
│   │
│   └── lib/
│       ├── store/                  # Redux store configuration
│       ├── slices/                 # jobsSlice, screeningSlice, applicantsSlice
│       ├── hooks/                  # useAppDispatch, useAppSelector
│       ├── types/                  # All TypeScript interfaces
│       └── utils/                  # api.ts (axios), helpers.ts
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Redux Toolkit |
| HTTP | Axios |
| File Parsing | PapaParse (CSV) |
| UI Icons | Lucide React |
| Charts | Recharts |
| Notifications | React Hot Toast |
| Hosting | Vercel |

---

## ⚡ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_ORG/talentai-frontend.git
cd talentai-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `GEMINI_API_KEY` | ✅ | Gemini API key (server-side only) |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Display name (default: TalentAI) |

---

## 📡 Backend API Contract

The frontend expects the following endpoints from the backend team:

```
GET    /api/jobs                     → List all jobs
POST   /api/jobs                     → Create a job
GET    /api/jobs/:id                 → Get single job
PUT    /api/jobs/:id                 → Update job

GET    /api/applicants?jobId=:id     → List applicants by job
POST   /api/applicants/upload-csv    → Upload CSV (multipart)

POST   /api/screening/run/:jobId     → Trigger AI screening
GET    /api/screening/shortlist/:id  → Get screening results
```

---

## 🤖 AI Decision Flow

```
1. Recruiter creates a job with title, skills, experience requirements
2. Applicants are ingested (structured profiles OR CSV/PDF uploads)
3. Recruiter triggers screening → backend sends all profiles + job to Gemini
4. Gemini evaluates each candidate on 4 weighted dimensions:
     - Skills match      (40% weight)
     - Experience        (30% weight)
     - Education         (15% weight)
     - Role relevance    (15% weight)
5. Each candidate receives a 0–100 composite score
6. Top 10/20 are returned with natural-language reasoning:
     - Strengths
     - Gaps / Risks
     - Final recommendation (Strongly recommend / Recommend / Consider / Low match)
7. Recruiter reviews shortlist and makes final hiring decision
```

> **Human-in-the-loop**: The AI ranks and reasons, but all final decisions belong to the recruiter.

---

## 🎯 Key Features

- **Live screening animation** — visual log as Gemini processes each candidate
- **Expandable candidate cards** — score breakdown bars + strengths/gaps inline
- **Smart job brief builder** — AI suggests required skills from job title
- **CSV upload preview** — parsed candidates shown before triggering AI
- **Side-by-side comparison** — compare top 3 candidates across all dimensions
- **Color-coded scoring** — green (80+) / amber (65–79) / red (<65) everywhere

---

## 👥 Team

| Role | Responsibility |
|---|---|
| Frontend Engineer | This repo — recruiter UI, upload, shortlist visualization |
| Backend Engineer | Node.js API, MongoDB, data ingestion pipelines |
| AI Engineer | Gemini prompt design, scoring logic, explainability |

---

## ⚠️ Assumptions & Limitations

- Gemini API key must be kept server-side — never expose in frontend
- CSV uploads expect columns: `name, email, currentRole, yearsOfExperience, skills`
- AI reasoning is non-deterministic — same candidates may rank slightly differently on re-runs
- Shortlist size is configurable (10 or 20) via backend parameter

---

## 📦 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables → add NEXT_PUBLIC_API_URL, GEMINI_API_KEY
```

---

*Built for the Umurava AI Hackathon · April 2026*

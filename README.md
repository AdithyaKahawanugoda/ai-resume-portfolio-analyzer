# AI Resume & Portfolio Analyzer

A full-stack SaaS-style web app that analyzes resumes against a target job role using Claude AI, returning structured ATS scores, skill gap analysis, and an optimized rewrite.

**Stack:** Next.js 16 (App Router) · Tailwind CSS · Prisma 7 · PostgreSQL · Anthropic Claude (`claude-sonnet-4-6`)

---

## Features

- Upload a resume as **PDF or DOCX** — text is extracted server-side and stored in PostgreSQL
- **Type any target role** — free-text input accepts any title ("Staff SRE", "Senior iOS Developer", etc.); popular roles available as one-click chips
- Optionally **paste a job description** — Claude scores your resume against the exact keywords and requirements from the posting instead of generic role expectations
- Claude analyzes the resume and returns structured JSON including:
  - ATS score (0–100) with a breakdown across 6 dimensions
  - **JD match score** (when JD provided) — how closely your resume matches the specific posting
  - **JD keywords missing** — terms from the job posting absent from your resume
  - Detected skills and missing skills for the selected role
  - Actionable improvement suggestions
  - Role-fit scores across 5 engineering tracks
  - 8–10 role-specific technical interview questions
  - A full ATS-optimized resume rewrite
- Results are stored in PostgreSQL (JSONB) and served at a permanent URL — each resume can have multiple analyses for different roles or job postings

---

## Live Demo

**Production URL:** https://resume-analyzer-eight-henna.vercel.app

Deployed on Vercel (Washington D.C. / `iad1` region) with a Neon serverless PostgreSQL database (Sydney / `ap-southeast-2` region).

---

## Deployment

### Infrastructure

| Layer | Service |
|-------|---------|
| Hosting | Vercel (serverless, Edge Network CDN) |
| Database | Neon serverless PostgreSQL (`ap-southeast-2.aws.neon.tech`) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| ORM | Prisma 7 with `@prisma/adapter-pg` driver adapter |

### How it works

The `npm run build` script is:

```json
"build": "prisma migrate deploy && next build"
```

On every Vercel deployment, `prisma migrate deploy` runs first — it applies any pending migrations from `prisma/migrations/` to the Neon database before the Next.js build starts. This means schema changes are always in sync with the deployed code.

### Environment variables

Set these in the Vercel project dashboard (Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Neon pooled connection string (used by the app at runtime) |
| `POSTGRES_URL_NON_POOLING` | Neon direct connection string (used by `prisma migrate deploy` at build time) |
| `ANTHROPIC_API_KEY` | Anthropic API key |

Neon provides both URLs when you create a database. The pooled URL goes through Neon's connection pooler (pgBouncer) — appropriate for serverless functions that open many short-lived connections. The non-pooling URL is a direct TCP connection, required for migrations which use advisory locks that don't work through a pooler.

### Connection routing in code

`prisma.config.ts` (migrations):
```ts
datasource: {
  url: process.env["POSTGRES_URL_NON_POOLING"] ?? process.env["DATABASE_URL"],
}
```

`src/lib/prisma.ts` (runtime):
```ts
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
```

`DATABASE_URL` is the fallback for local development.

### Deploy from CLI

```bash
# One-time: link project and add env vars via Vercel dashboard, then pull locally
vercel env pull .env.local

# Deploy to production
vercel --prod
```

### Local development against Neon

After pulling env vars (`vercel env pull .env.local`), Next.js picks up `.env.local` automatically. You can develop locally against the Neon database without any local PostgreSQL installation.

To run against a local PostgreSQL instead, set `DATABASE_URL` in `.env` (`.env.local` takes precedence so Neon vars won't interfere).

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally **or** Docker

### 2. Clone and install

```bash
git clone <repo>
cd resume-analyzer
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in both values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/resume_analyzer"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name resume-analyzer-db \
  -e POSTGRES_USER=resumeai \
  -e POSTGRES_PASSWORD=resumeai123 \
  -e POSTGRES_DB=resume_analyzer \
  -p 5432:5432 \
  postgres:16-alpine
```

Then set `DATABASE_URL="postgresql://resumeai:resumeai123@localhost:5432/resume_analyzer"` in `.env`.

### 5. Run migrations

```bash
npx prisma migrate dev --name init
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/upload` | Accepts `multipart/form-data` with a `resume` file field. Extracts text (pdf-parse / mammoth) and stores in `resumes` table. Returns `{ resumeId }`. |
| `POST` | `/api/analyze` | Accepts `{ resumeId, jobRole }`. Calls Claude API, parses JSON response, stores in `analysis_sessions`. Returns `{ sessionId }`. |
| `GET`  | `/api/results/[id]` | Returns the full stored analysis for a session, including the linked resume metadata. |

---

## Database Schema

```
resumes
  id              cuid (PK)
  filename        text
  rawText         text
  createdAt       timestamp

analysis_sessions
  id              cuid (PK)
  resumeId        FK → resumes.id
  jobRole         text
  jobDescription  text?        ← nullable; populated when JD is pasted
  aiOutput        jsonb        ← flexible; schema-free AI output
  createdAt       timestamp
```

`aiOutput` is JSONB so future changes to the Claude output format (new fields, nested objects) require no migrations.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # 3-step upload wizard (client component)
│   ├── results/[id]/page.tsx     # Analysis dashboard (server component)
│   └── api/
│       ├── upload/route.ts
│       ├── analyze/route.ts
│       └── results/[id]/route.ts
├── components/
│   ├── ATSScore.tsx              # Circular SVG gauge
│   ├── ATSBreakdown.tsx          # 6-metric progress bars
│   ├── RoleFitScores.tsx         # Role comparison bars
│   ├── SkillTags.tsx             # Detected / missing skill chips
│   └── InterviewQuestions.tsx   # Numbered question list
└── lib/
    ├── anthropic.ts              # server-only Claude client + prompt builder
    ├── constants.ts              # JOB_ROLES (safe for client import)
    └── prisma.ts                 # Prisma singleton with pg adapter
```

---

## Implementation Notes

### Prisma 7 breaking changes

Prisma 7 removed `url` from the datasource block in `schema.prisma`. Connection URLs now live exclusively in `prisma.config.ts`. The client also requires an explicit database adapter:

```ts
// lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const client = new PrismaClient({ adapter });
```

The generated client is output to `src/generated/prisma/` and imported as `@/generated/prisma/client`.

### Next.js 16 — params is a Promise

In Next.js 15+, dynamic route params are `Promise<{ id: string }>` and must be awaited:

```ts
export async function GET(_req, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Server-only split

`lib/anthropic.ts` starts with `import "server-only"`. This prevents the Anthropic SDK (which uses Node.js-only modules) from leaking into the client bundle. `JOB_ROLES` is in a separate `lib/constants.ts` so the upload page can import it safely.

### pdf-parse v1 in Next.js (Turbopack)

`pdf-parse@2.x` (the current npm default) is a browser-first rewrite that requires a PDF.js web worker — incompatible with Next.js server routes. Pin to `pdf-parse@1.1.1`. Additionally, v1 tries to load a test fixture at module-evaluation time when bundled by Turbopack, which causes an ENOENT crash. Fix: add it to `serverExternalPackages` so it's required natively instead of bundled:

```ts
// next.config.ts
const nextConfig = {
  serverExternalPackages: ["pdf-parse"],
};
```

### Claude JSON enforcement

The prompt explicitly instructs: *"Return ONLY valid JSON. Do not include markdown, explanations, or extra text."* The response is still defensively parsed by finding the first `{` and last `}` in the text before calling `JSON.parse`, guarding against any stray characters Claude might prepend or append.

---

## Extending the App

The JSONB `aiOutput` column makes the schema forward-compatible. Ideas for future iterations:

- **GitHub portfolio analysis** — fetch repos and factor in commit history
- **Multiple AI runs** — compare analyses across roles or postings side-by-side
- **Authentication** — add NextAuth to tie analyses to user accounts
- **Export** — download the rewritten resume as a DOCX or PDF
- **JD history** — re-run the same resume against multiple job postings and track score trends

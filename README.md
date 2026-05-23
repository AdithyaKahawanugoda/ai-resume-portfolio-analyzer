# AI Resume & Portfolio Analyzer

A full-stack SaaS-style web app that analyzes resumes against a target job role using Claude AI, returning structured ATS scores, skill gap analysis, and an optimized rewrite.

**Stack:** Next.js 16 (App Router) · Tailwind CSS · Prisma 7 · PostgreSQL · Anthropic Claude (`claude-sonnet-4-6`)

---

## Features

- Upload a resume as **PDF or DOCX** — text is extracted server-side and stored in PostgreSQL
- Select a **target job role** (Frontend, Backend, Full Stack, DevOps, etc.)
- Claude analyzes the resume and returns structured JSON including:
  - ATS score (0–100) with a breakdown across 6 dimensions
  - Detected skills and missing skills for the selected role
  - Actionable improvement suggestions
  - Role-fit scores across 5 engineering tracks
  - 8–10 role-specific technical interview questions
  - A full ATS-optimized resume rewrite
- Results are stored in PostgreSQL (JSONB) and served at a permanent URL — each resume can have multiple analyses for different roles

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
  id          cuid (PK)
  filename    text
  rawText     text
  createdAt   timestamp

analysis_sessions
  id          cuid (PK)
  resumeId    FK → resumes.id
  jobRole     text
  aiOutput    jsonb        ← flexible; schema-free AI output
  createdAt   timestamp
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

- **Job description comparison** — paste a JD and re-score against it
- **GitHub portfolio analysis** — fetch repos and factor in commit history
- **Multiple AI runs** — compare analyses across roles side-by-side
- **Authentication** — add NextAuth to tie analyses to user accounts
- **Export** — download the rewritten resume as a DOCX or PDF

# ResumeLens — Setup Guide

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenRouter](https://openrouter.ai) API key

---

## 1. Install dependencies
```bash
npm install
```

## 2. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same page (anon/public key)
- `SUPABASE_SERVICE_ROLE_KEY` — same page (service_role key — keep secret)
- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` for dev

## 3. Set up the database
In your Supabase dashboard → SQL Editor → paste and run `supabase/schema.sql`.

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel
```bash
npx vercel --prod
```
Set the same environment variables in the Vercel dashboard (Project → Settings → Environment Variables).

Vercel auto-detects Next.js; no extra config needed.

---

## Architecture overview

```
User browser
  │
  ├── POST /api/upload        (multipart, PDF/DOCX → text extraction → Supabase)
  │        ↓
  │   resume_uploads table (expires in 2h)
  │
  └── POST /api/trpc/resume.analyze  (tRPC mutation)
           ↓ check rate_limit_events
           ↓ insert leads
           ↓ fetch resume text
           ↓ POST openrouter.ai (3-model fallback chain)
           ↓ insert analyses
           → return scores to client
```

## Model fallback chain
1. `anthropic/claude-3-5-haiku` — fast, accurate
2. `openai/gpt-4o-mini` — fallback
3. `google/gemini-flash-1.5-8b` — last resort

OpenRouter automatically tries the next model if one fails or is overloaded.

## Rate limiting
- 3 analyses per IP per hour (configurable via `RATE_LIMIT_MAX` env var)
- Stored in `rate_limit_events` table — no Redis needed

## Security
- All database access via service role key (server-only)
- RLS enabled on all tables (no direct client access)
- File type validated by MIME type + server-side parsing (not just extension)
- Resume text capped at 50,000 characters
- CORS locked to same origin in production
- Security headers (CSP, X-Frame-Options, etc.) via next.config.ts

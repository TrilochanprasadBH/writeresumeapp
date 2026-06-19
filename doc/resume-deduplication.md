# Resume Deduplication Flow

## Problem

If the same user uploads the same resume twice, the AI (OpenRouter) is called each time.
Because LLMs are non-deterministic, two calls on the same resume can return slightly different
scores — which is confusing for users and wastes money.

## Solution

Hash the resume text (SHA-256) at upload time and use it as a cache key against the `analyses`
table. If a prior analysis exists for that hash, return its scores directly without calling the AI.

---

## Database Changes

### `resume_uploads`
| Column | Type | Purpose |
|---|---|---|
| `content_hash` | `TEXT NOT NULL DEFAULT ''` | SHA-256 of extracted resume text |

### `analyses`
| Column | Type | Purpose |
|---|---|---|
| `content_hash` | `TEXT` | SHA-256 copied from the upload; used for cache lookup |
| `served_from_cache` | `BOOLEAN NOT NULL DEFAULT FALSE` | True when scores were copied from a prior analysis |

### Index
```sql
CREATE INDEX idx_analyses_content_hash ON analyses (content_hash);
```

---

## Flow: First Upload (new resume)

```
User uploads file
  → /api/upload extracts text
  → SHA-256 hash computed from text
  → Row inserted into resume_uploads (with content_hash)
  → uploadId returned to client

User submits contact form
  → resume.analyze mutation called
  → resume_uploads row fetched (includes content_hash)
  → analyses queried by content_hash → NO MATCH
  → Lead saved to leads table
  → Rate limit event recorded
  → OpenRouter called → scores returned
  → analyses row inserted (served_from_cache = false)
  → resume_uploads row deleted
  → Scores returned to user
```

## Flow: Same Resume Uploaded Again

```
User uploads same file (any user)
  → Same text extracted → same SHA-256 hash
  → New row inserted into resume_uploads

User submits contact form
  → resume.analyze mutation called
  → resume_uploads row fetched (same content_hash)
  → analyses queried by content_hash → MATCH FOUND
  → Lead saved to leads table (contact info still captured)
  → Rate limit event recorded
  → OpenRouter NOT called (skipped entirely)
  → New analyses row inserted copying cached scores (served_from_cache = true)
  → resume_uploads row deleted
  → Identical scores returned to user (instant)
```

---

## Key Properties

- **Consistency**: Same resume always returns identical scores — no LLM variance.
- **Cost**: Zero AI spend on repeated uploads of the same resume.
- **Speed**: Cache hits skip the ~3–5 second OpenRouter call.
- **No data loss**: Every submission still creates a `leads` row and an `analyses` row — full attribution is preserved.
- **Cache invalidation**: Any edit to the resume (even one character) produces a different hash and triggers a fresh AI call.

---

## Files Involved

| File | Role |
|---|---|
| `src/app/api/upload/route.ts` | Computes SHA-256 and stores it in `resume_uploads.content_hash` |
| `src/server/routers/resume.ts` | Looks up `analyses` by hash before calling OpenRouter |
| `supabase/schema.sql` | Schema definitions for both new columns and the index |

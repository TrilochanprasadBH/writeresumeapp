-- ============================================================
-- WriteResume — Supabase Schema
-- Run this in the Supabase SQL editor (dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Temporary resume uploads ─────────────────────────────
-- Text extracted from PDF/DOCX. Auto-expired after 2 hours
-- via a scheduled pg_cron job (or Supabase scheduled functions).
CREATE TABLE IF NOT EXISTS resume_uploads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_text  TEXT        NOT NULL,
  file_name    TEXT        NOT NULL,
  char_count   INTEGER     NOT NULL DEFAULT 0,
  content_hash TEXT        NOT NULL DEFAULT '',  -- SHA-256 of resume_text for deduplication
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours'
);

-- Index for cleanup job
CREATE INDEX IF NOT EXISTS idx_resume_uploads_expires
  ON resume_uploads (expires_at);

-- ── 2. Leads (contact info captured before showing results) ─
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT,
  ip_address  TEXT,          -- hashed or raw depending on your privacy policy
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);

-- ── 3. Analysis results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
  upload_id           UUID,              -- reference to resume_uploads (may be expired/deleted)
  content_hash        TEXT,              -- SHA-256 of resume text; used to serve cached results
  inferred_role       TEXT,              -- what the AI guessed the role is
  ats_score           SMALLINT CHECK (ats_score BETWEEN 0 AND 100),
  ats_label           TEXT,              -- 'Strong' | 'Moderate' | 'Weak'
  ats_reason          TEXT,              -- one-line summary
  hireability_score   SMALLINT CHECK (hireability_score BETWEEN 0 AND 100),
  hireability_label   TEXT,
  hireability_reason  TEXT,
  rejection_signals   JSONB NOT NULL DEFAULT '[]',
  -- [{ "signal": "...", "detail": "...", "severity": "high"|"medium"|"low" }]
  sections            JSONB NOT NULL DEFAULT '[]',
  -- [{ "label": "Experience", "score": 82, "weight": 25 }, ...]
  model_used          TEXT,              -- which OpenRouter model responded
  processing_ms       INTEGER,           -- latency for observability
  served_from_cache   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_lead ON analyses (lead_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_content_hash ON analyses (content_hash);

-- ── 4. Rate limiting ─────────────────────────────────────────
-- Stores timestamps of analysis requests per IP (and email).
-- App checks how many rows exist in the last N minutes.
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  TEXT        NOT NULL,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_ip
  ON rate_limit_events (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_email
  ON rate_limit_events (email, created_at DESC);

-- ── 5. RLS policies ──────────────────────────────────────────
-- These tables are only accessed server-side via service role key.
-- Lock them down completely on the client (anon) side.
ALTER TABLE resume_uploads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events   ENABLE ROW LEVEL SECURITY;

-- No anon access at all — service role bypasses RLS.
-- (No CREATE POLICY needed — default deny is what we want.)

-- ── 6. Cleanup function (optional, run via pg_cron or Edge Function) ─
-- DELETE FROM resume_uploads WHERE expires_at < NOW();
-- DELETE FROM rate_limit_events WHERE created_at < NOW() - INTERVAL '24 hours';

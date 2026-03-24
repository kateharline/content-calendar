-- Frequency Content Publishing Suite - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Drop old table (from previous TruthOps version)
-- DROP TABLE IF EXISTS week_plans;

-- Arc plans (replaces week_plans)
CREATE TABLE IF NOT EXISTS arc_plans (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arc_name TEXT NOT NULL,
  start_date DATE,
  posts_data JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create an index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_arc_plans_updated_at ON arc_plans(updated_at DESC);

-- Instagram credentials (separate for security)
CREATE TABLE IF NOT EXISTS ig_credentials (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ig_account_id TEXT,
  ig_access_token TEXT,
  ig_username TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE arc_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON arc_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ig_credentials FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_arc_plans_updated_at
  BEFORE UPDATE ON arc_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ig_credentials_updated_at
  BEFORE UPDATE ON ig_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for images
-- (Run this in Supabase Dashboard > Storage > New Bucket)
-- Name: carousel-images
-- Public: Yes (required for Instagram API to access images)

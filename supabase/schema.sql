-- TruthOps Content Planner - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Create the week_plans table
CREATE TABLE IF NOT EXISTS week_plans (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_of TEXT NOT NULL,
  tweet_schedule_raw TEXT NOT NULL DEFAULT '',
  voice_activation_raw TEXT NOT NULL DEFAULT '',
  artifact_raw TEXT NOT NULL DEFAULT '',
  parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create an index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_week_plans_updated_at ON week_plans(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- For a simple setup, we'll allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations" ON week_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Alternative: If you want to use anon key without auth, use this policy instead:
-- CREATE POLICY "Allow all operations for anon" ON week_plans
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_week_plans_updated_at
  BEFORE UPDATE ON week_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

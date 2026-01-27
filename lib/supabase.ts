// TruthOps Content Planner - Supabase client

import { createClient } from '@supabase/supabase-js';
import { WeekPlan } from './types';

// Supabase client - will be null if env vars aren't set (falls back to localStorage)
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null; // Will fall back to localStorage
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export function isSupabaseAvailable(): boolean {
  return getSupabaseClient() !== null;
}

// Database table name
const TABLE_NAME = 'week_plans';

// Helper to convert WeekPlan to database format
function weekPlanToDb(plan: WeekPlan) {
  return {
    id: plan.id,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
    week_of: plan.weekOf,
    tweet_schedule_raw: plan.tweetScheduleRaw,
    voice_activation_raw: plan.voiceActivationRaw,
    artifact_raw: plan.artifactRaw,
    parsed_data: plan.parsed, // Store the entire parsed object as JSONB
  };
}

// Helper to convert database format to WeekPlan
function dbToWeekPlan(row: any): WeekPlan {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    weekOf: row.week_of,
    tweetScheduleRaw: row.tweet_schedule_raw,
    voiceActivationRaw: row.voice_activation_raw,
    artifactRaw: row.artifact_raw,
    parsed: row.parsed_data,
  };
}

/**
 * Save week plan to Supabase
 */
export async function saveWeekPlanToSupabase(plan: WeekPlan): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const dbData = weekPlanToDb(plan);
    const { error } = await client
      .from(TABLE_NAME)
      .upsert(dbData as any, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving to Supabase:', err);
    return false;
  }
}

/**
 * Load week plan from Supabase (gets the most recent one)
 */
export async function loadWeekPlanFromSupabase(): Promise<WeekPlan | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single() as any;

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Failed to load from Supabase:', error);
      return null;
    }

    return dbToWeekPlan(data);
  } catch (err) {
    console.error('Error loading from Supabase:', err);
    return null;
  }
}

/**
 * Clear week plan from Supabase (delete the most recent one)
 */
export async function clearWeekPlanFromSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Get the most recent plan
    const { data } = await client
      .from(TABLE_NAME)
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single() as any;

    if (!data) return true; // Nothing to delete

    const { error } = await client
      .from(TABLE_NAME)
      .delete()
      .eq('id', data.id);

    if (error) {
      console.error('Failed to delete from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting from Supabase:', err);
    return false;
  }
}

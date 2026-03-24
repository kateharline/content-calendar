// Frequency Content Publishing Suite - Supabase client

import { createClient } from '@supabase/supabase-js';
import { ArcPlan } from './types';

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
const TABLE_NAME = 'arc_plans';

// Helper to convert ArcPlan to database format
function arcPlanToDb(plan: ArcPlan) {
  return {
    id: plan.id,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
    arc_name: plan.arcName,
    start_date: plan.startDate,
    posts_data: plan.posts,
  };
}

// Helper to convert database format to ArcPlan
function dbToArcPlan(row: any): ArcPlan {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    arcName: row.arc_name,
    startDate: row.start_date,
    igAccountId: null,
    igAccessToken: null,
    posts: row.posts_data || [],
  };
}

/**
 * Save arc plan to Supabase
 */
export async function saveArcPlanToSupabase(plan: ArcPlan): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const dbData = arcPlanToDb(plan);
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
 * Load arc plan from Supabase (gets the most recent one)
 */
export async function loadArcPlanFromSupabase(): Promise<ArcPlan | null> {
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
        return null;
      }
      console.error('Failed to load from Supabase:', error);
      return null;
    }

    return dbToArcPlan(data);
  } catch (err) {
    console.error('Error loading from Supabase:', err);
    return null;
  }
}

/**
 * Clear arc plan from Supabase
 */
export async function clearArcPlanFromSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data } = await client
      .from(TABLE_NAME)
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single() as any;

    if (!data) return true;

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

/**
 * Save Instagram credentials to Supabase
 */
export async function saveIgCredentials(accountId: string, accessToken: string, username?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('ig_credentials')
      .upsert({
        id: 'default',
        ig_account_id: accountId,
        ig_access_token: accessToken,
        ig_username: username || null,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save IG credentials:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving IG credentials:', err);
    return false;
  }
}

/**
 * Load Instagram credentials from Supabase
 */
export async function loadIgCredentials(): Promise<{ accountId: string; accessToken: string; username: string | null } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('ig_credentials')
      .select('*')
      .eq('id', 'default')
      .single() as any;

    if (error || !data) return null;

    return {
      accountId: data.ig_account_id,
      accessToken: data.ig_access_token,
      username: data.ig_username,
    };
  } catch (err) {
    console.error('Error loading IG credentials:', err);
    return null;
  }
}

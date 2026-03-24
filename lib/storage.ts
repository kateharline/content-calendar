// Frequency Content Publishing Suite - Storage utilities (Supabase with localStorage fallback)

import { ArcPlan, InstagramPost, generateId } from './types';
import {
  saveArcPlanToSupabase,
  loadArcPlanFromSupabase,
  clearArcPlanFromSupabase,
  isSupabaseAvailable
} from './supabase';

const STORAGE_KEY = 'frequency_arc_plan';

/**
 * Save arc plan (to Supabase if available, otherwise localStorage)
 */
export async function saveArcPlan(plan: ArcPlan): Promise<void> {
  const updated = { ...plan, updatedAt: new Date().toISOString() };

  // Try Supabase first
  if (isSupabaseAvailable()) {
    const success = await saveArcPlanToSupabase(updated);
    if (success) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        // Ignore localStorage errors if Supabase works
      }
      return;
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save arc plan:', err);
  }
}

/**
 * Load arc plan (from Supabase if available, otherwise localStorage)
 */
export async function loadArcPlan(): Promise<ArcPlan | null> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    const plan = await loadArcPlanFromSupabase();
    if (plan) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      } catch (err) {
        // Ignore
      }
      return plan;
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ArcPlan;
  } catch (err) {
    console.error('Failed to load arc plan:', err);
    return null;
  }
}

/**
 * Clear arc plan
 */
export async function clearArcPlan(): Promise<void> {
  if (isSupabaseAvailable()) {
    await clearArcPlanFromSupabase();
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear arc plan:', err);
  }
}

/**
 * Update a specific post in the plan
 */
export function updatePost(plan: ArcPlan, postId: string, updates: Partial<InstagramPost>): ArcPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    posts: plan.posts.map(p =>
      p.id === postId ? { ...p, ...updates } : p
    ),
  };
}

/**
 * Delete a post from the plan
 */
export function deletePost(plan: ArcPlan, postId: string): ArcPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    posts: plan.posts.filter(p => p.id !== postId),
  };
}

/**
 * Export arc plan as JSON string
 */
export function exportArcPlanAsJSON(plan: ArcPlan): string {
  const exportData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    arcName: plan.arcName,
    startDate: plan.startDate,
    posts: plan.posts.map(p => ({
      id: p.id,
      day: p.day,
      dayOfWeek: p.dayOfWeek,
      type: p.type,
      title: p.title,
      caption: p.caption,
      images: p.images,
      scheduledTime: p.scheduledTime,
      status: p.status,
      igMediaId: p.igMediaId,
      igPermalink: p.igPermalink,
      publishedAt: p.publishedAt,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import arc plan from JSON string
 */
export function importArcPlanFromJSON(jsonString: string): ArcPlan | null {
  try {
    const data = JSON.parse(jsonString);

    if (!data.posts || !Array.isArray(data.posts)) {
      console.error('Invalid import data: missing posts array');
      return null;
    }

    const plan: ArcPlan = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      arcName: data.arcName || 'Imported Arc',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      igAccountId: null,
      igAccessToken: null,
      posts: data.posts.map((p: any) => ({
        id: p.id || generateId(),
        day: p.day,
        dayOfWeek: p.dayOfWeek || 'Mon',
        type: p.type || 'midday',
        title: p.title || '',
        caption: p.caption || '',
        images: p.images || [],
        scheduledTime: p.scheduledTime || null,
        status: p.status || 'draft',
        igContainerId: null,
        igMediaId: p.igMediaId || null,
        igPermalink: p.igPermalink || null,
        publishedAt: p.publishedAt || null,
        errorMessage: null,
      })),
    };

    return plan;
  } catch (err) {
    console.error('Failed to import arc plan:', err);
    return null;
  }
}

/**
 * Save file to file system using File System Access API
 */
export async function saveJSONToFileSystem(content: string, suggestedFilename: string): Promise<boolean> {
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedFilename,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] },
        }],
        startIn: 'documents',
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error saving file:', err);
      }
      return false;
    }
  } else {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
}

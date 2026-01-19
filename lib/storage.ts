// TruthOps Content Planner - localStorage utilities

import { WeekPlan, TweetItem, ZoraContent, EngagementBlock } from './types';

const STORAGE_KEY = 'truthops_week_plan';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save week plan to localStorage
 */
export function saveWeekPlan(plan: WeekPlan): void {
  try {
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save week plan:', err);
  }
}

/**
 * Load week plan from localStorage
 */
export function loadWeekPlan(): WeekPlan | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as WeekPlan;
  } catch (err) {
    console.error('Failed to load week plan:', err);
    return null;
  }
}

/**
 * Clear week plan from localStorage
 */
export function clearWeekPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear week plan:', err);
  }
}

/**
 * Update a specific tweet
 */
export function updateTweet(plan: WeekPlan, tweetId: string, updates: Partial<TweetItem>): WeekPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    parsed: {
      ...plan.parsed,
      tweets: plan.parsed.tweets.map(t => 
        t.id === tweetId ? { ...t, ...updates } : t
      ),
    },
  };
}

/**
 * Update a specific Zora content item
 */
export function updateZoraContent(plan: WeekPlan, contentId: string, updates: Partial<ZoraContent>): WeekPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    parsed: {
      ...plan.parsed,
      zoraContent: plan.parsed.zoraContent.map(z => 
        z.id === contentId ? { ...z, ...updates } : z
      ),
    },
  };
}

/**
 * Update a specific engagement block
 */
export function updateEngagementBlock(plan: WeekPlan, blockId: string, updates: Partial<EngagementBlock>): WeekPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    parsed: {
      ...plan.parsed,
      engagementBlocks: plan.parsed.engagementBlocks.map(e => 
        e.id === blockId ? { ...e, ...updates } : e
      ),
    },
  };
}

/**
 * Export week plan as JSON string (includes all updates)
 */
export function exportWeekPlanAsJSON(plan: WeekPlan): string {
  // Export everything including all edits, statuses, times, etc.
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    weekOf: plan.weekOf,
    metadata: plan.parsed.metadata,
    tweets: plan.parsed.tweets.map(t => ({
      id: t.id,
      day: t.day,
      time: t.time,
      text: t.text,
      status: t.status,
      platform: t.platform,
    })),
    engagementBlocks: plan.parsed.engagementBlocks.map(e => ({
      id: e.id,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      platform: e.platform,
      targets: e.targets,
      instructions: e.instructions,
      profileLinks: e.profileLinks,
      status: e.status,
      isSkipped: e.isSkipped,
      skipReason: e.skipReason,
    })),
    zoraContent: plan.parsed.zoraContent.map(z => ({
      id: z.id,
      type: z.type,
      day: z.day,
      time: z.time,
      ticker: z.ticker,
      title: z.title,
      description: z.description,
      scriptText: z.scriptText,
      revePrompt: z.revePrompt,
      status: z.status,
      // Note: mediaFile URLs are local blob URLs, not exported
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import week plan from JSON string
 */
export function importWeekPlanFromJSON(jsonString: string): WeekPlan | null {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate basic structure
    if (!data.metadata || !data.tweets || !data.zoraContent) {
      console.error('Invalid import data: missing required fields');
      return null;
    }
    
    // Create a new WeekPlan from imported data
    const plan: WeekPlan = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weekOf: data.weekOf || data.metadata.weekOf || '',
      tweetScheduleRaw: '', // Not needed when importing
      voiceActivationRaw: '',
      artifactRaw: '',
      parsed: {
        metadata: data.metadata,
        tweets: data.tweets.map((t: TweetItem) => ({ ...t, id: t.id || generateId() })),
        engagementBlocks: (data.engagementBlocks || []).map((e: EngagementBlock) => ({ ...e, id: e.id || generateId() })),
        zoraContent: data.zoraContent.map((z: ZoraContent) => ({ ...z, id: z.id || generateId() })),
      },
    };
    
    return plan;
  } catch (err) {
    console.error('Failed to import week plan:', err);
    return null;
  }
}

/**
 * Save file to file system using File System Access API
 * Falls back to download if API not available
 */
export async function saveJSONToFileSystem(content: string, suggestedFilename: string): Promise<boolean> {
  // Check if File System Access API is available
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedFilename,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] },
        }],
        startIn: 'documents', // Try to start in Documents folder
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      return true;
    } catch (err: any) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error saving file:', err);
      }
      return false;
    }
  } else {
    // Fallback to download
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

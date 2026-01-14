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

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WeekPlan, TweetItem, ZoraContent, EngagementBlock } from '@/lib/types';
import { loadWeekPlan, saveWeekPlan, updateTweet, updateZoraContent, updateEngagementBlock, exportWeekPlanAsJSON, importWeekPlanFromJSON, saveJSONToFileSystem } from '@/lib/storage';
import { Timeline } from '@/components/timeline/Timeline';

export default function WeekPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadWeekPlan();
    if (!stored) {
      router.push('/');
      return;
    }
    setPlan(stored);
    setLoading(false);
  }, [router]);

  const handleUpdateTweet = useCallback((tweetId: string, updates: Partial<TweetItem>) => {
    if (!plan) return;
    const updated = updateTweet(plan, tweetId, updates);
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleUpdateZora = useCallback((contentId: string, updates: Partial<ZoraContent>) => {
    if (!plan) return;
    const updated = updateZoraContent(plan, contentId, updates);
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleUpdateEngagement = useCallback((blockId: string, updates: Partial<EngagementBlock>) => {
    if (!plan) return;
    const updated = updateEngagementBlock(plan, blockId, updates);
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleAddTweet = useCallback((tweet: TweetItem) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      parsed: {
        ...plan.parsed,
        tweets: [...plan.parsed.tweets, tweet]
      }
    };
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleAddZora = useCallback((content: ZoraContent) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      parsed: {
        ...plan.parsed,
        zoraContent: [...plan.parsed.zoraContent, content]
      }
    };
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleDeleteTweet = useCallback((tweetId: string) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      parsed: {
        ...plan.parsed,
        tweets: plan.parsed.tweets.filter(t => t.id !== tweetId)
      }
    };
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleDeleteZora = useCallback((contentId: string) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      parsed: {
        ...plan.parsed,
        zoraContent: plan.parsed.zoraContent.filter(z => z.id !== contentId)
      }
    };
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  const handleDeleteEngagement = useCallback((blockId: string) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      parsed: {
        ...plan.parsed,
        engagementBlocks: plan.parsed.engagementBlocks.filter(e => e.id !== blockId)
      }
    };
    setPlan(updated);
    saveWeekPlan(updated);
  }, [plan]);

  // Export plan as JSON to file system
  const handleExport = useCallback(async () => {
    if (!plan) return;
    const json = exportWeekPlanAsJSON(plan);
    const weekStr = plan.parsed.metadata.weekOf?.replace(/[^a-zA-Z0-9]/g, '-') || 'week';
    const filename = `truthops-${weekStr}.json`;
    const saved = await saveJSONToFileSystem(json, filename);
    if (saved) {
      // Show success message briefly
      const button = document.activeElement as HTMLElement;
      const originalText = button.textContent;
      button.textContent = '✓ Saved';
      setTimeout(() => {
        if (button) button.textContent = originalText;
      }, 2000);
    }
  }, [plan]);

  // Import plan from JSON file
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importWeekPlanFromJSON(content);
      if (imported) {
        setPlan(imported);
        saveWeekPlan(imported);
        alert('Plan imported successfully!');
      } else {
        alert('Failed to import plan. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  // Count stats
  const totalTweets = plan.parsed.tweets.length;
  const approvedTweets = plan.parsed.tweets.filter(t => t.status === 'approved' || t.status === 'scheduled' || t.status === 'posted').length;
  const totalZora = plan.parsed.zoraContent.length;
  const zoraReady = plan.parsed.zoraContent.filter(z => z.status === 'metadata' || z.status === 'posted').length;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Week of {plan.parsed.metadata.weekOf || 'Unknown'}
              </h1>
              {plan.parsed.metadata.theme && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Theme: {plan.parsed.metadata.theme}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  Tweets: <span className="text-gray-900 font-medium">{approvedTweets}/{totalTweets}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">
                  Zora: <span className="text-gray-900 font-medium">{zoraReady}/{totalZora}</span>
                </span>
              </div>

              {/* Export/Import buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Export as JSON"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                <label className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Edit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Timeline
          plan={plan}
          onUpdateTweet={handleUpdateTweet}
          onUpdateZora={handleUpdateZora}
          onUpdateEngagement={handleUpdateEngagement}
          onAddTweet={handleAddTweet}
          onAddZora={handleAddZora}
          onDeleteTweet={handleDeleteTweet}
          onDeleteZora={handleDeleteZora}
          onDeleteEngagement={handleDeleteEngagement}
        />
      </main>
    </div>
  );
}

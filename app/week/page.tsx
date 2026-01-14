'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WeekPlan, TweetItem, ZoraContent, EngagementBlock } from '@/lib/types';
import { loadWeekPlan, saveWeekPlan, updateTweet, updateZoraContent, updateEngagementBlock } from '@/lib/storage';
import { Timeline } from '@/components/timeline/Timeline';

export default function WeekPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

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
        />
      </main>
    </div>
  );
}

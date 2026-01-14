'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseAllContent } from '@/lib/parser';
import { saveWeekPlan, loadWeekPlan, clearWeekPlan, generateId } from '@/lib/storage';
import { WeekPlan } from '@/lib/types';

export default function IntakePage() {
  const router = useRouter();
  const [tweetScheduleRaw, setTweetScheduleRaw] = useState('');
  const [voiceActivationRaw, setVoiceActivationRaw] = useState('');
  const [artifactRaw, setArtifactRaw] = useState('');
  const [weekOf, setWeekOf] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [existingPlan, setExistingPlan] = useState<WeekPlan | null>(null);

  useEffect(() => {
    const stored = loadWeekPlan();
    if (stored) {
      setExistingPlan(stored);
      setTweetScheduleRaw(stored.tweetScheduleRaw);
      setVoiceActivationRaw(stored.voiceActivationRaw);
      setArtifactRaw(stored.artifactRaw);
      setWeekOf(stored.weekOf);
    }
    setIsLoading(false);
  }, []);

  const handleGenerate = () => {
    const parsed = parseAllContent(tweetScheduleRaw, voiceActivationRaw, artifactRaw);
    
    const plan: WeekPlan = {
      id: existingPlan?.id || generateId(),
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weekOf: weekOf || parsed.metadata.weekOf,
      tweetScheduleRaw,
      voiceActivationRaw,
      artifactRaw,
      parsed,
    };

    saveWeekPlan(plan);
    router.push('/week');
  };

  const handleReset = () => {
    if (confirm('Clear all content and start fresh?')) {
      clearWeekPlan();
      setTweetScheduleRaw('');
      setVoiceActivationRaw('');
      setArtifactRaw('');
      setWeekOf('');
      setExistingPlan(null);
    }
  };

  const handleContinue = () => {
    router.push('/week');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            TruthOps Content Planner
          </h1>
          <p className="text-gray-500 mt-1">
            Paste your weekly execution docs below
          </p>
        </div>
      </header>

      {/* Existing plan banner */}
      {existingPlan && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-blue-900 font-medium">
                You have a plan for: {existingPlan.parsed.metadata.weekOf || 'this week'}
              </p>
              <p className="text-blue-700 text-sm">
                {existingPlan.parsed.tweets.length} tweets, {existingPlan.parsed.zoraContent.length} Zora items
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="px-5 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Week selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Week of
          </label>
          <input
            type="text"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            placeholder="e.g. Monday Jan 19 → Friday Jan 23, 2026"
            className="w-full max-w-md px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Text areas */}
        <div className="space-y-8">
          {/* Tweet Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Tweet Schedule
              <span className="text-gray-400 font-normal ml-2">
                (Weekly execution doc with days, times, copy)
              </span>
            </label>
            <textarea
              value={tweetScheduleRaw}
              onChange={(e) => setTweetScheduleRaw(e.target.value)}
              placeholder="Paste your full tweet schedule here...

MONDAY — DIAGNOSIS: FALSE URGENCY ENTERS THE SYSTEM
Posting Schedule
8:10 AM — Anchor Post
..."
              rows={12}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y font-mono text-sm"
            />
          </div>

          {/* Voice Activation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Voice Activation (Zora Video)
              <span className="text-gray-400 font-normal ml-2">
                (Script, REVE prompts, style block)
              </span>
            </label>
            <textarea
              value={voiceActivationRaw}
              onChange={(e) => setVoiceActivationRaw(e.target.value)}
              placeholder="Paste your voice activation doc here...

1. Final Voice Script
When you ask why, you hand control to the story...

2. REVE — Scene-by-Scene Prompts
..."
              rows={10}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y font-mono text-sm"
            />
          </div>

          {/* Artifact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Artifact (Zora Image)
              <span className="text-gray-400 font-normal ml-2">
                (Visual prompt, description, ticker)
              </span>
            </label>
            <textarea
              value={artifactRaw}
              onChange={(e) => setArtifactRaw(e.target.value)}
              placeholder="Paste your artifact doc here...

Exact layout / prompts (visual-first)
Header (top, small, centered)
...

$TICKER
..."
              rows={10}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y font-mono text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={handleGenerate}
            disabled={!tweetScheduleRaw.trim()}
            className={`
              px-6 py-3 rounded-full font-semibold text-sm transition-all
              ${tweetScheduleRaw.trim()
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            {existingPlan ? 'Update & Preview' : 'Generate Preview'} →
          </button>

          {existingPlan && (
            <button
              onClick={handleReset}
              className="px-4 py-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Reset All
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

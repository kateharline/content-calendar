'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseAllContent, splitFullDocument } from '@/lib/parser';
import { saveWeekPlan, loadWeekPlan, clearWeekPlan, generateId } from '@/lib/storage';
import { WeekPlan } from '@/lib/types';

// Get next Monday (or today if it is Monday)
function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

// Format date as "Monday Jan 19 → Friday Jan 23, 2026"
function formatWeekRange(startDate: Date): string {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4); // Friday
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);
  const year = startDate.getFullYear();
  
  return `${startStr} → ${endStr}, ${year}`;
}

// Convert date to YYYY-MM-DD for input
function dateToInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse YYYY-MM-DD to Date
function inputValueToDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function IntakePage() {
  const router = useRouter();
  const [fullDocumentRaw, setFullDocumentRaw] = useState('');
  const [weekStartDate, setWeekStartDate] = useState<Date>(getNextMonday());
  const [isLoading, setIsLoading] = useState(true);
  const [existingPlan, setExistingPlan] = useState<WeekPlan | null>(null);
  
  // Derived state for the split sections (for display/debugging if needed)
  const [splitSections, setSplitSections] = useState<{
    tweetSchedule: string;
    voiceActivation: string;
    artifact: string;
  } | null>(null);

  // Format the week string for display and storage
  const weekOf = useMemo(() => formatWeekRange(weekStartDate), [weekStartDate]);

  useEffect(() => {
    async function loadData() {
      const stored = await loadWeekPlan();
      if (stored) {
        setExistingPlan(stored);
        // Reconstruct full document from stored sections
        const fullDoc = [
          stored.tweetScheduleRaw,
          stored.voiceActivationRaw ? `\n\nVoice Activation\n\n${stored.voiceActivationRaw}` : '',
          stored.artifactRaw ? `\n\nArtifact\n\n${stored.artifactRaw}` : ''
        ].filter(Boolean).join('');
        setFullDocumentRaw(fullDoc);
        // Try to parse existing weekOf back to a date
        if (stored.weekOf) {
          const match = stored.weekOf.match(/(\w+)\s+(\w+)\s+(\d+)/);
          if (match) {
            const monthStr = match[2];
            const day = parseInt(match[3]);
            const yearMatch = stored.weekOf.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth();
            setWeekStartDate(new Date(year, monthIndex, day));
          }
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleGenerate = async () => {
    // Split the document if not already split
    const split = splitSections || (fullDocumentRaw.trim() ? splitFullDocument(fullDocumentRaw) : {
      tweetSchedule: '',
      voiceActivation: '',
      artifact: ''
    });
    
    const parsed = parseAllContent(split.tweetSchedule, split.voiceActivation, split.artifact);
    
    const plan: WeekPlan = {
      id: existingPlan?.id || generateId(),
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weekOf: weekOf || parsed.metadata.weekOf,
      tweetScheduleRaw: split.tweetSchedule,
      voiceActivationRaw: split.voiceActivation,
      artifactRaw: split.artifact,
      parsed,
    };

    await saveWeekPlan(plan);
    router.push('/week');
  };

  const handleReset = async () => {
    if (confirm('Clear all content and start fresh?')) {
      await clearWeekPlan();
      setFullDocumentRaw('');
      setSplitSections(null);
      setWeekStartDate(getNextMonday());
      setExistingPlan(null);
    }
  };

  const handleContinue = () => {
    router.push('/week');
  };

  const handleFullDocumentPaste = (value: string) => {
    setFullDocumentRaw(value);
    if (value.trim()) {
      const split = splitFullDocument(value);
      setSplitSections(split);
    } else {
      setSplitSections(null);
    }
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
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={dateToInputValue(weekStartDate)}
              onChange={(e) => {
                if (e.target.value) {
                  const selected = inputValueToDate(e.target.value);
                  // Snap to Monday of that week
                  const day = selected.getDay();
                  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go to Monday
                  selected.setDate(selected.getDate() + diff);
                  setWeekStartDate(selected);
                }
              }}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">{weekOf}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Select any day — it will snap to the Monday of that week
          </p>
        </div>

        {/* Single text area for full document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Calendar
            <span className="text-gray-400 font-normal ml-2">
              (Paste your complete weekly content calendar - all sections together)
            </span>
          </label>
          <textarea
            value={fullDocumentRaw}
            onChange={(e) => handleFullDocumentPaste(e.target.value)}
            placeholder="Paste your complete weekly content calendar here...

Week of: Monday January 26, 2025
Theme: One OF a Million
Core Tension: Exceptionalism (isolation, proving) vs. Integration (flow, serving)
Week Type: Philosophical Reframe
System Outcome: Shift from scarcity mindset to abundance practice

---

MONDAY — Launch Day

Posting Schedule

Micro-post (6:30 AM)
finding your place in the network is meeting all the problems that keep you up at night...

Engagement Block 1
8:00 — 8:30 AM
Engage with founder psychology, building in public, and startup content
- Reply to 3 recent posts...

..."
            rows={20}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            The app will automatically detect and split your document into Tweet Schedule, Voice Activation, and Artifact sections.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={handleGenerate}
            disabled={!fullDocumentRaw.trim()}
            className={`
              px-6 py-3 rounded-full font-semibold text-sm transition-all
              ${fullDocumentRaw.trim()
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

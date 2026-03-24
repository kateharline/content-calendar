'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveArcPlan, loadArcPlan, clearArcPlan } from '@/lib/storage';
import { ArcPlan, InstagramPost, CarouselImage, arcDayToDayOfWeek, generateId } from '@/lib/types';
import { uploadImages } from '@/lib/image-storage';

interface ImportPost {
  day: number;
  type: 'midday' | 'evening';
  title: string;
  caption: string;
  imageFilenames?: string[];
}

interface ImportData {
  arcName: string;
  posts: ImportPost[];
}

export default function ImportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [existingPlan, setExistingPlan] = useState<ArcPlan | null>(null);

  // Import state
  const [importMethod, setImportMethod] = useState<'json' | 'images'>('json');
  const [jsonText, setJsonText] = useState('');
  const [arcName, setArcName] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [parsedPosts, setParsedPosts] = useState<ImportPost[]>([]);
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const stored = await loadArcPlan();
      if (stored) setExistingPlan(stored);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Parse JSON import
  const handleJsonParse = () => {
    try {
      const data: ImportData = JSON.parse(jsonText);
      if (!data.posts || !Array.isArray(data.posts)) {
        alert('Invalid JSON: missing "posts" array');
        return;
      }
      setArcName(data.arcName || '');
      setParsedPosts(data.posts);
    } catch (err) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  // Handle JSON file upload
  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      try {
        const data: ImportData = JSON.parse(text);
        if (data.posts && Array.isArray(data.posts)) {
          setArcName(data.arcName || '');
          setParsedPosts(data.posts);
        }
      } catch {
        // Will be caught when they click parse
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle image folder upload
  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileMap = new Map<string, File>();
    const posts = new Map<string, ImportPost>();

    files.forEach(file => {
      // Parse filename: day-XX-{midday|evening}-N.png
      const match = file.name.match(/day-(\d+)-(midday|evening)-(\d+)/i);
      if (!match) return;

      const day = parseInt(match[1]);
      const type = match[2].toLowerCase() as 'midday' | 'evening';
      const key = `${day}-${type}`;

      fileMap.set(file.name, file);

      if (!posts.has(key)) {
        posts.set(key, {
          day,
          type,
          title: `Day ${day} — ${type === 'midday' ? 'Midday' : 'Evening'}`,
          caption: '',
          imageFilenames: [],
        });
      }
      posts.get(key)!.imageFilenames!.push(file.name);
    });

    // Sort filenames within each post
    posts.forEach(post => {
      post.imageFilenames!.sort();
    });

    setImageFiles(fileMap);
    setParsedPosts(Array.from(posts.values()).sort((a, b) => a.day - b.day || (a.type === 'midday' ? -1 : 1)));
  };

  // Confirm import and create plan
  const handleImport = async () => {
    if (parsedPosts.length === 0) return;
    setImporting(true);

    const planId = generateId();
    const posts: InstagramPost[] = [];

    for (let i = 0; i < parsedPosts.length; i++) {
      const p = parsedPosts[i];
      setImportProgress(`Processing post ${i + 1} of ${parsedPosts.length}...`);

      const postId = generateId();
      let images: CarouselImage[] = [];

      // Upload images if we have files
      if (p.imageFilenames && p.imageFilenames.length > 0) {
        const files = p.imageFilenames
          .map(fn => imageFiles.get(fn))
          .filter((f): f is File => !!f);

        if (files.length > 0) {
          setImportProgress(`Uploading images for post ${i + 1}...`);
          images = await uploadImages(files, planId, postId);
        }
      }

      posts.push({
        id: postId,
        day: p.day,
        dayOfWeek: arcDayToDayOfWeek(p.day, startDate),
        type: p.type,
        title: p.title,
        caption: p.caption,
        images,
        scheduledTime: null,
        status: 'draft',
        igContainerId: null,
        igMediaId: null,
        igPermalink: null,
        publishedAt: null,
        errorMessage: null,
      });
    }

    const plan: ArcPlan = {
      id: planId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      arcName: arcName || 'New Arc',
      startDate,
      igAccountId: null,
      igAccessToken: null,
      posts,
    };

    await saveArcPlan(plan);
    setImporting(false);
    router.push('/review');
  };

  const handleReset = async () => {
    if (confirm('Clear all content and start fresh?')) {
      await clearArcPlan();
      setExistingPlan(null);
      setJsonText('');
      setParsedPosts([]);
      setImageFiles(new Map());
      setArcName('');
    }
  };

  const totalImages = parsedPosts.reduce((acc, p) => acc + (p.imageFilenames?.length || 0), 0);

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
            Frequency Content Suite
          </h1>
          <p className="text-gray-500 mt-1">
            Import your carousel content to review and publish to Instagram
          </p>
        </div>
      </header>

      {/* Existing plan banner */}
      {existingPlan && (
        <div className="bg-pink-50 border-b border-pink-100">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-pink-900 font-medium">
                Active arc: {existingPlan.arcName}
              </p>
              <p className="text-pink-700 text-sm">
                {existingPlan.posts.length} posts · Started {new Date(existingPlan.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => router.push('/review')}
                className="px-5 py-2 bg-pink-600 text-white rounded-full font-medium text-sm hover:bg-pink-700 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Arc settings */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arc Name</label>
            <input
              type="text"
              value={arcName}
              onChange={(e) => setArcName(e.target.value)}
              placeholder="e.g., Anxiety → Groundedness"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
            />
          </div>
        </div>

        {/* Import method tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setImportMethod('json')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              importMethod === 'json'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            JSON Import
          </button>
          <button
            onClick={() => setImportMethod('images')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              importMethod === 'images'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Image Folder Upload
          </button>
        </div>

        {/* JSON Import */}
        {importMethod === 'json' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Paste JSON or upload file
              </label>
              <label className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                Upload .json
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJsonFile}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{
  "arcName": "Anxiety → Groundedness",
  "posts": [
    {
      "day": 1,
      "type": "midday",
      "title": "Day 1: The Map — Midday",
      "caption": "Your amygdala processes threat 200ms before...",
      "imageFilenames": ["day-01-midday-1.png", "day-01-midday-2.png"]
    }
  ]
}`}
              rows={16}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all resize-y font-mono text-sm"
            />
            {jsonText.trim() && parsedPosts.length === 0 && (
              <button
                onClick={handleJsonParse}
                className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Parse JSON
              </button>
            )}
          </div>
        )}

        {/* Image Folder Upload */}
        {importMethod === 'images' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload images with naming convention: <code className="text-pink-600">day-XX-midday|evening-N.png</code>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-pink-400 transition-colors cursor-pointer"
              onClick={() => imageInputRef.current?.click()}
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
              <p className="text-gray-600 font-medium">Click to select images</p>
              <p className="text-gray-400 text-sm mt-1">Select all carousel images at once</p>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageFiles}
            />
          </div>
        )}

        {/* Preview count */}
        {parsedPosts.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 font-medium">
              Found {parsedPosts.length} posts{totalImages > 0 ? ` with ${totalImages} images` : ''}
            </p>
            <div className="mt-2 max-h-48 overflow-y-auto">
              {parsedPosts.slice(0, 10).map((p, i) => (
                <div key={i} className="text-green-700 text-sm py-0.5">
                  Day {p.day} · {p.type} · {p.title}
                  {p.imageFilenames && ` · ${p.imageFilenames.length} images`}
                </div>
              ))}
              {parsedPosts.length > 10 && (
                <div className="text-green-600 text-sm py-0.5">
                  ...and {parsedPosts.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import progress */}
        {importing && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 font-medium">{importProgress}</p>
            <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={handleImport}
            disabled={parsedPosts.length === 0 || importing}
            className={`
              px-6 py-3 rounded-full font-semibold text-sm transition-all
              ${parsedPosts.length > 0 && !importing
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            {importing ? 'Importing...' : `Import ${parsedPosts.length} Posts →`}
          </button>
        </div>
      </main>
    </div>
  );
}

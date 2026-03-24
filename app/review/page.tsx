'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArcPlan, InstagramPost, generateId } from '@/lib/types';
import { loadArcPlan, saveArcPlan, updatePost, deletePost, exportArcPlanAsJSON, importArcPlanFromJSON, saveJSONToFileSystem } from '@/lib/storage';
import { uploadImages } from '@/lib/image-storage';
import { Timeline } from '@/components/timeline/Timeline';

export default function ReviewPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<ArcPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const stored = await loadArcPlan();
      if (!stored) {
        router.push('/');
        return;
      }
      setPlan(stored);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleUpdatePost = useCallback(async (postId: string, updates: Partial<InstagramPost>) => {
    if (!plan) return;
    const updated = updatePost(plan, postId, updates);
    setPlan(updated);
    await saveArcPlan(updated);
  }, [plan]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!plan) return;
    const updated = deletePost(plan, postId);
    setPlan(updated);
    await saveArcPlan(updated);
  }, [plan]);

  const handleAddPost = useCallback(async (post: InstagramPost) => {
    if (!plan) return;
    const updated = {
      ...plan,
      updatedAt: new Date().toISOString(),
      posts: [...plan.posts, post],
    };
    setPlan(updated);
    await saveArcPlan(updated);
  }, [plan]);

  const handleImageUpload = useCallback(async (postId: string, files: File[]) => {
    if (!plan) return;
    const post = plan.posts.find(p => p.id === postId);
    if (!post) return;

    const newImages = await uploadImages(files, plan.id, postId);
    // Set order to continue after existing images
    const startOrder = post.images.length;
    newImages.forEach((img, i) => { img.order = startOrder + i; });

    const updated = updatePost(plan, postId, {
      images: [...post.images, ...newImages],
    });
    setPlan(updated);
    await saveArcPlan(updated);
  }, [plan]);

  const handlePublishPost = useCallback(async (postId: string) => {
    if (!plan) return;

    try {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, planId: plan.id }),
      });

      const data = await res.json();

      if (data.success) {
        const updated = updatePost(plan, postId, {
          status: 'published',
          igMediaId: data.mediaId,
          igPermalink: data.permalink,
          publishedAt: new Date().toISOString(),
          errorMessage: null,
        });
        setPlan(updated);
        await saveArcPlan(updated);
      } else {
        const updated = updatePost(plan, postId, {
          status: 'failed',
          errorMessage: data.error || 'Publishing failed',
        });
        setPlan(updated);
        await saveArcPlan(updated);
      }
    } catch (err) {
      const updated = updatePost(plan, postId, {
        status: 'failed',
        errorMessage: `Network error: ${err}`,
      });
      setPlan(updated);
      await saveArcPlan(updated);
    }
  }, [plan]);

  const handleExport = useCallback(async () => {
    if (!plan) return;
    const json = exportArcPlanAsJSON(plan);
    const filename = `frequency-${plan.arcName.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    await saveJSONToFileSystem(json, filename);
  }, [plan]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const imported = importArcPlanFromJSON(content);
      if (imported) {
        setPlan(imported);
        await saveArcPlan(imported);
      } else {
        alert('Failed to import. Please check the file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!plan) return null;

  // Stats
  const totalPosts = plan.posts.length;
  const approvedPosts = plan.posts.filter(p => ['approved', 'scheduled', 'published'].includes(p.status)).length;
  const publishedPosts = plan.posts.filter(p => p.status === 'published').length;
  const totalImages = plan.posts.reduce((acc, p) => acc + p.images.length, 0);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {plan.arcName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Starting {new Date(plan.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  Posts: <span className="text-gray-900 font-medium">{approvedPosts}/{totalPosts}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">
                  Published: <span className="text-green-600 font-medium">{publishedPosts}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">
                  Images: <span className="text-gray-900 font-medium">{totalImages}</span>
                </span>
              </div>

              {/* Export/Import */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
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
                href="/settings"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Settings
              </Link>

              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Import
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Timeline
          plan={plan}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          onPublishPost={handlePublishPost}
          onImageUpload={handleImageUpload}
          onAddPost={handleAddPost}
        />
      </main>
    </div>
  );
}

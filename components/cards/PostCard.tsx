'use client';

import { useState, useRef, useEffect } from 'react';
import {
  InstagramPost,
  CarouselImage,
  PostStatus,
  POST_STATUS_STEPS,
  POST_STATUS_LABELS,
  POST_STATUS_COLORS,
  generateId,
} from '@/lib/types';

interface PostCardProps {
  post: InstagramPost;
  onUpdate: (updates: Partial<InstagramPost>) => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onImageUpload?: (files: File[]) => void;
  isDragging?: boolean;
  compact?: boolean;
}

export function PostCard({
  post,
  onUpdate,
  onDelete,
  onPublish,
  onImageUpload,
  isDragging = false,
  compact = false,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editingTime, setEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(post.scheduledTime || '');
  const [publishing, setPublishing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditCaption(post.caption);
    setEditTitle(post.title);
  }, [post.caption, post.title]);

  const currentStatusIndex = POST_STATUS_STEPS.indexOf(post.status);
  const canPublish = post.status === 'approved' || post.status === 'scheduled';

  const handleStatusClick = (status: PostStatus) => {
    if (status === 'published') return; // Can't manually set to published
    if (status === 'failed') return;
    onUpdate({ status });
  };

  const handleSaveCaption = () => {
    onUpdate({ caption: editCaption });
    setEditingCaption(false);
  };

  const handleSaveTitle = () => {
    onUpdate({ title: editTitle });
    setEditingTitle(false);
  };

  const handleSaveTime = () => {
    onUpdate({ scheduledTime: editTime || null });
    setEditingTime(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    onImageUpload?.(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (imageId: string) => {
    const updated = post.images.filter(img => img.id !== imageId);
    // Reorder
    updated.forEach((img, i) => img.order = i);
    onUpdate({ images: updated });
  };

  const handleReorderImage = (imageId: string, direction: 'left' | 'right') => {
    const images = [...post.images].sort((a, b) => a.order - b.order);
    const idx = images.findIndex(img => img.id === imageId);
    if (idx === -1) return;
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === images.length - 1) return;

    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    const temp = images[idx].order;
    images[idx].order = images[swapIdx].order;
    images[swapIdx].order = temp;

    onUpdate({ images: images.sort((a, b) => a.order - b.order) });
  };

  const handlePublish = async () => {
    if (!canPublish || !onPublish) return;
    setPublishing(true);
    try {
      await onPublish();
    } finally {
      setPublishing(false);
    }
  };

  const sortedImages = [...post.images].sort((a, b) => a.order - b.order);

  // Collapsed view
  if (!expanded && !isDragging) {
    return (
      <div
        className="instagram-card cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Thumbnail */}
          {sortedImages.length > 0 ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={sortedImages[0].url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900 truncate">{post.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${post.type === 'midday' ? 'badge-midday' : 'badge-evening'}`}>
                {post.type === 'midday' ? 'Midday' : 'Evening'}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{post.caption.slice(0, 100)}</p>
          </div>

          {/* Status + Images count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-gray-400 text-xs">{sortedImages.length} img</span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${POST_STATUS_COLORS[post.status]}`}>
              {POST_STATUS_LABELS[post.status]}
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStatusIndex + 1) / POST_STATUS_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <>
      <div className={`instagram-card ${isDragging ? 'shadow-xl scale-[1.02] rotate-[-1deg]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {/* Close / collapse */}
            {!isDragging && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Title (click to edit) */}
            {editingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setEditTitle(post.title); setEditingTitle(false); }
                }}
                autoFocus
                className="text-sm font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400/30 flex-1"
              />
            ) : (
              <span
                className="text-sm font-medium text-gray-900 cursor-text hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
              >
                {post.title}
              </span>
            )}

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${post.type === 'midday' ? 'badge-midday' : 'badge-evening'}`}>
              {post.type === 'midday' ? 'Midday' : 'Evening'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Schedule time */}
            {editingTime ? (
              <input
                type="datetime-local"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onBlur={handleSaveTime}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTime();
                  if (e.key === 'Escape') { setEditTime(post.scheduledTime || ''); setEditingTime(false); }
                }}
                autoFocus
                className="text-xs bg-purple-50 border border-purple-200 rounded px-2 py-1 text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
              />
            ) : (
              <span
                className="text-xs text-gray-500 cursor-pointer hover:text-purple-500 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); setEditTime(post.scheduledTime || ''); setEditingTime(true); }}
              >
                {post.scheduledTime ? new Date(post.scheduledTime).toLocaleString() : 'Schedule'}
              </span>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this post?')) onDelete();
                }}
                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Carousel Image Strip */}
        <div className="carousel-strip">
          {sortedImages.map((img) => (
            <div key={img.id} className="carousel-image group">
              <img
                src={img.url}
                alt={img.filename}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setViewingImage(img.url); }}
              />

              {/* Image overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.order > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReorderImage(img.id, 'left'); }}
                      className="p-1 bg-white/90 rounded text-gray-700 hover:bg-white text-xs"
                    >
                      ←
                    </button>
                  )}
                  {img.order < sortedImages.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReorderImage(img.id, 'right'); }}
                      className="p-1 bg-white/90 rounded text-gray-700 hover:bg-white text-xs"
                    >
                      →
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                    className="p-1 bg-white/90 rounded text-red-500 hover:bg-white text-xs"
                  >
                    ×
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                    {img.order + 1}/{sortedImages.length}
                  </span>
                </div>
                {!img.uploaded && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add image button */}
          <div
            className="carousel-add"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">Add Image</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Status Bar */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${POST_STATUS_COLORS[post.status]}`}>
              {POST_STATUS_LABELS[post.status]}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentStatusIndex + 1) / POST_STATUS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Status Steps */}
          <div className="flex gap-1">
            {POST_STATUS_STEPS.map((step, i) => (
              <button
                key={step}
                onClick={(e) => { e.stopPropagation(); handleStatusClick(step); }}
                className={`
                  flex-1 py-1.5 text-[10px] font-medium rounded transition-all uppercase tracking-wide
                  ${i <= currentStatusIndex
                    ? 'bg-pink-100 text-pink-700'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                `}
              >
                {POST_STATUS_LABELS[step]}
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="px-4 py-4 border-t border-gray-100">
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Caption</label>
          {editingCaption ? (
            <div>
              <textarea
                ref={captionRef}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setEditCaption(post.caption); setEditingCaption(false); }
                }}
                autoFocus
                rows={6}
                className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 border border-gray-200 resize-none"
                placeholder="Write your caption..."
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{editCaption.length} chars</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditCaption(post.caption); setEditingCaption(false); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCaption}
                    className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => { e.stopPropagation(); setEditingCaption(true); }}
              className="cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors"
            >
              <p className="caption-text text-gray-700 text-sm">
                {post.caption || 'Click to add caption...'}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {post.errorMessage && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-red-600 text-xs">{post.errorMessage}</p>
          </div>
        )}

        {/* Published link */}
        {post.igPermalink && (
          <div className="px-4 py-2 bg-green-50 border-t border-green-100">
            <a
              href={post.igPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 text-xs hover:underline"
            >
              View on Instagram →
            </a>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Day {post.day}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{sortedImages.length} image{sortedImages.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-2">
            {canPublish && onPublish && (
              <button
                onClick={(e) => { e.stopPropagation(); handlePublish(); }}
                disabled={publishing || sortedImages.length === 0}
                className="publish-btn text-sm"
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}

            {post.status === 'draft' && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ status: 'review' }); }}
                className="px-5 py-2 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Submit for Review
              </button>
            )}

            {post.status === 'review' && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ status: 'approved' }); }}
                className="px-5 py-2 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-size image modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={viewingImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

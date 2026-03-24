'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ArcPlan,
  InstagramPost,
  arcDayToDate,
  generateId,
} from '@/lib/types';
import { PostCard } from '@/components/cards/PostCard';

interface TimelineProps {
  plan: ArcPlan;
  onUpdatePost: (postId: string, updates: Partial<InstagramPost>) => void;
  onDeletePost?: (postId: string) => void;
  onPublishPost?: (postId: string) => void;
  onImageUpload?: (postId: string, files: File[]) => void;
  onAddPost?: (post: InstagramPost) => void;
}

interface DayGroup {
  dayNumber: number;
  date: Date;
  dateStr: string;
  middayPost: InstagramPost | null;
  eveningPost: InstagramPost | null;
}

export function Timeline({
  plan,
  onUpdatePost,
  onDeletePost,
  onPublishPost,
  onImageUpload,
  onAddPost,
}: TimelineProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredGap, setHoveredGap] = useState<{ day: number; type: 'midday' | 'evening' } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Group posts by day
  const dayGroups = useMemo(() => {
    const groups: Map<number, DayGroup> = new Map();

    // Find all day numbers present in posts
    const dayNumbers = new Set<number>();
    plan.posts.forEach(post => dayNumbers.add(post.day));

    // Ensure at least days 1-21 if we have a plan
    for (let i = 1; i <= 21; i++) {
      dayNumbers.add(i);
    }

    // Create groups
    Array.from(dayNumbers).sort((a, b) => a - b).forEach(dayNum => {
      const date = arcDayToDate(dayNum, plan.startDate);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      groups.set(dayNum, {
        dayNumber: dayNum,
        date,
        dateStr,
        middayPost: plan.posts.find(p => p.day === dayNum && p.type === 'midday') || null,
        eveningPost: plan.posts.find(p => p.day === dayNum && p.type === 'evening') || null,
      });
    });

    return Array.from(groups.values());
  }, [plan.posts, plan.startDate]);

  // Find dragging post
  const draggingPost = useMemo(() => {
    if (!draggingId) return null;
    return plan.posts.find(p => p.id === draggingId) || null;
  }, [draggingId, plan.posts]);

  // Mouse handlers for drag
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, [contenteditable], select')) return;

    let el: HTMLElement | null = target;
    while (el) {
      const classes = el.className || '';
      if (typeof classes === 'string' && (
        classes.includes('cursor-text') ||
        classes.includes('cursor-pointer') ||
        el.getAttribute('data-no-drag') !== null
      )) {
        return;
      }
      el = el.parentElement;
    }

    e.preventDefault();
    setDraggingId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [draggingId]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setDragPos(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleAddPost = (dayNumber: number, type: 'midday' | 'evening') => {
    if (!onAddPost) return;
    onAddPost({
      id: generateId(),
      day: dayNumber,
      dayOfWeek: arcDayToDate(dayNumber, plan.startDate).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3) as any,
      type,
      title: `Day ${dayNumber} — ${type === 'midday' ? 'Midday' : 'Evening'}`,
      caption: '',
      images: [],
      scheduledTime: null,
      status: 'draft',
      igContainerId: null,
      igMediaId: null,
      igPermalink: null,
      publishedAt: null,
      errorMessage: null,
    });
  };

  // Get arc day title from posts
  const getDayTitle = (dayNum: number) => {
    const posts = plan.posts.filter(p => p.day === dayNum);
    if (posts.length > 0) {
      // Extract the day title portion (e.g., "The Map" from "Day 1: The Map — Midday")
      const title = posts[0].title;
      const match = title.match(/Day \d+:?\s*(.+?)(?:\s*[—–-]\s*(?:Midday|Evening))?$/i);
      if (match) return match[1].trim();
    }
    return '';
  };

  // Only show days that have posts (or first 21)
  const visibleDays = dayGroups.filter(g => g.middayPost || g.eveningPost || g.dayNumber <= 21);

  return (
    <div ref={containerRef} className="flex gap-4">
      {/* Rainbow timeline bar */}
      <div className="flex-shrink-0 w-6">
        <div className="sticky top-20">
          <div
            className={`
              w-1.5 rounded-full transition-all duration-300
              bg-gradient-to-b from-pink-400 via-purple-400 to-indigo-400
              ${draggingId ? 'opacity-100' : 'opacity-40'}
            `}
            style={{ height: `${Math.max(400, visibleDays.length * 200)}px` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-8">
        {visibleDays.map((group) => {
          const dayTitle = getDayTitle(group.dayNumber);

          return (
            <div key={group.dayNumber} className="space-y-3">
              {/* Day Header */}
              <div className="sticky top-16 z-10 bg-gradient-to-b from-[#fafaf9] via-[#fafaf9] to-transparent pb-2 pt-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Day {group.dayNumber}
                  </h2>
                  {dayTitle && (
                    <span className="text-lg text-gray-500">{dayTitle}</span>
                  )}
                  <span className="text-sm text-gray-400">{group.dateStr}</span>
                </div>
              </div>

              {/* Midday Post */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Midday</span>
                </div>
                {group.middayPost ? (
                  <div
                    ref={el => { if (el && group.middayPost) cardRefs.current.set(group.middayPost.id, el); }}
                    onMouseDown={(e) => group.middayPost && handleMouseDown(e, group.middayPost.id)}
                    className="max-w-2xl cursor-grab"
                  >
                    <PostCard
                      post={group.middayPost}
                      onUpdate={(updates) => onUpdatePost(group.middayPost!.id, updates)}
                      onDelete={onDeletePost ? () => onDeletePost(group.middayPost!.id) : undefined}
                      onPublish={onPublishPost ? () => onPublishPost(group.middayPost!.id) : undefined}
                      onImageUpload={onImageUpload ? (files) => onImageUpload(group.middayPost!.id, files) : undefined}
                      isDragging={draggingId === group.middayPost.id}
                    />
                  </div>
                ) : (
                  <div
                    className="max-w-2xl"
                    onMouseEnter={() => setHoveredGap({ day: group.dayNumber, type: 'midday' })}
                    onMouseLeave={() => setHoveredGap(null)}
                  >
                    {hoveredGap?.day === group.dayNumber && hoveredGap?.type === 'midday' && onAddPost ? (
                      <button
                        onClick={() => handleAddPost(group.dayNumber, 'midday')}
                        className="w-full py-4 border border-dashed border-gray-300 hover:border-amber-400 rounded-xl text-gray-400 hover:text-amber-600 text-sm transition-colors"
                      >
                        + Add Midday Post
                      </button>
                    ) : (
                      <div className="py-4 border border-dashed border-gray-200 rounded-xl text-center text-gray-300 text-sm">
                        No midday post
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Visual separator */}
              <div className="pl-4">
                <div className="w-px h-4 bg-gray-200 ml-0.5" />
              </div>

              {/* Evening Post */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evening</span>
                </div>
                {group.eveningPost ? (
                  <div
                    ref={el => { if (el && group.eveningPost) cardRefs.current.set(group.eveningPost.id, el); }}
                    onMouseDown={(e) => group.eveningPost && handleMouseDown(e, group.eveningPost.id)}
                    className="max-w-2xl cursor-grab"
                  >
                    <PostCard
                      post={group.eveningPost}
                      onUpdate={(updates) => onUpdatePost(group.eveningPost!.id, updates)}
                      onDelete={onDeletePost ? () => onDeletePost(group.eveningPost!.id) : undefined}
                      onPublish={onPublishPost ? () => onPublishPost(group.eveningPost!.id) : undefined}
                      onImageUpload={onImageUpload ? (files) => onImageUpload(group.eveningPost!.id, files) : undefined}
                      isDragging={draggingId === group.eveningPost.id}
                    />
                  </div>
                ) : (
                  <div
                    className="max-w-2xl"
                    onMouseEnter={() => setHoveredGap({ day: group.dayNumber, type: 'evening' })}
                    onMouseLeave={() => setHoveredGap(null)}
                  >
                    {hoveredGap?.day === group.dayNumber && hoveredGap?.type === 'evening' && onAddPost ? (
                      <button
                        onClick={() => handleAddPost(group.dayNumber, 'evening')}
                        className="w-full py-4 border border-dashed border-gray-300 hover:border-purple-400 rounded-xl text-gray-400 hover:text-purple-600 text-sm transition-colors"
                      >
                        + Add Evening Post
                      </button>
                    ) : (
                      <div className="py-4 border border-dashed border-gray-200 rounded-xl text-center text-gray-300 text-sm">
                        No evening post
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating drag preview */}
      {draggingId && dragPos && draggingPost && (
        <div
          className="fixed pointer-events-none z-50 shadow-2xl rounded-xl"
          style={{
            left: dragPos.x - 200,
            top: dragPos.y - 30,
            width: '500px',
            opacity: 0.95,
            transform: 'rotate(-1deg)',
          }}
        >
          <PostCard
            post={draggingPost}
            onUpdate={() => {}}
            isDragging
          />
        </div>
      )}
    </div>
  );
}

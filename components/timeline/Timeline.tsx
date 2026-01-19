'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { 
  WeekPlan, 
  TweetItem, 
  ZoraContent, 
  EngagementBlock,
  DayOfWeek, 
  DAY_ORDER, 
  DAY_FULL_NAMES,
} from '@/lib/types';
import { timeToMinutes } from '@/lib/parser';
import { TweetCard } from '@/components/cards/TweetCard';
import { ZoraCard } from '@/components/cards/ZoraCard';
import { EngagementCard } from '@/components/cards/EngagementCard';
import { generateId } from '@/lib/storage';

interface TimelineProps {
  plan: WeekPlan;
  onUpdateTweet: (tweetId: string, updates: Partial<TweetItem>) => void;
  onUpdateZora: (contentId: string, updates: Partial<ZoraContent>) => void;
  onUpdateEngagement: (blockId: string, updates: Partial<EngagementBlock>) => void;
  onAddTweet?: (tweet: TweetItem) => void;
  onAddZora?: (content: ZoraContent) => void;
  onDeleteTweet?: (tweetId: string) => void;
  onDeleteZora?: (contentId: string) => void;
  onDeleteEngagement?: (blockId: string) => void;
}

interface ContentItem {
  id: string;
  type: 'zora' | 'tweet' | 'engagement';
  data: ZoraContent | TweetItem | EngagementBlock;
  time: string | null;
  day: DayOfWeek;
}

export function Timeline({ plan, onUpdateTweet, onUpdateZora, onUpdateEngagement, onAddTweet, onAddZora, onDeleteTweet, onDeleteZora, onDeleteEngagement }: TimelineProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: DayOfWeek; index: number } | null>(null);
  const [hoveredGap, setHoveredGap] = useState<{ day: DayOfWeek; index: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dayRefs = useRef<Map<DayOfWeek, HTMLDivElement>>(new Map());

  // Parse week start date
  const weekStartDate = useMemo(() => {
    try {
      const weekOfStr = plan.weekOf || plan.parsed?.metadata?.weekOf || '';
      const dateMatch = weekOfStr.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\w+)\s+(\d+)/i);
      if (dateMatch) {
        const month = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        const yearMatch = weekOfStr.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        return new Date(`${month} ${day}, ${year}`);
      }
      return new Date();
    } catch {
      return new Date();
    }
  }, [plan.weekOf, plan.parsed?.metadata?.weekOf]);

  // Flatten all items with their day
  const allItems = useMemo(() => {
    const items: ContentItem[] = [];
    
    plan.parsed.tweets.forEach(tweet => {
      items.push({ id: tweet.id, type: 'tweet', data: tweet, time: tweet.time, day: tweet.day });
    });
    plan.parsed.engagementBlocks.forEach(block => {
      items.push({ id: block.id, type: 'engagement', data: block, time: block.startTime, day: block.day });
    });
    plan.parsed.zoraContent.forEach(content => {
      items.push({ id: content.id, type: 'zora', data: content, time: content.time, day: content.day });
    });
    
    return items;
  }, [plan.parsed]);

  // Group items by day
  const dayGroups = useMemo(() => {
    const groups: Map<DayOfWeek, { day: DayOfWeek; date: string; items: ContentItem[] }> = new Map();
    const daysWithContent = new Set<DayOfWeek>();
    
    allItems.forEach(item => daysWithContent.add(item.day));
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => daysWithContent.add(d as DayOfWeek));

    DAY_ORDER.forEach((day, index) => {
      if (daysWithContent.has(day)) {
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + index);
        const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groups.set(day, { day, date: dateStr, items: [] });
      }
    });

    allItems.forEach(item => {
      const group = groups.get(item.day);
      if (group) group.items.push(item);
    });

    groups.forEach(group => {
      group.items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    });

    return Array.from(groups.values());
  }, [allItems, weekStartDate]);

  // Find dragging item
  const draggingItem = useMemo(() => {
    if (!draggingId) return null;
    return allItems.find(i => i.id === draggingId) || null;
  }, [draggingId, allItems]);

  // Time helpers
  const minutesToTimeStr = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Calculate drop target from mouse position
  const calculateDropTarget = useCallback((clientY: number) => {
    if (!containerRef.current) return null;

    for (const group of dayGroups) {
      const dayEl = dayRefs.current.get(group.day);
      if (!dayEl) continue;

      const dayRect = dayEl.getBoundingClientRect();
      if (clientY < dayRect.top - 50 || clientY > dayRect.bottom + 50) continue;

      // Get items excluding the dragging one
      const items = group.items.filter(i => i.id !== draggingId);
      
      // Check before first item
      if (items.length === 0) {
        return { day: group.day, index: 0 };
      }

      const firstCard = cardRefs.current.get(items[0].id);
      if (firstCard) {
        const rect = firstCard.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          return { day: group.day, index: 0 };
        }
      }

      // Check between items
      for (let i = 0; i < items.length; i++) {
        const card = cardRefs.current.get(items[i].id);
        if (!card) continue;
        
        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (clientY < midpoint) {
          return { day: group.day, index: i };
        }
      }

      // After last item
      return { day: group.day, index: items.length };
    }
    return null;
  }, [dayGroups, draggingId]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    
    // Check for interactive elements
    if (target.closest('button, input, textarea, a, [contenteditable], select')) return;
    
    // Check for elements with cursor-text or cursor-pointer classes (editable fields)
    let el: HTMLElement | null = target;
    while (el) {
      const classes = el.className || '';
      if (typeof classes === 'string' && (
        classes.includes('cursor-text') || 
        classes.includes('cursor-pointer') ||
        el.getAttribute('data-no-drag') !== null
      )) {
        return; // Don't start drag
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
    const target = calculateDropTarget(e.clientY);
    setDropTarget(target);
  }, [draggingId, calculateDropTarget]);

  const handleMouseUp = useCallback(() => {
    if (draggingId && dropTarget && draggingItem) {
      // Calculate new time
      const group = dayGroups.find(g => g.day === dropTarget.day);
      if (group) {
        const otherItems = group.items.filter(i => i.id !== draggingId);
        const prevItem = dropTarget.index > 0 ? otherItems[dropTarget.index - 1] : null;
        const nextItem = dropTarget.index < otherItems.length ? otherItems[dropTarget.index] : null;
        
        let newTime: string;
        if (!prevItem && !nextItem) {
          newTime = '09:00';
        } else if (!prevItem && nextItem) {
          const t = timeToMinutes(nextItem.time);
          newTime = minutesToTimeStr(Math.max(420, t - 30));
        } else if (prevItem && !nextItem) {
          const t = timeToMinutes(prevItem.time);
          newTime = minutesToTimeStr(Math.min(1320, t + 30));
        } else {
          const t1 = timeToMinutes(prevItem!.time);
          const t2 = timeToMinutes(nextItem!.time);
          newTime = minutesToTimeStr(Math.round((t1 + t2) / 2 / 15) * 15);
        }

        if (draggingItem.type === 'tweet') {
          onUpdateTweet(draggingItem.id, { day: dropTarget.day, time: newTime });
        } else if (draggingItem.type === 'zora') {
          onUpdateZora(draggingItem.id, { day: dropTarget.day, time: newTime });
        } else if (draggingItem.type === 'engagement') {
          onUpdateEngagement(draggingItem.id, { day: dropTarget.day, startTime: newTime });
        }
      }
    }
    
    setDraggingId(null);
    setDragPos(null);
    setDropTarget(null);
  }, [draggingId, dropTarget, draggingItem, dayGroups, onUpdateTweet, onUpdateZora, onUpdateEngagement]);

  // Global mouse listeners
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

  // Add handlers
  const handleAddTweet = (day: DayOfWeek, time: string) => {
    if (!onAddTweet) return;
    onAddTweet({
      id: generateId(),
      day,
      time,
      text: 'New tweet...',
      status: 'draft',
      platform: 'twitter'
    });
  };

  const handleAddZora = (day: DayOfWeek, time: string) => {
    if (!onAddZora) return;
    onAddZora({
      id: generateId(),
      type: 'image',
      day,
      time,
      ticker: null,
      title: 'New Zora Post',
      description: '',
      revePrompt: '',
      status: 'prompt'
    });
  };

  const getMidpointTime = (prevItem: ContentItem | null, nextItem: ContentItem | null): string => {
    if (!prevItem && !nextItem) return '09:00';
    if (!prevItem) {
      const t = timeToMinutes(nextItem!.time);
      return minutesToTimeStr(Math.max(420, t - 30));
    }
    if (!nextItem) {
      const t = timeToMinutes(prevItem.time);
      return minutesToTimeStr(Math.min(1320, t + 30));
    }
    const t1 = timeToMinutes(prevItem.time);
    const t2 = timeToMinutes(nextItem.time);
    return minutesToTimeStr(Math.round((t1 + t2) / 2 / 15) * 15);
  };

  // Check if a position should show a gap
  const shouldShowGap = (day: DayOfWeek, index: number) => {
    return dropTarget?.day === day && dropTarget?.index === index;
  };

  return (
    <div ref={containerRef} className="flex gap-4">
      {/* Rainbow timeline bar */}
      <div className="flex-shrink-0 w-6">
        <div className="sticky top-20">
          <div 
            className={`
              w-1.5 rounded-full transition-all duration-300
              bg-gradient-to-b from-blue-400 via-violet-400 to-pink-400
              ${draggingId ? 'opacity-100' : 'opacity-40'}
            `}
            style={{ height: `${Math.max(400, dayGroups.length * 180)}px` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-8">
        {dayGroups.map((group) => {
          const items = group.items.filter(i => i.id !== draggingId);
          
          return (
            <div 
              key={group.day} 
              ref={el => { if (el) dayRefs.current.set(group.day, el); }}
              className="space-y-2"
            >
              {/* Day Header */}
              <div className="sticky top-16 z-10 bg-gradient-to-b from-[#fafaf9] via-[#fafaf9] to-transparent pb-2 pt-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{DAY_FULL_NAMES[group.day]}</h2>
                  <span className="text-sm text-gray-400">{group.date}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {/* Gap at start - always show hoverable area */}
                <div 
                  className="h-12 my-2 transition-all duration-200"
                  onMouseEnter={() => !draggingId && setHoveredGap({ day: group.day, index: 0 })}
                  onMouseLeave={() => setHoveredGap(null)}
                >
                  {!draggingId && hoveredGap?.day === group.day && hoveredGap?.index === 0 && (onAddTweet || onAddZora) && (
                    <div className="h-full flex items-center justify-end pr-4">
                      <div className="flex gap-1">
                        {onAddTweet && (
                          <button
                            onClick={() => handleAddTweet(group.day, items.length > 0 ? getMidpointTime(null, items[0]) : '09:00')}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                          >
                            + Tweet
                          </button>
                        )}
                        {onAddZora && (
                          <button
                            onClick={() => handleAddZora(group.day, items.length > 0 ? getMidpointTime(null, items[0]) : '09:00')}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-violet-100 hover:text-violet-600 rounded-full"
                          >
                            + Zora
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="py-8 border border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                    No content scheduled
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.id}>
                      <div
                        ref={el => { if (el) cardRefs.current.set(item.id, el); }}
                        onMouseDown={(e) => handleMouseDown(e, item.id)}
                        className={`
                          transition-all duration-150 cursor-grab
                          ${item.type === 'zora' ? 'max-w-md' : 'max-w-xl'}
                        `}
                      >
                        {item.type === 'zora' && (
                          <ZoraCard
                            content={item.data as ZoraContent}
                            onUpdate={(updates) => onUpdateZora(item.id, updates)}
                            onDelete={onDeleteZora ? () => onDeleteZora(item.id) : undefined}
                          />
                        )}
                        {item.type === 'tweet' && (
                          <TweetCard
                            tweet={item.data as TweetItem}
                            onUpdate={(updates) => onUpdateTweet(item.id, updates)}
                            onDelete={onDeleteTweet ? () => onDeleteTweet(item.id) : undefined}
                          />
                        )}
                        {item.type === 'engagement' && (
                          <EngagementCard
                            block={item.data as EngagementBlock}
                            onUpdate={(updates) => onUpdateEngagement(item.id, updates)}
                            onDelete={onDeleteEngagement ? () => onDeleteEngagement(item.id) : undefined}
                          />
                        )}
                      </div>

                      {/* Gap after this item - always show hoverable area */}
                      <div 
                        className="h-12 my-2 transition-all duration-200"
                        onMouseEnter={() => !draggingId && setHoveredGap({ day: group.day, index: index + 1 })}
                        onMouseLeave={() => setHoveredGap(null)}
                      >
                        {!draggingId && hoveredGap?.day === group.day && hoveredGap?.index === index + 1 && (onAddTweet || onAddZora) && (
                          <div className="h-full flex items-center justify-end pr-4">
                            <div className="flex gap-1">
                              {onAddTweet && (
                                <button
                                  onClick={() => handleAddTweet(group.day, getMidpointTime(item, items[index + 1] || null))}
                                  className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                                >
                                  + Tweet
                                </button>
                              )}
                              {onAddZora && (
                                <button
                                  onClick={() => handleAddZora(group.day, getMidpointTime(item, items[index + 1] || null))}
                                  className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-violet-100 hover:text-violet-600 rounded-full"
                                >
                                  + Zora
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating drag preview */}
      {draggingId && dragPos && draggingItem && (
        <div
          className="fixed pointer-events-none z-50 shadow-2xl rounded-xl"
          style={{
            left: dragPos.x - 150,
            top: dragPos.y - 30,
            width: draggingItem.type === 'zora' ? '380px' : '500px',
            opacity: 0.95,
            transform: 'rotate(-1deg)',
          }}
        >
          {draggingItem.type === 'zora' && (
            <ZoraCard
              content={draggingItem.data as ZoraContent}
              onUpdate={() => {}}
            />
          )}
          {draggingItem.type === 'tweet' && (
            <TweetCard
              tweet={draggingItem.data as TweetItem}
              onUpdate={() => {}}
            />
          )}
          {draggingItem.type === 'engagement' && (
            <EngagementCard
              block={draggingItem.data as EngagementBlock}
              onUpdate={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}

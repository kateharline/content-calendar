'use client';

import { useState, useRef, useEffect } from 'react';
import { TweetItem, TweetStatus } from '@/lib/types';
import { formatTimeForDisplay } from '@/lib/parser';

interface TweetCardProps {
  tweet: TweetItem;
  onUpdate: (updates: Partial<TweetItem>) => void;
  onDelete?: () => void;
  profileImage?: string;
  displayName?: string;
  handle?: string;
  isDragging?: boolean;
}

const MAX_CHARS = 280;

export function TweetCard({
  tweet,
  onUpdate,
  onDelete,
  profileImage = '/avatar.jpg',
  displayName = 'Kate Harline, Ph.D.',
  handle = '@truthops_',
  isDragging = false,
}: TweetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMode, setEditMode] = useState(false); // Edit mode for approved items
  const [editText, setEditText] = useState(tweet.text);
  const [editTime, setEditTime] = useState(tweet.time || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const isApproved = tweet.status !== 'draft';
  const canEdit = !isApproved || editMode;

  const charCount = editText.length;
  const charRemaining = MAX_CHARS - charCount;
  const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS - 20;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, [isEditingTime]);

  const handleSaveTime = () => {
    onUpdate({ time: editTime });
    setIsEditingTime(false);
  };

  const handleApprove = () => {
    if (!isOverLimit && editText.trim()) {
      // Save text and approve in one step
      onUpdate({ text: editText, status: 'approved' });
      setIsEditing(false);
      setEditMode(false);
    }
  };

  const handleEdit = () => {
    // Toggle back to draft and enable edit mode
    onUpdate({ status: 'draft' });
    setEditMode(true);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditText(tweet.text);
      setIsEditing(false);
      setEditMode(false);
    }
    if (e.key === 'Enter' && e.metaKey) {
      handleApprove();
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status: TweetStatus) => {
    switch (status) {
      case 'approved':
      case 'scheduled':
        return 'text-green-500';
      case 'posted':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const CopyIcon = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="ml-1.5 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );

  return (
    <div
      className={`
        bg-white border border-gray-100 rounded-2xl p-4 transition-all relative
        ${isDragging ? 'shadow-xl scale-[1.02] rotate-[-1deg]' : 'hover:bg-gray-50'}
        ${isEditing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this tweet?')) {
              onDelete();
            }
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors z-10"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex-shrink-0 overflow-hidden">
          {profileImage !== '/avatar.jpg' ? (
            <img src={profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
              K
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1 text-[15px]">
            <span className="font-bold text-gray-900 truncate">{displayName}</span>
            <span className="text-gray-500">{handle}</span>
            <span className="text-gray-500">·</span>
            {isEditingTime ? (
              <input
                ref={timeInputRef}
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onBlur={handleSaveTime}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTime();
                  if (e.key === 'Escape') {
                    setEditTime(tweet.time || '');
                    setIsEditingTime(false);
                  }
                }}
                className="text-sm bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            ) : (
              <span className="flex items-center">
                <span 
                  className={`text-gray-500 text-sm ${canEdit ? 'cursor-pointer hover:text-blue-500 hover:bg-blue-50 px-1 rounded transition-colors' : ''}`}
                  onClick={(e) => {
                    if (!canEdit) return;
                    e.stopPropagation();
                    setEditTime(tweet.time || '');
                    setIsEditingTime(true);
                  }}
                >
                  {formatTimeForDisplay(tweet.time) || 'Set time'}
                </span>
                {isApproved && !editMode && tweet.time && (
                  <CopyIcon onClick={() => handleCopy(formatTimeForDisplay(tweet.time) || '', 'time')} />
                )}
              </span>
            )}
            {tweet.status !== 'draft' && (
              <>
                <span className="text-gray-500">·</span>
                <span className={`text-sm capitalize ${getStatusColor(tweet.status)}`}>
                  {tweet.status}
                </span>
              </>
            )}
          </div>

          {/* Tweet text / Edit area */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's happening?"
                className={`
                  w-full resize-none bg-transparent text-[15px] leading-relaxed
                  text-gray-900 placeholder-gray-500 focus:outline-none
                  min-h-[80px]
                `}
                rows={Math.max(3, editText.split('\n').length)}
              />
              
              {/* Everyone can reply */}
              <div className="flex items-center gap-2 text-blue-500 text-sm mt-2 pb-3 border-b border-gray-100">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-.25 10.48L10.5 17.5l-2-1.5v-3.5L7.25 9 12 5.5l4.75 3.5-1.25 3.5v3.5l-2 1.5-1.75-5.27z"/>
                </svg>
                <span>Everyone can reply</span>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  {/* Media icons */}
                  <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5.5C3 4.119 4.12 3 5.5 3h13C19.88 3 21 4.119 21 5.5v13c0 1.381-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.881 3 18.5v-13zM5.5 5c-.28 0-.5.224-.5.5v13c0 .276.22.5.5.5h13c.28 0 .5-.224.5-.5v-13c0-.276-.22-.5-.5-.5h-13zM18 10.711V9.25h-3.74v5.5h1.44v-1.719h1.7V11.57h-1.7v-.859H18zM11.79 9.25h1.44v5.5h-1.44v-5.5zm-3.07 1.375c.34 0 .77.172.77.172l.47-1.125s-.53-.297-1.34-.297c-1.09 0-1.81.672-1.81 1.828 0 1.047.65 1.547 1.17 1.813.52.265.88.343.88.687 0 .344-.23.547-.67.547-.44 0-.89-.188-.89-.188l-.4 1.125s.48.266 1.29.266c.89 0 1.84-.5 1.84-1.734 0-.922-.55-1.438-1.22-1.766-.69-.328-.82-.406-.82-.687 0-.266.23-.5.73-.641h.01-.01z"/>
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 9.5C8 8.119 8.672 7 9.5 7S11 8.119 11 9.5 10.328 12 9.5 12 8 10.881 8 9.5zm6.5 2.5c.828 0 1.5-1.119 1.5-2.5S15.328 7 14.5 7 13 8.119 13 9.5s.672 2.5 1.5 2.5zM12 16c-2.224 0-3.021-2.227-3.051-2.316l-1.897.633c.05.15 1.271 3.684 4.949 3.684s4.898-3.533 4.949-3.684l-1.896-.638c-.033.095-.83 2.322-3.054 2.322zm10.25-4.001c0 5.652-4.598 10.25-10.25 10.25S1.75 17.652 1.75 12 6.348 1.75 12 1.75 22.25 6.348 22.25 12zm-2 0c0-4.549-3.701-8.25-8.25-8.25S3.75 7.451 3.75 12s3.701 8.25 8.25 8.25 8.25-3.701 8.25-8.25z"/>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Character count */}
                  <div className="flex items-center gap-2">
                    {isNearLimit && (
                      <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`}>
                        {charRemaining}
                      </span>
                    )}
                    <div className="relative w-5 h-5">
                      <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke={isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#1d9bf0'}
                          strokeWidth="2"
                          strokeDasharray={`${charPercent * 0.503} 100`}
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  {/* Approve button */}
                  <button
                    onClick={handleApprove}
                    disabled={isOverLimit || !editText.trim()}
                    className={`
                      px-4 py-1.5 rounded-full font-bold text-sm transition-all
                      ${isOverLimit || !editText.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Display tweet text */}
              <div className="mt-1 flex items-start gap-1">
                <div
                  className={`flex-1 text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap ${canEdit ? 'cursor-text' : ''}`}
                  onClick={() => {
                    if (canEdit) setIsEditing(true);
                  }}
                >
                  {tweet.text}
                </div>
                {isApproved && !editMode && (
                  <CopyIcon onClick={() => handleCopy(tweet.text, 'text')} />
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between mt-3 -ml-2">
                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </button>

                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-green-50 text-gray-500 hover:text-green-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                </button>

                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-pink-50 text-gray-500 hover:text-pink-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>

                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </button>

                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </button>

                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </button>
              </div>

              {/* Approve/Edit button row */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                {tweet.status === 'draft' ? (
                  <button
                    onClick={handleApprove}
                    className="px-5 py-2 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

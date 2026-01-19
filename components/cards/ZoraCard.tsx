'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoraContent, ZoraStatus, ZORA_STATUS_STEPS, ZORA_STATUS_LABELS } from '@/lib/types';
import { formatTimeForDisplay } from '@/lib/parser';

interface ZoraCardProps {
  content: ZoraContent;
  onUpdate: (updates: Partial<ZoraContent>) => void;
  onDelete?: () => void;
  profileImage?: string;
  username?: string;
  isDragging?: boolean;
}

export function ZoraCard({
  content,
  onUpdate,
  onDelete,
  profileImage = '/avatar.jpg',
  username = 'truthops',
  isDragging = false,
}: ZoraCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(content.time || '');
  const [editTicker, setEditTicker] = useState(content.ticker?.replace(/^\$/, '') || '');
  const [editMode, setEditMode] = useState(false); // Edit mode for approved items
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  
  // Update local edit state when content changes
  useEffect(() => {
    setEditTicker(content.ticker?.replace(/^\$/, '') || '');
  }, [content.ticker]);

  const isApproved = content.status === 'posted';
  const canEdit = !isApproved || editMode;

  const handleSaveTime = () => {
    onUpdate({ time: editTime });
    setIsEditingTime(false);
  };

  const handleFieldApprove = (field: keyof ZoraContent, value: string) => {
    // Save field and approve in one step
    onUpdate({ [field]: value, status: 'posted' });
    setEditingField(null);
    setEditMode(false);
  };

  const handleStatusClick = (status: ZoraStatus) => {
    onUpdate({ status });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    
    onUpdate({
      mediaFile: {
        name: file.name,
        type: isVideo ? 'video' : 'image',
        url,
      },
      status: content.status === 'prompt' || content.status === 'reve' ? 'media' : content.status,
    });
  };

  const handleApprove = () => {
    onUpdate({ status: 'posted' });
    setEditMode(false);
  };

  const handleEdit = () => {
    // Toggle back to previous status (or prompt) and enable edit mode
    const previousStatus = currentStatusIndex > 0 ? ZORA_STATUS_STEPS[currentStatusIndex - 1] : 'prompt';
    onUpdate({ status: previousStatus });
    setEditMode(true);
  };

  const currentStatusIndex = ZORA_STATUS_STEPS.indexOf(content.status);
  
  // Ensure ticker always has $
  const displayTicker = content.ticker 
    ? (content.ticker.startsWith('$') ? content.ticker : `$${content.ticker}`)
    : null;

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
        bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all relative
        ${isDragging ? 'shadow-xl scale-[1.02] rotate-[-1deg]' : 'hover:shadow-md'}
      `}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this Zora post?')) {
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 overflow-hidden flex items-center justify-center">
            <span className="text-white text-xs font-semibold">K</span>
          </div>
          <span className="text-gray-900 font-medium text-sm">{username}</span>
          <span className="text-gray-400">·</span>
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
                  setEditTime(content.time || '');
                  setIsEditingTime(false);
                }
              }}
              autoFocus
              className="text-xs bg-violet-50 border border-violet-200 rounded px-2 py-0.5 text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            />
          ) : (
            <span className="flex items-center">
              <span 
                className={`text-gray-500 text-xs ${canEdit ? 'cursor-pointer hover:text-violet-500 hover:bg-violet-50 px-1 rounded transition-colors' : ''}`}
                onClick={(e) => {
                  if (!canEdit) return;
                  e.stopPropagation();
                  setEditTime(content.time || '');
                  setIsEditingTime(true);
                }}
              >
                {formatTimeForDisplay(content.time) || 'Set time'}
              </span>
              {isApproved && !editMode && content.time && (
                <CopyIcon onClick={() => handleCopy(formatTimeForDisplay(content.time) || '', 'time')} />
              )}
            </span>
          )}
        </div>
        <span className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full font-medium">
          {content.type === 'video' ? '🎬 Video' : '🖼️ Image'}
        </span>
      </div>

      {/* Media Frame */}
      <div 
        className="aspect-video relative bg-gray-50 cursor-pointer group border-b border-gray-100"
        onClick={() => fileInputRef.current?.click()}
      >
        {content.mediaFile ? (
          content.mediaFile.type === 'video' ? (
            <video 
              src={content.mediaFile.url} 
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img 
              src={content.mediaFile.url} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-violet-500 transition-colors">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium">Click to add {content.type}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={content.type === 'video' ? 'video/*' : 'image/*'}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-violet-600 font-mono text-sm font-bold">
            {displayTicker || '$TICKER'}
          </span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300"
              style={{ width: `${((currentStatusIndex + 1) / ZORA_STATUS_STEPS.length) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            {ZORA_STATUS_LABELS[content.status]}
          </span>
        </div>
        
        {/* Status Steps */}
        <div className="flex gap-1">
          {ZORA_STATUS_STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => handleStatusClick(step)}
              className={`
                flex-1 py-1.5 text-[10px] font-medium rounded transition-all uppercase tracking-wide
                ${i <= currentStatusIndex 
                  ? 'bg-violet-100 text-violet-700' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
              `}
            >
              {ZORA_STATUS_LABELS[step]}
            </button>
          ))}
        </div>
      </div>

      {/* Content Fields */}
      <div className="px-4 py-4 space-y-4">
        {/* Ticker */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">Ticker</label>
          {editingField === 'ticker' ? (
            <div>
              <input
                type="text"
                value={editTicker}
                onChange={(e) => {
                  setEditTicker(e.target.value.replace(/^\$/, ''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                    setEditTicker(content.ticker?.replace(/^\$/, '') || '');
                  }
                }}
                autoFocus
                className="w-full bg-gray-50 text-violet-600 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200"
                placeholder="TICKER"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    const tickerValue = editTicker ? '$' + editTicker.replace(/^\$/, '').toUpperCase() : '';
                    handleFieldApprove('ticker', tickerValue);
                  }}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div
                onClick={() => {
                  if (canEdit) setEditingField('ticker');
                }}
                className={`flex-1 text-violet-600 font-mono text-sm font-bold ${canEdit ? 'cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors' : ''}`}
              >
                {displayTicker || 'Click to add ticker'}
              </div>
              {isApproved && !editMode && displayTicker && (
                <CopyIcon onClick={() => handleCopy(displayTicker, 'ticker')} />
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">Title</label>
          {editingField === 'title' ? (
            <div>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => {
                  onUpdate({ title: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                autoFocus
                className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200"
                placeholder="Title"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleFieldApprove('title', content.title || '')}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div
                onClick={() => {
                  if (canEdit) setEditingField('title');
                }}
                className={`flex-1 text-gray-900 text-sm font-medium ${canEdit ? 'cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors' : ''}`}
              >
                {content.title || 'Click to add title'}
              </div>
              {isApproved && !editMode && content.title && (
                <CopyIcon onClick={() => handleCopy(content.title || '', 'title')} />
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">Description</label>
          {editingField === 'description' ? (
            <div>
              <textarea
                value={content.description}
                onChange={(e) => {
                  onUpdate({ description: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                autoFocus
                rows={3}
                className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200 resize-none"
                placeholder="Description"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleFieldApprove('description', content.description)}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <div
                onClick={() => {
                  if (canEdit) setEditingField('description');
                }}
                className={`flex-1 text-gray-600 text-sm ${canEdit ? 'cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors line-clamp-3' : 'line-clamp-3'}`}
              >
                {content.description || 'Click to add description'}
              </div>
              {isApproved && !editMode && content.description && (
                <CopyIcon onClick={() => handleCopy(content.description, 'description')} />
              )}
            </div>
          )}
        </div>

        {/* Script Text - Only for video type */}
        {content.type === 'video' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-gray-400 text-xs uppercase tracking-wide">Voice Script</label>
              {content.scriptText && (
                <button
                  onClick={() => handleCopy(content.scriptText || '', 'scriptText')}
                  className={`
                    text-xs px-2.5 py-1 rounded-full transition-all font-medium
                    ${copiedField === 'scriptText' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-700'}
                  `}
                >
                  {copiedField === 'scriptText' ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
            {editingField === 'scriptText' ? (
              <div>
                <textarea
                  value={content.scriptText || ''}
                  onChange={(e) => {
                    onUpdate({ scriptText: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  autoFocus
                  rows={6}
                  className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200 resize-none font-mono"
                  placeholder="Voice script text..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleFieldApprove('scriptText', content.scriptText || '')}
                    className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <div
                  onClick={() => {
                    if (canEdit) setEditingField('scriptText');
                  }}
                  className={`flex-1 text-gray-600 text-sm font-mono whitespace-pre-wrap ${canEdit ? 'cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors' : ''}`}
                  style={{ maxHeight: '120px', overflow: 'auto' }}
                >
                  {content.scriptText || 'Click to add voice script'}
                </div>
                {isApproved && !editMode && content.scriptText && (
                  <CopyIcon onClick={() => handleCopy(content.scriptText || '', 'scriptText')} />
                )}
              </div>
            )}
          </div>
        )}

        {/* REVE Prompt - Copyable */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-400 text-xs uppercase tracking-wide">REVE Prompt</label>
            {content.revePrompt && (
              <button
                onClick={() => handleCopy(content.revePrompt, 'revePrompt')}
                className={`
                  text-xs px-2.5 py-1 rounded-full transition-all font-medium
                  ${copiedField === 'revePrompt' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-700'}
                `}
              >
                {copiedField === 'revePrompt' ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
          {editingField === 'revePrompt' ? (
            <div>
              <textarea
                value={content.revePrompt}
                onChange={(e) => {
                  onUpdate({ revePrompt: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                autoFocus
                rows={5}
                className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200 resize-none"
                placeholder="REVE prompts..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleFieldApprove('revePrompt', content.revePrompt)}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                if (canEdit) setEditingField('revePrompt');
              }}
              className={`text-gray-500 text-xs font-mono ${canEdit ? 'cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors line-clamp-4 whitespace-pre-wrap' : 'line-clamp-4 whitespace-pre-wrap'}`}
            >
              {content.revePrompt || 'Click to add REVE prompt'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end">
        {content.status === 'posted' ? (
          <button
            onClick={handleEdit}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
        ) : (
          <button 
            onClick={handleApprove}
            className="px-5 py-2 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-all"
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );
}

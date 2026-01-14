'use client';

import { useState, useRef } from 'react';
import { ZoraContent, ZoraStatus, ZORA_STATUS_STEPS, ZORA_STATUS_LABELS } from '@/lib/types';
import { formatTimeForDisplay } from '@/lib/parser';

interface ZoraCardProps {
  content: ZoraContent;
  onUpdate: (updates: Partial<ZoraContent>) => void;
  profileImage?: string;
  username?: string;
  isDragging?: boolean;
}

export function ZoraCard({
  content,
  onUpdate,
  profileImage = '/avatar.jpg',
  username = 'truthops',
  isDragging = false,
}: ZoraCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(content.time || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleSaveTime = () => {
    onUpdate({ time: editTime });
    setIsEditingTime(false);
  };

  const handleFieldChange = (field: keyof ZoraContent, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleStatusClick = (status: ZoraStatus) => {
    onUpdate({ status });
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(content.revePrompt);
      setCopiedField('revePrompt');
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
  };

  const currentStatusIndex = ZORA_STATUS_STEPS.indexOf(content.status);
  
  // Ensure ticker always has $
  const displayTicker = content.ticker 
    ? (content.ticker.startsWith('$') ? content.ticker : `$${content.ticker}`)
    : null;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all
        ${isDragging ? 'shadow-xl scale-[1.02] rotate-[-1deg]' : 'hover:shadow-md'}
      `}
    >
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
            <span 
              className="text-gray-500 text-xs cursor-pointer hover:text-violet-500 hover:bg-violet-50 px-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setEditTime(content.time || '');
                setIsEditingTime(true);
              }}
            >
              {formatTimeForDisplay(content.time) || 'Set time'}
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
            <input
              type="text"
              value={content.ticker?.replace(/^\$/, '') || ''}
              onChange={(e) => handleFieldChange('ticker', '$' + e.target.value.replace(/^\$/, ''))}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
              autoFocus
              className="w-full bg-gray-50 text-violet-600 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200"
              placeholder="TICKER"
            />
          ) : (
            <div
              onClick={() => setEditingField('ticker')}
              className="text-violet-600 font-mono text-sm font-bold cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors"
            >
              {displayTicker || 'Click to add ticker'}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">Title</label>
          {editingField === 'title' ? (
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
              autoFocus
              className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200"
              placeholder="Title"
            />
          ) : (
            <div
              onClick={() => setEditingField('title')}
              className="text-gray-900 text-sm font-medium cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors"
            >
              {content.title || 'Click to add title'}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">Description</label>
          {editingField === 'description' ? (
            <textarea
              value={content.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => setEditingField(null)}
              autoFocus
              rows={3}
              className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200 resize-none"
              placeholder="Description"
            />
          ) : (
            <div
              onClick={() => setEditingField('description')}
              className="text-gray-600 text-sm cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors line-clamp-3"
            >
              {content.description || 'Click to add description'}
            </div>
          )}
        </div>

        {/* REVE Prompt - Copyable */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-400 text-xs uppercase tracking-wide">REVE Prompt</label>
            {content.revePrompt && (
              <button
                onClick={handleCopyPrompt}
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
            <textarea
              value={content.revePrompt}
              onChange={(e) => handleFieldChange('revePrompt', e.target.value)}
              onBlur={() => setEditingField(null)}
              autoFocus
              rows={5}
              className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-gray-200 resize-none"
              placeholder="REVE prompts..."
            />
          ) : (
            <div
              onClick={() => setEditingField('revePrompt')}
              className="text-gray-500 text-xs font-mono cursor-text hover:bg-gray-50 px-3 py-2 rounded-lg -mx-3 transition-colors line-clamp-4 whitespace-pre-wrap"
            >
              {content.revePrompt || 'Click to add REVE prompt'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end">
        <button 
          onClick={handleApprove}
          className={`
            px-5 py-2 rounded-full font-semibold text-sm transition-all
            ${content.status === 'posted'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'}
          `}
        >
          {content.status === 'posted' ? '✓ Approved' : 'Approve'}
        </button>
      </div>
    </div>
  );
}

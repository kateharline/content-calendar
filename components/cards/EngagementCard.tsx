'use client';

import { useState, useRef } from 'react';
import { EngagementBlock } from '@/lib/types';
import { formatTimeForDisplay } from '@/lib/parser';

interface EngagementCardProps {
  block: EngagementBlock;
  onUpdate: (updates: Partial<EngagementBlock>) => void;
}

export function EngagementCard({ block, onUpdate }: EngagementCardProps) {
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [isEditingEndTime, setIsEditingEndTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState(block.startTime);
  const [editEndTime, setEditEndTime] = useState(block.endTime);

  const handleToggleStatus = () => {
    onUpdate({ status: block.status === 'done' ? 'pending' : 'done' });
  };

  const handleSaveStartTime = () => {
    onUpdate({ startTime: editStartTime });
    setIsEditingStartTime(false);
  };

  const handleSaveEndTime = () => {
    onUpdate({ endTime: editEndTime });
    setIsEditingEndTime(false);
  };

  if (block.isSkipped) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl opacity-60">
        <span className="text-gray-400">❌</span>
        <span className="text-gray-500 text-sm">{block.skipReason || 'No engagement today'}</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        border rounded-xl transition-all
        ${block.status === 'done' 
          ? 'bg-green-50/50 border-green-200' 
          : 'bg-gray-50 border-dashed border-gray-200'}
      `}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <span className="text-gray-600 text-sm font-medium">Engagement Block</span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              {isEditingStartTime ? (
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  onBlur={handleSaveStartTime}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveStartTime();
                    if (e.key === 'Escape') {
                      setEditStartTime(block.startTime);
                      setIsEditingStartTime(false);
                    }
                  }}
                  autoFocus
                  className="text-xs bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 w-20"
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-amber-500 hover:bg-amber-50 px-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditStartTime(block.startTime);
                    setIsEditingStartTime(true);
                  }}
                >
                  {formatTimeForDisplay(block.startTime) || 'Set start'}
                </span>
              )}
              <span>–</span>
              {isEditingEndTime ? (
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  onBlur={handleSaveEndTime}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEndTime();
                    if (e.key === 'Escape') {
                      setEditEndTime(block.endTime);
                      setIsEditingEndTime(false);
                    }
                  }}
                  autoFocus
                  className="text-xs bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 w-20"
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-amber-500 hover:bg-amber-50 px-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditEndTime(block.endTime);
                    setIsEditingEndTime(true);
                  }}
                >
                  {formatTimeForDisplay(block.endTime) || 'Set end'}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${block.status === 'done'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {block.status === 'done' ? '✓ Done' : 'Mark Done'}
          </button>
        </div>

        {/* Instructions */}
        {block.instructions && (
          <p className="text-gray-700 text-sm mb-2">{block.instructions}</p>
        )}

        {/* Targets */}
        {block.targets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {block.targets.map((target, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600"
              >
                {target}
              </span>
            ))}
          </div>
        )}

        {/* Profile Links */}
        {block.profileLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {block.profileLinks.map((link, i) => (
              <a
                key={i}
                href={`https://twitter.com/${link.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-xs hover:underline"
              >
                {link}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


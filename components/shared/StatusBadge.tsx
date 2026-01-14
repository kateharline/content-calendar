'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Edit,
  CheckCircle2,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { TweetStatus, TWEET_STATUS_LABELS } from '@/lib/types';

interface StatusBadgeProps {
  status: TweetStatus;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<TweetStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-muted',
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  scheduled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  posted: 'bg-twitter/20 text-twitter border-twitter/30',
};

const STATUS_ICONS: Record<TweetStatus, React.ReactNode> = {
  draft: <Edit className="w-3 h-3" />,
  ready: <CheckCircle2 className="w-3 h-3" />,
  scheduled: <Clock className="w-3 h-3" />,
  posted: <Send className="w-3 h-3" />,
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`font-mono ${STATUS_COLORS[status]} ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
      }`}
    >
      {STATUS_ICONS[status]}
      <span className="ml-1">{TWEET_STATUS_LABELS[status]}</span>
    </Badge>
  );
}


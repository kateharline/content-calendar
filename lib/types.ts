// TruthOps Content Planner - Type Definitions

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' | 'Unassigned';

export type TweetStatus = 'draft' | 'approved' | 'scheduled' | 'posted';
export type ZoraStatus = 'prompt' | 'reve' | 'media' | 'metadata' | 'posted';
export type EngagementStatus = 'pending' | 'done';

// Main content item: a tweet to be posted
export interface TweetItem {
  id: string;
  day: DayOfWeek;
  time: string | null;
  text: string;
  status: TweetStatus;
  platform: 'twitter';
}

// Engagement block: time for outbound engagement (not content)
export interface EngagementBlock {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  platform: 'twitter';
  targets: string[];
  instructions: string;
  profileLinks: string[];
  status: EngagementStatus;
  isSkipped: boolean;
  skipReason?: string;
}

// Unified Zora content (works for both video and image)
export interface ZoraContent {
  id: string;
  type: 'video' | 'image';
  day: DayOfWeek;
  time: string | null; // Time for scheduling
  ticker: string | null;
  title: string | null;
  description: string;
  revePrompt: string; // All prompts in one copyable field
  mediaFile?: {
    name: string;
    type: 'image' | 'video';
    url: string;
  };
  status: ZoraStatus;
}

// Week metadata parsed from the doc header
export interface WeekMetadata {
  weekOf: string;
  theme: string | null;
  coreTension: string | null;
  weekType: string | null;
  systemOutcome: string | null;
}

// Parsed content from all three raw text inputs
export interface ParsedWeekPlan {
  metadata: WeekMetadata;
  tweets: TweetItem[];
  engagementBlocks: EngagementBlock[];
  zoraContent: ZoraContent[];
}

// Complete week plan stored in localStorage
export interface WeekPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  weekOf: string;
  tweetScheduleRaw: string;
  voiceActivationRaw: string;
  artifactRaw: string;
  parsed: ParsedWeekPlan;
}

// Timeline item for unified feed
export type TimelineItem = 
  | { type: 'tweet'; data: TweetItem }
  | { type: 'engagement'; data: EngagementBlock }
  | { type: 'zora'; data: ZoraContent };

// Day mapping utilities
export const DAY_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Unassigned'];

export const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday',
  'Unassigned': 'Unassigned'
};

export const FULL_NAME_TO_DAY: Record<string, DayOfWeek> = {
  'monday': 'Mon',
  'tuesday': 'Tue',
  'wednesday': 'Wed',
  'thursday': 'Thu',
  'friday': 'Fri',
  'saturday': 'Sat',
  'sunday': 'Sun',
};

// Status labels
export const ZORA_STATUS_STEPS: ZoraStatus[] = ['prompt', 'reve', 'media', 'metadata', 'posted'];

export const ZORA_STATUS_LABELS: Record<ZoraStatus, string> = {
  'prompt': 'Prompt',
  'reve': 'REVE',
  'media': 'Media',
  'metadata': 'Metadata',
  'posted': 'Posted'
};

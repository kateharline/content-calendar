// Frequency Content Publishing Suite - Type Definitions

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type PostStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed';
export type PostTime = 'midday' | 'evening';
export type CarouselType = 'midday' | 'evening';

export interface CarouselImage {
  id: string;
  url: string;          // Supabase Storage URL or local blob URL
  filename: string;
  order: number;        // Position in carousel (0-indexed)
  uploaded: boolean;    // Whether it's been uploaded to Supabase Storage
}

export interface InstagramPost {
  id: string;
  day: number;              // Day in arc (1-21)
  dayOfWeek: DayOfWeek;     // Mapped calendar day
  type: CarouselType;       // midday or evening
  title: string;            // e.g., "Day 1: The Map — Midday"
  caption: string;          // Instagram caption text
  images: CarouselImage[];  // 3-4 images for the carousel
  scheduledTime: string | null;  // ISO datetime for scheduling
  status: PostStatus;
  igContainerId: string | null;  // Instagram API container ID after creation
  igMediaId: string | null;      // Instagram API media ID after publishing
  igPermalink: string | null;    // Link to published post
  publishedAt: string | null;
  errorMessage: string | null;   // If publishing failed
}

export interface ArcPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  arcName: string;           // e.g., "Anxiety → Groundedness"
  startDate: string;         // First day of posting (ISO date)
  igAccountId: string | null; // Instagram Business Account ID
  igAccessToken: string | null; // Encrypted or stored separately
  posts: InstagramPost[];
}

export const POST_STATUS_STEPS: PostStatus[] = ['draft', 'review', 'approved', 'scheduled', 'published'];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

// Map arc day number to day of week based on start date
export function arcDayToDayOfWeek(dayNumber: number, startDate: string): DayOfWeek {
  const start = new Date(startDate);
  const target = new Date(start);
  target.setDate(start.getDate() + dayNumber - 1);
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[target.getDay()];
}

// Get calendar date for an arc day
export function arcDayToDate(dayNumber: number, startDate: string): Date {
  const start = new Date(startDate);
  const target = new Date(start);
  target.setDate(start.getDate() + dayNumber - 1);
  return target;
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

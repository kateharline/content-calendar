// TruthOps Content Planner - Best-effort Parser

import {
  TweetItem,
  EngagementBlock,
  ZoraContent,
  ParsedWeekPlan,
  WeekMetadata,
  DayOfWeek,
  FULL_NAME_TO_DAY,
} from './types';
import { generateId } from './storage';

/**
 * Parse time string to normalized format
 */
export function parseTime(timeStr: string): string | null {
  if (!timeStr) return null;
  
  let cleaned = timeStr.trim().toUpperCase();
  cleaned = cleaned.replace(/\s*(PST|PDT|EST|EDT|CST|CDT|MST|MDT|UTC|GMT)\s*/gi, '');
  
  if (cleaned.includes('–') || cleaned.includes('-')) {
    cleaned = cleaned.split(/[–-]/)[0].trim();
  }
  
  const timeWithMinutes = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeWithMinutes) {
    let hours = parseInt(timeWithMinutes[1], 10);
    const minutes = timeWithMinutes[2];
    const period = timeWithMinutes[3];
    
    if (period) {
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  const timeSimple = cleaned.match(/(\d{1,2})\s*(A|P|AM|PM)?/i);
  if (timeSimple) {
    let hours = parseInt(timeSimple[1], 10);
    const period = timeSimple[2];
    
    if (period) {
      const isPM = period.toUpperCase().startsWith('P');
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:00`;
  }
  
  return null;
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(time: string | null): string {
  if (!time) return '';
  
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  
  return `${hours}:${minutes} ${period}`;
}

/**
 * Parse day from text
 */
export function parseDay(dayStr: string): DayOfWeek {
  const cleaned = dayStr.toLowerCase().trim();
  
  for (const [fullName, abbrev] of Object.entries(FULL_NAME_TO_DAY)) {
    if (cleaned.includes(fullName)) {
      return abbrev;
    }
  }
  
  if (cleaned.includes('mon')) return 'Mon';
  if (cleaned.includes('tue')) return 'Tue';
  if (cleaned.includes('wed')) return 'Wed';
  if (cleaned.includes('thu')) return 'Thu';
  if (cleaned.includes('fri')) return 'Fri';
  if (cleaned.includes('sat')) return 'Sat';
  if (cleaned.includes('sun')) return 'Sun';
  
  return 'Unassigned';
}

/**
 * Parse engagement block targets
 */
function parseEngagementTargets(text: string): { targets: string[]; profileLinks: string[] } {
  const targets: string[] = [];
  const profileLinks: string[] = [];
  
  const lines = text.split(/[\n,;]/);
  
  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned) continue;
    
    const handles = cleaned.match(/@[\w_]+/g);
    if (handles) {
      profileLinks.push(...handles);
    }
    
    const topic = cleaned.replace(/^[-•*]\s*/, '').trim();
    if (topic && !topic.startsWith('@')) {
      targets.push(topic);
    }
  }
  
  return { targets, profileLinks };
}

/**
 * Parse the tweet schedule raw text
 */
export function parseTweetSchedule(raw: string): {
  metadata: WeekMetadata;
  tweets: TweetItem[];
  engagementBlocks: EngagementBlock[];
} {
  const metadata: WeekMetadata = {
    weekOf: '',
    theme: null,
    coreTension: null,
    weekType: null,
    systemOutcome: null,
  };
  
  const tweets: TweetItem[] = [];
  const engagementBlocks: EngagementBlock[] = [];
  
  const lines = raw.split('\n');
  
  let currentDay: DayOfWeek = 'Unassigned';
  let inEngagementBlock = false;
  let engagementStartTime = '';
  let engagementEndTime = '';
  let engagementTargets: string[] = [];
  let engagementInstructions = '';
  let engagementProfileLinks: string[] = [];
  let pendingTweetTime = '';
  let collectingTweetText = false;
  let currentTweetText = '';
  
  const savePendingTweet = () => {
    if (currentTweetText.trim()) {
      tweets.push({
        id: generateId(),
        day: currentDay,
        time: parseTime(pendingTweetTime),
        text: currentTweetText.trim(),
        status: 'draft',
        platform: 'twitter',
      });
    }
    currentTweetText = '';
    collectingTweetText = false;
  };
  
  const saveEngagementBlock = () => {
    if (engagementStartTime || engagementTargets.length > 0) {
      engagementBlocks.push({
        id: generateId(),
        day: currentDay,
        startTime: engagementStartTime,
        endTime: engagementEndTime,
        platform: 'twitter',
        targets: engagementTargets,
        instructions: engagementInstructions.trim(),
        profileLinks: engagementProfileLinks,
        status: 'pending',
        isSkipped: false,
      });
    }
    engagementStartTime = '';
    engagementEndTime = '';
    engagementTargets = [];
    engagementInstructions = '';
    engagementProfileLinks = [];
    inEngagementBlock = false;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (collectingTweetText && currentTweetText.trim()) {
        savePendingTweet();
      }
      continue;
    }
    
    if (trimmed.startsWith('Week of:')) {
      metadata.weekOf = trimmed.replace('Week of:', '').trim();
      continue;
    }
    if (trimmed.startsWith('Theme:')) {
      metadata.theme = trimmed.replace('Theme:', '').trim();
      continue;
    }
    if (trimmed.startsWith('Core Tension:')) {
      metadata.coreTension = trimmed.replace('Core Tension:', '').trim();
      continue;
    }
    if (trimmed.startsWith('Week Type:')) {
      metadata.weekType = trimmed.replace('Week Type:', '').trim();
      continue;
    }
    if (trimmed.startsWith('System Outcome:')) {
      metadata.systemOutcome = trimmed.replace('System Outcome:', '').trim();
      continue;
    }
    
    const dayMatch = trimmed.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s*[—–-]\s*(.+)$/i);
    if (dayMatch) {
      savePendingTweet();
      saveEngagementBlock();
      currentDay = parseDay(dayMatch[1]);
      inEngagementBlock = false;
      continue;
    }
    
    if (trimmed === 'Posting Schedule') {
      savePendingTweet();
      inEngagementBlock = false;
      continue;
    }
    
    if (trimmed.toLowerCase().includes('engagement block')) {
      savePendingTweet();
      saveEngagementBlock();
      inEngagementBlock = true;
      continue;
    }
    
    if (inEngagementBlock && trimmed.includes('❌')) {
      const reason = lines[i + 1]?.trim() || '';
      engagementBlocks.push({
        id: generateId(),
        day: currentDay,
        startTime: '',
        endTime: '',
        platform: 'twitter',
        targets: [],
        instructions: reason,
        profileLinks: [],
        status: 'done',
        isSkipped: true,
        skipReason: reason,
      });
      inEngagementBlock = false;
      continue;
    }
    
    if (inEngagementBlock) {
      const timeRangeMatch = trimmed.match(/^(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
      if (timeRangeMatch) {
        const period = timeRangeMatch[3] || 'AM';
        engagementStartTime = parseTime(timeRangeMatch[1] + ' ' + period) || '';
        engagementEndTime = parseTime(timeRangeMatch[2] + ' ' + period) || '';
        continue;
      }
      
      if (trimmed.startsWith('Engage with') || trimmed.startsWith('Reply to') || trimmed.startsWith('Quote-post')) {
        engagementInstructions = trimmed;
        continue;
      }
      
      if (trimmed.match(/^[-•*]?\s*\w/) && !trimmed.includes(':')) {
        const { targets, profileLinks } = parseEngagementTargets(trimmed);
        engagementTargets.push(...targets);
        engagementProfileLinks.push(...profileLinks);
        continue;
      }
      
      if (!trimmed.match(/^\d/)) {
        if (engagementInstructions) {
          engagementInstructions += ' ' + trimmed;
        } else {
          engagementInstructions = trimmed;
        }
        continue;
      }
    }
    
    const tweetHeaderMatch = trimmed.match(/^(Anchor Copy|Micro-post|Quote-post)\s*\((\d{1,2}:\d{2}\s*(?:AM|PM)?)\)/i);
    if (tweetHeaderMatch) {
      savePendingTweet();
      pendingTweetTime = tweetHeaderMatch[2];
      collectingTweetText = true;
      continue;
    }
    
    if (collectingTweetText) {
      if (trimmed.match(/^(Anchor Copy|Micro-post|Quote-post|Engagement Block|Posting Schedule|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i)) {
        savePendingTweet();
        i--;
        continue;
      }
      
      if (currentTweetText) {
        currentTweetText += '\n' + trimmed;
      } else {
        currentTweetText = trimmed;
      }
      continue;
    }
  }
  
  savePendingTweet();
  saveEngagementBlock();
  
  return { metadata, tweets, engagementBlocks };
}

/**
 * Parse voice activation and artifact into unified ZoraContent
 */
export function parseZoraContent(voiceRaw: string, artifactRaw: string): ZoraContent[] {
  const content: ZoraContent[] = [];
  
  // Parse voice activation (video)
  if (voiceRaw.trim()) {
    let scriptText = '';
    let revePrompts: string[] = [];
    let zoraCaption = '';
    
    const lines = voiceRaw.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.match(/^1\.\s*(Final\s+)?Voice\s+Script/i)) {
        currentSection = 'script';
        continue;
      }
      if (trimmed.match(/^2\.\s*REVE/i) || trimmed.match(/^REVE\s*[—–-]/i)) {
        currentSection = 'reve';
        continue;
      }
      if (trimmed.match(/^3\.\s*Overall\s+Style/i)) {
        currentSection = 'style';
        continue;
      }
      if (trimmed.match(/^(4\.\s*)?Zora\s+Caption/i)) {
        currentSection = 'caption';
        continue;
      }
      
      switch (currentSection) {
        case 'script':
          if (!trimmed.match(/^\(locked\)$/i)) {
            scriptText += (scriptText ? '\n' : '') + trimmed;
          }
          break;
        case 'reve':
        case 'style':
          revePrompts.push(trimmed);
          break;
        case 'caption':
          zoraCaption += (zoraCaption ? '\n' : '') + trimmed;
          break;
      }
    }
    
    content.push({
      id: generateId(),
      type: 'video',
      day: 'Mon', // Default to Monday, can be moved
      ticker: null,
      title: 'Voice Activation',
      description: zoraCaption || scriptText,
      revePrompt: revePrompts.join('\n\n'),
      status: revePrompts.length > 0 ? 'reve' : 'prompt',
    });
  }
  
  // Parse artifact (image)
  if (artifactRaw.trim()) {
    let ticker: string | null = null;
    let description = '';
    let piecePrompt = '';
    
    const lines = artifactRaw.split('\n');
    let currentSection = 'prompt';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const tickerMatch = trimmed.match(/^\$(\w+)/);
      if (tickerMatch) {
        ticker = '$' + tickerMatch[1];
        continue;
      }
      
      if (trimmed.match(/^2\.\s*REFINED/i) || trimmed.match(/DESCRIPTION/i)) {
        currentSection = 'description';
        continue;
      }
      if (trimmed.match(/^3\.\s*EXPLICIT/i) || trimmed.match(/USAGE/i)) {
        currentSection = 'usage';
        continue;
      }
      
      switch (currentSection) {
        case 'prompt':
          piecePrompt += (piecePrompt ? '\n' : '') + trimmed;
          break;
        case 'description':
        case 'usage':
          description += (description ? '\n' : '') + trimmed;
          break;
      }
    }
    
    content.push({
      id: generateId(),
      type: 'image',
      day: 'Mon', // Default to Monday
      ticker,
      title: 'Artifact',
      description,
      revePrompt: piecePrompt,
      status: piecePrompt ? 'prompt' : 'prompt',
    });
  }
  
  return content;
}

/**
 * Main parser function
 */
export function parseAllContent(
  tweetScheduleRaw: string,
  voiceActivationRaw: string,
  artifactRaw: string
): ParsedWeekPlan {
  const { metadata, tweets, engagementBlocks } = parseTweetSchedule(tweetScheduleRaw);
  const zoraContent = parseZoraContent(voiceActivationRaw, artifactRaw);
  
  return {
    metadata,
    tweets,
    engagementBlocks,
    zoraContent,
  };
}

/**
 * Convert time to minutes for sorting
 */
export function timeToMinutes(time: string | null): number {
  if (!time) return -1; // Put items without time at the top
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

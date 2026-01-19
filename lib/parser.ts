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
    let styleBlock: string[] = [];
    let zoraCaption = '';
    let currentSceneTitle = '';
    let currentSceneContent: string[] = [];
    
    const lines = voiceRaw.split('\n');
    let currentSection = '';
    
    const saveCurrentScene = () => {
      if (currentSceneTitle && currentSceneContent.length > 0) {
        revePrompts.push(`${currentSceneTitle}\n${currentSceneContent.join('\n')}`);
      } else if (currentSceneContent.length > 0) {
        revePrompts.push(currentSceneContent.join('\n'));
      }
      currentSceneTitle = '';
      currentSceneContent = [];
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect section headers - be more flexible with patterns
      if (trimmed.match(/^1\.\s*(Final\s+)?Voice\s+Script/i) || 
          trimmed.match(/Voice\s+Script\s*\(?locked\)?/i)) {
        saveCurrentScene();
        currentSection = 'script';
        // Skip the "(locked)" line if it's on the next line
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^\(locked\)$/i)) {
          i++;
        }
        continue;
      }
      if (trimmed.match(/^2\.\s*REVE/i) || 
          trimmed.match(/^REVE\s*[—–-]/i) ||
          trimmed.match(/Scene-by-Scene\s+Prompts/i)) {
        saveCurrentScene();
        currentSection = 'reve';
        continue;
      }
      if (trimmed.match(/^3\.\s*Overall\s+Style/i) || 
          trimmed.match(/^Overall\s+Style\s+Block/i) ||
          trimmed.match(/^Style\s+Block/i)) {
        saveCurrentScene();
        currentSection = 'style';
        continue;
      }
      if (trimmed.match(/^(4\.\s*)?Zora\s+Caption/i) ||
          trimmed.match(/^Zora\s+Description/i)) {
        saveCurrentScene();
        currentSection = 'caption';
        continue;
      }
      
      // Skip locked indicator on its own line
      if (trimmed.match(/^\(locked\)$/i)) {
        continue;
      }
      
      // Detect scene headers in REVE section (e.g., "Scene 1 — Containment")
      if (currentSection === 'reve' && trimmed.match(/^Scene\s+\d+\s*[—–-]/i)) {
        saveCurrentScene();
        currentSceneTitle = trimmed;
        continue;
      }
      
      // Handle content - preserve empty lines for multi-line content
      switch (currentSection) {
        case 'script':
          if (scriptText) {
            scriptText += '\n' + (trimmed || '');
          } else {
            scriptText = trimmed || '';
          }
          break;
        case 'reve':
          if (trimmed) {
            currentSceneContent.push(trimmed);
          } else if (currentSceneContent.length > 0) {
            // Preserve empty lines within scenes
            currentSceneContent.push('');
          }
          break;
        case 'style':
          if (trimmed) {
            styleBlock.push(trimmed);
          } else if (styleBlock.length > 0) {
            styleBlock.push('');
          }
          break;
        case 'caption':
          if (zoraCaption) {
            zoraCaption += '\n' + (trimmed || '');
          } else {
            zoraCaption = trimmed || '';
          }
          break;
      }
    }
    
    // Save any remaining scene
    saveCurrentScene();
    
    // Combine REVE prompts and style block
    const allPrompts: string[] = [];
    if (revePrompts.length > 0) {
      allPrompts.push('--- REVE Scene Prompts ---');
      allPrompts.push(...revePrompts);
    }
    if (styleBlock.length > 0) {
      allPrompts.push('\n--- Style Block ---');
      allPrompts.push(styleBlock.join('\n'));
    }
    
    content.push({
      id: generateId(),
      type: 'video',
      day: 'Mon', // Default to Monday, can be moved
      time: null,
      ticker: null,
      title: 'Voice Activation',
      description: zoraCaption,
      scriptText: scriptText,
      revePrompt: allPrompts.join('\n\n'),
      status: revePrompts.length > 0 ? 'reve' : 'prompt',
    });
  }
  
  // Parse artifact (image)
  if (artifactRaw.trim()) {
    let ticker: string | null = null;
    let title = 'Artifact';
    let description = '';
    let piecePrompt = '';
    let usageInstructions = '';
    
    const lines = artifactRaw.split('\n');
    let currentSection = 'prompt';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Extract ticker (e.g., $TICKER or $Ticker)
      const tickerMatch = trimmed.match(/^\$(\w+)\s*$/);
      if (tickerMatch) {
        ticker = '$' + tickerMatch[1].toUpperCase();
        continue;
      }
      
      // Detect section headers
      if (trimmed.match(/^1\.\s*/i) && trimmed.match(/layout|prompt/i)) {
        currentSection = 'prompt';
        continue;
      }
      if (trimmed.match(/^2\.\s*REFINED/i) || 
          trimmed.match(/DESCRIPTION\s+COPY/i) ||
          trimmed.match(/ZORA\s+DESCRIPTION/i)) {
        currentSection = 'description';
        continue;
      }
      if (trimmed.match(/^3\.\s*EXPLICIT/i) || 
          trimmed.match(/USAGE\s+INSTRUCTIONS/i) ||
          trimmed.match(/How\s+to\s+use/i)) {
        currentSection = 'usage';
        continue;
      }
      
      // Skip header lines that aren't content
      if (trimmed.match(/^Header\s*\(/i) ||
          trimmed.match(/^Main\s+body\s*\(/i) ||
          trimmed.match(/^(Quadrant|Timing|Method|Rule)\s*$/i)) {
        continue;
      }
      
      switch (currentSection) {
        case 'prompt':
          piecePrompt += (piecePrompt ? '\n' : '') + trimmed;
          break;
        case 'description':
          description += (description ? '\n' : '') + trimmed;
          break;
        case 'usage':
          usageInstructions += (usageInstructions ? '\n' : '') + trimmed;
          break;
      }
    }
    
    // Combine description and usage if both present
    const fullDescription = description + (usageInstructions ? '\n\n--- Usage ---\n' + usageInstructions : '');
    
    content.push({
      id: generateId(),
      type: 'image',
      day: 'Mon', // Default to Monday
      time: null,
      ticker,
      title,
      description: fullDescription,
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

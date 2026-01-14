// TruthOps Parser - Test Cases
// Run with: npx ts-node lib/parser.test.ts
// Or check output in browser console

import { parseTime, parseDay, parseTweetSchedule, parseVoiceActivation, parseArtifact } from './parser';

// Sample raw inputs based on Kate's real format
const SAMPLE_TWEET_SCHEDULE = `TRUTHOPS — WEEKLY EXECUTION DOC
Week of: Monday Jan 19 → Friday Jan 23, 2026 (PST)
Theme: False Urgency vs Intuition
Core Tension: Grit misapplied to outcomes creates noise, not progress
Week Type: Feminine → Masculine blend (discernment → precision)
System Outcome: Restore signal clarity after agency is already active
MONDAY — DIAGNOSIS: FALSE URGENCY ENTERS THE SYSTEM
Narrative Function: Name the distortion.
Goal: Separate urgency from importance.
Posting Schedule
8:10 AM — Anchor Post
11:45 AM — Micro-post
2:20 PM — Micro-post
Anchor Copy (8:10 AM)
False urgency feels like responsibility.
It's usually fear wearing a calendar.
Not everything that feels "now" is real.
Some things are just loud.
Micro-post (11:45 AM)
Urgency accelerates motion.
Clarity accelerates outcomes.
They are not the same.
Micro-post (2:20 PM)
If everything is urgent, nothing is precise.
Engagement Block (Outbound — Twitter)
9:00–9:20 AM
Engage with 2–3 founders posting about:
speed
hustle
pressure timelines
Replies should reflect, not advise.
TUESDAY — COST: WHEN GRIT POINTS AT THE WRONG TARGET
Narrative Function: Reveal misallocated effort.
Goal: Break the romance with endurance-for-its-own-sake.
Posting Schedule
8:15 AM — Anchor Post
12:00 PM — Micro-post
4:40 PM — Micro-post
Anchor Copy (8:15 AM)
Grit isn't always virtuous.
When grit is aimed at the outcome,
it hardens identity
and delays correction.
Micro-post (12:00 PM)
Persistence without recalibration
is just slow failure.
Micro-post (4:40 PM)
Endurance is useful.
Stubbornness is expensive.
Engagement Block (Outbound — Twitter)
1:00–1:15 PM
Quote-post one creator glorifying grind
Add a single clarifying line (no thread)
FRIDAY — CLOSURE + PIVOT READY
Narrative Function: Close the loop without lingering.
Goal: Complete the theme and open space for a new domain.
Posting Schedule
8:00 AM — Anchor Post
1:10 PM — Micro-post
Anchor Copy (8:00 AM)
Urgency is not commitment.
Grit is not wisdom.
Intuition is not softness.
You now know how to tell the difference.
Next week, we change focus.
Different failure mode. Same operating system.
Micro-post (1:10 PM)
When clarity returns,
pressure fades on its own.
Engagement Block
❌ None
Friday is for integration, not amplification.`;

const SAMPLE_VOICE_ACTIVATION = `TRUTHOPS — VOICE ACTIVATION (REVISION)
1. Final Voice Script (locked)
When you ask why, you hand control to the story.
When you ask how, you return to mechanics.
The shift feels subtle at first—less emotion, more friction.
You stop protecting your position and start choosing one.
You move closer to capable people, not to be saved, but to be shaped.
Proximity replaces fantasy. Exposure replaces armor.
Choose the question that produces movement.
Then place yourself where momentum already exists.
2. REVE — Scene-by-Scene Prompts
Scene 1 — Containment
A smooth stone sphere enclosed by a thin translucent shell. Light presses from the outside, diffused and distant. Stillness feels deliberate, guarded.
Scene 2 — Decision Point
A single seam appears in the shell. Not cracking—opening. The sphere shifts slightly toward a brighter region nearby.
Scene 3 — Proximity
The shell dissolves as the sphere enters a field of larger, heavier stone forms in slow orbit. Their gravity subtly alters its path.
Scene 4 — Alignment
The smaller sphere stabilizes into the shared motion. No collision, no dominance—just synchronized movement, steady and inevitable.
3. Overall Style Block
Abstract, hyper-realistic physics.
Palette: stone, off-white, muted blue, charcoal.
Slow orbital motion, restrained energy.
Soft directional light, shallow depth.
No text, no faces, no interfaces.
Power communicated through mass, proximity, and alignment—not force.
Zora Caption
Most people stay stuck because they ask questions that preserve the story.
Why explains. How moves.
This is the moment you stop protecting your position and start claiming one.
Not by force. By placement.
Momentum is already moving.
The work is choosing to stand where it can carry you.`;

const SAMPLE_ARTIFACT = `Exact layout / prompts (visual-first)
Header (top, small, centered)
SYSTEM DIAGNOSTIC
TRUTH UPGRADE
Thin divider line beneath.
Main body (the plate)
A 2×2 grid, evenly spaced, thin lines.
Each quadrant has:
a label
open negative space, not lines
Quadrant 1 (top left)
ACTIVE ASSUMPTIONS
(3)
Small subtext:
Background processes currently running.
—
Quadrant 2 (top right)
ORIGIN SOURCE
Small subtext:
Where this logic was installed.
—
Quadrant 3 (bottom left)
SUPPRESSED TRUTH
Small subtext:
Known. Avoided. Costly.
—
Quadrant 4 (bottom right)
SYSTEM SIMPLIFICATION
Small subtext:
What drops immediately.
—
No arrows.
No flow implied.
The user discovers the sequence themselves.

$TRUTH

2. REFINED ZORA DESCRIPTION COPY (FRONT-FACING)
Success rarely fails because of effort.
It fails because an assumption is being protected that can't survive pressure.
This artifact is a system diagnostic — not for your habits, but for the logic running underneath them.
Use it at the beginning of the week, before you add anything new. Identify the assumptions currently operating. Trace where they came from. Name the truth you already know but have been postponing.
Truth is expensive upfront. It costs comfort and identity.
But it removes entire categories of effort.
When something false is uninstalled, execution doesn't get easier.
It gets simpler.
And simplicity compounds.
3. EXPLICIT USAGE INSTRUCTIONS (BACK OR SECOND PANEL)
How to use this diagnostic
Timing
Use once per week, before planning or optimization.
Method
Write briefly. Literally. No essays.
In Active Assumptions, log the beliefs you are currently operating from — not what you wish were true.
In Origin Source, note where each assumption was installed (experience, inheritance, fear, past success).
In Suppressed Truth, write the sentence you keep avoiding because it threatens the current system.
In System Simplification, list what immediately becomes unnecessary if that truth is admitted.
Rule
If nothing feels uncomfortable, you are not done.
This is not about self-critique.
It is about reducing hidden system load.`;

// Test functions
function testParseTime() {
  console.log('=== parseTime tests ===');
  
  const tests = [
    { input: '9am', expected: '09:00' },
    { input: '9:30 AM', expected: '09:30' },
    { input: '14:00', expected: '14:00' },
    { input: '2p', expected: '14:00' },
    { input: '2 pm PST', expected: '14:00' },
    { input: '8:10 AM', expected: '08:10' },
    { input: '11:45 AM', expected: '11:45' },
    { input: '9:00–9:20 AM', expected: '09:00' },
    { input: '1:00–1:15 PM', expected: '13:00' },
  ];
  
  for (const { input, expected } of tests) {
    const result = parseTime(input);
    const pass = result === expected;
    console.log(`  ${pass ? '✓' : '✗'} parseTime("${input}") = "${result}" (expected: "${expected}")`);
  }
}

function testParseDay() {
  console.log('=== parseDay tests ===');
  
  const tests = [
    { input: 'MONDAY', expected: 'Mon' },
    { input: 'tuesday', expected: 'Tue' },
    { input: 'Wed', expected: 'Wed' },
    { input: '1/14 Mon', expected: 'Mon' },
    { input: 'FRIDAY — CLOSURE', expected: 'Fri' },
    { input: 'unknown', expected: 'Unassigned' },
  ];
  
  for (const { input, expected } of tests) {
    const result = parseDay(input);
    const pass = result === expected;
    console.log(`  ${pass ? '✓' : '✗'} parseDay("${input}") = "${result}" (expected: "${expected}")`);
  }
}

function testParseTweetSchedule() {
  console.log('=== parseTweetSchedule tests ===');
  
  const result = parseTweetSchedule(SAMPLE_TWEET_SCHEDULE);
  
  // Test metadata
  console.log('  Metadata:');
  console.log(`    weekOf: "${result.metadata.weekOf}"`);
  console.log(`    theme: "${result.metadata.theme}"`);
  console.log(`    coreTension: "${result.metadata.coreTension}"`);
  
  // Test tweets
  console.log(`  Tweets: ${result.tweets.length} found`);
  for (const tweet of result.tweets.slice(0, 3)) {
    console.log(`    - [${tweet.day} ${tweet.time}] ${tweet.postType}: "${tweet.text.slice(0, 40)}..."`);
  }
  
  // Test engagement blocks
  console.log(`  Engagement Blocks: ${result.engagementBlocks.length} found`);
  for (const block of result.engagementBlocks.slice(0, 2)) {
    if (block.isSkipped) {
      console.log(`    - [${block.day}] SKIPPED: "${block.skipReason}"`);
    } else {
      console.log(`    - [${block.day} ${block.startTime}-${block.endTime}] targets: ${block.targets.join(', ')}`);
    }
  }
  
  return result;
}

function testParseVoiceActivation() {
  console.log('=== parseVoiceActivation tests ===');
  
  const result = parseVoiceActivation(SAMPLE_VOICE_ACTIVATION);
  
  if (result) {
    console.log(`  Script length: ${result.scriptText.length} chars`);
    console.log(`  Script preview: "${result.scriptText.slice(0, 60)}..."`);
    console.log(`  REVE Scenes: ${result.revePrompts.length}`);
    for (const scene of result.revePrompts) {
      console.log(`    - Scene ${scene.sceneNumber}: ${scene.title}`);
    }
    console.log(`  Style block: ${result.styleBlock.slice(0, 50)}...`);
    console.log(`  Zora caption: ${result.zoraCaption.slice(0, 50)}...`);
    console.log(`  Status: ${result.status}`);
  }
  
  return result;
}

function testParseArtifact() {
  console.log('=== parseArtifact tests ===');
  
  const result = parseArtifact(SAMPLE_ARTIFACT);
  
  if (result) {
    console.log(`  Ticker: ${result.ticker}`);
    console.log(`  Title: ${result.title}`);
    console.log(`  Piece prompt length: ${result.piecePrompt?.length || 0} chars`);
    console.log(`  Description length: ${result.description.length} chars`);
    console.log(`  Usage instructions: ${result.usageInstructions ? 'present' : 'missing'}`);
    console.log(`  Status: ${result.status}`);
  }
  
  return result;
}

// Export test runner for browser
export function runAllTests() {
  console.log('\\n🧪 TruthOps Parser Test Suite\\n');
  
  testParseTime();
  console.log('');
  testParseDay();
  console.log('');
  testParseTweetSchedule();
  console.log('');
  testParseVoiceActivation();
  console.log('');
  testParseArtifact();
  
  console.log('\\n✅ All tests completed\\n');
}

// Export sample data for testing
export { SAMPLE_TWEET_SCHEDULE, SAMPLE_VOICE_ACTIVATION, SAMPLE_ARTIFACT };


import { describe, expect, it } from 'vitest';
import {
  clampSkip,
  computeTimelineBlocks,
  findActiveIndex,
  formatClock,
  formatRemaining,
  fractionFromX,
  hasSpeakers,
  isVoiceRecording,
  alignSegmentsToSpeech,
  mergeTranscriptTurns,
  parseFileTranscription,
  resolveTimelineDuration,
  speakerLabel,
  spokenCharCount,
  type TranscriptSegment,
} from './transcript-player';

const conversation: TranscriptSegment[] = [
  { start: 0, end: 4, text: 'Hi there.', speaker: 'ai' },
  { start: 4, end: 7, text: 'How are you?', speaker: 'ai' },
  { start: 7.5, end: 12, text: 'Good, thanks.', speaker: 'user' },
  { start: 12, end: 20, text: 'Tell me about your day.', speaker: 'ai' },
];

describe('parseFileTranscription', () => {
  it('keeps valid segments, sorts them and drops junk', () => {
    const parsed = parseFileTranscription({
      full_text: ' Hello world ',
      segments: [
        { start: 5, end: 8, text: 'world', speaker: 'user' },
        { start: '1', end: '4', text: ' Hello ' },
        { start: 9, end: 10, text: '   ' },
        { start: null, end: 3, text: 'no start' },
        { start: 11, end: 9, text: 'end before start', speaker: 'robot' },
        null,
      ],
    });
    expect(parsed?.fullText).toBe('Hello world');
    expect(parsed?.segments).toEqual([
      { start: 1, end: 4, text: 'Hello' },
      { start: 5, end: 8, text: 'world', speaker: 'user' },
      { start: 11, end: 11, text: 'end before start' },
    ]);
  });

  it('returns null for empty or invalid payloads', () => {
    expect(parseFileTranscription(null)).toBeNull();
    expect(parseFileTranscription('text')).toBeNull();
    expect(parseFileTranscription({ full_text: '', segments: [] })).toBeNull();
  });
});

describe('findActiveIndex', () => {
  it('finds the last segment that has started', () => {
    expect(findActiveIndex(conversation, 0)).toBe(0);
    expect(findActiveIndex(conversation, 3.9)).toBe(0);
    expect(findActiveIndex(conversation, 4)).toBe(1);
    expect(findActiveIndex(conversation, 7.2)).toBe(1); // gap keeps the previous segment
    expect(findActiveIndex(conversation, 7.5)).toBe(2);
    expect(findActiveIndex(conversation, 999)).toBe(3);
  });

  it('returns -1 before the first segment or with no segments', () => {
    expect(findActiveIndex([{ start: 2 }], 1)).toBe(-1);
    expect(findActiveIndex([], 10)).toBe(-1);
    expect(findActiveIndex(conversation, Number.NaN)).toBe(-1);
  });

  it('agrees with a linear scan on a large list', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ start: i * 1.5 }));
    for (const t of [0, 0.7, 1.5, 100.2, 748.5, 1000]) {
      let expected = -1;
      items.forEach((item, i) => { if (item.start <= t) expected = i; });
      expect(findActiveIndex(items, t)).toBe(expected);
    }
  });
});

describe('mergeTranscriptTurns', () => {
  it('merges consecutive segments of the same speaker', () => {
    const turns = mergeTranscriptTurns(conversation);
    expect(turns.map((t) => [t.speaker, t.start, t.end, t.text])).toEqual([
      ['ai', 0, 7, 'Hi there. How are you?'],
      ['user', 7.5, 12, 'Good, thanks.'],
      ['ai', 12, 20, 'Tell me about your day.'],
    ]);
    expect(new Set(turns.map((t) => t.id)).size).toBe(3);
  });

  it('keeps speakerless voice-note segments separate', () => {
    const turns = mergeTranscriptTurns([
      { start: 0, end: 3, text: 'One.' },
      { start: 3, end: 6, text: 'Two.' },
    ]);
    expect(turns).toHaveLength(2);
    expect(turns[1].speaker).toBeUndefined();
  });

  it('handles an empty list', () => {
    expect(mergeTranscriptTurns([])).toEqual([]);
  });
});

describe('computeTimelineBlocks', () => {
  it('maps segments to track fractions', () => {
    const blocks = computeTimelineBlocks(conversation, 20);
    expect(blocks).toHaveLength(4);
    expect(blocks[0]).toEqual({ key: 'block-0', left: 0, width: 0.2, speaker: 'ai' });
    expect(blocks[2].left).toBeCloseTo(0.375);
    expect(blocks[2].width).toBeCloseTo(0.225);
  });

  it('clamps blocks that run past the duration and drops empty ones', () => {
    const blocks = computeTimelineBlocks(
      [
        { start: 8, end: 14, text: 'overrun' },
        { start: 12, end: 15, text: 'after the end' },
        { start: 3, end: 3, text: 'zero width' },
      ],
      10,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].left).toBeCloseTo(0.8);
    expect(blocks[0].width).toBeCloseTo(0.2);
  });

  it('returns nothing without a duration', () => {
    expect(computeTimelineBlocks(conversation, 0)).toEqual([]);
    expect(computeTimelineBlocks(conversation, Number.NaN)).toEqual([]);
  });

  it('falls back to the transcript end for the layout duration', () => {
    expect(resolveTimelineDuration(42, conversation)).toBe(42);
    expect(resolveTimelineDuration(0, conversation)).toBe(20);
    expect(resolveTimelineDuration(0, [])).toBe(0);
  });
});

describe('time formatting', () => {
  it('formats elapsed time as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(111.9)).toBe('01:51');
    expect(formatClock(599)).toBe('09:59');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-4)).toBe('00:00');
    expect(formatClock(Number.NaN)).toBe('00:00');
  });

  it('formats remaining time as -mm:ss', () => {
    expect(formatRemaining(111, 314)).toBe('-03:23');
    expect(formatRemaining(0, 65.6)).toBe('-01:05');
    expect(formatRemaining(400, 314)).toBe('-00:00');
    expect(formatRemaining(10, 0)).toBe('-00:00');
  });
});

describe('seeking', () => {
  it('clamps skips to the file', () => {
    expect(clampSkip(10, 5, 60)).toBe(15);
    expect(clampSkip(58, 5, 60)).toBe(60);
    expect(clampSkip(3, -5, 60)).toBe(0);
    expect(clampSkip(30, 5, 0)).toBe(35);
    expect(clampSkip(Number.NaN, -5, 60)).toBe(0);
  });

  it('converts touch positions to track fractions', () => {
    expect(fractionFromX(50, 200)).toBe(0.25);
    expect(fractionFromX(-10, 200)).toBe(0);
    expect(fractionFromX(260, 200)).toBe(1);
    expect(fractionFromX(10, 0)).toBe(0);
  });
});

describe('labels and eligibility', () => {
  it('names speakers', () => {
    expect(speakerLabel('user')).toBe('You');
    expect(speakerLabel('ai')).toBe('Memento');
    expect(speakerLabel()).toBeNull();
    expect(hasSpeakers(conversation)).toBe(true);
    expect(hasSpeakers([{ start: 0, end: 1, text: 'a' }])).toBe(false);
  });

  it('treats voice notes and voice_*.m4a files as transcribable', () => {
    expect(isVoiceRecording({ isVoice: true, name: 'anything.mp3' })).toBe(true);
    expect(isVoiceRecording({ name: 'voice_1730000000000.m4a' })).toBe(true);
    expect(isVoiceRecording({ name: 'VOICE_call.M4A' })).toBe(true);
    expect(isVoiceRecording({ name: 'my-song.mp3' })).toBe(false);
    expect(isVoiceRecording({ name: 'voice_memo.mp3' })).toBe(false);
    expect(isVoiceRecording({})).toBe(false);
  });
});

describe('spokenCharCount', () => {
  const [firstTurn] = mergeTranscriptTurns(conversation); // 'Hi there. How are you?' over 0–7s

  it('reveals nothing before the turn and everything after it', () => {
    expect(spokenCharCount(firstTurn, -1)).toBe(0);
    expect(spokenCharCount(firstTurn, 7)).toBe(firstTurn.text.length);
    expect(spokenCharCount(firstTurn, 30)).toBe(firstTurn.text.length);
  });

  it('streams whole words through the active segment', () => {
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 0))).toBe('');
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 2))).toBe('Hi');
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 4))).toBe('Hi there. ');
    // A word lights as it starts.
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 5.5))).toBe('Hi there. How are');
  });

  it('times words by when someone was audible, not by pauses and trailing silence', () => {
    // 'Hi there.' is said in its first second; 'How are you?' between 4 and 5.
    const speech = [{ start: 0, end: 1 }, { start: 4, end: 5 }];
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 0.5, speech))).toBe('Hi');
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 2, speech))).toBe('Hi there.');
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 4.5, speech))).toBe('Hi there. How are');
    expect(firstTurn.text.slice(0, spokenCharCount(firstTurn, 5, speech))).toBe(firstTurn.text);
  });
});

describe('alignSegmentsToSpeech', () => {
  // Memento speaks 0.5–4s, the user 6–9s, Memento again 10.2–14s.
  const speech = [{ start: 0.5, end: 4 }, { start: 6, end: 9 }, { start: 10.2, end: 14 }];

  it('snaps late user text back and early Memento text forward to the speech heard', () => {
    const aligned = alignSegmentsToSpeech([
      { start: 0, end: 7.5, text: 'Hello there', speaker: 'ai' },
      { start: 7.5, end: 9.6, text: 'Hi Memento', speaker: 'user' }, // transcribed 1.5s late
      { start: 9.6, end: 20, text: 'Lovely to hear', speaker: 'ai' }, // text before its audio
    ], speech);
    expect(aligned.map((segment) => [segment.start, segment.end])).toEqual([[0.5, 4], [6, 9], [10.2, 14]]);
  });

  it('keeps turns in order and leaves them be without speech to snap to', () => {
    const segments = [{ start: 1, end: 2, text: 'A', speaker: 'ai' as const }, { start: 2, end: 3, text: 'B', speaker: 'user' as const }];
    expect(alignSegmentsToSpeech(segments, [])).toEqual(segments);
    const far = alignSegmentsToSpeech(segments, [{ start: 40, end: 45 }]);
    expect(far.map((segment) => segment.start)).toEqual([1, 2]);
  });
});

#!/usr/bin/env node
/**
 * Records the voice picker's sample lines for each voice. Existing clips are kept.
 * Requires ffmpeg and a Gemini API key:
 *   GEMINI_API_KEY=... node scripts/generate-voice-previews.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lines = JSON.parse(readFileSync(join(root, "src/lib/voice-preview-lines.json"), "utf8"));
const outDir = join(root, "src/assets/audio/voice-previews");
const model = "gemini-2.5-flash-preview-tts";
// Mirrors MOBILE_VOICE_CATALOG in src/features/voice/mobile-voice-catalog.ts.
const voices = { denver: "Fenrir", sue: "Aoede", josef: "Enceladus", hannah: "Kore", maya: "Leda", leo: "Puck" };

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Set GEMINI_API_KEY first.");
  process.exit(1);
}

async function record(voiceName, line) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Read this line from a well-loved novel, naturally and warmly: ${line}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  });
  if (response.status === 429) {
    const text = await response.text();
    const seconds = Number(text.match(/retry in ([\d.]+)s/)?.[1]);
    // Without a retry time this is a daily limit, so waiting here won't help.
    if (!seconds) throw new Error(`Gemini quota reached: ${text}`);
    console.log(`Rate limited, waiting ${Math.ceil(seconds)}s`);
    await new Promise((resolve) => setTimeout(resolve, (seconds + 1) * 1000));
    return record(voiceName, line);
  }
  if (!response.ok) throw new Error(`Gemini returned ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const audio = body.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audio) throw new Error("Gemini returned no audio");
  return Buffer.from(audio, "base64");
}

// Finish each line for every voice before starting the next, so a quota stop leaves voices even.
for (const [index, line] of lines.entries()) {
  for (const [voiceId, voiceName] of Object.entries(voices)) {
    const file = join(outDir, `${voiceId}-${index}.mp3`);
    if (existsSync(file)) continue;
    const pcm = await record(voiceName, line);
    const ffmpeg = spawnSync(
      "ffmpeg",
      ["-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "64k", file],
      { input: pcm },
    );
    if (ffmpeg.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${ffmpeg.stderr}`);
    console.log(`Recorded ${voiceId}-${index}.mp3`);
  }
}

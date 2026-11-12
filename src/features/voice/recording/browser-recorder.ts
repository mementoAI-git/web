import { RECORDING_FORMATS } from "@/features/media/recording-formats";
import { ActivityMeter } from "./call-recording";

/**
 * Speech needs no more. Chrome's AAC encoder fails below 64 kbps, which still
 * fits about half an hour in the 15 MB upload limit; Opus at 32 kbps, an hour.
 */
function bitrateFor(format: string | undefined) {
  return format?.includes("mp4") ? 64_000 : 32_000;
}
const METER_BUFFER_FRAMES = 2048;
/** MediaRecorder hands over data this often, so a long call isn't one huge buffer at the end. */
const RECORDER_TIMESLICE_MS = 1_000;

export type BrowserCallRecording = {
  audio: Blob;
  mimeType: string;
  durationMs: number;
  /** One character per 100 ms: '1' audible, '0' silence. */
  activity: string;
};

function supportedFormats(): Array<string | undefined> {
  if (typeof MediaRecorder.isTypeSupported !== "function") return [undefined];
  const formats = RECORDING_FORMATS.filter((format) => MediaRecorder.isTypeSupported(format));
  // The browser's own default as the last resort.
  return [...formats, undefined];
}

/**
 * Records a voice call in the browser: Memento's audio as the host heard it,
 * mixed with their microphone. A muted microphone track sends silence, so
 * nothing said on mute is recorded. Built on the call's output AudioContext,
 * where Memento's audio already plays.
 */
export class BrowserCallRecorder {
  private readonly bus: GainNode;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly meterNode: ScriptProcessorNode;
  private readonly meter: ActivityMeter;
  private readonly chunks: Blob[] = [];
  private recorder: MediaRecorder | null = null;
  private mic: MediaStreamAudioSourceNode | null = null;
  private readonly context: AudioContext;
  private readonly memento: AudioNode;

  static isSupported() {
    return (
      typeof window !== "undefined" &&
      typeof MediaRecorder !== "undefined" &&
      typeof AudioContext !== "undefined" &&
      typeof AudioContext.prototype.createMediaStreamDestination === "function"
    );
  }

  constructor(context: AudioContext, memento: AudioNode) {
    this.context = context;
    this.memento = memento;
    this.bus = context.createGain();
    this.destination = context.createMediaStreamDestination();
    this.meter = new ActivityMeter(context.sampleRate);
    this.meterNode = context.createScriptProcessor(METER_BUFFER_FRAMES, 1, 1);
    this.meterNode.onaudioprocess = (event) => {
      if (this.recorder?.state === "recording") this.meter.push(event.inputBuffer.getChannelData(0));
    };
  }

  /** Starts recording, with the microphone from `micStream`. False when the browser can't. */
  start(micStream: MediaStream): boolean {
    try {
      // Mixing the mic into this context throws in browsers that can't resample it;
      // then the call isn't recorded rather than recorded with only one side.
      this.mic = this.context.createMediaStreamSource(micStream);
      this.mic.connect(this.bus);
      this.memento.connect(this.bus);
      this.bus.connect(this.destination);
      this.bus.connect(this.meterNode);
      // A ScriptProcessor only runs while connected to the output; it writes silence.
      this.meterNode.connect(this.context.destination);
      if (this.launch(supportedFormats())) return true;
      this.release();
      return false;
    } catch (error) {
      console.warn("[voice] the conversation can't be recorded in this browser", error);
      this.release();
      return false;
    }
  }

  /**
   * Records in the first format that works. A browser can claim a format it
   * then fails to encode; that fails before any data, so the next one is tried.
   */
  private launch(formats: Array<string | undefined>): boolean {
    for (let index = 0; index < formats.length; index += 1) {
      const format = formats[index];
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(this.destination.stream, {
          ...(format ? { mimeType: format } : {}),
          audioBitsPerSecond: bitrateFor(format),
        });
        recorder.ondataavailable = (event) => {
          if (event.data.size) this.chunks.push(event.data);
        };
        recorder.onerror = () => {
          if (this.recorder !== recorder || this.chunks.length) return;
          console.warn("[voice] recording format failed; trying the next", format);
          this.recorder = null;
          if (!this.launch(formats.slice(index + 1))) this.release();
        };
        recorder.start(RECORDER_TIMESLICE_MS);
      } catch {
        continue;
      }
      this.recorder = recorder;
      return true;
    }
    return false;
  }

  get isRecording() {
    return this.recorder?.state === "recording";
  }

  /** Milliseconds recorded so far, on the audio clock. */
  get elapsedMs() {
    return this.meter.elapsedMs;
  }

  /** Stops and returns the recording; null when nothing was recorded. */
  async stop(): Promise<BrowserCallRecording | null> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === "inactive") {
      this.release();
      return null;
    }
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    this.release();
    const mimeType = recorder.mimeType || this.chunks[0]?.type || "audio/webm";
    const audio = new Blob(this.chunks, { type: mimeType });
    if (!audio.size) return null;
    return { audio, mimeType, durationMs: this.meter.elapsedMs, activity: this.meter.activity };
  }

  /** Disconnects everything, leaving the call's own audio graph as it was. */
  private release() {
    this.recorder = null;
    this.meterNode.onaudioprocess = null;
    for (const disconnect of [
      () => this.mic?.disconnect(),
      () => this.memento.disconnect(this.bus),
      () => this.bus.disconnect(),
      () => this.meterNode.disconnect(),
    ]) {
      try {
        disconnect();
      } catch {
        // Never connected.
      }
    }
    this.mic = null;
  }
}

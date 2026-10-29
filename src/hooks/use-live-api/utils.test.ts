import { describe, expect, it } from "vitest";
import { createBlob, decode } from "./utils";

function samples(blob: { data?: string }) {
  return Array.from(new Int16Array(decode(blob.data).buffer));
}

describe("createBlob", () => {
  it("encodes microphone samples as 16 kHz PCM", () => {
    const blob = createBlob(new Float32Array([0, 0.5, -0.5]));
    expect(blob.mimeType).toBe("audio/pcm;rate=16000");
    expect(samples(blob)).toEqual([0, 16384, -16384]);
  });

  it("caps full-scale and over-range samples instead of wrapping their sign", () => {
    const blob = createBlob(new Float32Array([1, 1.5, -1, -1.5]));
    expect(samples(blob)).toEqual([32767, 32767, -32768, -32768]);
  });
});

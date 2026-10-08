import { File as NodeFile } from "node:buffer";
import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { transcribeAudio } from "./fetcher";

it("returns the transcript from the real API envelope", async () => {
  server.use(
    http.post(
      "http://localhost:3000/api/ai/transcribe-audio",
      async ({ request }) => {
        expect(await request.json()).toEqual({ file_id: "recording-id" });
        return HttpResponse.json({
          status: 200,
          message: "Transcription successful",
          data: { full_text: "A memory." },
        });
      },
    ),
  );
  expect(await transcribeAudio("recording-id")).toEqual({
    full_text: "A memory.",
  });
});
it("preserves the API failure reason instead of hiding it", async () => {
  server.use(
    http.post("http://localhost:3000/api/ai/transcribe-audio", () =>
      HttpResponse.json(
        {
          message:
            "Could not load this recording from storage for transcription.",
        },
        { status: 400 },
      ),
    ),
  );
  await expect(transcribeAudio("recording-id")).rejects.toThrow(
    "Could not load this recording from storage for transcription.",
  );
});

it("sends a recording directly as multipart audio, without file storage", async () => {
  // MSW's Request uses Node's multipart encoder; use matching native file types.
  const nativeForm = await new Response("", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).formData();
  vi.stubGlobal("FormData", nativeForm.constructor);

  server.use(
    http.post(
      "http://localhost:3000/api/ai/transcribe-audio",
      async ({ request }) => {
        expect(request.headers.get("content-type")).toMatch(
          /^multipart\/form-data; boundary=/,
        );
        const form = await request.formData();
        const audio = form.get("file") as File;
        expect(audio.type).toBe("audio/webm");
        expect(audio.size).toBe(5);
        expect(await audio.text()).toBe("audio");
        expect(form.has("file_id")).toBe(false);
        return HttpResponse.json({
          status: 200,
          data: { full_text: "Direct recording." },
        });
      },
    ),
  );
  const file = new NodeFile(["audio"], "reflection.webm", {
    type: "audio/webm",
  }) as unknown as File;
  try {
    expect(await transcribeAudio(file)).toEqual({
      full_text: "Direct recording.",
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

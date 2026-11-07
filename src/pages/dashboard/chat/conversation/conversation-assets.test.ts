import { describe, expect, it } from "vitest";
import {
  buildConversationAssetIndex,
  classifyConversationFile,
  filterConversationAssets,
} from "./conversation-assets";

describe("conversation assets", () => {
  it("classifies files from MIME type or extension", () => {
    expect(classifyConversationFile({ name: "photo.jpg" })).toBe("image");
    expect(classifyConversationFile({ name: "clip.bin", type: "video/mp4" })).toBe("video");
    expect(classifyConversationFile({ name: "voice.m4a" })).toBe("audio");
    expect(classifyConversationFile({ name: "notes.pdf" })).toBe("document");
  });

  it("indexes and deduplicates only the supplied message assets", () => {
    const index = buildConversationAssetIndex([
      {
        _id: "m1",
        text: "See https://example.com/story?b=2&a=1",
        created_at: "2026-07-13T13:34:00.000Z",
        attatchments: [
          { _id: "f1", name: "lake.jpg", type: "image/jpeg", url: "/lake.jpg", size: 12 },
          { _id: "f2", name: "voice.m4a", type: "audio/mp4", url: "/voice.m4a", size: 20 },
        ],
      },
      {
        _id: "m2",
        text: "Again https://example.com/story?a=1&b=2",
        created_at: "2026-07-14T10:00:00.000Z",
        attatchments: [
          { _id: "f1", name: "lake.jpg", type: "image/jpeg", url: "/lake.jpg", size: 12 },
          { _id: "f3", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 30 },
        ],
      },
    ]);

    expect(index.media.map((item) => item.kind)).toEqual(["image", "audio"]);
    expect(index.docs.map((item) => item.file._id)).toEqual(["f3"]);
    expect(index.links).toHaveLength(1);
    expect(index.media[0]?.sharedAt).toBe("2026-07-13T13:34:00.000Z");
    expect(index.total).toBe(4);
  });

  it("uses supplied metadata and filters searchable values", () => {
    const index = buildConversationAssetIndex([{
      _id: "m1",
      text: "https://mymemento.io",
      created_at: "2026-07-13T13:34:00.000Z",
      link_metadata: [{ url: "https://mymemento.io", title: "Mymemento.io", domain: "mymemento.io" }],
      attatchments: [{ _id: "f1", name: "Passport.PDF", type: "application/pdf", url: "/passport.pdf", size: 12 }],
    }]);

    expect(index.links[0]?.title).toBe("Mymemento.io");
    expect(filterConversationAssets(index, "passport").docs).toHaveLength(1);
    expect(filterConversationAssets(index, "mymemento.io").links).toHaveLength(1);
    expect(filterConversationAssets(index, "missing").total).toBe(0);
  });
});

describe("classifyConversationFile for voice notes", () => {
  it("treats audio WebM as audio, not video", () => {
    expect(classifyConversationFile({ name: "song.webm", type: "audio/webm" })).toBe("audio");
  });
  it("treats our recordings as audio even when stored as video/webm", () => {
    expect(
      classifyConversationFile({ name: "recording-1793990813293_261106143012.webm", type: "video/webm" }),
    ).toBe("audio");
  });
  it("still treats an ordinary WebM as video", () => {
    expect(classifyConversationFile({ name: "clip.webm", type: "video/webm" })).toBe("video");
  });
});

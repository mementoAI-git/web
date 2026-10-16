import { describe, expect, it } from "vitest";
import { disposableDraftUploads } from "./draft-attachments";
import type { IOnUploadPayload } from "@/utility/interface";

const upload = (id: string, restored = false): IOnUploadPayload => ({
  id, file: restored ? null : new File(["photo"], "photo.png"), progress: 100,
  uploadedFile: { _id: id, name: "photo.png", url: "https://example.test/photo", type: "image/png", size: 5 },
});

describe("draft attachment cleanup", () => {
  it("deletes only newly uploaded files not referenced by remaining drafts", () => {
    const owned = upload("owned");
    const shared = upload("shared");
    expect(disposableDraftUploads([owned, shared], [{ attachments: [{ _id: "shared" }] }])).toEqual([owned]);
  });
  it("never deletes restored assets when a composer is discarded", () => {
    expect(disposableDraftUploads([upload("restored", true)], [])).toEqual([]);
  });
  it("ignores unfinished uploads with no confirmed server file", () => {
    expect(disposableDraftUploads([{ id: "pending", file: new File(["x"], "photo.png"), progress: 80 }], [])).toEqual([]);
  });
});

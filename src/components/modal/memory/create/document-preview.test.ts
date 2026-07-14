import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { extractDocxPreview, extractPlainTextPreview } from "./document-preview";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe("extractDocxPreview", () => {
  it("prefers the embedded Office thumbnail when present", () => {
    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    const archive = zipSync({
      docProps: {
        "thumbnail.jpeg": jpegBytes,
      },
      word: {
        "document.xml": strToU8(
          `<?xml version="1.0" encoding="UTF-8"?>
          <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>
              <w:p><w:r><w:t>Hidden by thumbnail</w:t></w:r></w:p>
            </w:body>
          </w:document>`,
        ),
      },
    });

    const preview = extractDocxPreview(toArrayBuffer(archive));

    expect(preview.imageUrl).toBe("data:image/jpeg;base64,/9j/2Q==");
    expect(preview.textPreview).toBeNull();
  });

  it("creates a readable preview for plain text documents", () => {
    expect(extractPlainTextPreview("First paragraph\n\nSecond paragraph")).toBe(
      "First paragraph Second paragraph",
    );
  });
});

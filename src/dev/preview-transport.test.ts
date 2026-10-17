import Axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "@/test/fixtures";
import { PreviewSession, setPreviewSession } from "./preview-session";
import {
  installPreviewAxios,
  installPreviewFetch,
  installPreviewStorage,
} from "./preview-transport";

afterEach(() => setPreviewSession(null));

describe("preview request boundary", () => {
  it("intercepts Axios reads and writes and leaves the normal adapter untouched", async () => {
    const realAdapter = vi.fn(async (config) => ({
      data: { data: "real" },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    const client = Axios.create({
      baseURL: "http://localhost:3000/api",
      adapter: realAdapter,
    });
    installPreviewAxios(client);
    expect((await client.get("/memories")).data.data).toBe("real");
    setPreviewSession(new PreviewSession(mockUser));
    expect((await client.get("/memories")).data.data.docs).toEqual([]);
    await client.post("/memories/quick-capture", { body: "Local story" });
    expect((await client.get("/memories/stories")).data.data.totalDocs).toBe(1);
    await expect(client.post("/billing/checkout")).rejects.toMatchObject({
      response: { status: 409 },
    });
    expect(realAdapter).toHaveBeenCalledTimes(1);
    setPreviewSession(null);
    expect((await client.get("/memories")).data.data).toBe("real");
    expect(realAdapter).toHaveBeenCalledTimes(2);
  });

  it("handles JSON and streaming fetch requests without reaching the real fetch", async () => {
    const realFetch = vi.fn(async () => new Response("real"));
    const restoreMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(realFetch);
    const restore = installPreviewFetch();
    try {
      const session = new PreviewSession(mockUser);
      setPreviewSession(session);
      const create = await fetch(
        "http://localhost:3000/api/ai/conversation/new",
        { method: "POST", body: JSON.stringify({ text: "My childhood" }) },
      );
      const { data } = await create.json();
      const response = await fetch("http://localhost:3000/api/ai/prompt", {
        method: "POST",
        body: JSON.stringify({
          memory: data.memory_id,
          text: "Another thought",
        }),
      });
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(await response.text()).toContain("remember");
      expect(
        (await fetch("http://localhost:3000/api/unknown", { method: "PUT" }))
          .status,
      ).toBe(409);
      expect(realFetch).not.toHaveBeenCalled();
      expect(
        await (await fetch("https://example.com/artwork.png")).text(),
      ).toBe("real");
      setPreviewSession(null);
      expect(
        await (await fetch("http://localhost:3000/api/memories")).text(),
      ).toBe("real");
    } finally {
      restore();
      restoreMock.mockRestore();
    }
  });

  it("isolates drafts and enrichment bookkeeping while preserving authentication", () => {
    localStorage.setItem("memento:auth", "real-auth");
    localStorage.setItem("create-memory-drafts", "real-draft");
    localStorage.setItem("memento:enrichment:baseline", "real-baseline");
    const restore = installPreviewStorage();
    try {
      const session = new PreviewSession(mockUser);
      setPreviewSession(session);
      expect(localStorage.getItem("memento:auth")).toBe("real-auth");
      expect(localStorage.getItem("create-memory-drafts")).toBeNull();
      localStorage.setItem("create-memory-drafts", "preview-draft");
      localStorage.setItem("memento:enrichment:baseline", "preview-baseline");
      expect(localStorage.getItem("create-memory-drafts")).toBe(
        "preview-draft",
      );
      localStorage.removeItem("create-memory-drafts");
      expect(localStorage.getItem("create-memory-drafts")).toBeNull();
      setPreviewSession(null);
      expect(localStorage.getItem("create-memory-drafts")).toBe("real-draft");
      expect(localStorage.getItem("memento:enrichment:baseline")).toBe(
        "real-baseline",
      );
      setPreviewSession(new PreviewSession(mockUser));
      expect(localStorage.getItem("memento:enrichment:baseline")).toBeNull();
    } finally {
      restore();
    }
  });

  it("keeps offline saves temporary and enumerates only the preview drafts", () => {
    localStorage.setItem("quick-capture-outbox", "real-outbox");
    localStorage.setItem("memento:quick-capture:draft:real", "real-draft");
    const restore = installPreviewStorage();
    try {
      setPreviewSession(new PreviewSession(mockUser));
      expect(localStorage.getItem("quick-capture-outbox")).toBeNull();
      localStorage.setItem("quick-capture-outbox", "preview-outbox");
      localStorage.setItem(
        "memento:quick-capture:draft:preview",
        "preview-draft",
      );
      const keys = Array.from({ length: localStorage.length }, (_, i) =>
        localStorage.key(i),
      );
      expect(keys).toContain("memento:quick-capture:draft:preview");
      expect(keys).not.toContain("memento:quick-capture:draft:real");
      setPreviewSession(null);
      expect(localStorage.getItem("quick-capture-outbox")).toBe("real-outbox");
      expect(
        localStorage.getItem("memento:quick-capture:draft:preview"),
      ).toBeNull();
    } finally {
      setPreviewSession(null);
      restore();
    }
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCapsuleStatus,
  obfuscateEmail,
  isImage,
  getDisplayName,
} from "./helpers";
import type { ICapsule } from "@/utility/interface";

describe("getCapsuleStatus", () => {
  const baseCapsule: Partial<ICapsule> = {
    body: "Hello",
    recipients: [{ email: "a@b.com" } as ICapsule["recipients"][0]],
    schedule_date: "2025-12-31T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "draft" when body is empty', () => {
    const capsule = {
      ...baseCapsule,
      body: "",
      recipients: [{ email: "a@b.com" }],
      schedule_date: "2026-12-31T00:00:00.000Z",
    } as ICapsule;
    expect(getCapsuleStatus(capsule)).toBe("draft");
  });

  it('returns "draft" when recipients is empty', () => {
    const capsule = {
      ...baseCapsule,
      body: "Hello",
      recipients: [],
      schedule_date: "2026-12-31T00:00:00.000Z",
    } as ICapsule;
    expect(getCapsuleStatus(capsule)).toBe("draft");
  });

  it('returns "draft" when recipients is undefined', () => {
    const capsule = {
      ...baseCapsule,
      body: "Hello",
      recipients: undefined as unknown as ICapsule["recipients"],
      schedule_date: "2026-12-31T00:00:00.000Z",
    } as ICapsule;
    expect(getCapsuleStatus(capsule)).toBe("draft");
  });

  it('returns "delivered" when schedule_date is in the past', () => {
    const capsule = {
      ...baseCapsule,
      body: "Hello",
      recipients: [{ email: "a@b.com" }],
      schedule_date: "2025-01-01T00:00:00.000Z",
    } as ICapsule;
    expect(getCapsuleStatus(capsule)).toBe("delivered");
  });

  it('returns "scheduled" when has body, recipients, and schedule_date in the future', () => {
    const capsule = {
      ...baseCapsule,
      body: "Hello",
      recipients: [{ email: "a@b.com" }],
      schedule_date: "2026-12-31T00:00:00.000Z",
    } as ICapsule;
    expect(getCapsuleStatus(capsule)).toBe("scheduled");
  });
});

describe("obfuscateEmail", () => {
  it('obfuscates "john@example.com" to "jo***@example.com"', () => {
    expect(obfuscateEmail("john@example.com")).toBe("jo***@example.com");
  });

  it("returns input as-is when no @ sign", () => {
    expect(obfuscateEmail("notanemail")).toBe("notanemail");
  });

  it("returns input as-is when empty", () => {
    expect(obfuscateEmail("")).toBe("");
  });

  it("handles short usernames", () => {
    expect(obfuscateEmail("a@b.com")).toBe("a***@b.com");
  });
});

describe("isImage", () => {
  it("returns true for photo.jpg string path", () => {
    expect(isImage("photo.jpg")).toBe(true);
  });

  it("returns false for doc.pdf string path", () => {
    expect(isImage("doc.pdf")).toBe(false);
  });

  it("returns true for object with type image/png", () => {
    expect(isImage({ type: "image/png" })).toBe(true);
  });

  it("returns true for object with name photo.png", () => {
    expect(isImage({ name: "photo.png" })).toBe(true);
  });

  it("returns true for other image extensions", () => {
    expect(isImage("photo.jpeg")).toBe(true);
    expect(isImage("photo.gif")).toBe(true);
    expect(isImage("photo.webp")).toBe(true);
    expect(isImage("photo.svg")).toBe(true);
  });
});

describe("getDisplayName", () => {
  it('returns "FirstName LastName" trimmed', () => {
    const recipient = {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    };
    expect(getDisplayName(recipient)).toBe("John Doe");
  });

  it("falls back to email when no name", () => {
    const recipient = {
      first_name: "",
      last_name: "",
      email: "john@example.com",
    };
    expect(getDisplayName(recipient)).toBe("john@example.com");
  });

  it("handles only first_name", () => {
    const recipient = {
      first_name: "John",
      last_name: "",
      email: "john@example.com",
    };
    expect(getDisplayName(recipient)).toBe("John");
  });

  it("handles only last_name", () => {
    const recipient = {
      first_name: "",
      last_name: "Doe",
      email: "john@example.com",
    };
    expect(getDisplayName(recipient)).toBe("Doe");
  });
});

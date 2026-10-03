import type { IUser } from "@/utility/interface";
import {
  hashEmail,
  isEmpty,
  cn,
  truncateFileName,
  ensureLinksOpenInNewTab,
  formatFileSize,
  getDuration,
  concatStrings,
  highlightText,
  resolvePath,
  replacePathParams,
  openMailBox,
  addToRecentMemories,
  getRecentMemories,
  clearRecentMemories,
  formattedDate,
  getCategory,
  createSystemContext,
} from "./index";

describe("hashEmail", () => {
  it("returns first 5 chars of username + ***@ + domain", () => {
    expect(hashEmail("johndoe@mail.com")).toBe("johnd***@mail.com");
  });

  it("handles short usernames", () => {
    expect(hashEmail("ab@x.com")).toBe("ab***@x.com");
  });

  it("handles single char username", () => {
    expect(hashEmail("a@b.co")).toBe("a***@b.co");
  });
});

describe("isEmpty", () => {
  it("returns true for undefined, null, false, 0, empty string", () => {
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(false)).toBe(true);
    expect(isEmpty(0)).toBe(true);
    expect(isEmpty("")).toBe(true);
  });

  it("returns true for string '0', 'null', 'undefined'", () => {
    expect(isEmpty("0")).toBe(true);
    expect(isEmpty("null")).toBe(true);
    expect(isEmpty("undefined")).toBe(true);
  });

  it("returns true for empty objects and empty arrays", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty([])).toBe(true);
  });

  it("returns false for non-empty values", () => {
    expect(isEmpty("hello")).toBe(false);
    expect(isEmpty(1)).toBe(false);
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty(new Date())).toBe(false);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes", () => {
    const shown = false as boolean;
    expect(cn("base", shown && "hidden", "visible")).toBe("base visible");
  });
});

describe("truncateFileName", () => {
  it("returns name as-is when shorter than max_len", () => {
    expect(truncateFileName("short.txt")).toBe("short.txt");
    expect(truncateFileName("a".repeat(44) + ".txt")).toBe("a".repeat(44) + ".txt");
  });

  it("truncates long filenames: first 30 chars + .. + extension", () => {
    const long = "a".repeat(46) + ".pdf";
    expect(truncateFileName(long)).toBe("a".repeat(30) + ".." + ".pdf");
  });

  it("uses default max_len of 50", () => {
    const name = "x".repeat(60) + ".txt";
    expect(truncateFileName(name)).toBe("x".repeat(30) + ".." + ".txt");
  });

  it("uses custom max_len", () => {
    const name = "abc" + ".ext";
    expect(truncateFileName(name, 3)).toBe("abc.." + ".ext");
  });
});

describe("ensureLinksOpenInNewTab", () => {
  it("adds target=_blank and rel=noopener noreferrer to anchor tags", () => {
    const html = '<a href="https://example.com">link</a>';
    expect(ensureLinksOpenInNewTab(html)).toContain('target="_blank"');
    expect(ensureLinksOpenInNewTab(html)).toContain('rel="noopener noreferrer"');
  });

  it("replaces existing target and rel attributes", () => {
    const html = '<a href="/" target="_self" rel="nofollow">link</a>';
    const result = ensureLinksOpenInNewTab(html);
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).not.toContain("_self");
    expect(result).not.toContain("nofollow");
  });

  it("handles null, undefined, empty string", () => {
    expect(ensureLinksOpenInNewTab(null as unknown as string)).toBeNull();
    expect(ensureLinksOpenInNewTab(undefined as unknown as string)).toBeUndefined();
    expect(ensureLinksOpenInNewTab("")).toBe("");
  });

  it("leaves non-anchor content unchanged", () => {
    const html = "<p>No links here</p>";
    expect(ensureLinksOpenInNewTab(html)).toBe(html);
  });
});

describe("formatFileSize", () => {
  it("returns 0B for zero", () => {
    expect(formatFileSize(0)).toBe("0B");
  });

  it("formats bytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1KB");
    expect(formatFileSize(1048576)).toBe("1MB");
    expect(formatFileSize(1073741824)).toBe("1GB");
  });

  it("formats intermediate sizes", () => {
    expect(formatFileSize(500)).toBe("500B");
    expect(formatFileSize(1536)).toBe("1KB");
    expect(formatFileSize(2048)).toBe("2KB");
  });
});

describe("getDuration", () => {
  it("returns zero-padded secs, mins, hrs", () => {
    expect(getDuration(0)).toEqual({ secs: "00", mins: "00", hrs: "00" });
  });

  it("parses seconds correctly", () => {
    expect(getDuration(65)).toEqual({ secs: "05", mins: "01", hrs: "00" });
  });

  it("parses hours correctly", () => {
    expect(getDuration(3665)).toEqual({ secs: "05", mins: "01", hrs: "01" });
  });

  it("handles Infinity and NaN as 0", () => {
    expect(getDuration(Infinity)).toEqual({ secs: "00", mins: "00", hrs: "00" });
    expect(getDuration(NaN)).toEqual({ secs: "00", mins: "00", hrs: "00" });
  });
});

describe("concatStrings", () => {
  it("joins strings with separator", () => {
    expect(concatStrings("a", "b", ", ")).toBe("a, b");
  });

  it("filters empty strings", () => {
    expect(concatStrings("a", "", "b", ", ")).toBe("a, b");
  });

  it("returns empty string when no args", () => {
    expect(concatStrings()).toBe("");
  });

  it("handles single string with separator", () => {
    expect(concatStrings("a", " | ")).toBe("a");
  });
});

describe("highlightText", () => {
  it("wraps matched text in mark tags", () => {
    const result = highlightText("hello world", "world");
    expect(result).toContain('<mark class="bg-[#155FFF36] font-semibold">world</mark>');
  });

  it("is case insensitive", () => {
    const result = highlightText("Hello World", "hello");
    expect(result).toContain('<mark class="bg-[#155FFF36] font-semibold">Hello</mark>');
  });

  it("escapes regex special chars", () => {
    const result = highlightText("a.b.c", ".");
    expect(result).toBe('a<mark class="bg-[#155FFF36] font-semibold">.</mark>b<mark class="bg-[#155FFF36] font-semibold">.</mark>c');
  });

  it("returns text when searchTerm is empty", () => {
    expect(highlightText("hello", "")).toBe("hello");
  });

  it("returns text when text is empty", () => {
    expect(highlightText("", "x")).toBe("");
  });
});

describe("resolvePath", () => {
  it("replaces :param placeholders", () => {
    expect(resolvePath("/memories/:id", { id: "123" })).toBe("/memories/123");
  });

  it("leaves unreplaced params as-is when value is empty", () => {
    expect(resolvePath("/memories/:id", { id: "" })).toBe("/memories/:id");
  });

  it("handles multiple params", () => {
    expect(resolvePath("/memories/:id/comments/:cid", { id: "1", cid: "2" })).toBe(
      "/memories/1/comments/2",
    );
  });

  it("coerces number to string", () => {
    expect(resolvePath("/items/:id", { id: 42 })).toBe("/items/42");
  });
});

describe("replacePathParams", () => {
  it("replaces :param placeholders", () => {
    expect(replacePathParams("/groups/:id/members/:memberId", { id: "1", memberId: "2" })).toBe(
      "/groups/1/members/2",
    );
  });

  it("handles numeric values", () => {
    expect(replacePathParams("/items/:id", { id: 123 })).toBe("/items/123");
  });
});

describe("openMailBox", () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it("returns gmail inbox link for gmail.com", () => {
    const link = openMailBox("user@gmail.com");
    expect(link).toBe("https://mail.google.com/mail/u/0/#inbox");
    expect(window.open).toHaveBeenCalledWith(link, "_blank");
  });

  it("returns yahoo link for yahoo.com", () => {
    const link = openMailBox("user@yahoo.com");
    expect(link).toBe("https://mail.yahoo.com/");
    expect(window.open).toHaveBeenCalledWith(link, "_blank");
  });

  it("returns outlook link for outlook.com", () => {
    const link = openMailBox("user@outlook.com");
    expect(link).toBe("https://outlook.live.com/mail/inbox");
    expect(window.open).toHaveBeenCalledWith(link, "_blank");
  });

  it("returns mailto for other domains", () => {
    const link = openMailBox("user@custom.com");
    expect(link).toBe("mailto:user@custom.com");
    expect(window.open).toHaveBeenCalledWith(link, "_blank");
  });
});

describe("addToRecentMemories / getRecentMemories / clearRecentMemories", () => {
  const email = "test@example.com";

  beforeEach(() => {
    localStorage.clear();
  });

  it("adds memory and retrieves it", () => {
    const memory = { _id: "1", title: "Test", body: "Body text", attachments: [], created_at: "2024-01-01" };
    addToRecentMemories(memory, email);
    const recent = getRecentMemories(email);
    expect(recent).toHaveLength(1);
    expect(recent[0]._id).toBe("1");
    expect(recent[0].title).toBe("Test");
  });

  it("caps at 5 items", () => {
    for (let i = 0; i < 7; i++) {
      addToRecentMemories({ _id: `id-${i}`, title: `T${i}`, body: "x", attachments: [], created_at: "2024-01-01" }, email);
    }
    expect(getRecentMemories(email)).toHaveLength(5);
  });

  it("deduplicates by _id, moving existing to front", () => {
    addToRecentMemories({ _id: "1", title: "First", body: "a", attachments: [], created_at: "2024-01-01" }, email);
    addToRecentMemories({ _id: "2", title: "Second", body: "b", attachments: [], created_at: "2024-01-01" }, email);
    addToRecentMemories({ _id: "1", title: "First Updated", body: "c", attachments: [], created_at: "2024-01-01" }, email);
    const recent = getRecentMemories(email);
    expect(recent).toHaveLength(2);
    expect(recent[0]._id).toBe("1");
    expect(recent[0].title).toBe("First Updated");
  });

  it("clearRecentMemories removes base storage key", () => {
    addToRecentMemories({ _id: "1", title: "T", body: "x", attachments: [], created_at: "2024-01-01" }, email);
    clearRecentMemories();
    expect(localStorage.getItem("memento:recent-memories")).toBeNull();
  });
});

describe("formattedDate", () => {
  it("returns formatted string", () => {
    const result = formattedDate("2024-06-15T12:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses dayjs calendar format", () => {
    const result = formattedDate("2024-01-01T10:30:00Z");
    expect(result).toMatch(/\d{2} \w{3} \d{4}|Today|Yesterday|\w+ \d{2}:\d{2} [AP]M/);
  });
});

describe("createSystemContext", () => {
  it("does not throw when preferences and context are missing", () => {
    const user = {
      email: "a@b.com",
      fullname: "Test User",
    } as IUser;
    expect(() => createSystemContext(user)).not.toThrow();
    const text = createSystemContext(user);
    expect(text).toContain("USER PREFERENCES:");
    expect(text).toContain("Communication style: friendly");
    expect(text).toContain("Learning about user");
  });
});

describe("getCategory", () => {
  it("resolves legacy Explore categories to canonical presentation data", () => {
    const cat = getCategory("career");
    expect(cat).toBeDefined();
    expect(cat?.slug).toBe("work-purpose");
    expect(cat?.image).toBeTruthy();
  });

  it("returns presentation data for family", () => {
    const cat = getCategory("family");
    expect(cat?.slug).toBe("people-i-love");
  });

  it("returns undefined for unknown key", () => {
    expect(getCategory("unknown-key")).toBeUndefined();
  });
});

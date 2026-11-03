import { act, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DomScreen } from "./dom-screen";

afterEach(() => {
  document.body.innerHTML = "";
});

/** jsdom has no layout: everything counts as visible unless marked. */
const screen = (html?: string) => {
  if (html !== undefined) document.body.innerHTML = html;
  return new DomScreen({
    document,
    screenName: () => "Stories",
    isVisible: element => !element.closest("[data-test-hidden]"),
    settleMs: 0,
  });
};

describe("DomScreen.press", () => {
  it("presses a button by its words, ignoring case and punctuation", () => {
    const click = vi.fn();
    screen(`<button>Add new story!</button>`);
    document.querySelector("button")!.addEventListener("click", click);
    expect(screen().press("add new story")).toBe('Pressed "Add new story!".');
    expect(click).toHaveBeenCalledOnce();
  });

  it("uses the accessible name of icon buttons and links", () => {
    const s = screen(`<button aria-label="Send"><svg></svg></button><a href="/stories">Your stories</a>`);
    expect(s.press("send")).toBe('Pressed "Send".');
    expect(s.press("your stories")).toBe('Pressed "Your stories".');
  });

  it("never guesses between buttons with the same words, and presses the one the host picked", () => {
    const second = vi.fn();
    const s = screen(`<button>Open</button><button>Open</button>`);
    document.querySelectorAll("button")[1].addEventListener("click", second);
    expect(s.press("open")).toMatch(/There are 2 buttons called "Open".*which/);
    expect(s.press("open", undefined, 2)).toBe('Pressed "Open".');
    expect(second).toHaveBeenCalledOnce();
  });

  it("lists what is on screen when nothing matches", () => {
    expect(screen(`<button>Save</button><button>Cancel edit</button>`).press("publish"))
      .toBe('No button called "publish" on this screen. Buttons on screen: "Save", "Cancel edit".');
  });

  it("refuses buttons that need the host's own tap", () => {
    const click = vi.fn();
    const s = screen(`<button>Delete story</button><button>Subscribe</button><button>Log out</button>`);
    document.querySelector("button")!.addEventListener("click", click);
    expect(s.press("delete story")).toMatch(/needs a tap from the host/);
    expect(s.press("subscribe")).toMatch(/needs a tap from the host/);
    expect(s.press("log out")).toMatch(/needs a tap from the host/);
    expect(click).not.toHaveBeenCalled();
  });

  it("refuses passkey sign-in, which opens the browser's own prompt", () => {
    expect(screen(`<button>Sign in with a passkey</button>`).press("sign in with a passkey")).toMatch(/needs a tap from the host/);
  });

  it("treats faded-out popovers as hidden by default", () => {
    document.body.innerHTML = `<button>Copy feedback</button>`;
    const button = document.querySelector("button")!;
    const checkVisibility = vi.fn(() => false);
    Object.assign(button, { checkVisibility });
    const s = new DomScreen({ document, screenName: () => "Stories" });
    expect(s.press("copy feedback")).toMatch(/^No button called/);
    expect(checkVisibility).toHaveBeenCalledWith({ checkOpacity: true, checkVisibilityCSS: true });
  });

  it("skips disabled, hidden and invisible controls", () => {
    const s = screen(`
      <button disabled>Save</button>
      <button aria-disabled="true">Publish</button>
      <div aria-hidden="true"><button>Share</button></div>
      <div hidden><button>Print</button></div>
      <div data-test-hidden><button>Export</button></div>`);
    for (const label of ["save", "publish", "share", "print", "export"]) {
      expect(s.press(label)).toMatch(/^No button called/);
    }
  });

  it("never presses the voice call's own controls", () => {
    expect(screen(`<div data-voice-ignore><button>End call</button></div>`).press("end call"))
      .toMatch(/^No button called/);
  });

  it("only reaches the topmost open dialog, not the page behind it", () => {
    const behind = vi.fn();
    const s = screen(`
      <button>Save</button>
      <div role="dialog" aria-modal="true" aria-label="Rename story"><button>Save</button><button>Close</button></div>`);
    document.querySelector("body > button")!.addEventListener("click", behind);
    expect(s.press("save")).toBe('Pressed "Save".');
    expect(behind).not.toHaveBeenCalled();
    document.querySelector('[role="dialog"]')!.remove();
    expect(s.press("save")).toBe('Pressed "Save".');
    expect(behind).toHaveBeenCalledOnce();
  });

  it("turns switches on or off, and leaves one already that way alone", () => {
    const click = vi.fn();
    const s = screen(`<button role="switch" aria-checked="true">Daily reminders</button>`);
    document.querySelector("button")!.addEventListener("click", click);
    expect(s.press("daily reminders", true)).toBe('"Daily reminders" is already on.');
    expect(click).not.toHaveBeenCalled();
    expect(s.press("daily reminders", false)).toBe('Pressed "Daily reminders". It is now off.');
  });
});

describe("DomScreen.type", () => {
  it("types into a React-controlled field so React sees the change", () => {
    function Title() {
      const [value, setValue] = useState("Lagos");
      return <><input aria-label="Title" value={value} onChange={event => setValue(event.target.value)} /><p data-testid="echo">{value}</p></>;
    }
    const view = render(<Title />);
    const s = screen();
    act(() => {
      void s.type("Homecoming", { field: "title", mode: "replace" });
    });
    expect(view.getByTestId("echo").textContent).toBe("Homecoming");
  });

  it("appends after what is there, for dictation", async () => {
    const s = screen(`<label>Story <textarea>We drove to the farm.</textarea></label>`);
    await expect(s.type("Grandma was waiting.")).resolves.toBe('Typed into "Story". It now says "We drove to the farm. Grandma was waiting.".');
  });

  it("asks which field when there are several and none is named", async () => {
    const s = screen(`<input placeholder="Title"><textarea placeholder="Your story"></textarea>`);
    await expect(s.type("hello")).resolves.toBe('Which field? Fields on screen: "Title", "Your story". Call again with field.');
  });

  it("says so when there is nothing to type into", async () => {
    await expect(screen(`<p>Nothing here</p>`).type("hi")).resolves.toBe("There is no field to type into on Stories. Open the screen with the field first.");
  });

  it("sends with the field's Send button when asked", async () => {
    const send = vi.fn();
    const s = screen(`<div><textarea aria-label="Message"></textarea><button aria-label="Send">↑</button></div>`);
    document.querySelector("button")!.addEventListener("click", send);
    await expect(s.type("Hello Memento", { send: true })).resolves.toMatch(/Sent\.$/);
    expect(send).toHaveBeenCalledOnce();
  });

  it("says when a field has no send button", async () => {
    const s = screen(`<input aria-label="Nickname">`);
    await expect(s.type("Yo", { send: true })).resolves.toMatch(/no send button/);
  });

  it("never types into, reads or lists password and code fields, even when shown as text", async () => {
    const s = screen(`
      <input aria-label="Email">
      <input type="text" id="login-password" name="password" autocomplete="current-password" value="hunter22">
      <input type="text" aria-label="Verification code" autocomplete="one-time-code" value="481516">
      <input type="text" placeholder="Card number" value="4242">`);
    await expect(s.type("x", { field: "password" })).resolves.toBe('No field called "password". Fields on screen: "Email".');
    const text = s.describe();
    expect(text).toContain('Fields: "Email" (empty).');
    for (const secret of ["hunter22", "481516", "4242", "Verification code", "Card number"]) expect(text).not.toContain(secret);
  });

  it("does not type into the voice call's own message box", async () => {
    await expect(screen(`<div data-voice-ignore><textarea aria-label="Message"></textarea></div>`).type("hi"))
      .resolves.toMatch(/no field to type into/);
  });
});

describe("DomScreen.scroll", () => {
  function scroller(scrollTop: number, scrollHeight = 2000, clientHeight = 500) {
    document.body.innerHTML = `<main style="overflow-y: auto"><p>Long list</p></main>`;
    const main = document.querySelector("main")!;
    Object.defineProperty(main, "scrollHeight", { value: scrollHeight, configurable: true });
    Object.defineProperty(main, "clientHeight", { value: clientHeight, configurable: true });
    main.scrollTop = scrollTop;
    main.scrollTo = ((options: ScrollToOptions) => { main.scrollTop = Math.max(0, Math.min(options.top ?? 0, scrollHeight - clientHeight)); }) as typeof main.scrollTo;
    return main;
  }

  it("scrolls the page's scrolling area down by most of a screen", async () => {
    const main = scroller(0);
    await expect(screen().scroll("down")).resolves.toBe("Scrolled down.");
    expect(main.scrollTop).toBe(350);
  });

  it("says when it was already at the top", async () => {
    scroller(0);
    await expect(screen().scroll("up")).resolves.toBe("It was already at the top; nothing moved.");
  });

  it("says when it was already at the bottom", async () => {
    scroller(1500);
    await expect(screen().scroll("bottom")).resolves.toBe("It was already at the bottom; nothing moved.");
  });

  it("waits for a long smooth scroll to finish before answering", async () => {
    const main = scroller(0, 5000);
    main.scrollTo = ((options: ScrollToOptions) => {
      const target = options.top ?? 0;
      [1, 2, 3, 4].forEach(step => setTimeout(() => { main.scrollTop = (target * step) / 4; }, step * 100));
    }) as typeof main.scrollTo;
    const s = new DomScreen({ document, screenName: () => "Stories", isVisible: () => true });
    await expect(s.scroll("bottom")).resolves.toBe("Scrolled to the bottom.");
    expect(main.scrollTop).toBe(4500);
    await expect(s.scroll("down")).resolves.toBe("It was already at the bottom; nothing moved.");
  });

  it("says when nothing scrolls", async () => {
    await expect(screen(`<p>Short</p>`).scroll("down")).resolves.toBe("Nothing on Stories scrolls.");
  });
});

describe("DomScreen.describe", () => {
  it("tells the model the screen's name, what it says, its fields and buttons", () => {
    const text = screen(`
      <main><h1>Your stories</h1><p>The day we moved to Lagos.</p>
      <input aria-label="Search" value="Lagos"><button>Add new story</button></main>`).describe();
    expect(text).toContain("Screen: Stories.");
    expect(text).toContain("The day we moved to Lagos.");
    expect(text).toContain('Fields: "Search" (says "Lagos").');
    expect(text).toContain('Buttons: "Add new story".');
  });

  it("names an open dialog and describes only what is in it", () => {
    const text = screen(`
      <button>Behind</button>
      <div role="dialog" aria-modal="true" aria-label="Rename story"><input aria-label="Title"><button>Save</button></div>`).describe();
    expect(text).toContain('A dialog is open: "Rename story".');
    expect(text).toContain('Buttons: "Save".');
    expect(text).not.toContain("Behind");
  });

  it("treats the app's open modal and Radix dialogs as the screen", () => {
    const quickNote = screen(`
      <button>Behind</button>
      <div class="modal-overlay"><div data-voice-dialog="Quick note"><textarea placeholder="Write a note"></textarea><button>Save note</button></div></div>`).describe();
    expect(quickNote).toContain('A dialog is open: "Quick note".');
    expect(quickNote).toContain('Buttons: "Save note".');
    expect(quickNote).not.toContain("Behind");
    const radix = screen(`<button>Behind</button><div role="dialog" data-state="open" aria-label="New story"><button>Publish story</button></div>`).describe();
    expect(radix).toContain('A dialog is open: "New story".');
    expect(radix).not.toContain("Behind");
  });
});

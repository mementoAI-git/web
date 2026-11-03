/**
 * What voice can see, press, type into and scroll on the page in front of the
 * host. Unlike mobile, which registers each control, web reads the page
 * itself, the way browser agents do: buttons and links by their accessible
 * name, fields by their label, and the main scrolling area. Only the topmost
 * open dialog is reachable when one is open, and the voice call's own
 * controls (inside [data-voice-ignore]) never are.
 *
 * Results are sentences for the voice model, matching mobile's
 * voice-control/registry.ts so the shared prompt reads the same on both.
 */

export type ScrollDirection = "up" | "down" | "top" | "bottom";
export type TypeMode = "replace" | "append";

/** Never pressed by voice: deleting, cancelling, paying, subscribing and signing out need the host's own tap. */
const NEEDS_HOST_TAP =
  /\b(delete|remove|erase|cancel (my )?(plan|subscription)|unsubscribe|subscribe|upgrade|purchase|buy|pay|checkout|sign out|log ?out|deactivate|close (my )?account|passkey)\b/i;

/** Never typed into, read out or listed, even after "Show password" turns them into plain text fields. */
const SECRET_AUTOCOMPLETE = /\b(current-password|new-password|one-time-code|cc-number|cc-csc|cc-exp)\b/i;
const SECRET_NAME = /pass(word|code)|\botp\b|\bpin\b|\bcvc\b|\bcvv\b|card number/i;

const PRESSABLE = [
  "button", "a[href]", "summary", '[role="button"]', '[role="link"]', '[role="switch"]', '[role="checkbox"]',
  '[role="radio"]', '[role="tab"]', '[role="menuitem"]', '[role="option"]', 'input[type="checkbox"]',
  'input[type="radio"]', 'input[type="submit"]', 'input[type="button"]',
].join(",");

const FIELD = [
  "textarea", "input:not([type])", 'input[type="text"]', 'input[type="search"]', 'input[type="email"]',
  'input[type="url"]', 'input[type="tel"]', 'input[type="number"]', '[contenteditable="true"]',
  '[contenteditable=""]', '[role="textbox"]',
].join(",");

/** Open dialogs: ARIA modals, Radix dialogs, native dialogs and the app's own modal stack. */
const DIALOG = '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [role="alertdialog"], dialog[open], [data-voice-dialog]';

const MAX_LISTED = 8;
const MAX_CONTENT = 1_200;
const MAX_FIELD = 400;
const MAX_LABEL = 80;
/** Share of the visible area one "scroll down" moves. */
const SCROLL_PAGE = 0.7;
/** Movement smaller than this (pixels) is not a scroll. */
const SCROLL_MOVED = 4;
/** Smooth scrolling takes longer the farther it goes; wait until it stops, up to this long. */
const SCROLL_SETTLE_MAX_MS = 2_000;
const SCROLL_POLL_MS = 60;
/** Time for typed text to reach the page's state (and its Send button to appear). */
const SUBMIT_AFTER_TYPE_MS = 80;

const SCROLLED: Record<ScrollDirection, string> = {
  up: "Scrolled up.",
  down: "Scrolled down.",
  top: "Scrolled to the top.",
  bottom: "Scrolled to the bottom.",
};

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function flat(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function clip(text: string, max: number): string {
  const value = flat(text);
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Faded-out popovers (opacity 0) and visibility: hidden count as hidden, as they do to the host. */
function defaultIsVisible(element: Element): boolean {
  const check = (element as Element & {
    checkVisibility?: (options?: { checkOpacity?: boolean; checkVisibilityCSS?: boolean }) => boolean;
  }).checkVisibility;
  return typeof check === "function"
    ? check.call(element, { checkOpacity: true, checkVisibilityCSS: true })
    : element.getClientRects().length > 0;
}

type Pressable = { element: HTMLElement; label: string };
type Field = { element: HTMLElement; label: string };

export class DomScreen {
  private readonly document: Document;
  private readonly isVisible: (element: Element) => boolean;
  private readonly settleMs?: number;
  readonly screenName: () => string;

  constructor(options: {
    document: Document;
    screenName: () => string;
    /** Defaults to the browser's own visibility check; injectable because jsdom has no layout. */
    isVisible?: (element: Element) => boolean;
    /** Overrides the scroll and send waits (tests). */
    settleMs?: number;
  }) {
    this.document = options.document;
    this.screenName = options.screenName;
    this.isVisible = options.isVisible ?? defaultIsVisible;
    this.settleMs = options.settleMs;
  }

  /** The topmost open dialog, or the page. */
  private root(): HTMLElement {
    const dialogs = [...this.document.querySelectorAll<HTMLElement>(DIALOG)].filter(dialog => this.reachable(dialog));
    return dialogs.at(-1) ?? this.document.body;
  }

  private reachable(element: Element): boolean {
    return !element.closest('[data-voice-ignore], [hidden], [aria-hidden="true"], [inert]') && this.isVisible(element);
  }

  private enabled(element: HTMLElement): boolean {
    return !(element as HTMLButtonElement).disabled && element.getAttribute("aria-disabled") !== "true";
  }

  private labelledBy(element: Element): string {
    const ids = element.getAttribute("aria-labelledby");
    if (!ids) return "";
    return flat(ids.split(/\s+/).map(id => this.document.getElementById(id)?.textContent ?? "").join(" "));
  }

  /** A simplified accessible name: what the host would call it. */
  private nameOf(element: HTMLElement): string {
    const name = flat(element.getAttribute("aria-label")) || this.labelledBy(element)
      || (element instanceof HTMLInputElement && ["submit", "button"].includes(element.type) ? flat(element.value) : "")
      || flat(element.textContent) || flat(element.getAttribute("title"));
    return name.slice(0, MAX_LABEL);
  }

  /** A field's label, without the field's own contents. */
  private fieldLabel(element: HTMLElement): string {
    const own = flat(element.getAttribute("aria-label")) || this.labelledBy(element);
    if (own) return own.slice(0, MAX_LABEL);
    const label = (element as HTMLInputElement).labels?.[0] ?? element.closest("label");
    if (label) {
      const copy = label.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("input, textarea, select, [contenteditable]").forEach(control => control.remove());
      const text = flat(copy.textContent);
      if (text) return text.slice(0, MAX_LABEL);
    }
    return (flat(element.getAttribute("placeholder")) || flat(element.getAttribute("aria-placeholder"))
      || flat(element.getAttribute("name")) || flat(element.getAttribute("title"))
      || (element.isContentEditable ? "editor" : "text field")).slice(0, MAX_LABEL);
  }

  /** Buttons, links and options in front of the host, in page order. */
  buttons(root = this.root()): Pressable[] {
    return [...root.querySelectorAll<HTMLElement>(PRESSABLE)]
      .filter(element => this.reachable(element) && this.enabled(element))
      .map(element => ({ element, label: this.nameOf(element) }))
      .filter(button => Boolean(normalise(button.label)));
  }

  private secret(element: HTMLElement, label: string): boolean {
    if (SECRET_AUTOCOMPLETE.test(element.getAttribute("autocomplete") ?? "")) return true;
    return [label, element.getAttribute("name"), element.id, element.getAttribute("placeholder")]
      .some(text => SECRET_NAME.test(text ?? ""));
  }

  fields(root = this.root()): Field[] {
    return [...root.querySelectorAll<HTMLElement>(FIELD)]
      .filter(element => this.reachable(element) && this.enabled(element) && !(element as HTMLInputElement).readOnly)
      .map(element => ({ element, label: this.fieldLabel(element) }))
      .filter(field => !this.secret(field.element, field.label));
  }

  private quoted(buttons: Pressable[]): string {
    const seen = new Set<string>();
    return buttons
      .filter(button => {
        const key = normalise(button.label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_LISTED)
      .map(button => {
        const on = this.stateOf(button.element);
        return on === undefined ? `"${button.label}"` : `"${button.label}" (${on ? "on" : "off"})`;
      })
      .join(", ");
  }

  /** For switches, checkboxes and options: whether it is on now. */
  private stateOf(element: HTMLElement): boolean | undefined {
    if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) return element.checked;
    for (const attribute of ["aria-checked", "aria-pressed", "aria-selected"]) {
      const value = element.getAttribute(attribute);
      if (value === "true") return true;
      if (value === "false") return false;
    }
    return undefined;
  }

  /** Presses the button the host named; never guesses between buttons with the same words. */
  press(spoken: string, turnOn?: boolean, which?: number): string {
    const wanted = normalise(spoken);
    const buttons = this.buttons();
    const exact = buttons.filter(button => normalise(button.label) === wanted);
    const matches = exact.length ? exact : buttons.filter(button => {
      const label = normalise(button.label);
      return wanted.length > 0 && (label.includes(wanted) || wanted.includes(label));
    });
    if (!matches.length) {
      const onScreen = buttons.length ? ` Buttons on screen: ${this.quoted(buttons)}.` : "";
      return `No button called "${spoken}" on this screen.${onScreen}`;
    }
    let target = matches[0];
    if (matches.length > 1) {
      const sameWords = new Set(matches.map(button => normalise(button.label))).size === 1;
      if (which === undefined || !Number.isInteger(which) || which < 1 || which > matches.length) {
        return sameWords
          ? `There are ${matches.length} buttons called "${matches[0].label}" on this screen. Ask the host which one (first, second, …), then press again with which.`
          : `That matches more than one button: ${this.quoted(matches)}. Ask the host which one.`;
      }
      target = matches[which - 1];
    }
    if (NEEDS_HOST_TAP.test(target.label)) {
      return `"${target.label}" needs a tap from the host. Ask them to tap it themselves.`;
    }
    const on = this.stateOf(target.element);
    if (turnOn !== undefined && on === turnOn) return `"${target.label}" is already ${on ? "on" : "off"}.`;
    target.element.click();
    if (turnOn !== undefined && on !== undefined) return `Pressed "${target.label}". It is now ${turnOn ? "on" : "off"}.`;
    return `Pressed "${target.label}".`;
  }

  private read(element: HTMLElement): string {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
    return element.innerText ?? element.textContent ?? "";
  }

  private write(element: HTMLElement, text: string, mode: TypeMode, next: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // React tracks the value on the element; set it through the prototype so
      // React sees the change, then fire the input event it listens for.
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, next);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    // Rich editors: type through the browser so the editor keeps its own state.
    element.focus();
    const selection = this.document.getSelection();
    if (selection) {
      const range = this.document.createRange();
      range.selectNodeContents(element);
      if (mode === "append") range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    const insert = mode === "append" && flat(this.read(element)) ? ` ${text}` : text;
    let typed = false;
    try {
      typed = typeof this.document.execCommand === "function" && this.document.execCommand("insertText", false, insert);
    } catch {
      typed = false;
    }
    if (!typed) {
      element.textContent = next;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /** The field's own Send button, near it on the page. */
  private sendButtonFor(element: HTMLElement): HTMLElement | undefined {
    let container: HTMLElement | null = element.parentElement;
    for (let depth = 0; container && depth < 6; depth += 1, container = container.parentElement) {
      const send = this.buttons(container).find(button => /^send( message)?$/.test(normalise(button.label)));
      if (send) return send.element;
    }
    return undefined;
  }

  /** Types into a field so the host sees the words appear. With no field named, uses the only one. */
  async type(text: string, options: { field?: string; mode?: TypeMode; send?: boolean } = {}): Promise<string> {
    const fields = this.fields();
    if (!fields.length) return `There is no field to type into on ${this.screenName()}. Open the screen with the field first.`;
    const names = fields.map(field => `"${field.label}"`).join(", ");
    let target: Field | undefined;
    if (options.field) {
      const wanted = normalise(options.field);
      const exact = fields.filter(field => normalise(field.label) === wanted);
      const matches = exact.length ? exact : fields.filter(field => {
        const label = normalise(field.label);
        return wanted.length > 0 && (label.includes(wanted) || wanted.includes(label));
      });
      if (matches.length !== 1) {
        return matches.length
          ? `That matches more than one field: ${names}. Ask the host which one.`
          : `No field called "${options.field}". Fields on screen: ${names}.`;
      }
      [target] = matches;
    } else if (fields.length === 1) {
      [target] = fields;
    } else {
      return `Which field? Fields on screen: ${names}. Call again with field.`;
    }
    const mode = options.mode === "replace" ? "replace" : "append";
    const before = this.read(target.element);
    const next = mode === "append" && before.trim()
      ? `${before.replace(/\s+$/, "")}${/\n$/.test(before) ? "" : " "}${text.trim()}`
      : text;
    this.write(target.element, text.trim(), mode, next);
    const typed = `Typed into "${target.label}". It now says "${clip(next, MAX_FIELD)}".`;
    if (!options.send) return typed;
    // Let the page take in the text; its Send button may only appear now.
    await wait(this.settleMs ?? SUBMIT_AFTER_TYPE_MS);
    const send = this.sendButtonFor(target.element);
    if (send) {
      send.click();
      return `${typed} Sent.`;
    }
    const form = target.element.closest("form");
    if (form) {
      form.requestSubmit();
      return `${typed} Sent.`;
    }
    return `${typed} This field has no send button; tell the host.`;
  }

  /** The largest scrolling area in front of the host, or the page itself. */
  private scroller(root = this.root()): HTMLElement | undefined {
    const overflowing = (element: HTMLElement) => element.scrollHeight > element.clientHeight + SCROLL_MOVED;
    const candidates = [root, ...root.querySelectorAll<HTMLElement>("*")].filter(element =>
      element instanceof HTMLElement && overflowing(element) && this.reachable(element)
      && /(auto|scroll|overlay)/.test(this.document.defaultView?.getComputedStyle(element).overflowY ?? ""));
    const best = candidates.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    if (best) return best;
    const page = this.document.scrollingElement as HTMLElement | null;
    return root === this.document.body && page && overflowing(page) ? page : undefined;
  }

  /** Resolves once the scroll reaches its target or stops moving, so the next call starts from where it ended. */
  private async scrollStopped(element: HTMLElement, target: number): Promise<void> {
    let last = Number.NaN;
    let still = 0;
    for (let waited = 0; waited < SCROLL_SETTLE_MAX_MS; waited += SCROLL_POLL_MS) {
      await wait(SCROLL_POLL_MS);
      const now = element.scrollTop;
      if (Math.abs(now - target) <= 1) return;
      still = now === last ? still + 1 : 0;
      if (still >= 2) return;
      last = now;
    }
  }

  /** Scrolls, and says what really happened: at the top already is not "scrolled up". */
  async scroll(to: ScrollDirection): Promise<string> {
    const element = this.scroller();
    if (!element) return `Nothing on ${this.screenName()} scrolls.`;
    const before = element.scrollTop;
    const max = element.scrollHeight - element.clientHeight;
    const upward = to === "up" || to === "top";
    if (upward && before <= 1) return "It was already at the top; nothing moved.";
    if (!upward && before >= max - 1) return "It was already at the bottom; nothing moved.";
    const page = element.clientHeight * SCROLL_PAGE;
    const top = to === "top" ? 0 : to === "bottom" ? max : to === "up" ? before - page : before + page;
    if (typeof element.scrollTo === "function") element.scrollTo({ top, behavior: "smooth" });
    else element.scrollTop = top;
    if (this.settleMs !== undefined) await wait(this.settleMs);
    else await this.scrollStopped(element, Math.max(0, Math.min(top, max)));
    if (Math.abs(element.scrollTop - before) <= SCROLL_MOVED) {
      return upward ? "It was already at the top; nothing moved." : "It was already at the bottom; nothing moved.";
    }
    return SCROLLED[to];
  }

  /** Visible words in front of the host, excluding fields and the voice call. */
  private visibleText(root: HTMLElement): string {
    const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const parent = node.parentElement;
        if (!parent || parent.closest("script, style, textarea, input, [contenteditable]") || !this.reachable(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const words: string[] = [];
    let length = 0;
    for (let node = walker.nextNode(); node && length < MAX_CONTENT; node = walker.nextNode()) {
      const text = flat(node.textContent);
      if (!text) continue;
      words.push(text);
      length += text.length + 1;
    }
    return clip(words.join(" "), MAX_CONTENT);
  }

  /** What the host sees, for the model: the page, what it says, its fields and its buttons. */
  describe(): string {
    const root = this.root();
    const lines = [`Screen: ${this.screenName()}.`];
    if (root !== this.document.body) {
      const name = flat(root.dataset.voiceDialog) || this.nameOf(root);
      lines.push(name ? `A dialog is open: "${name}".` : "A dialog is open.");
    }
    const content = root === this.document.body ? (this.document.querySelector("main") ?? root) : root;
    const text = this.visibleText(content as HTMLElement);
    if (text) lines.push(`It says: "${text}"`);
    const fields = this.fields(root);
    if (fields.length) {
      lines.push(`Fields: ${fields.map(field => {
        const value = clip(this.read(field.element), MAX_FIELD);
        const canSend = this.sendButtonFor(field.element) ? ", can send" : "";
        return `"${field.label}" (${value ? `says "${value}"` : "empty"}${canSend})`;
      }).join(", ")}.`);
    }
    const buttons = this.buttons(root);
    if (buttons.length) lines.push(`Buttons: ${this.quoted(buttons)}.`);
    lines.push(this.scroller(root) ? "The screen can scroll." : "Nothing on this screen scrolls.");
    return lines.join("\n");
  }
}

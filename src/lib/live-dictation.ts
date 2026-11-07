// Web Speech is still vendor-prefixed in some browsers and absent from TS DOM types.
interface RecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface RecognitionConstructor {
  new (): Recognition;
  available?: (options: {
    langs: string[];
    processLocally: boolean;
    quality: string;
  }) => Promise<string>;
}

export function createLiveDictation() {
  const browser = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  const Constructor =
    browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!Constructor) return null;
  let recognition: Recognition;
  try {
    recognition = new Constructor();
  } catch {
    return null;
  }
  recognition.lang = navigator.language || "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  let completed: string[] = [];
  let current: string[] = [];
  let listening = false;
  let running = false;
  let cancelled = false;
  let failed = false;
  let finishResult: ((text: string | null) => void) | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const text = () => [...completed, ...current].join(" ").trim();
  function complete(value: string | null) {
    clearTimeout(deadline);
    finishResult?.(value);
    finishResult = undefined;
  }
  function begin() {
    if (running || !listening || cancelled || failed) return;
    current = [];
    try {
      recognition.start();
      running = true;
    } catch {
      failed = true;
    }
  }
  recognition.onresult = (event) => {
    if (cancelled || failed) return;
    // Results replace interim hypotheses; never append repeated partial words.
    current = Array.from(event.results, (result) =>
      result[0].transcript.trim(),
    );
  };
  recognition.onerror = (event) => {
    if (event.error !== "no-speech") failed = true;
  };
  recognition.onend = () => {
    running = false;
    completed = [...completed, ...current];
    current = [];
    if (finishResult) complete(failed || cancelled ? null : text() || null);
    else begin();
  };
  return {
    async start() {
      // Only select local processing when the dictation language pack is installed.
      // Never hold up recording to download a model or wait on a capability check.
      if (Constructor.available && "processLocally" in recognition) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const available = await Promise.race([
            Constructor.available({
              langs: [recognition.lang],
              processLocally: true,
              quality: "dictation",
            }),
            new Promise<string>((resolve) => {
              timeout = setTimeout(() => resolve("unavailable"), 200);
            }),
          ]);
          recognition.processLocally = available === "available";
        } catch {
          recognition.processLocally = false;
        } finally {
          clearTimeout(timeout);
        }
      }
      if (cancelled) return;
      listening = true;
      begin();
    },
    pause() {
      listening = false;
      if (running) {
        try {
          recognition.stop();
        } catch {
          failed = true;
        }
      }
    },
    resume() {
      listening = true;
      begin();
    },
    /** Everything heard so far, even if the recognizer later failed or stopped early. */
    heard() {
      return text();
    },
    finish(): Promise<string | null> {
      listening = false;
      if (failed || cancelled || !running)
        return Promise.resolve(failed || cancelled ? null : text() || null);
      return new Promise((resolve) => {
        finishResult = resolve;
        // Usually onend arrives immediately with the final words. An unresponsive
        // recognizer falls back to the complete audio rather than dropping its tail.
        deadline = setTimeout(() => {
          failed = true;
          complete(null);
          try {
            recognition.abort();
          } catch {
            /* Already stopped. */
          }
        }, 1500);
        try {
          recognition.stop();
        } catch {
          failed = true;
          complete(null);
        }
      });
    },
    cancel() {
      cancelled = true;
      listening = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      complete(null);
      try {
        recognition.abort();
      } catch {
        /* Already stopped. */
      }
    },
  };
}

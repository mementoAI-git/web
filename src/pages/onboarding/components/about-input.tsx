import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOverviewDictation } from "@/pages/dashboard/overview/sections/use-overview-dictation";
import { ABOUT_LIMIT } from "../limits";
import "@/components/motion/icon-swap.css";
import "./about-input.css";

function VoiceIcon({ name, className = "" }: { name: string; className?: string }) {
  return <span aria-hidden className={`about-voice-icon ${className}`} style={{ maskImage: `url(/assets/onboarding/about/${name}.svg)` }} />;
}

export function AboutInput({ value, onChange, onBusyChange }: {
  value: string;
  onChange: (value: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const pendingTextRef = useRef<HTMLDivElement>(null);
  // Keep the recorder above both presentations so expanding never restarts it.
  const recording = useOverviewDictation((text) => {
    const next = text.trim();
    if (!next) return;
    onChange(value.trim() ? `${value}${/\s$/.test(value) ? "" : " "}${next}` : next);
  });
  const busy = recording.phase !== "idle";
  const capturing = recording.phase === "recording" || recording.phase === "paused";
  const hasText = Boolean(value.trim());
  useLayoutEffect(() => {
    const text = pendingTextRef.current;
    if (text) text.scrollTop = text.scrollHeight;
  }, [busy, expanded, recording.phase]);
  const excess = Math.max(0, value.length - ABOUT_LIMIT);
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange(false), [onBusyChange]);

  const editor = (inDialog: boolean) => <div className="flex min-h-0 flex-col gap-2">
    <div className={`about-editor relative flex flex-col gap-2 rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2 text-text-neutral-strong focus-within:ring-2 focus-within:ring-stroke-neutral-strong ${inDialog ? "h-[min(65dvh,520px)]" : "h-[196px]"}`}>
      <Button ref={inDialog ? undefined : expandRef} type="button" variant="ghost" size="icon-sm"
        className="absolute right-2 top-2 z-10 size-7 rounded-md text-text-neutral-weak"
        aria-label={inDialog ? "Collapse introduction" : "Expand introduction"}
        aria-expanded={inDialog} onClick={() => setExpanded(!inDialog)}>
        <span className="t-icon-swap" data-state={inDialog ? "b" : "a"} aria-hidden>
          <Maximize2 className="t-icon size-4" data-icon="a" /><Minimize2 className="t-icon size-4" data-icon="b" />
        </span>
      </Button>
      <div className="relative min-h-0 flex-1">
        {busy && hasText ? <div ref={pendingTextRef} role="textbox" aria-label="Enter About info" aria-readonly="true"
          className="about-text-layer h-full overflow-y-auto">
          <span>{value.slice(0, ABOUT_LIMIT)}<span className="text-text-error-strong" data-excess>{value.slice(ABOUT_LIMIT)}</span></span>
          {recording.phase === "transcribing" ? <span role="status" aria-label="Transcribing additional recording" className="ml-2 inline-block size-4 animate-spin align-middle text-icon-neutral-weak motion-reduce:animate-none"><VoiceIcon name="loading" /></span>
            : <span role="status" className="ml-2 inline text-sm text-text-neutral-weak">{capturing ? "Recording…" : "Starting…"}{capturing && <span className="ml-2 tabular-nums">{String(Math.floor(recording.seconds / 60)).padStart(2, "0")}:{String(recording.seconds % 60).padStart(2, "0")}s</span>}</span>}
        </div> : busy ? <div role="status" className="flex flex-wrap items-center gap-3 pr-8">
          {!capturing && <VoiceIcon name="loading" className="!size-6 animate-spin motion-reduce:animate-none text-text-neutral-weak" />}
          <span className="font-garamond text-2xl italic leading-[34px]">{capturing ? "Recording…" : recording.phase === "starting" ? "Starting…" : "Transcribing…"}</span>
          {capturing && <span className="flex items-center gap-2 text-sm tabular-nums text-text-neutral-weak"><span className="size-2 rounded-full bg-text-error-strong" />{String(Math.floor(recording.seconds / 60)).padStart(2, "0")}:{String(recording.seconds % 60).padStart(2, "0")}s</span>}
        </div> : <>
          <div ref={mirrorRef} aria-hidden className="about-text-layer pointer-events-none absolute inset-0 overflow-hidden">
            {value.slice(0, ABOUT_LIMIT)}<span className="text-text-error-strong" data-excess>{value.slice(ABOUT_LIMIT)}</span>{"\n"}
          </div>
          <textarea id={inDialog ? "onboarding-about-expanded" : "onboarding-about"} aria-label="Enter About info"
            aria-describedby={inDialog ? "about-counter-expanded about-error-expanded" : "about-counter about-error"}
            aria-invalid={excess > 0} value={value} onChange={(event) => onChange(event.target.value)}
            onScroll={(event) => { if (mirrorRef.current) mirrorRef.current.scrollTop = event.currentTarget.scrollTop; }}
            placeholder="Eg: I am a software engineer and a father of 2 living in Dublin. I care about family, creativity and personal growth. Lately I’ve been focused on building the things I’m proud of…"
            className="about-text-layer relative block size-full resize-none bg-transparent text-transparent caret-text-neutral-strong outline-none placeholder:text-text-neutral-weaker" />
        </>}
      </div>
      <div className="flex h-8 shrink-0 items-center gap-3">
        {capturing ? <>
          <Button type="button" variant="outline" size="icon-sm" className="size-8 shrink-0 rounded-full border-stroke-neutral-strong bg-transparent text-text-neutral-weak" aria-label="Cancel recording" onClick={recording.cancel}><VoiceIcon name="cancel" /></Button>
          <div className="flex h-8 min-w-0 flex-1 items-center gap-1 overflow-hidden" aria-hidden>
            {recording.levels.map((height, i) => <span key={i} className="w-1 shrink-0 rounded-full bg-icon-neutral-weak" style={{ height: Math.min(24, Math.max(4, height)) }} />)}
          </div>
        </> : <span id={inDialog ? "about-counter-expanded" : "about-counter"} className="flex-1 text-sm tabular-nums"><span className={excess ? "text-text-error-strong" : ""}>{value.length}</span>/{ABOUT_LIMIT}</span>}
        <Button type="button" variant="outline" size="icon-sm" className="size-8 shrink-0 rounded-full border-stroke-neutral-strong bg-transparent text-text-neutral-weak"
          aria-label={capturing ? "Stop and transcribe" : "Record about yourself"}
          disabled={!capturing && (busy || value.length >= ABOUT_LIMIT)}
          onClick={() => capturing ? recording.stop() : void recording.start()}>
          <span className="t-icon-swap" data-state={capturing ? "b" : "a"} aria-hidden>
            <span className="t-icon flex" data-icon="a"><VoiceIcon name="mic" /></span>
            <span className="t-icon flex text-text-brand-strong" data-icon="b"><VoiceIcon name="stop" /></span>
          </span>
        </Button>
      </div>
    </div>
    <div id={inDialog ? "about-error-expanded" : "about-error"} aria-live="polite" className="text-sm text-text-error-strong">
      {excess > 0 && <p>Remove {excess.toLocaleString()} characters to continue.</p>}
      {recording.error && <div className="flex flex-wrap items-center gap-2"><p>{recording.error}</p>{recording.canRetry && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void recording.retry()}>Retry transcription</Button>}</div>}
    </div>
  </div>;

  return <div className="flex flex-col gap-2">
    <label htmlFor={expanded ? "onboarding-about-expanded" : "onboarding-about"} className="text-sm font-medium">Enter About info</label>
    {!expanded ? editor(false) : <div className="h-[196px]" aria-hidden />}
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="sm:max-w-3xl motion-reduce:animate-none"
        onCloseAutoFocus={(event) => { event.preventDefault(); expandRef.current?.focus(); }}>
        <DialogTitle className="sr-only">About yourself</DialogTitle>
        {editor(true)}
      </DialogContent>
    </Dialog>
  </div>;
}

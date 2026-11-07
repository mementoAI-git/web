import { Slider as SliderPrimitive } from "radix-ui";

/** Click or drag anywhere on the track. Arrow, Home and End keys also work. */
export function VolumeControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 font-geist text-sm text-text-neutral-weaker" aria-hidden>Volume</span>
      <SliderPrimitive.Root
        className="relative flex h-6 min-w-0 flex-1 cursor-pointer touch-none select-none items-center"
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={([next]) => onChange(next)}
      >
        <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[var(--stroke-neutral-weak)]">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--icon-neutral-strong)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label="Volume"
          className="block size-4 cursor-grab rounded-full bg-[var(--icon-neutral-strong)] shadow-sm outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing motion-reduce:transition-none"
        />
      </SliderPrimitive.Root>
      <span className="w-[4ch] shrink-0 text-right font-geist text-sm tabular-nums text-text-neutral-strong" aria-hidden>{value}%</span>
    </div>
  );
}

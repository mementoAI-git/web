import { lazy, Suspense, useEffect, useRef, useState } from "react";

type OrangePalette = {
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
};

// Load the GPU renderer only when this decorative background can animate.
const FlowingOrange = lazy(async () => {
  const { Shader, FlowingGradient } = await import("shaders/react");
  return {
    default: function FlowingOrange({ palette }: { palette: OrangePalette }) {
      return (
        <Shader
          className="absolute inset-0 size-full"
          colorSpace="srgb"
          disableTelemetry
        >
          <FlowingGradient
            {...palette}
            speed={1.5}
            distortion={0.45}
            seed={7}
          />
        </Shader>
      );
    },
  };
});

export function ProCardBackground() {
  const surface = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<OrangePalette | null>(null);

  useEffect(() => {
    if (!("gpu" in navigator) || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (media.matches || !("gpu" in navigator) || !surface.current) {
        setPalette(null);
        return;
      }
      // Resolve the semantic brand token before passing colors to the GPU library.
      const channels = getComputedStyle(surface.current)
        .backgroundColor.match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      if (!channels || channels.length !== 3) return;
      const highlight = (amount: number) =>
        `rgb(${channels.map((value) => Math.round(value + (255 - value) * amount)).join(", ")})`;
      setPalette({
        colorA: highlight(0),
        colorB: highlight(0.12),
        colorC: highlight(0.32),
        colorD: highlight(0.06),
      });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div
      ref={surface}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-fill-brand-strong"
    >
      {palette && (
        <Suspense fallback={null}>
          <FlowingOrange palette={palette} />
        </Suspense>
      )}
    </div>
  );
}

import { DotGrid } from "@/components/react-bits/dot-grid";
import { palette } from "@/styles/tokens";

/**
 * The hero background the pages share: the DotGrid field and a violet glow. It fills
 * its section, which slides up under the navbar (`-mt-(--site-header-height)`), so the
 * background reaches the top of the page. The resting dots use `--dot-grid`, darker
 * than text, and hero text without a background of its own takes `text-scrim`
 * (T7SEN, 2026-10-16: text over the dots was hard to read).
 */
export function HeroBackdrop() {
  return (
    <>
      {/* React Bits effects take the palette's values: they draw with WebGL and canvas. */}
      <div aria-hidden="true" className="absolute inset-0">
        <DotGrid
          baseColor={palette.dotGrid}
          activeColor={palette.primary}
          dotSize={4}
          gap={22}
          fade={0.7}
          opacity={0.45}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
    </>
  );
}

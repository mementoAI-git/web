# Explore Category Image Optimization Design

## Goal

Deliver the eleven new Explore category illustrations quickly and sharply across mobile and desktop without shipping the multi-megabyte PNG masters, distorting artwork, or causing layout shift.

## Scope

This change is frontend-only. It covers repository asset organization, deterministic WebP generation, typed category-to-artwork metadata, a small Explore-specific responsive image component, and its use on the Explore index, category detail header, and existing topic cards that show Explore artwork.

It does not change API contracts, category taxonomy, backend behavior, or introduce a general-purpose media platform.

## Asset Organization

- Keep the eleven original PNG files in `src/assets/image/categories/masters/` as unmodified source assets.
- Never import master PNGs into application modules, so Vite does not include them in production output.
- Generate delivery assets under `src/assets/image/categories/generated/`.
- Use canonical category slugs and target widths in filenames, for example `growing-up-480.webp`.
- Generate widths 480, 768, 1024, and 1440 pixels when the master is at least that wide. Never upscale a smaller source.
- Encode WebP at quality 82 initially. Record generated dimensions and byte sizes so unusually large outputs can be reviewed without reducing quality blindly.

## Image Generation Pipeline

Add a small Node script backed by the dev-only `sharp` package. The script will:

1. discover the canonical PNG masters;
2. validate that all eleven category slugs are present;
3. read each master’s intrinsic dimensions;
4. generate only allowed non-upscaled WebP widths;
5. preserve aspect ratio and strip unnecessary metadata;
6. skip a category when every expected output is newer than its master and generation settings have not changed;
7. support a force option for intentional regeneration;
8. generate a deterministic TypeScript manifest containing imported variant URLs, intrinsic dimensions, and optional focal-position metadata.

Expose the pipeline as `npm run images:explore`. Generated WebP assets and the manifest will be checked into the repository so production builds do not require native image processing.

## Runtime Model

The generated manifest will map each canonical Explore slug to:

- the smallest default `src`;
- a width-descriptor `srcSet` containing only generated variants;
- master width and height for intrinsic aspect ratio;
- an optional CSS object position for artwork-specific cropping.

Legacy category aliases will continue to resolve to canonical slugs before artwork lookup. Unknown or free-form memory categories will continue using the existing generic fallback rather than being treated as Explore categories.

## Responsive Image Component

Create one focused `ExploreCategoryImage` component. It will accept:

- a canonical or legacy category slug;
- decorative or descriptive alt text;
- a `sizes` value appropriate to its layout;
- eager or lazy loading intent;
- class names for the image and its frame.

The component will render a standard `<img>` with `src`, `srcSet`, `sizes`, `width`, `height`, `decoding="async"`, and native loading attributes. It will use `object-fit: cover` inside a frame with a known aspect ratio. No master PNG URL will be available to the browser.

## Layout-Specific Loading

- Explore index: load the first category image eagerly with high fetch priority; lazy-load the remaining cards. Use a responsive `sizes` expression matching the one-, two-, and three-column grid.
- Category detail: load the hero artwork eagerly with high fetch priority. Reserve a consistent frame before download.
- Overview/topic carousel: lazy-load artwork and advertise its approximately 238-pixel rendered width.
- Do not add global preloads. Native viewport-aware loading handles in-view lazy images without eagerly downloading the entire catalog.

## Layout Stability and Cropping

Category cards retain their existing fixed-height frames and `object-cover` behavior. The category detail image receives an explicit aspect-ratio frame instead of relying on loaded image height. Intrinsic width and height remain on every image for browser sizing calculations.

Most artwork uses centered cropping. The portrait `what-life-taught-me` master and any composition that loses its subject under `object-cover` may receive a category-specific object position in the manifest after browser review.

## Accessibility

When the category title is immediately adjacent and communicates the same information, the artwork is decorative and uses `alt=""`. Standalone artwork may use the category title as alt text. Loading optimization must not alter link names, focus behavior, or semantic heading structure.

## Testing and Verification

Implementation follows test-first development:

- test that all eleven canonical categories have generated artwork metadata;
- test that no declared variant exceeds its source width;
- test predictable `srcSet` and layout-specific `sizes` behavior;
- test eager loading for the first Explore card and category hero;
- test lazy loading for later cards and overview artwork;
- test decorative alt behavior and legacy alias resolution.

After generation, report every variant’s dimensions and file size. Inspect representative mobile and desktop layouts in the browser, confirm different viewport sizes select different `currentSrc` variants, confirm no PNG master requests occur, and check cropping for all eleven images. Then run focused tests, the repository test suite, ESLint, the project variable check, and the production build.

## Tradeoffs

- `sharp` adds a native development dependency, but it is not bundled into the application and provides a portable, deterministic pipeline across macOS, Linux, and CI.
- Checked-in generated assets increase repository size, but avoid production build dependencies and make deployed bytes reviewable.
- WebP is used without an additional PNG fallback because the supported browser baseline already supports WebP and the explicit requirement names it as the production format.
- Quality 82 is the initial shared setting. It may be adjusted only if visual review or measured file sizes justify a change.

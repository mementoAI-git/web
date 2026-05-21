# Memento Color Inventory

This document catalogs all colors used in the Memento web application, organized by color system and usage frequency.

**Last Updated:** April 1, 2026 (Post-Migration)

---

## Table of Contents

1. [V3 Design System (Primary)](#v3-design-system-primary)
  - [V3 Semantic Tokens](#v3-design-system-primary)
  - [V3 Color Class Usage](#v3-color-class-usage-tailwind)
  - [V3 Primitive Colors](#v3-primitive-colors)
  - [V3 Color Semantics](#v3-color-semantics)
  - [Semantic to Primitive Mapping](#semantic-to-primitive-mapping)
2. [Colors Used in SVG Assets](#colors-used-in-svg-assets)
3. [Hardcoded Hex Colors](#hardcoded-hex-colors)
4. [CSS Variable Colors](#css-variable-colors)
5. [Shadcn UI Theme Colors](#shadcn-ui-theme-colors)
6. [Onboarding (Groot) Colors](#onboarding-groot-colors)
7. [Legacy/Deprecated Colors](#legacydeprecated-colors)
8. [Recommendations](#recommendations)

---

## V3 Design System (Primary)

The V3 design system uses CSS custom properties based on a base color of `#170B00` (deep brown/black). These are the **recommended** colors for all new development.


| Color Variable            | RGBA Value              | ≈ Composited Hex | Color Description | Usage Count | Primary Use                                |
| ------------------------- | ----------------------- | ---------------- | ----------------- | ----------- | ------------------------------------------ |
| `--text-neutral-strong`   | `rgba(23, 11, 0, 0.9)`  | `#2A1500`        | Dark brown        | 183         | Primary text, headings, important labels   |
| `--text-neutral-weak`     | `rgba(23, 11, 0, 0.65)` | `#6B5D53`        | Medium brown-gray | 126         | Secondary text, descriptions, placeholders |
| `--stroke-neutral-weak`   | `rgba(23, 11, 0, 0.1)`  | `#E9E7E6`        | Very light gray   | 109         | Borders, dividers, card outlines           |
| `--fill-neutral-weak`     | `rgba(23, 11, 0, 0.04)` | `#F9F9F8`        | Off-white         | 99          | Subtle backgrounds, hover states           |
| `--text-neutral-weaker`   | `rgba(23, 11, 0, 0.45)` | `#9E8D7D`        | Warm gray-brown   | 46          | Tertiary text, hints, metadata             |
| `--fill-neutral-weaker`   | `rgba(23, 11, 0, 0.02)` | `#FCFCFB`        | Near-white        | 46          | Very subtle backgrounds, zebra striping    |
| `--text-brand-strong`     | `#ff5e00`               | `#ff5e00`        | Vibrant orange    | 35          | Primary CTA buttons, brand accent, links   |
| `--icon-neutral-strong`   | `rgba(23, 11, 0, 0.45)` | `#9E8D7D`        | Warm gray-brown   | 20          | Icon default color                         |
| `--stroke-neutral-strong` | `rgba(23, 11, 0, 0.45)` | `#9E8D7D`        | Warm gray-brown   | 16          | Focus rings, active borders                |
| `--fill-neutral-strong`   | `rgba(23, 11, 0, 0.9)`  | `#2A1500`        | Dark brown        | 16          | Dark UI elements, overlays                 |
| `--text-neutral-disabled` | `rgba(23, 11, 0, 0.1)`  | `#E9E7E6`        | Very light gray   | ~5          | Disabled text states                       |
| `--icon-neutral-disabled` | `rgba(23, 11, 0, 0.1)`  | `#E9E7E6`        | Very light gray   | ~3          | Disabled icons                             |
| `--bg-neutral`            | `#ffffff`               | `#ffffff`        | Pure white        | 6           | Full-page backgrounds                      |


### V3 Color Class Usage (Tailwind)


| Tailwind Class          | Composited Hex | Color Description | Usage Count | Common Applications            |
| ----------------------- | -------------- | ----------------- | ----------- | ------------------------------ |
| `text-neutral-strong`   | `#2A1500`      | Dark brown        | 183         | Body text, headings, labels    |
| `text-neutral-weak`     | `#6B5D53`      | Medium brown-gray | 126         | Descriptions, helper text      |
| `border-neutral-weak`   | `#E9E7E6`      | Very light gray   | 109         | Card borders, input borders    |
| `bg-neutral-weak`       | `#F9F9F8`      | Off-white         | 99          | Card backgrounds, hover states |
| `text-neutral-weaker`   | `#9E8D7D`      | Warm gray-brown   | 46          | Meta text, timestamps          |
| `bg-neutral-weaker`     | `#FCFCFB`      | Near-white        | 46          | Subtle backgrounds             |
| `bg-brand-strong`       | `#ff5e00`      | Vibrant orange    | 25          | Primary buttons, badges        |
| `icon-neutral-strong`   | `#9E8D7D`      | Warm gray-brown   | 20          | Icons, icon buttons            |
| `border-neutral-strong` | `#9E8D7D`      | Warm gray-brown   | 16          | Focus states, active borders   |
| `bg-neutral-strong`     | `#2A1500`      | Dark brown        | 16          | Dark buttons, overlays         |
| `text-brand-strong`     | `#ff5e00`      | Vibrant orange    | 10          | Links, brand highlights        |
| `border-brand-strong`   | `#ff5e00`      | Vibrant orange    | 8           | Brand-accented borders         |
| `bg-neutral-weaker`     | `#E9E7E6`      | Very light gray   | 8           | Progress bars, subtle fills    |
| `text-neutral-strong`   | `#2A1500`      | Dark brown        | 6           | Text on light backgrounds      |
| `bg-neutral`            | `#ffffff`      | Pure white        | 6           | Page backgrounds               |


### V3 Primitive Colors

Primitive color scales for the V3 design system. Each color has Light (on light backgrounds) and Dark (on dark backgrounds) variants with opacity-based scales.

#### Neutral

**Light Mode (on white backgrounds)**


| Token            | Hex Value | Opacity | Composited Hex | Usage              |
| ---------------- | --------- | ------- | -------------- | ------------------ |
| `--neutral-1000` | `#000000` | 100%    | `#000000`      | Primary text       |
| `--neutral-700`  | `#000000` | 60%     | `#666666`      | Secondary text     |
| `--neutral-500`  | `#000000` | 45%     | `#8C8C8C`      | Tertiary text      |
| `--neutral-100`  | `#000000` | 10%     | `#E6E6E6`      | Borders, dividers  |
| `--neutral-50`   | `#000000` | 4%      | `#F5F5F5`      | Subtle backgrounds |
| `--neutral-25`   | `#000000` | 2%      | `#FAFAFA`      | Hover states       |


**Dark Mode (on dark backgrounds)**


| Token            | Hex Value | Opacity | Composited Hex | Usage              |
| ---------------- | --------- | ------- | -------------- | ------------------ |
| `--neutral-1000` | `#FFFFFF` | 100%    | `#FFFFFF`      | Primary text       |
| `--neutral-700`  | `#FFFFFF` | 78%     | `#D9D9D9`      | Secondary text     |
| `--neutral-500`  | `#FFFFFF` | 60%     | `#999999`      | Tertiary text      |
| `--neutral-100`  | `#FFFFFF` | 12%     | `#2E2E2E`      | Borders, dividers  |
| `--neutral-50`   | `#FFFFFF` | 6%      | `#1A1A1A`      | Subtle backgrounds |
| `--neutral-25`   | `#FFFFFF` | 3%      | `#111111`      | Hover states       |


#### Brown (Base Color)

The V3 design system base color scale. Used for the brown-based semantic tokens (`--text-neutral-strong`, `--stroke-neutral-weak`, etc.).

**Light Mode (on white backgrounds)**


| Token          | Hex Value | Opacity | Composited Hex | Usage                                  |
| -------------- | --------- | ------- | -------------- | -------------------------------------- |
| `--brown-1000` | `#170B00` | 90%     | `#2A1500`      | Primary text (text-neutral-strong)     |
| `--brown-700`  | `#170B00` | 65%     | `#6B5D53`      | Secondary text (text-neutral-weak)     |
| `--brown-500`  | `#170B00` | 45%     | `#9E8D7D`      | Tertiary text (text-neutral-weaker)    |
| `--brown-100`  | `#170B00` | 10%     | `#E9E7E6`      | Borders (stroke-neutral-weak)          |
| `--brown-50`   | `#170B00` | 4%      | `#F9F9F8`      | Subtle backgrounds (fill-neutral-weak) |
| `--brown-25`   | `#170B00` | 2%      | `#FCFCFB`      | Hover states (fill-neutral-weaker)     |


**Dark Mode (on dark backgrounds)**


| Token          | Hex Value | Opacity | Composited Hex | Usage              |
| -------------- | --------- | ------- | -------------- | ------------------ |
| `--brown-1000` | `#FFFFFF` | 100%    | `#FFFFFF`      | Primary text       |
| `--brown-700`  | `#FFFFFF` | 78%     | `#D9D9D9`      | Secondary text     |
| `--brown-500`  | `#FFFFFF` | 60%     | `#999999`      | Tertiary text      |
| `--brown-100`  | `#FFFFFF` | 12%     | `#2E2E2E`      | Borders            |
| `--brown-50`   | `#FFFFFF` | 6%      | `#1A1A1A`      | Subtle backgrounds |
| `--brown-25`   | `#FFFFFF` | 3%      | `#111111`      | Hover states       |


#### Orange (Brand)

**Light Mode**


| Token           | Hex Value | Opacity | Composited Hex | Usage                  |
| --------------- | --------- | ------- | -------------- | ---------------------- |
| `--orange-1000` | `#FF5E00` | 100%    | `#FF5E00`      | Primary buttons, links |
| `--orange-800`  | `#FF5E00` | 80%     | `#FF7E33`      | Hover states           |
| `--orange-200`  | `#FF5E00` | 20%     | `#FFD1B3`      | Light accents          |
| `--orange-50`   | `#FF5E00` | 5%      | `#FFF0E6`      | Background tints       |


**Dark Mode**


| Token           | Hex Value | Opacity | Composited Hex | Usage                  |
| --------------- | --------- | ------- | -------------- | ---------------------- |
| `--orange-1000` | `#FF5E00` | 100%    | `#FF5E00`      | Primary buttons, links |
| `--orange-800`  | `#FF5E00` | 80%     | `#FF7E33`      | Hover states           |
| `--orange-200`  | `#FF5E00` | 20%     | `#331200`      | Light accents          |
| `--orange-50`   | `#FF5E00` | 6%      | `#1A0900`      | Background tints       |


#### Red (Error/Danger)

**Light Mode**


| Token        | Hex Value | Opacity | Composited Hex | Usage             |
| ------------ | --------- | ------- | -------------- | ----------------- |
| `--red-1000` | `#C73A3A` | 100%    | `#C73A3A`      | Error text, icons |
| `--red-800`  | `#C73A3A` | 80%     | `#D66161`      | Error hover       |
| `--red-200`  | `#C73A3A` | 14%     | `#F4D4D4`      | Error backgrounds |
| `--red-50`   | `#FF4A4A` | 5%      | `#FFF0F0`      | Subtle error tint |


**Dark Mode**


| Token        | Hex Value | Opacity | Composited Hex | Usage             |
| ------------ | --------- | ------- | -------------- | ----------------- |
| `--red-1000` | `#FF9C9C` | 100%    | `#FF9C9C`      | Error text, icons |
| `--red-800`  | `#FF9C9C` | 80%     | `#FFB0B0`      | Error hover       |
| `--red-200`  | `#FF9C9C` | 20%     | `#330505`      | Error backgrounds |
| `--red-50`   | `#FF9C9C` | 8%      | `#2B0A0A`      | Subtle error tint |


#### Amber (Warning)

**Light Mode**


| Token          | Hex Value | Opacity | Composited Hex | Usage               |
| -------------- | --------- | ------- | -------------- | ------------------- |
| `--amber-1000` | `#8F6C1A` | 100%    | `#8F6C1A`      | Warning text        |
| `--amber-800`  | `#8F6C1A` | 80%     | `#A58947`      | Warning hover       |
| `--amber-200`  | `#8F6C1A` | 20%     | `#E9DEC5`      | Warning backgrounds |
| `--amber-50`   | `#FFC02E` | 5%      | `#FFF9EB`      | Subtle warning tint |


**Dark Mode**


| Token          | Hex Value | Opacity | Composited Hex | Usage               |
| -------------- | --------- | ------- | -------------- | ------------------- |
| `--amber-1000` | `#E0BE70` | 100%    | `#E0BE70`      | Warning text        |
| `--amber-800`  | `#E0BE70` | 80%     | `#E8CB8D`      | Warning hover       |
| `--amber-200`  | `#E0BE70` | 20%     | `#2E250E`      | Warning backgrounds |
| `--amber-50`   | `#E0BE70` | 8%      | `#2A2310`      | Subtle warning tint |


#### Green (Success)

**Light Mode**


| Token          | Hex Value | Opacity | Composited Hex | Usage               |
| -------------- | --------- | ------- | -------------- | ------------------- |
| `--green-1000` | `#067A57` | 100%    | `#067A57`      | Success text, icons |
| `--green-800`  | `#067A57` | 80%     | `#389579`      | Success hover       |
| `--green-200`  | `#067A57` | 20%     | `#D1E8E0`      | Success backgrounds |
| `--green-50`   | `#0ACC92` | 5%      | `#E6FAF3`      | Subtle success tint |


**Dark Mode**


| Token          | Hex Value | Opacity | Composited Hex | Usage               |
| -------------- | --------- | ------- | -------------- | ------------------- |
| `--green-1000` | `#77C7AF` | 100%    | `#77C7AF`      | Success text, icons |
| `--green-800`  | `#77C7AF` | 80%     | `#92D2BF`      | Success hover       |
| `--green-200`  | `#77C7AF` | 20%     | `#0F2A23`      | Success backgrounds |
| `--green-50`   | `#77C7AF` | 8%      | `#0F2520`      | Subtle success tint |


#### Blue (Info)

**Light Mode**


| Token         | Hex Value | Opacity | Composited Hex | Usage            |
| ------------- | --------- | ------- | -------------- | ---------------- |
| `--blue-1000` | `#1A80F7` | 100%    | `#1A80F7`      | Info text, links |
| `--blue-800`  | `#1A80F7` | 80%     | `#489FF9`      | Info hover       |
| `--blue-200`  | `#1A80F7` | 20%     | `#D4E9FD`      | Info backgrounds |
| `--blue-50`   | `#1A80F7` | 6%      | `#EBF4FE`      | Subtle info tint |


**Dark Mode**


| Token         | Hex Value | Opacity | Composited Hex | Usage            |
| ------------- | --------- | ------- | -------------- | ---------------- |
| `--blue-1000` | `#52A1DD` | 100%    | `#52A1DD`      | Info text, links |
| `--blue-800`  | `#52A1DD` | 80%     | `#75B4E4`      | Info hover       |
| `--blue-200`  | `#52A1DD` | 20%     | `#0F2436`      | Info backgrounds |
| `--blue-50`   | `#52A1DD` | 6%      | `#0D2130`      | Subtle info tint |


#### Purple (Accent)

**Light Mode**


| Token           | Hex Value | Opacity | Composited Hex | Usage              |
| --------------- | --------- | ------- | -------------- | ------------------ |
| `--purple-1000` | `#7E47CC` | 100%    | `#7E47CC`      | Accent text        |
| `--purple-800`  | `#7E47CC` | 80%     | `#9B75D6`      | Accent hover       |
| `--purple-200`  | `#7E47CC` | 20%     | `#E2D4F4`      | Accent backgrounds |
| `--purple-50`   | `#7E47CC` | 5%      | `#F5F0FB`      | Subtle accent tint |


**Dark Mode**


| Token           | Hex Value | Opacity | Composited Hex | Usage              |
| --------------- | --------- | ------- | -------------- | ------------------ |
| `--purple-1000` | `#D2B2FF` | 100%    | `#D2B2FF`      | Accent text        |
| `--purple-800`  | `#D2B2FF` | 80%     | `#DBC4FF`      | Accent hover       |
| `--purple-200`  | `#D2B2FF` | 20%     | `#2D1F3D`      | Accent backgrounds |
| `--purple-50`   | `#D2B2FF` | 5%      | `#251D30`      | Subtle accent tint |


### V3 Color Semantics

Semantic color tokens organized by purpose and intent. Format: `type-intent-strength`

#### Text Colors


| Strength     | Neutral                 | Brand                 | Info                 | Success                 | Warning                 | Error                 | Inverse                 |
| ------------ | ----------------------- | --------------------- | -------------------- | ----------------------- | ----------------------- | --------------------- | ----------------------- |
| **Strong**   | `text-neutral-strong`   | `text-brand-strong`   | `text-info-strong`   | `text-success-strong`   | `text-warning-strong`   | `text-error-strong`   | `text-inverse-strong`   |
| **Weak**     | `text-neutral-weak`     | `text-brand-weak`     | `text-info-weak`     | `text-success-weak`     | `text-warning-weak`     | `text-error-weak`     | `text-inverse-weak`     |
| **Weaker**   | `text-neutral-weaker`   | `text-brand-weaker`   | `text-info-weaker`   | `text-success-weaker`   | `text-warning-weaker`   | `text-error-weaker`   | `text-inverse-weaker`   |
| **Disabled** | `text-neutral-disabled` | `text-brand-disabled` | `text-info-disabled` | `text-success-disabled` | `text-warning-disabled` | `text-error-disabled` | `text-inverse-disabled` |


#### Stroke (Border) Colors


| Strength     | Neutral                   | Brand                   | Info                   | Success                   | Warning                   | Error                   | Inverse                   |
| ------------ | ------------------------- | ----------------------- | ---------------------- | ------------------------- | ------------------------- | ----------------------- | ------------------------- |
| **Strong**   | `stroke-neutral-strong`   | `stroke-brand-strong`   | `stroke-info-strong`   | `stroke-success-strong`   | `stroke-warning-strong`   | `stroke-error-strong`   | `stroke-inverse-strong`   |
| **Weak**     | `stroke-neutral-weak`     | `stroke-brand-weak`     | `stroke-info-weak`     | `stroke-success-weak`     | `stroke-warning-weak`     | `stroke-error-weak`     | `stroke-inverse-weak`     |
| **Weaker**   | `stroke-neutral-weaker`   | `stroke-brand-weaker`   | `stroke-info-weaker`   | `stroke-success-weaker`   | `stroke-warning-weaker`   | `stroke-error-weaker`   | `stroke-inverse-weaker`   |
| **Disabled** | `stroke-neutral-disabled` | `stroke-brand-disabled` | `stroke-info-disabled` | `stroke-success-disabled` | `stroke-warning-disabled` | `stroke-error-disabled` | `stroke-inverse-disabled` |


#### Icon Colors


| Strength     | Neutral                 | Brand                 | Info                 | Success                 | Warning                 | Error                 | Inverse                 |
| ------------ | ----------------------- | --------------------- | -------------------- | ----------------------- | ----------------------- | --------------------- | ----------------------- |
| **Strong**   | `icon-neutral-strong`   | `icon-brand-strong`   | `icon-info-strong`   | `icon-success-strong`   | `icon-warning-strong`   | `icon-error-strong`   | `icon-inverse-strong`   |
| **Weak**     | `icon-neutral-weak`     | `icon-brand-weak`     | `icon-info-weak`     | `icon-success-weak`     | `icon-warning-weak`     | `icon-error-weak`     | `icon-inverse-weak`     |
| **Weaker**   | `icon-neutral-weaker`   | `icon-brand-weaker`   | `icon-info-weaker`   | `icon-success-weaker`   | `icon-warning-weaker`   | `icon-error-weaker`   | `icon-inverse-weaker`   |
| **Disabled** | `icon-neutral-disabled` | `icon-brand-disabled` | `icon-info-disabled` | `icon-success-disabled` | `icon-warning-disabled` | `icon-error-disabled` | `icon-inverse-disabled` |


#### Fill (Background) Colors


| Strength     | Neutral                 | Brand                 | Info                 | Success                 | Warning                 | Error                 | Inverse                 |
| ------------ | ----------------------- | --------------------- | -------------------- | ----------------------- | ----------------------- | --------------------- | ----------------------- |
| **Strong**   | `fill-neutral-strong`   | `fill-brand-strong`   | `fill-info-strong`   | `fill-success-strong`   | `fill-warning-strong`   | `fill-error-strong`   | `fill-inverse-strong`   |
| **Weak**     | `fill-neutral-weak`     | `fill-brand-weak`     | `fill-info-weak`     | `fill-success-weak`     | `fill-warning-weak`     | `fill-error-weak`     | `fill-inverse-weak`     |
| **Weaker**   | `fill-neutral-weaker`   | `fill-brand-weaker`   | `fill-info-weaker`   | `fill-success-weaker`   | `fill-warning-weaker`   | `fill-error-weaker`   | `fill-inverse-weaker`   |
| **Disabled** | `fill-neutral-disabled` | `fill-brand-disabled` | `fill-info-disabled` | `fill-success-disabled` | `fill-warning-disabled` | `fill-error-disabled` | `fill-inverse-disabled` |


#### Background Colors


| Strength     | Neutral               | Brand               | Info               | Success               | Warning               | Error               | Inverse               |
| ------------ | --------------------- | ------------------- | ------------------ | --------------------- | --------------------- | ------------------- | --------------------- |
| **Strong**   | `bg-neutral-strong`   | `bg-brand-strong`   | `bg-info-strong`   | `bg-success-strong`   | `bg-warning-strong`   | `bg-error-strong`   | `bg-inverse-strong`   |
| **Weak**     | `bg-neutral-weak`     | `bg-brand-weak`     | `bg-info-weak`     | `bg-success-weak`     | `bg-warning-weak`     | `bg-error-weak`     | `bg-inverse-weak`     |
| **Weaker**   | `bg-neutral-weaker`   | `bg-brand-weaker`   | `bg-info-weaker`   | `bg-success-weaker`   | `bg-warning-weaker`   | `bg-error-weaker`   | `bg-inverse-weaker`   |
| **Disabled** | `bg-neutral-disabled` | `bg-brand-disabled` | `bg-info-disabled` | `bg-success-disabled` | `bg-warning-disabled` | `bg-error-disabled` | `bg-inverse-disabled` |


#### Overlay Colors


| Token                      | Value                   | Usage                               |
| -------------------------- | ----------------------- | ----------------------------------- |
| `bg-overlay-backdrop`      | `rgba(94, 94, 94, 0.5)` | Modal/drawer backdrops (light mode) |
| `bg-overlay-backdrop-dark` | `rgba(0, 0, 0, 0.6)`    | Modal/drawer backdrops (dark mode)  |


### Semantic to Primitive Mapping

Semantic tokens inherit from primitive tokens. Changing a primitive updates all semantic tokens that reference it.

#### Text → Brown Scale (Light Mode)


| Semantic Token          | Primitive Token   | Primitive Hex |
| ----------------------- | ----------------- | ------------- |
| `text-neutral-strong`   | `brown-1000`      | `#2A1500`     |
| `text-neutral-weak`     | `brown-700`       | `#6B5D53`     |
| `text-neutral-weaker`   | `brown-500`       | `#9E8D7D`     |
| `text-neutral-disabled` | `brown-100`       | `#E9E7E6`     |
| `text-inverse-strong`   | `brown-dark-1000` | `#FFFFFF`     |
| `text-inverse-weak`     | `brown-dark-700`  | `#D9D9D9`     |
| `text-inverse-weaker`   | `brown-dark-500`  | `#999999`     |
| `text-inverse-disabled` | `brown-dark-100`  | `#2E2E2E`     |


#### Text → Intent Colors (Light Mode)


| Semantic Token          | Primitive Token | Primitive Hex |
| ----------------------- | --------------- | ------------- |
| `text-brand-strong`     | `orange-1000`   | `#FF5E00`     |
| `text-brand-weak`       | `orange-800`    | `#FF7E33`     |
| `text-brand-weaker`     | `orange-200`    | `#FFD1B3`     |
| `text-brand-disabled`   | `orange-50`     | `#FFF0E6`     |
| `text-info-strong`      | `blue-1000`     | `#1A80F7`     |
| `text-info-weak`        | `blue-800`      | `#489FF9`     |
| `text-info-weaker`      | `blue-200`      | `#D4E9FD`     |
| `text-info-disabled`    | `blue-50`       | `#EBF4FE`     |
| `text-success-strong`   | `green-1000`    | `#067A57`     |
| `text-success-weak`     | `green-800`     | `#389579`     |
| `text-success-weaker`   | `green-200`     | `#D1E8E0`     |
| `text-success-disabled` | `green-50`      | `#E6FAF3`     |
| `text-warning-strong`   | `amber-1000`    | `#8F6C1A`     |
| `text-warning-weak`     | `amber-800`     | `#A58947`     |
| `text-warning-weaker`   | `amber-200`     | `#E9DEC5`     |
| `text-warning-disabled` | `amber-50`      | `#FFF9EB`     |
| `text-error-strong`     | `red-1000`      | `#C73A3A`     |
| `text-error-weak`       | `red-800`       | `#D66161`     |
| `text-error-weaker`     | `red-200`       | `#F4D4D4`     |
| `text-error-disabled`   | `red-50`        | `#FFF0F0`     |


#### Stroke → Brown Scale (Light Mode)


| Semantic Token            | Primitive Token  | Primitive Hex |
| ------------------------- | ---------------- | ------------- |
| `stroke-neutral-strong`   | `brown-500`      | `#9E8D7D`     |
| `stroke-neutral-weak`     | `brown-100`      | `#E9E7E6`     |
| `stroke-neutral-weaker`   | `brown-50`       | `#F9F9F8`     |
| `stroke-neutral-disabled` | `brown-25`       | `#FCFCFB`     |
| `stroke-inverse-strong`   | `brown-dark-500` | `#999999`     |
| `stroke-inverse-weak`     | `brown-dark-100` | `#2E2E2E`     |
| `stroke-inverse-weaker`   | `brown-dark-50`  | `#1A1A1A`     |
| `stroke-inverse-disabled` | `brown-dark-25`  | `#111111`     |


#### Icon → Brown Scale (Light Mode)


| Semantic Token          | Primitive Token   | Primitive Hex |
| ----------------------- | ----------------- | ------------- |
| `icon-neutral-strong`   | `brown-1000`      | `#2A1500`     |
| `icon-neutral-weak`     | `brown-500`       | `#9E8D7D`     |
| `icon-neutral-weaker`   | `brown-100`       | `#E9E7E6`     |
| `icon-neutral-disabled` | `brown-50`        | `#F9F9F8`     |
| `icon-inverse-strong`   | `brown-dark-1000` | `#FFFFFF`     |
| `icon-inverse-weak`     | `brown-dark-500`  | `#999999`     |
| `icon-inverse-weaker`   | `brown-dark-100`  | `#2E2E2E`     |
| `icon-inverse-disabled` | `brown-dark-50`   | `#1A1A1A`     |


#### Fill → Brown Scale (Light Mode)


| Semantic Token          | Primitive Token   | Primitive Hex |
| ----------------------- | ----------------- | ------------- |
| `fill-neutral-strong`   | `brown-1000`      | `#2A1500`     |
| `fill-neutral-weak`     | `brown-50`        | `#F9F9F8`     |
| `fill-neutral-weaker`   | `brown-25`        | `#FCFCFB`     |
| `fill-neutral-disabled` | `brown-25`        | `#FCFCFB`     |
| `fill-inverse-strong`   | `brown-dark-1000` | `#FFFFFF`     |
| `fill-inverse-weak`     | `brown-dark-50`   | `#1A1A1A`     |
| `fill-inverse-weaker`   | `brown-dark-25`   | `#111111`     |
| `fill-inverse-disabled` | `brown-dark-25`   | `#111111`     |


#### Background → Neutral Scale (Light Mode)


| Semantic Token        | Primitive Token    | Primitive Hex |
| --------------------- | ------------------ | ------------- |
| `bg-neutral-strong`   | `neutral-100`      | `#E6E6E6`     |
| `bg-neutral-weak`     | `neutral-50`       | `#F5F5F5`     |
| `bg-neutral-weaker`   | `neutral-25`       | `#FAFAFA`     |
| `bg-neutral-disabled` | `neutral-25`       | `#FAFAFA`     |
| `bg-inverse-strong`   | `neutral-dark-100` | `#2E2E2E`     |
| `bg-inverse-weak`     | `neutral-dark-50`  | `#1A1A1A`     |
| `bg-inverse-weaker`   | `neutral-dark-25`  | `#111111`     |
| `bg-inverse-disabled` | `neutral-dark-25`  | `#111111`     |


#### All Intents → Fill/Background (Light Mode)


| Intent      | Strong                   | Weak                    | Weaker                  | Disabled                |
| ----------- | ------------------------ | ----------------------- | ----------------------- | ----------------------- |
| **Brand**   | `orange-200` / `#FFD1B3` | `orange-50` / `#FFF0E6` | `orange-50` / `#FFF0E6` | `orange-50` / `#FFF0E6` |
| **Info**    | `blue-200` / `#D4E9FD`   | `blue-50` / `#EBF4FE`   | `blue-50` / `#EBF4FE`   | `blue-50` / `#EBF4FE`   |
| **Success** | `green-200` / `#D1E8E0`  | `green-50` / `#E6FAF3`  | `green-50` / `#E6FAF3`  | `green-50` / `#E6FAF3`  |
| **Warning** | `amber-200` / `#E9DEC5`  | `amber-50` / `#FFF9EB`  | `amber-50` / `#FFF9EB`  | `amber-50` / `#FFF9EB`  |
| **Error**   | `red-200` / `#F4D4D4`    | `red-50` / `#FFF0F0`    | `red-50` / `#FFF0F0`    | `red-50` / `#FFF0F0`    |


#### CSS Implementation Example

```css
/* Primitive Colors - Single source of truth */
:root {
  /* Brown Scale (Light) */
  --brown-1000: rgba(23, 11, 0, 0.9);
  --brown-700: rgba(23, 11, 0, 0.65);
  --brown-500: rgba(23, 11, 0, 0.45);
  --brown-100: rgba(23, 11, 0, 0.1);
  --brown-50: rgba(23, 11, 0, 0.04);
  --brown-25: rgba(23, 11, 0, 0.02);
  
  /* Brown Scale (Dark) */
  --brown-dark-1000: #FFFFFF;
  --brown-dark-700: rgba(255, 255, 255, 0.78);
  --brown-dark-500: rgba(255, 255, 255, 0.6);
  --brown-dark-100: rgba(255, 255, 255, 0.12);
  --brown-dark-50: rgba(255, 255, 255, 0.06);
  --brown-dark-25: rgba(255, 255, 255, 0.03);
  
  /* Orange Scale */
  --orange-1000: #FF5E00;
  --orange-800: rgba(255, 94, 0, 0.8);
  --orange-200: rgba(255, 94, 0, 0.2);
  --orange-50: rgba(255, 94, 0, 0.05);
}

/* Semantic Tokens - Inherit from primitives */
:root {
  /* Text Colors */
  --text-neutral-strong: var(--brown-1000);
  --text-neutral-weak: var(--brown-700);
  --text-neutral-weaker: var(--brown-500);
  --text-neutral-disabled: var(--brown-100);
  --text-brand-strong: var(--orange-1000);
  --text-brand-weak: var(--orange-800);
  --text-brand-weaker: var(--orange-200);
  --text-brand-disabled: var(--orange-50);
  /* ... etc for all semantic tokens */
}

/* Dark Mode - Swap primitives */
[data-theme="dark"] {
  --text-neutral-strong: var(--brown-dark-1000);
  --text-neutral-weak: var(--brown-dark-700);
  --text-neutral-weaker: var(--brown-dark-500);
  --text-neutral-disabled: var(--brown-dark-100);
  /* Brand colors remain same or use dark variants */
}

/* Usage in components */
.button-primary {
  color: var(--text-neutral-strong);      /* Inherits from brown-1000 */
  background: var(--fill-brand-strong);   /* Inherits from orange-200 */
  border: 1px solid var(--stroke-neutral-weak);
}
```

**Key Principle:** Change a primitive value once, and all semantic tokens that reference it update automatically across the entire application.

---

## Colors Used in SVG Assets

These colors are used in SVG icon and illustration files. They are **not recommended** for UI components (use V3 tokens instead), but should be preserved for visual assets.


| Hex Code  | Color Name    | Usage | SVG Files                                                         |
| --------- | ------------- | ----- | ----------------------------------------------------------------- |
| `#667085` | Gray          | 1     | `src/assets/icon/dashboard/search.svg`                            |
| `#E26A24` | Orange        | 4     | `src/assets/image/Avatar 2 orange.svg`                            |
| `#98A2B3` | Slate Gray    | 3     | `DotsVerticalIcon.tsx`, `DotsVerticalIcon.tsx` (icons)            |
| `#1DA1FF` | Sky Blue      | 2     | `src/components/icons/blue-folder-icon.tsx`                       |
| `#4285F4` | Google Blue   | 1     | `src/components/icons/google-icon.tsx`                            |
| `#34A853` | Google Green  | 1     | `src/components/icons/google-icon.tsx`                            |
| `#FBBC04` | Google Yellow | 1     | `src/components/icons/google-icon.tsx`                            |
| `#EA4335` | Google Red    | 1     | `src/components/icons/google-icon.tsx`                            |
| `#412C09` | Dark Brown    | 1     | `src/components/icons/info-icon.tsx`                              |
| `#B1C6A9` | Sage Green    | 5     | Various time capsule letter theme files                           |
| `#F0FCD4` | Light Green   | 3     | `themes.config.tsx`, `Sage.tsx`, `modal/capsule/create/index.tsx` |
| `#FFE5D9` | Peach         | 2     | `Peach.tsx`                                                       |
| `#472EFF` | Purple        | 1     | `ZapIcon.tsx`                                                     |
| `#CF561A` | Burnt Orange  | 1     | `UnpdfIcon.tsx`                                                   |
| `#F5854D` | Light Orange  | 1     | `UnpdfIcon.tsx`                                                   |
| `#B0BEC5` | Blue Gray     | 1     | `UnpdfIcon.tsx`                                                   |
| `#429EDF` | Info Blue     | 1     | `TimerFillIcon.tsx`                                               |
| `#4276DF` | Dark Blue     | 1     | `TimerFillIcon.tsx`                                               |
| `#D4F4FC` | Light Cyan    | 1     | `Modern.tsx`                                                      |
| `#FFE3F7` | Light Pink    | 1     | `Bead.tsx`                                                        |
| `#252525` | Dark Gray     | 1     | `Dark.tsx`                                                        |
| `#DDBF8F` | Tan           | 1     | `CapsulePreviewCard.tsx`                                          |
| `#1E1E1E` | Almost Black  | 1     | `CapsulePreviewCard.tsx`                                          |


## Hardcoded Hex Colors

**Status:** Most high-usage colors have been migrated. The remaining colors below are either in onboarding-specific files, SVG assets, or have limited usage.

### High Usage (15+ occurrences) - Remaining


| Hex Code  | Color Name  | V3 Equivalent                     | Usage Count | Primary Usage                          | Status |
| --------- | ----------- | --------------------------------- | ----------- | -------------------------------------- | ------ |
| `#C8956C` | Amber/Brown | `text-brand-strong` ≈ `#ff5e00`   | 32          | Onboarding accent, decorative elements | Review |
| `#2C1F15` | Dark Brown  | `text-neutral-strong` ≈ `#2A1500` | 30          | Onboarding primary text                | Review |
| `#E4D9CC` | Light Sand  | `border-neutral-weak` ≈ `#E9E7E6` | 16          | Onboarding borders, backgrounds        | Review |
| `#7A6A5E` | Taupe       | `text-neutral-weak` ≈ `#6B5D53`   | 16          | Onboarding secondary text              | Review |
| `#B0A098` | Warm Gray   | `text-neutral-weaker` ≈ `#9E8D7D` | 14          | Onboarding muted text                  | Review |
| `#FFFCF8` | Cream       | `bg-neutral-weaker` ≈ `#FCFCFB`   | 12          | Onboarding backgrounds                 | Review |


### Medium Usage (5-14 occurrences) - Remaining


| Hex Code    | Color Name        | V3 Equivalent                     | Usage Count | Primary Usage      | Status  |
| ----------- | ----------------- | --------------------------------- | ----------- | ------------------ | ------- |
| `#FFFFFF`   | Pure White        | `bg-neutral` ≈ `#ffffff`          | 18          | Card backgrounds   | ✅ Keep  |
| `#ffffff`   | White (lowercase) | `bg-neutral` ≈ `#ffffff`          | 8           | Backgrounds        | Migrate |
| `#F3F3F3`   | Off-White         | `bg-neutral-weaker` ≈ `#FCFCFB`   | 7           | Legacy backgrounds | Review  |
| `#101828`   | Near Black        | `text-neutral-strong` ≈ `#2A1500` | 7           | Legacy headings    | Review  |
| `#FCFCFD`   | Ghost White       | `bg-neutral` ≈ `#ffffff`          | 6           | Card backgrounds   | Migrate |
| `#F9FAFB`   | Snow              | `bg-neutral-weaker` ≈ `#FCFCFB`   | 5           | Backgrounds        | Review  |
| `#155FFF36` | Transparent Blue  | —                                 | 5           | Legacy accent      | Review  |


### Low Usage (1-4 occurrences) - Review for Removal


| Hex Code    | Color Name       | Usage Count | Notes                               | Status     |
| ----------- | ---------------- | ----------- | ----------------------------------- | ---------- |
| `#FEE4E2`   | Light Red        | 0           | Migrated to `fill-error-weak`       | ✅ Migrated |
| `#E3E3E3`   | Light Gray       | 4           | Borders                             | Review     |
| `#B87333`   | Copper           | 0           | Migrated to `text-brand-weak`       | ✅ Migrated |
| `#A4A7AE`   | Gray             | 0           | Migrated to `text-neutral-weaker`   | ✅ Migrated |
| `#5A00E8`   | Purple           | 4           | Rare accent                         | Review     |
| `#535862`   | Gray             | 0           | Migrated to `text-neutral-weak`     | ✅ Migrated |
| `#52A1DD`   | Sky Blue         | 0           | Migrated to `text-info-strong`      | ✅ Migrated |
| `#314FDF`   | Blue             | 0           | Migrated to `fill-info-strong`      | ✅ Migrated |
| `#050709`   | Near Black       | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |
| `#C7C9C8`   | Silver           | 3           | Disabled states                     | Review     |
| `#717680`   | Gray             | 0           | Migrated to `text-neutral-weaker`   | ✅ Migrated |
| `#414651`   | Dark Gray        | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |
| `#412C09`   | Dark Brown       | 3           | Sand color system                   | Review     |
| `#293039`   | Dark Slate       | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |
| `#1E1E1E`   | Almost Black     | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |
| `#10182866` | Semi-transparent | 3           | Borders                             | Review     |
| `#fafafa`   | Near White       | 2           | Backgrounds                         | Review     |
| `#d1d5db`   | Gray 300         | 2           | Borders                             | Review     |
| `#FFFF00`   | Yellow           | 2           | Highlights (should remove)          | Remove     |
| `#0011661A` | Transparent Blue | 0           | Migrated to `stroke-neutral-weak`   | ✅ Migrated |
| `#000D4D73` | Navy Transparent | 0           | Migrated to `text-neutral-weaker`   | ✅ Migrated |
| `#4A4A4A`   | Dark Gray        | 0           | Migrated to `text-neutral-weak`     | ✅ Migrated |
| `#C55A1D`   | Burnt Orange     | 0           | Migrated to `text-brand-strong`     | ✅ Migrated |
| `#4A90E2`   | Blue             | 0           | Migrated to `text-info-strong`      | ✅ Migrated |
| `#3C3F3E`   | Dark Teal        | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |
| `#344054`   | Graphite         | 0           | Migrated to `text-neutral-weak`     | ✅ Migrated |
| `#F97066`   | Coral Red        | 0           | Migrated to `text-error-strong`     | ✅ Migrated |
| `#8BAF8B`   | Sage Green       | 0           | Migrated to `stroke-success-strong` | ✅ Migrated |
| `#98A2B3`   | Slate Gray       | 0           | Migrated to `text-neutral-weaker`   | ✅ Migrated |
| `#667085`   | Gray             | 0           | Migrated to `text-neutral-weak`     | ✅ Migrated |
| `#1D2939`   | Charcoal         | 0           | Migrated to `text-neutral-strong`   | ✅ Migrated |


---

## CSS Variable Colors

Defined in `src/index.css` and used across the application.

### Sand Color System


| Variable          | Hex Value | Usage                 | Notes          |
| ----------------- | --------- | --------------------- | -------------- |
| `--color-sand-1`  | `#fefbf8` | Primary background    | Warm off-white |
| `--color-sand-2`  | `#fbf5eb` | Secondary background  | Light cream    |
| `--color-sand-3`  | `#f5eee3` | Tertiary background   | Beige          |
| `--color-sand-4`  | `#f5e7d1` | Accent background     | Light tan      |
| `--color-sand-5`  | `#ebd2a9` | Borders               | Sand           |
| `--color-sand-6`  | `#ddbf8f` | Interactive elements  | Tan            |
| `--color-sand-7`  | `#cfab6f` | Hover states          | Dark tan       |
| `--color-sand-8`  | `#b5955e` | Active states         | Brown-gold     |
| `--color-sand-10` | `#846633` | Primary text on light | Dark brown     |
| `--color-sand-11` | `#5c4114` | Headings              | Darker brown   |
| `--color-sand-12` | `#412c09` | Emphasis              | Deepest brown  |


### Gray Scale System (Deprecated - Use V3 Tokens)


| Variable           | Hex/RGBA Value | V3 Equivalent                     | Usage                |
| ------------------ | -------------- | --------------------------------- | -------------------- |
| `--color-gray-50`  | `#fafafa`      | `bg-neutral-weaker` ≈ `#FCFCFB`   | Lightest backgrounds |
| `--color-gray-200` | `#eaecf0`      | `border-neutral-weak` ≈ `#E9E7E6` | Borders, dividers    |
| `--color-gray-300` | `#d0d5dd`      | `border-neutral-weak` ≈ `#E9E7E6` | Input borders        |
| `--color-gray-400` | `#667085`      | `text-neutral-weak` ≈ `#6B5D53`   | Secondary text       |
| `--color-gray-500` | `#667085`      | `text-neutral-weak` ≈ `#6B5D53`   | Duplicate of 400     |
| `--color-gray-600` | `#475467`      | `text-neutral-weak` ≈ `#6B5D53`   | Body text            |
| `--color-gray-700` | `#344054`      | `text-neutral-weak` ≈ `#6B5D53`   | Headings             |
| `--color-gray-800` | `#1d2939`      | `text-neutral-strong` ≈ `#2A1500` | Strong headings      |
| `--color-gray-900` | `#101828`      | `text-neutral-strong` ≈ `#2A1500` | Primary text         |
| `--color-gray-950` | `#1e1e1e`      | `text-neutral-strong` ≈ `#2A1500` | Near-black text      |


### Blue Color System


| Variable         | Hex Value | Usage               |
| ---------------- | --------- | ------------------- |
| `--color-blue-1` | `#f1f6fd` | Light backgrounds   |
| `--color-blue-2` | `#e9f1fc` | Hover states        |
| `--color-blue-3` | `#d8e7f9` | Selected states     |
| `--color-blue-4` | `#adcff4` | Borders, accents    |
| `--color-blue-6` | `#52a1dd` | Primary blue, links |
| `--color-blue-7` | `#4284b6` | Hover blue          |


### Semantic Colors


| Variable                  | Hex/RGBA Value             | Usage                             |
| ------------------------- | -------------------------- | --------------------------------- |
| `--color-success`         | `#067a57`                  | Success states                    |
| `--color-danger`          | `#f97066`                  | Error states, destructive actions |
| `--color-primary`         | `var(--text-brand-strong)` | Primary brand (maps to `#ff5e00`) |
| `--color-secondary`       | `rgba(0, 6, 38, 0.9)`      | Text color                        |
| `--color-background`      | `#fefbf8`                  | Page background                   |
| `--color-surface`         | `#f5f6fa`                  | Card/surface backgrounds          |
| `--color-orange`          | `var(--text-brand-strong)` | Accent (maps to `#ff5e00`)        |
| `--color-green-0`         | `#b1c6a9`                  | Success accents                   |
| `--overlay-backdrop`      | `rgba(94, 94, 94, 0.5)`    | Modal/drawer backdrops            |
| `--overlay-backdrop-dark` | `rgba(0, 0, 0, 0.6)`       | Dark mode modal backdrops         |


---

## Shadcn UI Theme Colors

Used for shadcn/ui components integration.


| Variable                   | Value                   | Composited Hex | Usage                    |
| -------------------------- | ----------------------- | -------------- | ------------------------ |
| `--background`             | `#fefbf8`               | `#fefbf8`      | Page background          |
| `--foreground`             | `rgba(0, 6, 38, 0.9)`   | `#001226`      | Primary text             |
| `--card`                   | `#ffffff`               | `#ffffff`      | Card backgrounds         |
| `--card-foreground`        | `rgba(0, 6, 38, 0.9)`   | `#001226`      | Card text                |
| `--popover`                | `#ffffff`               | `#ffffff`      | Popover backgrounds      |
| `--popover-foreground`     | `rgba(0, 6, 38, 0.9)`   | `#001226`      | Popover text             |
| `--primary`                | `#52a1dd`               | `#52a1dd`      | Primary button/element   |
| `--primary-foreground`     | `#ffffff`               | `#ffffff`      | Text on primary          |
| `--secondary`              | `#f5f6fa`               | `#f5f6fa`      | Secondary button/element |
| `--secondary-foreground`   | `rgba(0, 6, 38, 0.9)`   | `#001226`      | Text on secondary        |
| `--muted`                  | `#f5f6fa`               | `#f5f6fa`      | Muted backgrounds        |
| `--muted-foreground`       | `rgba(0, 9, 51, 0.65)`  | `#6B7399`      | Muted text               |
| `--accent`                 | `#0000000d`             | `#F7F7F7`      | Accent backgrounds       |
| `--accent-foreground`      | `#412c09`               | `#412c09`      | Text on accent           |
| `--destructive`            | `#f97066`               | `#f97066`      | Destructive actions      |
| `--destructive-foreground` | `#ffffff`               | `#ffffff`      | Text on destructive      |
| `--border`                 | `rgba(0, 17, 102, 0.1)` | `#E8E9EC`      | Default borders          |
| `--input`                  | `rgba(0, 17, 102, 0.1)` | `#E8E9EC`      | Input borders            |
| `--ring`                   | `#52a1dd`               | `#52a1dd`      | Focus rings              |


---

## Onboarding (Groot) Colors

Specific to the host onboarding experience. **Migrate to V3 tokens** for consistency across the application.


| Variable                      | Hex Value | V3 Equivalent                     | Usage                        |
| ----------------------------- | --------- | --------------------------------- | ---------------------------- |
| `--onboarding-cream`          | `#FAF7F2` | `bg-neutral-weaker` ≈ `#FCFCFB`   | Primary background           |
| `--onboarding-warm-white`     | `#FFFCF8` | `bg-neutral-weaker` ≈ `#FCFCFB`   | Card backgrounds             |
| `--onboarding-sand`           | `#F0E9DF` | `bg-neutral-weak` ≈ `#F9F9F8`     | Section backgrounds          |
| `--onboarding-sand-dark`      | `#E4D9CC` | `border-neutral-weak` ≈ `#E9E7E6` | Borders, dividers            |
| `--onboarding-amber`          | `#C8956C` | `text-brand-strong` ≈ `#ff5e00`   | Primary accent, focus states |
| `--onboarding-amber-light`    | `#E8B99A` | —                                 | Hover states                 |
| `--onboarding-amber-pale`     | `#F5E6DA` | —                                 | Light backgrounds            |
| `--onboarding-brown`          | `#7A5C45` | `text-neutral-weak` ≈ `#6B5D53`   | Secondary text               |
| `--onboarding-brown-dark`     | `#4A3728` | `text-neutral-strong` ≈ `#2A1500` | Headings                     |
| `--onboarding-text-primary`   | `#2C1F15` | `text-neutral-strong` ≈ `#2A1500` | Primary text                 |
| `--onboarding-text-secondary` | `#7A6A5E` | `text-neutral-weak` ≈ `#6B5D53`   | Secondary text               |
| `--onboarding-text-muted`     | `#B0A098` | `text-neutral-weaker` ≈ `#9E8D7D` | Muted text, placeholders     |
| `--onboarding-green-soft`     | `#8BAF8B` | —                                 | Success states               |


---

## Legacy/Deprecated Colors

These colors should be avoided in new code and gradually replaced.

### Grey System (Deprecated)


| Variable           | Value                  | Replacement                                          | V3 Composited Hex     |
| ------------------ | ---------------------- | ---------------------------------------------------- | --------------------- |
| `--color-grey-100` | `#0011661A`            | Use `--stroke-neutral-weak`                          | `#E9E7E6`             |
| `--color-grey-200` | `rgba(0, 9, 51, 0.65)` | Use `--text-neutral-weak`                            | `#6B5D53`             |
| `--color-grey-300` | `#000d4d73`            | Use `--text-neutral-weak` or `--text-neutral-weaker` | `#6B5D53` / `#9E8D7D` |
| `--color-grey-400` | `#F3F3F3`              | Use `--fill-neutral-weaker`                          | `#FCFCFB`             |
| `--color-grey-500` | `#EBEBEB`              | Use `--fill-neutral-weak`                            | `#F9F9F8`             |
| `--color-grey-600` | `#3C3F3E`              | Use `--text-neutral-strong`                          | `#2A1500`             |
| `--color-grey-700` | `#F9F9F9`              | Use `--bg-neutral`                                   | `#ffffff`             |
| `--color-grey-800` | `#949494`              | Use `--text-neutral-weak`                            | `#6B5D53`             |
| `--color-grey-900` | `#101828`              | Use `--text-neutral-strong`                          | `#2A1500`             |


---

## Color Usage Summary

### Most Frequently Used Colors (Top 10)


| Rank | Color                   | Composited Hex | Color Description | Usage Count | Type     | Status   |
| ---- | ----------------------- | -------------- | ----------------- | ----------- | -------- | -------- |
| 1    | `text-neutral-strong`   | `#2A1500`      | Dark brown        | 183         | V3 Token | ✅ Active |
| 2    | `text-neutral-weak`     | `#6B5D53`      | Medium brown-gray | 126         | V3 Token | ✅ Active |
| 3    | `border-neutral-weak`   | `#E9E7E6`      | Very light gray   | 109         | V3 Token | ✅ Active |
| 4    | `bg-neutral-weak`       | `#F9F9F8`      | Off-white         | 99          | V3 Token | ✅ Active |
| 5    | `text-neutral-weaker`   | `#9E8D7D`      | Warm gray-brown   | 46          | V3 Token | ✅ Active |
| 6    | `bg-neutral-weaker`     | `#FCFCFB`      | Near-white        | 46          | V3 Token | ✅ Active |
| 7    | `bg-brand-strong`       | `#ff5e00`      | Vibrant orange    | 35          | V3 Token | ✅ Active |
| 8    | `icon-neutral-weak`     | `#9E8D7D`      | Warm gray-brown   | 20          | V3 Token | ✅ Active |
| 9    | `border-neutral-strong` | `#9E8D7D`      | Warm gray-brown   | 16          | V3 Token | ✅ Active |
| 10   | `bg-neutral-strong`     | `#2A1500`      | Dark brown        | 16          | V3 Token | ✅ Active |


**Note:** All top 10 colors are now V3 semantic tokens after migration.

### Color Distribution by System


| System                 | Percentage | Status                      |
| ---------------------- | ---------- | --------------------------- |
| V3 Design Tokens       | ~65%       | ✅ Recommended               |
| Hardcoded Hex          | ~15%       | ⚠️ Only in SVGs/onboarding  |
| CSS Variables (Legacy) | ~15%       | ⚠️ Review for consolidation |
| Shadcn Theme           | ~5%        | ✅ Use for shadcn components |


---

## Recommendations

### Completed Migration (April 2026)

✅ **Successfully migrated hardcoded colors to V3 semantic tokens:**

- `#F97066` → `text-error-strong` / `bg-fill-error-strong`
- `#C55A1D` → `text-brand-strong` / `bg-fill-brand-weak`
- `#4A90E2` → `text-info-strong`
- `#667085` → `text-neutral-weak`
- `#1D2939` → `text-neutral-strong`
- `#98A2B3` → `text-neutral-weaker`
- `#8BAF8B` → `stroke-success-strong`
- `#344054` → `text-neutral-weak`
- `#475467` → `text-neutral-weak`
- `#101828` → `text-neutral-strong`
- `rgba(94,94,94,0.5)` → `bg-overlay-backdrop`
- And 20+ additional colors

### Remaining Actions

1. **Review onboarding-specific colors:**
  - Colors in `/src/pages/onboard/` (e.g., `#C8956C`, `#2C1F15`, `#E4D9CC`)
  - Consider if these should align with V3 tokens or remain distinct
2. **Standardize white backgrounds:**
  - Use `bg-neutral` or `bg-white` consistently
  - Avoid mixing `#FFFFFF`, `#ffffff`, `#FCFCFD`, `#fafafa`
3. **SVG asset colors:**
  - Colors in SVG files (listed above) should remain as hardcoded values
  - These are visual assets, not UI components

### For New Development

1. **Always use semantic tokens** for:
  - Text: `text-neutral-strong`, `text-neutral-weak`, `text-neutral-weaker`
  - Borders: `border-neutral-weak`, `border-neutral-strong`
  - Backgrounds: `bg-neutral-weak`, `bg-neutral-weaker`, `bg-neutral`
  - Brand: `text-brand-strong`, `bg-brand-strong`
  - Errors: `text-error-strong`, `bg-fill-error-weak`
  - Info: `text-info-strong`, `bg-fill-info-weak`
  - Success: `text-success-strong`, `stroke-success-strong`
2. **Use overlay token for modals:**
  - `bg-overlay-backdrop` for modal/drawer backdrops
3. **Avoid hardcoded hex values** unless:
  - SVG graphic assets
  - One-off decorative elements
  - Third-party component overrides

### Migration Status


| Status       | Count | Colors                                  |
| ------------ | ----- | --------------------------------------- |
| ✅ Migrated   | 25+   | Most hardcoded colors now use V3 tokens |
| ⚠️ Remaining | 15    | Onboarding-specific, SVG assets         |
| 🔍 Review    | 8     | Legacy CSS variables                    |
| 🗑️ Remove   | 2     | Yellow highlights, duplicates           |


---

## Related Documentation

- [V3 Design System](./V3_DESIGN_SYSTEM.md) *(if exists)*
- [Shadcn Migration](./HEROUI_TO_SHADCN_MIGRATION.md)
- [Component Inventory](./01-component-inventory.md)

---

*This document is auto-generated. To update, run color analysis scripts in the project root.*



States & Edge Cases
ScenarioBehaviourUser saves with no contentDisabled save button — but no error message shownVoice transcript is unclearSaved as-is, AI flags it gently in chatUser closes sheet mid-captureDraft auto-saved, recoverable on next openNo internetSaves locally, syncs when connection returns


# Overview page — components inventory

This document lists **custom UI** used on the dashboard **Overview** route (`/overview`), its **child sections**, and **modals / flows** opened from that page. Each entry includes **shadcn/ui** primitives that could replace or wrap the pattern (many are already in `src/components/ui/`).

**Overview composition**


| Layer                                 | Source                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Page shell                            | `pages/dashboard/overview/index.tsx`                                                                          |
| Sections                              | `welcome-section`, `activity-summary` → `daily-prompt-section` + `recent-activities-section`, `browse-topics` |
| Global chrome (when viewing overview) | `DashboardLayout` — header, sidebars, `Modal` host, banners                                                   |


**Modal registry keys used from overview**


| Key               | Opened from                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `welcome`         | `overview/index.tsx` (localStorage `welcomeOnce`)                                     |
| `create-memory`   | `welcome-section` CTA                                                                 |
| `quick-capture`   | `welcome-section`, `daily-prompt-section`                                             |
| `memory-insights` | `welcome-section` (“View insights”)                                                   |
| *(navigation)*    | `/chat/new`, `/stories`, `/explore`, `/capsule`, `/settings/beneficiary` — not modals |


---

## 1. Page & layout primitives


| Custom piece                                 | Role                     | shadcn recommendation                                                  |
| -------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `.page-viewport` wrapper                     | Vertical layout / scroll | Keep; optional **ScrollArea** for nested regions only                  |
| `mx-auto max-w-[1038px] flex-col gap-* px-`* | Page container           | No component; optional **Container** pattern via shared layout utility |


---

## 2. `WelcomeSection` (`sections/welcome-section.tsx`)


| Custom piece                                                 | Role                  | shadcn recommendation                                                              |
| ------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------- |
| Greeting block (`h2`, icons)                                 | Marketing header      | **Typography** tokens only; no component swap                                      |
| Hero card (“What’s on your mind…”)                           | CTA surface           | **Card** (`Card` / `CardHeader` / `CardContent` / `CardFooter`) for structure      |
| Icon + label CTAs (Add story, Quick add, Start conversation) | Buttons / links       | **Button** (`variant` outline / default); use `asChild` + **Link** for chat CTA    |
| Enrichment score panel                                       | Metrics + CTA         | **Card** + **Badge** (“Enrichment score”) + **Button**                             |
| Quick-capture pending chip                                   | Navigation affordance | **Button** `variant="outline"` or **Alert** if you want semantics                  |
| Stat grid (Memories, Beneficiaries, Capsules, Streak)        | 2×2 / 4-col tiles     | **Card** per tile (with `aspect-`* or min-height); **Button** for beneficiary tile |


**Already aligned:** Project has **Button**, **Card**, **Badge** under `components/ui/` — welcome section mostly uses raw `<button>` / `<Link>`; migration would be mostly swapping classes to shared variants.

---

## 3. `ActivitySummary` (`sections/activity-summary.tsx`)


| Custom piece                   | Role            | shadcn recommendation                                                             |
| ------------------------------ | --------------- | --------------------------------------------------------------------------------- |
| Section titles (`h2` + italic) | Headings        | Design tokens only                                                                |
| Two-column / stacked layout    | Responsive grid | **no component** or CSS grid; optional **Resizable** only if you need split panes |


---

## 4. `DailyPromptSection` (`sections/daily-prompt-section.tsx`)


| Custom piece                  | Role               | shadcn recommendation                                                                                            |
| ----------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| ✅ `DailyPromptSkeleton`       | Loading            | ✅ Replaced with **Skeleton** (`components/ui/skeleton.tsx`)                                                      |
| ✅ Prompt tabs (`button` loop) | Single-select tabs | ✅ Replaced with **ToggleGroup** / **ToggleGroupItem** (tab-like single-select); optional future swap to **Tabs** |
| Prompt body                   | Text               | **Typography** / plain `p`                                                                                       |
| ✅ “Write or speak it” CTA     | Primary action     | ✅ Replaced with shared **Button**                                                                                |


---

## 5. `RecentActivitiesSection` (`sections/recent-activities-section.tsx`)


| Custom piece               | Role                      | shadcn recommendation                                      |
| -------------------------- | ------------------------- | ---------------------------------------------------------- |
| `RecentActivityItem`       | List row with icon + meta | **Card** (flat) optional; ✅ row dividers use **Separator** |
| ✅ `RecentActivitySkeleton` | Loading                   | ✅ **Skeleton**                                             |
| ✅ “See all”                | Navigation                | ✅ **Button** `variant="link"` + **Link** (`asChild`)       |


---

## 6. `BrowseTopics` (`sections/browse-topics.tsx`)


| Custom piece                         | Role               | shadcn recommendation                                                             |
| ------------------------------------ | ------------------ | --------------------------------------------------------------------------------- |
| Horizontal snap scroll strip         | Topic carousel     | **Carousel** (embla-based shadcn block) *or* keep div + **ScrollArea** horizontal |
| Gradient fade (absolute)             | Overflow hint      | Optional **ScrollArea** with fade via CSS; or Carousel arrows                     |
| `CategoryCard`                       | Image + title link | **Card** + **AspectRatio** for image; **CardTitle** / description                 |
| `TopicSkeleton` (`components/topic`) | Loading tile       | **Skeleton**                                                                      |


---

## 7. Shared components (overview-adjacent)


| Component                 | File                           | shadcn recommendation                          |
| ------------------------- | ------------------------------ | ---------------------------------------------- |
| `CategoryCard`            | `components/category-card.tsx` | **Card**, **AspectRatio**, typography inside   |
| `Topic` / `TopicSkeleton` | `components/topic/index.tsx`   | **Card** + **Badge** (tag pill) + **Skeleton** |


---

## 8. Modals & flows from overview

### 8.1 `welcome` — `components/modal/welcome.tsx`


| Custom piece                | Role           | shadcn recommendation                                                   |
| --------------------------- | -------------- | ----------------------------------------------------------------------- |
| Fixed-height panel + scroll | Modal body     | **Dialog** (`DialogContent` with `max-h` + overflow)                    |
| Feature list (`ul` / `li`)  | Static content | **Card** per feature or **Accordion** if sections grow                  |
| Close + primary actions     | Actions        | **DialogFooter** + **Button**                                           |
| `ModalCloseBtn`             | Close control  | **Dialog** built-in close or **Button** `size="icon"` `variant="ghost"` |


**Note:** App-wide modal host (`components/modal/index.tsx`) is custom; long-term you can nest **Dialog** inside it or migrate the host to **Dialog** stacking.

### 8.2 `create-memory` — `components/modal/memory/create/index.tsx`


| Custom piece                | Role         | shadcn recommendation                                                                     |
| --------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| Rich editor shell           | Form         | Already uses **Card**, **Dialog**, **DropdownMenu**, **Button**, **Label**, **Separator** |
| Mobile sheet                | Bottom sheet | **Sheet** (shadcn) to replace `react-modal-sheet` if desired                              |
| Emoji / slash / attachments | Complex      | Keep feature code; triggers can stay **DropdownMenu** / **Button**                        |


**Status:** Heavily shadcn-aligned already.

### 8.3 `quick-capture` — `components/modal/memory/quick-capture/index.tsx`


| Custom piece    | Role             | shadcn recommendation                                         |
| --------------- | ---------------- | ------------------------------------------------------------- |
| `CharRing`      | Custom SVG meter | **Progress** (circular variant if you add one) or keep custom |
| Bottom sheet UX | Mobile           | **Sheet**                                                     |
| Toolbar actions | Icon buttons     | **Button** `size="icon"`                                      |
| Media stack     | Custom           | **Card** / **ScrollArea** for thumbnails                      |


**Status:** Uses **Button**, **Card**; sheet is `react-modal-sheet`.

### 8.4 `memory-insights` — `components/modal/memory-insights/index.tsx`


| Custom piece                    | Role              | shadcn recommendation                                                    |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------ |
| Modal shell                     | Window            | **Dialog** (still custom container)                                      |
| ✅ Left category list            | Navigation        | ✅ Replaced with vertical **ToggleGroup** navigation (Tabs-like behavior) |
| ✅ Beneficiary avatars           | People            | ✅ Replaced with **Avatar** + **AvatarFallback** (+ `AvatarImage`)        |
| ✅ Add beneficiary dashed circle | Empty CTA         | ✅ Replaced with **Button** `variant="outline"` (+ dashed styling)        |
| ✅ Insight cards                 | List items        | ✅ Replaced with **Card**                                                 |
| ✅ Dividers                      | Visual separation | ✅ Replaced with **Separator**                                            |


**Status:** ✅ Partially migrated to shadcn primitives (Avatar/Button/Card/Separator/ToggleGroup). Modal shell remains custom.

---

## 9. shadcn primitives already in the repo

From `src/components/ui/`: **avatar**, **badge**, **button**, **card**, **checkbox**, **combobox**, **dialog**, **dropdown-menu**, **input**, **input-group**, **label**, **pagination**, **progress**, **select**, **separator**, **spinner**, **switch**, **textarea**, **toggle**, **toggle-group**.

Use these first before adding new registry items.

---

## 10. shadcn additions worth considering (not all installed)


| Need                     | shadcn item     | Where it helps overview                                        |
| ------------------------ | --------------- | -------------------------------------------------------------- |
| ✅ Loading placeholders   | **Skeleton**    | ✅ Daily prompt + recent activities done; browse topics pending |
| Horizontal topics        | **Carousel**    | `BrowseTopics` strip                                           |
| Image tiles              | **AspectRatio** | `CategoryCard`, topic cards                                    |
| Long modal body          | **ScrollArea**  | Welcome, memory insights                                       |
| Mobile panels            | **Sheet**       | Quick capture, create-memory mobile                            |
| Tab UX                   | **Tabs**        | Daily prompt slots, memory insights categories                 |
| Command palette (future) | **Command**     | Optional global search from overview                           |


---

## 11. Replacement priority (practical order)

1. ✅ **DailyPromptSection** — completed via **Skeleton** + **ToggleGroup** + **Button**.
2. ✅ **Memory insights** — completed for sidebar nav (ToggleGroup), avatars, card rows, separators, and dashed action buttons.
3. ✅ **RecentActivitiesSection** — **Skeleton** loading rows, **Separator** between items, **Button** `link` for “See all”.
4. **WelcomeSection** — CTAs and stat tiles → **Button** + **Card** for maintainability.
5. **BrowseTopics** — optional **Carousel** if product wants arrows/dots; else keep scroll + **Skeleton**.
6. **Modal host** — incremental: move individual modals to **Dialog** / **Sheet** content while keeping `useModal` orchestration.

---

*Generated from codebase paths under `memento-web/src/pages/dashboard/overview` and modal entries in `components/modal/index.tsx`.*
# HeroUI → shadcn/ui (historical plan + current status)

## Current status (April 2026)

**HeroUI is removed** from this repo. The app uses **shadcn/ui** with **`radix-maia`** (`components.json`).

### Implemented on shadcn

- **UI registry:** `button`, `input`, `textarea`, `label`, `select`, `dropdown-menu`, `dialog`, `avatar`, `badge`, `card`, `pagination`, `separator`, `spinner`, `toggle`, `toggle-group`, `input-group`, `checkbox`, `switch`, `combobox` (Base UI + shadcn pieces), etc. under `src/components/ui/`.
- **Form wrappers:** `Textinput`, `Passwordinput`, `Searchinput`, `Checkbox` (`src/components/Form/`) — built from shadcn primitives + tests.
- **App wrappers:** `src/components/switch.tsx` → `ui/switch`; `src/components/spinner.tsx` → `ui/spinner` + `loading` prop.

### Yet to be implemented (or open decisions)

**Source of truth:** [`docs/SHADCN_MIGRATION_STATUS.md`](./SHADCN_MIGRATION_STATUS.md). Summary:

| Priority | Item |
|----------|------|
| **High** | `Form/tag-input.tsx` (chips); modal shell → `Dialog` (`modalLayout` / `useModal` coordination); `react-modal-sheet` → shadcn `sheet` (pilot); `table/index.tsx` styling; adopt `ui/card` in product; document `combobox` vs command. |
| **Medium** | `Form/dateinput` + `date-picker` (tailwind-datepicker → calendar/popover); opportunistic `dropdown-menu` / `Button` in headers. |
| **Policy / skip** | TipTap, dialkit, media recorders, heavy capsule/stories templates, chat streaming layout, routing/API — see `SHADCN_MIGRATION_STATUS.md` § *Intentionally not replacing*. |

### `Form/select-input.tsx`

Already uses shadcn `Select`; listed in “yet to implement” only for **optional** tighter alignment or **dedicated tests** — not a greenfield build.

---

## Background (historical)

shadcn/ui **shadcn/create** ([ui.shadcn.com/create](https://ui.shadcn.com/create)) — preset-based design system builder; CLI v4 (`npx shadcn create`, `shadcn info`, `shadcn docs [component]`).

The sections below describe the **original** HeroUI → shadcn mapping. File paths may not match today’s tree; treat as reference.

### Original HeroUI footprint (removed)

Previously: `@heroui/react` + `@heroui/styles` in modals, dashboard components, etc. Those dependencies are gone.

---

## Component mapping (reference)

| Concept | shadcn equivalent | In repo now? |
|---------|-------------------|--------------|
| Button | `Button` | Yes |
| Input / TextArea | `Input`, `Textarea` | Yes |
| Search field | `Input` + `InputGroup` / icons | Yes (Form `Searchinput`) |
| Select | `Select`, … | Yes |
| Dropdown | `DropdownMenu`, … | Yes |
| Avatar | `Avatar`, … | Yes |
| Spinner | `Spinner` | Yes (+ app wrapper) |
| Card | `Card`, … | Yes (limited use) |
| Modal | `Dialog`, … | Yes in registry; **modal host still custom** |
| Pagination | `Pagination`, … | Yes |
| Separator | `Separator` | Yes |
| Label | `Label` | Yes |
| Checkbox / Switch | `Checkbox`, `Switch` | Yes |
| Close control | `Button` + icon | Pattern in use |

---

## Original migration steps (archive)

1. Configure preset — [ui.shadcn.com/create](https://ui.shadcn.com/create)
2. Add shadcn skill — `npx skills add shadcn/ui` (optional)
3. Add missing components via CLI
4. Migrate feature files
5. Remove HeroUI — **done**
6. Clean up HeroUI-specific theme — **done**

---

## Notes

- **Largest remaining effort:** modal stack + `Dialog`, then optional **Sheet** for mobile sheets.
- shadcn favors **composition** (`DialogContent`, `DialogHeader`, …) vs older prop-heavy UI kits.

# shadcn/ui migration status (memento-web)

**Style:** `radix-maia` — see `components.json`.  
**Inventory:** `new-todo/01-component-inventory.md` (local / optional gitignore).  
**Related:** `docs/HEROUI_TO_SHADCN_MIGRATION.md` (historical context).

---

## Implemented (done)

| Area | What |
|------|------|
| **Form** | `Form/text-input.tsx`, `password-input.tsx`, `search-input.tsx`, `checkbox.tsx` — built from `@/components/ui` (`Input`, `Label`, `InputGroup`, `Checkbox`, …); unit tests colocated (`*.test.tsx`). |
| **App wrappers** | `src/components/switch.tsx` re-exports `@/components/ui/switch`. `src/components/spinner.tsx` wraps `@/components/ui/spinner` and keeps the legacy **`loading`** boolean API. |
| **Registry** | `checkbox` and `switch` live under `src/components/ui/` (shadcn CLI). |

---

## Not yet implemented

Open work if you want deeper alignment with shadcn.

### High impact

| Item | Notes |
|------|--------|
| **`Form/tag-input.tsx`** | Still custom chip row + `input-base`; optional: `Badge` + shadcn `Input`. |
| **`Form/select-input.tsx`** | Already uses shadcn `Select`; remaining work is polish and/or **tests**, not a new primitive. |
| **`Form/dateinput.tsx` + `components/date-picker.tsx`** | Still **`tailwind-datepicker-react`**; moving to shadcn calendar + popover is a product-sized change. |
| **`modal/modalLayout.tsx` / `ModalWrapper` / modal close UI** | Desktop modals use custom overlay + `<button>`; Radix **`Dialog`** needs a plan with **`useModal`**. |
| **`react-modal-sheet` → shadcn `sheet`** | Mobile sheets (e.g. feedback, search); add `sheet` and pilot, or keep current library. |
| **`components/table/index.tsx`** | Markup table + custom pagination; optional shadcn **`table`** for styling only. |
| **`ui/card.tsx` in product** | Primitive exists; **not** widely used for settings / stories / onboarding surfaces yet. |
| **`combobox.tsx`** | Decide/document: keep **Base UI** combobox vs a command-style shadcn pattern. |

### Lower priority (opportunistic)

| Item | Notes |
|------|--------|
| **Toast (`sonner`)** | Often unchanged; optional token alignment. |
| **Custom popover menus** | Prefer **`dropdown-menu`** when refactoring nearby. |
| **Raw `<button>` in headers / dashboard** | Prefer **`@/components/ui/button`** when touching those files. |

### Intentionally not replacing (policy)

| Area | Rationale |
|------|-----------|
| **TipTap** | Rich text in memory flows — not shadcn’s scope. |
| **dialkit** | Product integration, not a generic component swap. |
| **Audio/video recorders & players** | Domain-specific UI. |
| **Time capsule / stories** | Heavy templates, SVG, canvas. |
| **Onboarding Groot** | Branded layouts; individual controls may still use shadcn. |
| **Chat / conversation** | Streaming, bubbles, host-chat chrome. |
| **Icons** | `lucide-react` + local SVGs — aligned with shadcn already. |
| **Routing, guards, SWR, API** | Not UI primitives. |
| **`useModal` as architecture** | Dialog is a **per-modal** primitive; replacing the global host is optional and large. |

---

## Checklists (quick scan)

### Candidates (A)

- [x] `Form/text-input.tsx`
- [x] `Form/password-input.tsx`
- [x] `Form/search-input.tsx`
- [x] `Form/checkbox.tsx`
- [ ] `Form/tag-input.tsx`
- [x] `components/switch.tsx` (→ `ui/switch`)
- [x] `components/spinner.tsx` (→ `ui/spinner`)
- [ ] Modal shell → `Dialog`
- [ ] `react-modal-sheet` → `sheet` (pilot)
- [ ] `table/index.tsx` → table styling
- [ ] Adopt `ui/card` in surfaces
- [ ] `combobox` decision doc

### Lower priority (B)

- [ ] `dateinput` + `date-picker` → calendar / popover
- [ ] Sonner vs tokens (optional)
- [ ] Custom menus → `dropdown-menu`
- [ ] Raw `<button>` → `Button`

---

## Verification

```bash
cd memento-web
rg '@/components/ui/' src --glob '*.tsx'
rg 'from "@/components/spinner"' src --glob '*.tsx'
rg 'react-modal-sheet' src --glob '*.tsx'
rg 'from "@/components/switch"' src --glob '*.tsx'
```

Update this file when you complete or drop a migration item.

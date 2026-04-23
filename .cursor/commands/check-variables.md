# /check-variables

**Description**  
Analyze a page or component holistically and point out incorrect Figma variable usage.

---

## Steps

### 1. Understand what is being reviewed
- Determine whether the input is:
  - A page
  - A component
  - Another UI element (section, pattern, etc.)

---

### 2. Analyze the UI as a whole
Identify how the UI is structured before checking variables:
- Page background color
- All surface fills
- All borders
- All text colors
- All icon colors
- Any secondary or tertiary components

---

### 3. Review variables in context
For each element, verify the variable matches its role:
- Surface variables -> used on surfaces
- Border variables -> used on borders
- Text variables -> used on text
- Icon variables -> used on icons

---

### 4. Call out issues
- Output **one line per issue**
- Include: element, current token, expected token, and short reason
- If no issues are found, output exactly:

`All variables applied correctly.`

---

## Project-specific checks (Memento V3)

- Use `docs/COLOR_INVENTORY.md` and `.cursor/rules/v3-color-system-usage.mdc` as source of truth.
- Prefer semantic V3 tokens/classes (`text-*`, `bg-*`, `border-*`, `fill-*`, `icon-*`) over hex/legacy variables.
- Flag any hardcoded color usage in app UI (except approved SVG/decorative exceptions).
- Verify intent families are used correctly (`brand`, `info`, `success`, `warning`, `error`) with proper strength (`strong`, `weak`, `weaker`, `disabled`).

# Dark Mode and Profile Theme Menu Design

**Date:** 2026-09-23

## Goal

Add a persistent application theme preference with Light, Dark, and System modes, exposed through the existing profile popup menu. Establish a reliable semantic dark-theme foundation and migrate the shared application shell and account menu without expanding into an unsafe whole-repository color rewrite.

## Scope

### Included

- A frontend-only theme provider mounted at the application root.
- Light, Dark, and System preferences stored locally in the browser.
- Immediate application of the resolved theme through a `dark` class on the root HTML element.
- Live response to operating-system theme changes while System is selected.
- A shadcn `DropdownMenuSub` named Theme in the existing profile popup.
- Shadcn radio menu items for Light, Dark, and System with an accessible selected state.
- Dark semantic color tokens in `src/index.css`.
- Migration of the shared application shell and profile popup from hard-coded light colors to semantic tokens.
- Automated tests for theme resolution, persistence, system changes, and the profile menu interaction.

### Excluded

- Backend, account-profile, database, or API changes.
- Synchronizing theme preference between devices.
- A bulk conversion of every legacy screen containing raw color utilities.
- Redesigning the profile popup or unrelated dashboard UI.

## Architecture

Create a focused theme module that owns three concepts:

1. `ThemePreference`: `"light" | "dark" | "system"`.
2. Resolved theme: `"light" | "dark"`, derived from the preference and `prefers-color-scheme`.
3. A React provider and hook that expose the current preference and `setTheme`.

The provider initializes from local storage. Missing or invalid stored values fall back to System. It applies the resolved state to `document.documentElement.classList`, sets the element's `color-scheme`, and subscribes to the operating-system media query only as needed. Selecting a new preference updates state and local storage immediately.

The provider wraps the current application provider tree in `src/main.tsx`, making the hook available to the profile menu and future settings surfaces without coupling it to authentication.

## Profile Menu Interaction

The existing shadcn account menu gains a Theme submenu. Its trigger uses the current resolved-theme icon and a trailing chevron supplied by the shadcn submenu primitive. The submenu contains one `DropdownMenuRadioGroup` with Light, Dark, and System items.

Selecting an item changes the theme without navigating or closing the parent account context unexpectedly. The selected item is exposed through the radio primitive's checked semantics. Labels remain explicit so the control is keyboard- and screen-reader-friendly.

The implementation will reuse the installed shadcn dropdown-menu component and Lucide icons. It will not introduce a custom popup, switch, or menu primitive.

## Theme Tokens and Migration

Dark mode will redefine the project's semantic color variables under `.dark`. The dark palette will preserve the existing warm Memento character while meeting practical contrast needs:

- Near-black warm brown for application backgrounds.
- Slightly lighter surfaces for cards and popovers.
- High-contrast warm-white primary text.
- Muted white values for secondary text and borders.
- The existing orange brand color for primary actions and focus indicators.

The first migration covers shared chrome that users encounter on every dashboard route: the root application surface, dashboard layout, profile trigger, and profile popup. Existing shadcn components already using `background`, `popover`, `foreground`, `muted`, `accent`, and `border` tokens inherit the dark theme automatically.

Legacy feature screens with raw colors remain outside this focused change. New work should use semantic tokens, and later migrations can proceed surface-by-surface with visual verification.

## Failure and Edge-Case Behavior

- Unavailable browser storage does not prevent theme application; the provider continues in memory.
- Invalid stored values are ignored and treated as System.
- Environments without `matchMedia` resolve System to Light.
- Media-query listeners are cleaned up when the provider unmounts or the preference changes.
- The theme is applied independently of login state.

## Testing

Tests will be written before production changes.

- Theme module tests verify default System behavior, stored preference restoration, persistence, root-class changes, and reaction to system preference changes.
- Profile dropdown tests verify that Theme opens as a submenu, all three options are available, and choosing Dark applies and persists the preference.
- Existing profile menu navigation and account-action tests must continue to pass.
- Focused tests, lint, and the production build will run before completion.

## Acceptance Criteria

- A user can choose Light, Dark, or System from the profile popup.
- The selection takes effect immediately and survives reloads.
- System follows the current OS preference and responds to changes.
- Shared dashboard chrome and the profile menu render with semantic dark colors.
- The theme UI is built from the installed shadcn dropdown-menu primitives.
- The change stays frontend-only and leaves unrelated application behavior untouched.

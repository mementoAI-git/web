# Shared Dashboard Header Design

## Goal

Use the Overview navigation-bar presentation throughout the authenticated dashboard, except on Chat routes. Preserve each page's contextual title and any page-specific header actions.

## Scope

- Treat the Overview header presentation as the default for non-Chat dashboard routes, including nested routes such as `/explore/categories/:id`.
- Keep page-specific titles, including titles supplied through `headerTitle`.
- Keep existing page-specific actions, such as Stories actions.
- Preserve the dedicated Chat header behavior and presentation for every route beginning with `/chat`.
- Make no backend, API, data-model, or page-content changes.

## Implementation

Centralize the presentation decision in `DashboardHeader`. Determine whether the current location is a Chat route. Non-Chat routes use the existing Overview dimensions, grid, search control, icons, spacing, and action styling. Chat routes continue to use their current header treatment, including the conversation-specific branch when conversation chrome is available.

This route-family rule is preferable to a page allow-list because new dashboard pages automatically receive the shared navigation without requiring another header update.

## Behavior

- `/overview`, `/explore`, `/explore/categories/:id`, `/stories`, `/settings/*`, and other non-Chat dashboard routes use Overview navigation styling.
- The visible title remains specific to the current page.
- Stories may still omit search and expose Stories-specific actions.
- `/chat`, `/chat/new`, `/chat/:id`, and `/chat/:id/voice` retain Chat navigation styling and behavior.
- Mobile sidebar controls continue to follow the existing responsive behavior.

## Testing

Add focused `DashboardHeader` tests that verify:

1. A nested Explore category route uses Overview navigation styling while retaining its contextual title.
2. A non-Chat route outside Explore also uses Overview navigation styling.
3. A Chat route does not use Overview navigation styling.

Run the focused component test, file-level ESLint, and the production build after implementation.

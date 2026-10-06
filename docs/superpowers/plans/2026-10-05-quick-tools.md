# Navbar quick tools

Approved scope: Quick tools beside the theme toggle in regular and conversation headers. Desktop popover, mobile bottom sheet. Reuse the app-wide music provider and existing track preference persistence. Offer play/pause, current track, compact volume slider, and track selection. Actions: Quick capture, Add story/item, Voice mode. Links: Insights and People settings. Close the tools panel before opening a modal or navigating. Keep theme switching directly accessible.

Implementation:
1. Add an optional compact presentation to BackgroundMusic with explicit playback controls; preserve the existing default presentation.
2. Compose QuickTools with the existing Popover, Sheet, Button, and responsive hook. Mount music controls only while the panel is open.
3. Place the trigger in both DashboardHeader branches.
4. Test desktop/mobile opening, dismissal, action destinations, modal handoff, playback and volume. Run relevant tests, lint and build.

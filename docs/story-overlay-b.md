# Story overlay B

Desktop Add Story uses variant B by default: a centered overlay with theme-specific album artwork and no scenic background behind it. It uses the existing editor, attachments, publishing, and draft safeguards.

## Open Add Story

Choose **Add story** on `/overview`, or use an Add Story action elsewhere in the dashboard. No query parameter is required.

Variant A is hidden from the Add Story flow. Existing `storyOverlay=A` and `storyOverlay=B` URLs both open B. Mobile retains the existing sheet. Stored drafts remain available.

Story View and its edit mode use the same centered overlay and details controls.

## Preview album overlay C

Open `/overview?storyOverlay=C` (or `/stories?storyOverlay=C`) and choose **Add story**. C uses a taller, strap-free reference album as a lossless 1596×983 WebP with transparency. The first 80 pixels of excess left leather are clipped while preserving the chrome rings. Leather, stitching, binding, and paper layers are part of the image. The album reaches 1560px wide and fits the available viewport proportionally, reserving a 304px panel and 24px gap to its right. No CSS recreation, extra paper-grain layer, or external scene is added. The live composer sits within its blank cream page.

C keeps the existing editor, publishing, media controls, Details/Assistant panel, and draft safeguards. Its cream paper uses readable dark text in either app theme. Mobile keeps the existing sheet. Remove the query parameter to return to default B.

Story Details and Assistant render outside the album in the right panel. The writing area uses one full column; the panel's top and bottom follow the paper content as the album height changes. Collapse restores focus to the external Details trigger.

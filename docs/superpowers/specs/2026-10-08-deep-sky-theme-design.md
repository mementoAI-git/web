# Deep sky theme

Add an optional Deep sky appearance adjacent to Dark, based on the supplied deep navy sky reference with soft diagonal cloud wisps.

Use the existing Appearance button to offer Light, Dark, Deep sky, and System through the shared radio menu. Persist the explicit selection using the existing theme storage key and restore it before React mounts. Deep sky resolves to dark for existing controls, illustrations, and third-party dark appearance consumers, with a separate root class for the sky canvas.

Render one decorative, fixed backdrop in the theme provider. Two static SVG cloud layers drift in opposite directions over approximately 46.7 and 63.3 seconds (three times the initial speed) using CSS transforms. Keep the backdrop behind content and outside keyboard/pointer interaction. Remove the backdrop when leaving Deep sky and disable drift for reduced motion.

Keep menus and cards dark and readable. Update only frontend theme logic, shared selection UI, styling, and related tests. Verify theme restore, OS independence, keyboard selection, exiting Deep sky, desktop/mobile layout, production build, lint, and existing tests.

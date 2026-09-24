# Memento — Add Story Page Build Prompt

Build the Memento **Add Story** page shown in the reference materials I will provide.

I will provide you with **two visual references**:

1. **A screenshot of how the finished page should look**
   - Use this as the primary reference for layout, spacing, hierarchy, proportions, positioning, and overall visual structure.
   - Match it closely rather than inventing a different layout.

2. **A separate HD image of the album / binder background**
   - Use this image directly as the journal background/decorative album surface where appropriate.
   - Do not recreate or approximate the binder artwork if the supplied image can be used directly.
   - Preserve its proportions and visual quality.

## Goal

Create a clean, warm, editorial journaling interface for desktop.

This page should feel like writing inside a physical journal or memory album, not like a SaaS dashboard.

Use the existing project stack and conventions. Use **shadcn/ui components and patterns wherever appropriate**. Do not introduce unnecessary dependencies.

The final result should be:

- light mode
- spacious
- warm
- minimal
- editorial
- visually calm
- responsive
- production-quality

Do not over-componentize trivial UI, but keep major page regions modular.

---

## Overall Page Structure

The page has 3 visual layers:

1. **Background environment**
2. **Journal canvas**
3. **Story details side panel**

Use a full viewport layout.

### Background

Use a full-screen scenic background image with:

- `background-size: cover`
- `background-position: center`
- subtle dark/soft overlay if needed for contrast

The background should only act as atmosphere.

---

# Journal Canvas

The main journal should appear as one large rounded rectangular surface floating over the background.

Use:

- large `border-radius`, roughly 28–32px
- warm off-white / cream surface
- very subtle border
- soft shadow
- overflow hidden
- centered horizontally and vertically
- max width around `1360–1440px`
- height around `calc(100vh - 72px)` on desktop
- minimum height around `800px`

Suggested structure:

```tsx
<main className="...">
  <JournalShell>
    <BinderDecoration />
    <EditorArea />
    <StoryDetailsPanel />
  </JournalShell>
</main>
```

---

# Binder / Journal Decoration

The left side contains the physical journal binding.

Use the supplied **HD album / binder background image** as the source for this visual.

This decorative image should not participate in the editor layout.

Recommended:

- absolute positioned
- left: 0
- top: 0
- bottom: 0
- width around `260–280px`
- `object-fit: cover`
- pointer-events-none
- z-index below content

The editor content should begin after the binder area.

Do not place interactive controls over the rings.

Do not redraw or simulate the binder using CSS if the supplied image already contains the required visual.

---

# Main Layout

Inside the journal surface, use a 2-column grid:

```css
grid-template-columns: minmax(0, 1fr) 300px;
```

Approximate:

- main writing region: flexible
- right panel: `280–300px`
- gap: `24–32px`

The writing area should remain visually dominant.

The main content region should start around `300px` from the far left edge because of the binder decoration.

Suggested internal horizontal padding:

- left: 300px
- right: 24px
- top: 38–44px
- bottom: 28px

Use the supplied page screenshot to fine-tune these values rather than treating them as rigid.

---

# Top Header

Use a horizontal flex row.

Left side:

- story date
- calendar icon
- text: `Wed, May 20`

Right side:

- autosave state
- Preview button
- Publish button
- Close button

Example structure:

```tsx
<header className="flex items-center justify-between">
  <StoryDate />

  <div className="flex items-center gap-3">
    <SaveStatus />
    <PreviewButton />
    <PublishButton />
    <CloseButton />
  </div>
</header>
```

---

## Story Date

Use:

- small calendar icon
- muted grey text
- font size around 14px

Do not make this look like a form field.

---

## Autosave State

Use a compact inline status.

Example:

```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <CloudIcon />
  <span>Changes saved</span>
</div>
```

Do not use a badge.

---

## Preview Button

Use shadcn `Button`.

Variant:

- `outline`

Include:

- play/preview icon
- label: `Preview`

Keep medium height, approximately 40px.

---

## Publish Button

Use shadcn `Button`.

Label:

`Publish`

Use Memento’s warm orange accent.

This is the primary action.

Do not make it oversized.

---

## Close Button

Use shadcn `Button`.

Variant:

- `ghost`

Shape:

- circular

Icon:

- `X`

---

# Story Editor

The writing area should feel mostly unstructured.

Do **not** wrap the editor in a heavy card or bordered textarea.

The journal page itself is the writing canvas.

Structure:

```tsx
<section className="flex flex-col h-full">
  <StoryTitleInput />
  <StoryBodyEditor />
  <FormattingToolbar />
</section>
```

---

# Story Title

Use a borderless text input or editable heading.

Placeholder:

`Give this story a title...`

Style:

- serif font
- italic
- approximately `36–40px`
- muted warm grey placeholder
- no visible input border
- no background
- no focus ring box

The title should feel like printed editorial typography.

Use something like:

```css
font-family: var(--font-serif);
font-style: italic;
font-size: 38px;
line-height: 1.2;
```

The input should not stretch visually like a standard form control.

---

# Story Body

Use a rich text editor / `contenteditable` implementation compatible with the existing codebase.

Placeholder:

`Write story here...`

Style:

- borderless
- transparent background
- normal sans-serif body
- around `18px`
- line-height around `1.7`
- comfortable reading width

The editor should grow vertically to use all remaining available space.

Do not put the body inside a textarea-style bordered container.

Example:

```tsx
<div className="flex-1 min-h-0">
  <RichTextEditor />
</div>
```

---

# Floating Formatting Toolbar

The formatting toolbar sits near the bottom of the writing area.

It should look like a soft floating utility bar.

Use:

- warm translucent background
- subtle border
- rounded-xl
- height around 56px
- width around 720px
- mild backdrop blur if already used in the project

Do not span the whole page.

Use a `flex` layout with tool groups separated by vertical dividers.

Suggested structure:

```tsx
<div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2">
  <div className="flex items-center gap-2">
    <AddContentButton />
    <EmojiButton />
    <Separator orientation="vertical" />
    <VoiceButton />
    <VideoButton />
  </div>

  <div className="flex items-center gap-1">
    <BoldButton />
    <ItalicButton />
    <StrikeButton />
    <UnderlineButton />
    <LinkButton />
    <Separator orientation="vertical" />
    <ListButton />
  </div>
</div>
```

---

## Toolbar Controls

Use `Button` with:

- `variant="ghost"`
- `size="icon"`

Use `Tooltip` for all icon-only actions.

### Left controls

1. Add content
   - black square button
   - plus icon
   - opens a shadcn `Popover` or `DropdownMenu`
   - options:
     - Add photo
     - Add video
     - Add voice note
     - Add document

2. Emoji
   - smile icon

3. Voice input
   - microphone icon

4. Video
   - video icon

### Right formatting controls

- Bold
- Italic
- Strikethrough
- Underline
- Link
- Bulleted list

Selected/active formatting should use a subtle filled state.

Avoid bright colors.

---

# Right Sidebar / Story Details Panel

The side panel should feel like a subtle extension of the paper, not like a dashboard.

Use:

- width around 285px
- rounded `20–24px`
- thin warm-grey border
- transparent or very subtle warm background
- padding around 16px

Avoid strong shadows.

Suggested structure:

```tsx
<aside className="...">
  <Tabs defaultValue="details">
    <TabsList />
    <TabsContent value="details">
      <VisibilitySection />
      <TagsSection />
      <StoryQualitySection />
      <StoryOverviewSection />
    </TabsContent>

    <TabsContent value="assistant">
      <AssistantPanel />
    </TabsContent>
  </Tabs>
</aside>
```

Use shadcn `Tabs`.

---

# Tabs

Two tabs:

- Story Details
- Assistant

Use a compact segmented style.

The active tab should have:

- slightly darker warm neutral fill

Inactive tab:

- transparent

Do not use an underline-style tab bar.

---

# Story Details — Visibility

Heading:

`Who can see this story?`

Body:

`Stories are visible to all beneficiaries by default. Choose Private to keep them hidden.`

Make the word `Private` subtly accent-colored.

Below that use a shadcn `Select`.

Default:

`Visible to everyone`

Options:

- Visible to everyone
- Private
- Specific beneficiaries
- Beneficiary group

Use an icon inside the trigger:

- lock / people depending on selected value

Full width.

---

# Add Tags

Header row:

Left:

`Add Tags`

Right:

small `Autotag` action

Use either:

- ghost `Button`
- subtle mint/teal tinted Badge-style button

Do not make it visually dominant.

Below, use a compact input.

Placeholder:

`Add tags manually or autogenerate`

If tags exist, render them as chips with removable `x` buttons.

Use shadcn `Badge` or custom rounded chips.

---

# Story Quality

Keep this section very lightweight.

Title:

`Story quality`

Below, render a subtle inset container.

Do **not** use a percentage score or circular progress indicator.

Show a simple checklist:

- Characters
- Places
- Dates
- Emotions
- Sensory details

Each row:

- label left
- small empty/complete circle right

Example structure:

```tsx
<div className="rounded-xl border bg-muted/10 p-3">
  {items.map(item => (
    <div className="flex items-center justify-between py-1">
      <span>{item.label}</span>
      <StoryQualityIndicator complete={item.complete} />
    </div>
  ))}
</div>
```

Completed items may use a subtle check icon.

Keep this visually quiet.

---

# Story Overview

Heading:

`Story Overview`

Render a simple vertical metadata list.

Items:

- 3 Photos
- 0 Videos
- 0 Voice notes
- 1 Document
- 3 Mins read

Use icons:

- Image
- Film
- Audio waveform / mic
- Paperclip / document
- Timer

Layout:

```tsx
<div className="space-y-2">
  <OverviewItem icon={} label="3 Photos" />
  ...
</div>
```

No cards around each row.

---

# Assistant Tab

The Assistant tab can initially be a placeholder state if the functionality already exists elsewhere.

It should use the same panel surface.

If implemented:

- contextual writing help
- title suggestions
- reflection prompts
- story-improvement suggestions

Do not make it chat-heavy unless that already exists in the app.

---

# Responsive Behavior

## Large desktop

Use the full two-column layout.

## Medium desktop / tablet

The story panel may reduce to around 260px.

## Small screens

Do **not** squash the sidebar next to the editor.

Instead:

- hide the sidebar
- show a `Story Details` toolbar/button
- open details in a shadcn `Sheet`

Use:

```tsx
<Sheet>
  <SheetTrigger />
  <SheetContent side="right">
    <StoryDetails />
  </SheetContent>
</Sheet>
```

The writing area should always remain the priority.

---

# Component Suggestions

Use or create components roughly like:

```tsx
AddStoryPage
JournalShell
JournalBinderDecoration
StoryHeader
StoryDate
SaveStatus
StoryEditor
StoryTitleInput
RichTextEditor
StoryToolbar
StoryDetailsPanel
StoryVisibilitySelect
StoryTags
StoryQualityChecklist
StoryOverview
StoryAssistantPanel
```

Prefer composition over deeply nested prop-heavy components.

---

# shadcn Components to Use

Where appropriate:

- `Button`
- `Tabs`
- `TabsList`
- `TabsTrigger`
- `TabsContent`
- `Select`
- `SelectTrigger`
- `SelectContent`
- `SelectItem`
- `Input`
- `Badge`
- `Separator`
- `Tooltip`
- `Popover`
- `DropdownMenu`
- `Sheet`
- `ScrollArea`

Use `lucide-react` icons if already installed.

Do not add another icon library.

---

# Visual Rules

Follow these closely.

## Spacing

Prefer generous spacing:

- 8px base spacing rhythm
- sections usually separated by 24–32px
- sidebar sections around 24px apart

## Borders

Use very low-contrast warm-grey borders.

Avoid dark borders.

## Shadows

Use shadows only on:

- outer journal surface
- floating toolbar if necessary

Do not add shadows to every control.

## Radius

- journal shell: ~28–32px
- panel: ~20px
- buttons/inputs: ~8–10px
- toolbar: ~12px

Avoid excessive pill shapes.

## Typography

Use:

- serif for story title / editorial moments
- sans-serif for controls, labels, metadata, body text

Avoid oversized UI labels.

## Color

Use mostly:

- warm cream
- off-white
- charcoal
- muted grey
- restrained orange accent

Do not introduce bright SaaS colors.

---

# Interaction Details

Implement these states cleanly.

## Autosave

Show:

- `Saving...`
- `Changes saved`

Do not use toast notifications for every autosave.

## Publish

Disable Publish if:

- title is empty
- body is empty

When enabled, use the orange primary state.

## Preview

Preview should open the story in the existing memory/story presentation style.

## Close

If there are unsaved changes:

- show confirmation dialog

If everything is saved:

- close immediately

Use shadcn `AlertDialog` if confirmation is necessary.

## Story details

Changes to:

- visibility
- tags
- metadata

should autosave with the story draft.

---

# Important UX Constraint

The interface should never feel like a form the user has to complete.

The primary job is:

**Write and preserve a memory.**

Everything else is secondary.

The user should be able to:

1. open the page
2. write a title
3. write the story
4. publish

without touching any settings.

Story details, tags, story quality, media, and AI assistance are optional enhancements.

Keep the editor visually dominant at all times.

---

# Reference Priority

When implementing this page, use the supplied assets in this order of importance:

1. **The page screenshot** — primary source for layout, spacing, hierarchy, proportions, alignment, and overall composition.
2. **The HD album / binder image** — primary source for the journal background / binder visual.
3. **This specification** — use it to understand component structure, frontend behavior, responsive logic, and implementation intent.

If a visual measurement in this document conflicts slightly with the screenshot, prefer the screenshot.

Do not redesign the page from scratch. Reproduce the supplied design faithfully using clean, reusable frontend components and shadcn/ui primitives.

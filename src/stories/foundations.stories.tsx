import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function ColorSwatch({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <div className="space-y-2">
      <div className={`h-14 rounded-lg border border-border ${className}`} />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Color Tokens</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorSwatch label="background" className="bg-background" />
          <ColorSwatch label="foreground" className="bg-foreground" />
          <ColorSwatch label="primary" className="bg-primary" />
          <ColorSwatch label="secondary" className="bg-secondary" />
          <ColorSwatch label="muted" className="bg-muted" />
          <ColorSwatch label="accent" className="bg-accent" />
          <ColorSwatch label="destructive" className="bg-destructive" />
          <ColorSwatch label="card" className="bg-card" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Typography</h2>
        <div className="space-y-2">
          <p className="text-3xl font-semibold">Heading 3xl / Semibold</p>
          <p className="text-xl font-medium">Heading xl / Medium</p>
          <p className="text-base">Body base text for day-to-day UI copy.</p>
          <p className="text-sm text-muted-foreground">
            Supporting text in muted foreground.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Radius & Shadow</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-4 shadow-sm">
            rounded-md + shadow-sm
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-btn">
            rounded-xl + shadow-btn
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-drop-down">
            rounded-2xl + shadow-drop-down
          </div>
        </div>
      </section>
    </div>
  ),
}

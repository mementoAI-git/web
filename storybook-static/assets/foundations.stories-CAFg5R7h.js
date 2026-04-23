import{j as e}from"./jsx-runtime-u17CrQMm.js";const l={title:"Foundations/Tokens",parameters:{layout:"fullscreen"}};function s({label:d,className:r}){return e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:`h-14 rounded-lg border border-border ${r}`}),e.jsx("p",{className:"text-xs text-muted-foreground",children:d})]})}const a={render:()=>e.jsxs("div",{className:"space-y-8 p-8",children:[e.jsxs("section",{className:"space-y-3",children:[e.jsx("h2",{className:"text-2xl font-semibold",children:"Color Tokens"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 md:grid-cols-4",children:[e.jsx(s,{label:"background",className:"bg-background"}),e.jsx(s,{label:"foreground",className:"bg-foreground"}),e.jsx(s,{label:"primary",className:"bg-primary"}),e.jsx(s,{label:"secondary",className:"bg-secondary"}),e.jsx(s,{label:"muted",className:"bg-muted"}),e.jsx(s,{label:"accent",className:"bg-accent"}),e.jsx(s,{label:"destructive",className:"bg-destructive"}),e.jsx(s,{label:"card",className:"bg-card"})]})]}),e.jsxs("section",{className:"space-y-3",children:[e.jsx("h2",{className:"text-2xl font-semibold",children:"Typography"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-3xl font-semibold",children:"Heading 3xl / Semibold"}),e.jsx("p",{className:"text-xl font-medium",children:"Heading xl / Medium"}),e.jsx("p",{className:"text-base",children:"Body base text for day-to-day UI copy."}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Supporting text in muted foreground."})]})]}),e.jsxs("section",{className:"space-y-3",children:[e.jsx("h2",{className:"text-2xl font-semibold",children:"Radius & Shadow"}),e.jsxs("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-3",children:[e.jsx("div",{className:"rounded-md border border-border bg-card p-4 shadow-sm",children:"rounded-md + shadow-sm"}),e.jsx("div",{className:"rounded-xl border border-border bg-card p-4 shadow-btn",children:"rounded-xl + shadow-btn"}),e.jsx("div",{className:"rounded-2xl border border-border bg-card p-4 shadow-drop-down",children:"rounded-2xl + shadow-drop-down"})]})]})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8 p-8">
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
}`,...a.parameters?.docs?.source}}};const c=["Overview"];export{a as Overview,c as __namedExportsOrder,l as default};

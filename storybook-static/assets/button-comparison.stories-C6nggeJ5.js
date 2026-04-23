import{j as e}from"./jsx-runtime-u17CrQMm.js";import{M as o,B as s}from"./index-B9H2hWgI.js";import{B as t}from"./button-DJN40ien.js";import"./utils-DRuCqhNm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./spinner-ORpMBTgS.js";import"./createLucideIcon-CaFV5KpS.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";import"./index-D2uufjGL.js";import"./index-CHG0NcR4.js";const B={title:"Foundations/Button Comparison",parameters:{layout:"padded"}},n={render:()=>e.jsx(o,{children:e.jsxs("div",{className:"grid gap-8 md:grid-cols-2",children:[e.jsxs("section",{className:"space-y-3 rounded-xl border border-border bg-card p-4",children:[e.jsx("h3",{className:"text-base font-semibold",children:"Legacy Button (`components/Buttons`)"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(s,{title:"Continue"}),e.jsx(s,{title:"Saving",loading:!0}),e.jsx(s,{title:"Disabled",disabled:!0})]})]}),e.jsxs("section",{className:"space-y-3 rounded-xl border border-border bg-card p-4",children:[e.jsx("h3",{className:"text-base font-semibold",children:"UI Button (`components/ui/button`)"}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(t,{children:"Continue"}),e.jsx(t,{variant:"secondary",children:"Secondary"}),e.jsx(t,{variant:"outline",children:"Outline"}),e.jsx(t,{variant:"destructive",children:"Delete"}),e.jsx(t,{disabled:!0,children:"Disabled"})]})]})]})})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <MemoryRouter>
      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Legacy Button (\`components/Buttons\`)</h3>
          <div className="space-y-2">
            <LegacyButton title="Continue" />
            <LegacyButton title="Saving" loading />
            <LegacyButton title="Disabled" disabled />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">UI Button (\`components/ui/button\`)</h3>
          <div className="flex flex-wrap items-center gap-2">
            <UiButton>Continue</UiButton>
            <UiButton variant="secondary">Secondary</UiButton>
            <UiButton variant="outline">Outline</UiButton>
            <UiButton variant="destructive">Delete</UiButton>
            <UiButton disabled>Disabled</UiButton>
          </div>
        </section>
      </div>
    </MemoryRouter>
}`,...n.parameters?.docs?.source}}};const y=["LegacyVsUi"];export{n as LegacyVsUi,y as __namedExportsOrder,B as default};

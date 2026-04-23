import{j as e}from"./jsx-runtime-u17CrQMm.js";import{I as d}from"./input-ixiJnZwR.js";import{L as o}from"./label-BXudrhHL.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DRuCqhNm.js";import"./index-BtV8QL3n.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";import"./index-CHG0NcR4.js";const b={title:"UI/Form/Label",component:o,tags:["autodocs"],parameters:{layout:"centered"},args:{children:"Email address",htmlFor:"story-email"}},a={render:s=>e.jsxs("div",{className:"grid w-72 gap-2",children:[e.jsx(o,{...s}),e.jsx(d,{id:"story-email",placeholder:"name@example.com"})]})},r={render:s=>e.jsxs("div",{className:"grid w-72 gap-2",children:[e.jsx(o,{...s}),e.jsx(d,{id:"story-email",disabled:!0,value:"disabled@example.com"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: args => <div className="grid w-72 gap-2">
      <Label {...args} />
      <Input id="story-email" placeholder="name@example.com" />
    </div>
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => <div className="grid w-72 gap-2">
      <Label {...args} />
      <Input id="story-email" disabled value="disabled@example.com" />
    </div>
}`,...r.parameters?.docs?.source}}};const j=["Default","DisabledField"];export{a as Default,r as DisabledField,j as __namedExportsOrder,b as default};

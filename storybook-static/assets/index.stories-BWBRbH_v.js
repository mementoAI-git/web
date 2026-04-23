import{j as r}from"./jsx-runtime-u17CrQMm.js";import{B as s,M as i}from"./index-B9H2hWgI.js";import"./utils-DRuCqhNm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./spinner-ORpMBTgS.js";import"./createLucideIcon-CaFV5KpS.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";const{fn:d}=__STORYBOOK_MODULE_TEST__,h={title:"Legacy/Buttons/Button",component:s,tags:["autodocs"],args:{title:"Continue",onClick:d()},parameters:{layout:"centered"}},a={render:e=>r.jsx("div",{className:"w-[280px]",children:r.jsx(s,{...e})})},t={args:{loading:!0,title:"Saving"},render:e=>r.jsx("div",{className:"w-[280px]",children:r.jsx(s,{...e})})},n={args:{disabled:!0},render:e=>r.jsx("div",{className:"w-[280px]",children:r.jsx(s,{...e})})},o={args:{href:"/auth/login",title:"Go to login"},render:e=>r.jsx(i,{children:r.jsx("div",{className:"w-[280px]",children:r.jsx(s,{...e})})})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-[280px]">
      <Button {...args} />
    </div>
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    title: "Saving"
  },
  render: args => <div className="w-[280px]">
      <Button {...args} />
    </div>
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  },
  render: args => <div className="w-[280px]">
      <Button {...args} />
    </div>
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    href: "/auth/login",
    title: "Go to login"
  },
  render: args => <MemoryRouter>
      <div className="w-[280px]">
        <Button {...args} />
      </div>
    </MemoryRouter>
}`,...o.parameters?.docs?.source}}};const B=["Default","Loading","Disabled","AsLink"];export{o as AsLink,a as Default,n as Disabled,t as Loading,B as __namedExportsOrder,h as default};

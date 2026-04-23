import{I as o}from"./input-ixiJnZwR.js";import"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DRuCqhNm.js";const{expect:c,userEvent:i,within:l}=__STORYBOOK_MODULE_TEST__,g={title:"UI/Form/Input",component:o,tags:["autodocs"],parameters:{layout:"padded"},args:{placeholder:"name@example.com",type:"email"}},e={},a={args:{disabled:!0,value:"disabled@example.com"}},r={args:{"aria-invalid":!0,value:"invalid-email"}},t={args:{placeholder:"Type your email"},play:async({canvasElement:n})=>{const s=l(n).getByPlaceholderText("Type your email");await i.type(s,"jane@example.com"),await c(s).toHaveValue("jane@example.com")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    value: "disabled@example.com"
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    "aria-invalid": true,
    value: "invalid-email"
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Type your email"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Type your email");
    await userEvent.type(input, "jane@example.com");
    await expect(input).toHaveValue("jane@example.com");
  }
}`,...t.parameters?.docs?.source}}};const x=["Default","Disabled","Invalid","InteractiveTyping"];export{e as Default,a as Disabled,t as InteractiveTyping,r as Invalid,x as __namedExportsOrder,g as default};

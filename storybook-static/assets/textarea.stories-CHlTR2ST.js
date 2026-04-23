import{T as n}from"./textarea-C_cwladh.js";import"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DRuCqhNm.js";const{expect:i,userEvent:c,within:d}=__STORYBOOK_MODULE_TEST__,y={title:"UI/Form/Textarea",component:n,tags:["autodocs"],parameters:{layout:"padded"},args:{placeholder:"Add details...",rows:4}},e={},a={args:{disabled:!0,value:"This value is read-only."}},r={args:{"aria-invalid":!0,value:"Missing required details"}},t={play:async({canvasElement:o})=>{const s=d(o).getByPlaceholderText("Add details...");await c.type(s,"A short note."),await i(s).toHaveValue("A short note.")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    value: "This value is read-only."
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    "aria-invalid": true,
    value: "Missing required details"
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Add details...");
    await userEvent.type(textarea, "A short note.");
    await expect(textarea).toHaveValue("A short note.");
  }
}`,...t.parameters?.docs?.source}}};const x=["Default","Disabled","Invalid","InteractiveTyping"];export{e as Default,a as Disabled,t as InteractiveTyping,r as Invalid,x as __namedExportsOrder,y as default};

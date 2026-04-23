import{T as n}from"./toggle-DVLMm3Sx.js";import"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D2uufjGL.js";import"./utils-DRuCqhNm.js";import"./index-Bo3A0vtI.js";import"./index-Cax-Zi4n.js";import"./index-BtV8QL3n.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";import"./index-CHG0NcR4.js";const{expect:c,userEvent:i,within:l}=__STORYBOOK_MODULE_TEST__,w={title:"UI/Form/Toggle",id:"ui-toggle",component:n,tags:["autodocs"],parameters:{layout:"centered"},args:{"aria-label":"Toggle bold",children:"Bold",variant:"default",size:"default"},argTypes:{variant:{control:"select",options:["default","outline"]},size:{control:"select",options:["default","sm","lg"]}}},e={},t={args:{variant:"outline"}},a={args:{pressed:!0}},r={play:async({canvasElement:s})=>{const o=l(s).getByRole("button",{name:"Toggle bold"});await i.click(o),await c(o).toHaveAttribute("aria-pressed","true")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline"
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    pressed: true
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      name: "Toggle bold"
    });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  }
}`,...r.parameters?.docs?.source}}};const S=["Default","Outline","Pressed","InteractiveToggle"];export{e as Default,r as InteractiveToggle,t as Outline,a as Pressed,S as __namedExportsOrder,w as default};

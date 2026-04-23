import{B as i}from"./button-DJN40ien.js";import"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D2uufjGL.js";import"./utils-DRuCqhNm.js";import"./index-CHG0NcR4.js";const{expect:l,fn:u,userEvent:m,within:p}=__STORYBOOK_MODULE_TEST__,B={title:"UI/Form/Button",component:i,tags:["autodocs"],parameters:{layout:"centered"},args:{children:"Continue",onClick:u()},argTypes:{variant:{control:"select",options:["default","outline","secondary","ghost","destructive","link"]},size:{control:"select",options:["default","xs","sm","lg","icon","icon-xs","icon-sm","icon-lg"]}}},e={},t={args:{variant:"outline"}},a={args:{variant:"destructive",children:"Delete"}},r={args:{disabled:!0}},n={play:async({args:s,canvasElement:o})=>{const c=p(o).getByRole("button",{name:"Continue"});await m.click(c),await l(s.onClick).toHaveBeenCalled()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline"
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "destructive",
    children: "Delete"
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: "Continue"
    });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  }
}`,...n.parameters?.docs?.source}}};const _=["Default","Outline","Destructive","Disabled","InteractiveClick"];export{e as Default,a as Destructive,r as Disabled,n as InteractiveClick,t as Outline,_ as __namedExportsOrder,B as default};

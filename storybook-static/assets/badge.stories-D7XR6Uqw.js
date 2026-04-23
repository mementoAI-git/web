import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import{c as u}from"./index-D2uufjGL.js";import{c as v}from"./utils-DRuCqhNm.js";import{S as g}from"./index-CHG0NcR4.js";import"./preload-helper-PPVm8Dsz.js";const p=u("group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",{variants:{variant:{default:"bg-blue-7 text-white [a]:hover:bg-blue-7/90",secondary:"bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",destructive:"bg-[color:var(--red-1000)] text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-[color:var(--red-1000)]/90",outline:"border-border bg-input/30 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",ghost:"hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",link:"text-blue-7 underline-offset-4 hover:underline"}},defaultVariants:{variant:"default"}});function r({className:o,variant:i="default",asChild:d=!1,...c}){const l=d?g:"span";return e.jsx(l,{"data-slot":"badge","data-variant":i,className:v(p({variant:i}),o),...c})}r.__docgenInfo={description:"",methods:[],displayName:"Badge",props:{asChild:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},variant:{defaultValue:{value:'"default"',computed:!1},required:!1}}};const B={title:"UI/DataDisplay/Badge",component:r,tags:["autodocs"],parameters:{layout:"centered"},args:{children:"New",variant:"default"},argTypes:{variant:{control:"select",options:["default","secondary","destructive","outline","ghost","link"]}}},a={},t={args:{variant:"secondary"}},n={args:{variant:"destructive",children:"Attention"}},s={render:()=>e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(r,{children:"Default"}),e.jsx(r,{variant:"secondary",children:"Secondary"}),e.jsx(r,{variant:"destructive",children:"Destructive"}),e.jsx(r,{variant:"outline",children:"Outline"}),e.jsx(r,{variant:"ghost",children:"Ghost"}),e.jsx(r,{variant:"link",children:"Link"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary"
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "destructive",
    children: "Attention"
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
}`,...s.parameters?.docs?.source}}};const j=["Default","Secondary","Destructive","AllVariants"];export{s as AllVariants,a as Default,n as Destructive,t as Secondary,j as __namedExportsOrder,B as default};

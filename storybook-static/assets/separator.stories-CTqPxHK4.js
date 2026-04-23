import{j as a}from"./jsx-runtime-u17CrQMm.js";import{r as u}from"./iframe-BXzSAt5m.js";import{c as v}from"./utils-DRuCqhNm.js";import{P as f}from"./index-BtV8QL3n.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";import"./index-CHG0NcR4.js";var x="Separator",p="horizontal",h=["horizontal","vertical"],l=u.forwardRef((e,i)=>{const{decorative:n,orientation:r=p,...d}=e,c=N(r)?r:p,m=n?{role:"none"}:{"aria-orientation":c==="vertical"?c:void 0,role:"separator"};return a.jsx(f.div,{"data-orientation":c,...m,...d,ref:i})});l.displayName=x;function N(e){return h.includes(e)}var S=l;function s({className:e,orientation:i="horizontal",decorative:n=!0,...r}){return a.jsx(S,{"data-slot":"separator",decorative:n,orientation:i,className:v("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",e),...r})}s.__docgenInfo={description:"",methods:[],displayName:"Separator",props:{orientation:{defaultValue:{value:'"horizontal"',computed:!1},required:!1},decorative:{defaultValue:{value:"true",computed:!1},required:!1}}};const w={title:"UI/Layout/Separator",component:s,tags:["autodocs"],parameters:{layout:"centered"}},t={render:()=>a.jsxs("div",{className:"w-80 space-y-3",children:[a.jsx("p",{className:"text-sm",children:"Section A"}),a.jsx(s,{}),a.jsx("p",{className:"text-sm",children:"Section B"})]})},o={render:()=>a.jsxs("div",{className:"flex h-20 items-center gap-4",children:[a.jsx("span",{children:"Left"}),a.jsx(s,{orientation:"vertical"}),a.jsx("span",{children:"Right"})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-80 space-y-3">
      <p className="text-sm">Section A</p>
      <Separator />
      <p className="text-sm">Section B</p>
    </div>
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex h-20 items-center gap-4">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
}`,...o.parameters?.docs?.source}}};const P=["Horizontal","Vertical"];export{t as Horizontal,o as Vertical,P as __namedExportsOrder,w as default};

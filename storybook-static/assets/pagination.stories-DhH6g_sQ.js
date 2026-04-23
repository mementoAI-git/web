import{j as n}from"./jsx-runtime-u17CrQMm.js";import"./iframe-BXzSAt5m.js";import{c as o}from"./utils-DRuCqhNm.js";import{B as f}from"./button-DJN40ien.js";import{c}from"./createLucideIcon-CaFV5KpS.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D2uufjGL.js";import"./index-CHG0NcR4.js";const h=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],x=c("chevron-left",h);const P=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],j=c("chevron-right",P);const N=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],I=c("ellipsis",N);function l({className:i,...e}){return n.jsx("nav",{role:"navigation","aria-label":"pagination","data-slot":"pagination",className:o("mx-auto flex w-full justify-center",i),...e})}function d({className:i,...e}){return n.jsx("ul",{"data-slot":"pagination-content",className:o("flex items-center gap-1",i),...e})}function a({...i}){return n.jsx("li",{"data-slot":"pagination-item",...i})}function t({className:i,isActive:e,size:s="icon",...u}){return n.jsx(f,{asChild:!0,variant:e?"outline":"ghost",size:s,className:o(i),children:n.jsx("a",{"aria-current":e?"page":void 0,"data-slot":"pagination-link","data-active":e,...u})})}function m({className:i,text:e="Previous",...s}){return n.jsxs(t,{"aria-label":"Go to previous page",size:"default",className:o("pl-2!",i),...s,children:[n.jsx(x,{"data-icon":"inline-start"}),n.jsx("span",{className:"hidden sm:block",children:e})]})}function p({className:i,text:e="Next",...s}){return n.jsxs(t,{"aria-label":"Go to next page",size:"default",className:o("pr-2!",i),...s,children:[n.jsx("span",{className:"hidden sm:block",children:e}),n.jsx(j,{"data-icon":"inline-end"})]})}function g({className:i,...e}){return n.jsxs("span",{"aria-hidden":!0,"data-slot":"pagination-ellipsis",className:o("flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4",i),...e,children:[n.jsx(I,{}),n.jsx("span",{className:"sr-only",children:"More pages"})]})}l.__docgenInfo={description:"",methods:[],displayName:"Pagination"};d.__docgenInfo={description:"",methods:[],displayName:"PaginationContent"};g.__docgenInfo={description:"",methods:[],displayName:"PaginationEllipsis"};a.__docgenInfo={description:"",methods:[],displayName:"PaginationItem"};t.__docgenInfo={description:"",methods:[],displayName:"PaginationLink",props:{isActive:{required:!1,tsType:{name:"boolean"},description:""},size:{defaultValue:{value:'"icon"',computed:!1},required:!1}}};p.__docgenInfo={description:"",methods:[],displayName:"PaginationNext",props:{text:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Next"',computed:!1}}}};m.__docgenInfo={description:"",methods:[],displayName:"PaginationPrevious",props:{text:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Previous"',computed:!1}}}};const E={title:"UI/Navigation/Pagination",component:l,tags:["autodocs"],parameters:{layout:"centered"}},r={render:()=>n.jsx(l,{children:n.jsxs(d,{children:[n.jsx(a,{children:n.jsx(m,{href:"#"})}),n.jsx(a,{children:n.jsx(t,{href:"#",isActive:!0,children:"1"})}),n.jsx(a,{children:n.jsx(t,{href:"#",children:"2"})}),n.jsx(a,{children:n.jsx(t,{href:"#",children:"3"})}),n.jsx(a,{children:n.jsx(g,{})}),n.jsx(a,{children:n.jsx(p,{href:"#"})})]})})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
}`,...r.parameters?.docs?.source}}};const q=["Default"];export{r as Default,q as __namedExportsOrder,E as default};

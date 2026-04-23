import{j as a}from"./jsx-runtime-u17CrQMm.js";import{r as c}from"./iframe-BXzSAt5m.js";import{c as v}from"./utils-DRuCqhNm.js";import{c as R}from"./index-Cro0KGrd.js";import{u as B}from"./index-Dc6w3wZv.js";import{u as h}from"./index-Cax-Zi4n.js";import{P as b}from"./index-BtV8QL3n.js";import{s as M}from"./index-Bz9y0Ej9.js";import{C as P}from"./check-y_zbF6XM.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BtlJuHEq.js";import"./index-DatQvL9E.js";import"./index-CHG0NcR4.js";import"./createLucideIcon-CaFV5KpS.js";function D(){return M.useSyncExternalStore(O,()=>!0,()=>!1)}function O(){return()=>{}}var z="Avatar",[T]=R(z),[W,F]=T(z),I=c.forwardRef((e,r)=>{const{__scopeAvatar:s,...n}=e,[i,t]=c.useState("idle");return a.jsx(W,{scope:s,imageLoadingStatus:i,onImageLoadingStatusChange:t,children:a.jsx(b.span,{...n,ref:r})})});I.displayName=z;var L="AvatarImage",_=c.forwardRef((e,r)=>{const{__scopeAvatar:s,src:n,onLoadingStatusChange:i=()=>{},...t}=e,m=F(L,s),l=$(n,t),u=B(p=>{i(p),m.onImageLoadingStatusChange(p)});return h(()=>{l!=="idle"&&u(l)},[l,u]),l==="loaded"?a.jsx(b.img,{...t,ref:r,src:n}):null});_.displayName=L;var y="AvatarFallback",N=c.forwardRef((e,r)=>{const{__scopeAvatar:s,delayMs:n,...i}=e,t=F(y,s),[m,l]=c.useState(n===void 0);return c.useEffect(()=>{if(n!==void 0){const u=window.setTimeout(()=>l(!0),n);return()=>window.clearTimeout(u)}},[n]),m&&t.imageLoadingStatus!=="loaded"?a.jsx(b.span,{...i,ref:r}):null});N.displayName=y;function S(e,r){return e?r?(e.src!==r&&(e.src=r),e.complete&&e.naturalWidth>0?"loaded":"loading"):"error":"idle"}function $(e,{referrerPolicy:r,crossOrigin:s}){const n=D(),i=c.useRef(null),t=n?(i.current||(i.current=new window.Image),i.current):null,[m,l]=c.useState(()=>S(t,e));return h(()=>{l(S(t,e))},[t,e]),h(()=>{const u=w=>()=>{l(w)};if(!t)return;const p=u("loaded"),k=u("error");return t.addEventListener("load",p),t.addEventListener("error",k),r&&(t.referrerPolicy=r),typeof s=="string"&&(t.crossOrigin=s),()=>{t.removeEventListener("load",p),t.removeEventListener("error",k)}},[t,s,r]),m}var q=I,H=_,J=N;function o({className:e,size:r="default",...s}){return a.jsx(q,{"data-slot":"avatar","data-size":r,className:v("group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",e),...s})}function j({className:e,...r}){return a.jsx(H,{"data-slot":"avatar-image",className:v("aspect-square size-full rounded-full object-cover",e),...r})}function d({className:e,...r}){return a.jsx(J,{"data-slot":"avatar-fallback",className:v("flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",e),...r})}function C({className:e,...r}){return a.jsx("span",{"data-slot":"avatar-badge",className:v("absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none","group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden","group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2","group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",e),...r})}function E({className:e,...r}){return a.jsx("div",{"data-slot":"avatar-group",className:v("group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",e),...r})}function G({className:e,...r}){return a.jsx("div",{"data-slot":"avatar-group-count",className:v("relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",e),...r})}o.__docgenInfo={description:"",methods:[],displayName:"Avatar",props:{size:{required:!1,tsType:{name:"union",raw:'"default" | "sm" | "lg"',elements:[{name:"literal",value:'"default"'},{name:"literal",value:'"sm"'},{name:"literal",value:'"lg"'}]},description:"",defaultValue:{value:'"default"',computed:!1}}}};j.__docgenInfo={description:"",methods:[],displayName:"AvatarImage"};d.__docgenInfo={description:"",methods:[],displayName:"AvatarFallback"};E.__docgenInfo={description:"",methods:[],displayName:"AvatarGroup"};G.__docgenInfo={description:"",methods:[],displayName:"AvatarGroupCount"};C.__docgenInfo={description:"",methods:[],displayName:"AvatarBadge"};const ia={title:"UI/DataDisplay/Avatar",component:o,tags:["autodocs"],parameters:{layout:"centered"}},g={render:()=>a.jsxs(o,{children:[a.jsx(j,{src:"https://i.pravatar.cc/120?img=5",alt:"Profile"}),a.jsx(d,{children:"JD"})]})},f={render:()=>a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(o,{size:"sm",children:a.jsx(d,{children:"SM"})}),a.jsx(o,{size:"default",children:a.jsx(d,{children:"DF"})}),a.jsx(o,{size:"lg",children:a.jsx(d,{children:"LG"})})]})},A={render:()=>a.jsxs(o,{size:"lg",children:[a.jsx(j,{src:"https://i.pravatar.cc/120?img=8",alt:"Online user"}),a.jsx(d,{children:"ON"}),a.jsx(C,{children:a.jsx(P,{})})]})},x={render:()=>a.jsxs(E,{children:[a.jsx(o,{children:a.jsx(d,{children:"AL"})}),a.jsx(o,{children:a.jsx(d,{children:"BM"})}),a.jsx(o,{children:a.jsx(d,{children:"CP"})}),a.jsx(G,{children:"+4"})]})};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="https://i.pravatar.cc/120?img=5" alt="Profile" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>DF</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
}`,...f.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => <Avatar size="lg">
      <AvatarImage src="https://i.pravatar.cc/120?img=8" alt="Online user" />
      <AvatarFallback>ON</AvatarFallback>
      <AvatarBadge>
        <CheckIcon />
      </AvatarBadge>
    </Avatar>
}`,...A.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>BM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CP</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
}`,...x.parameters?.docs?.source}}};const la=["Default","Sizes","WithBadge","Group"];export{g as Default,x as Group,f as Sizes,A as WithBadge,la as __namedExportsOrder,ia as default};

import{j as e}from"./jsx-runtime-u17CrQMm.js";import{B as m}from"./button-DJN40ien.js";import"./iframe-BXzSAt5m.js";import{c as t}from"./utils-DRuCqhNm.js";import"./index-D2uufjGL.js";import"./index-CHG0NcR4.js";import"./preload-helper-PPVm8Dsz.js";function s({className:r,size:a="default",...x}){return e.jsx("div",{"data-slot":"card","data-size":a,className:t("group/card flex flex-col gap-6 overflow-hidden rounded-2xl bg-card py-6 text-sm text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",r),...x})}function i({className:r,...a}){return e.jsx("div",{"data-slot":"card-header",className:t("group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",r),...a})}function c({className:r,...a}){return e.jsx("div",{"data-slot":"card-title",className:t("text-base font-medium",r),...a})}function l({className:r,...a}){return e.jsx("div",{"data-slot":"card-description",className:t("text-sm text-muted-foreground",r),...a})}function u({className:r,...a}){return e.jsx("div",{"data-slot":"card-action",className:t("col-start-2 row-span-2 row-start-1 self-start justify-self-end",r),...a})}function p({className:r,...a}){return e.jsx("div",{"data-slot":"card-content",className:t("px-6 group-data-[size=sm]/card:px-4",r),...a})}function C({className:r,...a}){return e.jsx("div",{"data-slot":"card-footer",className:t("flex items-center rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",r),...a})}s.__docgenInfo={description:"",methods:[],displayName:"Card",props:{size:{required:!1,tsType:{name:"union",raw:'"default" | "sm"',elements:[{name:"literal",value:'"default"'},{name:"literal",value:'"sm"'}]},description:"",defaultValue:{value:'"default"',computed:!1}}}};i.__docgenInfo={description:"",methods:[],displayName:"CardHeader"};C.__docgenInfo={description:"",methods:[],displayName:"CardFooter"};c.__docgenInfo={description:"",methods:[],displayName:"CardTitle"};u.__docgenInfo={description:"",methods:[],displayName:"CardAction"};l.__docgenInfo={description:"",methods:[],displayName:"CardDescription"};p.__docgenInfo={description:"",methods:[],displayName:"CardContent"};const b={title:"UI/DataDisplay/Card",component:s,tags:["autodocs"],parameters:{layout:"centered"},args:{size:"default"}},d={render:r=>e.jsxs(s,{...r,className:"w-[360px]",children:[e.jsxs(i,{children:[e.jsx(c,{children:"Starter plan"}),e.jsx(l,{children:"Perfect for personal projects."})]}),e.jsx(p,{children:e.jsx("p",{children:"$19/month"})}),e.jsx(C,{children:e.jsx(m,{className:"w-full",children:"Choose plan"})})]})},n={render:()=>e.jsxs(s,{size:"sm",className:"w-[320px]",children:[e.jsxs(i,{children:[e.jsx(c,{children:"Compact card"}),e.jsx(l,{children:'Reduced spacing with `size=\\"sm\\"`.'})]}),e.jsx(p,{children:e.jsx("p",{children:"Useful for dense dashboards."})})]})},o={render:()=>e.jsxs(s,{className:"w-[360px]",children:[e.jsxs(i,{children:[e.jsx(c,{children:"Notifications"}),e.jsx(l,{children:"Manage your preferences."}),e.jsx(u,{children:e.jsx(m,{size:"sm",variant:"ghost",children:"Edit"})})]}),e.jsx(p,{children:e.jsx("p",{children:"Weekly digest enabled."})})]})};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: args => <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Starter plan</CardTitle>
        <CardDescription>Perfect for personal projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>$19/month</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Choose plan</Button>
      </CardFooter>
    </Card>
}`,...d.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <Card size="sm" className="w-[320px]">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Reduced spacing with \`size=\\"sm\\"\`.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Useful for dense dashboards.</p>
      </CardContent>
    </Card>
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your preferences.</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Weekly digest enabled.</p>
      </CardContent>
    </Card>
}`,...o.parameters?.docs?.source}}};const w=["Default","Small","WithAction"];export{d as Default,n as Small,o as WithAction,w as __namedExportsOrder,b as default};

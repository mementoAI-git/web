import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Route, Routes} from 'react-router-dom';
import {http, HttpResponse} from 'msw';
import {renderWithProviders, server} from '@/test';
import {ConversationChromeProvider} from '@/contexts/conversation-chrome';
import ReflectionPage from './reflection';

afterEach(()=>vi.unstubAllGlobals());
beforeEach(()=>{
 vi.stubGlobal('IntersectionObserver',class {observe(){} unobserve(){} disconnect(){} });
 Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:vi.fn()});
});
it('opens the real topic header and composer, preserves the original answer, and resumes replies on the same thread',async()=>{
 let sent: {text?:string;memory?:string}={};
 const history: Array<{_id:string;role:string;text:string}>=[];
 server.use(
  http.get('*/memories/reflection-1',()=>HttpResponse.json({data:{_id:'reflection-1',title:'Generated title',prompt_text:'What brought you joy?',prompt_type:'ai-generated',type:'story',status:'save',body:'<p>Walking along the beach.</p>',attachments:[],tags:[],created_at:'2026-10-31T10:00:00Z'}})),
  http.get('*/ai/prompt/messages/reflection-1',()=>HttpResponse.json({data:{messages:history,next:null}})),
  http.post('*/ai/prompt',async({request})=>{
   sent=await request.json() as typeof sent;
   history.push({_id:'reply-1',role:'user',text:sent.text!},{_id:'ai-1',role:'ai',text:'Tell me about that moment.'});
   return HttpResponse.text('Tell me about that moment.');
  }),
 );
 const view=()=>renderWithProviders(<ConversationChromeProvider><Routes><Route path="/chat/reflection/:id" element={<ReflectionPage/>}/></Routes></ConversationChromeProvider>,{auth:true,route:'/chat/reflection/reflection-1'});
 const first=view();
 expect(await screen.findByRole('heading',{name:'What brought you joy?'})).toBeVisible();
 expect(screen.getByText('Walking along the beach.')).toBeVisible();
 const input=await screen.findByPlaceholderText('Type text here...');
 await userEvent.type(input,'The sound of the waves.');
 await userEvent.click(screen.getByRole('button',{name:'Send',exact:true}));
 await waitFor(()=>expect(sent).toMatchObject({text:'The sound of the waves.',memory:'reflection-1'}));
 first.unmount();view();
 expect(await screen.findByText('The sound of the waves.')).toBeVisible();
 expect(screen.getAllByText('Walking along the beach.')).toHaveLength(1);
 expect(await screen.findByText('Tell me about that moment.')).toBeVisible();
});

it('shows the selected question immediately while thread creation is still pending',async()=>{
 let release!:()=>void;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 server.use(http.post('*/prompts/reflection/conversation',async()=>{await pending;return HttpResponse.json({data:{_id:'reflection-1'}})}));
 const {unmount}=renderWithProviders(<ConversationChromeProvider><Routes><Route path="/chat/reflection/:id" element={<ReflectionPage/>}/></Routes></ConversationChromeProvider>,{auth:true,route:'/chat/reflection/new',routerProps:{initialEntries:[{pathname:'/chat/reflection/new',state:{reflectionEntry:{question:'A moment worth remembering?',request:{prompt_type:'ai-generated',prompt_text:'A moment worth remembering?',reflection_day_key:'2026-10-31'}}}}]}});
 expect(await screen.findByRole('heading',{name:'A moment worth remembering?'})).toBeVisible();
 expect(screen.getByRole('status',{name:'Opening reflection'})).toBeVisible();
 expect(screen.queryByPlaceholderText('Type text here...')).not.toBeInTheDocument();
 unmount();release();
});


it('keeps the question visible after an opening error and retries the same reflection',async()=>{
 let calls=0;
 server.use(http.post('*/prompts/reflection/conversation',()=>++calls===1?HttpResponse.json({message:'Unavailable'},{status:503}):HttpResponse.json({data:{_id:'retry-reflection'}})),http.get('*/memories/retry-reflection',()=>HttpResponse.json({data:{_id:'retry-reflection',title:'A meaningful moment?',prompt_text:'A meaningful moment?',prompt_type:'ai-generated',body:'',attachments:[],tags:[]}})),http.get('*/ai/prompt/messages/retry-reflection',()=>HttpResponse.json({data:{messages:[],next:null}})));
 renderWithProviders(<ConversationChromeProvider><Routes><Route path="/chat/reflection/:id" element={<ReflectionPage/>}/></Routes></ConversationChromeProvider>,{auth:true,routerProps:{initialEntries:[{pathname:'/chat/reflection/new',state:{reflectionEntry:{question:'A meaningful moment?',request:{prompt_type:'ai-generated',prompt_text:'A meaningful moment?',reflection_day_key:'2026-10-31'}}}}]}});
 expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t be opened');
 expect(screen.getByRole('heading',{name:'A meaningful moment?'})).toBeVisible();
 await userEvent.click(screen.getByRole('button',{name:'Try again'}));
 expect(await screen.findByPlaceholderText('Type text here...')).toBeVisible();
 expect(calls).toBe(2);
});

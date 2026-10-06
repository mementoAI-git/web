import {act, fireEvent, render, screen} from '@testing-library/react';
import {useRef} from 'react';
import {describe,expect,it} from 'vitest';
import {clampVoicePosition,useFloatingVoicePosition} from './use-floating-voice-position';
describe('floating voice positioning',()=>{
 it('keeps the window inside the viewport',()=>{
  expect(clampVoicePosition({left:-50,top:900},325,378,390,844)).toEqual({left:8,top:458});
 });
 it('moves by dragging and arrow keys without remounting the window',()=>{
  const host=document.createElement('div');
  function Fixture(){const container=useRef<HTMLDivElement>(null);const position=useFloatingVoicePosition(host,container,true);return <div ref={container} style={position} data-testid="window"/>}
  render(<Fixture/>);const box=screen.getByTestId('window');box.appendChild(host);
  const handle=document.createElement('button');handle.setAttribute('data-voice-drag-handle','');host.appendChild(handle);
  box.getBoundingClientRect=()=>({left:100,top:100,width:325,height:378} as DOMRect);
  const pointer=(type:string,x:number,y:number)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:1,button:0,clientX:x,clientY:y});return event};
  act(()=>{handle.dispatchEvent(pointer('pointerdown',100,100));window.dispatchEvent(pointer('pointermove',140,160));window.dispatchEvent(pointer('pointerup',140,160));});
  expect(box).toHaveStyle({left:'140px',top:'160px'});
  fireEvent.keyDown(handle,{key:'ArrowRight'});
  expect(box).toHaveStyle({left:'110px'});
  expect(screen.getByTestId('window')).toBe(box);
 });
});

"use client";
import {useEffect,useRef} from "react";
export default function Signature(){
 const label=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const scroller=document.querySelector<HTMLElement>('.scene-icons');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let target=0,current=0,frame=0;
  const tick=()=>{frame=0;current+=(target-current)*.12;if(Math.abs(target-current)<.1)current=target;label.current?.style.setProperty('--signature-y',current+'px');if(current!==target)frame=requestAnimationFrame(tick);};
  const update=()=>{target=motion.matches?0:-Math.min(70,(scroller?.scrollTop??0)*.15);if(!frame)frame=requestAnimationFrame(tick);};
  scroller?.addEventListener('scroll',update,{passive:true});motion.addEventListener('change',update);update();
  return()=>{cancelAnimationFrame(frame);scroller?.removeEventListener('scroll',update);motion.removeEventListener('change',update);};
 },[]);
 return <h1 ref={label} className="scene-signature">art by 1024x</h1>;
}

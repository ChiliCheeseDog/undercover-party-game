'use client';
import {useEffect,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';

type Cue='tap'|'select'|'ready'|'submit'|'reveal'|'hide'|'stage'|'turn'|'vote'|'win'|'error'|'message'|'leave';
let context:AudioContext|null=null,lastCue=0;
export function soundEnabled(){try{return localStorage.getItem('uc-sound')!=='off';}catch{return true;}}
export function setSoundEnabled(enabled:boolean){try{localStorage.setItem('uc-sound',enabled?'on':'off');}catch{}window.dispatchEvent(new Event('uc-sound-change'));if(!enabled&&context){const old=context;context=null;void old.close().catch(()=>{});}if(enabled)playCue('select');}
const notes:Record<Cue,number[]>={tap:[620],select:[740,880],ready:[523,659],submit:[587,784],reveal:[440,660,880],hide:[660,440],stage:[523,698],turn:[659,880],vote:[440,554],win:[523,659,784,1047],error:[330,294],message:[880],leave:[554,440]};
export function playCue(cue:Cue){
  if(typeof window==='undefined'||document.hidden||!soundEnabled())return;
  const time=performance.now();if(cue==='tap'&&time-lastCue<65)return;lastCue=time;
  try{const Audio=window.AudioContext||(window as any).webkitAudioContext;if(!Audio)return;if(!context||context.state==='closed')context=new Audio();const ctx=context!;const play=()=>{if(!soundEnabled()||ctx.state!=='running')return;const quiet=cue==='tap'||cue==='message';const start=ctx.currentTime+.008;notes[cue].forEach((frequency,i)=>{const at=start+i*(quiet?.04:.065),duration=quiet?.09:.21;const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(frequency*.985,at+duration);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(quiet?.018:.028,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(at);oscillator.stop(at+duration+.01);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};});};if(ctx.state!=='running')void ctx.resume().then(play).catch(()=>{});else play();}catch{/* Browsers without audio still have visual feedback. */}
}

function cueFor(button:HTMLElement):Cue{
  const text=button.getAttribute('aria-label')||button.textContent||'';
  if(/reveal now|show my secret|reveal role/i.test(text))return 'reveal';
  if(/hide.*pass|hide role/i.test(text))return 'hide';
  if(/deal secret|play again/i.test(text))return 'stage';
  if(/choose.*avatar/i.test(text))return 'select';
  return 'tap';
}
export function InteractionFeedback(){useEffect(()=>{let pressed:HTMLElement|null=null;const reduce=()=>document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const release=()=>{pressed?.removeAttribute('data-pressed');pressed=null;};
  const down=(event:PointerEvent)=>{const target=event.target instanceof Element?event.target.closest<HTMLElement>('button:not(:disabled),.brand,summary'):null;if(!target)return;release();pressed=target;target.dataset.pressed='true';if(reduce()||target.tagName!=='BUTTON')return;const rect=target.getBoundingClientRect(),ring=document.createElement('span');ring.className='press-ring';ring.setAttribute('aria-hidden','true');ring.style.left=(event.clientX-rect.left)+'px';ring.style.top=(event.clientY-rect.top)+'px';target.appendChild(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});setTimeout(()=>ring.remove(),650);};
  const click=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest<HTMLElement>('button:not(:disabled),.brand,summary'):null;if(!target||target.hasAttribute('data-sound-control'))return;playCue(cueFor(target));};
  const change=(event:Event)=>{const el=event.target;if(el instanceof HTMLSelectElement||(el instanceof HTMLInputElement&&['checkbox','radio'].includes(el.type))){if(!(el instanceof Element&&el.hasAttribute('data-sound-control')))playCue('select');}};
  document.addEventListener('pointerdown',down,{passive:true});document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});window.addEventListener('blur',release);document.addEventListener('click',click,true);document.addEventListener('change',change,true);
  return()=>{release();document.removeEventListener('pointerdown',down);document.removeEventListener('pointerup',release);document.removeEventListener('pointercancel',release);window.removeEventListener('blur',release);document.removeEventListener('click',click,true);document.removeEventListener('change',change,true);};},[]);return null;}

export function SoundToggle(){const [enabled,setEnabled]=useState(true);useEffect(()=>{const sync=()=>setEnabled(soundEnabled());sync();window.addEventListener('uc-sound-change',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('uc-sound-change',sync);window.removeEventListener('storage',sync);};},[]);return <button className={'sound-toggle '+(!enabled?'muted-sound':'')} data-sound-control aria-label={enabled?'Mute sound':'Enable sound'} aria-pressed={enabled} title={enabled?'Sound on · click to mute':'Sound off · click to enable'} onClick={()=>setSoundEnabled(!enabled)}>{enabled?<Volume2 size={18}/>:<VolumeX size={18}/>}<span className="sound-label">Sound {enabled?'on':'off'}</span></button>;}

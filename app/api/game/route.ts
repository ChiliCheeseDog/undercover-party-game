import { env } from 'cloudflare:workers';
import {act,view,random,type State} from './engine';
export const dynamic='force-dynamic';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
function db(){if(!env.DB)throw new Error('Room storage is temporarily unavailable.');return env.DB;}
async function load(code:string){const row=await db().prepare('SELECT state, version FROM rooms WHERE code = ? AND expires > ?').bind(code,Date.now()).first<{state:string;version:number}>();if(!row)throw new Error('Room not found or expired. Check your code.');return {s:JSON.parse(row.state) as State,version:row.version};}
async function identity(req:Request,s:State){const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token)throw new Error('Rejoin the room to continue.');const digest=await hash(token);const p=s.players.find(p=>p.auth===digest);if(!p)throw new Error('Your seat is no longer in this room.');return p.id;}
export async function GET(req:Request){try{const code=(new URL(req.url).searchParams.get('code')||'').toUpperCase();const {s}=await load(code);return json(view(s,await identity(req,s)));}catch(e:any){return json({error:e.message},400);}}
export async function POST(req:Request){try{
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Use the game website to play.'},403);
  const raw=await req.text();if(raw.length>3000)return json({error:'Request is too large.'},413);const data=JSON.parse(raw);const action=String(data.action||'');
  const now=Date.now();const ip=req.headers.get('cf-connecting-ip')||'local';const bucket=action==='create'?Math.floor(now/3600000):Math.floor(now/60000);const key=await hash(ip+':'+(action==='create'?'create':'action')+':'+bucket);const limit=action==='create'?20:100;
  const rate=await db().prepare('INSERT INTO limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+3600000).first<{count:number}>();if((rate?.count||0)>limit)return json({error:'Too many requests. Please wait a little.'},429);
  if(action==='create'){
    const name=String(data.name||'').trim();if(!name||name.length>24)throw new Error('Choose a name with 1–24 characters.');const token=crypto.randomUUID()+crypto.randomUUID();const player={id:crypto.randomUUID(),auth:await hash(token),name,ready:false,alive:true};
    await db().prepare('DELETE FROM rooms WHERE expires < ?').bind(now).run();await db().prepare('DELETE FROM limits WHERE expires < ?').bind(now).run();
    for(let n=0;n<5;n++){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from({length:10},()=>alphabet[random(alphabet.length)]).join('');const s:State={code,host:player.id,phase:'lobby',players:[player],category:'Everyday',imposters:1,hint:false,locked:false,word:'',spies:[],clues:{},votes:{},round:0,winner:'',notice:'Invite your friends. Everyone needs their own device.',chat:[],history:[],actions:[]};const insert=await db().prepare('INSERT OR IGNORE INTO rooms (code,state,version,expires) VALUES (?,?,0,?)').bind(code,JSON.stringify(s),now+43200000).run();if(insert.meta.changes)return json({token,room:view(s,player.id)});}
    throw new Error('Could not create a room. Please try again.');
  }
  const code=String(data.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(!/^[A-Z0-9]{10}$/.test(code))throw new Error('Enter the 10-character room code.');
  const requestId=String(data.requestId||'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))throw new Error('Refresh the page and try again.');
  const joinToken=action==='join'?crypto.randomUUID()+crypto.randomUUID():'';const joinAuth=joinToken?await hash(joinToken):'';const joinId=crypto.randomUUID();
  for(let attempt=0;attempt<12;attempt++){
    const {s,version}=await load(code);let id='';
    if(action==='join'){if(s.locked)throw new Error('The host has locked this room.');if(s.phase!=='lobby')throw new Error('A game is in progress. Join when the lobby reopens.');if(s.players.length>=64)throw new Error('This room reached its technical safety limit.');const name=String(data.name||'').trim();if(!name||name.length>24)throw new Error('Choose a name with 1–24 characters.');if(s.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new Error('That name is taken in this room.');id=joinId;s.players.push({id,auth:joinAuth,name,ready:false,alive:true});}
    else {id=await identity(req,s);if(s.actions.includes(requestId))return json({room:view(s,id)});act(s,id,action,data);}
    s.actions.push(requestId);s.actions=s.actions.slice(-150);const update=await db().prepare('UPDATE rooms SET state=?, version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),code,version).run();
    if(update.meta.changes)return json(action==='leave'?{left:true}:{...(joinToken?{token:joinToken}:{}),room:view(s,id)});
  }
  return json({error:'The room is busy. Try again.'},409);
}catch(e:any){return json({error:e instanceof SyntaxError?'Invalid request.':e.message},400);}}

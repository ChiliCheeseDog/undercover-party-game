export type Player = {id:string; auth:string; name:string; ready:boolean; alive:boolean};
export type State = {code:string; host:string; phase:'lobby'|'clue'|'discuss'|'vote'|'result'; players:Player[]; category:string; imposters:number; hint:boolean; locked:boolean; word:string; spies:string[]; clues:Record<string,string>; votes:Record<string,string>; round:number; winner:string; notice:string; chat:{id:string;name:string;text:string}[]; history:string[]; actions:string[]};
export const packs:Record<string,string[]> = {
  Everyday:['Umbrella','Bicycle','Popcorn','Pillow','Candle','Backpack','Mirror','Headphones','Toothbrush','Elevator','Camera','Balloon','Sunglasses','Keyboard','Scissors','Kite','Compass','Telescope','Hammock','Snowman'],
  Food:['Pizza','Sushi','Pancakes','Watermelon','Chocolate','Spaghetti','Avocado','Croissant','Pineapple','Pretzel','Honey','Mushroom','Coconut','Lemon','Waffle','Taco','Cheesecake','Pickle','Noodles','Marshmallow'],
  Animals:['Penguin','Dolphin','Giraffe','Octopus','Kangaroo','Butterfly','Elephant','Flamingo','Hedgehog','Chameleon','Jellyfish','Sloth','Owl','Zebra','Peacock','Otter','Seahorse','Crocodile','Panda','Raccoon'],
  Places:['Library','Airport','Beach','Museum','Hospital','Aquarium','Cinema','Bakery','Castle','Lighthouse','Desert','Volcano','Jungle','Stadium','Waterfall','Submarine','Train station','Amusement park','Space station','Campground'],
};
export function random(n:number){const a=new Uint32Array(1);const max=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a);}while(a[0]>=max);return a[0]%n;}
export function deal(s:State){
  const choices=packs[s.category].filter(w=>!s.history.slice(-8).includes(w));
  s.word=choices[random(choices.length)];s.history.push(s.word);s.history=s.history.slice(-10);
  const ids=s.players.map(p=>p.id);for(let i=ids.length-1;i>0;i--){const j=random(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  s.spies=ids.slice(0,s.imposters);s.players.forEach(p=>{p.alive=true;});s.clues={};s.votes={};s.round=1;s.phase='clue';s.winner='';s.notice='A new secret has been dealt.';
}
export function view(s:State,id:string){
  const me=s.players.find(p=>p.id===id);if(!me)throw new Error('Your seat is no longer in this room.');
  return {code:s.code,host:s.host,phase:s.phase,category:s.category,imposters:s.imposters,hint:s.hint,locked:s.locked,players:s.players.map(({auth,...p})=>p),me:id,role:s.phase==='lobby'?null:s.spies.includes(id)?'imposter':'crewmate',word:s.phase==='result'||(s.phase!=='lobby'&&!s.spies.includes(id))?s.word:null,spies:s.phase==='result'?s.spies:[],clues:s.phase==='clue'?{}:s.clues,submitted:Object.keys(s.clues),ownClue:s.clues[id]||'',voted:Object.keys(s.votes),ownVote:s.votes[id]||'',votes:s.phase==='result'?s.votes:{},round:s.round,winner:s.winner,notice:s.notice,chat:s.chat};
}
export function act(s:State,id:string,action:string,data:any){
  const me=s.players.find(p=>p.id===id);if(!me)throw new Error('Your seat is no longer in this room.');
  const host=()=>{if(s.host!==id)throw new Error('Only the host can do this.');};
  const active=()=>{if(!me.alive)throw new Error('You are spectating this game.');};
  if(action==='ready'){if(s.phase!=='lobby')throw new Error('The game has already started.');me.ready=!me.ready;}
  else if(action==='settings'){host();if(s.phase!=='lobby')throw new Error('Change rules in the lobby.');if(!packs[data.category])throw new Error('Choose a listed category.');s.category=data.category;s.imposters=Math.max(1,Math.min(8,Math.floor(Number(data.imposters)||1)));s.hint=!!data.hint;}
  else if(action==='lock'){host();s.locked=!s.locked;}
  else if(action==='start'){host();if(s.phase!=='lobby')throw new Error('The game has already started.');if(s.players.length<2)throw new Error('Invite at least one other player.');if(!s.players.every(p=>p.ready))throw new Error('Everyone needs to be ready.');if(s.imposters>=s.players.length/2&&s.players.length!==2)throw new Error('Imposters must be fewer than half the players.');if(s.players.length===2&&s.imposters!==1)throw new Error('Practice uses one imposter.');deal(s);}
  else if(action==='clue'){active();if(s.phase!=='clue')throw new Error('Clue submission has finished.');if(s.clues[id])throw new Error('Your clue is already locked in.');const clue=String(data.text||'').trim();if(!clue||clue.length>40||clue.split(/\s+/).length>3)throw new Error('Use one to three words, up to 40 characters.');const normalize=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,'');if(normalize(clue).includes(normalize(s.word)))throw new Error('Your clue cannot include the secret word.');s.clues[id]=clue;if(s.players.filter(p=>p.alive).every(p=>s.clues[p.id]))s.phase='discuss';}
  else if(action==='openVote'){host();if(s.phase!=='discuss')throw new Error('Finish clues first.');s.phase='vote';s.votes={};}
  else if(action==='vote'){active();if(s.phase!=='vote')throw new Error('Voting is not open.');if(s.votes[id])throw new Error('Your vote is already locked in.');const target=String(data.target);if(target!=='skip'&&!s.players.some(p=>p.id===target&&p.alive&&p.id!==id))throw new Error('Choose another active player or abstain.');s.votes[id]=target;
    if(s.players.filter(p=>p.alive).every(p=>s.votes[p.id])){const totals:Record<string,number>={};Object.values(s.votes).forEach(v=>{totals[v]=(totals[v]||0)+1;});const ordered=Object.entries(totals).sort((a,b)=>b[1]-a[1]);const target=ordered[0][0];if(target!=='skip'&&(!ordered[1]||ordered[0][1]>ordered[1][1])){const out=s.players.find(p=>p.id===target)!;out.alive=false;s.notice=out.name+' was voted out.';}else s.notice='No elimination: the vote tied or abstaining won.';
      const spies=s.players.filter(p=>p.alive&&s.spies.includes(p.id)).length;const crew=s.players.filter(p=>p.alive&&!s.spies.includes(p.id)).length;
      if(!spies){s.phase='result';s.winner='Crewmates';}else if(spies>=crew&&s.players.length>2){s.phase='result';s.winner='Imposters';}else if(s.players.length===2){s.phase='result';s.winner='Practice complete';}else{s.round++;s.phase='clue';s.clues={};s.votes={};}
    }
  }
  else if(action==='skip'){host();if(s.phase==='lobby'||s.phase==='result')throw new Error('There is no active word to skip.');deal(s);s.notice='The host replaced the word. Roles were reassigned.';}
  else if(action==='lobby'){host();if(s.phase!=='result')throw new Error('Finish this game first.');s.phase='lobby';s.players.forEach(p=>{p.ready=false;p.alive=true;});s.word='';s.spies=[];s.clues={};s.votes={};s.notice='Ready for another game?';}
  else if(action==='chat'){const text=String(data.text||'').trim();if(!text||text.length>240)throw new Error('Messages must be 1–240 characters.');s.chat.push({id:crypto.randomUUID(),name:me.name,text});s.chat=s.chat.slice(-40);}
  else if(action==='leave'){if(s.phase!=='lobby'&&s.phase!=='result')throw new Error('Keep your seat until this game finishes. You can reconnect after closing this tab.');s.players=s.players.filter(p=>p.id!==id);if(s.host===id)s.host=s.players[0]?.id||'';}
  else throw new Error('Unknown action.');
}

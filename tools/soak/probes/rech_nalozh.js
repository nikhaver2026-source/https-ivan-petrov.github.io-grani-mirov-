/* rech_nalozh.js URL [СЕК] — наложение речи: каждая реплика (записи голосов: gvoice, gvoice_f, gvoice_pack, voice_npc,
   voice_hero, voice_god…; синтезатор устройства через мост GraniTTS) — отрезок [начало, конец]; считаются пары
   пересекающихся отрезков разных реплик. Город (жители), бой (твари, герой, итог удара), вести, разговор. */
const {chromium}=require('playwright');
(async()=>{const СЕК=Number(process.argv[3]||150);
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const ош=[];p.on('pageerror',e=>ош.push(String(e).slice(0,200)));
 await p.addInitScript(()=>{window.__gvAuto=true;window.__реч=[];window.__тт=0;
  const ГОЛОС=/\/(gvoice|gvoice_f|gvoice_pack|voice|voice_npc|voice_hero|voice_god|gvoice_npc|voice_npc_pack)\//;
  const старт=(src,how)=>{const r={src:String(src).replace(/^.*\/sounds\//,""),how,t0:performance.now(),t1:null};__реч.push(r);return r;};
  const pl=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){const s=this.currentSrc||this.src||"";
   if(ГОЛОС.test(s)&&!this.muted&&this.volume>0){const r=старт(s,"плеер");const кон=()=>{if(!r.t1)r.t1=performance.now();};
    for(const ev of ["ended","pause","error","emptied","abort"])this.addEventListener(ev,кон,{once:true});
    const el=this;r.el=el;const dd=()=>{if(isFinite(el.duration)&&el.duration>0)r.dur=el.duration*1000;};el.addEventListener("loadedmetadata",dd,{once:true});dd();}
   return pl.apply(this,arguments);};
  const AC=window.AudioContext||window.webkitAudioContext;
  const bs=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(){const u=this.buffer&&this.buffer.__url;
   if(u&&ГОЛОС.test(u)){const r=старт(u,"буфер");const st=this.stop;this.addEventListener("ended",()=>{if(!r.t1)r.t1=performance.now();});}
   return bs.apply(this,arguments);};
  const dec=AC&&AC.prototype.decodeAudioData;
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.GraniTTS={speak(t,r,v,id){const rec=старт("tts:"+String(t).slice(0,50),"синт");const dur=Math.max(300,String(t).length*55/(Number(r)||1));
    const h=setTimeout(()=>{rec.t1=performance.now();window.GraniTTSDone&&window.GraniTTSDone(id);},dur);window.__ттH=window.__ттH||{};window.__ттH[id]={h,rec};},
   stop(){for(const k in (window.__ттH||{})){const x=window.__ттH[k];clearTimeout(x.h);if(!x.rec.t1)x.rec.t1=performance.now();}window.__ттH={};},
   isSpeaking(){return Object.values(window.__ттH||{}).some(x=>!x.rec.t1);},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(3000);
 /* адрес буфера: ловим fetch записей голосов */
 await p.evaluate(()=>{settings.effects=1;settings.music=1;enterGame();let k=0;while(activeLayer()&&k++<12)closeTopUI();G.tutorDone=1;
  const f0=window.fetch;window.fetch=function(u){const pr=f0.apply(this,arguments);try{const url=String(u&&u.url||u);pr.then(r=>{const ab0=r.arrayBuffer.bind(r);r.arrayBuffer=()=>ab0().then(ab=>{try{ab.__url=url;}catch(_){};return ab;});}).catch(()=>{});}catch(_){}return pr;};
  const AC=window.AudioContext||window.webkitAudioContext;const d0=AC.prototype.decodeAudioData;
  AC.prototype.decodeAudioData=function(ab){const url=ab&&ab.__url;const pr=d0.apply(this,arguments);if(url&&pr&&pr.then)pr.then(buf=>{try{buf.__url=url;}catch(_){}});return pr;};});
 const цели=await p.evaluate(()=>{const out={};for(let r=0;r<2500&&Object.keys(out).length<2;r+=11)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(!c||!c.structure)continue;const k=PLACE_KIND[c.structure.type];if((k==="city"||k==="village")&&!out.city)out.city={x,y};if(k==="dungeon"&&!out.dungeon)out.dungeon={x,y};}return out;});
 const t0=Date.now();const до=s=>Date.now()-t0<s*1000;
 /* город: ходим среди жителей, говорим с ними */
 if(цели.city){await p.evaluate(c=>{G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},цели.city);
  let i=0;while(до(СЕК*0.4)){await p.evaluate(i=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();move(["E","S","W","N"][Math.floor(i/3)%4]);if(i%7===0)safeFn(()=>narrate("Проверка речи: что вокруг.",{cat:"desc"}));},i++);await p.waitForTimeout(420);}
  await p.evaluate(()=>{safeFn(()=>leavePlace());let n=0;while(activeLayer()&&n++<12)closeTopUI();});}
 /* бой: удары, вести, итоги */
 while(до(СЕК*0.85)){await p.evaluate(()=>{if(!G.inCombat){G.place=null;const m=Object.assign({},MONSTERS.find(z=>z.id==="goblin")||MONSTERS[0],{hp:40,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));}});
  for(let k=0;k<12&&до(СЕК*0.85);k++){const идёт=await p.evaluate(()=>!!G.inCombat);if(!идёт)break;await p.keyboard.press("Enter");await p.waitForTimeout(600);}
  await p.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});await p.waitForTimeout(500);}
 /* поток вестей и описаний разом */
 await p.evaluate(()=>{for(let i=0;i<6;i++)safeFn(()=>narrate(["Вы нашли монету.","Ветер усиливается.","Где-то вдали воет волк.","Слышен звон колокола.","Тропа уходит на север.","Вы чувствуете голод."][i],{cat:i%2?"event":"result"}));});
 await p.waitForTimeout(8000);
 const итог=await p.evaluate(()=>{const R=__реч.map(r=>{let t1=r.t1||performance.now();if(r.dur)t1=Math.min(t1,r.t0+r.dur/(r.el&&r.el.playbackRate||1)+50);
   const откр=!r.t1;return {src:r.src,how:r.how,t0:r.t0,t1,откр,стоит:r.el?{paused:r.el.paused,ended:r.el.ended,vol:r.el.volume,ct:Math.round(r.el.currentTime*10)/10,dur:r.dur?Math.round(r.dur):null}:null};});const пары=[];
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j];const пер=Math.min(a.t1,b.t1)-Math.max(a.t0,b.t0);if(пер>120)пары.push([a.src,b.src,Math.round(пер)]);}
  const по={};for(const r of R){const к=r.how+":"+(r.src.split("/")[0]);по[к]=(по[к]||0)+1;}
  const откр=R.filter(r=>r.откр).map(r=>({src:r.src,стоит:r.стоит}));
  return {реплик:R.length,по,пар:пары.length,пары:пары.slice(0,12),незакрытых:откр.length,откр:откр.slice(0,8)};});
 console.log(JSON.stringify(итог,null,1));console.log("ошибки",ош.slice(0,3));await b.close();})();

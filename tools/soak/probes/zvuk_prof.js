/* prof.js URL ЖУРНАЛ [МИНУТ] — замер нагрузки за долгую игру: время в каждом обработчике (часы, отложенные дела,
   кадры, слушатели) по месту, где его завели; узлы звукового движка и плееры по месту создания; долгие задачи;
   итог — живые часы, слушатели, петли, каналы среды. Ходит по поверхности, городу, подземелью и бою. */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const LOG=process.argv[3];const МИН=Number(process.argv[4]||4);fs.writeFileSync(LOG,"");const W=o=>fs.appendFileSync(LOG,JSON.stringify(o)+"\n");
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 page.on('pageerror',e=>W({ошибка:String(e).slice(0,300)}));
 await page.addInitScript(()=>{window.__gvAuto=true;let сид=12345;Math.random=function(){сид|=0;сид=сид+0x6D2B79F5|0;let t=Math.imul(сид^сид>>>15,1|сид);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const P=window.__проф={вр:{},n:{},узлы:{},аудио:{},игр:{},лонг:[],живые:new Map(),слуш:{}};
  const место=(глуб)=>{const s=String(new Error().stack).split("\n").slice(глуб||3);
   for(const f of s){const m=/index\.html:(\d+):(\d+)/.exec(f);if(m){const имя=(/at ([^ (]+)/.exec(f)||[])[1]||"";return (имя&&имя!=="Object.<anonymous>"?имя.slice(0,40)+" ":"")+"@"+m[1];}}
   return "?";};
  const учёт=(k,dt)=>{P.вр[k]=(P.вр[k]||0)+dt;P.n[k]=(P.n[k]||0)+1;};
  const обёрнуть=(f,k)=>typeof f!=="function"?f:function(){const t=performance.now();try{return f.apply(this,arguments);}finally{учёт(k,performance.now()-t);}};
  const si=window.setInterval,ci=window.clearInterval,st=window.setTimeout,raf=window.requestAnimationFrame;
  window.setInterval=function(f,ms){const k="интервал "+место()+" /"+ms;const id=si.call(this,обёрнуть(f,k),ms);P.живые.set(id,k);return id;};
  window.clearInterval=function(id){P.живые.delete(id);return ci.apply(this,arguments);};
  window.setTimeout=function(f,ms){const k="отложено "+место();return st.call(this,обёрнуть(f,k),ms);};
  window.requestAnimationFrame=function(f){const k="кадр "+место();return raf.call(this,обёрнуть(f,k));};
  const ael=EventTarget.prototype.addEventListener,rel=EventTarget.prototype.removeEventListener;
  const карта=new WeakMap();
  const кто=t=>t===window?"window":t===document?"document":(t instanceof HTMLMediaElement?"плеер":(t&&t.nodeType===1?"узел":(t&&t.constructor&&t.constructor.name)||"?"));
  EventTarget.prototype.addEventListener=function(type,fn,o){if(typeof fn!=="function")return ael.apply(this,arguments);
   const цель=кто(this);const k="слушатель "+цель+":"+type+" "+место();
   let m=карта.get(fn);if(!m){m=new Map();карта.set(fn,m);}let w=m.get(this);if(!w){w=обёрнуть(fn,k);m.set(this,w);}
   if(цель==="window"||цель==="document"){const kk=цель+":"+type;P.слуш[kk]=(P.слуш[kk]||0)+1;}
   return ael.call(this,type,w,o);};
  EventTarget.prototype.removeEventListener=function(type,fn,o){const m=fn&&карта.get(fn);const w=m&&m.get(this);
   const цель=кто(this);if((цель==="window"||цель==="document")&&w){const kk=цель+":"+type;if(P.слуш[kk])P.слуш[kk]--;}
   return rel.call(this,type,w||fn,o);};
  const AC=window.AudioContext||window.webkitAudioContext;
  if(AC)for(const k of ["createGain","createBufferSource","createOscillator","createMediaElementSource","createPanner","createStereoPanner","createBiquadFilter","createConvolver","createDynamicsCompressor","createDelay","createWaveShaper","createAnalyser","createBuffer"]){
   const f=AC.prototype[k];if(!f)continue;AC.prototype[k]=function(){const s=k.replace("create","")+" "+место();P.узлы[s]=(P.узлы[s]||0)+1;return f.apply(this,arguments);};}
  const A0=window.Audio;window.Audio=function(){const s=место();P.аудио[s]=(P.аудио[s]||0)+1;return new A0(...arguments);};window.Audio.prototype=A0.prototype;
  const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const s=место();P.игр[s]=(P.игр[s]||0)+1;return pl.apply(this,arguments);};
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())P.лонг.push(Math.round(e.duration));}).observe({entryTypes:["longtask"]});}catch(_){}
  window.__лаг={макс:0,сумма:0,n:0,свыше100:0};let пред=performance.now();
  si.call(window,()=>{const t=performance.now();const l=t-пред-50;пред=t;const L=window.__лаг;if(l>L.макс)L.макс=l;L.сумма+=Math.max(0,l);L.n++;if(l>100)L.свыше100++;},50);});
 await page.goto(process.argv[2]);await page.waitForTimeout(3000);
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 const сброс=()=>page.evaluate(()=>{const P=window.__проф;P.вр={};P.n={};P.узлы={};P.аудио={};P.игр={};P.лонг=[];window.__лаг={макс:0,сумма:0,n:0,свыше100:0};});
 const снимок=async(имя,сек)=>W(await page.evaluate(([имя,сек])=>{const P=window.__проф;
   const топ=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>[k,Math.round(v*10)/10]);
   const живые={};for(const k of P.живые.values())живые[k]=(живые[k]||0)+1;
   const L=window.__лаг;
   return {этап:имя,сек,времяОбр:Math.round(Object.values(P.вр).reduce((a,b)=>a+b,0)),топВремя:топ(P.вр,25),топВызовы:топ(P.n,15),
    узлы:топ(P.узлы,25),узловВсего:Object.values(P.узлы).reduce((a,b)=>a+b,0),аудио:топ(P.аудио,10),аудиоВсего:Object.values(P.аудио).reduce((a,b)=>a+b,0),
    игр:топ(P.игр,12),лонг:{n:P.лонг.length,сумма:P.лонг.reduce((a,b)=>a+b,0),макс:Math.max(0,...P.лонг)},
    лаг:{макс:Math.round(L.макс),ср:L.n?Math.round(L.сумма/L.n*10)/10:0,свыше100:L.свыше100},
    живыеЧасы:живые,nЧасов:P.живые.size,слуш:Object.fromEntries(Object.entries(P.слуш).filter(([k,v])=>v>0)),
    петли:[...Bank.loops.entries()].map(([k,r])=>k+"="+(r.role||"?")),среда:safeFn(()=>ЗвукСреда.заняты()+"/"+ЗвукСреда.каналы.length,"?"),
    spatial:safeFn(()=>Spatial.live.length,-1),shots:safeFn(()=>Bank.shots.length,-1),речьОчередь:safeFn(()=>Speech.queue.length,-1),
    память:safeFn(()=>Math.round(performance.memory.usedJSHeapSize/1e6),-1)};},[имя,сек]));
 const D=["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"];
 const ходить=async(сек,ms=260)=>{const t0=Date.now();let i=0;while(Date.now()-t0<сек*1000){const d=["E","S","W","N"][Math.floor(i/4)%4];
   await page.evaluate(d=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat&&!window.__бой)safeFn(()=>endCombat());move(d);},d);i++;await page.waitForTimeout(ms);}};
 const этап=async(имя,сек,дело)=>{await сброс();const t0=Date.now();await дело(сек);await снимок(имя,Math.round((Date.now()-t0)/1000));};
 const цели=await page.evaluate(()=>{const out={};for(let r=0;r<2500&&Object.keys(out).length<3;r+=11)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(!c||!c.structure)continue;const k=PLACE_KIND[c.structure.type];if(k&&!out[k])out[k]={x,y,type:c.structure.type};}return out;});
 const войти=c=>page.evaluate(c=>{safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},c);
 const выйти=()=>page.evaluate(()=>{safeFn(()=>{if(G.place)leavePlace();});let n=0;while(activeLayer()&&n++<12)closeTopUI();});
 const м=МИН*60/6;
 await этап("тишина (стоим)",20,async s=>{await page.waitForTimeout(s*1000);});
 await этап("поверхность",м,async s=>{await ходить(s);});
 if(цели.city)await этап("город",м,async s=>{await войти(цели.city);await ходить(s);await выйти();});
 if(цели.dungeon)await этап("подземелье",м*1.5,async s=>{await войти(цели.dungeon);await ходить(s/3);
   for(let d=0;d<2;d++){await page.evaluate(()=>{safeFn(()=>changeDepth(1,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();});await ходить(s/3);}await выйти();});
 await этап("бой",40,async s=>{await page.evaluate(()=>{window.__бой=1;G.place=null;const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:60,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat(m));});
   const t0=Date.now();while(Date.now()-t0<s*1000){const идёт=await page.evaluate(()=>!!G.inCombat);if(!идёт)break;await page.keyboard.press("Enter");await page.waitForTimeout(500);}
   await page.evaluate(()=>{window.__бой=0;let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());});});
 await этап("поверхность 2",м,async s=>{await ходить(s);});
 await этап("тишина 2 (стоим)",20,async s=>{await page.waitForTimeout(s*1000);});
 W({итог:true});await b.close();})();

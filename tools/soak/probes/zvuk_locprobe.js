/* locprobe.js URL ЖУРНАЛ — проба по местам: кто включает и гасит музыку и фон, сколько петель звучит разом,
   живые интервалы, подписки на события, звучащие плееры и задержка главного потока — по каждому месту. */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const LOG=process.argv[3];fs.writeFileSync(LOG,"");const W=o=>fs.appendFileSync(LOG,JSON.stringify(o)+"\n");
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 page.on('pageerror',e=>W({ошибка:String(e).slice(0,300)}));
 await page.addInitScript(()=>{window.__gvAuto=true;
  const C=window.__снд={аудио:0,играют:new Set(),инт:new Map(),слуш:{},ev:[]};
  const A0=window.Audio;window.Audio=function(){C.аудио++;return new A0(...arguments);};window.Audio.prototype=A0.prototype;
  const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){C.играют.add(this);return pl.apply(this,arguments);};
  const si=window.setInterval,ci=window.clearInterval;
  window.setInterval=function(f,ms){const id=si.apply(this,arguments);C.инт.set(id,(String(new Error().stack).split("\n")[2]||"").trim().replace(/\(?http[^ ]*index.html:/,"@").slice(0,70)+" /"+ms);return id;};
  window.clearInterval=function(id){C.инт.delete(id);return ci.apply(this,arguments);};
  const ael=EventTarget.prototype.addEventListener,rel=EventTarget.prototype.removeEventListener;
  const кто=t=>t===window?"window":t===document?"document":(t&&t.nodeType===1?"узел":(t&&t.constructor&&t.constructor.name)||"?");
  EventTarget.prototype.addEventListener=function(type,fn,o){const k=кто(this)+":"+type;if(k.startsWith("window")||k.startsWith("document"))C.слуш[k]=(C.слуш[k]||0)+1;return ael.apply(this,arguments);};
  EventTarget.prototype.removeEventListener=function(type,fn,o){const k=кто(this)+":"+type;if(C.слуш[k])C.слуш[k]--;return rel.apply(this,arguments);};
  window.__лаг={макс:0,сумма:0,n:0,свыше200:0};let пред=performance.now();
  si(()=>{const t=performance.now();const l=t-пред-50;пред=t;const L=window.__лаг;if(l>L.макс)L.макс=l;L.сумма+=Math.max(0,l);L.n++;if(l>200)L.свыше200++;},50);});
 await page.goto(process.argv[2]);await page.waitForTimeout(2500);
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}
  let k=0;while(activeLayer()&&k++<12)closeTopUI();
  const C=window.__снд;const место=()=>G.place?(G.place.kind+(G.place.depth?":"+G.place.depth:"")):("верх:"+safeFn(()=>cellContent(G.x,G.y).terrain[0],"?"));
  const стек=()=>(String(new Error().stack).split("\n").slice(3,6).map(s=>s.trim().replace(/^at /,"").replace(/\(?http[^ ]*index.html:/,"@").replace(/\)$/,"").slice(0,60)).join(" < "));
  const L0=Bank.loop.bind(Bank),S0=Bank.stop.bind(Bank);
  Bank.loop=function(ch,role,o){const r=L0(ch,role,o);C.ev.push({t:Math.round(performance.now()),op:"loop",ch,role,ok:!!r,м:место(),кто:стек()});return r;};
  Bank.stop=function(ch){const had=Bank.loops.has(ch);const r=S0.apply(Bank,arguments);C.ev.push({t:Math.round(performance.now()),op:"stop",ch,had,м:место(),кто:стек()});return r;};
  const Ms=Music.start.bind(Music);Music.start=function(t){C.ev.push({t:Math.round(performance.now()),op:"music.start",ch:"music",role:t,м:место(),кто:стек()});return Ms(t);};
  /* счёт вызовов методов звуковых объектов */
  C.вызовы={};for(const [имя,o] of Object.entries({Music,AMB:window.AMB,Ambience:window.Ambience,DeepMusic:window.DeepMusic,Scape:window.Scape,AudioLife:window.AudioLife,AE:window.AE}))
   {if(!o)continue;for(const k of Object.keys(o)){if(typeof o[k]!=="function"||k==="start"&&имя==="Music")continue;const f=o[k];o[k]=function(){const n=имя+"."+k;C.вызовы[n]=(C.вызовы[n]||0)+1;return f.apply(this,arguments);};}}
  window.__место=место;});
 const снимок=async(имя)=>W(await page.evaluate((имя)=>{const C=window.__снд;const ev=C.ev.splice(0);
   const по={};for(const e of ev){const k=e.op+" "+e.ch;по[k]=(по[k]||0)+1;}
   /* дёрганье: петлю канала погасили и снова включили (или сменили роль) меньше чем за 3 с */
   const дёрг=[];const посл={};for(const e of ev){if(e.op==="music.start")continue;const p=посл[e.ch];if(p&&e.t-p.t<3000&&(p.op!==e.op||(e.op==="loop"&&p.role!==e.role)))дёрг.push({ch:e.ch,из:p.op+":"+(p.role||""),в:e.op+":"+(e.role||""),dt:e.t-p.t,кто:e.кто});посл[e.ch]=e;}
   const звучат=[...C.играют].filter(a=>!a.paused&&!a.ended).map(a=>String(a.currentSrc||a.src).split("/").slice(-2).join("/"));
   const L=window.__лаг;const лаг={макс:Math.round(L.макс),ср:L.n?Math.round(L.сумма/L.n):0,свыше200:L.свыше200};window.__лаг={макс:0,сумма:0,n:0,свыше200:0};
   const вызовы=C.вызовы;C.вызовы={};
   return {место:имя,где:window.__место(),события:по,дёрг:дёрг.slice(0,12),nДёрг:дёрг.length,петли:[...Bank.loops.entries()].map(([k,r])=>k+"="+(r.role||"?")),
    звучат,nЗвучат:звучат.length,интервалы:C.инт.size,аудиоСоздано:C.аудио,слуш:Object.fromEntries(Object.entries(C.слуш).filter(([k,v])=>v>0)),лаг,вызовы,
    ev:ev.filter(e=>e.op!=="music.start"||1).slice(0,40)};},имя));
 const шаги=async(n,ms=300)=>{const D=["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"];for(let i=0;i<n;i++){await page.keyboard.press(D[Math.floor(i/3)%4]);await page.waitForTimeout(ms);}};
 const закрыть=()=>page.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await снимок("старт");
 /* поверхность: разные местности */
 const мест=await page.evaluate(()=>{const нужно=new Map();for(let r=0;r<400&&нужно.size<8;r+=7)for(let a=0;a<16;a++){const x=G.x+Math.round(r*Math.cos(a)),y=G.y+Math.round(r*Math.sin(a));
   const t=safeFn(()=>{const q=cellContent(x,y).terrain;return Array.isArray(q)?q[0]:(q&&(q.id||q.key||q.name));},null);const c=safeFn(()=>cellContent(x,y),null);if(!t||(c&&c.structure))continue;if(!нужно.has(t))нужно.set(t,{x,y,t});}
  return [...нужно.values()];});
 for(const m of мест){await page.evaluate(m=>{G.place=null;G.x=m.x;G.y=m.y;},m);await шаги(12);await снимок("верх "+m.t);}
 /* поселение, дом, подземелье */
 const цели=await page.evaluate(()=>{const out={};for(let r=0;r<2500&&Object.keys(out).length<3;r+=11)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(!c||!c.structure)continue;const k=PLACE_KIND[c.structure.type];if(k&&!out[k])out[k]={x,y,type:c.structure.type};}return out;});
 W({цели});
 for(const k of ["city","house","dungeon"]){const c=цели[k];if(!c)continue;
  await page.evaluate(c=>{safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},c);
  await шаги(14);await снимок(k+" "+c.type);
  if(k==="dungeon"){for(let d=0;d<3;d++){await page.evaluate(()=>{const d0=G.place&&G.place.depth;safeFn(()=>changeDepth(1,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();});await шаги(10);await снимок("подземелье ярус+"+(d+1));}}
  await page.evaluate(()=>{safeFn(()=>{if(G.place)leavePlace();});let n=0;while(activeLayer()&&n++<12)closeTopUI();});await шаги(6);await снимок("после выхода из "+k);}
 /* бой */
 await page.evaluate(()=>{G.place=null;const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:25,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat(m));});
 for(let i=0;i<30;i++){const идёт=await page.evaluate(()=>!!G.inCombat);if(!идёт)break;await page.keyboard.press("Enter");await page.waitForTimeout(400);}
 await снимок("бой");await закрыть();await шаги(8);await снимок("после боя");
 /* круг: снова по тем же местам, чтобы увидеть рост интервалов и подписок */
 for(const m of мест.slice(0,3)){await page.evaluate(m=>{G.place=null;G.x=m.x;G.y=m.y;},m);await шаги(10);await снимок("круг2 верх "+m.t);}
 W({итог:true});await b.close();})();

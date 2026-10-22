/* zvuk_yarus.js URL ЖУРНАЛ [МИНУТ] — проба звука и речи по местам (22 октября, после записи дня):
   • чужие звуки под землёй: всё, что зазвучало в подземелье, ярусе или тайной палате (Bank.play, петли каналов,
     Spatial, звуковая среда), сверяется со списком звуков поверхности (птицы, дождь и гром, море, рынок, ветер полей,
     кони, петух, колокола) — с местом в коде, откуда звук заведён;
   • фон места не отваливается: каждые полсекунды — звучит ли хоть один плеер у каждой петли фона (place, scape,
     live, слой:*), сколько петель «молчит» дольше двух секунд подряд;
   • плееры: сколько создано и сколько звучит разом, источники звука в памяти (AudioBufferSource);
   • речь: журнал речи и звука игры (ЖурналРЗ — сказано, снято, устарело, сведено, перебито) за каждое место,
     очередь речи, одна и та же фраза дважды подряд за 3 с (заикание), речь поверх речи;
   • зависания: задержка главного потока (часы по 50 мс), долгие задачи, ошибки страницы. */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const URL=process.argv[2],LOG=process.argv[3];const МИН=Number(process.argv[4]||6);fs.writeFileSync(LOG,"");const W=o=>fs.appendFileSync(LOG,JSON.stringify(o)+"\n");
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 page.on('pageerror',e=>W({ошибка:String(e).slice(0,300)}));
 await page.addInitScript(()=>{window.__gvAuto=true;
  const P=window.__пр={аудио:0,играют:new Set(),буф:0,лонг:[]};
  const A0=window.Audio;window.Audio=function(){P.аудио++;return new A0(...arguments);};window.Audio.prototype=A0.prototype;
  const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){P.играют.add(this);return pl.apply(this,arguments);};
  const AC=window.AudioContext||window.webkitAudioContext;
  if(AC){const cb=AC.prototype.createBufferSource;AC.prototype.createBufferSource=function(){P.буф++;return cb.apply(this,arguments);};}
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())P.лонг.push(Math.round(e.duration));}).observe({entryTypes:["longtask"]});}catch(_){}
  window.__лаг={макс:0,сумма:0,n:0,свыше200:0};let пред=performance.now();
  setInterval(()=>{const t=performance.now();const l=t-пред-50;пред=t;const L=window.__лаг;if(l>L.макс)L.макс=l;L.сумма+=Math.max(0,l);L.n++;if(l>200)L.свыше200++;},50);});
 await page.goto(URL);await page.waitForTimeout(3000);
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}
  let k=0;while(activeLayer()&&k++<12)closeTopUI();
  const P=window.__пр;P.чужие=[];P.звуки={};P.дыры={};P.молчит={};P.речь=[];P.речьПоверх=0;P.заик=[];
  /* звуки поверхности — под землёй им не место */
  const ВЕРХ=/(^|_)(birds?|wild_birds|oc_birds|stk_birds|bird_hawk|bird_owl|wild_owl|owl|rain|oc_rain|thunder|sky_|sea_|wave|ad_wave|market|hall_market|beasts_horse|horse|rooster|mirth_rooster|cow|cricket|frog|gull|seagull|church|bells?|bell_big|wild_wind|sky_wind|oc_wind|lug_wind|amb_wind|ad_windleaves|leaves|meadow|field|crowd|surf)/;
  const подЗемлёй=()=>{const p=G.place;if(safeFn(()=>Chertog.inside(),false))return true;if(!p)return false;
   return p.kind==="dungeon"||Number(p.depth)>0||/dungeon|cave|mine|crypt|catacomb|tomb|lair|штоль|пещер/i.test(String(p.kind||"")+String(p.type||""));};
  const место=()=>{const p=G.place;if(safeFn(()=>Chertog.inside(),false))return "чертог";return p?(p.kind+(p.depth?":"+p.depth:"")):"верх";};
  const где=()=>(String(new Error().stack).split("\n").slice(3,6).map(s=>s.trim().replace(/^at /,"").replace(/\(?http[^ ]*index.html:/,"@").replace(/\)$/,"").slice(0,55)).join(" < "));
  const учесть=(что,имя)=>{имя=String(имя||"");const м=место();const k=м+" "+что+":"+имя;P.звуки[k]=(P.звуки[k]||0)+1;
   if(подЗемлёй()&&ВЕРХ.test(имя.replace(/^.*\//,"").replace(/\.\w+$/,"")))P.чужие.push({м,что,имя,где:где()});};
  const bp=Bank.play.bind(Bank);Bank.play=function(role,o){учесть("play",role);return bp(role,o);};
  const bl=Bank.loop.bind(Bank);Bank.loop=function(ch,role,o){учесть("loop "+ch,role);return bl(ch,role,o);};
  if(window.Spatial){for(const f of ["play","at"]){const f0=Spatial[f];if(typeof f0!=="function")continue;
   Spatial[f]=function(a){учесть("spatial."+f,Array.isArray(a)?a.join("|"):a);return f0.apply(this,arguments);};}}
  /* речь: начало каждой фразы — заикание (та же фраза снова за 3 с) и речь поверх речи */
  if(Speech&&typeof Speech._speak==="function"){const s0=Speech._speak;Speech._speak=function(t){
   const txt=String(t&&t.text||t&&t.t||t||"").slice(0,80);const now=Date.now();
   const посл=P.речь[P.речь.length-1];if(посл&&посл.txt===txt&&now-посл.t<3000)P.заик.push({txt,dt:now-посл.t,м:место()});
   if(safeFn(()=>Speech.isSpeaking(),false))P.речьПоверх++;
   P.речь.push({t:now,txt});if(P.речь.length>400)P.речь.splice(0,200);return s0.apply(this,arguments);};}
  /* фон места: звучит ли хоть один плеер у каждой петли фона */
  const фон=к=>к==="place"||к==="live"||к==="scape"||/^слой:/.test(к);
  setInterval(()=>{const м=место();for(const [к,r] of Bank.loops){if(!фон(к)||!r)continue;
    const els=[r.el,r.el2,r.запас].filter(Boolean);const жив=els.some(e=>e&&!e.paused&&!e.ended&&e.volume>0.0001);
    const id=м+" "+к+"="+r.role;if(жив){if(P.молчит[id]>=4)P.дыры[id]=(P.дыры[id]||0)+1;P.молчит[id]=0;}else P.молчит[id]=(P.молчит[id]||0)+1;}},500);
  window.__место=место;});
 const снимок=async(имя)=>W(await page.evaluate((имя)=>{const P=window.__пр;const L=window.__лаг;
   const звучат=[...P.играют].filter(a=>!a.paused&&!a.ended);
   const журнал=safeFn(()=>({речь:Object.assign({},ЖурналРЗ.счёт.речь),звук:Object.assign({},ЖурналРЗ.счёт.звук),
     сбоиРечи:ЖурналРЗ.речь.slice(-12).map(z=>z.итог+": "+z.что),сбоиЗвука:ЖурналРЗ.звук.slice(-12).map(z=>z.итог+": "+z.что)}),null);
   safeFn(()=>ЖурналРЗ.очистить());
   const молчат=Object.entries(P.молчит).filter(([k,v])=>v>=4).map(([k,v])=>k+" "+(v/2)+"с");
   const o={этап:имя,где:window.__место(),чужие:P.чужие.splice(0,30),nЧужих:P.чужие.length,дыры:P.дыры,молчатСейчас:молчат,
    петли:[...Bank.loops.entries()].map(([k,r])=>k+"="+(r&&r.role||"?")),звучатПлееров:звучат.length,
    звучат:звучат.slice(0,12).map(a=>String(a.currentSrc||a.src).split("/").slice(-2).join("/")),аудиоСоздано:P.аудио,буферов:P.буф,
    среда:safeFn(()=>ЗвукСреда.заняты()+"/"+ЗвукСреда.каналы.length,"?"),очередьРечи:safeFn(()=>Speech.queue.length,-1),
    речьПоверх:P.речьПоверх,заикание:P.заик.splice(0,10),журнал,
    лаг:{макс:Math.round(L.макс),ср:L.n?Math.round(L.сумма/L.n*10)/10:0,свыше200:L.свыше200},лонг:{n:P.лонг.length,макс:Math.max(0,...P.лонг)},
    звуки:Object.entries(P.звуки).sort((a,b)=>b[1]-a[1]).slice(0,25)};
   P.дыры={};P.звуки={};P.речьПоверх=0;P.лонг=[];window.__лаг={макс:0,сумма:0,n:0,свыше200:0};return o;},имя));
 const закрыть=()=>page.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 const ходить=async(сек,ms=280)=>{const t0=Date.now();let i=0;while(Date.now()-t0<сек*1000){const d=["E","S","W","N"][Math.floor(i/4)%4];
   await page.evaluate(d=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat&&!window.__бой)safeFn(()=>endCombat());safeFn(()=>move(d));},d);i++;await page.waitForTimeout(ms);}};
 const м=МИН*60/10;
 await снимок("старт");
 await ходить(м);await снимок("поверхность");
 /* подземелья разных родов */
 const подз=await page.evaluate(()=>{const out=[];const типы=new Set();for(let r=0;r<4000&&out.length<4;r+=13)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(!c||!c.structure)continue;const k=PLACE_KIND[c.structure.type];if(k!=="dungeon"||типы.has(c.structure.type))continue;типы.add(c.structure.type);out.push({x,y,type:c.structure.type});}return out;});
 W({подземелья:подз});
 for(const c of подз){
  await page.evaluate(c=>{safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},c);
  await ходить(м/2);await снимок("подземелье "+c.type+" ярус 1");
  for(let d=0;d<2;d++){await page.evaluate(()=>{safeFn(()=>changeDepth(1,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();});await ходить(м/2);await снимок("подземелье "+c.type+" ярус "+(d+2));}
  /* бой в ярусе */
  await page.evaluate(()=>{window.__бой=1;const m=Object.assign({},MONSTERS.find(z=>z.id==="goblin")||MONSTERS[0],{hp:30,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat(m));});
  for(let i=0;i<40;i++){const идёт=await page.evaluate(()=>!!G.inCombat);if(!идёт)break;await page.keyboard.press("Enter");await page.waitForTimeout(450);}
  await page.evaluate(()=>{window.__бой=0;if(G.inCombat)safeFn(()=>endCombat());let n=0;while(activeLayer()&&n++<12)closeTopUI();});await ходить(10);await снимок("подземелье "+c.type+" после боя");
  await page.evaluate(()=>{safeFn(()=>{if(G.place)leavePlace();});let n=0;while(activeLayer()&&n++<12)closeTopUI();});await ходить(м/3);await снимок("после выхода из "+c.type);}
 /* поселение */
 const город=await page.evaluate(()=>{for(let r=0;r<2500;r+=11)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]==="city")return {x,y,type:c.structure.type};}return null;});
 if(город){await page.evaluate(c=>{safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},город);
  await ходить(м);await снимок("город "+город.type);await page.evaluate(()=>{safeFn(()=>{if(G.place)leavePlace();});});}
 await ходить(м);await снимок("поверхность 2");
 W({итог:true});await b.close();})();

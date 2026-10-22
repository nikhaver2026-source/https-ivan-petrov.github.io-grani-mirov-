/* edge.js URL — край местности: ходим туда-сюда через границу двух местностей и считаем, сколько раз гасли и
   заводились музыка и фоны; затем идём прямо в новую местность. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await page.addInitScript(()=>{window.__gvAuto=true;let a=12345;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};});
 await page.goto(process.argv[2]);await page.waitForTimeout(3000);
 const r=await page.evaluate(async()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}
  const закрыть=()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());};закрыть();
  const ev=[];const L0=Bank.loop.bind(Bank),S0=Bank.stop.bind(Bank);
  Bank.loop=function(ch,role,o){const cur=Bank.loops.get(ch);const r=L0(ch,role,o);const now=Bank.loops.get(ch);if(now!==cur)ev.push("loop "+ch+"="+role);return r;};
  Bank.stop=function(ch){if(Bank.loops.has(ch))ev.push("stop "+ch);return S0(ch);};
  const M0=Music.stop.bind(Music);Music.stop=function(){if(Music.current)ev.push("music.stop "+Music.current);return M0();};
  const ждать=ms=>new Promise(r=>setTimeout(r,ms));
  /* граница: клетка, у которой восточная соседка — другая местность (не вода и не постройка) */
  const T=(x,y)=>safeFn(()=>cellContent(x,y).terrain[0],null);const S=(x,y)=>safeFn(()=>!!cellContent(x,y).structure,true);
  let край=null;const пары={};
  for(let r=0;r<300&&!край;r+=3)for(let a=0;a<24&&!край;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const t1=T(x,y),t2=T(x+1,y),t3=T(x+2,y),t4=T(x+3,y),t5=T(x+4,y),t0=T(x-1,y);
   if(t1&&t2&&t1!==t2&&t0===t1&&t3===t2&&t4===t2&&t5===t2&&!S(x,y)&&!S(x+1,y)&&!S(x+2,y)&&!S(x+3,y)&&!S(x+4,y)&&!S(x-1,y)&&!/coast|sea|water/.test(t1+t2))край={x,y,t1,t2};}
  if(!край)return {нет:"края не нашлось"};
  G.place=null;G.x=край.x-1;G.y=край.y;arrive("E");await ждать(2500);закрыть();
  move("E");await ждать(600);закрыть();
  ev.length=0;
  /* туда-сюда через границу: 16 шагов */
  for(let i=0;i<16;i++){закрыть();move(i%2?"W":"E");await ждать(450);}
  const туда=ev.splice(0);
  /* прямо в новую местность: 4 шага */
  закрыть();for(let i=0;i<4;i++){закрыть();move("E");await ждать(450);}
  await ждать(500);
  const прямо=ev.splice(0);
  return {край,туда_сюда:{событий:туда.length,список:туда.slice(0,30)},прямо:прямо,петли:[...Bank.loops.entries()].map(([k,r])=>k+"="+r.role),музыка:Music.current};});
 console.log(JSON.stringify(r,null,1));if(errs.length)console.log("ошибки:",errs);await b.close();})();

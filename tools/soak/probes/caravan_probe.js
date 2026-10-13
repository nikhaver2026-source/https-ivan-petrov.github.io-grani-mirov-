// Обозы: сколько раз окно обоза всплывает за 40 шагов у деревень (как в живом эпизоде долгой игры).
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const r=await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  const m0=meetCaravan;window.__met=[];meetCaravan=function(car){window.__met.push(car?caravanTitle(car):null);return m0.apply(this,arguments);};
  const места=[];const виды={};for(let r=1;r<220&&места.length<60;r+=3)for(let dx=-r;dx<=r;dx+=3)for(const dy of [-r,r]){const x=G.x+dx,y=G.y+dy;const cc=safeFn(()=>cellContent(x,y),null);
   const st=cc&&cc.structure;if(!st||!СВОД_ПО_ТИПУ[st.type])continue;if((виды[st.type]||0)>=12)continue;виды[st.type]=(виды[st.type]||0)+1;места.push({x,y,t:st.type});}
  const деревни=места.filter(m=>m.t==="village");const out=[];
  for(const m of деревни.slice(0,12)){safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=m.x;G.y=m.y;window.__met=[];let слоёв=0;const чужие={};
   for(let шаг=0;шаг<40;шаг++){const l=safeFn(()=>activeLayer(),null);if(l){слоёв++;чужие[l.id||"слой"]=(чужие[l.id||"слой"]||0)+1;closeTopUI();continue;}
    if(G.inCombat){safeFn(()=>{G.inCombat=false;});continue;}safeFn(()=>move(["N","E","S","W"][шаг%4]));await new Promise(q=>setTimeout(q,30));}
   out.push({x:m.x,y:m.y,встреч:window.__met.length,разных:new Set(window.__met).size,чужие,ряд:window.__met.slice(0,8).map(t=>String(t).split(":")[0])});}
  return out;});
 for(const o of r)console.log(JSON.stringify(o));
 console.log('ошибок страницы',errors.length,errors.slice(0,3));
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

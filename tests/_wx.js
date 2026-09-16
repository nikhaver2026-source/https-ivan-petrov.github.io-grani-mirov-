const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8899/https-ivan-petrov.github.io-grani-mirov-/index.html');
 await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 const r=await page.evaluate(()=>{
  const место=(имяБиома)=>{
   for(let i=0;i<200000;i++){
    const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
    const bm=safeFn(()=>biomeAt(x,y),null);
    if(bm&&bm.id===имяБиома)return {x,y};}
   return null;};
  const перепись=(точка,день,час)=>{
   if(!точка)return null;
   G.place=null;G.ship=null;G.alt=0;G.x=точка.x;G.y=точка.y;G.day=день;G.hour=час;
   const c={};
   for(let i=0;i<4000;i++){const w=rollWeather();c[w]=(c[w]||0)+1;}
   return Object.entries(c).sort((a,b)=>b[1]-a[1])
    .map(([k,v])=>k+" "+Math.round(v/40)+"%").join(", ");};
  const пустыня=место("desert"),ледник=место("glacier"),
        лес=место("ancient_forest"),топь=место("mire");
  return {
   пустыняЛето:перепись(пустыня,30,13),
   ледникЛето:перепись(ледник,30,13),
   лесЛето:перепись(лес,30,13),
   лесЗима:перепись(лес,80,13),
   топьРассвет:перепись(топь,30,6),
   топьПолдень:перепись(топь,30,13),
   видов:BIOME_BY_ID?Object.keys(BIOME_BY_ID).length:0,
   всегоПогод:WEATHER_KINDS.length};});
 for(const k in r)console.log(k.padEnd(14),":",r[k]);
 console.log("ошибки:",errors.slice(0,3));
 await b.close();
})();

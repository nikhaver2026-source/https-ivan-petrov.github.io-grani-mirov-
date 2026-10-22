/* orphan.js URL — звучащие плееры без хозяина: после подземелья, ярусов, выхода и шагов по поверхности смотрим,
   кому принадлежит каждый звучащий плеер (петля банка, канал среды, короткий звук, речь) и нет ли бесхозных. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await page.addInitScript(()=>{window.__gvAuto=true;let a=777;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  window.__все=new Set();const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__все.add(this);return pl.apply(this,arguments);};});
 await page.goto(process.argv[2]);await page.waitForTimeout(3000);
 const шаги=async n=>{for(let i=0;i<n;i++){await page.evaluate(d=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());move(d);},["E","S","W","N"][Math.floor(i/3)%4]);await page.waitForTimeout(300);}};
 const снимок=имя=>page.evaluate(имя=>{const свои=new Map();
   Bank.loops.forEach((r,k)=>{[["el",r.el],["el2",r.el2],["запас",r.запас]].forEach(([w,e])=>{if(e)свои.set(e,"петля "+k+"."+w);});});
   safeFn(()=>ЗвукСреда.каналы.forEach((к,i)=>свои.set(к.el,"среда#"+i+(к.занят?"":"(свободен)"))));
   Bank.shots.forEach(e=>{if(!свои.has(e))свои.set(e,"короткий");});
   safeFn(()=>{if(Speech._плеер)свои.set(Speech._плеер,"речь общий");if(Speech._плеерЕ)свои.set(Speech._плеерЕ,"речь eSpeak");});
   const звучат=[...window.__все].filter(a=>!a.paused&&!a.ended&&(a.currentSrc||a.src));
   const бесх=звучат.filter(a=>!свои.has(a)&&!a.__память);
   return {этап:имя,звучат:звучат.length,бесхозных:бесх.length,бесхозные:бесх.map(a=>String(a.currentSrc||a.src).split("/").slice(-2).join("/")+(a.loop?" (loop)":"")+" род="+(a.__род||"?")),
    петли:[...Bank.loops.entries()].map(([k,r])=>k+"="+r.role+(r.запас?"+запас":"")),заводилось:window.__все.size};},имя);
 const out=[];
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await page.waitForTimeout(20000);out.push(await снимок("стоим 20 с"));
 await шаги(30);out.push(await снимок("30 шагов"));
 const ц=await page.evaluate(()=>{for(let r=0;r<2500;r+=11)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]==="dungeon")return {x,y};}return null;});
 if(ц){await page.evaluate(c=>{G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();},ц);
  await шаги(20);out.push(await снимок("подземелье"));
  for(let d=0;d<3;d++){await page.evaluate(()=>{safeFn(()=>changeDepth(1,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();});await шаги(15);out.push(await снимок("ярус+"+(d+1)));}
  await page.evaluate(()=>{safeFn(()=>{if(G.place)leavePlace();});let n=0;while(activeLayer()&&n++<12)closeTopUI();});
  await page.waitForTimeout(500);out.push(await снимок("сразу после выхода"));
  await page.waitForTimeout(12000);out.push(await снимок("через 12 с после выхода"));
  await шаги(20);out.push(await снимок("20 шагов наверху"));}
 await page.waitForTimeout(30000);out.push(await снимок("стоим ещё 30 с"));
 console.log(JSON.stringify(out,null,1));if(errs.length)console.log("ошибки:",errs.slice(0,5));await b.close();})();

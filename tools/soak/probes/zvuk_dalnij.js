/* zvuk_dalnij.js URL — откуда задержка после дальнего переноса (обоз, сеть переходов) и в первые шаги после входа:
   профиль процессора (CDP Profiler) на 12 шагах после входа и после переноса за 3000 клеток; топ функций по собственному
   времени с местом в index.html. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext()).newPage();const cdp=await page.context().newCDPSession(page);
 await page.addInitScript(()=>{window.__gvAuto=true;});
 await page.goto(process.argv[2]);await page.waitForTimeout(2500);
 await page.evaluate(()=>{settings.effects=1;settings.music=1;try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});
 const замер=async(имя,дело)=>{await cdp.send('Profiler.start');const t0=Date.now();const лаг=await page.evaluate(дело);const {profile}=await cdp.send('Profiler.stop');
  const dt=[];const id2n=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();
  const ti=profile.timeDeltas;for(let i=0;i<profile.samples.length;i++){const n=id2n.get(profile.samples[i]);const k=n.callFrame.functionName+" @"+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+(ti[i]||0)/1000);}
  const топ=[...self.entries()].filter(([k])=>!/^\(idle\)|^\(program\)|^\(garbage/.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>Math.round(v)+" мс "+k);
  console.log("== "+имя+" ("+(Date.now()-t0)+" мс), шаги:",JSON.stringify(лаг));топ.forEach(x=>console.log("   "+x));};
 const шаги=`(()=>{const out=[];const D=["E","E","S","S","W","W","N","N","E","S","W","N"];for(const d of D){const t=performance.now();safeFn(()=>move(d));out.push(Math.round(performance.now()-t));}return out;})()`;
 await замер("12 шагов сразу после входа",new Function("return "+шаги));
 await замер("ещё 12 шагов",new Function("return "+шаги));
 await замер("перенос за 3000 клеток и 12 шагов",new Function(`const t=performance.now();G.x+=3000;G.y+=1700;safeFn(()=>refresh());safeFn(()=>arrive());const пер=Math.round(performance.now()-t);return [пер].concat(${шаги});`));
 await замер("ещё 12 шагов там же",new Function("return "+шаги));
 await b.close();})();

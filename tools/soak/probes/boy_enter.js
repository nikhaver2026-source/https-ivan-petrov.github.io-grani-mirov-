/* boy_enter.js URL — время обработки каждого Enter в бою; профиль процессора самого долгого нажатия */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.addInitScript(()=>{window.__gvAuto=true;});
 await p.goto(process.argv[2]);await p.waitForTimeout(3000);
 await p.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;enterGame();let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await p.waitForTimeout(2000);
 const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});
 const итоги=[];
 for(let r=0;r<3;r++){
  await p.evaluate(()=>{G.place=null;const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:80,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat(m));});
  for(let i=0;i<14;i++){
   const идёт=await p.evaluate(()=>!!G.inCombat);if(!идёт)break;
   await cdp.send('Profiler.start');
   const dt=await p.evaluate(()=>{const t=performance.now();document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));return performance.now()-t;});
   const prof=(await cdp.send('Profiler.stop')).profile;
   итоги.push({r,i,dt:Math.round(dt),prof});
   await p.waitForTimeout(450);}
  await p.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());});
  await p.waitForTimeout(800);}
 console.log('нажатий',итоги.length,'мс:',итоги.map(x=>x.dt).join(' '));
 итоги.sort((a,b)=>b.dt-a.dt);
 for(const x of итоги.slice(0,2)){const P=x.prof;const self={};const dt=P.timeDeltas;const by={};for(const n of P.nodes)by[n.id]=n;
  const cnt={};for(const s of P.samples)cnt[s]=(cnt[s]||0)+1;
  // время по функциям (сам и с потомками)
  const parent={};for(const n of P.nodes)for(const c of (n.children||[]))parent[c]=n.id;
  const incl={};for(const [id,c] of Object.entries(cnt)){let k=+id;const seen=new Set();while(k!==undefined){const f=by[k].callFrame;const nm=(f.functionName||'(анон)')+'@'+(f.lineNumber+1);if(!seen.has(nm)){incl[nm]=(incl[nm]||0)+c;seen.add(nm);}k=parent[k];}
   const f=by[id].callFrame;const nm=(f.functionName||'(анон)')+'@'+(f.lineNumber+1);self[nm]=(self[nm]||0)+c;}
  const ms=c=>Math.round(c*0.2);
  console.log(`\n== нажатие ${x.r}/${x.i}: ${x.dt} мс`);
  console.log(' сам:',Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>k+' '+ms(v)).join('; '));
  console.log(' всего:',Object.entries(incl).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+' '+ms(v)).join('; '));}
 console.log('ошибки',errs.slice(0,3));await b.close();})();

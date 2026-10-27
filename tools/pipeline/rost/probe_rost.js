/* probe_rost.js URL ШАГОВ — скорость роста «как путник»: герой с первого уровня идёт по миру настоящими шагами (move),
   события решает первым выбором, бои выигрывает (victory), здоровье держится. Раз в 500 шагов — снимок роста. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const N=Number(process.argv[3]||3000);
 await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();G.place=null;G.ship=null;window.__снимки=[];window.__бой=0;window.__соб=0;});
 const снимок=()=>p.evaluate(()=>({шаг:window.__шаг,ур:G.level,оп:G.xp,до:xpNeed(G.level),боёв:window.__бой,событий:window.__соб,
  знаний:safeFn(()=>Lore.count(),0),мест:Object.values(G.known||{}).filter(k=>k&&k.v).length,
  ветви:safeFn(()=>BRANCHES.map(x=>branchRank(x)).filter(r=>r>0).join(""),""),древо:safeFn(()=>TREE_LEAVES.filter(l=>Tree.ступень(l.id)>0).length,0),
  день:G.day,идёт:window.__идёт,стоп:window.__стоп,место:G.place?G.place.type||'место':null,слой:activeLayer()?activeLayer().id:null,позн:typeof Рост!=="undefined"?Рост.познание().всего:null,граниВсе:typeof Рост!=="undefined"?Рост.познание().грани.map(g=>g.id+":"+g.счёт).join(" "):null}));
 const ход=["N","E","S","W"];let dir="E";const out=[];
 for(let i=1;i<=N;i++){
  const пошёл=await p.evaluate(async([i,d])=>{window.__шаг=i;G.hp=G.hpMax;
   if(activeLayer()&&!G.inCombat){const L=activeLayer();const btn=safeFn(()=>visibleInteractive(L).filter(x=>x.tagName==="BUTTON")[0],null);
    if(btn){window.__соб++;safeFn(()=>btn.click());}}
   for(let k=0;k<6&&activeLayer();k++)closeTopUI();
   if(G.inCombat&&G.combat){window.__бой++;G.combat.hp=0;safeFn(()=>victory());for(let k=0;k<4&&activeLayer();k++)closeTopUI();}
   if(G.place&&!G.inCombat){safeFn(()=>leavePlace());for(let k=0;k<4&&activeLayer();k++)closeTopUI();}
   const x0=G.x,y0=G.y;move(d);if(G.x===x0&&G.y===y0){window.__стоп=(window.__стоп||0)+1;return false;}window.__идёт=(window.__идёт||0)+1;return true;},[i,dir]);
  if(!пошёл||Math.random()<0.08)dir=ход[Math.floor(Math.random()*4)];
  if(i%500===0){const s=await снимок();out.push(s);console.log(JSON.stringify(s));}}
 console.log("ошибок страницы",errs.length,errs.slice(0,3));await b.close();})();

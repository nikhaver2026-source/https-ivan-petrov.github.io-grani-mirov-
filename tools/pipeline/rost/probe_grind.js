/* probe_grind.js URL БОЁВ — «гриндер»: герой стоит на месте и бьёт одну и ту же тварь своего уровня (опыт как у обычной твари: 26 + 14·ур). */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await (await b.newContext()).newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const N=Number(process.argv[3]||300);
 await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();G.place=null;G.ship=null;window.maybeEvent=()=>{};});
 for(let i=1;i<=N;i++){
  const s=await p.evaluate(async(i)=>{const L=Number(G.level)||1;G.hp=G.hpMax;
   startCombat({x:G.x,y:G.y,monster:{id:"wolf",n:"Волк",lvl:L,hp:30,dmg:1,xp:26+14*L,gold:1}},{});await new Promise(r=>setTimeout(r,20));
   if(G.combat){G.combat.hp=0;safeFn(()=>victory());}for(let k=0;k<4&&activeLayer();k++)closeTopUI();
   return i%100===0?{боёв:i,ур:G.level,оп:G.xp,до:xpNeed(G.level),запас:typeof Рост!=="undefined"?Рост.ст().удерж:null,позн:typeof Рост!=="undefined"?Рост.познание().всего:null}:null;},i);
  if(s)console.log(JSON.stringify(s));}
 console.log("ошибок страницы",errs.length,errs.slice(0,3));await b.close();})();

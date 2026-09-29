const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(process.argv[2]);await p.waitForTimeout(700);await p.evaluate(()=>enterGame());await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
 const SAID=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{SAID.push(String(t));return s0(t,o);};
 const n=getNPC(500,500,0,"Торговец");G.gold=500;
 const before=JSON.stringify({items:G.items,inv:G.inv,potions:G.potions});
 let buyFn=Object.keys(window).filter(k=>/^buy|Buy/.test(k)&&typeof window[k]==="function");
 return {before,buyFn,stock:stockFor(n).slice(0,3)};});
console.log(JSON.stringify(r).slice(0,1500),errs.slice(0,2));await b.close();})();

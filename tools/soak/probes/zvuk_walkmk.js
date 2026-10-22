/* walkmk.js URL — 40 с ходьбы по поверхности: какие записи заводят новый плеер (не из памяти) и кто их зовёт */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();
 await page.addInitScript(()=>{window.__gvAuto=true;let a=12345;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  window.__ma=[];const A0=window.Audio;window.Audio=function(u){const st=String(new Error().stack).split("\n").slice(2,9).map(s=>{const m=/at ([^ (]+).*index\.html:(\d+)/.exec(s);return m?m[1]+"@"+m[2]:"";}).filter(Boolean).join(" < ");window.__ma.push({u:String(u||"").split("/").slice(-2).join("/"),st});return new A0(...arguments);};window.Audio.prototype=A0.prototype;});
 await page.goto(process.argv[2]);await page.waitForTimeout(3000);
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await page.waitForTimeout(6000);await page.evaluate(()=>{window.__ma=[];});
 const t0=Date.now();let i=0;while(Date.now()-t0<40000){await page.evaluate(d=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());move(d);},["E","S","W","N"][Math.floor(i/4)%4]);i++;await page.waitForTimeout(260);}
 const r=await page.evaluate(()=>{const по={};for(const z of window.__ma){const k=(/gvoice|^m\/|^f\//.test(z.u)?"[голос] ":z.u+" | ")+z.st.split(" < ").slice(1,7).join(" < ");по[k]=(по[k]||0)+1;}
  const файлы={};for(const z of window.__ma){файлы[z.u]=(файлы[z.u]||0)+1;}
  return {всего:window.__ma.length,по:Object.entries(по).sort((a,b)=>b[1]-a[1]).slice(0,12),файлы:Object.entries(файлы).sort((a,b)=>b[1]-a[1]).slice(0,15),
   память:{вкл:ПамятьЗвука.вкл(),кэш:ПамятьЗвука.кэш.size,плохо:ПамятьЗвука.плохо.size,раз:ПамятьЗвука.раз,эхо:safeFn(()=>Эхо165.надо(),null),небо:safeFn(()=>Небо165.на,null)}};});
 console.log(JSON.stringify(r,null,1));await b.close();})();

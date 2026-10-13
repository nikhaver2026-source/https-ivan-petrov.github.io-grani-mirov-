// Все загадки свода (условие, варианты, подсказки) через чист и eSpeak собранной страницы: сколько уводят в английский словарь.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{window.__dict=[];for(const k of ['error','warn','log','info','debug']){const f=console[k];console[k]=function(...a){try{const s=a.map(String).join(' ');if(/_dict|Bad data/.test(s))window.__dict.push(s);}catch(_){}return f.apply(this,a);};}});
 const page=await ctx.newPage();
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const n=await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  ESpeak.load();const t0=performance.now();while(!ESpeak.ready()&&performance.now()-t0<20000)await new Promise(q=>setTimeout(q,100));
  if(!ESpeak.ready())return -1;
  const S=new Set();const add=x=>{if(x==null)return;if(Array.isArray(x)){x.forEach(add);return;}if(typeof x==="object")return;const s=String(x).trim();if(s)S.add(s);};
  for(const где of ["п","д"])for(let i=0;i<Свод.размер(где);i++){const z=Свод.загадка(где,i);add(z.q);add(z.ans);add(z.hints);add(z.a);add(z.fb);add(z.n);}
  window.__все=[...S];
  window.__синт=t=>{const x=ESpeak.кир(ESpeak.рим(ESpeak.чист(t)));if(!x)return 0;const n0=window.__dict.length;ESpeak.w.synthesize(x,()=>{});return window.__dict.length-n0;};
  return window.__все.length;});
 if(n<0){console.log('не готов');process.exit(1);}
 const t0=Date.now();const плохие=[];
 for(let i=0;i<n;i+=2000){const r=await page.evaluate(([a,b])=>{const o=[];for(const t of window.__все.slice(a,b)){let e=0;try{e=__синт(t);}catch(_){}if(e)o.push([t,ESpeak.кир(ESpeak.рим(ESpeak.чист(t)))]);}return o;},[i,i+2000]);плохие.push(...r);}
 console.log(JSON.stringify({строк:n,уводят:плохие.length,сек:Math.round((Date.now()-t0)/1000)}));
 fs.writeFileSync('/root/S/dev155/espeak_svod_bad.json',JSON.stringify(плохие));
 for(const [a,b] of плохие.slice(0,30))console.log(JSON.stringify(a.slice(0,200)),' → ',JSON.stringify(b.slice(0,200)));
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

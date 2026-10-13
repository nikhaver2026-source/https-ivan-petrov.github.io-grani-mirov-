// Проба на всём тексте игры: какие строки (после чист) уводят eSpeak в английский словарь. argv: url corpus.json old|new
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{window.__dict=[];for(const k of ['error','warn','log','info','debug']){const f=console[k];console[k]=function(...a){try{const s=a.map(String).join(' ');if(/_dict|Bad data/.test(s))window.__dict.push(s);}catch(_){}return f.apply(this,a);};}});
 const page=await ctx.newPage();
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const C=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));const НОВОЕ=process.argv[4]==="new";
 const ok=await page.evaluate(async(НОВОЕ)=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  ESpeak.load();const t0=performance.now();while(!ESpeak.ready()&&performance.now()-t0<20000)await new Promise(q=>setTimeout(q,100));
  if(!ESpeak.ready())return false;
  if(НОВОЕ){const orig=ESpeak.чист;ESpeak.чист=function(t){t=orig.call(this,t);
   t=t.replace(/—-(?=\d)/g,"—минус ").replace(/([A-Za-zА-Яа-яЁё])-(?=\d)/g,"$1 ")
    .replace(/-/g,(m,i,s)=>{const a=s[i-1]||"",b=s[i+1]||"",A=/[0-9A-Za-zА-Яа-яЁё]/.test(a),B=/[0-9A-Za-zА-Яа-яЁё]/.test(b);
      return A&&B||(!a||/\s/.test(a))&&(!b||/\s/.test(b))?"-":A||B?"":" ";})
    .replace(/([0-9A-Za-zА-Яа-яЁё])—/g,"$1 —").replace(/—(?=[0-9A-Za-zА-Яа-яЁё])/g,"— ")
    .replace(/(^|[\n.,:;!?(«"']|[.!?][»")]+)[ \t]*(?:—[ \t]*)+/g,"$1 ").replace(/(^|[\n(«"']|[.,:;!?][ \t]+)[ \t]*\.{2,}[ \t]*/g,"$1");
   return /[0-9A-Za-zА-Яа-яЁё]/.test(t)?t:"";};}
  /* быстрее: только синтез без сборки WAV */
  window.__синт=t=>{const x=ESpeak.кир(ESpeak.рим(ESpeak.чист(t)));if(!x)return 0;const n0=window.__dict.length;ESpeak.w.synthesize(x,()=>{});return window.__dict.length-n0;};
  return true;},НОВОЕ);
 if(!ok){console.log('не готов');process.exit(1);}
 const t0=Date.now();const плохие=[];
 for(let i=0;i<C.length;i+=1500){const part=C.slice(i,i+1500);
  const r=await page.evaluate(part=>{const o=[];for(const t of part){let e=0;try{e=__синт(t);}catch(_){}if(e)o.push([t,ESpeak.кир(ESpeak.рим(ESpeak.чист(t)))]);}return o;},part);
  плохие.push(...r);}
 console.log(JSON.stringify({строк:C.length,уводят:плохие.length,сек:Math.round((Date.now()-t0)/1000)}));
 fs.writeFileSync(process.argv[3].replace(/\.json$/,'')+'_'+process.argv[4]+'_bad.json',JSON.stringify(плохие,null,0));
 for(const [a,b] of плохие.slice(0,40))console.log(JSON.stringify(a.slice(0,160)),' → ',JSON.stringify(b.slice(0,160)));
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

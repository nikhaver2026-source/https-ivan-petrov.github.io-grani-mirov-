// Проба: какие знаки и сочетания уводят eSpeak (русский голос) в английский словарь.
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{window.__dict=[];for(const k of ['error','warn','log','info','debug']){const f=console[k];console[k]=function(...a){try{const s=a.map(String).join(' ');if(/_dict|Bad data/.test(s))window.__dict.push(s);}catch(_){}return f.apply(this,a);};}});
 const page=await ctx.newPage();
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const r=await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  ESpeak.load();const t0=performance.now();while(!ESpeak.ready()&&performance.now()-t0<20000)await new Promise(q=>setTimeout(q,100));
  if(!ESpeak.ready())return {готов:false};
  const S=[...'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~«»—№'];
  const T=[];for(const c of S){T.push(`Слово ${c} слово`,c,`слово${c}`,`5${c}3`,`${c}5`,`${c}${c}`,`слово ${c}`);}
  T.push("50%","+5","3/10","1.5","1,5","10:30","1-й","№5","№ 5","#1","a&b","<b>жирно</b>","под_чёркивание","[1]","{x}","~5","5^2","@имя","$5","...","?!","!!","— 5","5 —",
   "1 000","1000000000000","12345678901234567890","0,5","--","---","сто́ит","́","а́́","5д","3ш","5-го","XIV","II.","Ⅻ","10 000 000","1.000","3:0","1/2","2×2","100%-й","5+","-5%","5-","5 -");
  const out=[];for(const t of T){const n0=window.__dict.length;let ok=null;try{ok=!!ESpeak.wav(t,5,1,"m");}catch(e){ok='искл '+e;}
   const n1=window.__dict.length;if(n1>n0)out.push({t,чист:ESpeak.кир(ESpeak.рим(ESpeak.чист(t))),ошибок:n1-n0});}
  return {готов:true,проверено:T.length,уводят:out};});
 await page.waitForTimeout(300);
 const поздние=await page.evaluate(()=>window.__dict.length);
 console.log(JSON.stringify({...r,всегоОшибок:поздние},null,1));
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

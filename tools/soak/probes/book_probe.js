// Книги: через сколько начинается звук после открытия и что его задерживает (синтез eSpeak: длина куска, время).
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{window.__plays=[];const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){try{window.__plays.push({t:performance.now(),src:String(this.currentSrc||this.src||""),el:this});}catch(_){}return pl.apply(this,arguments);};});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1500);
 const N=+(process.argv[3]||80);
 const r=await page.evaluate(async(N)=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};window.meetCaravan=()=>false;
  settings.effects=1;settings.music=1;settings.scape=1;safeFn(()=>Speech.gvLoad());ESpeak.load();const t00=performance.now();while(!ESpeak.ready()&&performance.now()-t00<20000)await new Promise(q=>setTimeout(q,100));
  settings.ttsEngine="gemini";{const t1=performance.now();while(!(typeof GVOICE_ON!=="undefined"&&GVOICE_ON)&&performance.now()-t1<40000)await new Promise(q=>setTimeout(q,200));}
  await new Promise(q=>setTimeout(q,1500));window.__адаптер=safeFn(()=>Speech._adapter().name,"?")+" gv="+(typeof GVOICE_ON!=="undefined"&&GVOICE_ON)+" engine="+settings.ttsEngine+" gvVoice="+settings.gvVoice;
  const w0=ESpeak.wav;window.__wav=[];ESpeak.wav=function(t){const a=performance.now();const x=w0.apply(this,arguments);window.__wav.push({t:a,n:String(t).length,ms:Math.round(performance.now()-a),txt:String(t).slice(0,80)});return x;};
  const L=knowLayout();const out=[];let seed=7;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const sleep=ms=>new Promise(q=>setTimeout(q,ms));
  for(let k=0;k<N;k++){while(activeLayer())closeTopUI();safeFn(()=>Speech.stop());await sleep(400);
   const n=Math.floor(rnd()*L.total);const t0=performance.now();window.__wav=[];
   if(!openReading(n,true)){out.push({n,нет:true});continue;}
   let first=null,src="";while(performance.now()-t0<9000){const x=window.__plays.find(p=>p.t>=t0&&/gvoice|blob:|\.wav/.test(p.src)&&!p.el.paused&&p.el.currentTime>0);if(x){first=Math.round(performance.now()-t0);src=x.src.slice(0,60);break;}await sleep(10);}
   const до=window.__wav.filter(w=>first==null||w.t-t0<=first);
   const e=safeFn(()=>knowEntry(n),null);
   out.push({n,мс:first,src:src.replace(/^blob:.*$/,"blob"),синтезов:до.length,синтМс:до.reduce((a,w)=>a+w.ms,0),максКусок:до.reduce((a,w)=>Math.max(a,w.n),0),первый:до[0]?до[0].txt:"",заглавие:e&&String(e.title||e.t||"").slice(0,40)});
   safeFn(()=>Speech.stop());}
  return {out,адаптер:window.__адаптер};},N);
 console.log('адаптер',r.адаптер);const R=r.out;const ok=R.filter(x=>x.мс!=null).map(x=>x.мс).sort((a,b)=>a-b);const q=p=>ok[Math.min(ok.length-1,Math.floor(p*ok.length))];
 console.log(JSON.stringify({n:R.length,нет:R.filter(x=>x.мс==null).length,мед:q(0.5),п90:q(0.9),п95:q(0.95),макс:ok[ok.length-1]}));
 for(const x of R.filter(x=>x.мс==null||x.мс>1200))console.log(JSON.stringify(x));
 console.log('ошибок страницы',errors.length,errors.slice(0,2));
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

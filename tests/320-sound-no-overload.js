/* ════════════════════════════════════════════════════════════════════════
   НАБОР 320: ЗВУК БЕЗ ПЕРЕГРУЗА; ГЕРОЙ И ЗВЕРИ ВРОВЕНЬ С МИРОМ (15.5)

   Жалоба игрока: примерно через час игры звук очень сильно перегружается;
   шаги и звуки героя, звуки питомцев и маунтов тише игры. Утечки нет —
   перегруз от тесноты: к часу игры разом звучат двадцать с лишним записей,
   и сумма выходила за предел. Теперь на выходе движка — ограничитель, в
   тесноте мир и фон подаются тише (дальний фон — не подаётся), герой, звери,
   окна, маяки и голоса — почти без убавки; шаги героя громче на сорок долей,
   его удары и чары — на четверть; звери громче и ярче.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=1;settings.music=0;settings.fxVol=0.7;settings.masterVol=1;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__тесн=null;const т0=Гул155.теснота.bind(Гул155);Гул155.теснота=function(){return window.__тесн||т0();};
  window.__vol=el=>el&&typeof el.volume==="number"?+el.volume.toFixed(4):null;
  window.__канал=()=>{let b=null;for(const к of ЗвукСреда.каналы)if(к.занят&&(!b||к.n>b.n))b=к;return b;};
  window.__стоп=()=>{safeFn(()=>Bank.stopAll());safeFn(()=>ЗвукСреда.стопВсе());};});

 /* ── 1. ограничитель на выходе движка ── */
 const л=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));AE.ensure();Гул155.мерить();
  for(let i=0;i<30&&!Гул155.снять;i++)await sl(100);
  /* та же цепь — на пробном движке без звука: тон втрое громче предела и тихий тон */
  const пик=async(амп)=>{const sr=22050,ctx=new OfflineAudioContext(1,Math.round(sr*0.4),sr);const o=ctx.createOscillator();o.frequency.value=220;
   const g=ctx.createGain();g.gain.value=амп;const {c,g:после}=Гул155.цепь(ctx);o.connect(g);g.connect(c);после.connect(ctx.destination);o.start();
   const buf=await ctx.startRendering();const d=buf.getChannelData(0);let p=0;for(let i=Math.floor(d.length/2);i<d.length;i++)p=Math.max(p,Math.abs(d[i]));return +p.toFixed(4);};
  return {порог:Гул155.лим&&Гул155.лим.threshold.value,сжатие:Гул155.лим&&Гул155.лим.ratio.value,снять:+Гул155.снять.toFixed(3),
   вЦепи:Гул155.после?+Гул155.после.gain.value.toFixed(3):null,тихо:await пик(0.09),громко:await пик(2.7)};});
 check('1. на выходе звукового движка ограничитель: втрое громче предела — всё равно ниже предела, тихое звучит как прежде',
  л.порог===-4&&л.сжатие===20&&л.снять>0&&л.вЦепи===л.снять&&л.громко<0.8&&Math.abs(л.тихо-0.09)<0.006,л);

 /* ── 2–4. теснота: мир тише, фон не подаётся, герой и звери — почти без убавки ── */
 const т=await page.evaluate(()=>{__стоп();const o={};
  window.__тесн={L:0,n:0};o.мирТихо=__vol(Bank.play("oc_rock_hit",{gain:0.6,maxSec:1}));o.геройТихо=__vol(Bank.play("battle_sword",{gain:0.6,maxSec:1}));
  o.фонТихо=__vol(Bank.play("wolf_howl",{gain:0.6,maxSec:1,flat:true,kind:"ambient"}));o.событие=Гул155.класс("throng_hail_m","event");
  o.событиеТихо=__vol(Bank.play("throng_hail_m",{gain:0.6,maxSec:1,kind:"event",prio:"high",flat:true}));__стоп();
  window.__тесн={L:6,n:12};o.мирТесно=__vol(Bank.play("oc_rock_hit",{gain:0.6,maxSec:1}));o.геройТесно=__vol(Bank.play("battle_sword",{gain:0.6,maxSec:1}));
  o.фонТесно=__vol(Bank.play("wolf_howl",{gain:0.6,maxSec:1,flat:true,kind:"ambient"}));o.щелчок=Гул155.класс("menu_select","ui");
  o.событиеТесно=__vol(Bank.play("throng_hail_m",{gain:0.6,maxSec:1,kind:"event",prio:"high",flat:true}));__стоп();window.__тесн=null;return o;});
 check('2. в тесноте новый звук мира подаётся тише (не больше чем вдвое), а в тишине — как прежде',
  т.мирТесно<т.мирТихо*0.75&&т.мирТесно>=т.мирТихо*0.49&&Math.abs(т.мирТихо-0.6*0.7)<0.01,т);
 check('3. удары и чары героя — на четверть громче прежнего и в тесноте убавляются не больше чем на пятую часть',
  Math.abs(т.геройТихо-Math.min(0.95,0.6*0.7*1.25))<0.01&&т.геройТесно>=т.геройТихо*0.79,т);
 check('4. фоновый звук (канал фона) в тесноте подаётся сильно тише — до трети, но не молчит (уступает предел голосов); события (награда, задание) и окна — свой род, почти без убавки',
  т.фонТихо>0&&т.фонТесно>0&&т.фонТесно<=т.фонТихо*0.36&&т.щелчок==="ui"&&т.событие==="событие"&&т.событиеТесно>=т.событиеТихо*0.79,т);

 /* ── 5. шаги героя громче на сорок долей ── */
 const ш=await page.evaluate(()=>{__стоп();window.__тесн={L:0,n:0};const f=(SOUND_BANK.tread_grass.f.find(x=>STEP_PEAK[x]<-3)||SOUND_BANK.tread_grass.f[0]);
  const м0=Гул155.множ;let k=null;Гул155.множ=function(кл){const v=м0.call(this,кл);if(k===null)k={кл,v};return v;};
  try{playLeveled("tread_grass",{gain:0.55,file:f,maxSec:1});}finally{Гул155.множ=м0;}const к=__канал();
  const o={род:k&&k.кл,множ:k&&+k.v.toFixed(2),канал:к?+к.g.gain.value.toFixed(3):null};__стоп();window.__тесн=null;return o;});
 check('5. шаги героя — громче прежнего на сорок долей из ста (род «шаг»)',ш.род==="шаг"&&ш.множ===1.4,ш);

 /* ── 6. звери громче и ярче ── */
 const з=await page.evaluate(()=>{__стоп();window.__тесн={L:0,n:0};const o={};
  const ok=ZvSnd.at("zv/zv_neigh_01.flac",0.5,0.2,{gain:0.8,maxSec:1});const к=__канал();
  o.ok=ok;o.усиление=к?+к.g.gain.value.toFixed(3):null;o.ожидали=+Math.min(3,Bank.vol("fx")*0.8*1.35*ZvSnd.k("zv/zv_neigh_01.flac")).toFixed(3);
  o.окраска=к?{f:Math.round(к.eq.frequency.value),g:+к.eq.gain.value.toFixed(1)}:null;
  window.__тесн={L:6,n:12};ZvSnd.at("zv/zv_neigh_01.flac",0.5,0.2,{gain:0.8,maxSec:1});const к2=__канал();o.тесно=к2?+к2.g.gain.value.toFixed(3):null;
  __стоп();window.__тесн=null;return o;});
 check('6. звуки зверей на треть громче прежнего и ярче (поднята верхняя середина), в тесноте убавляются не больше чем на пятую часть',
  з.ok&&Math.abs(з.усиление-з.ожидали)<0.01&&з.окраска&&з.окраска.f===3400&&з.окраска.g===5.5&&з.тесно>=з.усиление*0.79,з);

 /* ── 7. фон места приседает в тесноте и возвращается в тишине ── */
 const ф=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={};
  const el=Bank.loop("проба155","amb_wind",{kind:"ambient",gain:1});await sl(400);const v0=Bank.vol("ambient")*(Bank.loops.get("проба155")||{gain:1}).gain;
  window.__тесн={L:6,n:10};await sl(1600);o.тесно=+Гул155.фонК.toFixed(2);const c=Bank.loops.get("проба155");o.петля=c?+(c.el.volume/v0).toFixed(2):null;
  o.каналФон=+Bank.vol("ambient").toFixed(3);
  window.__тесн={L:0,n:0};await sl(8500);o.тихо=+Гул155.фонК.toFixed(2);const c2=Bank.loops.get("проба155");o.петляТихо=c2?+(c2.el.volume/v0).toFixed(2):null;
  Bank.stop("проба155");window.__тесн=null;o.каналФонТихо=+Bank.vol("ambient").toFixed(3);return o;});
 check('7. фон места плавно приседает, пока тесно, и возвращается, когда стихнет; громкость канала «фон» при этом не меняется',
  ф.тесно<=0.6&&ф.петля!==null&&Math.abs(ф.петля-ф.тесно)<0.03&&ф.тихо>=0.97&&ф.петляТихо>=0.97&&ф.каналФон===ф.каналФонТихо,ф);

 /* ── 8. маяк и голос — род, который почти не убавляется ── */
 const м=await page.evaluate(()=>{const o={};const м0=Гул155.множ;const рода=[];Гул155.множ=function(кл){рода.push(кл);return м0.call(this,кл);};
  try{Bank.panned(SOUND_BANK.magic_shimmer.f[0],{pan:0.3,gain:0.5,maxSec:1});}finally{Гул155.множ=м0;}
  window.__тесн={L:6,n:12};o.маяк=+Гул155.множ("маяк").toFixed(2);o.голос=+Гул155.множ("голос").toFixed(2);o.мир=+Гул155.множ("мир").toFixed(2);o.фон=+Гул155.множ("фон").toFixed(2);
  window.__тесн=null;o.рода=рода;__стоп();return o;});
 check('8. маяки и голоса в тесноте убавляются не больше чем на пятую часть; мир — вдвое, фон — сильнее',
  м.рода.includes("маяк")&&м.маяк>=0.8&&м.голос>=0.8&&м.мир===0.5&&м.фон<=0.35,м);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

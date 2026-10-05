/* ══════════════════════════════════════════════════════════════════
   254 — ОДИН ТЕМП СИНТЕЗАТОРА И ПОКУПКА СЧЁТОМ (9.5.2, просьба игрока)
   «Синтезатор где-то говорит быстрее, где-то медленнее» и «зелья маны и
   противоядия покупаются только по одной». Проверяется:
   1. Любой синтезатор получает один настоящий темп по числу ползунка
      «Скорость синтезатора» — тот же, что у записей Gemini: голос браузера
      (Web Speech), eSpeak (слов в минуту = 175 × темп), мосты Android и
      Windows пересчитывают число так же.
   2. Обоз: зелья и товары — «Купить 1 / 5 / 10 / на всё золото», покупка
      пятёрки зелий маны кладёт пять зелий; продажа — 1 / 5 / 10 / всё.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 /* ── 1 ── */
 const п1=await p.evaluate(()=>{
  const out={};
  for(const r of [1,3,5,7]){
   settings.synthRate=r;
   let rate=null;const был=window.SpeechSynthesisUtterance;
   window.SpeechSynthesisUtterance=function(t){this.text=t;};
   const sp=window.speechSynthesis&&speechSynthesis.speak;
   /* пуск сразу, без паузы после недавнего обрыва фоновой речи */
   Speech._cancelAt=0;
   try{if(window.speechSynthesis)speechSynthesis.speak=u=>{rate=u.rate;};
    Speech._webAdapter().speak("проба",{rate:Speech.synthRate(),volume:1});}catch(_){}
   finally{window.SpeechSynthesisUtterance=был;if(sp)speechSynthesis.speak=sp;}
   out[r]={web:rate,gemini:Speech.gvTempo(r),синтез:Speech.synthTempo(r)};}
  return out;});
 const src=fs.readFileSync(path.join(R,'index.html'),'utf8');
 const java=fs.readFileSync(path.join(R,'android/app/src/main/java/io/github/granimirov/MainActivity.java'),'utf8');
 const sapi=fs.readFileSync(path.join(R,'desktop/sapi.js'),'utf8');
 const ровно=Object.values(п1).every(x=>x.web!==null&&Math.abs(x.web-x.gemini)<1e-9&&Math.abs(x.синтез-x.gemini)<1e-9);
 check('1. голос браузера: темп синтезатора = темп записей Gemini при том же числе (1 — обычный, 5 — 2,8)',
  ровно&&Math.abs(п1[1].web-1)<1e-9&&Math.abs(п1[5].web-2.8)<1e-9,п1);
 check('2. eSpeak, Android и Windows пересчитывают число ползунка той же шкалой',
  /w\.set_rate\(Math\.max\(80,Math\.min\(450,Math\.round\(175\*Speech\.synthTempo\(r\)\)\)\)\)/.test(src)
  &&/float tempo = r <= 1f \? r : 1f \+ \(r - 1f\) \* 0\.45f;/.test(java)&&/setSpeechRate\(Math\.max\(0\.1f, Math\.min\(3\.5f, tempo\)\)\)/.test(java)
  &&/Math\.Log\(GraniRh\.Tempo\(tempo\)\)/.test(sapi));

 /* ── 2 ── */
 const п2=await p.evaluate(()=>{
  const rts=caravanRoutes(G.x,G.y,G.day);if(!rts.length)return {нет:"маршрутов"};
  let car=null;
  for(const rt of rts.slice(0,6)){for(let h=0;h<24&&!car;h++){const st=caravanState(rt,G.day,h);if(st&&st.moving){G.hour=h;G.x=st.x;G.y=st.y;car=caravanHere();}}if(car)break;}
  if(!car)return {нет:"обоза"};
  G.gold=1000;meetCaravan(car);
  const кнопки=()=>[...document.querySelectorAll("#modal-caravan [data-cmd]")].map(e=>e.dataset.cmd);
  const к=кнопки();
  const зелья=к.filter(c=>/^carpotn:mana~/.test(c)).map(c=>+c.split("~")[1]);
  const товары=к.filter(c=>/^carbuyn:/.test(c));
  const было=potionsOf().filter(x=>x.id==="mana").length,золото=G.gold;
  CMD.carpotn("mana~5");
  const стало=potionsOf().filter(x=>x.id==="mana").length;
  /* продажа: дать игроку товар, который обоз скупает */
  const хочет=(car.goods&&car.goods.wants||[])[0];let продажа=[];
  if(хочет){G.inv[хочет]=12;meetCaravan(car);продажа=кнопки().filter(c=>c.startsWith("carselln:"+хочет+"~")||c==="carsellall:"+хочет);
   CMD.carselln(хочет+"~5");}
  return {зелья,товаров:товары.length,было,стало,потрачено:золото-G.gold,продажа,осталось:хочет?G.inv[хочет]:null};});
 check('3. обоз: зелья маны — «Купить 1 / 5 / 10 / на всё», пятёрка кладёт пять зелий',
  п2&&!п2.нет&&[1,5,10].every(k=>п2.зелья.includes(k))&&п2.зелья.some(k=>k>10)&&п2.стало-п2.было===5&&п2.товаров>=3,п2);
 check('4. обоз: продажа — 1 / 5 / 10 / всё; «5» продаёт ровно пять',
  п2&&!п2.нет&&(п2.продажа.length===0||(п2.продажа.length===4&&п2.осталось===7)),п2);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

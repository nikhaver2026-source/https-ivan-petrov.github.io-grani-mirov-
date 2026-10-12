/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 307: КАЖДЫЙ МАУНТ ЗВУЧИТ ПО-СВОЕМУ И ИМЕЕТ СВОЮ ОСОБЕННОСТЬ (15.0)

   Просьбы игрока: «маунт, на котором едешь, — звуки перемещения должны быть
   соответствующие звукам этого маунта»; «расширь навыки и способности, чтобы
   они у каждого были абсолютно разные»; «и маунтов тоже».
   1. У каждого из десяти скакунов тайных палат свой ход: шаг, бег и примета
      (у приливного коня — и ход по воде); наборы шагов не совпадают, все
      звуки на месте и выровнены по громкости.
   2. Верхом на скакуне тайных палат слышен его шаг, а не общий конский:
      каменный жук — ползком по щебню, стеклянная рысь — по стеклу, кобылица —
      копытом; через несколько шагов — его примета; на бегу — его бег;
      приливный конь в воде — плеском.
   3. У каждого из тридцати двух ездовых родов своя особенность в седле:
      имя не повторяется, у каждой есть дар в пути.
   4. Особенность действует: конь везёт больше и укорачивает дорогу сильнее,
      чем без неё; вепрь бьёт с разбега сильнее всех; змей тише; голодный
      зверь отдаёт её вполовину.
   5. Окно маунта называет особенность первой, посадка — после слов о посадке.
   6. Глава руководства о питомцах и маунтах говорит о ходе скакунов и об
      особенности в седле.
   7. Ошибок страницы нет.
   8. У каждого из сорока шести родов свои звуки: голос, рык, удар, шаг, езда
      и бег ни у кого не повторяются («делай каждому уникальные звуки»).
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  window.ФАЙЛЫ=keys=>[].concat(...keys.map(k=>String(k).indexOf("/")>=0?[k]:((SOUND_BANK[k]&&SOUND_BANK[k].f)||[])));
  window.СКАЗАНО=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0.apply(this,arguments);};
  G.place=null;G.ship=null;G.flight=null;G.inCombat=false;
  window.ВЕРХОМ_ЛЕГ=id=>{Zver.st().mount=null;if(!Array.isArray(G.mounts))G.mounts=[];if(G.mounts.indexOf(id)<0)G.mounts.push(id);G.mount=id;};
  window.ЗВЕРЬ_РОДА=(fam,lvl)=>{const b=ZV_BREEDS.find(b=>b.fam===fam&&b.var==="wild")||ZV_BREEDS.find(b=>b.fam===fam);const a=Zver.make(b.id,{тихо:true,lvl:lvl||8,верн:95});a.сыт=90;return a;};});

 /* ── 1. Свой ход у каждого скакуна тайных палат ── */
 const л=await p.evaluate(()=>{const r={нет:[],неполно:[],звукНет:[],безГромкости:[],повтор:[]};const наборы={};
  for(const m of MOUNTS){const P=ZV_LEGRIDE150[m.id];if(!P){r.нет.push(m.id);continue;}
   if(!(P.е&&P.е.length&&P.бег&&P.бег.length&&P.а&&P.а.length))r.неполно.push(m.id);
   const н=[...P.е].sort().join("+");(наборы[н]=наборы[н]||[]).push(m.id);
   for(const k of [].concat(P.е,P.бег,P.а,P.вода||[])){if(!Bank.has(k))r.звукНет.push(m.id+": "+k);
    for(const f of ФАЙЛЫ([k]))if(!(Number(ZV_LEVEL[f])>0))r.безГромкости.push(f);}}
  r.повтор=Object.values(наборы).filter(x=>x.length>1);r.безГромкости=[...new Set(r.безГромкости)];r.скакунов=MOUNTS.length;r.вода=!!ZV_LEGRIDE150.tidehorse.вода;return r;});
 check('1. у каждого из скакунов тайных палат свой шаг, бег и примета; шаги не совпадают, звуки на месте и выровнены',
  л.скакунов>=10&&!л.нет.length&&!л.неполно.length&&!л.звукНет.length&&!л.безГромкости.length&&!л.повтор.length&&л.вода,л);

 /* ── 2. Верхом слышен свой шаг, примета, бег, вода ── */
 const х=await p.evaluate(async()=>{const r={};const шаги=(id,n,о)=>{ВЕРХОМ_ЛЕГ(id);ZvWalk.legN=0;const все=[];
   for(let i=0;i<n;i++){ZvSnd.журнал.length=0;ZvSnd.live=0;ZvWalk.ride(ZvWalk.mount());все.push(ZvSnd.журнал.map(x=>x[0]));}return все;};
  const in_=(fs,keys)=>{const F=ФАЙЛЫ(keys);return fs.length>0&&fs.every(f=>F.indexOf(f)>=0);};
  const P=ZV_LEGRIDE150;
  for(const id of ["stonebeetle","glasslynx","ashmare","emberhound"]){const s=шаги(id,4);r[id]={первый:s[0],свой:in_(s[0].slice(0,1),P[id].е)};}
  /* примета: через ак шагов, позже шага и тише */
  ВЕРХОМ_ЛЕГ("glasslynx");ZvWalk.legN=P.glasslynx.ак-1;ZvSnd.журнал.length=0;ZvSnd.live=0;ZvWalk.ride(ZvWalk.mount());await спим(400);
  const жл=ZvSnd.журнал.map(x=>x[0]);r.примета=жл.slice(1).some(f=>ФАЙЛЫ(P.glasslynx.а).indexOf(f)>=0);
  /* бег */
  const rs=runState.active;runState.active=true;ВЕРХОМ_ЛЕГ("stonebeetle");ZvSnd.журнал.length=0;ZvSnd.live=0;ZvWalk.ride(ZvWalk.mount());runState.active=rs;
  r.бег=in_(ZvSnd.журнал.map(x=>x[0]).slice(0,1),P.stonebeetle.бег);
  /* вода */
  const cc=cellContent;window.cellContent=function(x,y){const c=cc.apply(this,arguments);return Object.assign({},c,{terrain:["sea"].concat((c.terrain||[]).slice(1))});};
  try{ВЕРХОМ_ЛЕГ("tidehorse");ZvSnd.журнал.length=0;ZvSnd.live=0;ZvWalk.ride(ZvWalk.mount());r.вода=in_(ZvSnd.журнал.map(x=>x[0]).slice(0,1),P.tidehorse.вода);}finally{window.cellContent=cc;}
  /* шаг героя верхом — шаг скакуна, а не сапоги */
  ВЕРХОМ_ЛЕГ("stonebeetle");ZvSnd.журнал.length=0;ZvSnd.live=0;stepSound();r.шагГероя=ZvSnd.журнал.map(x=>x[0]);r.шагГерояСвой=in_(r.шагГероя.slice(0,1),P.stonebeetle.е);
  G.mount=null;return r;});
 const разные=new Set(["stonebeetle","glasslynx","ashmare","emberhound"].map(k=>(х[k].первый||[])[0]));
 check('2. верхом — свой шаг скакуна (жук, рысь, кобылица, пёс звучат по-разному), примета, бег и плеск в воде; шаг героя — шаг скакуна',
  ["stonebeetle","glasslynx","ashmare","emberhound"].every(k=>х[k].свой)&&разные.size===4&&х.примета&&х.бег&&х.вода&&х.шагГерояСвой,х);

 /* ── 3. Своя особенность в седле у каждого ездового рода ── */
 const о=await p.evaluate(()=>{const r={нет:[],безДара:[],повтор:[],лишние:[]};const имена={};const ездовые=ZV_FAMILIES.filter(f=>f.ездовой).map(f=>f.id);
  for(const id of ездовые){const R=ZV_RIDE150[id];if(!R){r.нет.push(id);continue;}if(!R.д||!Object.keys(R.д).length)r.безДара.push(id);
   if(имена[R.n])r.повтор.push(R.n);имена[R.n]=1;}
  for(const id of Object.keys(ZV_RIDE150))if(ездовые.indexOf(id)<0)r.лишние.push(id);r.ездовых=ездовые.length;return r;});
 check('3. у каждого из ездовых родов своя особенность в седле: имя не повторяется, у каждой есть дар',
  о.ездовых>=32&&!о.нет.length&&!о.безДара.length&&!о.повтор.length&&!о.лишние.length,о);

 /* ── 4. Особенность действует ── */
 const д=await p.evaluate(()=>{const r={};const без=(a,k)=>{const R=ZV_RIDE150[Zver.fam(a).id];const s=R.д;R.д={};try{return Zver.gift(a,k);}finally{R.д=s;}};
  const конь=ЗВЕРЬ_РОДА("horse");r.коньВьюк=[без(конь,"добыча"),Zver.gift(конь,"добыча")];r.коньШаг=[без(конь,"шаг"),Zver.gift(конь,"шаг")];
  const вепрь=ЗВЕРЬ_РОДА("boar");const лось=ЗВЕРЬ_РОДА("elk");r.урон=[Zver.gift(вепрь,"урон"),Zver.gift(лось,"урон")];
  const змей=ЗВЕРЬ_РОДА("serpent");r.змейТише=[без(змей,"скрытность"),Zver.gift(змей,"скрытность")];
  const голем=ЗВЕРЬ_РОДА("golem");r.голем=[без(голем,"добыча"),Zver.gift(голем,"добыча")];
  конь.сыт=10;r.голодныйШаг=Zver.gift(конь,"шаг");r.голодныйБез=без(конь,"шаг");конь.сыт=90;
  /* верхом: mountGift даёт дар своего маунта */
  Zver.st().mount=конь.uid;G.mount=null;r.верхомВьюк=safeFn(()=>mountGift("добыча"),null);Zver.st().mount=null;
  return r;});
 check('4. особенность действует: конь везёт больше и укорачивает дорогу, вепрь бьёт с разбега сильнее лося, змей тише, голем несёт втрое; голодный отдаёт вполовину',
  (д.коньВьюк[1]||0)>(д.коньВьюк[0]||0)&&д.коньШаг[1]<(д.коньШаг[0]==null?1:д.коньШаг[0])&&(д.урон[0]||1)>(д.урон[1]||1)&&
  (д.змейТише[1]||0)>(д.змейТише[0]||0)&&(д.голем[1]||0)-(д.голем[0]||0)===3&&
  д.голодныйШаг>д.коньШаг[1]&&д.голодныйШаг<(д.голодныйБез==null?1:д.голодныйБез)&&д.верхомВьюк===д.коньВьюк[1],д);

 /* ── 5. Окно и посадка называют особенность ── */
 const п=await p.evaluate(async()=>{const r={};const a=ЗВЕРЬ_РОДА("horse");const k="zv:"+a.uid;
  r.слова=Zver.giftWords(a);Stable.mntCmd("view:"+k);await спим(150);
  r.окно=[...document.querySelectorAll("#modal-mounts [data-speak]")].map(e=>e.dataset.speak).find(t=>/В седле/.test(t))||"";
  while(activeLayer())closeTopUI();
  Zver.follow(a.uid);await спим(100);СКАЗАНО.length=0;Stable.mntCmd("ride:"+k);r.сел=Stable.riding()===k;await спим(1400);r.посадка=СКАЗАНО.find(t=>/в седле/.test(t))||"";
  r.сказано=СКАЗАНО.filter(t=>/Особенность в седле/.test(t));
  if(Stable.riding())Stable.dismountHere();while(activeLayer())closeTopUI();return r;});
 check('5. окно маунта называет особенность первой; при посадке она звучит после слов о посадке (одной фразой, после звука)',
  /^«Неутомимая рысь»/.test(п.слова[0]||"")&&/«Неутомимая рысь»/.test(п.окно)&&п.сел&&/Особенность в седле — «Неутомимая рысь»/.test(п.посадка||"")&&п.сказано.length===1,п);

 /* ── 6. Руководство ── */
 const г=await p.evaluate(()=>{const all=JSON.stringify(typeof GUIDE!=="undefined"?GUIDE:"")+[...document.querySelectorAll("#guide *")].map(e=>e.textContent).join(" ");
  return {ход:/стеклянная рысь — со звоном стекла/.test(all),особ:/ОСОБЕННОСТЬ В СЕДЛЕ/.test(all)&&/«Каменная спина»/.test(all)};});
 check('6. руководство говорит о ходе скакунов тайных палат и об особенности в седле',г.ход&&г.особ,г);

 /* ── 8. Свои звуки у каждого рода: ни голос, ни рык, ни удар, ни шаг, ни езда, ни бег не повторяются ── */
 const у=await p.evaluate(()=>{const r={повторы:{},нет:[],безГромкости:[]};const key=L=>Array.isArray(L)?[...L].map(String).sort().join("+"):String(L||"");
  for(const role of ["г","р","у","ш","е","бег"]){const m={};for(const f of ZV_FAMILIES){const P=ZV_SND[f.id]||{};const k=key(P[role]);if(!k)continue;(m[k]=m[k]||[]).push(f.id);
    for(const x of (Array.isArray(P[role])?P[role]:[P[role]])){if(!(String(x).indexOf("/")>=0||Bank.has(x)))r.нет.push(f.id+":"+role+":"+x);
     for(const ff of ФАЙЛЫ([x]))if(!(Number(ZV_LEVEL[ff])>0))r.безГромкости.push(ff);}}
   const d=Object.values(m).filter(v=>v.length>1);if(d.length)r.повторы[role]=d;}
  for(const f of ZV_FAMILIES){const z=(ZV_SND[f.id]||{}).з;if(z&&!Bank.has(z))r.нет.push(f.id+":з:"+z);}
  r.безГромкости=[...new Set(r.безГромкости)];return r;});
 check('8. у каждого из сорока шести родов свои звуки: голос, рык, удар, шаг, езда и бег ни у кого не повторяются, все на месте и выровнены',
  !Object.keys(у.повторы).length&&!у.нет.length&&!у.безГромкости.length,у);

 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 console.log(results.join('\n'));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fails}/${results.length} проверок пройдено`);
 await browser.close();process.exit(fails?1:0);
})();

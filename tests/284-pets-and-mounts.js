/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 284: 13.5 — ПИТОМЦЫ И МАУНТЫ

   Просьба игрока: «в меню действий пункт „Питомец“: снаряжать, проверять
   характеристики, кормить, ухаживать и выдавать задания — меню, чтобы не
   привязывать питомца к персонажу: пока героя нет в игре, питомец сам бегает,
   развивается и выполняет задания. То же с маунтами: характеристики,
   снаряжение, улучшение, выбор и „забраться“. И забраться на маунта, когда
   он рядом, — как на сундук или ресурс».

   1. В меню действий — «Питомцы» и «Маунты»; окна открываются.
   2. Окно питомца: характеристики, корм, уход, задания, снаряжение, развитие.
   3. Уход: погладить — верность растёт; повторно — не сразу.
   4. Задание идёт по часам мира, питомец уходит и возвращается сам с добычей;
      отчёт ждёт в окне «Питомцы».
   5. Задание доходит и пока игрока нет: часы при входе догоняют время.
   6. Раненый питомец может только отдыхать — и отдых лечит.
   7. Окно маунтов: ездовые звери и скакуны тайных палат, где каждый ждёт.
   8. Скакун, с которого сошли, стоит на месте; рядом он — объект: «Что вокруг»
      и «Действие здесь» сажают в седло; издали — нельзя, «Позвать» приводит.
   9. Выучка и снаряжение скакуна тайных палат усиливают его дар.
  10. Всё переживает сохранение; ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__said.push(String(t));return s0(t,o);};
  G.place=null;G.ship=null;G.x=OLD_WORLD>>1;G.y=OLD_WORLD>>1;
  const pet=ZV_BREEDS.find(b=>!ZV_FAMILY_BY_ID[b.fam].ездовой);const ride=ZV_BREEDS.find(b=>ZV_FAMILY_BY_ID[b.fam].ездовой&&ZV_FAMILY_BY_ID[b.fam].ход==="walk");
  window.__pet=Zver.make(pet.id,{тихо:true}).uid;window.__ride=Zver.make(ride.id,{тихо:true,верн:80}).uid;takeMount("ashmare");dismissMount();});
 const строки=id=>p.evaluate(id=>[...document.querySelectorAll(`#${id} [data-speak]`)].map(e=>e.dataset.speak),id);

 /* ── 1 ── */
 const меню=await p.evaluate(()=>{const ids=AM_ITEMS.map(x=>x[0]);const r={pets:ids.includes("pets"),mounts:ids.includes("mounts"),av:amAvailable("pets")&&amAvailable("mounts")};
  CMD.pets();r.petsOpen=!document.getElementById("modal-pets").hidden;while(activeLayer())closeTopUI();CMD.mounts();r.mountsOpen=!document.getElementById("modal-mounts").hidden;while(activeLayer())closeTopUI();return r;});
 check('1. в меню действий — «Питомцы» и «Маунты», окна открываются',меню.pets&&меню.mounts&&меню.av&&меню.petsOpen&&меню.mountsOpen,меню);

 /* ── 2 ── */
 await p.evaluate(()=>CMD.pet("view:"+window.__pet));const вид=await строки("petsBody");
 check('2. окно питомца: характеристики, корм, уход, задания, снаряжение, развитие',
  вид.some(l=>/^Характеристики: сила/.test(l))&&["Покормить","Уход: ","Задания: ","Снаряжение","Развитие"].every(k=>вид.some(l=>l.startsWith(k))),вид);

 /* ── 3 ── */
 const уход=await p.evaluate(()=>{const a=Zver.byUid(window.__pet);const v0=a.верн;const t1=Stable.care(a.uid,"talk");const v1=a.верн;const t2=Stable.care(a.uid,"talk");return {v0,v1,t1,t2};});
 check('3. уход: погладить — верность растёт; повторно — не сразу',уход.v1>уход.v0&&/снова — через/.test(уход.t2),уход);

 /* ── 4 ── */
 const дело=await p.evaluate(()=>{const a=Zver.byUid(window.__pet);while(activeLayer())closeTopUI();const inv0=JSON.stringify(G.inv);
  const t=Stable.taskStart(a.uid,"forage");const ушёл=!!a.задание&&Zver.st().pets.indexOf(a.uid)<0;const где=Stable.petWhere(a);
  Clock.advance(7);const out=Stable.tick(true);CMD.pets();const окно=[...document.querySelectorAll('#petsBody [data-speak]')].map(e=>e.dataset.speak);
  return {t,ушёл,где,вернулся:!a.задание,out,отчёт:окно.some(l=>/^Вернулись с заданий: .*возвращается с задания «искать припасы»/.test(l)),добыча:JSON.stringify(G.inv)!==inv0};});
 check('4. задание по часам мира: питомец уходит, возвращается сам с добычей, отчёт — в окне',дело.ушёл&&/на задании «искать припасы»/.test(дело.где)&&дело.вернулся&&дело.отчёт&&дело.добыча,дело);
 await p.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 5 ── */
 const без=await p.evaluate(()=>{const a=Zver.byUid(window.__pet);a.сыт=90;a.ранен=0;Zver.cure(a,999);Stable.taskStart(a.uid,"train");
  settings.clock="real";G.realAt=Date.now()-6*3600000;Clock.resume();const done=!a.задание;return {done,отчётов:Stable.st().reports.length};});
 check('5. задание доходит и пока игрока нет: часы при входе догоняют время',без.done&&без.отчётов>=1,без);

 /* ── 6 ── */
 const рана=await p.evaluate(()=>{const a=Zver.byUid(window.__pet);a.ранен=1;a.hp=0;const нельзя=Stable.taskStart(a.uid,"hunt");const можно=Stable.taskStart(a.uid,"rest");
  Clock.advance(7);Stable.tick(true);return {нельзя,можно,здоров:!a.ранен&&Zver.hp(a)>=Zver.hpMax(a)*0.9,hp:Zver.hp(a),max:Zver.hpMax(a)};});
 check('6. раненый питомец может только отдыхать — и отдых лечит',/ранен/.test(рана.нельзя)&&/уходит/.test(рана.можно)&&рана.здоров,рана);

 /* ── 7 ── */
 await p.evaluate(()=>CMD.mounts());const маунты=await строки("mountsBody");
 check('7. окно маунтов: ездовые звери и скакуны тайных палат, и где каждый ждёт',
  маунты.some(l=>/ездовой зверь/.test(l))&&маунты.some(l=>/^Пепельная кобылица — скакун тайных палат.*ждёт здесь/.test(l)),маунты);
 await p.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 8 ── */
 const объект=await p.evaluate(()=>{const r={};const k="leg:ashmare";r.рядом=objectsHere(true).filter(o=>o.вид==="mount").map(o=>o.n);
  const o=objectsHere(true).find(o=>o.вид==="mount");r.действия=actionsFor(o).map(a=>a.n);r.сел=useHere()&&Stable.riding()===k;
  Stable.dismountHere();G.x+=3;r.далеко=objectsHere(true).filter(o=>o.вид==="mount").length===0;r.издали=Stable.mountUp(k);
  r.зов=Stable.call(k);r.снова=objectsHere(true).some(o=>o.вид==="mount");
  openObjects&&safeFn(()=>openObjects());const i=(objList||[]).findIndex(o=>o.вид==="mount");if(i>=0){doObjAction(i,"mnt_ride");}r.черезОкно=Stable.riding()===k;
  while(activeLayer())closeTopUI();return r;});
 check('8. скакун стоит, где сошли; рядом — объект: «Действие здесь» и «Что вокруг» сажают в седло; издали — нельзя, «Позвать» приводит',
  объект.рядом.length===1&&объект.действия.includes("Сесть верхом")&&объект.сел&&объект.далеко&&/не рядом/.test(объект.издали)&&объект.снова&&объект.черезОкно,объект);

 /* ── 9 ── */
 const выучка=await p.evaluate(()=>{G.gold=2000;const g0=mountGift("шаг");Stable.train("ashmare");Stable.train("ashmare");const g1=mountGift("шаг");
  Zver.st().gear["saddle:leather"]=1;const mat=ZV_MATERIALS[0].id;Zver.st().gear["saddle:"+mat]=1;const t=Stable.legEquip("ashmare","saddle",mat);const g2=mountGift("шаг");
  return {g0,g1,g2,t,lv:Stable.legLv("ashmare")};});
 check('9. выучка и снаряжение скакуна тайных палат усиливают его дар',выучка.lv===2&&выучка.g1<выучка.g0&&выучка.g2<выучка.g1&&/надето/.test(выучка.t),выучка);

 /* ── 10 ── */
 const сохр=await p.evaluate(()=>{const before=JSON.stringify(Zver.st().stb)+JSON.stringify(Zver.st().list.map(a=>[a.uid,a.настр,a.верн]));saveGame(true);const raw=store.get(SAVE_KEY);G.zv={};applySave(raw,"набор 284");
  return {same:JSON.stringify(Zver.st().stb)+JSON.stringify(Zver.st().list.map(a=>[a.uid,a.настр,a.верн]))===before};});
 check('10. питомцы, задания, место и выучка скакунов переживают сохранение',сохр.same,сохр);
 check('11. ошибок страницы нет',errors.length===0,errors.slice(0,5));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

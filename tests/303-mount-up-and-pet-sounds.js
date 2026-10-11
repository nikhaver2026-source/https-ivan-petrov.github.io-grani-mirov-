/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 303: В СЕДЛО — ПО-НАСТОЯЩЕМУ, И ВСЁ СЛЫШНО (15.0)

   Жалобы игрока: «позвал скакуна, нажал „Забраться“ — не забирается, шагнул —
   а он так и стоит справа»; «нет звука, что забрался или спешился»; «не слышно,
   как питомец ест, как вкладываются очки развития».
   1. Позвать скакуна и «Сесть верхом» в окне «Маунты» — вы в седле, скакун
      больше не стоит рядом объектом.
   2. Ездовой спутник, идущий рядом, — кнопка «сесть» сразу, и посадка удаётся.
   3. Скакун не подпускает (верность мала) — причина звучит последней, а не
      тонет под заново прочитанным окном; корм поднимает верность, и после него
      посадка удаётся.
   4. «Действие здесь»: скакун под ногами (только что позван) — садимся, даже
      если рядом есть другие вещи.
   5. Посадка слышна: рывок, скрип седла, голос скакуна; спешивание: седло,
      прыжок на землю. Слова о посадке — после звука, а не в тот же миг.
   6. Очко развития: у каждой ветви свой звук.
   7. Кормление: слышно, как зверь ест; итог — после звука, окно не
      перечитывается поверх.
   8. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await browser.newContext()).newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 const r=await p.evaluate(async()=>{
  try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
  /* речь — когда она на самом деле уходит в синтез (после всех отложений) */
  /* речь ловится на входе в очередь (Speech.enqueue) — уже после всех отложений */
  const речь=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){речь.push({t:String(t),at:Date.now(),ui:!!(o&&o.cat==="ui")});return e0.apply(this,arguments);};
  const fresh=()=>{речь.length=0;ZvSnd.журнал.length=0;};
  const ride=k=>[...document.querySelectorAll("#modal-mounts button")].find(b=>/Сесть|Забраться|Взлететь/.test(b.innerText||""));
  const br=ZV_BREEDS.find(b=>b.fam==="steed"&&b.var==="tide")||ZV_BREEDS.find(b=>ZV_FAMILY_BY_ID[b.fam].ездовой&&ZV_FAMILY_BY_ID[b.fam].ход==="walk");
  /* 1. позвать — сесть */
  const a=Zver.make(br.id,{тихо:true});const k="zv:"+a.uid;
  Stable.mntCmd("view:"+k);fresh();Stable.mntCmd("call:"+k);await wait(1400);
  const b1=ride(k);out.кнопка1=b1&&b1.innerText;fresh();const t0=Date.now();if(b1)b1.click();await wait(1500);
  out.сел1=Stable.riding()===k;out.рядомОбъект1=Stable.near(1).some(x=>x.M.k===k);
  out.звукПосадки=ZvSnd.журнал.map(x=>x[0]);
  const слова=речь.find(x=>/в седле/.test(x.t));out.словаПосадкиЧерез=слова?слова.at-t0:null;
  /* 5. спешиться */
  fresh();Stable.dismountHere();await wait(1200);out.звукСпешивания=ZvSnd.журнал.map(x=>x[0]);
  delete Stable.st().pos[k];
  /* 2. спутник рядом */
  Zver.follow(a.uid);out.спутник=Zver.st().pets.indexOf(a.uid)>=0;
  Stable.mntCmd("view:"+k);const b2=ride(k);out.кнопка2=b2&&b2.innerText;if(b2)b2.click();await wait(300);out.сел2=Stable.riding()===k;
  if(Stable.riding())Stable.dismountHere();delete Stable.st().pos[k];while(activeLayer())closeTopUI();await wait(900);
  /* 3. низкая верность */
  a.верн=8;a.сыт=10;Stable.call(k);await wait(1300);Stable.mntCmd("view:"+k);await wait(200);fresh();const b3=ride(k);if(b3)b3.click();await wait(700);
  out.сел3=Stable.riding()===k;const неUi=речь.filter(x=>!x.ui);out.последнее3=речь.length?речь[речь.length-1].t:"";out.причина3=неUi.some(x=>/не подпускает/.test(x.t));
  /* кормим любимым кормом — верность растёт, посадка удаётся */
  const f=ZV_FAMILY_BY_ID[a.fam];G.inv[ZV_FOOD[f.корм[0]]]=(Number(G.inv[ZV_FOOD[f.корм[0]]])||0)+3;
  const до=a.верн;Zver.feed(a.uid);out.вернПослеКорма=[до,a.верн];
  Stable.mntCmd("view:"+k);const b4=ride(k);if(b4)b4.click();await wait(300);out.сел3после=Stable.riding()===k;
  if(Stable.riding())Stable.dismountHere();while(activeLayer())closeTopUI();await wait(900);
  /* 4. «Действие здесь» — скакун под ногами, рядом другие вещи */
  delete Stable.st().pos[k];Stable.call(k);await wait(1300);
  const oh=window.oh0objs;window.oh0objs=()=>[{n:"сундук",вид:"chest",d:1}];
  let uh;try{uh=useHere();}finally{window.oh0objs=oh;}await wait(200);out.сел4=Stable.riding()===k;
  if(Stable.riding())Stable.dismountHere();while(activeLayer())closeTopUI();await wait(900);
  /* 6. очки развития по ветвям */
  const pet=Zver.make((ZV_BREEDS.find(b=>b.fam==="wolf")||br).id,{тихо:true,lvl:15});const первые={};
  for(const b of ZV_BRANCHES){fresh();Zver.grow(pet.uid,b.id);await wait(900);первые[b.id]=ZvSnd.журнал.slice(0,2).map(x=>x[0]).join("+");}
  out.ветви=первые;
  /* 7. кормление из окна питомцев */
  const pf=ZV_FAMILY_BY_ID[pet.fam];G.inv[ZV_FOOD[pf.корм[0]]]=(Number(G.inv[ZV_FOOD[pf.корм[0]]])||0)+3;pet.сыт=30;
  const isM=Stable.isMount(pet);fresh();const t7=Date.now();
  if(isM)Stable.mntCmd("feed:zv:"+pet.uid);else Stable.petCmd("feed:"+pet.uid);await wait(1500);
  out.звукЕды=ZvSnd.журнал.map(x=>x[0]);const ест=речь.find(x=>/ест /.test(x.t));out.словаЕдыЧерез=ест?ест.at-t7:null;
  out.окноПоверх=речь.filter(x=>x.ui&&x.at>=t7).length;
  while(activeLayer())closeTopUI();
  return out;});
 check('1. позвать и «Сесть верхом» — вы в седле, скакун не стоит рядом',r.сел1&&!r.рядомОбъект1&&!!r.кнопка1,{кнопка:r.кнопка1,сел:r.сел1,рядом:r.рядомОбъект1});
 check('2. ездовой спутник рядом — кнопка сесть сразу и посадка',r.спутник&&!!r.кнопка2&&r.сел2,{кнопка:r.кнопка2,сел:r.сел2});
 check('3. не подпускает — причина звучит последней; корм поднимает верность, и посадка удаётся',
  !r.сел3&&r.причина3&&/не подпускает/.test(r.последнее3)&&r.вернПослеКорма[1]>=15&&r.сел3после,{последнее:r.последнее3,верн:r.вернПослеКорма,после:r.сел3после});
 check('4. «Действие здесь»: скакун под ногами — посадка, хоть рядом и сундук',r.сел4,r.сел4);
 check('5. посадка и спешивание слышны; слова — после звука',
  r.звукПосадки.some(f=>/whoosh/.test(f))&&r.звукПосадки.some(f=>/leather/.test(f))&&r.звукСпешивания.some(f=>/leather_off|arte_leather/.test(f))&&r.звукСпешивания.some(f=>/lug_land/.test(f))&&r.словаПосадкиЧерез>=600,
  {посадка:r.звукПосадки,спешивание:r.звукСпешивания,слова:r.словаПосадкиЧерез});
 check('6. у каждой ветви развития свой звук',new Set(Object.values(r.ветви)).size===Object.keys(r.ветви).length&&Object.values(r.ветви).every(Boolean),r.ветви);
 check('7. кормление слышно: зверь ест, итог после звука, окно не перечитывается',
  r.звукЕды.some(f=>/eat|munch|chew|crunch|fire|claw|goo|chitter/.test(f))&&r.словаЕдыЧерез>=600&&r.окноПоверх===0,{звук:r.звукЕды,слова:r.словаЕдыЧерез,окно:r.окноПоверх});
 check('8. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

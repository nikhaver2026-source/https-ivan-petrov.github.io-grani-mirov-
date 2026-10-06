/* 10.0: Сплетение — восемь вшитых земель Срединного Пояса по мотивам восьми
   книжных циклов (Ливадный ×3, Панкеева, Пашнина, Маханенко ×3), переработанных
   для Грани. Набор проверяет, что всё это живое, а не список имён:
   — шестнадцать держав стоят на своей земле, у каждой своя область, бог,
     дар, задание, учителя и голос; расы и народы выбираются герою;
   — тварь в землях Сплетения встаёт своей тварью со своим голосом и умением;
   — восемь механик работают: синхрон Сферы и пробуждение, осколки Сети,
     камни возврата на Краю Бездны, песни и загадки Короны, школы и зачёты
     Буревала, пояса дыхания и небесная скорбь, изменение и противоядие,
     сродство, разломы и род;
   — подземелья в сто ярусов, стражи с реликвиями, узлы шва;
   — окно «Сплетение» в меню «Державы», все звуки — файлы без потерь на месте. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* ── 1. мир ── */
 const мир=await p.evaluate(()=>{
  const r={};
  r.sum=Spletenie.summary();
  r.держав=SPL_REALMS.length;r.всеНаМесте=SPL_REALMS.every(e=>empireAt(e.cap.x,e.cap.y)===e);
  r.круг=DK_REALMS.length;r.заморье=ZAM_REALMS.length;r.нетВКругу=DK_REALMS.every(e=>!e.сплетение);
  r.области=SPL_REALMS.every(e=>{const i=regionIndexAt(e.cap.x,e.cap.y);return REGIONS[i]&&REGIONS[i].n===e.short;});
  r.дары=SPL_REALMS.every(e=>DK_GIFTS[e.short]);
  r.земли=SPL_REALMS.every(e=>Spletenie.landAt(e.cap.x,e.cap.y)&&Spletenie.landAt(e.cap.x,e.cap.y).id===e.сплетение);
  r.джунгли=(()=>{const e=SPL_REALMS.find(x=>x.short==="Девять Сект");return climateAt(e.cap.x,e.cap.y).тепло>0.8;})();
  r.приют=(()=>{const e=SPL_REALMS.find(x=>x.short==="Хладный Приют");const t=climateAt(e.cap.x,e.cap.y).тепло;const e2=SPL_REALMS.find(x=>x.short==="Девять Сект");return t<climateAt(e2.cap.x,e2.cap.y).тепло-0.3;})();
  const рас=RACES_DB.filter(x=>/^sp_/.test(x.id));r.рас=рас.length;
  r.народы=рас.every(x=>(DK_PEOPLES[x.id]||[]).length===2&&DK_PEOPLES[x.id].every(n=>DK_PEOPLE_INFO[n]&&VOICE_RACES[n]))&&рас.every(x=>VOICE_RACES[x.n]&&HERO_RACE_FEATURE[x.id]);
  const имена=RACES_DB.map(x=>x.n).concat(...Object.values(DK_PEOPLES));r.именаЕдины=new Set(имена).size===имена.length;
  const боги=DK_GODS.filter(g=>/^lg_sp_/.test(g.id));r.боги=боги.length;r.цикл=Gods.cycle;
  const все=DK_GODS.map(g=>g.звук);r.звукиБоговЕдины=new Set(все).size===все.length;
  r.праздники=боги.map(g=>g.праздник).join(",");
  r.голосаЕдины=new Set(EMPIRE_VOICE).size===EMPIRE_VOICE.length&&EMPIRE_VOICE.length===EMPIRES.length;
  r.учителяЕдины=new Set(EMPIRE_TEACH.map(t=>t.чему.slice().sort().join("|"))).size===EMPIRE_TEACH.length&&EMPIRE_TEACH.length===EMPIRES.length;
  r.задания=EMPIRE_QUESTS.length===EMPIRES.length;
  r.меню=AM_ITEMS.some(x=>x[0]==="spletenie"&&x[1]==="Сплетение");
  return r;});
 check('1. восемь земель, шестнадцать держав, у каждой — твари, подземелья, ресурсы, реликвии, чары, травы, зелья, ловушки',
  мир.sum.земель===8&&мир.держав===16&&мир.sum.тварей===48&&мир.sum.подземелий===16&&мир.sum.ресурсов===32&&мир.sum.реликвий===32&&мир.sum.заклинаний===24&&мир.sum.трав===8&&мир.sum.зелий===8&&мир.sum.ловушек===8,мир.sum);
 check('1б. державы стоят на своей земле, Дальний Круг и Заморье прежние',мир.всеНаМесте&&мир.земли&&мир.круг===24&&мир.заморье===9&&мир.нетВКругу,мир);
 check('1в. у каждой державы своя область и дар земли',мир.области&&мир.дары,мир);
 check('1г. климат по нраву земли: в джунглях жарко, в Хладном Приюте стыло',мир.джунгли&&мир.приют,мир);
 check('1д. шестнадцать рас и тридцать два народа: облик, сведения и голос; имена не повторяются',мир.рас===16&&мир.народы&&мир.именаЕдины,мир);
 check('1е. шестнадцать младших богов со своими праздниками и неповторимыми голосами; круг — 121 день',мир.боги===16&&мир.цикл===121&&мир.звукиБоговЕдины,мир.праздники);
 check('1ж. у каждой державы свой голос города, свой набор учителей и свои задания',мир.голосаЕдины&&мир.учителяЕдины&&мир.задания,мир);
 check('1з. в меню «Державы» есть «Сплетение»',мир.меню);

 /* ── 2. звуки — файлы на месте ── */
 const звуки=await p.evaluate(()=>{const роли=Object.keys(SOUND_BANK).filter(r=>/^sp_/.test(r));return {n:роли.length,f:[].concat(...роли.map(r=>SOUND_BANK[r].f))};});
 звуки.нет=звуки.f.filter(f=>!/\.flac$/.test(f)||!fs.existsSync(path.join(__dirname,'..','sounds',f)));delete звуки.f;
 check('2. звуки Сплетения — FLAC без потерь, все файлы на месте',звуки.n>=70&&звуки.нет.length===0,звуки);

 /* ── 3. тварь своей земли ── */
 const тварь=await p.evaluate(()=>{
  const e=SPL_REALMS.find(x=>x.сплетение==="kristal");G.x=e.cap.x;G.y=e.cap.y;G.place=null;G.dark=0;
  const out=[];
  for(let i=0;i<30&&out.length<3;i++){G.x=e.cap.x+i*7;const m=Object.assign({},MONSTERS.find(x=>x.id==="wolf"));Spletenie.onCombat(m,{});if(m.sp)out.push([m.n,m.spAbil,m.spSnd,SPL.beasts.some(b=>b.n===m.n&&b.land==="kristal")]);}
  return out;});
 check('3. в Хрустальной Сфере волк встаёт тварью Сферы — со своим именем, умением и голосом',тварь.length>0&&тварь.every(x=>x[3]&&!!x[2]),тварь);

 /* ── 4. восемь механик ── */
 const мех=await p.evaluate(()=>{
  const r={};const s=Spletenie.st();const к=id=>SPL_REALMS.find(x=>x.сплетение===id);const туда=id=>{const e=к(id);G.x=e.cap.x;G.y=e.cap.y;G.place=null;};
  G.gold=5000;G.hpMax=Math.max(60,G.hpMax||60);G.hp=G.hpMax;G.manaMax=Math.max(60,G.manaMax||60);G.mana=G.manaMax;
  /* синхрон */
  туда("kristal");s.syncHour=Spletenie.hourKey()-3;Spletenie.tick();r.синхрон=s.sync;r.удар=Spletenie.heroHitBonus();r.проснуться=Spletenie.wake();r.синхронПосле=s.sync;
  /* осколки */
  туда("prizrak");r.осколок=Spletenie.shardGive();const id=s.shards[0];r.вплести=Spletenie.weave(id);r.вплетено=s.woven.slice();
  /* возврат */
  туда("bezdna");const x0=G.x;const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"));startCombat({x:G.x,y:G.y,monster:m});defeat();
  r.возврат={на_месте:G.x===x0,возвратов:s.returns,hp:G.hp>0};
  /* песни и загадки */
  туда("korona");G.mana=G.manaMax;startCombat({x:G.x,y:G.y,monster:Object.assign({},MONSTERS.find(q=>q.id==="wolf"))});r.песня=Spletenie.sing("so_battle");r.ладВБою=G.combat&&G.combat.spSong;endCombat();
  s.riddleNow=0;r.загадка=Spletenie.riddleAnswer(SPL.riddles[0].верно);
  /* школа и зачёт */
  туда("buria");r.школа=Spletenie.enroll("burya");s.examNow=0;r.зачёт=Spletenie.examAnswer(SPL.exams[0].верно);
  /* дыхание и скорбь */
  туда("dzhungli");Spletenie.resGive("xr_qistone",3);r.дыхание=Spletenie.absorb();r.готов=Spletenie.beltReady();
  const t=Object.assign({},MONSTERS.find(q=>q.id==="wolf"));Spletenie.onCombat(t,{});r.скорбь=t.sp;Spletenie.onWin(t);r.пояс=s.belt;
  /* изменение и противоядие */
  туда("izmena");s.izm=0;const a=Object.assign({},MONSTERS.find(q=>q.id==="ghoul"),{sp:"xb_altered",spAbil:"мутация",n:"Переиначенный"});G.combat={m:a,hp:10};for(let i=0;i<10;i++)Spletenie.onStrike(a,3);G.combat=null;
  r.изменение=s.izm;r.противоядие=Spletenie.drink(SPL.potions.find(q=>q.sp==="противоядие"),1);r.изменениеПосле=s.izm;r.задание=Spletenie.taskTake();
  /* сродство и разлом */
  туда("haos");r.сродство=Spletenie.affTest();s.rift={x:G.x,y:G.y,d:1};let n=0;while(s.rift&&n<20){Spletenie.riftClose();n++;}r.закрыто=s.closed;
  return r;});
 check('4а. Хрустальная Сфера: синхрон растёт сам, усиливает удар, пробуждение сбрасывает его',мех.синхрон>0&&мех.синхронПосле===0&&/просыпаетесь/.test(мех.проснуться),мех);
 check('4б. Призрачная Сеть: осколок древнего разума находится и вплетается в нервы',!!мех.осколок&&мех.вплетено.length===1&&/вплетает/.test(мех.вплести),мех.вплести);
 check('4в. Край Бездны: павший встаёт у камня возврата на месте, счёт возвратов растёт',мех.возврат.на_месте&&мех.возврат.возвратов>=1&&мех.возврат.hp,мех.возврат);
 check('4г. Кривая Корона: боевой лад в бою, загадка шута',/Боевой лад/.test(мех.песня)&&мех.ладВБою>0&&/Верно/.test(мех.загадка),[мех.песня,мех.загадка]);
 check('4д. Буревал: поступление в Школу Бури и зачёт',/Поступление/.test(мех.школа)&&/Зачёт сдан/.test(мех.зачёт),[мех.школа,мех.зачёт]);
 check('4е. Нефритовые Джунгли: камни дыхания, небесная скорбь и прорыв на первый пояс',мех.готов&&мех.скорбь==="trib"&&мех.пояс===1,мех);
 check('4ж. Переиначенный Предел: удары переиначенных копят изменение, противоядие его снимает, Игра даёт задание',мех.изменение>0&&мех.изменениеПосле<мех.изменение&&/Задание/.test(мех.задание),мех);
 check('4з. Шесть Граней: камень сродства и закрытый разлом',/Камень Сродства|Камню Сродства/.test(мех.сродство)&&мех.закрыто>=1,мех);

 /* ── 5. страж яруса, реликвия, узел шва ── */
 const страж=await p.evaluate(()=>{
  const k=SPL_DUNGEON_BY_ID.xd_abyss;const e=SPL_REALMS.find(x=>x.сплетение==="bezdna");
  G.place={kind:"dungeon",bx:e.cap.x,by:e.cap.y,stype:"ruins",name:"т",depth:100,x:1,y:1};
  const old=window.dungeonKindHere;window.dungeonKindHere=()=>k;
  const m=Object.assign({},MONSTERS.find(q=>q.id==="lich")||MONSTERS[0]);Spletenie.onCombat(m,{});
  const r={sp:m.sp,n:m.n};Spletenie.onWin(m);const s=Spletenie.st();r.реликвия=s.relics.indexOf("xl_returnkey")>=0;r.узел=!!s.seams.xd_abyss;
  window.dungeonKindHere=old;G.place=null;return r;});
 check('5. страж сотого яруса Спуска: реликвия и узел шва',страж.sp==="boss"&&страж.реликвия&&страж.узел,страж);

 /* ── 5б. тропа по шву ── */
 const тропа=await p.evaluate(()=>{const dk=DK_REALMS.find(e=>!e.остров);const sp=SPL_REALMS[0];
  const a=portalNodeAt(dk.cap.x,dk.cap.y),b=portalNodeAt(sp.cap.x,sp.cap.y);const f=portalFare(a,b);const назад=portalFare(b,a);
  return {туда:f.open,слово:f.слово,gold:f.gold,обратно:назад.open,узлов:Spletenie.trailNodes(a).length};});
 check('5б. от врат сухопутной державы Круга к Сплетению ведёт проводник по шву, и обратно',тропа.туда&&тропа.обратно&&тропа.слово==="тропа по шву"&&тропа.узлов===8,тропа);

 /* ── 6. окно ── */
 const окно=await p.evaluate(()=>{const r={};Spletenie.home();const m=document.getElementById("modal-spletenie");r.открыто=m&&!m.hidden;
  r.пунктов=document.querySelectorAll("#spBody [data-cmd^='sp:']").length;
  for(const c of ["m_kristal","m_prizrak","m_bezdna","m_korona","m_buria","m_dzhungli","m_izmena","m_haos","deep","gods","best","relics","spells","waters","chron","lands"])Spletenie.cmd(c);
  r.послеРазделов=document.querySelectorAll("#spBody [data-speak]").length;
  while(activeLayer())closeTopUI();return r;});
 check('6. окно «Сплетение» открывается, все шестнадцать разделов читаются',окно.открыто&&окно.пунктов>=17&&окно.послеРазделов>0,окно);

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

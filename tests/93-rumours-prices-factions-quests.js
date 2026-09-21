/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 93: ВЕСТИ ПО РОДУ, ЦЕНА ПО ФАКТОРАМ, ДОСЬЕ ДЕРЖАВ И ЯРУСЫ ДЕЛ

   Весть была верной или кривой — теперь у неё род и чужие уши (§125).
   Цена знала державу, войну и погоду — теперь ещё дороги, пошлину,
   происхождение, законы и контрабанду, и умеет объяснить себя (§126).
   У державы было хозяйство — теперь досье: цели, правитель, вассалы,
   союзники, враги, тайное дело седмицы и раздор (§124). У дела был один
   рост — теперь четыре яруса, срок, провал, частичная сдача и отложенные
   последствия (§128).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Пять родов вестей: свежая правда — правдивая, обросшая — частично,
      ложь — ложная, старая — устаревшая, пущенная нарочно — манипулятивная;
      весть помнит державу; чужая держава воспринимает иначе, чем своя.
   2. Законы держав постоянны: два запретных товара и пошлина; запретное
      дороже в полтора с лишним раза; небезопасные дороги и война поднимают
      цену; редкое издалека дороже; тайное дело седмицы меняет цену; цена
      объясняет себя словами; контрабанда бьёт штрафом при жребии.
   3. Досье державы несёт все поля §124; союзники и враги совпадают с
      отношениями; окно политики показывает досье.
   4. Ярусы дел: точечные, локальные, индивидуальные, мировые; взятое дело
      получает ярус, срок, состояние и условие запуска.
   5. Частичная сдача: с половины, платит меньше, состояние «частично»,
      отголосок приходит через дни; срок вышел — дело провалено, имя упало;
      мировое дело меняет подвоз и заводит весть; «Дела» говорят текстом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};});

 /* ── 1. вести ── */
 const вести=await page.evaluate(()=>{
  const r={};G.rumors=[];G.day=40;
  const a=rumorSeed("бой","одолел",G.x,G.y,true);r.свежая=rumorClass(a).id;
  const b=rumorSeed("добро","помог",G.x+100,G.y,true);b.искажение=3;r.обросшая=rumorClass(b).id;
  const c=rumorSeed("кровь","навет",G.x+200,G.y,false);r.ложь=rumorClass(c).id;
  const d=rumorSeed("казна","нашёл",G.x+300,G.y,true);d.д0=10;r.старая=rumorClass(d).id;
  const e=rumorSeed("суд","наговор",G.x+400,G.y,false,true);r.нарочно=rumorClass(e).id;
  r.держава=Number.isFinite(a.держава);r.родов=RUMOR_CLASSES.length;
  const t=rumorText(a);r.текстРод=t.род;
  /* восприятие: свой и чужой */
  const свой={x:G.x,y:G.y,key:"t1",name:"Свой",race:G.race};
  let чужой=null;for(let i=0;i<EMPIRES.length;i++){if(i!==a.держава){чужой={x:EMPIRES[i].cap.x,y:EMPIRES[i].cap.y,key:"t2",name:"Чужой",race:EMPIRES[i].race};break;}}
  r.свойВерит=rumorPerception(a,свой);r.чужой=rumorPerception(a,чужой);
  r.ложьСвой=rumorPerception(c,свой);r.манипСвой=rumorPerception(e,свой);
  r.текстВестей=rumorsText();
  return r;});
 check('1. пять родов вестей различаются; весть помнит державу; своя земля верит правде, ложь и навет слышны иначе',
  вести.родов===5&&вести.свежая==="true"&&вести.обросшая==="partial"&&вести.ложь==="false"&&вести.старая==="stale"&&вести.нарочно==="manip"&&вести.держава&&вести.текстРод==="правдивый"&&вести.свойВерит.верит&&/своя земля/.test(вести.свойВерит.слово)&&вести.ложьСвой.верит===false&&/выгодно/.test(вести.манипСвой.слово)&&вести.чужой.слово.length>5&&/правдивый/.test(вести.текстВестей),
  вести);

 /* ── 2. цена ── */
 const цена=await page.evaluate(()=>{
  const r={};G.day=20;G.weather="Ясно";
  const law0=empireLaw(0),law0b=empireLaw(0),law1=empireLaw(1);
  r.закон=law0;r.постоянно=JSON.stringify(law0)===JSON.stringify(law0b);r.разные=law0.запрет.join()!==law1.запрет.join()||law0.пошлина!==law1.пошлина;
  r.два=law0.запрет.length===2&&law0.запрет[0]!==law0.запрет[1];
  r.lawK=[lawK(law0.запрет[0],0),lawK("руда",0)];
  /* дороги */
  G.market={};const m=marketOf(0);m.подвоз=1;r.дорогиСпок=roadSafetyK(0);m.подвоз=0.5;r.дорогиОпасн=roadSafetyK(0);m.подвоз=1;
  r.издалека=[originK("жемчуг",0),originK("руда",0)];
  /* тайное дело: за 6 седмиц встречается больше одного рода и цена его слушается */
  const ops=new Set();for(let w=0;w<40;w++)ops.add(secretOp(0,w*7).id);r.тайныхРодов=ops.size;
  let дней=null;for(let w=0;w<60;w++){if(secretOp(0,w*7).id==="mines"){дней=w*7;break;}}
  r.рудаПриПорче=дней!==null?secretOpK("руда",0,дней):null;
  /* цена запретного выше обычной с тем же основанием */
  const idx=0;const z=law0.запрет[0];RES_BASE[z]=RES_BASE[z]||20;
  r.цена=[marketPrice(z,idx,20),Math.round((RES_BASE[z]||20)*1)];
  r.почему=priceWhy(z,idx,null);r.почемуРуда=priceWhy("руда",idx,{x:EMPIRES[0].cap.x,y:EMPIRES[0].cap.y,type:"castle",emp:EMPIRES[0]});
  /* контрабанда: жребий ловит */
  G.x=EMPIRES[0].cap.x;G.y=EMPIRES[0].cap.y;G.gold=1000;G.standing={};
  const rnd=Math.random;Math.random=()=>0.1;PLAYED.length=0;r.штраф=smuggleCheck(z,100);r.золото=G.gold;r.крим=standOf("crime",null);r.войско=standOf("army",null);
  Math.random=()=>0.9;G.gold=1000;r.безШтрафа=smuggleCheck(z,100);r.золото2=G.gold;Math.random=rnd;
  /* Обычный товар — тот, что здесь не запрещён ни законом, ни нуждой.
     Руда для этого больше не годится: в державе, у которой война разбила
     шахту, вывоз руды закрыт по нужде (§13), и стража спросит и за неё. */
  r.вольный=["дерево","трава","ягоды","камень","грибы","кость","руда"]
   .find(x=>!bannedHere(x,idx))||null;
  r.обычное=r.вольный?smuggleCheck(r.вольный,100):"";
  return r;});
 check('2а. законы держав постоянны и различны: два запретных товара и пошлина; запретное в полтора раза с лишним дороже',
  цена.постоянно&&цена.разные&&цена.два&&цена.lawK[0]===1.6&&цена.lawK[1]===1,цена.закон);
 check('2б. небезопасные дороги поднимают цену; редкое издалека дороже; тайное дело седмицы бывает разным и слушается в цене',
  цена.дорогиСпок<цена.дорогиОпасн&&цена.издалека[0]>1&&цена.издалека[1]===1&&цена.тайныхРодов>=3&&цена.рудаПриПорче===1.1,[цена.дорогиСпок,цена.дорогиОпасн,цена.издалека,цена.тайныхРодов]);
 check('2в. цена объясняет себя словами: запрет и пошлина названы; контрабанда при жребии бьёт штрафом и войско это помнит, преступный мир ценит',
  /контрабанда/.test(цена.почему)&&/пошлина/.test(цена.почемуРуда)&&/Штраф/.test(цена.штраф)&&цена.золото<1000&&цена.крим>0&&цена.войско<0&&/из-под полы/.test(цена.безШтрафа)&&цена.золото2===1000&&!!цена.вольный&&цена.обычное==="",
  [цена.почему,цена.штраф,цена.золото,цена.крим,цена.войско]);

 /* ── 3. досье ── */
 const досье=await page.evaluate(()=>{
  const r={};const p=factionProfile(0);
  r.поля=["цели","идеология","средства","правитель","вассалы","союзники","враги","торговля","войско","тайное","раздор","положение","слово","закон"].filter(k=>p[k]===undefined);
  r.цели=p.цели.length;r.правитель=p.правитель;
  const day=G.day;r.союзВерно=p.союзники.every(s=>{const j=EMPIRES.findIndex(e=>e.short===s);const w=relationWord(relationAt(0,j,day));return w==="союз"||w==="дружба";});
  r.врагиВерно=p.враги.every(s=>{const j=EMPIRES.findIndex(e=>e.short===s);return relationWord(relationAt(0,j,day))==="война";});
  r.текст=factionText(0);r.всего=factionsText();
  openModal("modal-politics");renderPolitics();r.окно=document.querySelectorAll("#polFactions .list-line").length;closeModal(document.getElementById("modal-politics"));
  return r;});
 check('3. досье державы несёт все поля §124, союзники и враги совпадают с отношениями, текст и окно политики его показывают',
  !досье.поля.length&&досье.цели>=1&&/ /.test(досье.правитель)&&досье.союзВерно&&досье.врагиВерно&&/Правитель:/.test(досье.текст)&&/Тайное дело седмицы/.test(досье.текст)&&/Внутренний раздор/.test(досье.текст)&&/Под запретом/.test(досье.текст)&&/Менять его можно/.test(досье.текст)&&/Всего держав 12/.test(досье.всего)&&досье.окно===12,
  [досье.поля,досье.правитель,досье.окно]);

 /* ── 4. ярусы ── */
 const ярусы=await page.evaluate(()=>{
  const r={};r.ярусов=QUEST_TIERS.length;
  r.т=[questTier({type:"fetch"}).id,questTier({type:"hunt"}).id,questTier({type:"craft"}).id,questTier({chain:"x",type:"fetch"}).id,questTier({type:"god_altar"}).id,questTier({type:"war_raid"}).id,questTier({type:"war_supply"}).id];
  /* взять дело у жителя */
  G.quests=[];G.chainTaken={};
  let npc=null;outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){
   const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);
   if(c&&c.structure){const ns=safeFn(()=>npcsFor(c),[]);if(ns.length){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;npc=ns[0];break outer;}}}
  if(!npc)return {нет:"жителя"};
  G.day=10;SAID.length=0;takeNPCQuest(npc);
  const q=G.quests[0];if(!q)return {нет:"дела"};
  r.ярус=q.ярус;r.до=q.до;r.состояние=q.состояние;r.старт=q.старт;r.сказ=SAID.find(t=>/Дело (точечное|локальное|индивидуальное|мировое)/.test(t))||"";
  r.срокВерен=q.до===10+QUEST_TIER_BY_ID[q.ярус].срок||!!q.due;
  openModal("modal-quests");renderQuests();r.окно=document.getElementById("questList").textContent;closeModal(document.getElementById("modal-quests"));
  return r;});
 check('4. четыре яруса; роды дел ложатся по ярусам; взятое дело получает ярус, срок, состояние и условие запуска, и это сказано и показано',
  !ярусы.нет&&ярусы.ярусов===4&&ярусы.т.join()==="point,local,local,personal,personal,world,world"&&["point","local","personal","world"].includes(ярусы.ярус)&&ярусы.срокВерен&&ярусы.состояние==="открыто"&&/взято у/.test(ярусы.старт)&&/Дело /.test(ярусы.сказ)&&/Ярус:/.test(ярусы.окно),
  ярусы.нет||[ярусы.т,ярусы.ярус,ярусы.до,ярусы.сказ.slice(-120)]);

 /* ── 5. частичная сдача, провал, отголоски, мир ── */
 const дела=await page.evaluate(()=>{
  const r={};G.quests=[];G.delayed=[];G.day=10;G.rep={};G.inv={};
  const race=G.race;
  G.quests.push({id:"т_fetch",npc:"Проверка",type:"fetch",res:"руда",need:4,have:0,done:false,race,text:"принеси руду",reward:{gold:100,xp:50},ярус:"point",до:16,состояние:"открыто"});
  G.inv["руда"]=1;r.рано=questPartialReady(G.quests[0]);G.inv["руда"]=2;r.готово=questPartialReady(G.quests[0]);G.inv["руда"]=4;r.полное=questPartialReady(G.quests[0]);
  G.inv["руда"]=2;openModal("modal-quests");renderQuests();r.кнопка=!!document.querySelector('#questList [data-cmd="qpart:т_fetch"]');closeModal(document.getElementById("modal-quests"));
  const gold=G.gold,xp=G.xp,rep=repOf(race);SAID.length=0;
  r.сдано=completeQuestPartial("т_fetch");r.золото=G.gold-gold;r.опыт=G.xp-xp;r.реп=repOf(race)-rep;r.состояние=G.quests[0].состояние;r.done=G.quests[0].done;r.руда=G.inv["руда"];
  r.отложено=(G.delayed||[]).length;r.сказ=SAID.find(t=>/частично/.test(t))||"";
  /* отголосок приходит через дни */
  G.day=15;SAID.length=0;questDayTick();r.отголосок=SAID.find(t=>/Отголосок/.test(t))||"";r.репПосле=repOf(race)-rep;r.отложеноПосле=(G.delayed||[]).length;
  /* провал по сроку */
  G.quests.push({id:"т_kill",npc:"Проверка",type:"kill",need:3,have:0,done:false,race,text:"убей",reward:{gold:50,xp:20},ярус:"point",до:12,состояние:"открыто"});
  const rep2=repOf(race);G.day=13;SAID.length=0;questDayTick();const qk=G.quests.find(q=>q.id==="т_kill");
  r.провал=qk.провал===true&&qk.done===true&&qk.состояние==="провалено";r.репПровал=repOf(race)-rep2;r.провалСказ=SAID.find(t=>/Срок вышел/.test(t))||"";
  /* мировое дело меняет мир */
  G.quests.push({id:"т_world",npc:"Проверка",type:"war_supply",res:"руда",need:1,have:0,done:false,race,text:"снабди войско",reward:{gold:100,xp:50},foe:"враг",ярус:"world",tx:G.x,ty:G.y,до:40,состояние:"открыто"});
  G.inv["руда"]=1;G.market={};G.rumors=[];const idx=empireIndexAt(G.x,G.y);SAID.length=0;completeQuest("т_world");
  r.подвоз=marketOf(idx).подвоз;r.весть=(G.rumors||[]).some(x=>x.в==="добро");r.флаг=!!(G.worldFlags&&Object.keys(G.worldFlags).length);r.мирСказ=SAID.find(t=>/мировое дело/.test(t))||"";
  r.текст=questsText();
  return r;});
 check('5а. частичная сдача: с половины и не с целого; кнопка есть; платит меньше и растит имя меньше; состояние «частично»; отголосок записан и приходит через дни',
  дела.рано===false&&дела.готово===true&&дела.полное===false&&дела.кнопка&&дела.сдано&&дела.золото>0&&дела.золото<100&&дела.опыт>0&&дела.реп===1&&дела.состояние==="частично"&&дела.done&&дела.руда===undefined&&дела.отложено===1&&/частично/.test(дела.сказ)&&/Отголосок/.test(дела.отголосок)&&дела.репПосле===0&&дела.отложеноПосле===0,
  [дела.золото,дела.реп,дела.репПосле,дела.отложено,дела.отголосок.slice(0,80)]);
 check('5б. срок вышел — дело провалено и имя упало; мировое дело двигает подвоз, заводит весть и помечает мир; «Дела» говорят ярусами',
  дела.провал&&дела.репПровал===-2&&/провалено/.test(дела.провалСказ)&&дела.подвоз>1&&дела.весть&&дела.флаг&&/мировое дело/.test(дела.мирСказ)&&/Дел открыто/.test(дела.текст),
  [дела.репПровал,дела.подвоз,дела.весть,дела.мирСказ.slice(0,100)]);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

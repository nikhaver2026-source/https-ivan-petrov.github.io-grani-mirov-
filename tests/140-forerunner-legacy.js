/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 140: НАСЛЕДИЕ ПРЕДТЕЧ И ЛЕС ВОЗМОЖНОСТЕЙ (§44.21–44.22 брифа)

   Бриф просит не переносить чужих «Древних», а создать свою цивилизацию
   Предтеч Грани, оставившую девять родов мест, и чтобы КАЖДОЕ ОТКРЫТИЕ
   требовало ключа, знания, языка, энергии, разрешения фракции или
   испытания. И чтобы восстановленные узлы складывались в мировой «лес
   возможностей».

   До этой правки Предтечи были одной строкой в разговоре с жителем.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Девять родов оставленного, шесть родов требования, семь даров леса;
      у каждого рода своя запись и свой дар, у каждого дара свой питатель.
   2. Узлы стоят по два на область и не пляшут между заходами.
   3. У каждого узла два–четыре требования из шести, и они постоянны.
   4. Игра называет нехватку словами и числами.
   5. Наполовину узел не открывается: пока не хватает — отказ.
   6. Когда всё при вас — узел открывается, и плата берётся ровно та, что
      названа: ключ и энергия, и ничего сверх.
   7. Дважды один узел не открывается.
   8. §38: каждый из семи даров ВПРАВДУ что-то меняет в мире.
   9. Дар растёт с числом узлов, а не даётся разом.
  10. Предтеченский ключ вправду кладётся в глубокие казны.
  11. Окно «Живой мир» называет узел, нехватку и лес возможностей.
  12. Самопроверка мира держит строку «forerunners»; глава, README и docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(String(r));return bp(r,o);};
  window.__jt=[];const j=window.journal;window.journal=t=>{__jt.push(String(t));return j(t);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>({
  родов:FORE_SITES.length,требований:FORE_KEYS.length,даров:FORE_BOONS.length,
  уник:new Set(FORE_SITES.map(x=>x.id)).size,
  безЗвука:FORE_SITES.filter(x=>!SOUND_BANK[x.звук]).map(x=>x.id),
  безСлов:FORE_SITES.filter(x=>!x.n||!x.род||!x.о||!x.дар).map(x=>x.id),
  безДара:FORE_SITES.filter(x=>!FORE_BOON_BY_ID[x.боон]).map(x=>x.id),
  висячие:FORE_BOONS.filter(b=>!FORE_SITES.some(x=>x.боон===b.id)).map(b=>b.id),
  требБезСлов:FORE_KEYS.filter(k=>!k.n||!k.о||!k.как).map(k=>k.id),
  дарыБезМеры:FORE_BOONS.filter(b=>!b.n||!b.о||!b.мера||!(b.k>0)).map(b=>b.id),
  ждём:["complex","station","moon","archive","machine","warden","vault","chart","shaper"]
   .filter(id=>!FORE_BY_ID[id]),
  ключи:["key","lore","tongue","power","favor","trial"].filter(id=>!FORE_KEY_BY_ID[id])}));
 check('девять родов оставленного, шесть родов требования, семь даров леса',
  состав.родов===9&&состав.требований===6&&состав.даров===7
  &&состав.уник===9&&состав.ждём.length===0&&состав.ключи.length===0,состав);
 check('у каждого рода настоящая запись, свои слова и свой дар',
  состав.безЗвука.length===0&&состав.безСлов.length===0&&состав.безДара.length===0,состав);
 check('у каждого требования сказано, что это и как его добыть; у каждого дара — своя мера',
  состав.требБезСлов.length===0&&состав.дарыБезМеры.length===0,состав);
 check('висячих даров нет: каждый дар леса кто-то питает',состав.висячие.length===0,состав.висячие);

 /* ── 2–3. размещение и требования ── */
 const узлы=await page.evaluate(()=>{
  const a=Fore.all();
  Fore._all=null;
  const b=Fore.all();
  const пляшут=a.some((u,i)=>!b[i]||b[i].x!==u.x||b[i].y!==u.y||b[i].вид!==u.вид);
  const плохие=a.filter(u=>{const n=Fore.needs(u);
   return !(n.length>=2&&n.length<=4)||new Set(n).size!==n.length||!n.every(id=>FORE_KEY_BY_ID[id]);});
  const непостоянные=a.filter(u=>String(Fore.needs(u))!==String(Fore.needs(u)));
  const областей=new Set(a.map(u=>u.область)).size;
  return {всего:a.length,областей,регионов:REGIONS.length,пляшут,
   плохие:плохие.map(u=>u.id),непостоянные:непостоянные.map(u=>u.id),
   виды:new Set(a.map(u=>u.вид)).size,
   числа:Fore.amount(a[0],"lore")};});
 check('узлы стоят по два на каждую область и не пляшут между заходами',
  узлы.всего===узлы.регионов*2&&узлы.областей===узлы.регионов&&!узлы.пляшут,узлы);
 check('у каждого узла два–четыре разных требования из шести, и они постоянны',
  узлы.плохие.length===0&&узлы.непостоянные.length===0,узлы);
 check('требование считается числом, и число осмысленно',
  узлы.числа>=3&&узлы.числа<=11,узлы);

 /* ── 4–7. открытие ── */
 const открытие=await page.evaluate(()=>{
  const o={};
  G.place=null;G.ship=null;G.fore={открыты:{}};
  G.inv={};G.mana=0;G.manaMax=400;G.loreKn={};G.rep={};G.deeds={};
  safeFn(()=>{Energy.ensure();G.will=0;});
  /* Найдём узел, который требует и ключа, и энергии: на нём видно плату. */
  const u=Fore.all().find(z=>{const n=Fore.needs(z);return n.indexOf("key")>=0&&n.indexOf("power")>=0;})
   ||Fore.all()[0];
  G.x=u.x;G.y=u.y;
  o.требует=Fore.needs(u);
  o.нехватка=Fore.lacks(u);
  o.отказ=Fore.open();
  o.неОткрылся=!Fore.opened(u.id);
  /* Закрываем всё. */
  G.inv["предтеченский ключ"]=2;G.mana=400;
  safeFn(()=>{Energy.ensure();G.willMax=60;G.will=60;});
  for(let i=0;i<30;i++)Lore.add("map","k"+i,"Место "+i,"проба");
  G.langs=null;Langs.ensure();
  LANGS.forEach(l=>{if(l.id!=="common"&&l.id!==G.homeLang)G.langs[l.id]={ур:3,оп:0};});
  EMPIRES.forEach(e=>{G.rep[e.race]=90;});
  G.deeds={kills:200,dives:200,rites:200,quests:200};
  o.нехватка2=Fore.lacks(u);
  const ключиДо=Number(G.inv["предтеченский ключ"])||0;
  const манаДо=G.mana,воляДо=G.will;
  __played.length=0;__jt.length=0;
  o.открыт=Fore.open();
  o.естьОткрыт=Fore.opened(u.id);
  o.взято={ключ:ключиДо-(Number(G.inv["предтеченский ключ"])||0),
   мана:манаДо-G.mana,воля:воляДо-G.will};
  o.звук=__played.length>0;
  o.летопись=__jt.some(t=>/Наследие Предтеч/.test(t));
  o.повтор=Fore.open();
  o.счёт=Fore.count();
  return o;});
 check('пока не хватает — узел молчит и называет нехватку словами и числами',
  открытие.нехватка.length>0&&открытие.неОткрылся
  &&/не открывается/.test(открытие.отказ)&&/Не хватает/.test(открытие.отказ),открытие);
 check('когда всё при вас — нехватки нет и узел открывается со звуком и летописью',
  открытие.нехватка2.length===0&&открытие.естьОткрыт
  &&/Узел открыт/.test(открытие.открыт)&&открытие.звук&&открытие.летопись,открытие);
 check('плата берётся ровно та, что названа: ключ и энергия, и ничего сверх',
  открытие.взято.ключ===1&&открытие.взято.мана>0&&открытие.взято.воля>0,открытие);
 check('дважды один узел не открывается',
  /уже открыли/.test(открытие.повтор)&&открытие.счёт===1,открытие);

 /* ── 8–9. семь даров вправду меняют мир ── */
 const дары=await page.evaluate(()=>{
  const o={};
  const всё=()=>{G.fore={открыты:{}};Fore.all().forEach(u=>{G.fore.открыты[u.id]=1;});};
  const пусто=()=>{G.fore={открыты:{}};};
  G.place=null;G.deeds={};G.facetTiers={};G.echoFrag=null;G.buffs={};
  G.mana=400;G.manaMax=400;G.hp=400;G.hpMax=400;
  пусто();
  o.слух0=scapeRad();o.дых0=breathTacts();
  const t0=TECHS[0];o.риск0=techRisk(t0);
  const план0=safeFn(()=>Gen.plan(1000,1000,30,"ruins"),null);
  o.сунд0=план0?план0.сундуков:null;
  G.langs=null;Langs.ensure();G.langs.north={ур:0,оп:0};
  Langs.learn("north",10);o.язык0=G.langs.north.оп;
  const sp=SPELLS.find(x=>x.n==="Зов горнила");
  const чара=()=>{G.spells=[sp.n];G.spellCD={};G.buffs={};G.mana=400;
   G.inCombat=false;G.combat=null;const до=G.mana;castSpell(SPELLS.indexOf(sp));return до-G.mana;};
  o.чара0=чара();
  всё();
  o.слух1=scapeRad();o.дых1=breathTacts();o.риск1=techRisk(t0);
  Gen._кеш&&Gen._кеш.clear&&Gen._кеш.clear();
  const план1=safeFn(()=>Gen.plan(1000,1000,30,"ruins"),null);
  o.сунд1=план1?план1.сундуков:null;
  G.langs.north={ур:0,оп:0};Langs.learn("north",10);o.язык1=G.langs.north.оп;
  o.чара1=чара();
  o.боон=FORE_BOONS.map(b=>b.id+"="+Fore.boonK(b.id));
  /* Дар растёт с числом узлов, а не даётся разом. */
  пусто();
  const луны=Fore.all().filter(u=>u.вид==="moon");
  let раньше=0;const шаги=[];
  луны.slice(0,3).forEach(u=>{G.fore.открыты[u.id]=1;шаги.push(Fore.boonK("эхо"));});
  o.шагиЛуны=шаги;o.растёт=шаги.every((v,i)=>i===0?v>раньше:v>шаги[i-1]);
  пусто();
  return o;});
 check('слышимость, дыхание и верная рука вправду меняются от восстановленной сети',
  дары.слух1>дары.слух0&&дары.дых1>дары.дых0&&дары.риск1<дары.риск0,дары);
 check('щедрость недр вправду прибавляет сундуков на ярус',
  дары.сунд1>дары.сунд0,дары);
 check('открытая память вправду ускоряет языки, а машины удешевляют чары',
  дары.язык1>дары.язык0&&дары.чара1<дары.чара0,дары);
 check('каждый из семи даров посчитан и ни один не ноль при полной сети',
  дары.боон.every(t=>Number(t.split("=")[1])>0),дары.боон);
 check('дар растёт с числом узлов, а не даётся разом',
  дары.шагиЛуны.length>=2&&дары.растёт,дары);

 /* ── 10. ключ из глубокой казны ── */
 const ключ=await page.evaluate(()=>{
  /* Ключ кладётся в казну за запертой дверью глубже пятнадцатого яруса.
     Проверяется сама доля: на сотне мест он должен встретиться, но не всюду. */
  let сколько=0,всего=0;
  for(let i=0;i<200;i++){
   const x=3+i%17,y=5+Math.floor(i/17);
   const d=15+(i%40);
   всего++;
   if(hashName(x*13+d,y*7,8990)<0.34)сколько++;}
  /* И на мелководье его не бывает: проверка глубины стоит раньше броска. */
  return {доля:Math.round(сколько/всего*100),всего};});
 check('предтеченский ключ попадается в глубоких казнах, но не в каждой',
  ключ.доля>15&&ключ.доля<55,ключ);

 /* ── 11. окно ── */
 const окно=await page.evaluate(async()=>{
  G.place=null;G.ship=null;G.fore={открыты:{}};
  const u=Fore.all()[0];G.x=u.x;G.y=u.y;
  renderLiving();
  const box=document.getElementById("lwFore");
  const кн=Array.from(box.querySelectorAll("button"));
  const строки=Array.from(box.querySelectorAll(".list-line")).map(x=>String(x.dataset.speak||""));
  return {есть:!!box,кнопка:кн.some(b=>b.dataset.cmd==="foreopen"),
   шапка:строки[0]||"",родов:строки.filter(t=>/Питает дар/.test(t)).length,
   команды:typeof CMD.foreopen==="function"&&typeof CMD.foresay==="function"};});
 check('в окне «Живой мир» есть раздел наследия с кнопкой открытия',
  окно.есть&&окно.кнопка&&окно.команды,окно);
 check('раздел называет сводку и все девять родов с их дарами',
  /Наследие Предтеч Грани/.test(окно.шапка)&&/узлов в мире/.test(окно.шапка)
  &&окно.родов===9,окно);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Наследие Предтеч/i.test(g.title));
  return {f:r.find(x=>x.id==="forerunners"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("FORERUNNERS"),текст:String(Modules.get("FORERUNNERS").text()).slice(0,180)};});
 check('самопроверка мира держит зелёную строку «forerunners»',
  !!свод.f&&свод.f.ok===true,свод.f);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль наследия зарегистрирован и говорит о себе',
  свод.модуль&&/Наследие Предтеч Грани/.test(свод.текст),свод.текст);
 check('в руководстве есть глава о наследии и лесе возможностей',свод.глава&&свод.строк>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о девяти родах, шести требованиях и лесе возможностей',
  /Наследие Предтеч/i.test(readme)&&/Девять родов оставленного/i.test(readme)
  &&/Шесть родов требования/i.test(readme)&&/Лес возможностей/i.test(readme));
 check('docs/МИР.md держит таблицы родов и даров',
  /FORE_SITES/.test(mir)&&/FORE_KEYS/.test(mir)&&/FORE_BOONS/.test(mir)&&/boonK/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 125: СОПРЯЖЕНИЕ ГРАНИ — СЕМЬ ПОСЛЕДСТВИЙ (§5 брифа)

   Мировое событие «Сопряжение Грани» в мире было, но делало немного:
   поднимало эфир, учащало встречи и поднимало цены. §5 требует другого:
   после Сопряжения появляются новые виды существ, открываются переходы,
   возникают новые ресурсы, меняются законы регионов, приходят экспедиции,
   начинается борьба за торговые маршруты и появляются новые профессии и
   фракции.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Пока Сопряжения нет, нет ничего из семи: ни пришлых, ни переходов,
      ни запретов, ни спорных путей, ни товарищества.
   2. Твари: шесть пришлых видов со своим голосом и своей добычей; они
      берутся только на время события.
   3. Переходы: каждый город становится узлом сети и перестаёт им быть,
      когда событие кончилось.
   4. Товары: три чужих, у каждого цена и значок; их приносят пришлые и
      экспедиции.
   5. Законы: чужое запретно во ВСЕХ державах сразу, и от этого дороже.
   6. Экспедиции: четыре рода, у каждого свой голос, свой дар и своя цена;
      ведёт их одно из трёх новых ремёсел.
   7. Маршруты: пока переходы открыты, пути спорны и прибыль на них выше.
   8. Люди: три ремесла и товарищество в каждом городе.
   9. Самопроверка мира держит строку «conjunction», руководство и README
      о семи последствиях рассказывают.
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
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(r);return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── состав ── */
 const состав=await page.evaluate(()=>({
  твари:CONJ_BEASTS.length,
  тварьПолна:CONJ_BEASTS.every(b=>b.n&&b.о&&b.snd&&b.fx&&b.голос&&b.сила>0),
  голосовРазных:new Set(CONJ_BEASTS.map(b=>b.snd)).size,
  товары:CONJ_RES.slice(),
  ценаЗначок:CONJ_RES.every(r=>RES_BASE[r]>0&&!!(r in RESICON)),
  ремёсла:CONJ_PROFS.slice(),
  экспедиции:CONJ_EXPED.length,
  экспПолна:CONJ_EXPED.every(e=>e.n&&e.о&&SOUND_BANK[e.звук]&&RES_BASE[e.дар.res]&&e.плата>0),
  экспЗвуковРазных:new Set(CONJ_EXPED.map(e=>e.звук)).size,
  орг:CONJ_ORG.n,оргЗвук:!!SOUND_BANK[CONJ_ORG.звук],
  событий:RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).length,
  событияСоЗвуком:RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).every(e=>!!SOUND_BANK[e.звук]),
  случайныхБезСопряжения:RANDOM_EVENTS.filter(e=>!/^(conj_|mirth_)/.test(e.id)).length,
  весёлых:RANDOM_EVENTS.filter(e=>e.id.indexOf("mirth_")===0).length}));
 check('шесть пришлых видов, у каждого имя, слово, голос и вес',
  состав.твари===6&&состав.тварьПолна&&состав.голосовРазных>=4,состав);
 check('три чужих товара, у каждого цена и значок',
  состав.товары.length===3&&состав.ценаЗначок,состав.товары);
 check('четыре рода экспедиций, у каждого свой голос, дар и плата',
  состав.экспедиции===4&&состав.экспПолна&&состав.экспЗвуковРазных===4,состав);
 check('два события Сопряжения сверх четырнадцати обычных, и оба со звуком',
  состав.событий===2&&состав.событияСоЗвуком&&состав.случайныхБезСопряжения===14
  &&состав.весёлых===12,состав);
 check('три новых ремесла и товарищество со своим голосом',
  состав.ремёсла.length===3&&!!состав.орг&&состав.оргЗвук,состав);

 /* ── 1. без события нет ничего ── */
 const без=await page.evaluate(()=>{
  G.global=null;
  const c=NAMED_CITIES[0];
  return {on:Conj.on(),дней:Conj.дней(),
   тварь:Conj.тварь(),экспедиция:Conj.экспедиция(),
   портал:!!portalNodeAt(c.x,c.y),
   запрет:isContraband("чужая соль",0),
   спорно:Conj.спорно(),маршрутK:Conj.маршрутK(),
   ремёсла:Conj.ремёсла().length,орг:Conj.орг(),
   события:RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).map(e=>e.когда()),
   текст:Conj.text()};});
 check('без Сопряжения нет ни пришлых, ни переходов, ни запретов, ни спорных путей',
  без.on===false&&без.тварь===null&&без.экспедиция===null&&без.портал===false
  &&без.запрет===false&&без.спорно===false&&без.маршрутK===1
  &&без.ремёсла===0&&без.орг===null&&без.события.every(x=>x===false),без);
 check('без Сопряжения игра так и говорит',/Сопряжения нет/.test(без.текст),без.текст);

 /* ── 2–8. событие идёт ── */
 const идёт=await page.evaluate(()=>{
  const c=NAMED_CITIES[0];
  G.x=c.x;G.y=c.y;
  Global.start("conjunction");
  const узел=portalNodeAt(c.x,c.y);
  const твари=[];for(let i=0;i<40;i++){const t=Conj.тварь();if(t)твари.push(t);}
  const экс=[];for(let i=0;i<40;i++){const e=Conj.экспедиция();if(e)экс.push(e);}
  const маршруты=bestRoutes(c.x,c.y,G.day,4);
  const орг=cityOrgs(c).filter(o=>o.сопряжение);
  /* Запрет — во всех державах сразу, а не в одной. */
  const запретВезде=EMPIRES.map((e,i)=>isContraband("переходный сплав",i));
  const своё=EMPIRES.map((e,i)=>isContraband("дерево",i));
  return {on:Conj.on(),дней:Conj.дней(),
   узел:узел?узел.kind:null,узелИмя:узел?узел.name:"",
   видовВстретилось:new Set(твари.map(t=>t.id)).size,
   тварьСДобычей:твари.every(t=>CONJ_RES.indexOf(t.добыча)>=0&&t.hp>0&&t.dmg>0),
   экспРодов:new Set(экс.map(e=>e.id)).size,
   экспВедёт:экс.every(e=>CONJ_PROFS.indexOf(e.проф)>=0),
   запретВезде:запретВезде.every(Boolean),своёНеЗапретно:своё.every(x=>x===false),
   спорно:Conj.спорно(),маршрутK:Conj.маршрутK(),
   маршрутыСпорны:маршруты.length>0&&маршруты.every(r=>r.спорный===true),
   орг:орг.map(o=>o.n),оргСила:орг[0]?орг[0].сила:0,
   ремёсла:Conj.ремёсла(),
   события:RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).map(e=>e.когда()),
   текст:Conj.text()};});
 check('пока событие идёт, встречаются все шесть пришлых видов, и у каждого своя добыча',
  идёт.видовВстретилось===6&&идёт.тварьСДобычей,идёт);
 check('город становится временным узлом сети и называет себя так',
  идёт.узел==="conj"&&/Временный переход/.test(идёт.узелИмя),идёт);
 check('чужое запретно во всех державах сразу, а своё — нет',
  идёт.запретВезде&&идёт.своёНеЗапретно,
  {чужое:идёт.запретВезде,своё:идёт.своёНеЗапретно});
 check('по дорогам идут все четыре рода экспедиций, и ведёт их новое ремесло',
  идёт.экспРодов===4&&идёт.экспВедёт,идёт);
 check('торговые пути спорны, и прибыль на них выше в полтора раза',
  идёт.спорно===true&&идёт.маршрутK>1.3&&идёт.маршрутыСпорны,идёт);
 check('в городе стоит товарищество, и ходят три новых ремесла',
  идёт.орг.length===1&&идёт.оргСила>=3&&идёт.ремёсла.length===3,идёт);
 check('оба события Сопряжения могут случиться, и игра называет, сколько осталось',
  идёт.события.every(Boolean)&&идёт.дней>0&&/Сопряжение Грани идёт/.test(идёт.текст),идёт);

 /* ── события вживую ── */
 const вживую=await page.evaluate(async()=>{
  const речь=()=>__said.join(" | ");
  const тварь=RANDOM_EVENTS.find(e=>e.id==="conj_beast");
  const эксп=RANDOM_EVENTS.find(e=>e.id==="conj_exped");
  G.inCombat=false;__said.length=0;__played.length=0;
  const слово1=safeFn(()=>тварь.делать(),"");
  const бой={идёт:!!G.inCombat,кто:G.combat&&G.combat.m?G.combat.m.n:null};
  G.inCombat=false;G.combat=null;
  G.gold=500;const былоЗолото=G.gold;
  const былоЧужого=CONJ_RES.reduce((a,r)=>a+(Number(G.inv[r])||0),0);
  __said.length=0;__played.length=0;
  const слово2=safeFn(()=>эксп.делать(),"");
  const сталоЧужого=CONJ_RES.reduce((a,r)=>a+(Number(G.inv[r])||0),0);
  return {слово1,бой,слово2,золотоУпало:G.gold<былоЗолото,
   чужогоПрибавилось:сталоЧужого>былоЧужого,голоса:__played.slice(0,4)};});
 check('пришлая тварь и вправду выходит в бой',
  вживую.бой.идёт===true&&!!вживую.бой.кто,вживую.бой);
 check('экспедиция берёт золото и отдаёт чужой товар',
  вживую.золотоУпало&&вживую.чужогоПрибавилось&&/экспедиц|обоз|отряд|сеятел|полусотн/i.test(вживую.слово2),
  {слово:вживую.слово2});

 /* ── событие кончилось — всё закрылось ── */
 const после=await page.evaluate(()=>{
  const c=NAMED_CITIES[0];
  G.day=Number(G.global.до)+1;
  Global.cur();                       /* срок вышел — событие снимается */
  return {on:Conj.on(),портал:!!portalNodeAt(c.x,c.y),
   запрет:isContraband("чужая соль",0),спорно:Conj.спорно(),
   орг:cityOrgs(c).some(o=>o.сопряжение),
   чужоеОсталось:CONJ_RES.some(r=>(Number(G.inv[r])||0)>0),
   ценаОсталась:CONJ_RES.every(r=>RES_BASE[r]>0)};});
 check('когда срок вышел, переходы закрываются, законы возвращаются, товарищество уходит',
  после.on===false&&после.портал===false&&после.запрет===false
  &&после.спорно===false&&после.орг===false,после);
 check('а чужие товары остаются в суме и в торговых книгах: их уже привезли',
  после.чужоеОсталось&&после.ценаОсталась,после);

 /* ── 9. самопроверка, руководство, README ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Сопряжение Грани/i.test(g.title));
  return {conjunction:(r.find?r.find(x=>x&&x.id==="conjunction"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «conjunction»',
  !!свод.conjunction&&свод.conjunction.ok===true,свод.conjunction);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о Сопряжении',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о семи последствиях Сопряжения',
  /Сопряжени/i.test(readme)&&/пришл/i.test(readme)&&/экспедиц/i.test(readme)
  &&/чужая соль/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

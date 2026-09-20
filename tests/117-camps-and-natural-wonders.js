/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 117: СТАНЫ И ЧУДЕСА ПРИРОДЫ (§11 брифа)

   Бриф перечисляет, что стоит в каждой области: города, поселения, дороги,
   пещеры, руины, храмы, башни, ЛАГЕРЯ, тайники и ПРИРОДНЫЕ
   ДОСТОПРИМЕЧАТЕЛЬНОСТИ. Последних двух в мире не было вовсе.

   1. Данные: восемь родов станов и двенадцать чудес, у каждого свой голос
      записью, место по рельефу, описание, слово и дела; дар чуда — из
      настоящих ресурсов; маяки стана и чуда есть и звучат.
   2. Мир их родит: на выборке встречаются и станы, и чудеса, и все они
      стоят вне дорог, а род отвечает рельефу клетки.
   3. Стан: греются час, расспрашивают, сбывают добычу дороже города — но
      не то, что обещано по делу.
   4. Разбойничий лагерь берёт мыто, паломники благословляют раз в сутки,
      войсковой стан рассказывает о войне, погонщики поят за пятнадцать.
   5. Чудо отдаёт дар раз в сутки и честно отказывает во второй раз.
   6. Самопроверка мира держит строку wilds; реестр знает модуль WILDS.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  /* Найти в мире клетку с нужным строением; при желании — определённого рода. */
  window.НАЙТИ=(тип,род)=>{
   for(let n=0;n<400000;n++){
    const x=(n*997)%WORLD,y=(n*1543+7)%WORLD;
    const c=safeFn(()=>cellContent(x,y),null);
    if(!c||!c.structure||c.structure.type!==тип)continue;
    if(род&&c.structure.стан!==род&&c.structure.чудо!==род)continue;
    return {x,y,s:c.structure,terr:c.terrain[0]};}
   return null;};});

 /* ── 1. Данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.станов=CAMP_KINDS.length;r.чудес=LANDMARKS.length;
  r.станБезПолей=CAMP_KINDS.filter(k=>!k.n||!k.о||!k.слово||!k.земли.length||(k.дела||[]).length<2).map(k=>k.id);
  r.чудоБезПолей=LANDMARKS.filter(k=>!k.n||!k.о||!k.слово||!k.земли.length||!k.дар).map(k=>k.id);
  r.немые=CAMP_KINDS.concat(LANDMARKS).filter(k=>!Bank.has(k.звук)).map(k=>k.id);
  r.голосовРазных=new Set(CAMP_KINDS.concat(LANDMARKS).map(k=>k.звук)).size;
  r.голосовВсего=CAMP_KINDS.length+LANDMARKS.length;
  r.чужойДар=LANDMARKS.filter(k=>k.дар.res&&!RES_BASE[k.дар.res]).map(k=>k.id);
  r.пустойДар=LANDMARKS.filter(k=>!(k.дар.hp||k.дар.mana||k.дар.res)).map(k=>k.id);
  r.чужойСбыт=CAMP_KINDS.filter(k=>(k.сбыт||[]).some(x=>!RES_BASE[x])).map(k=>k.id);
  r.маяки=!!(SOUND_BANK[BEACON_ROLE.camp]&&SOUND_BANK[BEACON_ROLE.landmark]
   &&BEACON_INFO.camp&&BEACON_INFO.landmark);
  r.модуль=!!Modules.get("WILDS");
  r.строка=safeFn(()=>{const z=worldSelfCheck().find(v=>v.id==="wilds");return z?z.ok:null;},null);
  r.значки=iconFor("camp")!=="🏠"&&iconFor("landmark")!=="🏠";
  r.описания=!!bldDesc("camp")&&!!bldDesc("landmark");
  return r;});
 check('восемь родов станов и двенадцать чудес природы, у каждого своё место, слово, дела и запись',
  данные.станов===8&&данные.чудес===12&&!данные.станБезПолей.length&&!данные.чудоБезПолей.length
  &&!данные.немые.length&&данные.голосовРазных===данные.голосовВсего,
  данные);
 check('дар чуда — из настоящих ресурсов и никогда не пустой, стан берёт только то, что в мире есть',
  !данные.чужойДар.length&&!данные.пустойДар.length&&!данные.чужойСбыт.length,
  {дар:данные.чужойДар,пусто:данные.пустойДар,сбыт:данные.чужойСбыт});
 check('маяк, значок, описание, модуль и строка самопроверки на месте',
  данные.маяки&&данные.значки&&данные.описания&&данные.модуль&&данные.строка===true,данные);

 /* ── 2. Мир их родит, и род отвечает рельефу ── */
 const вМире=await page.evaluate(()=>{
  const r={станов:0,чудес:0,наДороге:0,чужойРельеф:[]};
  for(let i=0;i<60000;i++){
   const x=(i*131)%WORLD,y=(i*271+11)%WORLD;
   const c=safeFn(()=>cellContent(x,y),null);
   if(!c||!c.structure)continue;
   const t=c.structure.type;
   if(t!=="camp"&&t!=="landmark")continue;
   if(t==="camp")r.станов++;else r.чудес++;
   if(c.terrain[0]==="road")r.наДороге++;
   const k=t==="camp"?CAMP_BY_ID[c.structure.стан]:LANDMARK_BY_ID[c.structure.чудо];
   if(!k||k.земли.indexOf(c.terrain[0])<0)r.чужойРельеф.push((k&&k.id)+"@"+c.terrain[0]);}
  return r;});
 check('мир родит и станы, и чудеса природы, все вне дорог и по своему рельефу',
  вМире.станов>0&&вМире.чудес>0&&вМире.наДороге===0&&!вМире.чужойРельеф.length,вМире);

 /* ── 3. Дела стана ── */
 const стан=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const м=НАЙТИ("camp","hunt")||НАЙТИ("camp");
  if(!м){r.нет=true;return r;}
  r.род=м.s.стан;G.x=м.x;G.y=м.y;G.place=null;
  G.hp=Math.max(1,G.hpMax-30);const было=G.hp,часБыл=Number(G.hour)||0,деньБыл=Number(G.day)||1;
  SAID.length=0;PLAYED.length=0;r.греться=CMD.camp("warm");await пауза(120);
  r.сказГреться=SAID.slice(-1)[0]||"";r.лечит=G.hp>было;
  r.часПошёл=((Number(G.hour)||0)!==часБыл)||((Number(G.day)||1)!==деньБыл);
  SAID.length=0;r.спрос=CMD.camp("ask");await пауза(120);
  r.сказСпрос=(SAID.slice(-1)[0]||"").slice(0,160);
  /* Сбыт: у охотников берут шкуру и кость дороже города. */
  const охот=НАЙТИ("camp","hunt");
  if(охот){G.x=охот.x;G.y=охот.y;
   G.inv=G.inv||{};G.inv["шкура"]=3;G.gold=100;
   SAID.length=0;r.сбыт=CMD.camp("sell");await пауза(120);
   r.сказСбыт=(SAID.slice(-1)[0]||"").slice(0,160);
   r.золотоВыросло=G.gold>100;r.шкурыУшли=!(Number(G.inv["шкура"])||0);
   SAID.length=0;CMD.camp("sell");await пауза(120);
   r.сбытПусто=(SAID.slice(-1)[0]||"").slice(0,120);
   /* Обещанное по делу стан не берёт: одно нажатие рвало поручение молча. */
   G.inv["шкура"]=5;G.inv["кость"]=2;G.gold=0;
   const дела=G.quests;
   G.quests=[{id:"проба",type:"fetch",res:"шкура",need:3,done:false,npc:"проба",text:"принеси шкуры"}];
   SAID.length=0;CMD.camp("sell");await пауза(120);
   r.сДелом=(SAID.slice(-1)[0]||"");
   r.шкурОсталось=Number(G.inv["шкура"])||0;r.костьОсталось=Number(G.inv["кость"])||0;
   SAID.length=0;CMD.camp("sell");await пауза(120);
   r.сДеломДважды=(SAID.slice(-1)[0]||"");
   G.quests=дела;delete G.inv["шкура"];}
  return r;});
 check('у стана греются час и получают здоровье, расспрашивают и слышат своё слово',
  !стан.нет&&стан.греться===true&&стан.лечит&&стан.часПошёл
  &&/Здоровье \+\d+/.test(стан.сказГреться)&&стан.спрос===true&&стан.сказСпрос.length>20,стан);
 check('охотникам сбывают шкуры: золото растёт, добыча уходит, а на пустую суму отвечают честно',
  стан.сбыт===true&&стан.золотоВыросло&&стан.шкурыУшли&&/у вас этого нет/.test(стан.сбытПусто||""),
  {сказ:стан.сказСбыт,пусто:стан.сбытПусто});
 check('обещанное по делу стан не берёт: три шкуры из пяти остаются, кость уходит, и об этом говорят',
  стан.шкурОсталось===3&&стан.костьОсталось===0
  &&/Обещанное по делу не тронуто: шкура ×3/.test(стан.сДелом||"")
  &&/свободного у вас нет/.test(стан.сДеломДважды||""),
  {сДелом:стан.сДелом,дважды:стан.сДеломДважды,шкур:стан.шкурОсталось});

 /* ── 4. Свои дела у своих станов ── */
 const свои=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const раз=НАЙТИ("camp","band");
  if(раз){G.x=раз.x;G.y=раз.y;G.gold=500;
   SAID.length=0;CMD.camp("pay");await пауза(120);
   r.мыто=(SAID.slice(-1)[0]||"");r.золотоУпало=G.gold<500;}
  const пал=НАЙТИ("camp","pilg");
  if(пал){G.x=пал.x;G.y=пал.y;G.mana=0;G.zoneTake={};
   SAID.length=0;CMD.camp("bless");await пауза(120);
   r.благо=(SAID.slice(-1)[0]||"");r.манаРосла=(Number(G.mana)||0)>0;
   SAID.length=0;CMD.camp("bless");await пауза(120);
   r.благоДважды=(SAID.slice(-1)[0]||"");}
  const вой=НАЙТИ("camp","army");
  if(вой){G.x=вой.x;G.y=вой.y;
   SAID.length=0;CMD.camp("war");await пауза(120);
   r.война=(SAID.filter(t=>/Полков|войны нет/.test(t)).slice(-1)[0]||SAID.slice(-1)[0]||"").slice(0,180);}
  const пог=НАЙТИ("camp","drov");
  if(пог){G.x=пог.x;G.y=пог.y;G.gold=100;G.hp=Math.max(1,G.hpMax-30);
   SAID.length=0;CMD.camp("feed");await пауза(120);
   r.корм=(SAID.slice(-1)[0]||"");r.кормЦена=G.gold===85;}
  /* Вне стана дела честно отказывают. */
  G.x=1;G.y=1;SAID.length=0;CMD.camp("warm");await пауза(120);
  r.вне=(SAID.slice(-1)[0]||"");
  return r;});
 check('разбойники берут мыто, паломники благословляют раз в сутки, войско говорит о войне, погонщики поят за пятнадцать',
  /Мыто уплачено/.test(свои.мыто||"")&&свои.золотоУпало
  &&/мана \+\d+/.test(свои.благо||"")&&свои.манаРосла&&/уже благословили/.test(свои.благоДважды||"")
  &&/война|войны нет/.test(свои.война||"")&&/Полков \d+/.test(свои.война||"")
  &&/здоровье \+\d+/.test(свои.корм||"")&&свои.кормЦена,свои);
 check('вне стана его дела честно отвечают, что стана здесь нет',
  /Стана здесь нет/.test(свои.вне||""),{вне:свои.вне});

 /* ── 5. Чудо отдаёт дар раз в сутки ── */
 const чудо=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const м=НАЙТИ("landmark");
  if(!м){r.нет=true;return r;}
  r.род=м.s.чудо;G.x=м.x;G.y=м.y;G.place=null;G.zoneTake={};
  G.hp=Math.max(1,G.hpMax-40);G.mana=0;G.inv=G.inv||{};
  const k=LANDMARK_BY_ID[r.род];const дар=k.дар;
  const hp0=G.hp,mana0=Number(G.mana)||0,res0=дар.res?(Number(G.inv[дар.res])||0):0;
  SAID.length=0;PLAYED.length=0;r.взяли=CMD.wonder();await пауза(150);
  r.сказ=SAID.slice(-1)[0]||"";
  r.далоHp=дар.hp?G.hp>hp0:true;
  r.далоMana=дар.mana?(Number(G.mana)||0)>mana0:true;
  r.далоRes=дар.res?(Number(G.inv[дар.res])||0)>res0:true;
  r.прозвучало=PLAYED.indexOf(k.звук)>=0;
  SAID.length=0;r.второй=CMD.wonder();await пауза(150);
  r.сказВторой=SAID.slice(-1)[0]||"";
  /* Назавтра снова отдаёт. */
  G.day=(Number(G.day)||1)+1;
  SAID.length=0;CMD.wonder();await пауза(150);
  r.назавтра=SAID.slice(-1)[0]||"";
  G.x=1;G.y=1;SAID.length=0;CMD.wonder();await пауза(120);
  r.вне=SAID.slice(-1)[0]||"";
  return r;});
 check('чудо природы отдаёт свой дар, звучит своей записью и во второй раз за сутки честно отказывает',
  !чудо.нет&&чудо.взяли===true&&чудо.далоHp&&чудо.далоMana&&чудо.далоRes&&чудо.прозвучало
  &&/уже отдал своё/.test(чудо.сказВторой||"")&&!/уже отдал своё/.test(чудо.назавтра||"")
  &&/Чуда природы здесь нет/.test(чудо.вне||""),чудо);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

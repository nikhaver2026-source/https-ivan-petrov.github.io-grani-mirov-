/* ════════════════════════════════════════════════════════════════════════
   НАБОР 80: ТЯЖЕСТЬ И ВРЕМЯ

   Управление тяжестью и временем было двумя работами: убавить вес и
   остановить час. Спецификация просит больше — вес, давление, движение
   вещей, пространственные постройки; замедление, ускорение, фиксацию,
   сохранение состояния и чтение временных следов, — и просит, чтобы всё
   это было редким, затратным и ограниченным.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Работ стало девять, и каждая закрывает свой пункт списка.
   2. Они дорогие: высокие ступени, большая плата припасом и временем.
   3. Каждый буфф и вправду что-то меняет: гнёт гасит чужой удар, скорость
      укорачивает час, свод разгоняет тварей.
   4. Толчок снимает найденную ловушку, но не берёт чары.
   5. Слепок часа снимается, возвращается один раз и переживает сохранение.
   6. След времени читает то, что мир и вправду помнит, а на пустом ярусе
      честно говорит, что следа нет.
   ════════════════════════════════════════════════════════════════════════ */
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

 /* ── 1 и 2. Список работ ── */
 const список=await page.evaluate(()=>{
  const ф=TECHS.filter(t=>t.маст==="flux");
  const надо=["lighten","press","throw","arch","still","haste","keep","recall","echoes"];
  return {всего:ф.length,нет:надо.filter(id=>!TECH_BY_ID[id]),
   ступени:ф.map(t=>t.ур).sort(),
   безОбъяснения:ф.filter(t=>!t.о||String(t.о).length<30).map(t=>t.id),
   безЗвука:ф.filter(t=>!SOUND_BANK[t.звук]).map(t=>t.id),
   безВремени:ф.filter(t=>!(t.время>0)).map(t=>t.id),
   дорогие:ф.filter(t=>t.ур>=3).length,
   станки:[...new Set(ф.flatMap(t=>t.станки))]};});
 check('работ тяжести и времени девять, и каждая на месте',
  список.всего>=9&&список.нет.length===0,список);
 check('у каждой своё объяснение, свой звук и своё время',
  список.безОбъяснения.length===0&&список.безЗвука.length===0&&список.безВремени.length===0,список);
 check('они редки и дороги: больше половины требуют третьей ступени и выше, и делаются только у шара и круга',
  список.дорогие>=4&&список.станки.every(s=>["orb","circle"].indexOf(s)>=0),список);

 /* ── 3. Буффы и вправду меняют мир ── */
 const буффы=await page.evaluate(()=>{
  /* Гнёт: чужой удар доходит вполсилы. Меряем на самой формуле урона. */
  G.buffs={};G.hp=G.hpMax=300;G.mana=G.manaMax=300;
  /* Бьёмся по-настоящему: тварь неубиваемая, чтобы схватка не кончалась,
     и здоровье возвращается перед каждым замахом. Меряем, сколько снимут. */
  const бой=(флаг)=>{
   G.buffs={};if(флаг)buffSet(флаг,6);
   G.weaponDrawn=true;G.alt=0;G.place=null;
   const m={id:"proba",n:"Проба",dmg:40,def:0,hp:999999,snd:"mgrowl",fx:"growl",
    xp:1,gold:1,biomes:[],max:5,о:"проба"};
   startCombat({x:G.x,y:G.y,monster:m},{alt:0});
   let всего=0;
   for(let i=0;i<20;i++){
    G.hp=1000;G.hpMax=1000;
    try{fight("atk");}catch(e){}
    всего+=Math.max(0,1000-G.hp);}
   G.inCombat=false;G.combat=null;G.hp=G.hpMax;
   return всего;};
  const хук=String(fight).indexOf('buffActive("гнёт")')>=0;
  const без=бой(null),сГнётом=бой("гнёт");
  /* Скорость: час короче. */
  G.buffs={};G.day=5;G.hour=0;
  propTime(2);const обычно=G.hour;
  G.hour=0;buffSet("скорость",3);propTime(2);const быстро=G.hour;
  G.buffs={};
  /* Свод: тварей вчетверо меньше. Мерить надо там, где они вообще водятся:
     посреди океана их нет и без всякого свода. */
  /* Спрашивать надо через клетку мира: beastAt берёт ещё содержимое клетки
     и базовую долю, а клетки кэшируются — иначе второй проход вернул бы
     первый ответ и свод «не работал» бы на ровном месте. */
  G.place=null;G.buffs={};
  const счёт=(bx,by,сколько)=>{
   contentCache.clear();
   let k=0;
   for(let i=0;i<сколько;i++){
    const x=bx+(i%50)*5,y=by+Math.floor(i/50)*5;
    const c=safeFn(()=>cellContent(x,y),null);
    if(c&&c.monster)k++;}
   return k;};
  let поле=null;
  for(let b=0;b<40&&!поле;b++){
   const bx=3000+b*811,by=2500+b*977;
   if(счёт(bx,by,400)>=15)поле=[bx,by];}
  const безСвода=поле?счёт(поле[0],поле[1],2500):0;
  buffSet("свод",6);
  const подСводом=поле?счёт(поле[0],поле[1],2500):0;
  G.buffs={};contentCache.clear();
  return {без,сГнётом,хук,гнётДержит:хук&&сГнётом<без,обычно,быстро,часКороче:быстро<обычно,
   поле,безСвода,подСводом,сводДержит:!!поле&&подСводом<безСвода};});
 check('прибавленная тяжесть гасит чужой удар',буффы.гнётДержит,буффы);
 check('ускоренный час и вправду короче',буффы.часКороче,буффы);
 check('под сведённым сводом тварей заметно меньше',
  буффы.сводДержит&&буффы.подСводом<=буффы.безСвода*0.5,буффы);
 check('поле для замера нашлось: твари в мире водятся и без свода',
  !!буффы.поле&&буффы.безСвода>0,буффы);

 /* ── 4. Толчок снимает механизм, но не чары ── */
 const толчок=await page.evaluate(()=>{
  G.mast={flux:{ур:5,оп:0,дел:0}};
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:14,x:1,y:1};
  const l=curLevel();
  const найти=(чары)=>{
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
    const т=trapAt(x,y);
    if(!т)continue;
    if(чары?т.вид!=="чары":т.вид==="чары")continue;
    return [x,y,т];}
   return null;};
  const итог={};
  const мех=найти(false);
  if(мех){
   G.marks={};G.place.x=мех[0];G.place.y=мех[1];
   setPlaceMark(мех[0],мех[1],"trap_on");           /* нашли её заранее */
   G.inv={"кристалл":9};
   const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
   techDo(TECH_BY_ID.throw,"orb");
   Speech.say=был;
   итог.механизм={состояние:trapAt(мех[0],мех[1]).состояние,
    сказало:/разведена|не взведена/i.test(сказ.join(" "))};}
  const чары=найти(true);
  if(чары){
   G.marks={};G.place.x=чары[0];G.place.y=чары[1];
   setPlaceMark(чары[0],чары[1],"trap_on");
   G.inv={"кристалл":9};
   const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
   techDo(TECH_BY_ID.throw,"orb");
   Speech.say=был;
   итог.чары={состояние:trapAt(чары[0],чары[1]).состояние,
    объяснило:/не поддаётся|рукой/i.test(сказ.join(" "))};}
  /* И без найденной ловушки он честно говорит, что толкать нечего. */
  G.marks={};
  const сказ2=[];const был2=Speech.say;Speech.say=(t,o)=>{сказ2.push(String(t));return был2.call(Speech,t,o);};
  G.inv={"кристалл":9};
  techDo(TECH_BY_ID.throw,"orb");
  Speech.say=был2;
  итог.впустую=/толкать нечего/i.test(сказ2.join(" "));
  G.place=null;
  return итог;});
 check('толчок снимает найденный механизм и говорит об этом',
  толчок.механизм&&толчок.механизм.состояние==="обезврежена"&&толчок.механизм.сказало,толчок);
 check('чары толчком не берутся, и это объяснено',
  !толчок.чары||(толчок.чары.состояние!=="обезврежена"&&толчок.чары.объяснило),толчок);
 check('без найденной ловушки толчок честно говорит, что толкать нечего',толчок.впустую,толчок);

 /* ── 5. Слепок часа ── */
 const слепок=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  /* У всякой работы есть доля срыва. Здесь меряется не она, а слепок,
     поэтому жребий на время замера убран: иначе набор падал бы раз в восемь. */
  const rnd=Math.random;Math.random=()=>0.999;
  G.mast={flux:{ур:5,оп:0,дел:0}};G.place=null;
  G.flux=null;
  G.hp=G.hpMax=200;G.mana=G.manaMax=200;G.water=200;
  /* Без слепка возвращать нечего. */
  const n0=сказ.length;
  techDo(TECH_BY_ID.recall,"orb");
  const пусто=/возвращать нечего/i.test(сказ.slice(n0).join(" "));
  /* Снимаем. */
  G.inv={"кристалл":9,"самоцвет":9};
  techDo(TECH_BY_ID.keep,"orb");
  const снят=!!G.flux,вСлепке=G.flux&&G.flux.hp;
  /* Тратим себя. */
  G.hp=40;G.mana=10;G.water=30;
  saveGame(true);
  const d=JSON.parse(localStorage.getItem(SAVE_KEY));
  const вСейве=!!(d&&d.flux&&d.flux.hp===вСлепке);
  techDo(TECH_BY_ID.recall,"orb");
  const вернулось={hp:G.hp,mana:Math.round(G.mana),water:G.water};
  const истрачен=!G.flux;
  const n1=сказ.length;
  techDo(TECH_BY_ID.recall,"orb");
  const второйРаз=/возвращать нечего/i.test(сказ.slice(n1).join(" "));
  Math.random=rnd;Speech.say=был;
  return {пусто,снят,вСлепке,вСейве,вернулось,истрачен,второйРаз};});
 check('без слепка возвращать нечего, и об этом говорят',слепок.пусто,слепок);
 check('слепок снимается, переживает сохранение и возвращает тело в тот час',
  слепок.снят&&слепок.вСейве&&слепок.вернулось.hp===слепок.вСлепке,слепок);
 check('слепок один: после возврата он истрачен',слепок.истрачен&&слепок.второйРаз,слепок);

 /* ── 6. След времени ── */
 const след=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.mast={flux:{ур:5,оп:0,дел:0}};
  G.place={kind:"dungeon",bx:1400,by:1400,stype:"ruins",name:"Низ",depth:5,x:2,y:2};
  G.marks={};G.stash={};
  const n0=сказ.length;
  techDo(TECH_BY_ID.echoes,"orb");
  const наПустом=/след пуст/i.test(сказ.slice(n0).join(" "));
  /* Наследим: убитый, открытая дверь, снятая ловушка, вынутый тайник. */
  setPlaceMark(3,3,"dead");setPlaceMark(4,4,"open");setPlaceMark(5,5,"trap_off");
  G.stash[`1400,1400,5,6,6`]="взят";
  const n1=сказ.length;
  techDo(TECH_BY_ID.echoes,"orb");
  const т=сказ.slice(n1).join(" ");
  /* На другом ярусе след другой: чужие метки сюда не приходят. */
  G.place.depth=9;
  const n2=сказ.length;
  techDo(TECH_BY_ID.echoes,"orb");
  const другой=/след пуст/i.test(сказ.slice(n2).join(" "));
  Speech.say=был;G.place=null;
  return {наПустом,прочло:/пало 1/.test(т)&&/открыто 1/.test(т)
   &&/вынуто из тайников 1/.test(т)&&/ловушек снято 1/.test(т),текст:т.slice(0,180),другой};});
 check('на нетронутом ярусе след времени честно говорит, что следа нет',след.наПустом,след);
 check('след читает то, что мир и вправду помнит: павших, открытое, снятое и вынутое',
  след.прочло,след);
 check('на другом ярусе след свой: чужие метки сюда не приходят',след.другой,след);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();

/* ════════════════════════════════════════════════════════════════════════
   НАБОР 81: АЛТАРЬ КАК ПОЛНОЦЕННЫЙ ОБЪЕКТ

   Алтарь был кнопкой «помолиться» с одним исключением на реликвию. Он не
   отличался от алтаря на соседнем ярусе, не помнил, кому посвящён, и не
   замечал ни того, кто подошёл, ни дня, в который подошли.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Видов шесть, у каждого свой набор дел, и вид выводится из места.
   2. Условий тринадцать, и у каждого есть имя и объяснение, чего не хватает.
   3. «Проверить ауру» — ключ к доступности: она читает и сошедшееся, и
      несошедшееся, и называет, сколько нужно до благословения.
   4. Приношение берёт припас и растит благосклонность; без припаса отказ
      называет, что кладут.
   5. Благословение не даётся при разбитой печати и при недоборе условий, и
      отказ называет, чего именно не хватает; даётся раз в день.
   6. Печать чинится руной и камнем — и только тем, кто умеет.
   7. Артефакт насыщается один раз; обряд требует ступени и маны; жертва
      берёт кровь и платит благосклонностью покровителя.
   8. Ни одно действие не молчит, и алтарь в списке объектов называет вид,
      бога и состояние печати.
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

 /* ── 1. Виды ── */
 const виды=await page.evaluate(()=>{
  const плохие=Object.keys(ALTAR_KIND).filter(k=>{
   const z=ALTAR_KIND[k];
   return !z.n||!z.о||!Array.isArray(z.дела)||z.дела.length<4;});
  const где=(stype,depth,dark)=>{
   const был=G.dark;G.dark=!!dark;
   G.place={kind:"house",bx:1100,by:1200,stype,name:"П",depth,x:2,y:2};
   const k=altarKind(2,2);G.dark=был;return k;};
  return {всего:Object.keys(ALTAR_KIND).length,плохие,
   храм:где("temple",0),клан:где("clanhall",0),башня:где("tower",0),
   глубина:где("ruins",12),тьма:где("shrine",0,true),поле:(()=>{G.place=null;return altarKind(1,1);})(),
   дел:[...new Set(Object.values(ALTAR_KIND).flatMap(z=>z.дела))].length};});
 check('видов алтарей шесть, и у каждого имя, описание и свой набор дел',
  виды.всего>=6&&виды.плохие.length===0&&виды.дел>=8,виды);
 check('вид выводится из места: в храме храмовый, в клановом доме клановый, в башне рунный, в глубине погребальный, за Гранью жертвенник',
  виды.храм==="temple"&&виды.клан==="clan"&&виды.башня==="rune"
  &&виды.глубина==="grave"&&виды.тьма==="blood"&&виды.поле==="wild",виды);

 /* ── 2 и 3. Условия и аура ── */
 const аура=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"house",bx:1100,by:1200,stype:"temple",name:"Храм",depth:0,x:2,y:2};
  G.propMarks={};
  const a=altarAt(2,2);
  const усл=altarConds(a);
  const плохие=усл.filter(c=>!c.id||!c.n||!c.надо||typeof c.ок!=="boolean").map(c=>c.id||"?");
  /* Без ремесла ауру не прочесть. */
  G.mast={};
  const n0=сказ.length;
  IACT.altaura.делать({плитка:"A",x:2,y:2,n:"алтарь"});
  const безРемесла=/без ремесла|первый урок/i.test(сказ.slice(n0).join(" "));
  /* С ремеслом — читает всё. */
  G.mast={arte:{ур:2,оп:0,дел:0}};
  const n1=сказ.length;
  IACT.altaura.делать({плитка:"A",x:2,y:2,n:"алтарь"});
  const t=сказ.slice(n1).join(" ");
  Speech.say=был;
  return {условий:усл.length,плохие,безРемесла,
   читает:/Сошлось/.test(t)&&/Не сошлось/.test(t),
   называетПорог:/нужно \d+ услови/i.test(t),
   объясняет:/—/.test(t),текст:t.slice(0,200)};});
 check('условий тринадцать, и у каждого имя и объяснение, чего не хватает',
  аура.условий>=13&&аура.плохие.length===0,аура);
 check('без ремесла ауру не прочесть, и это объяснено',аура.безРемесла,аура);
 check('аура читает и сошедшееся, и несошедшееся, и называет порог благословения',
  аура.читает&&аура.называетПорог&&аура.объясняет,аура);

 /* ── 4. Приношение ── */
 const дар=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"house",bx:1100,by:1200,stype:"temple",name:"Храм",depth:0,x:2,y:2};
  const a=altarAt(2,2);
  G.inv={};G.faith={};
  const n0=сказ.length;
  IACT.altoffer.делать({плитка:"A",x:2,y:2,n:"алтарь"});
  const пусто=/кладут|нечего/i.test(сказ.slice(n0).join(" "));
  G.inv={"самоцвет":2};
  const вераДо=godFavor(a.бог.id);
  IACT.altoffer.делать({плитка:"A",x:2,y:2,n:"алтарь"});
  Speech.say=был;
  return {пусто,припас:Number(G.inv["самоцвет"])||0,
   вера:godFavor(a.бог.id)-вераДо};});
 check('без припаса приношение отказывает и называет, что кладут',дар.пусто,дар);
 check('приношение берёт припас и растит благосклонность',
  дар.припас===1&&дар.вера>0,дар);

 /* ── 5 и 6. Печать и благословение ── */
 const печать=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  /* Найдём алтарь с разбитой печатью. */
  let место=null;
  for(let i=0;i<80&&!место;i++){
   G.place={kind:"house",bx:1000+i*67,by:900+i*89,stype:"temple",name:"Храм",depth:0,x:2,y:2};
   G.propMarks={};
   const a=altarAt(2,2);
   if(a.печать==="сломана")место=[G.place.bx,G.place.by];}
  if(!место){Speech.say=был;return {нет:true};}
  const o={плитка:"A",x:2,y:2,n:"алтарь"};
  /* Благословения на разбитой печати нет. */
  const n0=сказ.length;
  IACT.altbless.делать(o);
  const наРазбитой=/[Пп]ечать разбита/.test(сказ.slice(n0).join(" "));
  /* Чинить без ступени нельзя. */
  G.mast={};G.inv={"камень":9};
  const n1=сказ.length;
  IACT.altseal.делать(o);
  const безСтупени=/втор(ая|ой) ступен/i.test(сказ.slice(n1).join(" "));
  /* И без камня нельзя. */
  G.mast={runes:{ур:3,оп:0,дел:0}};G.inv={};
  const n2=сказ.length;
  IACT.altseal.делать(o);
  const безКамня=/камн/i.test(сказ.slice(n2).join(" "));
  /* А с тем и другим — чинится. */
  G.inv={"камень":9};
  IACT.altseal.делать(o);
  const цела=altarAt(2,2).печать==="цела";
  const камняУбыло=(Number(G.inv["камень"])||0)===7;
  /* Условий мало — благословения всё равно нет, и отказ называет числа. */
  G.patron=null;G.faith={};G.mast={};G.artifacts=[];G.inv={};
  const n3=сказ.length;
  IACT.altbless.делать(o);
  const мало=/сошлось \d+ услови/i.test(сказ.slice(n3).join(" "));
  /* Наберём условий и получим благословение. */
  const a=altarAt(2,2);
  G.patron=a.бог.id;G.faith={};G.faith[a.бог.id]=10;
  G.mast={runes:{ур:2,оп:0,дел:0},arte:{ур:2,оп:0,дел:0}};
  G.inv={"кристалл":3};G.artifacts=[{ранг:2,кач:2,дом:"run"}];
  G.rep={};RACES_DB.filter(r=>r.god===a.бог.id).forEach(r=>{G.rep[r.id]=10;});
  G.diplo={};G.demon={изучены:{},договор:null,одержим:null};
  G.hp=Math.round(G.hpMax*0.4);G.buffs={};
  const сошлось=altarMet(a);
  const дало=(()=>{const n=сказ.length;IACT.altbless.делать(o);
   return {текст:сказ.slice(n).join(" "),буфф:buffActive("благословение"),hp:G.hp};})();
  const n4=сказ.length;
  IACT.altbless.делать(o);
  const дваждыВдень=/уже благословил/i.test(сказ.slice(n4).join(" "));
  Speech.say=был;
  return {наРазбитой,безСтупени,безКамня,цела,камняУбыло,мало,сошлось,
   благословило:дало.буфф,подлечило:дало.hp>Math.round(G.hpMax*0.4),дваждыВдень};});
 check('на разбитой печати благословения нет, и об этом говорят',
  !печать.нет&&печать.наРазбитой,печать);
 check('печать чинит только тот, кто умеет, и только по камню',
  печать.безСтупени&&печать.безКамня,печать);
 check('с руной и камнем печать восстанавливается, и камень уходит',
  печать.цела&&печать.камняУбыло,печать);
 check('при недоборе условий благословения нет, и отказ называет числа',печать.мало,печать);
 check('когда условия набраны, алтарь благословляет: буфф, лечение — и не дважды в день',
  печать.сошлось>=6&&печать.благословило&&печать.подлечило&&печать.дваждыВдень,печать);

 /* ── 7. Артефакт, обряд, жертва ── */
 const прочее=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const итог={};
  /* Артефакт: насыщается один раз. */
  let храм=null;
  for(let i=0;i<80&&!храм;i++){
   G.place={kind:"house",bx:1000+i*67,by:900+i*89,stype:"temple",name:"Храм",depth:0,x:2,y:2};
   G.propMarks={};
   if(altarAt(2,2).печать==="цела")храм=[G.place.bx,G.place.by];}
  const o={плитка:"A",x:2,y:2,n:"алтарь"};
  if(храм){
   G.artifacts=[{ранг:2,кач:2,дом:"run",имя:"Проба"}];
   G.mast={arte:{ур:3,оп:0,дел:0}};
   IACT.altartefact.делать(o);
   const после=Object.assign({},G.artifacts[0]);
   const n=сказ.length;
   IACT.altartefact.делать(o);
   итог.артефакт={кач:после.кач,второй:/уже отдал/i.test(сказ.slice(n).join(" "))};}
  /* Обряд: ступень и мана. */
  G.mast={};G.mana=G.manaMax=200;
  const n1=сказ.length;
  IACT.altrite.делать(o);
  итог.обрядБезСтупени=/втор(ая|ой) ступен/i.test(сказ.slice(n1).join(" "));
  G.mast={arte:{ур:3,оп:0,дел:0}};G.mana=5;
  const n2=сказ.length;
  IACT.altrite.делать(o);
  итог.обрядБезМаны=/маны/i.test(сказ.slice(n2).join(" "));
  G.mana=200;G.buffs={};G.faith={};G.hp=Math.round(G.hpMax*0.5);
  IACT.altrite.делать(o);
  итог.обряд={буфф:buffActive("благословение"),мана:G.mana<200};
  /* Жертвенник: тёмный обряд и жертва. */
  G.dark=false;
  G.place={kind:"house",bx:1500,by:1600,stype:"shrine",name:"Капище",depth:0,x:2,y:2};
  const ж=altarAt(2,2);
  G.hp=G.hpMax=200;G.darkFaith={};G.patron=null;
  IACT.altsacrifice.делать(o);
  итог.жертва={кровь:G.hp<200,тьма:Object.values(G.darkFaith||{}).reduce((a,b)=>a+b,0)>0,
   вид:ж.вид,буфф:buffActive("ярость_камня")};
  /* У жертвенника нет благословения, а у храмового нет жертвы. */
  итог.делаРазные=!altarCan(ж,"bless")&&altarCan(ж,"sacrifice");
  Speech.say=был;
  return итог;});
 check('артефакт на алтаре насыщается, и только один раз',
  прочее.артефакт&&прочее.артефакт.кач===3&&прочее.артефакт.второй,прочее);
 check('обряд требует ступени и маны, а с ними даёт благословение',
  прочее.обрядБезСтупени&&прочее.обрядБезМаны&&прочее.обряд.буфф&&прочее.обряд.мана,прочее);
 check('жертвенник берёт кровь и платит тёмной благосклонностью',
  прочее.жертва.вид==="blood"&&прочее.жертва.кровь&&прочее.жертва.тьма&&прочее.жертва.буфф,прочее);
 check('дела у видов разные: у жертвенника нет благословения, а жертва есть только у него',
  прочее.делаРазные,прочее);

 /* ── 8. Слышно и видно ── */
 const слышно=await page.evaluate(()=>{
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"house",bx:1100,by:1200,stype:"temple",name:"Храм",depth:0,x:2,y:2};
  G.propMarks={};G.mast={arte:{ур:2,оп:0,дел:0},runes:{ур:2,оп:0,дел:0}};
  G.inv={"трава":5,"камень":5};G.mana=G.manaMax=200;G.artifacts=[];
  const o={плитка:"A",x:2,y:2,n:"алтарь"};
  const немые=[];
  for(const id of ["altstudy","altread","altaura","altoffer","altbless","altrite","altmech"]){
   if(!IACT[id])continue;
   const з=звуки.length,р=сказ.length;
   safeFn(()=>IACT[id].делать(o));
   if(звуки.length===з||сказ.length===р)немые.push(id);}
  /* Алтарь в списке объектов называет себя. */
  const l=curLevel();
  let есть=null;
  for(let y=0;y<l.h&&!есть;y++)for(let x=0;x<l.w&&!есть;x++)if(tileAt(l,x,y)==="A")есть=[x,y];
  let карточка=null;
  if(есть){G.place.x=есть[0];G.place.y=есть[1];
   const ob=objectsHere().find(z=>z.плитка==="A");
   if(ob)карточка={n:ob.n,сост:ob.состояние,ids:actionsFor(ob).map(a=>a.id)};}
  Bank.play=bp;Speech.say=был;
  return {немые,карточка};});
 check('ни одно действие алтаря не молчит',слышно.немые.length===0,слышно);
 check('алтарь в списке объектов называет вид, бога и состояние печати',
  слышно.карточка&&/\(/.test(слышно.карточка.n)&&/печать/.test(String(слышно.карточка.сост)),слышно);
 check('у алтаря в списке действий и вправду много дел, а не одно',
  слышно.карточка&&слышно.карточка.ids.filter(i=>i.indexOf("alt")===0).length>=5,слышно);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();

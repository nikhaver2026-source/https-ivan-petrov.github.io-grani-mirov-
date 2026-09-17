/* ════════════════════════════════════════════════════════════════════════
   НАБОР 79: ОДНА И ТА ЖЕ ВЕЩЬ — РАЗНЫЕ ДЕЙСТВИЯ

   Список действий у вещи был один и тот же всюду: стол в мастерской кузнеца
   и стол в заброшенной лаборатории отвечали одинаково. Обстановка ничего не
   рассказывала о месте, а место — об обстановке.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. У вещи есть состояние, и оно выводится из места, а не хранится:
      в мастерской чаще рабочие, в руинах и под землёй — брошенные.
   2. Состояние меняет список действий: повреждённую чинят, брошенную
      обыскивают, вещь с наговором читают.
   3. Стол мастера сам становится станком, а повреждённый станок им быть
      перестаёт: сломанным горном не работают.
   4. Каждое из трёх новых действий и вправду меняет мир и говорит словами.
   5. Сделанное помнится: починенная не ломается заново, обобранная не
      отдаёт припас второй раз, наговор не читают дважды.
   6. Осмотр называет состояние вслух — иначе незрячий о нём не узнает.
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

 /* ── 1. Состояние выводится из места ── */
 const места=await page.evaluate(()=>{
  const счёт=(stype,depth)=>{
   const c={};
   for(let i=0;i<24;i++){
    G.place={kind:"house",bx:900+i*97,by:800+i*131,stype,name:"П",depth,x:1,y:1};
    const l=curLevel();if(!l)continue;
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
     if(tileAt(l,x,y)!=="X")continue;
     const с=propState(x,y);c[с]=(c[с]||0)+1;}}
   return c;};
  const кузня=счёт("forge",0),руины=счёт("ruins",0),низ=счёт("ruins",7),село=счёт("village",0);
  /* Одно и то же место всегда даёт то же состояние: кости не бросают. */
  G.place={kind:"house",bx:1234,by:5678,stype:"forge",name:"П",depth:0,x:1,y:1};
  const a=propState(5,5),b=propState(5,5);
  G.place=null;
  return {кузня,руины,низ,село,повтор:a===b,
   всегоСостояний:Object.keys(PROP_STATE).length};});
 check('состояний пять, и одно и то же место всегда даёт то же самое',
  места.всегоСостояний===5&&места.повтор,места);
 check('в мастерской чаще рабочие вещи, в руинах и под землёй — брошенные',
  (места.кузня.master||0)>0&&(места.руины.abandoned||0)>0&&(места.низ.abandoned||0)>0
  &&(места.кузня.abandoned||0)===0,места);
 check('повреждённые и с наговором попадаются всюду, но редко',
  (места.село.broken||0)>0&&(места.село.magic||0)>0
  &&(места.село.broken||0)<(места.село.plain||0)+(места.село.master||0)+1,места);

 /* ── 2 и 3. Состояние меняет список действий ── */
 const действия=await page.evaluate(()=>{
  G.mast={runes:{ур:3,оп:0,дел:0},smith:{ур:3,оп:0,дел:0}};
  G.propMarks={};
  const найти=(состояние)=>{
   for(let i=0;i<60;i++){
    for(const st of ["forge","ruins","village","school","tavern"]){
     for(const d of [0,0,6]){
      G.place={kind:"house",bx:900+i*97,by:800+i*131,stype:st,name:"П",depth:d,x:1,y:1};
      const l=curLevel();if(!l)continue;
      for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
       if(tileAt(l,x,y)!=="X")continue;
       if(propStateNow(x,y)!==состояние)continue;
       G.place.x=x;G.place.y=y;
       const o=objectsHere().find(z=>z.x===x&&z.y===y&&z.плитка==="X");
       if(o)return {o,ids:actionsFor(o).map(a=>a.id),место:[st,d,x,y]};}}}}
   return null;};
  const b=найти("broken"),a=найти("abandoned"),m=найти("magic"),ms=найти("master");
  return {
   broken:b&&{ids:b.ids,станок:!!b.o.станок,сост:b.o.состояние},
   abandoned:a&&{ids:a.ids,сост:a.o.состояние},
   magic:m&&{ids:m.ids,сост:m.o.состояние},
   master:ms&&{ids:ms.ids,станок:ms.o.станок,вещь:ms.o.вещь}};});
 check('у повреждённой вещи есть «Починить», и станком она быть перестаёт',
  действия.broken&&действия.broken.ids.includes("repair")&&!действия.broken.станок,действия.broken);
 check('у брошенной есть «Поискать остатки», у вещи с наговором — «Прочесть наговор»',
  действия.abandoned&&действия.abandoned.ids.includes("salvage")
  &&действия.magic&&действия.magic.ids.includes("attune"),
  {abandoned:действия.abandoned,magic:действия.magic});
 check('лишнего не предлагают: у брошенной нет «Починить», у повреждённой нет «Поискать остатки»',
  !действия.abandoned.ids.includes("repair")&&!действия.broken.ids.includes("salvage"),действия);
 check('состояние вещи названо словами, а не только числом',
  /—/.test(String(действия.broken.сост))&&/—/.test(String(действия.abandoned.сост)),действия);

 /* ── 4 и 5. Действия меняют мир и помнятся ── */
 const дело=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  G.mast={runes:{ур:3,оп:0,дел:0},smith:{ур:3,оп:0,дел:0}};
  G.propMarks={};G.comps={};
  const найти=(состояние)=>{
   for(let i=0;i<60;i++)for(const st of ["forge","ruins","village","school"])for(const d of [0,6]){
    G.place={kind:"house",bx:900+i*97,by:800+i*131,stype:st,name:"П",depth:d,x:1,y:1};
    const l=curLevel();if(!l)continue;
    for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
     if(tileAt(l,x,y)!=="X")continue;
     if(propStateNow(x,y)!==состояние)continue;
     G.place.x=x;G.place.y=y;return [x,y];}}
   return null;};
  const итог={};
  /* Починка. */
  const b=найти("broken");
  if(b){
   G.inv={};
   const безПрипаса=(()=>{const n=сказ.length;IACT.repair.делать({n:"стол",x:b[0],y:b[1],вид:"tile",плитка:"X"});
    return сказ.length>n&&/чинить нечем|Нужно/i.test(сказ.slice(n).join(" "));})();
   G.inv={"дерево":5};
   const доИнв=Number(G.inv["дерево"])||0;
   IACT.repair.делать({n:"стол",x:b[0],y:b[1],вид:"tile",плитка:"X"});
   итог.починка={безПрипаса,припасУшёл:(Number(G.inv["дерево"])||0)<доИнв,
    стало:propStateNow(b[0],b[1]),
    ещёМожно:IACT.repair.можно({вид:"tile",плитка:"X",x:b[0],y:b[1]})};}
  /* Остатки. */
  const a=найти("abandoned");
  if(a){
   G.inv={};
   IACT.salvage.делать({n:"ларь",x:a[0],y:a[1],вид:"tile",плитка:"X"});
   const первый=Object.values(G.inv).reduce((s,v)=>s+v,0);
   IACT.salvage.делать({n:"ларь",x:a[0],y:a[1],вид:"tile",плитка:"X"});
   const второй=Object.values(G.inv).reduce((s,v)=>s+v,0);
   итог.остатки={первый,второй,второйПуст:второй===первый};}
  /* Наговор. */
  const m=найти("magic");
  if(m){
   G.mast={};
   const n0=сказ.length;
   IACT.attune.делать({n:"скрижаль",x:m[0],y:m[1],вид:"tile",плитка:"X"});
   const безУрока=/не разобрать|первый урок/i.test(сказ.slice(n0).join(" "));
   G.mast={runes:{ур:3,оп:0,дел:0}};
   const опДо=mastOf("runes").оп,xpДо=G.xp;
   IACT.attune.делать({n:"скрижаль",x:m[0],y:m[1],вид:"tile",плитка:"X"});
   const n1=сказ.length;
   IACT.attune.делать({n:"скрижаль",x:m[0],y:m[1],вид:"tile",плитка:"X"});
   итог.наговор={безУрока,мастерство:mastOf("runes").оп>опДо||G.level>1,опыт:G.xp>xpДо||G.level>1,
    второйРаз:/уже разобрали/i.test(сказ.slice(n1).join(" "))};}
  /* Сохранение. */
  saveGame(true);
  const d=JSON.parse(localStorage.getItem(SAVE_KEY));
  итог.вСейве=!!(d&&d.propMarks&&Object.keys(d.propMarks).length>0);
  итог.звучало=звуки.length>0;
  Bank.play=bp;Speech.say=был;
  G.place=null;
  return итог;});
 check('починка требует припаса, берёт его и вправду чинит вещь',
  дело.починка&&дело.починка.безПрипаса&&дело.починка.припасУшёл
  &&дело.починка.стало==="master"&&!дело.починка.ещёМожно,дело.починка);
 check('брошенная отдаёт припас один раз, во второй — только труху',
  дело.остатки&&дело.остатки.первый>0&&дело.остатки.второйПуст,дело.остатки);
 check('наговор не читается без урока, а с уроком растит мастерство и не читается дважды',
  дело.наговор&&дело.наговор.безУрока&&дело.наговор.мастерство&&дело.наговор.второйРаз,дело.наговор);
 check('всё это звучит и помнится в сохранении',дело.звучало&&дело.вСейве,дело);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 144: ЧЕТЫРНАДЦАТЬ РОДОВ ПОДЗЕМЕЛЬЯ (§14 брифа)

   §14 брифа перечисляет четырнадцать родов: шахта, катакомбы, древний
   храм, башня, подземный город, лаборатория, некрополь, крепость,
   гробница, разлом, живое, водное, воздушное, временное. Подземелье было
   одно на всех, и как его назовут, решала дверь наверху.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Четырнадцать родов, у каждого имя, суть, примета, запись и три-четыре
      своих голоса — живые записи, а не инструменты.
   2. Свои твари существуют в бестиарии, своя добыча — настоящие ресурсы.
   3. Перекос планировки ссылается только на поля, которые Gen.plan знает.
   4. Род выводится из координат подземелья, а не из двери наверху: он
      одинаков при повторном спросе и одинаков для руин и зева пещеры на
      том же месте, но разный у соседних мест.
   5. Рода нет там, где нет подземелья: подвал под таверной — не род.
   6. На большой выборке встречаются все четырнадцать: ни один не мёртв.
   7. Имя рода стоит в названии места, и оно меняется от места к месту.
   8. Голоса рода ложатся ПОВЕРХ общего набора подземелья, а не вместо.
   9. Свои твари идут чаще прочих, но чужие не исчезают.
  10. Жила отдаёт то, чем это место богато.
  11. Перекос планировки доходит до Gen.plan и не упирается в прежний предел.
  12. Примета звучит при входе.
  13. Самопроверка мира держит строку «dkinds»; модуль, глава, README, docs.
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
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1–3. Состав ── */
 const состав=await page.evaluate(()=>{
  const инстр=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const роли=k=>[k.звук].concat((k.голоса||[]).map(([r])=>r));
  return {
   родов:DUNGEON_KINDS.length,
   нет:["mine","catacomb","temple","tower","undercity","lab","necropolis","fort",
        "tomb","rift","living","water","air","time"].filter(id=>!DUNGEON_KIND_BY_ID[id]),
   безПолей:DUNGEON_KINDS.filter(k=>!k.n||!k.о||!k.примета||!SOUND_BANK[k.звук]).map(k=>k.id),
   малоГолосов:DUNGEON_KINDS.filter(k=>(k.голоса||[]).length<3).map(k=>k.id),
   немыеГолоса:DUNGEON_KINDS.filter(k=>(k.голоса||[]).some(([r,w])=>!SOUND_BANK[r]||!(w>0))).map(k=>k.id),
   инструмент:DUNGEON_KINDS.filter(k=>роли(k).some(r=>(SOUND_BANK[r]||{f:[]}).f.some(f=>инстр.test(f)))).map(k=>k.id),
   чужиеТвари:DUNGEON_KINDS.filter(k=>(k.твари||[]).length<3
     ||k.твари.some(id=>!MONSTERS.some(m=>m.id===id))).map(k=>k.id),
   чужаяДобыча:DUNGEON_KINDS.filter(k=>(k.добыча||[]).length<2
     ||k.добыча.some(r=>!(RES_BASE[r]>0))).map(k=>k.id),
   чужиеПоля:DUNGEON_KINDS.filter(k=>Object.keys(k.план||{}).some(
     x=>["комнат","тварей","сундуков","жил","книг","вещей","факелов"].indexOf(x)<0)).map(k=>k.id),
   повторы:DUNGEON_KINDS.length-new Set(DUNGEON_KINDS.map(k=>k.n)).size,
   имена:DUNGEON_KINDS.map(k=>k.n)};});
 check('четырнадцать родов, и все названные в §14 на месте',
  состав.родов===14&&состав.нет.length===0,состав);
 check('у каждого рода имя, суть, примета и живая запись',
  состав.безПолей.length===0&&состав.повторы===0,состав);
 check('у каждого рода три-четыре своих голоса, и все они живые записи',
  состав.малоГолосов.length===0&&состав.немыеГолоса.length===0&&состав.инструмент.length===0,состав);
 check('свои твари есть в бестиарии, своя добыча — настоящие ресурсы',
  состав.чужиеТвари.length===0&&состав.чужаяДобыча.length===0,состав);
 check('перекос планировки ссылается только на поля, которые Gen.plan знает',
  состав.чужиеПоля.length===0,состав.чужиеПоля);

 /* ── 4–6. Откуда берётся род ── */
 const вывод=await page.evaluate(()=>{
  const a=dungeonKindAt(4000,4000,"ruins"),b=dungeonKindAt(4000,4000,"ruins");
  const пещера=dungeonKindAt(4000,4000,"cave_entrance");
  const сосед=(()=>{for(let d=1;d<200;d++){
    const k=dungeonKindAt(4000+d*13,4000+d*7,"ruins");
    if(k&&k!==a)return {d,id:k.id};}return null;})();
  const нетРода=["tavern","castle","village","forge","school","market","port"]
   .map(st=>dungeonKindAt(4000,4000,st)).filter(Boolean).length;
  const было={};
  for(let i=0;i<6000;i++){const k=dungeonKindAt(i*11+7,i*17+3,"ruins");if(k)было[k.id]=1;}
  return {устойчив:!!a&&a===b,общийСПещерой:a===пещера,сосед,нетРода,
   встретилось:Object.keys(было).length};});
 check('род выводится из координат и одинаков при повторном спросе',вывод.устойчив,вывод);
 check('род у места один — и для руин, и для зева пещеры на том же месте',
  вывод.общийСПещерой,вывод);
 check('у соседних мест роды разные: дверь наверху больше ничего не решает',
  !!вывод.сосед,вывод);
 check('рода нет там, где нет подземелья: подвал под таверной — не род',
  вывод.нетРода===0,вывод);
 check('на выборке в шесть тысяч мест встречаются все четырнадцать',
  вывод.встретилось===14,вывод);

 /* ── 7–12. Род в живой игре ── */
 const вИгре=await page.evaluate(async()=>{
  const найти=(откуда)=>{
   for(let r=1;r<300;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=откуда.x+dx,y=откуда.y+dy;
    const c=cellContent(x,y);
    if(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"&&!airOnly(c.structure.type))
     return {x,y,t:c.structure.type};}
   return null;};
  const войти=(м)=>{G.x=м.x;G.y=м.y;G.place=null;G.ship=null;G.inCombat=false;
   enterPlace(cellContent(м.x,м.y));
   if(G.place)G.place.depth=1;
   return G.place;};
  const м1=найти({x:1000,y:1000});
  if(!м1)return {нет:true};
  window.__said=[];const орig=Speech.say;Speech.say=t=>{window.__said.push(String(t));};
  войти(м1);
  const k1=Dungeons.here();
  const заголовок1=placeTitle();
  /* Голоса рода поверх общего набора. */
  const базовых=AMBIENCE_SET.dungeon.spots.length;
  const всего=Ambience.spots("dungeon").length;
  const свои=(k1.голоса||[]).map(([r])=>r);
  const естьСвои=свои.every(r=>Ambience.spots("dungeon").some(([x])=>x===r));
  const общиеОстались=AMBIENCE_SET.dungeon.spots.every(([r])=>
   !Bank.has(r)||Ambience.spots("dungeon").some(([x])=>x===r));
  /* Твари: свои чаще, чужие не исчезли. */
  const родня=dungeonKin();
  const пул=dungeonPool(MONSTERS.filter(m=>m.biomes.includes("cave")));
  const сколькоСвоих=пул.filter(m=>(k1.твари||[]).includes(m.id)).length;
  const чужиеЕсть=пул.some(m=>!(k1.твари||[]).includes(m.id));
  /* Жила отдаёт своё. */
  const жила=veinPool();
  const своё=(k1.добыча||[]).every(r=>жила.filter(x=>x===r).length>=2);
  /* Планировка. */
  const план=Gen.plan(G.place.bx,G.place.by,1,G.place.stype);
  /* Другое подземелье — другой род и другой заголовок. */
  const м2=найти({x:м1.x+900,y:м1.y+900});
  let заголовок2=null,k2=null;
  if(м2){войти(м2);k2=Dungeons.here();заголовок2=placeTitle();}
  /* Примета при входе. */
  window.__said=[];
  войти(м1);
  const речь=window.__said.join(" ");
  Speech.say=орig;
  return {род:k1.id,имя:k1.n,заголовок1,заголовок2,род2:k2&&k2.id,
   базовых,всего,естьСвои,общиеОстались,
   родня:родня.length,сколькоСвоих,чужиеЕсть,жила,своё,план,
   вРечи:речь.indexOf(k1.примета)>=0,речь:речь.slice(0,120)};});
 check('имя рода стоит в названии места',
  !вИгре.нет&&вИгре.заголовок1.indexOf(вИгре.имя)>=0,вИгре);
 check('у другого подземелья свой род и своё название',
  !вИгре.нет&&(!вИгре.заголовок2||вИгре.заголовок2!==вИгре.заголовок1),вИгре);
 check('голоса рода ложатся поверх общего набора подземелья, а не вместо',
  !вИгре.нет&&вИгре.естьСвои&&вИгре.общиеОстались&&вИгре.всего>вИгре.базовых,вИгре);
 check('свои твари идут чаще прочих, но чужие не исчезают',
  !вИгре.нет&&вИгре.сколькоСвоих>=3&&вИгре.чужиеЕсть,вИгре);
 check('жила отдаёт то, чем это место богато',!вИгре.нет&&вИгре.своё,вИгре);
 check('перекос планировки доходит до Gen.plan',
  !вИгре.нет&&Object.values(вИгре.план).some(v=>v>0),вИгре.план);
 check('примета рода звучит при входе',!вИгре.нет&&вИгре.вРечи,вИгре.речь);

 /* ── 13. Самопроверка, модуль, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="dkinds");
  const гл=GUIDE.find(g=>/Четырнадцать родов подземелья/i.test(g.title));
  return {есть:!!r,ok:r&&r.ok,всего:rows.length,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("DUNGEONKINDS"),
   текстБезМеста:(()=>{G.place=null;return Dungeons.text();})()};});
 check('самопроверка мира держит строку «dkinds» и она зелёная',свод.есть&&свод.ok,свод);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль DUNGEONKINDS зарегистрирован и отвечает без места',
  свод.модуль===true&&/Родов подземелья 14/.test(свод.текстБезМеста),свод);
 check('в руководстве есть глава о родах подземелья',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о родах подземелья',
  /Четырнадцать родов подземелья/i.test(readme)&&/некрополь/i.test(readme)
  &&/примета/i.test(readme));
 check('docs/МИР.md держит таблицу входов в уже написанное',
  /DUNGEON_KINDS/.test(mir)&&/dungeonKindAt/.test(mir)&&/veinPool/.test(mir)
  &&/Gen\.plan/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

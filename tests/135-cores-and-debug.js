/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 135: ДВАДЦАТЬ СЕМЬ ЯДЕР И ОТЛАДОЧНАЯ ПАНЕЛЬ (§2 и §35 мастер-промпта)

   Мастер-промпт требует единой сети ядер: у каждой большой области мира
   своё имя, своё API и свой ответ о себе. И отдельно — отладочной панели
   из тринадцати систем и десяти действий над каждой.

   Главное требование, которое легко нарушить: НЕ ЗАВОДИТЬ ВТОРОГО
   ОБРАБОТЧИКА. Двадцать два из двадцати семи имён — это новые имена уже
   работающих слоёв, и они обязаны отдавать ТОТ ЖЕ объект, а не копию.

   И второе: игра для незрячих. Отладочная панель не смеет добавить ни
   одной кнопки в меню действий и обязана молчать, пока её не откроют.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Все двадцать семь имён находятся, и у каждого есть свой ответ.
   2. Псевдоним — тот же самый объект, что и слой под ним (не копия).
   3. Пять своих ядер отвечают настоящими числами мира, а не выдумкой.
   4. Состояние мира пишется только в существующий простой ключ.
   5. Порождение устойчиво: одно место складывается дважды одинаково.
   6. Панель заперта: пока не открыта — ни одно действие не работает,
      и она честно об этом говорит.
   7. «Выключить» вправду выключает — даже при ?debug=1 в строке запроса.
   8. Все тринадцать систем × десять действий отвечают и не срываются.
   9. Действия вправду делают дело: перенос переносит, выдача выдаёт,
      значение ставится, сброс чистит, прогон двигает сутки.
  10. Чужая система и чужое действие отвергаются с называнием своих.
  11. Панель не добавила ни одной кнопки в меню действий.
  12. Самопроверка мира держит строку «cores»; глава, README и docs есть.
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

 /* ── 1. состав ядер ── */
 const состав=await page.evaluate(()=>{
  const имена=Object.keys(CORE_ALIASES);
  return {
   сколько:имена.length,
   имена,
   всеЕсть:имена.every(n=>Modules.has(n)),
   нет:имена.filter(n=>!Modules.has(n)),
   всеГоворят:имена.every(n=>{const m=Modules.get(n);return m&&typeof m.text==="function";}),
   молчат:имена.filter(n=>{const m=Modules.get(n);return !m||typeof m.text!=="function";}),
   /* Ответ должен быть настоящими словами, а не пустотой и не «[object]». */
   пустые:имена.filter(n=>{const t=String(Modules.get(n).text()||"");
    return t.length<20||/\[object|undefined|NaN/.test(t);})
  };});
 check('двадцать семь имён ядер мастер-промпта',состав.сколько===27,состав.сколько);
 check('каждое имя находится в перечне модулей',состав.всеЕсть,состав.нет);
 check('у каждого ядра свой ответ о себе',состав.всеГоворят,состав.молчат);
 check('ни один ответ не пустой и не служебный',состав.пустые.length===0,состав.пустые);

 /* ── 2. НИ ОДНОГО ДВОЙНИКА ── */
 const двойники=await page.evaluate(()=>{
  const свои=[],чужие=[];
  Object.keys(CORE_ALIASES).forEach(n=>{
   const под=CORE_ALIASES[n];
   if(!под){свои.push(n);return;}
   if(Modules.get(n)!==Modules.get(под))чужие.push(n+"≠"+под);});
  /* И отдельно: имя слоя не должно встретиться в перечне дважды. */
  const список=Modules.list();
  const дубли=список.filter((x,i)=>список.indexOf(x)!==i);
  return {свои,чужие,дубли,всего:список.length};});
 check('псевдоним отдаёт ТОТ ЖЕ объект, а не свою копию',
  двойники.чужие.length===0,двойники.чужие);
 check('своих, новых ядер ровно пять',двойники.свои.length===5,двойники.свои);
 check('в перечне модулей нет повторяющихся имён',
  двойники.дубли.length===0,двойники.дубли);

 /* ── 3. пять своих ядер отвечают настоящими числами ── */
 const свои=await page.evaluate(()=>{
  const E=Modules.get("ENTITY_CORE"),A=Modules.get("AUDIO_MIXER_CORE"),
        D=Modules.get("DATABASE_CORE"),P=Modules.get("PROCEDURAL_CORE");
  return {
   твари:E.monsters().length,семейства:E.deepFamilies().length,
   боссы:E.worldBosses().length,владыки:E.guardLords().length,
   сверкаТварей:E.monsters()===MONSTERS,
   страж:(()=>{const g=E.guardianAt(G.x,G.y,50);return !!(g&&g.n);})(),
   каналы:A.channels().length,
   каналВерен:A.channelOf("music")===Bank.chanOf("music"),
   важности:A.priorities().length,
   важностьНоль:A.priorities()[0][1],
   громкость:A.master(),
   ключи:D.keys().length,
   естьХ:D.has("x"),нетВыдумки:D.has("такого_ключа_нет"),
   размер:D.size(),
   множители:P.factors().length,
   план:(()=>{const p=P.plan(G.x,G.y,7,"ruins");return p&&typeof p.комнат==="number";})(),
   паспорт:(()=>{const p=P.passport(G.x,G.y,7,"ruins");return !!(p&&p.n);})()
  };});
 check('живые существа: двадцать две твари, десять семейств, шесть боссов, четыре владыки',
  свои.твари===22&&свои.семейства===10&&свои.боссы===6&&свои.владыки===4,свои);
 check('ядро существ отдаёт сам справочник мира, а не его копию',свои.сверкаТварей);
 check('ядро существ находит стража на пятидесятом ярусе',свои.страж);
 check('сведение звука: шестнадцать каналов и пять уровней важности речи',
  свои.каналы===16&&свои.важности===5&&/смертельн/i.test(свои.важностьНоль),свои);
 check('канал роли берётся у самого звукового банка, а не считается заново',свои.каналВерен);
 check('состояние мира: ключей больше сотни, размер считается',
  свои.ключи>100&&свои.размер>500,{ключи:свои.ключи,размер:свои.размер});
 check('состояние знает свои ключи и не знает выдуманных',
  свои.естьХ&&!свои.нетВыдумки,свои);
 check('порождение: восемь множителей, план и паспорт яруса',
  свои.множители===8&&свои.план&&свои.паспорт,свои);

 /* ── 4. запись в состояние только по правилам ── */
 const запись=await page.evaluate(()=>{
  const D=Modules.get("DATABASE_CORE");
  const былоЗолото=G.gold;
  const ок=D.set("gold",1234);
  const новый=D.set("выдуманный_ключ",1);
  const сложный=D.set("inv",{а:1});
  const стало=G.gold;G.gold=былоЗолото;
  return {ок,стало,новый,сложный,появился:Object.prototype.hasOwnProperty.call(G,"выдуманный_ключ"),
   инвентарьЦел:typeof G.inv==="object"};});
 check('в существующий простой ключ пишется',запись.ок&&запись.стало===1234,запись);
 check('нового ключа отсюда не выдумать',!запись.новый&&!запись.появился,запись);
 check('сложное поле отсюда не подменить',!запись.сложный&&запись.инвентарьЦел,запись);

 /* ── 5. устойчивость порождения ── */
 const устой=await page.evaluate(()=>{
  const P=Modules.get("PROCEDURAL_CORE");
  const точки=[[1000,1000,3,"ruins"],[24000,24000,40,"mine"],[40000,9000,88,"crypt"]];
  return {все:точки.every(t=>P.stable(t[0],t[1],t[2],t[3])),
   разные:JSON.stringify(P.of(1000,1000,3,"ruins"))!==JSON.stringify(P.of(40000,9000,88,"crypt"))};});
 check('одно и то же место складывается дважды одинаково',устой.все,устой);
 check('разные места складываются по-разному',устой.разные,устой);

 /* ── 6. панель заперта от игрока ── */
 const запёрта=await page.evaluate(()=>{
  Debug.off();
  const былоЗолото=G.gold,былоX=G.x;
  const ответы=DEBUG_OPS.map(op=>String(Debug.run("ECONOMY",op,"gold = 99999")));
  return {открыта:Debug.enabled(),
   всеОтказ:ответы.every(t=>/выключен/i.test(t)),
   золотоЦело:G.gold===былоЗолото,местоЦело:G.x===былоX,
   текст:String(Debug.text()),образец:ответы[0]};});
 check('по умолчанию отладочная панель закрыта',!запёрта.открыта,запёрта);
 check('пока закрыта — каждое из десяти действий отказывает словами',
  запёрта.всеОтказ,запёрта.образец);
 check('пока закрыта — ничего в мире не меняется',
  запёрта.золотоЦело&&запёрта.местоЦело,запёрта);
 check('закрытая панель так о себе и говорит',
  /выключен/i.test(запёрта.текст)&&/в меню не показывается/i.test(запёрта.текст),запёрта.текст);

 /* ── 7. панель не добавила ни одной кнопки в меню действий ── */
 const меню=await page.evaluate(()=>{
  const кн=Array.from(document.querySelectorAll("button")).map(b=>String(b.dataset.cmd||"")+"|"+String(b.textContent||""));
  return {отладочных:кн.filter(t=>/debug|отладк|Отладк/i.test(t)),всего:кн.length};});
 check('в меню действий нет ни одной отладочной кнопки',
  меню.отладочных.length===0,меню.отладочных);

 /* ── 8. «выключить» сильнее строки запроса ── */
 const сильнее=await page.evaluate(()=>{
  Debug.on();const включена=Debug.enabled();
  Debug.off();const после=Debug.enabled();
  Debug.on();
  return {включена,после};});
 check('«включить» открывает, «выключить» закрывает',
  сильнее.включена===true&&сильнее.после===false,сильнее);
 const приЗапросе=await page.evaluate(()=>{
  /* Даже когда мир открыт строкой запроса, явный отказ сильнее. */
  const было=G.__debug;delete G.__debug;
  const поЗапросу=(()=>{try{localStorage.setItem("gm_debug","1");}catch(_){}return Debug.enabled();})();
  const послеОтказа=(Debug.off(),Debug.enabled());
  G.__debug=было===undefined?true:было;
  return {поЗапросу,послеОтказа};});
 check('ключ в хранилище открывает панель, а явный отказ её всё равно закрывает',
  приЗапросе.поЗапросу===true&&приЗапросе.послеОтказа===false,приЗапросе);

 /* ── 9. тринадцать систем × десять действий ── */
 const прогон=await page.evaluate(()=>{
  Debug.on();
  const беда=[];const пусто=[];
  DEBUG_SYSTEMS.forEach(s=>DEBUG_OPS.forEach(op=>{
   let arg=null;
   if(op==="SIMULATE")arg=2;
   if(op==="TELEPORT")arg="500 500";
   if(op==="GIVE_ITEM")arg="Верёвка x2";
   if(op==="SET_VALUE")arg="gold = 50";
   let t;
   try{t=String(Debug.run(s.id,op,arg));}catch(e){беда.push(s.id+"."+op+": "+e);return;}
   if(!t||t.length<5||/undefined|\[object|NaN/.test(t))пусто.push(s.id+"."+op+": "+t);
   if(/сорвалось/.test(t))беда.push(s.id+"."+op+": "+t);
  }));
  return {беда,пусто,систем:DEBUG_SYSTEMS.length,действий:DEBUG_OPS.length,
   пар:DEBUG_SYSTEMS.length*DEBUG_OPS.length};});
 check('тринадцать систем и десять действий',
  прогон.систем===13&&прогон.действий===10&&прогон.пар===130,прогон);
 check('ни одна из ста тридцати пар не срывается',прогон.беда.length===0,прогон.беда.slice(0,4));
 check('ни одна из ста тридцати пар не отвечает пустотой',прогон.пусто.length===0,прогон.пусто.slice(0,4));

 /* ── 10. действия вправду делают дело ── */
 const дело=await page.evaluate(()=>{
  Debug.on();
  const о={};
  /* перенос */
  Debug.run("WORLD","TELEPORT","777 888");
  о.перенос=(G.x===777&&G.y===888);
  const c=NAMED_CITIES[0];
  Debug.run("WORLD","TELEPORT",c.id);
  о.переносГород=(G.x===c.x&&G.y===c.y);
  /* выдача */
  G.inv=G.inv||{};const былоВ=Number(G.inv["Верёвка"])||0;
  Debug.run("ITEMS","GIVE_ITEM","Верёвка x5");
  о.выдача=(Number(G.inv["Верёвка"])===былоВ+5);
  /* значение */
  Debug.run("ECONOMY","SET_VALUE","gold = 4242");
  о.значение=(G.gold===4242);
  о.отказНаВыдумку=/не ставится/.test(String(Debug.run("ECONOMY","SET_VALUE","чужой_ключ = 1")));
  /* сброс */
  G.lore={"рецепт:проба":1};
  const сброс=String(Debug.run("PLAYER","RESET"));
  о.сброс=!G.lore&&/сброшено/.test(сброс);
  /* прогон суток */
  const день=Number(G.day)||1;
  const пр=String(Debug.run("WORLD","SIMULATE",3));
  о.сутки=(Number(G.day)===день+3)&&/Прожито 3/.test(пр);
  /* выключение системы держится */
  Debug.run("NPC","DISABLE");
  о.выключено=Debug.isOff("NPC");
  Debug.run("NPC","ENABLE");
  о.включено=!Debug.isOff("NPC");
  /* журнал ведётся */
  о.журнал=Debug.log().length>=6&&typeof Debug.log()[0].t==="string"&&Debug.log()[0].день>0;
  /* осмотр отдаёт то же, что и сам слой */
  о.осмотр=String(Debug.run("FACTION","INSPECT"))===String(Modules.get("FACTIONS").text());
  /* порождение жителя, вещи и стража */
  о.житель=/Житель:/.test(String(Debug.run("NPC","SPAWN","Кузнец")));
  о.вещь=/Вещь:/.test(String(Debug.run("ITEMS","SPAWN",5)));
  о.страж=/Страж:/.test(String(Debug.run("DUNGEON","SPAWN",50)));
  о.чара=/Чара выдана:/.test(String(Debug.run("MAGIC","SPAWN","Искра запала")));
  return о;});
 check('перенос переносит и по числам, и по имени именного города',
  дело.перенос&&дело.переносГород,дело);
 check('выдача вправду кладёт вещь в котомку',дело.выдача,дело);
 check('значение ставится, а выдуманный ключ отвергается',
  дело.значение&&дело.отказНаВыдумку,дело);
 check('сброс чистит ключи своей системы',дело.сброс,дело);
 check('прогон вперёд двигает сутки и называет, сколько сработало',дело.сутки,дело);
 check('систему можно выключить и включить обратно',
  дело.выключено&&дело.включено,дело);
 check('журнал ведётся с днём и часом',дело.журнал,дело);
 check('осмотр отдаёт слово самого слоя, а не своё',дело.осмотр,дело);
 check('порождается житель, вещь, страж и чара',
  дело.житель&&дело.вещь&&дело.страж&&дело.чара,дело);

 /* ── 11. чужое отвергается с называнием своего ── */
 const чужое=await page.evaluate(()=>({
  система:String(Debug.run("НЕТУ_ТАКОЙ","INSPECT")),
  действие:String(Debug.run("WORLD","НЕТУ_ТАКОГО")),
  пусто:String(Debug.run("","")) }));
 check('чужая система отвергается и свои называются',
  /Такой системы нет/.test(чужое.система)&&/WORLD/.test(чужое.система)&&/GESTURES/.test(чужое.система),чужое.система);
 check('чужое действие отвергается и свои называются',
  /Такого действия нет/.test(чужое.действие)&&/SET_VALUE/.test(чужое.действие),чужое.действие);
 check('пустой запрос не роняет панель',/нет/i.test(чужое.пусто),чужое.пусто);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Ядра мира/i.test(g.title));
  return {c:r.find(x=>x.id==="cores"),плохие:r.filter(x=>!x.ok).map(x=>x.id),строк:r.length,
   глава:!!гл,главаСтрок:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «cores»',
  !!свод.c&&свод.c.ok===true,свод.c);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о ядрах и панели',
  свод.глава&&свод.главаСтрок>=8,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о двадцати семи ядрах и о запертой панели',
  /двадцат[ьи] сем[ьи] ядер/i.test(readme)&&/отладочн/i.test(readme)&&/debug=1/.test(readme));
 check('docs/МИР.md держит перечень ядер и правило одного обработчика',
  /CORE_ALIASES/.test(mir)&&/DEBUG_SYSTEMS/.test(mir)&&/тот же объект/i.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 148: ВЛОЖЕННАЯ ЧАРА — СВИТОК, ЖЕЗЛ, ТАЛИСМАН И ФОКУС

   §16 брифа говорит, что артефакт умеет поглощать энергию. Из всего
   списка свойств артефакта это было единственное, чего в игре не было:
   гримуар дал двадцать шесть тысяч заклинаний, но взять их можно было
   только в голову.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Носителей четыре, у каждого своё число зарядов, своё ремесло и свои
      составляющие — и все составляющие настоящие ресурсы переделов.
   2. Звук у каждого — настоящая запись, а не синтезированная сцена.
   3. Цена выводится из вложенной чары и растёт со ступенью ровно втрое.
   4. Без ремесла, без материала и без маны — отказ своими словами.
   5. Сделанный носитель помнит номер в гримуаре, а не запись, и выводит
      из него то же самое заклинание.
   6. Применение тратит заряд, не тратит маны и не заводит перезарядки.
   7. Свиток после последнего заряда сгорает и уходит из списка.
   8. Жезл и талисман заряжают: на месте силы даром, у мастера — за
      составляющие; одноразовый отказывает словами.
   9. Фокус не творит, а свою специализацию делает дешевле на треть и
      свою школу — на седьмую часть; берётся лучший, а не произведение.
  10. Окно составителя показывает носители и ваши вещи без немых строк.
  11. Панель магии держит вложенные вещи за двенадцатью слотами: жезл
      применяют там, где он нужен, а не там, где сделан.
  12. Вложенные вещи переживают сохранение.
  13. Самопроверка мира держит строку «carriers»; модуль, глава, README,
      docs.
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

 /* ── 1–2. Состав носителей и их звук ── */
 const состав=await page.evaluate(()=>{
  /* Синтезированные сцены лежат в семи папках; смотреть надо на файл. */
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const плохие=[],синт=[],чужие=[];
  CARRIERS.forEach(c=>{
   if(!(c.n&&c.о&&c.род&&c.вин&&c.цена>0&&Number.isFinite(c.заряды)))плохие.push(c.id);
   if(синтез(c.звук))синт.push(c.id);
   if(c.маст&&!MAST_BY_ID[c.маст])плохие.push(c.id+":ремесло");
   Object.keys(c.берёт||{}).forEach(r=>{if(RES_BASE[r]===undefined)чужие.push(c.id+":"+r);});
   if(!Object.keys(c.берёт||{}).length)плохие.push(c.id+":пусто");});
  return {всего:CARRIERS.length,уник:new Set(CARRIERS.map(c=>c.id)).size,
   плохие,синт,чужие,
   заряды:CARRIERS.map(c=>c.заряды),
   перезаряд:CARRIERS.filter(c=>c.перезаряд).map(c=>c.id),
   ремёсла:CARRIERS.map(c=>c.маст)};});
 check('носителей четыре, у каждого свои заряды, ремесло и составляющие из настоящих переделов',
  состав.всего===4&&состав.уник===4&&состав.плохие.length===0&&состав.чужие.length===0
  &&состав.заряды.join(",")==="1,5,3,0"&&состав.перезаряд.join(",")==="wand,talisman",состав);
 check('звук каждого носителя — настоящая запись, а не синтезированная сцена',
  состав.синт.length===0,состав.синт);

 /* ── 3. Цена выводится из чары и растёт со ступенью ── */
 const цена=await page.evaluate(()=>{
  const мал=grimAt(0),пол=grimAt(1),выс=grimAt(2);
  const ряд=вид=>[мал,пол,выс].map(r=>chargedCost(вид,r));
  const ж=ряд("wand");
  const своя=CARRIERS.map(c=>{const x=chargedCost(c.id,мал);return [c.id,x.мана];});
  return {ступени:мал.ступень+","+пол.ступень+","+выс.ступень,
   мана:ж.map(x=>x.мана),
   брус:ж.map(x=>x.берёт["клеёный брус"]),
   ровноВтрое:Object.keys(ж[0].берёт).every(r=>ж[2].берёт[r]===ж[0].берёт[r]*3),
   отЧары:chargedCost("wand",мал).мана!==chargedCost("wand",grimAt(600)).мана
        ||мал.cost===grimAt(600).cost,
   поНосителям:своя};});
 check('цена носителя выводится из вложенной чары и растёт со ступенью ровно втрое',
  цена.ступени==="1,2,3"&&цена.брус.join(",")==="1,2,3"&&цена.ровноВтрое
  &&цена.мана[2]>цена.мана[0]&&цена.отЧары,цена);

 /* ── 4. Отказы своими словами ── */
 const отказы=await page.evaluate(()=>{
  G.place={stype:"tower"};G.inv={};G.mana=200;G.charged=[];
  G.mast={};
  const rec=grimAt(0);
  const безРемесла=chargedWhyNot("focus",rec);
  /* дадим ремесло, но не дадим материала */
  G.mast={runes:{ур:3,оп:0,дел:0},arte:{ур:3,оп:0,дел:0}};
  const безМатериала=chargedWhyNot("wand",rec);
  G.inv={"клеёный брус":9,"рунный камень":9};
  G.mana=1;
  const безМаны=chargedWhyNot("wand",rec);
  G.mana=200;
  const можно=chargedWhyNot("wand",rec);
  return {безРемесла,безМатериала,безМаны,можно,
   сделал:chargedMake(0,"wand"),зарядов:(G.charged[0]||{}).заряд};});
 check('без ремесла, без материала и без маны — отказ своими словами, а с ними — жезл',
  /артефактор/i.test(отказы.безРемесла)&&/Не хватает/.test(отказы.безМатериала)
  &&/маны/.test(отказы.безМаны)&&отказы.можно===""
  &&отказы.сделал===true&&отказы.зарядов===5,отказы);

 /* ── 5–6. Вещь помнит номер, применение тратит заряд, а не ману ── */
 const приме=await page.evaluate(()=>{
  G.place=null;G.hp=300;G.hpMax=300;G.mana=150;G.manaMax=200;G.inCombat=false;G.combat=null;
  const it=G.charged[0];
  const помнит=Number.isFinite(it.грим)&&!it.n&&!it.cost;
  const rec=chargedSpell(it);
  const тоЖе=rec&&rec.n===grimAt(it.грим).n;
  const манаДо=G.mana,зарядДо=it.заряд;
  const cdДо=JSON.stringify(G.spellCD||{});
  const ок=chargedUse(0);
  return {помнит,тоЖе,ок,манаДо,манаПосле:G.mana,зарядДо,зарядПосле:G.charged[0].заряд,
   cdРовно:JSON.stringify(G.spellCD||{})===cdДо,имя:rec.n};});
 check('вещь помнит номер в гримуаре и выводит из него то же заклинание',
  приме.помнит&&приме.тоЖе,приме);
 check('применение тратит заряд, не тратит маны и не заводит перезарядки',
  приме.ок===true&&приме.зарядПосле===приме.зарядДо-1
  &&приме.манаПосле===приме.манаДо&&приме.cdРовно,приме);

 /* ── 7. Свиток сгорает ── */
 const свиток=await page.evaluate(()=>{
  G.place={stype:"tower"};G.mast={runes:{ур:3,оп:0,дел:0},arte:{ур:3,оп:0,дел:0}};
  G.inv={"полотно":9,"травяная вытяжка":9};G.mana=200;G.charged=[];
  const сделал=chargedMake(3,"scroll");
  const было=G.charged.length,зар=G.charged[0].заряд;
  G.place=null;
  const ок=chargedUse(0);
  return {сделал,было,зар,ок,стало:G.charged.length};});
 check('свиток одноразовый: сделали — один заряд, применили — сгорел',
  свиток.сделал===true&&свиток.было===1&&свиток.зар===1
  &&свиток.ок===true&&свиток.стало===0,свиток);

 /* ── 8. Зарядка ── */
 const зарядка=await page.evaluate(()=>{
  G.place={stype:"tower"};G.mast={runes:{ур:3,оп:0,дел:0},arte:{ур:3,оп:0,дел:0}};
  G.inv={"клеёный брус":9,"рунный камень":9,"полотно":9,"травяная вытяжка":9};
  G.mana=300;G.charged=[];
  chargedMake(0,"wand");chargedMake(3,"scroll");
  G.place=null;
  chargedUse(0);chargedUse(0);
  const послеТрат=G.charged[0].заряд;
  /* В чистом поле не заряжают. */
  const p=Power.all()[0];const бх=G.x,бy=G.y;
  /* Ищем клетку, где места силы точно нет: их по три на область, и просто
     отойти на полсотни шагов мало — можно попасть в соседнее. */
  let пусто=null;
  for(let d=40;d<900&&!пусто;d+=37)
   for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d]]){
    if(!Power.at(p.x+dx,p.y+dy)){пусто=[p.x+dx,p.y+dy];break;}}
  G.x=пусто[0];G.y=пусто[1];
  const вПоле=chargedRecharge(0);
  /* На месте силы — даром. */
  G.x=p.x;G.y=p.y;
  const былоБруса=G.inv["клеёный брус"];
  const наМесте=chargedRecharge(0);
  const даром=G.inv["клеёный брус"]===былоБруса;
  const полон=G.charged[0].заряд;
  /* У мастера — за составляющие. */
  G.x=бх;G.y=бy;G.place={stype:"tower"};
  chargedUse(0);
  const доМастера=G.inv["клеёный брус"];
  const уМастера=chargedRecharge(0);
  const списал=G.inv["клеёный брус"]<доМастера;
  /* Свиток не заряжают. */
  const своиток=G.charged.findIndex(x=>x.вид==="scroll");
  const свит=своиток>=0?chargedRecharge(своиток):null;
  return {послеТрат,вПоле,наМесте,даром,полон,уМастера,списал,свит};});
 check('жезл заряжают: в поле нельзя, на месте силы даром, у мастера за составляющие; свиток не заряжают',
  зарядка.послеТрат===3&&зарядка.вПоле===false&&зарядка.наМесте===true
  &&зарядка.даром===true&&зарядка.полон===5
  &&зарядка.уМастера===true&&зарядка.списал===true&&зарядка.свит===false,зарядка);

 /* ── 9. Фокус ── */
 const фокус=await page.evaluate(()=>{
  G.place={stype:"tower"};G.mast={runes:{ур:3,оп:0,дел:0},arte:{ур:3,оп:0,дел:0}};
  G.inv={"эфирная линза":9,"артефактная оправа":9};G.mana=300;G.charged=[];
  const ном=grimFind("fire","plamya")[0];
  const rec=grimAt(ном);
  const доФокуса=chargedFocusK(rec.school,rec.спец);
  const сделал=chargedMake(ном,"focus");
  const своя=chargedFocusK(rec.school,rec.спец);
  const школа=chargedFocusK(rec.school,"zhar");
  const чужая=chargedFocusK("water","istok");
  /* Фокус не творит. */
  const творит=chargedUse(0);
  /* Второй фокус той же школы не умножается: берётся лучший. */
  G.inv={"эфирная линза":9,"артефактная оправа":9};G.mana=300;
  chargedMake(grimFind("fire","zhar")[0],"focus");
  const двое=chargedFocusK("fire","plamya");
  return {доФокуса,своя,школа,чужая,творит,двое,вещей:G.charged.length};});
 check('фокус не творит, свою специализацию делает дешевле на треть, свою школу — на седьмую часть',
  фокус.доФокуса===1&&фокус.своя===0.67&&фокус.школа===0.85&&фокус.чужая===1
  &&фокус.творит===false,фокус);
 check('два фокуса не умножаются: берётся лучший',
  фокус.вещей===2&&фокус.двое===0.67,фокус);

 /* ── 10. Окно составителя ── */
 const окно=await page.evaluate(()=>{
  G.place={stype:"tower"};G.mast={runes:{ур:3,оп:0,дел:0},arte:{ур:3,оп:0,дел:0}};
  G.inv={"клеёный брус":9,"рунный камень":9};G.mana=300;G.charged=[];
  GRIM.школа=null;GRIM.спец=null;GRIM.стр=0;GRIM.выбор=null;
  openModal("modal-spellforge");spellForgeRender();
  const box=document.getElementById("sfBody");
  if(!box)return {нет:true};
  const доВыбора=box.querySelectorAll('[data-cmd^="carriermake:"]').length;
  const кнВещь=box.querySelectorAll('[data-cmd^="grimpick:"]').length;
  CMD.grimpick(0);
  const послеВыбора=box.querySelectorAll('[data-cmd^="carriermake:"]').length;
  const строка=box.querySelector('[data-cmd="carriermake:wand"]').getAttribute("data-speak");
  CMD.carriermake("wand");
  const мои=box.querySelectorAll('[data-cmd^="carrieruse:"]').length;
  const зарядить=box.querySelectorAll('[data-cmd^="carriercharge:"]').length;
  const немых=box.querySelectorAll('button:not([data-speak]),.list-line:not([data-speak])').length;
  return {доВыбора,кнВещь,послеВыбора,мои,зарядить,немых,
   строка:строка.slice(0,120),вещей:G.charged.length};});
 check('окно составителя показывает носители после выбора и ваши вещи, без немых строк',
  !окно.нет&&окно.доВыбора===0&&окно.кнВещь===12&&окно.послеВыбора===4
  &&окно.мои===1&&окно.зарядить===0&&окно.немых===0
  &&/жезл/i.test(окно.строка)&&/мана/i.test(окно.строка),окно);

 /* ── 11. Панель магии ── */
 const панель=await page.evaluate(()=>{
  for(let i=0;i<10&&activeLayer();i++)closeTopUI();
  G.place=null;
  safeOpenMagicPanel();
  const list=document.getElementById("magicSlots");
  const все=Array.from(list.querySelectorAll("button"));
  const нос=все.filter(b=>/^🔮/.test(b.textContent));
  const немых=все.filter(b=>!b.dataset.speak).length;
  const было=G.charged[0].заряд;
  if(нос[0])нос[0].click();
  const стало=(G.charged[0]||{}).заряд;
  closeMagicPanel();
  return {всего:все.length,носителей:нос.length,немых,было,стало,
   подпись:нос[0]?нос[0].dataset.speak.slice(0,80):""};});
 check('панель магии держит вложенные вещи за двенадцатью слотами и применяет их где угодно',
  панель.всего>=13&&панель.носителей===1&&панель.немых===0
  &&панель.стало===панель.было-1&&панель.подпись.length>20,панель);

 /* ── 12. Сохранение ── */
 const сохр=await page.evaluate(()=>{
  saveGame(true);
  const raw=localStorage.getItem(SAVE_KEY)||"";
  const o=JSON.parse(raw);const g=o.G||o;
  return {есть:Array.isArray(g.charged),сколько:(g.charged||[]).length,
   первый:(g.charged||[])[0]||null};});
 check('вложенные вещи лежат в сохранении',
  сохр.есть&&сохр.сколько>=1&&сохр.первый&&Number.isFinite(сохр.первый.грим),сохр);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="carriers");
  const гл=GUIDE.find(g=>/Вложенная чара/i.test(g.title));
  return {строка:!!r,ок:r&&r.ok===true,
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:Modules.has("CARRIERS"),
   текст:String(Modules.get("CARRIERS").text()).slice(0,90),
   родов:Modules.get("CARRIERS").kinds.length,
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «carriers» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль CARRIERS зарегистрирован и отвечает',
  свод.модуль===true&&свод.родов===4&&свод.текст.length>20,свод);
 check('в руководстве есть глава о вложенной чаре',свод.глава&&свод.строкГлавы>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх носителях',
  /Вложенная чара/i.test(readme)&&/свиток/i.test(readme)&&/жезл/i.test(readme)
  &&/талисман/i.test(readme)&&/фокус/i.test(readme));
 check('docs/МИР.md держит устройство носителей',
  /CARRIERS/.test(mir)&&/chargedCost/.test(mir)&&/chargedUse/.test(mir)
  &&/chargedFocusK/.test(mir)&&/G\.charged/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 145: ДЕВЯТЬ СВОЙСТВ И ЧЕТЫРНАДЦАТЬ ПРОИЗВОДНЫХ (§4 мастер-промпта)

   §4 называет восемь основных свойств и четырнадцать производных. В игре
   было четыре числа и ни одной производной.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Девять свойств: восемь из §4 и харизма девятой; у каждого имя, суть,
      что оно даёт и живая запись, а не инструмент.
   2. Четырнадцать производных из §4; у каждой источники, единица и АДРЕС —
      место в игре, куда она входит.
   3. Свойства без следствия нет: каждое (кроме харизмы, у которой свои
      места) родит хоть одну производную.
   4. Одна дверь на чтение и запись: attrGet и attrAdd, и запись доходит.
   5. Где лежит свойство, снаружи не видно: и прежние, и новые читаются
      одинаково, а Воля как свойство не путается с запасом воли.
   6. При базовой десятке ни одна прибавка не работает.
   7. Сверка пределов идемпотентна: сколько раз ни позови — предел один.
   8. Каждая производная ДОХОДИТ до своего адреса: здоровье и эфир до
      пределов, выносливость до дыхания, сопротивление до защиты, слух до
      круга обзора, крафт до срыва у станка, концентрация и стабильность
      до согласия чар, скорость до счёта времени.
   9. Переносимый вес — настоящий предел: сверх него сбор отказывает и
      говорит почему.
  10. Рост на уровне поднимает все девять.
  11. Окно персонажа показывает свод, свойства и производные без немых строк.
  12. Самопроверка мира держит строку «attrs»; модуль, глава, README, docs.
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
  return {
   свойств:ATTRS.length,производных:DERIVED.length,
   нетСвойств:["str","agi","end","mind","will","spirit","perc","sync","cha"]
     .filter(id=>!ATTR_BY_ID[id]),
   нетПроизводных:["hp","stam","aether","focus","resist","speed","carry","regen",
     "acc","crit","hearing","detect","craft","stability"].filter(id=>!DERIVED_BY_ID[id]),
   безПолей:ATTRS.filter(a=>!a.n||!a.о||!a.даёт||!SOUND_BANK[a.звук]).map(a=>a.id),
   инструмент:ATTRS.filter(a=>(SOUND_BANK[a.звук]||{f:[]}).f.some(f=>инстр.test(f))).map(a=>a.id),
   безАдреса:DERIVED.filter(d=>!d.n||!d.о||!d.где||!(d.из||[]).length
     ||!d.из.every(x=>ATTR_BY_ID[x])||typeof d.calc!=="function").map(d=>d.id),
   безЕдиниц:DERIVED.filter(d=>!(d.доля||(Array.isArray(d.ед)&&d.ед.length===3))).map(d=>d.id),
   безСледствия:ATTRS.filter(a=>a.id!=="cha"&&!DERIVED.some(d=>d.из.indexOf(a.id)>=0)).map(a=>a.id),
   имена:ATTRS.map(a=>a.n),адреса:[...new Set(DERIVED.map(d=>d.где))].length};});
 check('девять свойств, и все восемь из §4 на месте',
  состав.свойств===9&&состав.нетСвойств.length===0,состав);
 check('у каждого свойства имя, суть, что оно даёт и живая запись',
  состав.безПолей.length===0&&состав.инструмент.length===0,состав);
 check('четырнадцать производных, и все названные в §4 на месте',
  состав.производных===14&&состав.нетПроизводных.length===0,состав);
 check('у каждой производной источники, единица и адрес в игре',
  состав.безАдреса.length===0&&состав.безЕдиниц.length===0,состав);
 check('свойства без следствия нет',состав.безСледствия.length===0,состав.безСледствия);

 /* ── 4–7. Дверь, укрытие хранилища, тишина на базе, идемпотентность ── */
 const дверь=await page.evaluate(()=>{
  const прежнее={str:G.str,agi:G.agi,mind:G.mind,cha:G.cha};
  /* Читаются одинаково и прежние, и новые. */
  const читаются=ATTRS.every(a=>Number.isFinite(attrGet(a.id)));
  /* Запись доходит и до старого поля, и до гнезда. */
  attrAdd("str",3);attrAdd("perc",3);
  const дошло=G.str===прежнее.str+3&&attrGet("perc")===13&&Number(G.attr.perc)===13;
  attrAdd("str",-3);attrAdd("perc",-3);
  /* Воля как свойство и запас воли — разные вещи. */
  Energy.ensure();
  const запасДо=Number(G.will)||0,пределДо=Number(G.willMax)||0,свойствоДо=attrGet("will");
  attrAdd("will",5);
  const свойствоПосле=attrGet("will"),пределПосле=Number(G.willMax)||0;
  attrAdd("will",-5);
  /* На базовой десятке всё молчит. */
  const снимок=ATTRS.map(a=>attrGet(a.id));
  ATTRS.forEach(a=>attrAdd(a.id,10-attrGet(a.id)));
  const шумят=DERIVED.filter(d=>d.id!=="carry"&&derived(d.id)!==0).map(d=>d.id);
  const весНаБазе=derived("carry");
  ATTRS.forEach((a,i)=>attrAdd(a.id,снимок[i]-attrGet(a.id)));
  /* Сверка идемпотентна. */
  attrAdd("end",6);
  const hp1=G.hpMax;attrSyncMax();attrSyncMax();attrSyncMax();
  const hp2=G.hpMax;
  attrAdd("end",-6);
  const hp3=G.hpMax;
  return {читаются,дошло,запасДо,свойствоДо,свойствоПосле,пределДо,пределПосле,
   шумят,весНаБазе,hp1,hp2,hp3};});
 check('одна дверь на чтение и запись, и запись доходит до места',
  дверь.читаются&&дверь.дошло,дверь);
 check('Воля как свойство не путается с запасом воли: она поднимает его предел',
  дверь.свойствоПосле===дверь.свойствоДо+5&&дверь.пределПосле>дверь.пределДо,дверь);
 check('при базовой десятке ни одна прибавка не работает',
  дверь.шумят.length===0&&дверь.весНаБазе===1200,дверь);
 check('сверка пределов идемпотентна и обратима',
  дверь.hp1===дверь.hp2&&дверь.hp3<дверь.hp1,дверь);

 /* ── 8. Каждая производная доходит до своего адреса ── */
 const адреса=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.inCombat=false;
  const снимок=ATTRS.map(a=>attrGet(a.id));
  const мера=()=>({hp:G.hpMax,mana:G.manaMax,def:def(),breath:breathTacts(),
   scape:scapeRad(),craft:techRisk(TECHS[0]),
   срыв:Resonance.of(SPELLS?SPELLS[0]:null).срыв,
   устойч:Resonance.of(SPELLS?SPELLS[0]:null).устойчивость,
   trap:Traps.chance("probe","механическая"),
   carry:derived("carry")});
  /* Время: сколько часов уходит на одну и ту же работу. */
  const часы=()=>{const b={d:G.day,h:G.hour};propTime(4);
   const ушло=(G.day-b.d)*24+(G.hour-b.h);G.day=b.d;G.hour=b.h;return ушло;};
  const до=мера(),времяДо=часы();
  ["str","agi","end","mind","will","spirit","perc","sync"].forEach(id=>attrAdd(id,20));
  const после=мера(),времяПосле=часы();
  ATTRS.forEach((a,i)=>attrAdd(a.id,снимок[i]-attrGet(a.id)));
  return {до,после,времяДо,времяПосле};});
 const в=адреса;
 check('здоровье и эфир доходят до пределов здоровья и маны',
  в.после.hp>в.до.hp&&в.после.mana>в.до.mana,в);
 check('выносливость доходит до дыхания под водой',в.после.breath>в.до.breath,в);
 check('сопротивление доходит до защиты',в.после.def>в.до.def,в);
 check('слух доходит до круга звуковой картины',в.после.scape>в.до.scape,в);
 check('эффективность крафта доходит до доли срыва у станка',в.после.craft<в.до.craft,в);
 check('обнаружение доходит до поиска ловушек',в.после.trap>в.до.trap,в);
 check('концентрация и стабильность доходят до согласия чар',
  в.после.срыв<в.до.срыв&&в.после.устойч>в.до.устойч,в);
 check('скорость доходит до счёта времени: то же дело идёт быстрее',
  в.времяПосле<в.времяДо,в);
 check('переносимый вес растёт от силы и выносливости',в.после.carry>в.до.carry,в);

 /* ── 9. Перегруз ── */
 const груз=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  window.__said=[];const орig=Speech.say;Speech.say=t=>{window.__said.push(String(t));};
  G.place=null;G.ship=null;G.inCombat=false;G.alt=0;
  /* встать на клетку с ресурсом */
  outer:for(let r=0;r<220;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const x=1000+dx,y=1000+dy;const c=cellContent(x,y);
   if(c.res&&!c.structure&&!c.monster){G.x=x;G.y=y;refresh();break outer;}}
  G.inv={};
  window.__said=[];
  const сНормой=gatherCurrent("menu");
  const взял=Object.values(G.inv).reduce((s,v)=>s+v,0);
  /* набить котомку сверх предела */
  G.inv={"камень":Math.round(derived("carry"))+50};
  window.__said=[];
  const сПеребором=gatherCurrent("menu");
  const речь=window.__said.join(" ");
  G.inv={};
  Speech.say=орig;
  return {сНормой,взял,сПеребором,перегруз:речь.slice(0,90),
   предел:Math.round(derived("carry"))};});
 check('с нормальной котомкой сбор работает',груз.сНормой===true&&груз.взял>=1,груз);
 check('сверх предела сбор отказывает и говорит почему',
  груз.сПеребором===false&&/не унести/i.test(груз.перегруз),груз);

 /* ── 10. Рост на уровне ── */
 const рост=await page.evaluate(()=>{
  const до=ATTRS.map(a=>attrGet(a.id));
  const был=G.level;
  G.xp=xpNeed(G.level);checkLevelUp();
  const после=ATTRS.map(a=>attrGet(a.id));
  return {уровень:[был,G.level],выросли:после.filter((v,i)=>v>до[i]).length,всего:ATTRS.length};});
 check('новый уровень поднимает все девять свойств',
  рост.уровень[1]>рост.уровень[0]&&рост.выросли===рост.всего,рост);

 /* ── 11. Окно персонажа ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  openModal("modal-character");renderCharacter();
  const el=document.getElementById("charStats");
  const строки=[...el.querySelectorAll(".list-line")];
  const кнопки=[...el.querySelectorAll("button[data-cmd^='attrsay']")];
  const немые=строки.filter(e=>!e.getAttribute("data-speak")).length
   +кнопки.filter(e=>!e.getAttribute("data-speak")).length;
  const производных=DERIVED.filter(d=>el.textContent.indexOf(d.n)>=0).length;
  const r={кнопок:кнопки.length,немые,производных};
  while(activeLayer())closeTopUI();
  return r;});
 check('в окне персонажа кнопка на каждое свойство и все четырнадцать производных',
  окно.кнопок===9&&окно.производных===14,окно);
 check('ни одна строка окна персонажа не нема',окно.немые===0,окно);

 /* ── 12. Самопроверка, модуль, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="attrs");
  const гл=GUIDE.find(g=>/Девять свойств и четырнадцать производных/i.test(g.title));
  return {есть:!!r,ok:r&&r.ok,всего:rows.length,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("ATTRIBUTES"),
   текст:Attrs.text().slice(0,80)};});
 check('самопроверка мира держит строку «attrs» и она зелёная',свод.есть&&свод.ok,свод);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль ATTRIBUTES зарегистрирован и отвечает',
  свод.модуль===true&&/Свойств 9/.test(свод.текст),свод);
 check('в руководстве есть глава о свойствах',свод.глава&&свод.строк>=7,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о свойствах и производных',
  /Девять свойств и четырнадцать производных/i.test(readme)
  &&/Синхронизация/i.test(readme)&&/базовой десятке/i.test(readme));
 check('docs/МИР.md держит таблицу адресов',
  /ATTRS/.test(mir)&&/attrSyncMax/.test(mir)&&/breathTacts/.test(mir)&&/Traps\.chance/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

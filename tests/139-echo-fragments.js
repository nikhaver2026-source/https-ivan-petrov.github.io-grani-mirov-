/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 139: ЭХО — ОСКОЛКИ ЧУЖИХ СПОСОБНОСТЕЙ (§9 мастер-промпта)

   Пожирание давало мгновенный дар и забывалось. §9 требует другого:
   осколков способностей, у которых есть вместимость, совместимость,
   уровень, стабильность, цена интеграции и риск конфликта.

   Двойника не заведено: совместимость осколков считается тем же родством
   и рознью восемнадцати стихий, что и согласие чар.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Восемь родов осколка, у каждого своя запись, свой дар и своя мера.
   2. Осколок с твари выходит всегда и всегда один и тот же: род, стихия и
      уровень выводятся из неё самой.
   3. Вместимость в берегах и растёт от того, от чего должна.
   4. Совместимость считается по родству стихий: родня выше розни.
   5. Цена вживления настоящая — мана, кровь и часы; своё дешевле чужого.
   6. Риск назван заранее и в берегах; не прижился — осколок рассыпался,
      а цена ушла.
   7. §38: каждый из восьми даров ВПРАВДУ что-то меняет в мире.
   8. Вместимость держит: сверх неё не вживляется.
   9. Вынуть можно, и осколок возвращается в суму.
  10. Конфликт настоящий: набор из розни сам выбрасывает худшее звено и
      берёт за это кровью.
  11. Окно «Путь Грани» называет вложенное, суму, цену и риск до нажатия.
  12. Самопроверка мира держит строку «echo»; глава, README и docs.
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
  родов:ECHO_KINDS.length,
  уник:new Set(ECHO_KINDS.map(k=>k.id).concat()).size,
  безЗвука:ECHO_KINDS.filter(k=>!SOUND_BANK[k.звук]).map(k=>k.id),
  безСлов:ECHO_KINDS.filter(k=>!k.n||!k.род||!k.о||!k.дар||!k.мера||!(k.k>0)).map(k=>k.id),
  дарыРазные:new Set(ECHO_KINDS.map(k=>k.дар)).size,
  ждём:["edge","hide","ear","vein","step","maw","sight","word"].filter(id=>!ECHO_BY_ID[id])}));
 check('восемь родов осколка, без повторов и все с настоящей записью',
  состав.родов===8&&состав.уник===8&&состав.безЗвука.length===0,состав);
 check('у каждого рода свои слова, своя мера и свой дар',
  состав.безСлов.length===0&&состав.дарыРазные===8&&состав.ждём.length===0,состав);

 /* ── 2. осколок с твари не пляшет ── */
 const сТвари=await page.evaluate(()=>{
  G.echoFrag=null;
  const m={id:"проба_зверь",n:"Пробный зверь",lvl:18};
  const a=Echo.fromFoe(m,"проба"),b=Echo.fromFoe(m,"проба");
  const слаб={id:"мелочь",n:"Мелочь",lvl:1};
  const c=Echo.fromFoe(слаб,"проба");
  const босс=Echo.fromFoe(Object.assign({},m,{boss:true}),"проба");
  return {одинаков:a.род===b.род&&a.стихия===b.стихия&&a.ур===b.ур,
   род:a.род,стихия:a.стихия,ур:a.ур,слабый:c.ур,боссовый:босс.ур,
   родЕсть:!!ECHO_BY_ID[a.род],стихияЕсть:!!ELEM_BY_ID[a.стихия],
   крепость:a.стаб,крепостьСлабого:c.стаб};});
 check('одна и та же тварь даёт один и тот же осколок',
  сТвари.одинаков&&сТвари.родЕсть&&сТвари.стихияЕсть,сТвари);
 check('уровень растёт с тварью, а босс даёт больше; сильный осколок сидит хуже',
  сТвари.ур>сТвари.слабый&&сТвари.боссовый>сТвари.ур
  &&сТвари.крепость<сТвари.крепостьСлабого,сТвари);

 /* ── 3. вместимость ── */
 const вмест=await page.evaluate(()=>{
  const было={deeds:G.deeds,mast:G.mast,dev:G.devour};
  G.deeds={};G.mast={};G.devour=null;G.facetTiers={};
  const мало=Echo.capacity();
  G.mast={arte:{ур:6,оп:0,дел:0}};
  const сРукой=Echo.capacity();
  G.deeds={unweave:5000,devours:5000,imprints:5000};G.deepBest=100;
  const полная=Echo.capacity();
  delete G.deepBest;G.deeds=было.deeds;G.mast=было.mast;G.devour=было.dev;
  return {мало,сРукой,полная};});
 check('вместимость начинается с двух, растёт от артефакторики и от Граней, не выше восьми',
  вмест.мало===2&&вмест.сРукой>вмест.мало&&вмест.полная<=8&&вмест.полная>вмест.сРукой,вмест);

 /* ── 4–5. совместимость, цена ── */
 const цена=await page.evaluate(()=>{
  G.echoFrag={сумка:[],вложено:[Echo.make("edge",3,"e_fire","п")],счёт:5};
  const родня=Echo.make("hide",3,"e_storm","п");   /* огонь ↔ гроза — родня */
  const рознь=Echo.make("hide",3,"e_water","п");   /* огонь ↔ вода — рознь */
  const чужой=Echo.make("hide",3,"e_mind","п");    /* ни то ни сё */
  const o={совмРодня:Echo.compat(родня),совмРознь:Echo.compat(рознь),совмЧужой:Echo.compat(чужой),
   ценаРодня:Echo.cost(родня),ценаРознь:Echo.cost(рознь),
   рискРодня:Echo.risk(родня),рискРознь:Echo.risk(рознь)};
  /* Уровень тоже в цене. */
  G.echoFrag={сумка:[],вложено:[],счёт:5};
  o.ценаМалого=Echo.cost(Echo.make("edge",1,"e_fire","п"));
  o.ценаБольшого=Echo.cost(Echo.make("edge",5,"e_fire","п"));
  G.echoFrag=null;
  return o;});
 check('совместимость считается по родству стихий: родня выше чужого, чужое выше розни',
  цена.совмРодня>цена.совмЧужой&&цена.совмЧужой>цена.совмРознь,цена);
 check('цена вживления — мана, кровь и часы; своё дешевле чужого',
  цена.ценаРодня.мана<цена.ценаРознь.мана&&цена.ценаРодня.здоровье<цена.ценаРознь.здоровье
  &&цена.ценаРодня.часы>0,цена);
 check('сильный осколок вживляется дороже слабого',
  цена.ценаБольшого.мана>цена.ценаМалого.мана,цена);
 check('риск назван и в берегах: с роднёй ниже, с рознью выше',
  цена.рискРодня<цена.рискРознь&&цена.рискРодня>=0.02&&цена.рискРознь<=0.6,цена);

 /* ── 6. вживление: удача и неудача ── */
 const вживление=await page.evaluate(()=>{
  const o={};
  G.mana=400;G.manaMax=400;G.hp=400;G.hpMax=400;G.mast={arte:{ур:6,оп:0,дел:0}};
  /* Удача: подменим случай так, чтобы осколок точно прижился. */
  const rnd=Math.random;
  G.echoFrag={сумка:[Echo.make("edge",2,"e_fire","п")],вложено:[],счёт:5};
  const мана0=G.mana,hp0=G.hp;
  Math.random=()=>0.999;
  o.удача=Echo.fit(0);
  o.вложено=Echo.fitted().length;o.сума=Echo.bag().length;
  o.взяло={мана:мана0-G.mana,здоровье:hp0-G.hp};
  /* Неудача: осколок рассыпается, цена уходит. */
  G.echoFrag={сумка:[Echo.make("hide",5,"e_water","п")],вложено:[Echo.make("edge",5,"e_fire","п")],счёт:5};
  G.mana=400;G.hp=400;
  const мана1=G.mana,hp1=G.hp;
  Math.random=()=>0;
  o.неудача=Echo.fit(0);
  o.послеНеудачиВложено=Echo.fitted().length;o.послеНеудачиСума=Echo.bag().length;
  o.взялоНеудача={мана:мана1-G.mana,здоровье:hp1-G.hp};
  Math.random=rnd;
  /* Вместимость держит. */
  G.echoFrag={сумка:[Echo.make("edge",1,"e_fire","п")],вложено:[],счёт:5};
  G.mast={};G.deeds={};G.devour=null;G.facetTiers={};
  while(Echo.fitted().length<Echo.capacity()){
   Echo.take(Echo.make("edge",1,"e_fire","п"));
   const r=Math.random;Math.random=()=>0.999;Echo.fit(Echo.bag().length-1);Math.random=r;}
  Echo.take(Echo.make("hide",1,"e_fire","п"));
  o.сверх=Echo.fit(Echo.bag().length-1);
  /* Вынуть. */
  const былоВ=Echo.fitted().length,былоС=Echo.bag().length;
  o.вынут=Echo.drop(0);
  o.послеВынимания={вложено:Echo.fitted().length,сума:Echo.bag().length};
  o.сталоМеньше=Echo.fitted().length===былоВ-1&&Echo.bag().length===былоС+1;
  G.echoFrag=null;
  return o;});
 check('удачное вживление кладёт осколок в носителя и берёт ману с кровью',
  вживление.вложено===1&&вживление.сума===0
  &&вживление.взяло.мана>0&&вживление.взяло.здоровье>0
  &&/прижился/.test(вживление.удача),вживление);
 check('неудачное вживление рассыпает осколок, и цена всё равно уходит',
  вживление.послеНеудачиСума===0&&вживление.послеНеудачиВложено===1
  &&вживление.взялоНеудача.мана>0&&/рассыпал/.test(вживление.неудача),вживление);
 check('сверх вместимости не вживляется, и об этом говорят',
  /Вместимость/.test(вживление.сверх),вживление.сверх);
 check('вложенное можно вынуть, и оно возвращается в суму',
  вживление.сталоМеньше&&/вынут/.test(вживление.вынут),вживление);

 /* ── 7. §38: восемь даров вправду меняют мир ── */
 const дары=await page.evaluate(()=>{
  const было={echo:G.echoFrag,deeds:G.deeds,place:G.place};
  const пусто=()=>{G.echoFrag={сумка:[],вложено:[],счёт:1};};
  const с=(род,ур)=>{G.echoFrag={сумка:[],вложено:[Echo.make(род,ур||5,"e_fire","п")],счёт:1};};
  const o={};
  G.deeds={};G.facetTiers={};G.buffs={};G.place=null;
  пусто();o.удар0=atk();o.защ0=def();o.слух0=scapeRad();
  с("edge");o.удар1=atk();
  с("hide");o.защ1=def();
  с("ear");o.слух1=scapeRad();
  /* поступь: черта, за которой тварь чует */
  пусто();o.поступь0=Math.max(2,7-Math.round(Echo.bonus("step")));
  с("step");o.поступь1=Math.max(2,7-Math.round(Echo.bonus("step")));
  /* взгляд: поиск ловушек. Берём способ с низкой основой, чтобы прибавку
     не съел потолок в девяносто пять сотых. */
  пусто();o.ловушки0=Traps.chance("listen","magic");
  с("sight");o.ловушки1=Traps.chance("listen","magic");
  /* слово: цена чары */
  const sp=SPELLS.find(x=>x.n==="Зов горнила")||SPELLS.find(x=>x.n==="Искра запала");
  const взять=()=>{G.spells=[sp.n];G.spellCD={};G.buffs={};G.mana=400;G.manaMax=400;
   G.hp=400;G.hpMax=400;G.inCombat=false;G.combat=null;const до=G.mana;
   castSpell(SPELLS.indexOf(sp));return до-G.mana;};
  пусто();o.чара0=взять();
  с("word");o.чара1=взять();
  /* жила: отдых возвращает ману */
  пусто();o.жила0=Echo.bonus("vein");
  с("vein");o.жила1=Echo.bonus("vein");
  /* пасть: удар лечит */
  пусто();o.пасть0=Echo.bonus("maw");
  с("maw");o.пасть1=Echo.bonus("maw");
  G.echoFrag=было.echo;G.deeds=было.deeds;G.place=было.place;
  return o;});
 check('осколки удара, шкуры и слуха вправду меняют удар, защиту и слышимость',
  дары.удар1>дары.удар0&&дары.защ1>дары.защ0&&дары.слух1>дары.слух0,дары);
 check('осколок поступи отодвигает черту, за которой тварь чует',
  дары.поступь1<дары.поступь0,дары);
 check('осколок взгляда вправду поднимает поиск ловушек',
  дары.ловушки1>дары.ловушки0,дары);
 check('осколок слова вправду удешевляет чару',дары.чара1<дары.чара0,дары);
 check('осколки жилы и пасти считают свой дар',
  дары.жила1>дары.жила0&&дары.пасть1>дары.пасть0,дары);

 /* ── 10. конфликт ── */
 const конфликт=await page.evaluate(()=>{
  G.hp=400;G.hpMax=400;G.mast={};G.deeds={};
  /* Лад: три родственных — устойчиво. */
  G.echoFrag={сумка:[],вложено:[Echo.make("edge",1,"e_fire","п"),
   Echo.make("hide",1,"e_storm","п"),Echo.make("ear",1,"e_metal","п")],счёт:9};
  const лад=Echo.stability();
  let выброшенЛад=0;
  for(let i=0;i<300;i++){G.echoDay=null;G.day=i+2;if(Echo.conflict()){выброшенЛад++;break;}}
  /* Рознь: враждебные стихии — набор рвётся. */
  G.echoFrag={сумка:[],вложено:[Echo.make("edge",5,"e_fire","п"),
   Echo.make("hide",5,"e_water","п"),Echo.make("ear",5,"e_ice","п")],счёт:9};
  const рознь=Echo.stability();
  const было=Echo.fitted().length,hp0=G.hp;
  let слово="";
  for(let i=0;i<300&&!слово;i++){G.echoDay=null;G.day=i+2;слово=Echo.conflict();}
  const o={лад,рознь,выброшенЛад,слово:String(слово).slice(0,100),
   стало:Echo.fitted().length,было,кровь:hp0-G.hp,
   звук:__played.includes("oc_glass_break"),летопись:__jt.some(t=>/конфликт осколков/.test(t))};
  /* Один осколок не конфликтует сам с собой. */
  G.echoFrag={сумка:[],вложено:[Echo.make("edge",5,"e_chaos","п")],счёт:9};
  o.одинНеРвётся=Echo.conflict()==="";
  G.echoFrag=null;
  return o;});
 check('набор родственных стихий устойчив и не рвётся',
  конфликт.лад>конфликт.рознь&&конфликт.выброшенЛад===0,конфликт);
 check('набор из розни сам выбрасывает худшее звено и берёт за это кровью',
  !!конфликт.слово&&конфликт.стало===конфликт.было-1&&конфликт.кровь>0
  &&конфликт.звук&&конфликт.летопись,конфликт);
 check('один осколок сам с собой не дерётся',конфликт.одинНеРвётся,конфликт);

 /* ── 11. окно ── */
 const окно=await page.evaluate(async()=>{
  G.mana=400;G.manaMax=400;G.hp=400;G.hpMax=400;
  G.echoFrag={сумка:[Echo.make("hide",3,"e_water","п")],
   вложено:[Echo.make("edge",2,"e_fire","п")],счёт:9};
  renderPath();
  const box=document.getElementById("pEcho");
  const кн=Array.from(box.querySelectorAll("button"));
  const вжив=кн.filter(b=>/^echofit:/.test(String(b.dataset.cmd||"")));
  const вын=кн.filter(b=>/^echodrop:/.test(String(b.dataset.cmd||"")));
  const o={есть:!!box,вживить:вжив.length,вынуть:вын.length,
   речьВжив:вжив.length?String(вжив[0].dataset.speak||""):"",
   речьВын:вын.length?String(вын[0].dataset.speak||""):"",
   шапка:String((box.querySelector(".list-line")||{}).dataset&&box.querySelector(".list-line").dataset.speak||""),
   команда:typeof CMD.echofit==="function"&&typeof CMD.echodrop==="function"&&typeof CMD.echosay==="function"};
  G.echoFrag=null;
  return o;});
 check('в окне «Путь Грани» есть раздел осколков с кнопками вживления и вынимания',
  окно.есть&&окно.вживить===1&&окно.вынуть===1&&окно.команда,окно);
 check('кнопка сумы называет совместимость, цену и риск до нажатия',
  /совместимость/i.test(окно.речьВжив)&&/цена/i.test(окно.речьВжив)&&/риск/i.test(окно.речьВжив),окно.речьВжив);
 check('шапка раздела называет вложенное, вместимость и устойчивость',
  /Вложено 1 из/.test(окно.шапка)&&/устойчивость/.test(окно.шапка),окно.шапка);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Эхо: осколки/i.test(g.title));
  return {e:r.find(x=>x.id==="echo"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("ECHO"),текст:String(Modules.get("ECHO").text()).slice(0,200)};});
 check('самопроверка мира держит зелёную строку «echo»',
  !!свод.e&&свод.e.ok===true,свод.e);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль осколков зарегистрирован и говорит о себе',
  свод.модуль&&/Вложено/.test(свод.текст),свод.текст);
 check('в руководстве есть глава об осколках',свод.глава&&свод.строк>=7,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о восьми родах, вместимости и конфликте',
  /Эхо: осколки/i.test(readme)&&/Восемь родов/i.test(readme)
  &&/Вместимость/i.test(readme)&&/Конфликт не слово/i.test(readme));
 check('docs/МИР.md держит формулы и таблицу родов',
  /ECHO_KINDS/.test(mir)&&/capacity/.test(mir)&&/stability/.test(mir)&&/fromFoe/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

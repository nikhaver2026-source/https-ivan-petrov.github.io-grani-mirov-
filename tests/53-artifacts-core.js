/* ════════════════════════════════════════════════════════════════════════
   ЯДРО АРТЕФАКТОВ

   Артефакт был СТРОКОЙ. «Сердце Бури 407» — и всё: ни ранга, ни качества,
   ни свойств, ни цены. Выдавали его три разных обработчика, каждый по-своему
   и ни один не знал о двух других; вещь ничего не делала, продать её было
   нельзя, а окно честно обещало двадцать шесть тысяч, показывая список строк.

   Теперь артефакт — запись, и все входы сведены в один. Характеристики,
   цена, требования и редкость не хранятся, а считаются из записи одной
   функцией. Здесь проверяется ровно это: что счёт один, что он не
   задваивается, что бессмысленное не собирается, что цена честна, что вещь
   растёт, что старые сохранения не потеряны и что всё это входит в бой,
   в торг, в ремесло и в сохранение.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Таблицы без дыр ── */
 const реестр=await page.evaluate(()=>{
  const беды=[];
  const идС=new Set();
  ART_STATS.forEach(st=>{
   if(идС.has(st.id))беды.push("двойной стат "+st.id);идС.add(st.id);
   if(!st.n||!st.о||!(st.предел>0)||!(st.шаг>0))беды.push("стат "+st.id);
   if(!(ART_STAT_WORTH[st.id]>0))беды.push("стат без цены "+st.id);});
  const идН=new Set();
  ART_DIRS.forEach(d=>{
   if(идН.has(d.id))беды.push("двойное направление "+d.id);идН.add(d.id);
   if(!d.n||!d.о||d.о.length<20)беды.push("направление "+d.id);
   if(!(d.своё||[]).length)беды.push(d.id+": нечему быть своим");
   (d.своё||[]).forEach(x=>{if(!ART_STAT_BY_ID[x])беды.push(d.id+": нет стата "+x);});
   (d.ремёсла||[]).forEach(c=>{if(!ART_CRAFT_BY_ID[c])беды.push(d.id+": нет ремесла "+c);});
   if(!SOUND_BANK[d.звук]&&!BEACONS[d.звук])беды.push(d.id+": нет звука "+d.звук);
   if(!(d.слово||[]).length)беды.push(d.id+": нечем назвать");});
  ART_RANKS.forEach((r,i)=>{
   if(r.id!==i)беды.push("ранг не по порядку "+i);
   if(!r.n||!r.о||!(r.мощь>0)||!(r.свойств>0)||!(r.цена>0)||!(r.уровень>0))беды.push("ранг "+i);});
  ART_QUAL.forEach((q,i)=>{
   if(q.id!==i)беды.push("качество не по порядку "+i);
   if(!q.n||!q.о||!(q.k>0)||q.порог===undefined||q.сбой===undefined)беды.push("качество "+i);});
  ART_PARTS.forEach(p=>{
   if(!ART_PART_KINDS[p.род])беды.push("часть "+p.id+": род "+p.род);
   if(!p.n||!p.о)беды.push("часть "+p.id+": не описана");
   if(!Object.keys(p.даёт||{}).length)беды.push("часть "+p.id+": ничего не даёт");
   Object.keys(p.даёт||{}).forEach(k=>{if(!ART_STAT_BY_ID[k])беды.push(p.id+": нет стата "+k);});});
  ART_ENCHANTS.forEach(e=>{
   Object.keys(e.даёт||{}).forEach(k=>{if(!ART_STAT_BY_ID[k])беды.push("чары "+e.id+": нет стата "+k);});});
  ART_COMBOS.forEach(c=>{
   (c.части||[]).forEach(x=>{if(!ART_PART_BY_ID[x])беды.push("сочетание "+c.id+": нет части "+x);});
   if(c.напр&&!ART_DIR_BY_ID[c.напр])беды.push("сочетание "+c.id+": нет направления");
   if(!c.о||c.о.length<20)беды.push("сочетание "+c.id+": не описано");});
  ART_CURSES.forEach(c=>{
   Object.keys(c.берёт||{}).forEach(k=>{if(!ART_STAT_BY_ID[k])беды.push("проклятие "+c.id+": нет стата "+k);});
   if(Object.values(c.берёт||{}).some(v=>v>=0))беды.push("проклятие "+c.id+": не отнимает");});
  ART_GROWTH.forEach(g=>{
   Object.keys(g.даёт||{}).forEach(k=>{if(!ART_STAT_BY_ID[k])беды.push("ступень "+g.id+": нет стата "+k);});
   (g.дом||[]).forEach(d=>{if(!ART_DIR_BY_ID[d])беды.push("ступень "+g.id+": нет направления "+d);});});
  ART_RECIPES.forEach(r=>{
   if(!ART_CRAFT_BY_ID[r.ремесло])беды.push("рецепт "+r.id+": нет ремесла");
   if(!ART_DIR_BY_ID[r.дом])беды.push("рецепт "+r.id+": нет направления");
   if(!ART_RANKS[r.ранг])беды.push("рецепт "+r.id+": нет ранга");
   if(!Object.keys(r.нужно||{}).length)беды.push("рецепт "+r.id+": не из чего");
   (r.части||[]).forEach(x=>{if(!ART_PART_BY_ID[x])беды.push("рецепт "+r.id+": нет части "+x);});
   if(!r.о||r.о.length<15)беды.push("рецепт "+r.id+": не описан");});
  ART_CRAFTS.forEach(c=>{
   if(!SOUND_BANK[c.звук]&&!BEACONS[c.звук])беды.push("ремесло "+c.id+": нет звука");
   if(!c.о||c.о.length<25)беды.push("ремесло "+c.id+": не описано");
   if(typeof c.умение!=="function")беды.push("ремесло "+c.id+": нечем мерить умение");});
  return {беды:беды.slice(0,6),
   статов:ART_STATS.length,направлений:ART_DIRS.length,рангов:ART_RANKS.length,
   качеств:ART_QUAL.length,частей:ART_PARTS.length,чар:ART_ENCHANTS.length,
   сочетаний:ART_COMBOS.length,проклятий:ART_CURSES.length,нравов:ART_MINDS.length,
   ступеней:ART_GROWTH.length,ремёсел:ART_CRAFTS.length,рецептов:ART_RECIPES.length};});
 check('все таблицы артефактов сходятся друг с другом',реестр.беды.length===0,реестр.беды);
 check('направлений тринадцать, рангов семь, качеств шесть',
  реестр.направлений===13&&реестр.рангов===7&&реестр.качеств===6,реестр);
 check('частей, зачарований, сочетаний и ступеней хватает, чтобы собирать разное',
  реестр.частей>=28&&реестр.чар>=8&&реестр.сочетаний>=10&&реестр.ступеней>=10,реестр);
 check('ремёсел пять, рецептов много, проклятий и нравов по восемь',
  реестр.ремёсел===5&&реестр.рецептов>=24&&реестр.проклятий===8&&реестр.нравов===8,реестр);

 /* ── 2. Ранг решает силу, число свойств, гнёзда, цену и требования ── */
 const ранги=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.artifacts=[];G.level=99;
  const ряд=[0,1,2,3,4,5,6].map(r=>{
   const a=ART.make({дом:"war",ранг:r,кач:2,seed:77});
   const s=ART.stats(a).статы;
   return {r,свойств:Object.keys(s).length,гнёзд:ART.slots(a).всего,
    цена:ART.price(a),сила:s.сила||0,уровень:ART_RANKS[r].уровень};});
  const растёт=(k)=>ряд.every((x,i)=>i===0||x[k]>=ряд[i-1][k]);
  return {ряд,ценаРастёт:растёт("цена"),свойстваРастут:растёт("свойств"),
   гнёздаРастут:растёт("гнёзд"),уровеньРастёт:растёт("уровень"),
   разброс:ряд[6].цена/Math.max(1,ряд[0].цена)};});
 check('с рангом растут цена, число свойств, гнёзда и требуемый уровень',
  ранги.ценаРастёт&&ранги.свойстваРастут&&ранги.гнёздаРастут&&ранги.уровеньРастёт,ранги.ряд);
 check('мифическая вещь дороже простой в сотни раз, а не в разы',
  ранги.разброс>=200,Math.round(ранги.разброс));

 /* ── 3. Качество меняет силу и цену при том же ранге ── */
 const качество=await page.evaluate(()=>{
  const ряд=[0,1,2,3,4,5].map(q=>{
   const a=ART.make({дом:"def",ранг:3,кач:q,seed:88});
   return {q,цена:ART.price(a),сумма:Object.values(ART.stats(a).статы)
    .reduce((s,v)=>s+Math.abs(v),0)};});
  return {ряд,ценаРастёт:ряд.every((x,i)=>i===0||x.цена>ряд[i-1].цена),
   силаРастёт:ряд.every((x,i)=>i===0||x.сумма>=ряд[i-1].сумма)};});
 check('качество при том же ранге меняет и силу, и цену',
  качество.ценаРастёт&&качество.силаРастёт,качество.ряд);

 /* ── 4. Счёт один: ничто не задваивается и не пробивает предел ── */
 const счёт=await page.evaluate(()=>{
  G.level=99;
  /* Две части, дающие одно и то же, складываются в одну строку. */
  const a=ART.make({дом:"war",ранг:6,кач:5,seed:5});
  a.база={};                       /* только части, чтобы считать чисто */
  a.части=["r_sila"];
  const одна=ART.stats(a).статы.сила||0;
  /* Предел не пробивается, сколько ни накладывай. */
  const b=ART.make({дом:"war",ранг:6,кач:5,seed:6});
  b.база={крит:0.4};b.части=["r_ostr","e_krovi"];b.чары="en_ostr";
  const крит=ART.stats(b).статы.крит||0;
  const предел=ART_STAT_BY_ID.крит.предел;
  /* Неизвестный стат не проходит вовсе. */
  const c=ART.make({дом:"war",ранг:2,кач:2,seed:7});
  c.база={выдуманный:99};
  const левый=ART.stats(c).статы.выдуманный;
  /* Чужое направлению входит вполсилы. */
  const d=ART.make({дом:"def",ранг:3,кач:2,seed:8});
  d.база={};d.части=["r_ostr"];
  const чужое=ART.stats(d).статы.крит||0;
  const e=ART.make({дом:"war",ранг:3,кач:2,seed:8});
  e.база={};e.части=["r_ostr"];
  const своё=ART.stats(e).статы.крит||0;
  return {одна,крит,предел,левый,чужое,своё,
   вполсилы:ART.stats(d).вполсилы};});
 check('одинаковые прибавки сливаются в одну строку, а не в две',
  счёт.одна===6,счёт.одна);
 check('предел характеристики не пробивается, сколько ни накладывай',
  счёт.крит===счёт.предел,счёт);
 check('выдуманной характеристики не бывает: она не проходит в счёт',
  счёт.левый===undefined,счёт.левый);
 check('чужое направлению входит ровно вполсилы и об этом сказано',
  счёт.чужое===счёт.своё/2&&счёт.вполсилы.indexOf("крит")>=0,счёт);

 /* ── 5. Сочетания и запреты ── */
 const сборка=await page.evaluate(()=>{
  G.level=99;G.artifacts=[];G.comps={};
  const a=ART.make({дом:"war",ранг:5,кач:3,seed:9});
  a.база={};
  const без=ART.stats({...a,части:["c_gorn"]}).статы.сила||0;
  a.части=["c_gorn","r_sila"];
  const с=ART.stats(a);
  /* Запрет: огонь и стужа в одну оправу не идут. */
  const b=ART.make({дом:"elem",ранг:5,кач:3,seed:10});
  G.artifacts=[b];
  /* Огня берём два: иначе вторая попытка упёрлась бы в «нет части» и
     проверка на повтор не сработала бы вовсе. */
  artAddPart("k_ogon",2);artAddPart("k_lyod",1);artAddPart("r_sila",2);
  window.__said=[];
  const первый=artSocket(0,"k_ogon");
  window.__said=[];
  const спор=artSocket(0,"k_lyod");
  const словаСпора=речь();
  window.__said=[];
  const дважды=artSocket(0,"k_ogon");
  const словаПовтора=речь();
  return {без,сСочет:с.статы.сила,сочетания:с.сочетания,
   первый,спор,дважды,
   словаСпора:словаСпора.slice(0,120),словаПовтора:словаПовтора.slice(0,120)};});
 check('сложившийся набор частей даёт то, чего не даёт ни одна из них',
  сборка.сочетания.indexOf("kuznya")>=0&&сборка.сСочет>сборка.без,сборка);
 check('спорящие части в одну оправу не идут, и отказ объясняется',
  сборка.первый===true&&сборка.спор===false&&/не сходится|гасят/i.test(сборка.словаСпора),
  сборка.словаСпора);
 check('одну и ту же часть дважды не вложить, и сказано почему',
  сборка.дважды===false&&/уже стоит|предел/i.test(сборка.словаПовтора),сборка.словаПовтора);

 /* ── 6. Проклятие отнимает, нрав и нестабильность считаются ── */
 const изнанка=await page.evaluate(()=>{
  G.level=99;
  const a=ART.make({дом:"def",ранг:4,кач:3,seed:12});
  const до=ART.stats(a).статы.защита||0;
  const ценаДо=ART.price(a);
  a.проклятие="cu_hrupkost";
  const после=ART.stats(a).статы.защита||0;
  const ценаПосле=ART.price(a);
  /* Нестабильность — доля, а не «да/нет». */
  const b=ART.make({дом:"war",ранг:2,кач:0,seed:13});
  b.нестаб=0.5;
  let подвела=0;for(let i=0;i<400;i++)if(artFails(b))подвела++;
  /* Разумная вещь имеет мнение, и мнение меняется от поступков. */
  const c=ART.make({дом:"leg",ранг:5,кач:3,seed:14});
  c.нрав="mi_zhadnyy";
  G.gold=0;const бедный=artMood(c);
  G.gold=8000;const богатый=artMood(c);
  return {до,после,ценаДо,ценаПосле,доля:подвела/400,бедный,богатый,
   описание:ART.describe(a).slice(0,400)};});
 check('проклятие отнимает тем же счётом, каким вещь даёт',
  изнанка.после<изнанка.до,изнанка);
 check('проклятая вещь стоит дешевле такой же чистой',
  изнанка.ценаПосле<изнанка.ценаДо,изнанка);
 check('нестабильность — доля, и она честно срабатывает примерно в половине',
  изнанка.доля>0.35&&изнанка.доля<0.65,изнанка.доля);
 check('разумная вещь меняет мнение от поступков хозяина',
  изнанка.богатый>изнанка.бедный,изнанка);
 check('о проклятии сказано словами, а не спрятано в числах',
  /Проклятие/.test(изнанка.описание),изнанка.описание.slice(0,160));

 /* ── 7. Требования ── */
 const требования=await page.evaluate(()=>{
  G.artifacts=[];G.artMax={hp:0,mana:0};
  const a=ART.make({дом:"leg",ранг:6,кач:3,seed:15});
  a.база={сила:40};
  G.artifacts=[a];
  G.level=1;artSyncMax();
  const мало=ART.lacks(a),силаМало=ART.sum("сила"),работаетМало=ART.works(a);
  G.level=99;
  const хватит=ART.lacks(a),силаМного=ART.sum("сила"),работаетМного=ART.works(a);
  /* Требование не только по уровню. */
  const b=ART.make({дом:"fact",ранг:2,кач:2,seed:16});
  b.требует={клан:"Несуществующий клан"};
  const клан=ART.lacks(b);
  G.artifacts=[];G.artMax={hp:0,mana:0};
  return {мало,хватит,силаМало,силаМного,работаетМало,работаетМного,клан};});
 check('вещь не по уровню лежит мёртвым грузом и ничего не даёт',
  требования.мало.length>0&&требования.силаМало===0&&требования.работаетМало===false,требования);
 check('та же вещь в срок работает целиком',
  требования.хватит.length===0&&требования.силаМного===40&&требования.работаетМного===true,требования);
 check('требовать можно не только уровень: клан, народ, навык, знание',
  требования.клан.length===1&&/клан/i.test(требования.клан[0]),требования.клан);

 /* ── 8. Предел здоровья и маны: сверка идемпотентна ── */
 const пределы=await page.evaluate(()=>{
  G.level=99;G.artifacts=[];G.artMax={hp:0,mana:0};
  G.hpMax=500;G.hp=500;G.manaMax=200;G.mana=200;
  const a=ART.make({дом:"def",ранг:5,кач:4,seed:17});
  a.база={здоровье:100,мана:60};
  G.artifacts=[a];
  artSyncMax();const раз={hp:G.hpMax,mana:G.manaMax};
  artSyncMax();artSyncMax();artSyncMax();const много={hp:G.hpMax,mana:G.manaMax};
  G.artifacts=[];artSyncMax();const снято={hp:G.hpMax,mana:G.manaMax};
  G.artMax={hp:0,mana:0};
  return {раз,много,снято,
   идемпотентно:раз.hp===много.hp&&раз.mana===много.mana,
   вернулось:снято.hp===500&&снято.mana===200};});
 check('предел здоровья и маны растёт от вещи и не растёт от повторной сверки',
  пределы.идемпотентно===true&&пределы.раз.hp===600,пределы);
 check('снятая вещь возвращает пределы ровно туда, где они были',
  пределы.вернулось===true,пределы);

 /* ── 9. Ремесло: качество из умения, припас тратится, вещь выходит ── */
 const ремесло=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.level=40;G.artifacts=[];G.comps={};G.recipes={};
  G.str=20;G.mind=20;G.cha=20;
  G.inv={руда:20,камень:10,кость:10,кристалл:10,трава:10,грибы:6};
  /* Вне мастерской не делают. */
  G.place=null;
  const вПоле=artCraftHere();
  window.__said=[];
  const мимо=artCraft("rp_obod");
  const словаМимо=речь();
  /* В кузне делают. */
  G.place={kind:"house",bx:400,by:400,stype:"forge",depth:0,name:"Кузня",x:1,y:1};
  const c=artCraftHere();
  const умение=artSkillHere("кузня");
  const своиРецепты=artRecipesHere().map(r=>r.id);
  const рудаДо=G.inv.руда;
  const вещь=artCraft("rp_obod");
  const рудаПосле=G.inv.руда||0;
  /* Умение решает качество: пороги таблицы — это и есть умение. */
  const качества=[0,20,40,60,90].map(u=>artQualityFor(u,0));
  /* Чужое ремесло здесь не идёт. */
  window.__said=[];
  const чужое=artCraft("rp_znak");
  const словаЧужого=речь();
  while(activeLayer())closeTopUI();G.place=null;
  return {вПоле:!!вПоле,мимо:мимо===null,словаМимо:словаМимо.slice(0,90),
   ремесло:c&&c.id,умение,своиРецепты,
   сделана:!!вещь,вещьЗапись:!!(вещь&&вещь.дом&&вещь.база),
   припас:рудаДо-рудаПосле,качества,
   чужое:чужое===null,словаЧужого:словаЧужого.slice(0,90)};});
 check('вне мастерской артефакт не выйдет, и сказано куда идти',
  ремесло.вПоле===false&&ремесло.мимо===true&&/кузн|башн|школ|храм/i.test(ремесло.словаМимо),
  ремесло.словаМимо);
 check('в кузне своё ремесло и свои рецепты',
  ремесло.ремесло==="кузня"&&ремесло.своиРецепты.length>=2&&
  ремесло.своиРецепты.indexOf("rp_obod")>=0,ремесло);
 check('сделанная вещь — настоящая запись, и припас на неё потрачен',
  ремесло.сделана===true&&ремесло.вещьЗапись===true&&ремесло.припас===2,ремесло);
 check('качество выходит из умения мастера, а не из удачи',
  ремесло.качества[0]===0&&ремесло.качества[4]===5&&
  ремесло.качества.every((q,i)=>i===0||q>=ремесло.качества[i-1]),ремесло.качества);
 check('чужое ремесло в этой мастерской не делают',
  ремесло.чужое===true&&/здесь этим не занимаются/i.test(ремесло.словаЧужого),
  ремесло.словаЧужого);

 /* ── 10. Гнёзда: вложить, вынуть, зачаровать ── */
 const гнёзда=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.level=99;G.gold=99999;G.artifacts=[];G.comps={};
  const a=ART.make({дом:"myst",ранг:4,кач:3,seed:18});
  G.artifacts=[a];
  artAddPart("r_tish",1);artAddPart("e_shept",1);
  artSocket(0,"r_tish");artSocket(0,"e_shept");
  const послеВкладки=(a.части||[]).slice();
  /* Руна возвращается, эссенция выдыхается. */
  artUnsocket(0,"r_tish");
  const рунаВернулась=(Number(G.comps.r_tish)||0)===1;
  artUnsocket(0,"e_shept");
  const эссенцияПропала=!(G.comps.e_shept);
  /* Зачаровывают только там, где умеют. */
  G.place=null;
  window.__said=[];
  const мимо=artEnchant(0,"en_tish");
  const словаМимо=речь();
  G.place={kind:"house",bx:500,by:500,stype:"tower",depth:0,name:"Башня",x:1,y:1};
  const золотоДо=G.gold;
  const зач=artEnchant(0,"en_tish");
  const золотоПосле=G.gold;
  const первое=a.чары;
  /* Второе зачарование стирает первое. */
  const зач2=artEnchant(0,"en_dolya");
  const второе=a.чары;
  while(activeLayer())closeTopUI();G.place=null;
  return {послеВкладки,рунаВернулась,эссенцияПропала,
   мимо:мимо===false,словаМимо:словаМимо.slice(0,80),
   зач,потрачено:золотоДо-золотоПосле,первое,зач2,второе,
   одноЗачарование:второе==="en_dolya"};});
 check('часть встаёт в гнездо и держится там',
  гнёзда.послеВкладки.length===2,гнёзда.послеВкладки);
 check('вынутая руна возвращается в суму, а эссенция выдыхается',
  гнёзда.рунаВернулась===true&&гнёзда.эссенцияПропала===true,гнёзда);
 check('зачаровывают в башне и в школе, а не где придётся',
  гнёзда.мимо===true&&/башн|школ/i.test(гнёзда.словаМимо),гнёзда.словаМимо);
 check('зачарование стоит золота и ложится на вещь',
  гнёзда.зач===true&&гнёзда.потрачено>0&&гнёзда.первое==="en_tish",гнёзда);
 check('второе зачарование стирает первое: их не бывает двух',
  гнёзда.одноЗачарование===true,гнёзда);

 /* ── 11. Вещь растёт вместе с хозяином ── */
 const рост=await page.evaluate(()=>{
  G.level=99;G.artifacts=[];G.comps={};
  const a=ART.make({дом:"war",ранг:4,кач:3,seed:19});
  const доСил=ART.stats(a).статы.сила||0;
  const доЦена=ART.price(a);
  const пороги=[artNextStep(a)];
  for(let i=0;i<12;i++)artGain(a,80);
  пороги.push(artNextStep(a));
  const послеСил=ART.stats(a).статы.сила||0;
  const послеЦена=ART.price(a);
  /* Ступени берутся из своего направления, а не из любого. */
  const чужие=(a.ступени||[]).filter(id=>
   ((ART_GROWTH_BY_ID[id]||{}).дом||[]).indexOf("war")<0);
  /* Поглощение части даёт опыт вместо гнезда. */
  const b=ART.make({дом:"war",ранг:0,кач:2,seed:20});
  G.artifacts=[b];artAddPart("c_serdce",1);
  const опытДо=b.опыт||0;
  const съел=artDevour(b,"c_serdce");
  const частиПосле=Number(G.comps.c_serdce)||0;
  const выросло=(b.опыт||0)>опытДо||((b.ступени||[]).length>0);
  return {ступеней:(a.ступени||[]).length,чужие,
   сила:{до:доСил,после:послеСил},цена:{до:доЦена,после:послеЦена},
   порогРастёт:пороги[1]>пороги[0],
   съел,частиПосле,выросло};});
 check('вещь открывает ступени от опыта, и ступени — своего направления',
  рост.ступеней>=2&&рост.чужие.length===0,рост);
 check('открытая ступень делает вещь сильнее и дороже',
  рост.сила.после>рост.сила.до&&рост.цена.после>рост.цена.до,рост);
 check('каждая следующая ступень даётся тяжелее предыдущей',рост.порогРастёт===true);
 check('редкую часть можно скормить вещи вместо того, чтобы вкладывать',
  рост.съел===true&&рост.частиПосле===0&&рост.выросло===true,рост);

 /* ── 12. Всё сведено в один вход: трёх прежних обработчиков больше нет ── */
 const входы=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.level=40;G.artifacts=[];G.place=null;G.x=800;G.y=800;
  /* Находка. */
  const найден=findArtifact({глубина:30,seed:123});
  /* Тайник. */
  G.place={kind:"house",bx:600,by:600,stype:"tower",depth:0,name:"Башня",x:2,y:2};
  const v=secretVault(600,600,2,2);
  /* Дар за Гранью. */
  G.dark=true;
  const дар=safeFn(()=>giveDarkPrize({вид:"артефакт",что:"Пробная чаша"}),"");
  G.dark=false;
  while(activeLayer())closeTopUI();G.place=null;
  const всё=(G.artifacts||[]);
  return {найден:!!(найден&&найден.дом&&найден.база),
   найденОписан:найден?ART.describe(найден,true).slice(0,110):"",
   всеЗаписи:всё.every(a=>a&&typeof a==="object"&&!!ART_DIR_BY_ID[a.дом]),
   штук:всё.length,
   дарЗапись:/артефакт|ранг|качеств|изготовлен/i.test(String(дар)),
   тайникРод:v.приз&&v.приз.вид};});
 check('находка отдаёт настоящую запись, а не строку',
  входы.найден===true&&/ранг|артефакт/i.test(входы.найденОписан),входы.найденОписан);
 check('дар за Гранью проходит тем же входом и тоже описан',входы.дарЗапись===true,входы);
 check('в суме нет ни одной строки: все артефакты — записи',
  входы.всеЗаписи===true&&входы.штук>=2,входы);

 /* ── 13. Прежние сохранения не потеряны ── */
 const старое=await page.evaluate(()=>{
  G.artifacts=["Сердце Бури 407","Осколок Зари 118","Ключ без замка"];
  const было=artMigrate();
  const стало=(G.artifacts||[]).map(a=>({имя:a.имя,дом:a.дом,
   считается:Object.keys(ART.stats(a).статы).length>0}));
  /* Второй проход ничего не трогает. */
  const второй=artMigrate();
  /* Имена сохранены. */
  const именаЦелы=стало.every(x=>/Сердце Бури|Осколок Зари|Ключ без замка/.test(x.имя));
  return {было,второй,стало,именаЦелы};});
 check('строки из прежних сохранений становятся настоящими записями',
  старое.было===3&&старое.стало.every(x=>x.дом&&x.считается),старое);
 check('имена прежних находок сохранены, а второй проход их не трогает',
  старое.именаЦелы===true&&старое.второй===0,старое);

 /* ── 14. Артефакты входят в бой, торг и сохранение ── */
 const мир=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.level=99;G.artifacts=[];G.artMax={hp:0,mana:0};G.str=20;G.agi=20;
  const безУдара=atk(),безЗащиты=def();
  const a=ART.make({дом:"war",ранг:5,кач:4,seed:22});
  a.база={сила:30,защита:20};
  G.artifacts=[a];
  const сУдаром=atk(),сЗащитой=def();
  /* Продажа: цена из того же счёта. */
  G.gold=0;
  const цена=ART.price(a);
  const продал=artSell(0);
  const выручка=G.gold;
  /* Сохранение и загрузка. */
  G.artifacts=[];G.comps={};G.recipes={};
  const b=ART.make({дом:"elem",ранг:4,кач:3,seed:23});
  b.части=["k_ogon"];b.чары="en_zova";b.ступени=["gr_zov"];b.опыт=17;
  G.artifacts=[b];artAddPart("r_sila",3);artLearnRecipe("rp_pepel","проба");
  saveGame(true);
  const сырое=String(localStorage.getItem(SAVE_KEY)||"");
  /* Портим и чиним. */
  G.artifacts=["мусор",null,{дом:"выдуманное"}];G.comps=7;G.recipes=[];
  safeFn(()=>GameIntegrity.repair());
  const починено=Array.isArray(G.artifacts)&&
   G.artifacts.every(x=>x&&typeof x==="object"&&!!ART_DIR_BY_ID[x.дом])&&
   G.comps&&typeof G.comps==="object"&&!Array.isArray(G.comps)&&
   G.recipes&&typeof G.recipes==="object"&&!Array.isArray(G.recipes);
  const загр=safeFn(()=>loadGame(),false);
  const вернулось=(G.artifacts||[]).find(x=>x&&x.дом==="elem");
  return {удар:{без:безУдара,с:сУдаром},защита:{без:безЗащиты,с:сЗащитой},
   цена,продал,выручка,
   вСохранении:/"дом"/.test(сырое)&&/k_ogon/.test(сырое)&&/rp_pepel/.test(сырое),
   починено,загр:загр!==false,
   вернулось:!!(вернулось&&(вернулось.части||[]).indexOf("k_ogon")>=0&&
    вернулось.чары==="en_zova"&&(вернулось.ступени||[]).indexOf("gr_zov")>=0),
   частиВернулись:(Number((G.comps||{}).r_sila)||0)===3,
   рецептВернулся:!!(G.recipes&&G.recipes.rp_pepel)};});
 check('артефакты прибавляют к удару и к защите через те же функции, что и всё',
  мир.удар.с===мир.удар.без+30&&мир.защита.с===мир.защита.без+20,мир);
 check('артефакт продаётся, и выручка считается из той же цены',
  мир.продал===true&&мир.выручка>0&&мир.выручка<мир.цена,мир);
 check('запись, части, зачарование, ступени и рецепты попадают в сохранение',
  мир.вСохранении===true,мир);
 check('битые артефакты, части и рецепты чинятся, а не роняют игру',мир.починено===true);
 check('после загрузки вещь возвращается со всем, что в ней было',
  мир.загр===true&&мир.вернулось===true&&мир.частиВернулись===true&&
  мир.рецептВернулся===true,мир);

 /* ── 15. Окно артефактов говорит за себя ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.level=99;G.artifacts=[];G.comps={};
  const a=ART.make({дом:"war",ранг:3,кач:3,seed:24});
  G.artifacts=[a];artAddPart("r_sila",1);
  openModal("modal-artifacts");renderArtifacts();
  const ящик=document.getElementById("artList");
  const строк=ящик?ящик.querySelectorAll(".list-line").length:0;
  const немые=ящик?[...ящик.querySelectorAll(".list-line")].filter(e=>!e.getAttribute("data-speak")).length:0;
  const счёт=(document.getElementById("artFound")||{}).textContent;
  const есть=(ящик&&ящик.textContent||"");
  while(activeLayer())closeTopUI();
  return {строк,немые,счёт,
   называет:есть.indexOf(a.имя)>=0,
   естьКнопки:!!(ящик&&ящик.querySelector("[data-cmd^='artsock']"))};});
 check('окно артефактов перечисляет вещи и называет их',
  окно.строк>=2&&окно.называет===true,окно);
 check('каждая строка окна читается вслух: немых нет',окно.немые===0,окно.немые);
 check('в окне есть чем вложить часть',окно.естьКнопки===true);
 check('счётчик показывает столько вещей, сколько их есть',окно.счёт==="1",окно.счёт);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 129: ВЕСЁЛЫЕ СЛУЧАИ (§7 брифа)

   §7 просит от мира крупных цепочек, детективов, политических линий,
   ЮМОРИСТИЧЕСКИХ СОБЫТИЙ и экспедиций. Всё было, кроме юмористических:
   мир умел пугать, требовать и награждать, но не смешить — ни одного
   весёлого случая на четырнадцать случайных событий.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Двенадцать случаев; у каждого имя, положение, развязка и место.
   2. Две записи, а не одна: та, что ставит положение, и та, что даёт
      развязку. Обе настоящие, обе разные, и ни одна не повторяется
      у двенадцати — иначе шутки сливаются в одну.
   3. Развязка приходит ОТДЕЛЬНО и с паузой. Для незрячего игрока это и
      есть шутка: без второй записи она просто не случается.
   4. Никто не унижен: в текстах нет ни чужой беды, ни немощи, ни народа,
      ни веры как предмета насмешки.
   5. Случай не пустой (§38): после каждого остаётся вещь, монета, здоровье
      или эфир, своя ось отношения и минус десять стресса.
   6. Место соблюдается: вол только на тракте, кот только там, где храм;
      в бою и под землёй не случается ни один.
   7. Галочка выключает группу целиком и не трогает остальные события мира.
   8. Счёт групп раздельный: четырнадцать обычных случайных, два на время
      Сопряжения, двенадцать весёлых.
   9. Самопроверка мира держит строку «mirth»; руководство, README и docs
      рассказывают о трёх правилах.
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
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(r);return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>({
  сколько:MIRTH_EVENTS.length,даров:MIRTH_GIFTS.length,
  имена:MIRTH_EVENTS.map(m=>m.n),
  полны:MIRTH_EVENTS.every(m=>m.n&&m.о&&m.что&&m.где),
  записи:MIRTH_EVENTS.every(m=>SOUND_BANK[m.звук]&&SOUND_BANK[m.шутка]),
  разные:MIRTH_EVENTS.every(m=>m.звук!==m.шутка),
  своихПоложений:new Set(MIRTH_EVENTS.map(m=>m.звук)).size,
  своихРазвязок:new Set(MIRTH_EVENTS.map(m=>m.шутка)).size,
  идУникальны:new Set(MIRTH_EVENTS.map(m=>m.id)).size,
  места:[...new Set(MIRTH_EVENTS.map(m=>m.где))].sort()}));
 check('двенадцать весёлых случаев, и у каждого имя, положение, развязка и место',
  состав.сколько===12&&состав.даров===12&&состав.полны&&состав.идУникальны===12,состав);
 check('у случая ДВЕ записи, а не одна, и они разные',
  состав.записи&&состав.разные,состав);
 check('ни одна запись не повторяется у двенадцати: ни та, что ставит положение, ни та, что даёт развязку',
  состав.своихПоложений===12&&состав.своихРазвязок===12,
  {положений:состав.своихПоложений,развязок:состав.своихРазвязок});
 check('места названы: дорога, город, селение, храм, трактир',
  состав.места.length>=4&&состав.места.indexOf("дорога")>=0&&состав.места.indexOf("город")>=0,состав.места);

 /* ── 2. развязка приходит отдельно и с паузой ── */
 const слышно=await page.evaluate(()=>{
  __played.length=0;
  const m=MIRTH_BY_ID["mirth_barrel"];
  Mirth.сыграть(m);
  return {сразу:__played.slice(),ждали:[m.звук,m.шутка]};});
 const сразуБылоПоложение=слышно.сразу.indexOf(слышно.ждали[0])>=0;
 const сразуНеБылоРазвязки=слышно.сразу.indexOf(слышно.ждали[1])<0;
 await page.waitForTimeout(1900);
 const слышно2=await page.evaluate(()=>({потом:__played.slice()}));
 check('положение звучит сразу, а развязка — нет: она ещё впереди',
  сразуБылоПоложение&&сразуНеБылоРазвязки,
  {сразу:слышно.сразу,ждали:слышно.ждали});
 check('развязка приходит отдельной записью через паузу — для незрячего это и есть шутка',
  слышно2.потом.indexOf(слышно.ждали[1])>=0,
  {потом:слышно2.потом,ждали:слышно.ждали});

 /* ── 3. никто не унижен ── */
 const тексты=await page.evaluate(()=>MIRTH_EVENTS.map(m=>`${m.n} ${m.о} ${m.что}`).join(" ").toLowerCase());
 const дурное=[/калек/,/увеч/,/слеп(ой|ого|ым)/,/глух(ой|ого|им)/,/хром(ой|ого)/,/юродив/,/дурак/,/нищ(ий|его)/,
  /пьянчуг/,/урод/,/жид/,/бабь/,/тупиц/,/идиот/];
 check('ни одного случая над чужой бедой, немощью или человеком: смешно положение',
  !дурное.some(re=>re.test(тексты)),
  {нашлось:дурное.filter(re=>re.test(тексты)).map(String)});
 const народы=await page.evaluate(()=>{
  const имена=RACES_DB.map(r=>String(r.n).toLowerCase());
  const t=MIRTH_EVENTS.map(m=>`${m.n} ${m.о} ${m.что}`).join(" ").toLowerCase();
  return имена.filter(n=>n.length>4&&t.indexOf(n)>=0);});
 check('ни один народ не назван в шутке: над народами здесь не смеются',народы.length===0,народы);

 /* ── 4. случай не пустой ── */
 const итог=await page.evaluate(()=>{
  const о={};
  G.axes={};G.inv={};G.gold=100;G.hp=Math.max(1,G.hpMax-20);
  safeFn(()=>Survival.mode&&Survival.mode());
  safeFn(()=>{const S=Survival.state();S.stress=60;});
  const стресс0=safeFn(()=>Survival.state().stress,0);
  о.строки={};о.оси={};
  MIRTH_EVENTS.forEach(m=>{
   const g=MIRTH_GIFT_BY_ID[m.id];
   const до=(Number(G.axes[g.ось])||0);
   const s=Mirth.случай(m.id);
   о.строки[m.id]=(typeof s==="string"&&s.length>40);
   о.оси[m.id]=(Number(G.axes[g.ось])||0)>до;});
  о.стресс=[стресс0,safeFn(()=>Survival.state().stress,0)];
  о.золото=G.gold;о.вещей=Object.keys(G.inv).length;
  о.всеСтроки=Object.values(о.строки).every(Boolean);
  о.всеОси=Object.values(о.оси).every(Boolean);
  о.счёт=Mirth.счёт();о.видано=Mirth.виданоВсего();
  return о;});
 check('каждый случай рассказывает, что было, целой фразой',итог.всеСтроки,итог.строки);
 check('каждый случай двигает свою ось отношения',итог.всеОси,итог.оси);
 check('смех снимает стресс, а в котомке и кошеле после двенадцати случаев прибавилось',
  итог.стресс[1]<итог.стресс[0]&&итог.золото>100&&итог.вещей>0,итог);
 check('случаи считаются: видано двенадцать из двенадцати',
  итог.видано===12&&итог.счёт>=12,{видано:итог.видано,счёт:итог.счёт});

 /* ── 5. место соблюдается ── */
 const место=await page.evaluate(()=>{
  const было=G.place,бой=G.inCombat;
  const проба=(p,c)=>{G.place=p;G.inCombat=!!c;
   return MIRTH_EVENTS.reduce((a,m)=>{a[m.id]=Mirth.годится(m);return a;},{});};
  const дорога=проба(null,false);
  const город=проба({kind:"city",depth:0,bx:1,by:1,x:2,y:2},false);
  const село=проба({kind:"village",depth:0,bx:1,by:1,x:2,y:2},false);
  const глубь=проба({kind:"ruins",depth:12,bx:1,by:1,x:2,y:2},false);
  const вБою=проба({kind:"city",depth:0,bx:1,by:1,x:2,y:2},true);
  G.place=было;G.inCombat=бой;
  return {дорога,город,село,глубь,вБою};});
 check('вол случается только на тракте, а в городе — нет',
  место.дорога["mirth_ox"]===true&&место.город["mirth_ox"]===false,
  {дорога:место.дорога["mirth_ox"],город:место.город["mirth_ox"]});
 check('городские случаются в городе, а на тракте — нет',
  место.город["mirth_barrel"]===true&&место.дорога["mirth_barrel"]===false,
  {город:место.город["mirth_barrel"],дорога:место.дорога["mirth_barrel"]});
 check('сельские случаются в селении, а в городе — нет',
  место.село["mirth_rooster"]===true&&место.город["mirth_rooster"]===false,
  {село:место.село["mirth_rooster"],город:место.город["mirth_rooster"]});
 check('под землёй и в бою не случается ни один: там не до того',
  Object.values(место.глубь).every(v=>v===false)&&Object.values(место.вБою).every(v=>v===false),
  {глубь:Object.values(место.глубь).filter(Boolean).length,бой:Object.values(место.вБою).filter(Boolean).length});

 /* ── 6. галочка ── */
 const выкл=await page.evaluate(()=>{
  const было=settings.mirth;
  settings.mirth=0;
  const весёлые=MIRTH_EVENTS.every(m=>Mirth.годится(m)===false);
  const прочие=RANDOM_EVENTS.filter(e=>!/^(conj_|mirth_)/.test(e.id)).length;
  const слово=Mirth.text();
  settings.mirth=1;
  const сновА=MIRTH_EVENTS.some(m=>Mirth.годится(m));
  settings.mirth=было;
  return {весёлые,прочие,слово,сновА,естьГалочка:!!document.getElementById("setMirth")};});
 check('галочка выключает все двенадцать разом и говорит об этом',
  выкл.весёлые&&/выключен/i.test(выкл.слово),выкл);
 check('остальные события мира при этом не трогаются, и обратно включается',
  выкл.прочие===14&&выкл.сновА,выкл);
 check('галочка «Весёлые случаи» есть в настройках',выкл.естьГалочка);

 /* ── 7. счёт групп раздельный ── */
 const счёт=await page.evaluate(()=>({
  всего:RANDOM_EVENTS.length,
  обычных:RANDOM_EVENTS.filter(e=>!/^(conj_|mirth_)/.test(e.id)).length,
  сопряжение:RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).length,
  весёлых:RANDOM_EVENTS.filter(e=>e.id.indexOf("mirth_")===0).length,
  всеСоЗвуком:RANDOM_EVENTS.every(e=>SOUND_BANK[e.звук]&&typeof e.когда==="function"&&typeof e.делать==="function")}));
 check('четырнадцать обычных, два на время Сопряжения, двенадцать весёлых — счёт раздельный',
  счёт.обычных===14&&счёт.сопряжение===2&&счёт.весёлых===12&&счёт.всего===28,счёт);
 check('у каждого события мира, включая весёлые, есть запись, условие и дело',счёт.всеСоЗвуком);

 /* ── 8. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Весёлые случаи/i.test(g.title));
  return {mirth:r.find(x=>x.id==="mirth"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «mirth»',
  !!свод.mirth&&свод.mirth.ok===true,свод.mirth);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о весёлых случаях',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о двенадцати случаях и трёх правилах',
  /Весёлые случаи/i.test(readme)&&/двенадцать/i.test(readme)
  &&/[Нн]икто не унижен/.test(readme)&&/две записи/i.test(readme));
 check('docs/МИР.md держит раздел о весёлых случаях',
  /Весёлые случаи/i.test(mir)&&/mirth_/.test(mir)&&/relieve/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

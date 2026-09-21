/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 106: АКАДЕМИЯ, НАСТАВНИКИ, ЯЗЫКИ, НАУКИ, ШКОЛЫ ЧАР, КНИГИ,
   РЕЕСТР ЗНАНИЙ

   1. Данные: двадцать один язык с письмом и областью, шесть наук с
      факультетом и звуком, двенадцать факультетов, тридцать четыре школы чар
      с семью слоями записей; самопроверка мира это видит.
   2. Языки: родной язык области известен свободно, общая речь — всем;
      простой житель чужой области говорит только на своём, и вы слышите
      обрывки; торговец, правитель и жрец знают общую речь; учение — книгой,
      разговором, уроком; ступень звучит и пишется; торг на пальцах дороже.
   3. Разговор: чужая речь обрывками, знакомая — целиком; разговор с
      носителем — урок раз в день.
   4. Книги: автор, язык, тема, сложность в строке; том на чужом наречии не
      изучить, пока не разберёте язык; изученный том учит языку и ложится в
      реестр; знание наречия — второй путь к чтению полки.
   5. Реестр знаний: семь родов, без повторов, страницы полок ложатся по
      родам.
   6. Науки: ступень только экзаменом; кинетика бьёт Импульсом тяжелее,
      топология делает Разрез и Нить дешевле, хроноакустика — Эхо; ремёсла
      растут от биоинженерии и металлургии.
   7. Наставник: проверяет ученика, требует материалы со второй ступени,
      отказывает с причиной, даёт испытание в три работы и становится
      наставником — ремесло растёт на четверть быстрее, ступень выше.
   8. Академия: стоит в Меллиане и Аркеле; поступление по уровню, страницам
      и взносу; лекция даёт первый урок ремесла и лекцию науки, раз в день;
      экзамен — три лекции, практика и вопрос о прочитанном; библиотека,
      лаборатория, общежитие, стороны, дуэль, экспедиция; окно и меню.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};r.langs=LANGS.length;r.langsOk=LANGS.every(l=>l.n&&l.письмо&&l.о&&l.семья&&(l.область==null||REGIONS[l.область]));r.langRegions=new Set(LANGS.filter(l=>l.область!=null).map(l=>l.область)).size;
  r.sci=SCIENCES.length;r.sciOk=SCIENCES.every(x=>SOUND_BANK[x.звук]&&x.эффект.length===3&&FACULTY_BY_ID[x.факультет]);
  r.fac=FACULTIES.length;r.facOk=FACULTIES.every(f=>f.о&&f.полка&&f.станок&&(f.школы||[]).every(id=>MSCHOOL_BY_ID[id])&&(!f.маст||MAST_BY_ID[f.маст])&&(!f.наука||SCI_BY_ID[f.наука]));
  /* Набор 147 добавил четыре школы §6: энергетику, биомантию, астральную
     науку и магическую инженерию. Они тоже должны быть полны. */
  r.schools=SCHOOLS.length;r.newSchools=["necro","enchant","forgemagic","homunc","memory","dream","rift",
   "power","biomancy","astro","engine"].filter(id=>!MSCHOOL_BY_ID[id]||!SCHOOL_AUDIO[id]);
  r.layers=SCHOOLS.filter(sc=>!SCHOOL_AUDIO[sc.id]||!SPELL_LAYERS.every(l=>SOUND_BANK[SCHOOL_AUDIO[sc.id][l]])).map(sc=>sc.id);
  r.modules=["LANGS","SCIENCES","LEDGER","MENTOR","ACADEMY"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="academy");r.selfcheck=row?row.ok:null;
  return r;});
 check('двадцать один язык с письмом, семьёй и областью на все двадцать областей; шесть наук с факультетом и звуком; двенадцать факультетов с полкой и станком',
  данные.langs>=20&&данные.langsOk&&данные.langRegions===20&&данные.sci===6&&данные.sciOk&&данные.fac===12&&данные.facOk,данные);
 check('школ чар тридцать восемь, одиннадцать новых со своим языком из семи слоёв записями; самопроверка мира видит Академию',
  данные.schools===38&&данные.newSchools.length===0&&данные.layers.length===0&&данные.modules&&данные.selfcheck===true,данные);

 /* ── 2. языки ── */
 const языки=await page.evaluate(()=>{
  const r={};G.langs=null;G.homeLang=null;G.place=null;G.ship=null;G.dark=false;
  /* область 6 — Центральные королевства: дворцовый говор */
  G.x=Math.floor(REGION_W*1.5);G.y=Math.floor(REGION_H*1.5);Langs.ensure();r.home=G.homeLang;r.homeLevel=Langs.level(G.homeLang);r.common=Langs.level("common");
  r.north=Langs.at(100,100).id;r.needNorth=Langs.need("north");
  const простой=getNPC(100,100,0,"Фермер");const купец=getNPC(100,100,1,"Торговец");
  r.простой=Langs.check(простой);r.купец=Langs.check(купец);
  r.garble=Langs.garble("один два три четыре пять шесть");
  r.tradeNo=Langs.tradeK(простой);r.tradeYes=Langs.tradeK(купец);
  const ask0=npcAsk(простой,"руда");
  PLAYED.length=0;SAID.length=0;JT.length=0;r.up1=Langs.learn("north",20,"проба");r.lvl1=Langs.level("north");r.звук=PLAYED.includes("arte_page");r.сказ=SAID.find(t=>/Северное наречие: теперь вы разбираете/.test(t))||"";r.летопись=JT.some(t=>/Язык: северное наречие, разбираете/.test(t));r.реестр=Ledger.has("языки",/северное наречие/);
  r.up2=Langs.learn("north",5);r.lvl2=Langs.level("north");r.оп=G.langs.north.оп;
  Langs.learn("north",40);r.lvl3=Langs.level("north");r.после=Langs.check(простой);const ask1=npcAsk(простой,"руда");r.ask=[ask0,ask1];
  r.commonNo=Langs.learn("common",99);
  G.day=3;G.langTalk={};G.langs.north={ур:1,оп:0};r.pr1=Langs.practice(простой);r.prOp=G.langs.north.оп;r.pr2=Langs.practice(простой);r.prOp2=G.langs.north.оп;
  const маг=getNPC(100,100,2,"Магистр");G.gold=100;G.langs.north={ур:0,оп:0};r.lesson=Langs.lesson(маг);r.goldAfter=G.gold;r.lessonOp=G.langs.north.оп;r.lessonNo=Langs.lesson(простой);
  r.text=Langs.text();r.line=Langs.npcLine(простой);r.lineMag=Langs.npcLine(маг);
  return r;});
 check('родной язык области известен свободно, общая речь — всем; простой житель чужой области говорит только на своём и понятен лишь обрывками, торговец знает общую речь; обрывки — каждое третье слово; торг на пальцах дороже на десятую',
  языки.home==="court"&&языки.homeLevel===3&&языки.common===3&&языки.north==="north"&&языки.needNorth===20&&языки.простой.понятно===false&&языки.простой.общий===false&&языки.купец.понятно===true&&языки.купец.общий===true&&языки.garble==="один … четыре … …"&&языки.tradeNo===1.1&&языки.tradeYes===1&&языки.ask[0]>языки.ask[1],{home:языки.home,простой:языки.простой,garble:языки.garble,ask:языки.ask});
 check('учение: двадцать очков — ступень «разбираете» со звуком, словами, летописью и реестром; остаток переносится; сорок — «свободно»; общую речь учить нечего; разговор с носителем — урок раз в день; урок у Магистра за тридцать золотых; строка жителя называет язык',
  языки.up1===true&&языки.lvl1===1&&языки.звук&&языки.сказ.length>0&&языки.летопись&&языки.реестр&&языки.up2===false&&языки.lvl2===1&&языки.оп===5&&языки.lvl3===3&&языки.после.понятно===true&&языки.commonNo===false&&языки.pr1===true&&языки.prOp===2&&языки.pr2===false&&языки.prOp2===2&&/берёт 30 золота/.test(языки.lesson)&&языки.goldAfter===70&&языки.lessonOp>=8&&/Языкам здесь не учат/.test(языки.lessonNo)&&/Вы знаете: /.test(языки.text)&&/говорит на северное наречие/.test(языки.line)&&/langlesson:/.test(языки.lineMag),{up:[языки.up1,языки.up2],lvl:[языки.lvl1,языки.lvl2,языки.lvl3],оп:языки.оп,pr:[языки.pr1,языки.prOp,языки.pr2],lesson:языки.lesson,line:языки.line.slice(0,80)});

 /* ── 3. разговор ── */
 const разговор=await page.evaluate(()=>{
  const r={};G.langs={common:{ур:3,оп:0},court:{ур:3,оп:0}};G.homeLang="court";G.day=4;G.langTalk={};
  const простой=getNPC(100,100,0,"Фермер");SAID.length=0;tellNPCStory(простой);r.чужая=SAID.find(t=>/говорит на северное наречие/.test(t))||"";r.обрывки=/обрывки/.test(r.чужая)&&/…/.test(r.чужая);r.совет=/Учат:/.test(r.чужая);r.урок=(G.langs.north||{}).оп||0;
  G.langs.north={ур:1,оп:0};SAID.length=0;tellNPCStory(простой);r.своя=SAID.find(t=>new RegExp("^"+простой.name+", ").test(t))||"";r.целиком=!/обрывки/.test(r.своя)&&r.своя.length>40;
  return r;});
 check('разговор: без языка — обрывки и совет, где учат, но разговор уже урок; с языком — речь целиком',
  разговор.чужая.length>0&&разговор.обрывки&&разговор.совет&&разговор.урок===2&&разговор.целиком,{чужая:разговор.чужая.slice(0,100),своя:разговор.своя.slice(0,60),урок:разговор.урок});

 /* ── 4. книги ── */
 const книги=await page.evaluate(()=>{
  const r={};G.langs={common:{ур:3,оп:0},court:{ур:3,оп:0}};G.homeLang="court";G.mast=G.mast||{};G.mast.lang={ур:0,оп:0,дел:0};
  let t=null;for(let seed=1;seed<400&&!t;seed++){const k=makeTome({seed,origin:"tower",x:100,y:100});if(k.наречие==="north")t=k;}
  r.поля=t?["автор","наречие","тема","сложность"].filter(k=>t[k]==null||t[k]===""):["нет тома"];r.строка=t?t.строка:"";
  if(t){G.items=[t.n];G.tomes={[t.n]:t};G.tomeRead={};const row=invAll().find(x=>x.kind==="item"&&x.name===t.n);r.row=!!row;
   const acts=row?invActionsAll(row):{ok:[],blocked:[]};const bl=acts.blocked.find(a=>a.id==="study");r.blocked=bl?(bl.почему||bl.why||JSON.stringify(bl)):null;r.okStudy=acts.ok.some(a=>a.id==="study");
   G.langs.north={ур:1,оп:0};const acts2=invActionsAll(row);r.okStudy2=acts2.ok.some(a=>a.id==="study");
   const оп=G.langs.north.оп;invDo("study","item",row.key);r.изучена=!!G.tomeRead[t.n];r.языкРастёт=G.langs.north.оп>оп;r.реестр=Ledger.count()>0&&LEDGER_KINDS.some(([k])=>Ledger.list(k).some(e=>e.n.startsWith(t.n)));}
  /* полка: второй путь к чтению */
  G.place={kind:"house",bx:100,by:100,stype:"tower",name:"Проба",depth:0,x:1,y:1};let it=null;
  for(let x=1;x<30&&!it;x++)for(let y=1;y<30&&!it;y++){const sh=safeFn(()=>shelfAt(x,y),null);if(sh){const k=sh.find(b=>b.наречие&&b.наречие!=="common"&&b.язык.нужно>=1);if(k)it=k;}}
  r.полка=!!it;if(it){G.mast.lang={ур:0,оп:0,дел:0};G.langs[it.наречие]={ур:0,оп:0};r.read0=bookReadable(it);G.langs[it.наречие]={ур:2,оп:0};r.read2=bookReadable(it);}
  G.place=null;return r;});
 check('у книги автор, язык, тема и сложность в строке; том на чужом наречии не изучить, пока не разберёте язык; изученный том учит языку и ложится в реестр; знание наречия — второй путь к чтению полки',
  книги.поля.length===0&&/Автор: .*Язык: северное наречие.*Тема: .*Сложность \d из трёх/.test(книги.строка)&&книги.row&&/язык неизвестен: северное наречие/.test(книги.blocked||"")&&!книги.okStudy&&книги.okStudy2&&книги.изучена&&книги.языкРастёт&&книги.реестр&&книги.полка&&книги.read0===false&&книги.read2===true,{поля:книги.поля,строка:(книги.строка||"").slice(0,160),blocked:книги.blocked,полка:книги.полка,read:[книги.read0,книги.read2]});

 /* ── 5. реестр ── */
 const реестр=await page.evaluate(()=>{
  const r={};G.ledger=null;Ledger.ensure();r.kinds=LEDGER_KINDS.length;r.add1=Ledger.add("рецепты","проба и соль","книга");r.add2=Ledger.add("рецепты","проба и соль","книга");r.bad=Ledger.add("нет такого","x");r.has=Ledger.has("рецепты",/проба/);r.count=Ledger.count();
  G.lore=[];const всего=knowTotal();let стр=-1;for(let i=0;i<всего&&стр<0;i++){const e=knowEntry(i);if(e&&e.shelf==="emp")стр=i;}
  if(стр>=0){studyPage(стр,0,"Проба:");r.политика=Ledger.list("политика").some(e=>e.n===knowEntry(стр).title);}
  r.text=Ledger.text();return r;});
 check('реестр знаний: семь родов, запись без повтора, чужого рода нет, поиск и счёт; страница с полки держав ложится в политику',
  реестр.kinds===7&&реестр.add1===true&&реестр.add2===false&&реестр.bad===false&&реестр.has&&реестр.count===1&&реестр.политика===true&&/Реестр знаний: рецепты 1/.test(реестр.text),реестр);

 /* ── 6. науки ── */
 const науки=await page.evaluate(()=>{
  const r={};G.sci=null;G.sciProg=null;r.l0=Sci.level("kinetics");r.need=Sci.need("kinetics");Sci.study("kinetics",2);r.prog=Sci.progress("kinetics");
  PLAYED.length=0;r.grant=Sci.grant("bioeng");r.l1=Sci.level("bioeng");r.звук=PLAYED.includes("oc_bubble");r.gainHomun=Sci.gainK("homun");r.gainSmith=Sci.gainK("smith");Sci.grant("metallurgy");r.gainSmith2=Sci.gainK("smith");
  G.sci.kinetics=2;G.inCombat=true;G.combat={m:{n:"проба"},hp:100};G.level=4;PATH_SPELL_BY_ID.impulse.делать();r.impulse=100-G.combat.hp;G.inCombat=false;G.combat=null;
  r.cut0=PATH_SPELL_BY_ID.cut.цена.space;G.sci.topology=2;r.cut2=PATH_SPELL_BY_ID.cut.цена.space;r.echo0=PATH_SPELL_BY_ID.echo.цена.aether;G.sci.chrono=1;r.echo1=PATH_SPELL_BY_ID.echo.цена.aether;
  r.text=Sci.text("kinetics");return r;});
 check('науки: ступень нулевая, лекции копятся к экзамену, ступень даётся со звуком; биоинженерия и металлургия растят ремёсла; кинетика бьёт Импульсом на четыре тяжелее, топология делает Разрез дешевле на две, хроноакустика — Эхо на одну',
  науки.l0===0&&науки.need===3&&науки.prog===2&&науки.grant===true&&науки.l1===1&&науки.звук&&Math.abs(науки.gainHomun-1.15)<0.01&&науки.gainSmith===1&&Math.abs(науки.gainSmith2-1.1)<0.01&&науки.impulse===6+2+4&&науки.cut0===4&&науки.cut2===2&&науки.echo0===3&&науки.echo1===2&&/Кинетика: импульс и движение/.test(науки.text),науки);

 /* ── 7. наставник ── */
 const наставник=await page.evaluate(()=>{
  const r={};G.mentor=null;G.mentorTrial=null;G.mast={};G.inv={};G.gold=0;
  const кузнец=getNPC(G.x,G.y,0,"Кузнец");r.teaches=Mentor.teaches(кузнец);r.noGold=Mentor.check(кузнец,"smith");
  G.gold=1000;r.ok0=Mentor.check(кузнец,"smith");G.mast.smith={ур:1,оп:0,дел:0};r.noMat=Mentor.check(кузнец,"smith");G.inv["руда"]=2;r.ok1=Mentor.check(кузнец,"smith");
  r.notHis=Mentor.check(кузнец,"cook");
  SAID.length=0;r.ask=Mentor.ask(кузнец,"smith");r.ур=mastLevel("smith");r.руда=Number(G.inv["руда"])||0;r.trial=G.mentorTrial?{маст:G.mentorTrial.маст,need:G.mentorTrial.need}:null;r.сказ=SAID.find(t=>/три работы/.test(t))||"";
  r.status1=Mentor.status();r.gain0=Mentor.gainK("smith");
  G.mast.smith.дел=(G.mast.smith.дел||0)+2;SAID.length=0;r.work2=Mentor.onWork("smith");r.progress=SAID.find(t=>/работ 2 из 3/.test(t))||"";G.mast.smith.дел+=1;PLAYED.length=0;r.work3=Mentor.onWork("smith");
  r.mentor=G.mentor?{name:G.mentor.name,маст:G.mentor.маст}:null;r.gain1=Mentor.gainK("smith");r.bonus=Mentor.bonus(кузнец,"smith");r.звук=PLAYED.includes("gate_fanfare");r.status2=Mentor.status();
  r.btns=Mentor.npcButtons(кузнец);G.gold=0;r.btnsNo=Mentor.npcButtons(кузнец);
  return r;});
 check('наставник проверяет ученика: без золота — цена, со второй ступени — материалы, чужое ремесло — отказ; урок берёт материалы и даёт ступень и испытание в три работы',
  наставник.teaches.includes("smith")&&наставник.noGold.ок===false&&/урок стоит/.test(наставник.noGold.почему)&&наставник.ok0.ок===true&&наставник.noMat.ок===false&&/материалы.*руда ×2/.test(наставник.noMat.почему)&&наставник.ok1.ок===true&&/не учит/.test(наставник.notHis.почему)&&наставник.ask===true&&наставник.ур===2&&наставник.руда===0&&наставник.trial&&наставник.trial.маст==="smith"&&наставник.trial.need===3&&наставник.сказ.length>0,{noGold:наставник.noGold,noMat:наставник.noMat,ask:наставник.ask,ур:наставник.ур,руда:наставник.руда,trial:наставник.trial});
 check('испытание считает работы и по третьей делает наставником: фанфара, ремесло на четверть быстрее, ступень выше обычной; кнопки урока с ценой, а без золота — с причиной',
  /Испытание наставника/.test(наставник.status1)&&наставник.gain0===1&&наставник.work2===false&&наставник.progress.length>0&&наставник.work3===true&&наставник.mentor&&наставник.mentor.маст==="smith"&&наставник.gain1===1.25&&наставник.bonus===1&&наставник.звук&&/Наставник: /.test(наставник.status2)&&/lesson:/.test(наставник.btns)&&/tutorwhy:.*урок стоит/.test(наставник.btnsNo),{status:[наставник.status1,наставник.status2],work:[наставник.work2,наставник.work3],gain:наставник.gain1,btns:наставник.btnsNo.slice(0,120)});

 /* ── 8. Академия ── */
 const академия=await page.evaluate(async()=>{
  const r={};G.academy=null;G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.sci=null;G.sciProg=null;G.mast={};G.quests=[];G.chainTaken={};
  G.x=1000;G.y=1000;r.here0=Academy.here();r.enrollFar=Academy.enroll();
  const c=NAMED_CITIES.find(x=>x.id==="mellian");G.x=c.x;G.y=c.y;r.here=!!Academy.here();r.name=Academy.name();
  G.level=1;r.lvl=Academy.enroll();G.level=3;G.lore=[];r.pages=Academy.enroll();G.lore=[1,2,3];G.gold=50;r.gold=Academy.enroll();
  G.gold=200;JT.length=0;PLAYED.length=0;r.enroll=Academy.enroll();r.goldAfter=G.gold;r.enrolled=Academy.enrolled();r.звук=PLAYED.includes("gate_fanfare");r.летопись=JT.some(t=>/Академия: поступление/.test(t));
  /* лекция */
  G.day=10;r.lect=Academy.lecture("alch");r.mastAlch=mastLevel("alchemy");r.bio=Sci.progress("bioeng");r.lectAgain=Academy.lecture("alch");
  G.day=11;Academy.lecture("alch");G.day=12;Academy.lecture("alch");r.лекций=Academy.fac("alch").лекций;r.mastAfter=mastLevel("alchemy");
  /* экзамен */
  G.sciProg.bioeng=1;r.examNoSci=Academy.exam("alch");G.sciProg.bioeng=3;G.day=13;r.exam=Academy.exam("alch");const q=G.academy.вопрос;r.вопрос=q?{вариантов:q.варианты.length,верно:q.верно}:null;
  const wrong=q?(q.верно+1)%3:0;r.wrong=Academy.answer(wrong);r.курс0=Academy.fac("alch").курс;
  G.day=14;G.gold=100;r.exam2=Academy.exam("alch");const q2=G.academy.вопрос;if(!q2)return r;PLAYED.length=0;r.right=Academy.answer(q2.верно);r.курс1=Academy.fac("alch").курс;r.bioLevel=Sci.level("bioeng");r.фанфара=PLAYED.includes("gate_fanfare");r.title=/бакалавр|студент/.test(r.right);
  /* библиотека, лаборатория, общежитие */
  const было=knowRead().length;r.lib=Academy.library("alch");r.libPages=knowRead().length-было;r.libAgain=Academy.library("alch");
  G.gold=100;const дел=Number((G.mast.alchemy||{}).дел)||0;r.lab=Academy.lab("alch");r.labGold=G.gold;r.labWork=(Number((G.mast.alchemy||{}).дел)||0)-дел;r.labNoMast=Academy.lab("kinetics");
  G.hp=1;G.mana=0;r.rest=Academy.rest();r.hp=G.hp===G.hpMax&&G.mana===G.manaMax;r.restGold=G.gold;
  /* стороны, дуэль, экспедиция */
  r.side=Academy.side("free");r.сторона=G.academy.сторона;r.sideAgain=Academy.side("free");
  r.duel=Academy.duel();r.бой=!!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.n==="Студент-дуэлянт");if(r.бой){G.combat.hp=0;victory();}r.дуэли=G.academy.дуэли;r.после=G.inCombat;
  Academy.side("rectorate");r.duelNo=Academy.duel();Academy.side("free");
  r.exp=Academy.expedition();const eq=G.quests.find(x=>x.chain==="expedition");r.expQuest=eq?{шагов:eq.chainOf,тип:eq.type}:null;r.expAgain=Academy.expedition();
  r.status=Academy.status();
  /* окно и меню */
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.academy();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["acStatus","acFaculties","acSciences","acLangs","acMentor","acLedger"].filter(id=>!(document.getElementById(id)||{}).innerHTML);r.кнопки=document.querySelectorAll('#acFaculties [data-cmd^="acact:lecture~"]').length;r.сказано=SAID.find(t=>/^Академия и знания\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();r.меню=JSON.stringify(AM_GROUPS).includes('"academy"');
  return r;});
 check('Академия стоит в Меллиане: издали — куда идти, на месте — поступление по уровню, трём страницам и взносу со звуком и летописью; лекция даёт первый урок ремесла и лекцию науки, раз в день',
  академия.here0===null&&/Поступают на месте.*Меллиан/.test(академия.enrollFar)&&академия.here&&/Меллиан/.test(академия.name)&&/второго уровня/.test(академия.lvl)&&/Три страницы/.test(академия.pages)&&/сто золотых/.test(академия.gold)&&/Принято/.test(академия.enroll)&&академия.goldAfter===100&&академия.enrolled&&академия.звук&&академия.летопись&&/первый урок ремесла «алхимия»/.test(академия.lect)&&академия.mastAlch===1&&академия.bio===1&&/уже была/.test(академия.lectAgain)&&академия.лекций===3,{far:академия.enrollFar,lect:академия.lect,лекций:академия.лекций});
 check('экзамен: наука должна быть дослушана; вопрос о прочитанном с тремя ответами; неверный — не сдан, верный — курс, ступень науки, фанфара и звание',
  /лекций к экзамену/.test(академия.examNoSci)&&/Экзамен факультета «Алхимии»/.test(академия.exam)&&академия.вопрос&&академия.вопрос.вариантов===3&&/Неверно/.test(академия.wrong)&&академия.курс0===0&&/Верно/.test(академия.right)&&академия.курс1===1&&академия.bioLevel===1&&академия.фанфара&&академия.title,{exam:(академия.exam||"").slice(0,120),wrong:(академия.wrong||"").slice(0,80),exam2:(академия.exam2||"").slice(0,80),right:(академия.right||"").slice(0,120)});
 check('библиотека даёт страницу с полки факультета раз в день; лаборатория за десять золотых растит ремесло и считает работу; общежитие за пять — полное восстановление; сторона, дуэль со студентом и её счёт, запрет Ректората, экспедиция в три шага; окно с шестью разделами и строка в меню',
  /изучена/.test(академия.lib)&&академия.libPages===1&&/по одной странице/.test(академия.libAgain)&&/растёт/.test(академия.lab)&&академия.labGold===90&&академия.labWork===1&&/лекционная/.test(академия.labNoMast)&&/восемь часов/.test(академия.rest)&&академия.hp&&академия.restGold===85&&/Вольная кафедра/.test(академия.side)&&академия.сторона==="free"&&/и так/.test(академия.sideAgain)&&академия.бой&&академия.дуэли===1&&академия.после===false&&/Ректорат дуэли запрещает/.test(академия.duelNo)&&/Экспедиция факультета/.test(академия.exp)&&академия.expQuest&&академия.expQuest.шагов===3&&/уже идёт/.test(академия.expAgain)&&/Слушатель с/.test(академия.status)&&академия.окно==="modal-academy"&&академия.секции.length===0&&академия.кнопки===12&&/Академия и знания/.test(академия.сказано)&&академия.меню,академия);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

/* 10.5: Перекрой — мир до миллиона клеток. За прежним краем, восточнее и
   южнее 800 000, Великий Перекрой пришил к миру полосу земли: восемь земель,
   восемь держав, восемь рас, свои твари, Пороги и Шовные Глуби и четыре
   системы (Обет Порога, Щит Сосуда, Перекрои, Займище). Набор проверяет, что
   всё это живое, а не список имён:
   — прежняя география не сдвинулась, границы мира и шаг героя — миллион;
   — суша полосы похожа на землю, а не на сплошные горы или море; через
     Внешнее море ведут три Шва;
   — у каждой державы своя область, младший бог, дар земли, задания,
     учителя и голос города; расы и народы выбираются герою;
   — тварь Перекроя встаёт своей тварью; обет, Сосуд и займище работают;
   — окно «Перекрой» в меню «Державы»; все звуки — файлы на месте. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* ── 1. мир до миллиона ── */
 const мир=await p.evaluate(()=>{
  const r={W:WORLD,M:WORLD_MAX,держав:PRK_REALMS.length};
  r.наПолосе=PRK_REALMS.every(e=>Math.max(e.cap.x,e.cap.y)>=PRK_EDGE&&e.cap.x<WORLD_MAX&&e.cap.y<WORLD_MAX);
  r.свои=PRK_REALMS.every(e=>empireAt(e.cap.x,e.cap.y)===e&&Perekroy.landAt(e.cap.x,e.cap.y));
  r.земли=new Set(PRK_REALMS.map(e=>e.перекрой)).size;
  r.круг=DK_REALMS.length;r.сплетение=SPL_REALMS.length;r.заморье=ZAM_REALMS.length;
  r.нетВКругу=DK_REALMS.every(e=>!e.перекрой);
  r.швы=PRK_SEAMS.map(s=>!!prkSeamAt(Math.round((s.x0+s.x1)/2),Math.round((s.y0+s.y1)/2)));
  r.швыСуша=PRK_SEAMS.map(s=>biomeAt(Math.round((s.x0+s.x1)/2),Math.round((s.y0+s.y1)/2)).база!=="coast");
  let море=0,всего=0;for(let i=0;i<200;i++){const y=31+i*3901;if(prkSeamAt(810000,y))continue;всего++;if(biomeAt(810000,y).база==="coast")море++;}
  r.мореМежду=море/всего;
  const k={};for(let i=0;i<500;i++){const x=822000+Math.floor(hashName(i,3,77)*177000),y=Math.floor(hashName(i,5,77)*999000);const b=biomeAt(x,y).база;k[b]=(k[b]||0)+1;}
  r.смесь=k;
  return r;});
 const горы=((мир.смесь.mountains||0)+(мир.смесь.cave||0))/500,берег=(мир.смесь.coast||0)/500;
 check('1. мир до миллиона: прежняя география от 800 000, границы — 1 000 000; восемь держав Перекроя на своей полосе, Круг, Заморье и Сплетение прежние',
  мир.W===800000&&мир.M===1000000&&мир.держав===8&&мир.наПолосе&&мир.свои&&мир.земли===8&&мир.круг===24&&мир.заморье===9&&мир.сплетение===16&&мир.нетВКругу,мир);
 check('1б. три Шва ведут через Внешнее море по суше; между краем и полосой — море',
  мир.швы.every(Boolean)&&мир.швыСуша.every(Boolean)&&мир.мореМежду>0.9,{швы:мир.швы,суша:мир.швыСуша,море:мир.мореМежду});
 check('1в. суша полосы — земля, а не сплошные горы или море: гор и пещер меньше трети, берега меньше пятой части',
  горы<0.33&&берег<0.2&&Object.keys(мир.смесь).length>=6,мир.смесь);

 /* ── 2. герой доходит до края миллиона ── */
 const край=await p.evaluate(()=>{
  const E=Object.keys(DIRV).find(k=>DIRV[k][0]===1&&DIRV[k][1]===0),S=Object.keys(DIRV).find(k=>DIRV[k][0]===0&&DIRV[k][1]===1);
  const r={};G.place=null;G.ship=null;G.dark=false;
  G.x=900000;G.y=500000;move(E);r.шаг=G.x;
  G.x=WORLD_MAX-1;move(E);r.край=G.x;
  G.x=500000;G.y=WORLD_MAX-1;move(S);r.юг=G.y;
  G.x=905000;G.y=300000;r.земля=Perekroy.land()&&Perekroy.land().id;r.держава=Perekroy.realm()&&Perekroy.realm().short;
  return r;});
 check('2. шаг за прежний край идёт, а у миллиона мир кончается',
  край.шаг===900001&&край.край===999999&&край.юг===999999&&край.земля==="merna"&&край.держава==="Братство Гряды",край);

 /* ── 3. державы: область, бог, дар, задания, учителя, голос ── */
 const д=await p.evaluate(()=>{
  const r={};
  r.пусто=PRK_REALMS.filter(e=>!e.name||!e.gov||!e.econ||!e.hist||!GOD_BY_ID[e.god]||!(e.exports||[]).length||!(e.imports||[]).length).map(e=>e.short);
  r.области=PRK_REALMS.filter(e=>regionAt(e.cap.x,e.cap.y).n!==e.short).map(e=>e.short);
  r.боги=PRK_REALMS.filter(e=>!LESSER_GODS.some(g=>g.область===DK_REGION_FIRST+FAR_REALMS.indexOf(e)&&g.id===e.младший)).map(e=>e.short);
  r.дары=PRK_REALMS.filter(e=>!DK_GIFTS[e.short]||!(RES_BASE[DK_GIFTS[e.short].n]>0)).map(e=>e.short);
  r.задания=PRK_REALMS.filter(e=>{const q=EMPIRE_QUESTS[EMPIRES.indexOf(e)];return !q||(q.дела||[]).length<3;}).map(e=>e.short);
  r.учителя=new Set(EMPIRE_TEACH.map(t=>t.чему.slice().sort().join("|"))).size===EMPIRE_TEACH.length&&EMPIRE_TEACH.length===EMPIRES.length;
  r.голоса=new Set(EMPIRE_VOICE).size===EMPIRE_VOICE.length&&EMPIRE_VOICE.length===EMPIRES.length&&EMPIRE_VOICE.every(v=>Bank.has(v));
  r.города=PRK_REALMS.map(e=>empireCitiesOf(EMPIRES.indexOf(e)).length);
  r.праздники=new Set(LESSER_GODS.map(g=>g.праздник)).size===LESSER_GODS.length&&LESSER_GODS.every(g=>g.праздник>=1&&g.праздник<=Gods.cycle);
  r.меню=AM_ITEMS.some(x=>x[0]==="perekroy"&&x[1]==="Перекрой");
  return r;});
 check('3. у каждой державы Перекроя досье, своя область, младший бог, дар земли и три дела',
  !д.пусто.length&&!д.области.length&&!д.боги.length&&!д.дары.length&&!д.задания.length,д);
 check('3б. учителя, голоса городов и праздники не повторяются; у каждой державы не меньше четырёх городов',
  д.учителя&&д.голоса&&д.праздники&&д.города.every(n=>n>=4),д);
 check('3в. в меню «Державы» есть «Перекрой»',д.меню);

 /* ── 4. расы и народы ── */
 const р=await p.evaluate(()=>{
  const рас=RACES_DB.filter(x=>/^pk_/.test(x.id));
  const r={рас:рас.length,выбор:рас.filter(x=>RACES.indexOf(x.n)>=0).length};
  r.полные=рас.every(x=>(DK_PEOPLES[x.id]||[]).length===2&&DK_PEOPLES[x.id].every(n=>DK_PEOPLE_INFO[n]&&VOICE_RACES[n])&&VOICE_RACES[x.n]&&HERO_RACE_FEATURE[x.id]&&x.myth&&x.tr&&x.war&&(x.res||[]).length===3);
  r.боги=рас.every(x=>PANTHEON.some(g=>g.id===x.god));
  const имена=RACES_DB.map(x=>x.n).concat(...Object.values(DK_PEOPLES));r.единые=new Set(имена).size===имена.length;
  r.старыеГолоса=VOICE_RACES["Корневики"]&&VOICE_RACES["Корневики"][3]!==2;
  return r;});
 check('4. восемь рас и шестнадцать народов в выборе героя: облик, сведения, голос, великий бог; имена не повторяются и не перебивают старые голоса',
  р.рас===8&&р.выбор===8&&р.полные&&р.боги&&р.единые&&р.старыеГолоса,р);

 /* ── 5. звуки — настоящие записи из банка, файлы на месте ── */
 const звуки=await p.evaluate(()=>{const все=[];
  PRK.beasts.forEach(b=>все.push(b.звук));PRK.gods.forEach(g=>все.push(g.звук));PRK.lands.forEach(l=>все.push(l.звук));
  DK_GODS.filter(g=>/^lg_pk_/.test(g.id)).forEach(g=>все.push(g.звук));
  const голосаБогов=GODS_ALL.map(g=>g.звук);
  return {нет:все.filter(z=>!SOUND_BANK[z]),файлы:[...new Set(все)].flatMap(z=>(SOUND_BANK[z]||{f:[]}).f),
   богиЕдины:new Set(голосаБогов).size===голосаБогов.length,своихРолей:Object.keys(SOUND_BANK).filter(k=>/^pk_/.test(k)).length};});
 const root=path.resolve(__dirname,'..','sounds');
 const нетФайла=звуки.файлы.filter(f=>!fs.existsSync(path.join(root,f)));
 check('5. каждая тварь, бог и земля Перекроя звучит настоящей записью из банка; файлы на месте, голоса богов не повторяются, дублей ролей нет',
  !звуки.нет.length&&!нетФайла.length&&звуки.файлы.length>=30&&звуки.богиЕдины&&звуки.своихРолей===0,{нет:звуки.нет,нетФайла:нетФайла.slice(0,3),файлов:звуки.файлы.length,боги:звуки.богиЕдины});

 /* ── 6. тварь Перекроя ── */
 const тварь=await p.evaluate(()=>{
  G.place=null;G.x=905000;G.y=300000;let got=null;
  for(let i=0;i<40&&!got;i++){G.day=1+i;const base=MONSTERS.find(x=>x.id==="wolf")||MONSTERS[0];const m=Object.assign({},base);Perekroy.onCombat(m,{});if(m.pk)got=m;}
  return got?{pk:got.pk,n:got.n,звук:got.pkSnd,есть:!!SOUND_BANK[got.pkSnd]}:null;});
 check('6. в Перекройных Землях обычная тварь встаёт тварью этой земли — со своим именем, умением и голосом',
  !!тварь&&/^pb_/.test(тварь.pk)&&тварь.есть,тварь);

 /* ── 7. четыре системы ── */
 const сист=await p.evaluate(()=>{
  const r={};G.place=null;G.inCombat=false;G.pk={};
  G.x=905000;G.y=120000;
  const v=PRK.vows[0];r.обет=Perekroy.vowTake(v.id);r.наМне=!!Perekroy.vow();r.долг=!!(Perekroy.debt()&&Perekroy.debt().t);
  G.x=905000;G.y=620000;r.сосуд=Perekroy.vesselTake();r.несу=Perekroy.vesselHas();
  r.огонь=Perekroy.fireLight();
  G.x=300000;G.y=905000;r.безСтолбов=Perekroy.zaimFound();
  Perekroy.resGive("pr_post",4);
  for(let i=0;i<30&&safeFn(()=>isCityAt(G.x,G.y),false);i++)G.x+=7;
  r.межа=Perekroy.zaimFound();r.займище=!!Perekroy.zaim();r.нужно=Perekroy.zaimBuild();
  r.перекрой=Perekroy.recut()&&Perekroy.recut().n;r.предвестие=Perekroy.foretell();
  r.летопись=Object.keys(Perekroy.st().firsts).length;
  return r;});
 check('7. Обет Порога: дар принимают у Порогов, долг седмицы назначен',сист.наМне&&сист.долг,{обет:сист.обет});
 check('7б. Щит Сосуда: фонарь берут в Обители, и он ведёт к первому огню Тропы',сист.несу&&/огн/.test(сист.огонь),{сосуд:сист.сосуд,огонь:сист.огонь});
 check('7в. Займище: без столбов межу не поставить, со столбами — ставится, и следующая ступень называет, чего не хватает',
  /нужно/.test(сист.безСтолбов)&&сист.займище&&/нужно|частокол/.test(сист.нужно),сист);
 check('7г. Перекрой седмицы назван, предвестие о следующем звучит',!!сист.перекрой&&typeof сист.предвестие==="string"&&сист.предвестие.length>10,{п:сист.перекрой,пр:сист.предвестие});

 /* ── 8. окно ── */
 const окно=await p.evaluate(()=>{const r={};
  ["home","chronView","landsView","godsView","vowView","vesselView","zaimView","firstsView"].forEach(v=>{
   try{Perekroy[v]();const b=document.getElementById("pkBody");r[v]=b?b.textContent.length:0;}catch(e){r[v]="ошибка "+String(e).slice(0,80);}});
  while(activeLayer())closeTopUI();return r;});
 check('8. окно «Перекрой»: летопись, земли, боги, обет, Сосуд, займище и первые — без ошибок и не пустые',
  Object.values(окно).every(x=>typeof x==="number"&&x>40),окно);

 check('9. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

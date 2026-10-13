/* ════════════════════════════════════════════════════════════════════════
   НАБОР 321: ПРОЛОГ — ЗВУКИ КО ВРЕМЕНИ И ПОЛНАЯ ПАЛИТРА (15.5)

   Жалоба игрока: в прологе некоторые звуки звучат раньше времени; в сцене,
   где говорится о машинах, машин не слышно; в сцене войны мало звуковой
   декорации. Звуки шли по таймеру от начала сцены, а голос читает строки
   своим темпом. Теперь каждый звук привязан к слову записанной строки и
   срабатывает по часам самой записи; фон из нескольких петель вступает и
   гаснет на словах; в Пепельном году — гул битвы, барабаны, извержение и
   живое поле боя; у нашего мира — машины, город, фонари, звон в ушах.
   1. Каждый якорь находит своё слово, каждая роль — в банке; у каждой
      сцены не меньше пятнадцати звуков и свои слои.
   2. Машины: на слове «машины» проезжает машина, под второй строкой —
      ночной город и гудение фонаря; в седьмой сцене — машина по мокрому
      асфальту, фонарь мигает на «Фонарь мигнул», звон нарастает на «Звон».
   3. Сцена 1 по часам записи (запись идёт быстрее): каждый звук на своём
      слове, ни один не раньше своей строки; город гаснет на «тишина».
   4. Война: извержение на «раскрыли», барабаны с «тридцать голодных»,
      гул битвы и пожар с «дракониды»/«Резали», живое поле боя — десятки
      ударов, криков и стрел по сторонам; всё стихает на «Перевалы устояли».
      (Просьба игрока: «звуки прохода через перевал, более яркие звуки боя,
      разнообразь оружие и толпу, прибавь крики и кровь».) Поход через
      перевал — шаги по щебню и снегу, телеги, кони, осыпь и петля похода
      сотен ног; в бою — звон клинков петлёй, сшибки (замах, парирование,
      удар по плоти, крик в одной точке), крики, кровь и падения тел.
      (Просьба игрока: «как будто бы один-два человека дерутся, а не целая
      толпа».) Толпа: сеча сотен и голоса битвы петлями, «дыхание» — под
      словами рассказа бой тише, в паузах накатывает; на «гнёзда» войско
      подхватывает клич сотней глоток.
   5. Голос пролога — род «рассказ»: в тесноте звуков сцены он не убавляется
      вовсе (род «голос» уступает до пятой части, мир — до половины).
   6. Без записи (строку читает голос игры) звуки строки не опережают её.
   7. Записи нашего мира и Пепельного года лежат в sounds/prolfx, у каждой
      роль и описание, CREDITS.md называет источники и лицензии.
   8. Фон места мира (день в поле — птицы — с заглавного экрана) не тянется
      под пролог: у частей свой фон; войдя в мир, игрок снова слышит фон места.
   9. (Просьба игрока о первой части: «больше шумов города, ярче
      пролистывание страниц, музыка, поток машин, дождь и гром».) У первой
      части своя музыка — нуар под дождь; во второй части снова тема пролога.
  10. (Просьба игрока: «расширь стереопанораму пролога, добавь глубину звука
      и высоту звука».) Угол звуков части шире в полтора раза, звук ровно по
      центру расходится в свою сторону, а шёпот у уха остаётся у уха; дальнее
      отодвинуто дальше, у него срезан верх и больше отзвука; гром, драконы —
      сверху, шаги и подземный гул — снизу, восьмое число задаёт высоту явно.
      Рой боя — со всех сторон (и за спиной) и на разной высоте. Петли части
      и стерео «плоско» идут через ширитель и звучат; у части своя акустика
      (у Пепельного года — горы), в мире акустика снова своя.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(900);

 /* ── 1 ── */
 const а=await page.evaluate(()=>{const плохие=[],нетРоли=[];
  PROLOGUE.forEach((s,i)=>{(s.звуки||[]).forEach(z=>{if(!ПрологЧасы.якорь(i,z[0]))плохие.push(i+1+":"+z[0]);if(!Bank.has(z[1]))нетРоли.push(z[1]);});
   (s.слои||[]).forEach(L=>{[L[1],L[2]].filter(Boolean).forEach(a=>{if(!ПрологЧасы.якорь(i,a))плохие.push(i+1+":слой "+a);});if(!Bank.has(L[0]))нетРоли.push(L[0]);});
   if(s.бой)[s.бой.на,s.бой.до].forEach(a=>{if(!ПрологЧасы.якорь(i,a))плохие.push(i+1+":бой "+a);});});
  return {плохие,нетРоли:[...new Set(нетРоли)],звуков:PROLOGUE.map(s=>s.звуки.length),слоёв:PROLOGUE.map(s=>(s.слои||[]).length),
   строкиСоВременем:PROLOGUE.every((s,i)=>s.строки.every((_,k)=>{const w=PROLOG_WT[`s${i+1}_${k+1}`];return w&&w.w.length===ПрологЧасы.слова(typeof s.строки[k]==="string"?s.строки[k]:s.строки[k].t).length;}))};});
 check('1. каждый якорь находит своё слово, каждая роль — в банке; у каждой сцены не меньше пятнадцати звуков и свои слои; время слов есть у всех тридцати строк',
  !а.плохие.length&&!а.нетРоли.length&&а.звуков.every(n=>n>=15)&&а.слоёв.every(n=>n>=2)&&а.строкиСоВременем,а);

 /* ── 2 ── */
 const м=await page.evaluate(()=>{const s1=PROLOGUE[0],s7=PROLOGUE[6];const z=(s,r)=>s.звуки.filter(x=>x[1]===r).map(x=>x[0]);const L=(s,r)=>(s.слои||[]).filter(x=>x[0]===r).map(x=>[x[1],x[2]]);
  return {машина:z(s1,"pf_car_wet"),поток:L(s1,"pf_traffic_wet"),морось:L(s1,"pf_drizzle"),ливень:L(s1,"pf_rain_street"),комната:L(s1,"pf_rain_room"),
   гром:z(s1,"pf_thunder_near"),страницы:z(s1,"pf_page_turn").concat(z(s1,"pf_page_riffle")),гудки:z(s1,"pf_horns"),музыка:(s1.музыка||[])[0]||null,
   город:L(s1,"pf_city_night"),фонарь:L(s1,"pf_lamp_buzz"),мокро:z(s7,"pf_car_wet"),мигнул:z(s7,"pf_lamp_flicker"),звон:z(s7,"pf_tinnitus_rise"),
   уши:z(s1,"pf_tinnitus"),фон7:s7.фон[0]};});
 check('2. первая часть: поток машин по мокрому и морось под второй строкой, гудки на «гудят», проезд на «машины», ночной город и фонарь; гром на «грозой», за ним ливень и дождь за окном комнаты; страницы ярко; своя музыка; в седьмой части — машина по мокрому асфальту, фонарь мигает, звон нарастает',
  м.машина.some(a=>/^2:машины/.test(a))&&м.поток.some(([a,b])=>/^2:мире/.test(a)&&/^3:тишина/.test(b))&&м.морось.length&&м.гудки.some(a=>/^2:гудят/.test(a))
  &&м.гром.some(a=>/^3:грозой/.test(a))&&м.ливень.some(([a])=>/^3:грозой/.test(a))&&м.комната.length&&м.страницы.filter(a=>/^1:страниц/.test(a)).length>=2&&м.музыка==="pf_mus_noir"
  &&м.город.some(([a,b])=>/^2:/.test(a)&&/^3:тишина/.test(b))&&м.фонарь.length&&м.уши.some(a=>/^3:звон/.test(a))
  &&м.мокро.some(a=>/^1:асфальт/.test(a))&&м.мигнул.some(a=>/^3:фонарь/.test(a))&&м.звон.some(a=>/^1:звон/.test(a))&&м.фон7==="pf_city_rain",м);

 /* ── 3–5: сцена по часам записи; запись идёт в 2,5 раза быстрее ── */
 const сыграть=async(сцена,сек)=>{
  await page.evaluate((сцена)=>{try{if(!gameActive())enterGame();}catch(_){}while(activeLayer())closeTopUI();
   settings.effects=1;settings.masterVol=1;settings.music=0;
   window.__лог=[];window.__строки=[];window.__дых={};const t0=performance.now();
   if(!window.__обёрнуто){window.__обёрнуто=true;
    /* дыхание слоёв: доля громкости петель пролога по ходу части */
    setInterval(()=>{try{Bank.loops.forEach((c,key)=>{if(/^prolog_/.test(key)&&c&&c.дых!=null)(window.__дых[key]=window.__дых[key]||[]).push(+c.дых);});}catch(_){}},40);
    const з0=Prologue.звукЗ.bind(Prologue);Prologue.звукЗ=function(z){const el=Prologue.el;__лог.push({т:"звук",a:z[0],r:z[1],k:Prologue.__k,ct:el?el.currentTime:null,ms:performance.now()-t0});return з0(z);};
    const б0=Prologue.звук.bind(Prologue);Prologue.звук=function(r,dx,dy,g,s,dz){if(Prologue.бой||Prologue.поход)__лог.push({т:Prologue.бой?"бой":"поход",r,dx,k:Prologue.__k,ms:performance.now()-t0});return б0(r,dx,dy,g,s,dz);};
    const с0=Prologue.слой.bind(Prologue);Prologue.слой=function(k,r,g,v){__лог.push({т:"слой",r,k,ct:Prologue.el?Prologue.el.currentTime:null,ms:performance.now()-t0});return с0(k,r,g,v);};
    const п0=Prologue.погасить.bind(Prologue);Prologue.погасить=function(k,s){__лог.push({т:"гаснет",k,ct:Prologue.el?Prologue.el.currentTime:null});return п0(k,s);};
    const f0=Bank.file.bind(Bank);Bank.file=function(p,o){const el=f0(p,o);if(/^prologue\//.test(p)){window.__строки.push({p,voice:!!(o&&o.voice),кл:Гул155.кл||Гул155.класс("",(o&&o.kind)||"fx",o)});
     const m=p.match(/s\d+_(\d+)/);Prologue.__k=m?Number(m[1]):0;if(el)try{el.playbackRate=2.5;el.preservesPitch=false;}catch(_){}}return el;};}
   showScreen("screen-intro");Prologue.i=сцена;Prologue.play(сцена,false);},сцена);
  await page.waitForTimeout(сек*1000);
  return page.evaluate((сцена)=>{const o={лог:__лог,строки:__строки,ждали:{}};(PROLOGUE[сцена].звуки||[]).forEach(z=>{o.ждали[z[0]+"|"+z[1]]=ПрологЧасы.якорь(сцена,z[0]);});
   o.дых=window.__дых;o.слои=(PROLOGUE[сцена].слои||[]).map((L,j)=>({r:L[0],key:"prolog_"+(j+1),на:ПрологЧасы.якорь(сцена,L[1]),до:L[2]?ПрологЧасы.якорь(сцена,L[2]):null}));return o;},сцена);};
 const сверка=(o)=>{const мимо=[],раньшеСтроки=[];let наСлове=0;
  for(const e of o.лог){if(e.т!=="звук"||/^0:/.test(e.a))continue;const я=o.ждали[e.a+"|"+e.r];if(!я)continue;
   if(e.k!==я.k&&!(e.k===я.k+1&&я.t>=я.d-0.05))раньшеСтроки.push(e.a);
   else if(e.ct!=null&&e.k===я.k){const d=e.ct-я.t;if(Math.abs(d)>0.16)мимо.push([e.a,+d.toFixed(2)]);else наСлове++;}}
  return {наСлове,мимо,раньшеСтроки};};
 const с1=await сыграть(0,24);const с1с=сверка(с1);
 const город=с1.лог.find(e=>e.т==="слой"&&e.r==="pf_city_night"),гаснет=с1.лог.filter(e=>e.т==="гаснет");
 const машина=с1.лог.find(e=>e.r==="pf_car_wet");
 check('3. сцена 1 по часам записи: каждый звук на своём слове, ни один не раньше своей строки; машина — на «машины», город вступает со второй строкой и гаснет на «тишина»',
  с1с.наСлове>=15&&!с1с.мимо.length&&!с1с.раньшеСтроки.length&&машина&&машина.k===2&&Math.abs(машина.ct-(с1.ждали["2:машины-0.25|pf_car_wet"].t))<0.16
  &&город&&гаснет.length>=2&&с1.строки.length===3,{с1с,машина,город,гаснет:гаснет.length,строк:с1.строки.length});
 const тесно=await page.evaluate(()=>{const т0=Гул155.теснота;Гул155.теснота=()=>({L:6,n:12});
  const r={рассказ:Гул155.множ("рассказ"),голос:+Гул155.множ("голос").toFixed(2),мир:+Гул155.множ("мир").toFixed(2)};Гул155.теснота=т0;return r;});
 check('5. голос пролога — род «рассказ»: в тесноте звуков сцены он не убавляется вовсе',
  с1.строки.length&&с1.строки.every(x=>x.voice&&x.кл==="рассказ")&&тесно.рассказ===1&&тесно.голос<1&&тесно.мир<1,{строки:с1.строки,тесно});

 const с4=await сыграть(3,26);const с4с=сверка(с4);
 const сл=n=>с4.лог.find(e=>e.т==="слой"&&e.r===n);const бой=с4.лог.filter(e=>e.т==="бой");
 const стороны={слева:бой.filter(e=>e.dx<-0.5).length,справа:бой.filter(e=>e.dx>0.5).length,родов:new Set(бой.map(e=>e.r)).size};
 const изв=с4.лог.find(e=>e.r==="pf_eruption");
 const поход=с4.лог.filter(e=>e.т==="поход");const шагов=поход.filter(e=>/^(tread_|lug_step_|mtg_step_)/.test(e.r)).length;
 const родБоя={крик:бой.filter(e=>/^(cry_|throng_|cast_warcry)/.test(e.r)).length,кровь:бой.filter(e=>/(flesh|splatter|stab|knife)/.test(e.r)).length,
  тело:бой.filter(e=>/^(lug_thud|lug_land|hit_ground)$/.test(e.r)).length,клинок:бой.filter(e=>/(sword|blade|parry|clang|clash)/.test(e.r)).length};
 const сшибок=await page.evaluate(()=>(PROLOGUE[3].бой.сшибки||[]).length);
 const слойКлюч=r=>{const L=(с4.слои||[]).find(x=>x.r===r);return L?L.key:null;};
 const дых=(с4.дых||{})[слойКлюч("pf_melee_mass")]||[];let подъём=0,мин=1;for(const v of дых){мин=Math.min(мин,v);подъём=Math.max(подъём,v-мин);}
 const клич=с4.лог.find(e=>e.r==="pf_crowd_warcry");
 const толпа={сеча:!!сл("pf_melee_mass"),голоса:!!сл("pf_battle_cries"),дыханиеМин:+мин.toFixed(2),подъём:+подъём.toFixed(2),отсчётов:дых.length,клич:клич?клич.k:null};
 check('4. война: извержение на «раскрыли», барабаны с «тридцать», поход через перевал, толпа в бою (сеча сотен, голоса битвы, клич войска на «гнёзда»), гул и звон битвы, пожар с «дракониды» и «Резали», живое поле боя по сторонам — клинки, крики, кровь, тела; бой дышит: под словами тише, в паузах громче; всё на своих словах',
  с4с.наСлове>=25&&!с4с.мимо.length&&!с4с.раньшеСтроки.length&&изв&&изв.k===1&&сл("pf_war_drums")&&сл("pf_battle_roar")&&сл("siege_fire")&&сл("sky_snow")
  &&сл("pf_pass_march")&&сл("pf_battle_clash")&&поход.length>=6&&шагов>=3&&поход.every(e=>e.k<=2)&&сшибок>=5
  &&толпа.сеча&&толпа.голоса&&толпа.клич===3&&толпа.дыханиеМин<0.7&&толпа.подъём>=0.12
  &&бой.length>=6&&стороны.слева>=1&&стороны.справа>=1&&стороны.родов>=8&&родБоя.крик>=2&&родБоя.кровь>=2&&родБоя.клинок>=2,
  {с4с,бой:бой.length,стороны,родБоя,поход:поход.length,шагов,сшибок,толпа,изв:!!изв});

 /* ── 6: без записи — голосом игры (речь — заглушка: 30 мс на букву) ── */
 const т=await page.evaluate(async()=>{const f0=Bank.file;Bank.file=function(p,o){return /^prologue\//.test(p)?null:f0.call(this,p,o);};
  const s0=Speech.say;const t0=performance.now();const сказано=[];
  Speech.say=function(t,o){сказано.push({t:String(t).slice(0,24),ms:performance.now()-t0});
   setTimeout(()=>{try{if(o&&o.onDone)o.onDone();}catch(_){}},Math.max(400,String(t).length*30));return true;};
  const тт=[];const з0=Prologue.звукЗ;Prologue.звукЗ=function(z){тт.push({a:z[0],ms:performance.now()-t0});return з0.call(this,z);};
  Prologue.play(0,false);await new Promise(r=>setTimeout(r,16000));Prologue.stop();Bank.file=f0;Speech.say=s0;Prologue.звукЗ=з0;
  /* строка k начинается, когда её сказали; звук строки k — между началом k и началом k+1 */
  const нач=k=>{const x=сказано[k];return x?x.ms:Infinity;};
  const мимо=тт.filter(e=>!/^0:/.test(e.a)).filter(e=>{const k=Number(e.a.split(":")[0]);return !(e.ms>=нач(k)-30&&e.ms<=нач(k+1)+60);}).map(e=>e.a+"@"+Math.round(e.ms));
  return {строк:сказано.length,начала:сказано.map(x=>Math.round(x.ms)),звуков:тт.length,мимо};});
 check('6. без записи строку читает голос игры, и звуки строки звучат в её пределах: не раньше её начала и не позже начала следующей',
  т.строк>=4&&т.звуков>=15&&!т.мимо.length,т);

 /* ── 7 ── */
 const ЗВ=path.join(__dirname,'..','sounds','prolfx');
 const файлы=fs.existsSync(ЗВ)?fs.readdirSync(ЗВ).filter(f=>/\.flac$/.test(f)):[];
 const титры=fs.existsSync(path.join(ЗВ,'CREDITS.md'))?fs.readFileSync(path.join(ЗВ,'CREDITS.md'),'utf8'):'';
 const б=await page.evaluate(()=>{const r=Object.keys(SOUND_BANK).filter(k=>/^pf_/.test(k));return {ролей:r.length,безОписания:r.filter(k=>!SOUND_BANK[k].d),файлы:[].concat(...r.map(k=>SOUND_BANK[k].f)),
  раздел:!!BANK_CATS.prolfx,группа:BANK_GROUPS.some(g=>g.dirs.includes("prolfx"))};});
 const нетНаДиске=б.файлы.filter(f=>!fs.existsSync(path.join(__dirname,'..','sounds',f))),ничьи=файлы.filter(f=>!б.файлы.includes('prolfx/'+f));
 check('7. записи нашего мира и Пепельного года — в sounds/prolfx, у каждой роль и описание; CREDITS.md называет источники и лицензии',
  б.ролей>=17&&!б.безОписания.length&&!нетНаДиске.length&&!ничьи.length&&б.раздел&&б.группа&&файлы.length>=20
  &&/Frederik_Sunne/.test(титры)&&/CC BY 4\.0/.test(титры)&&/OpenSFX/.test(титры)&&/CC0/.test(титры)&&файлы.every(f=>титры.includes(f.replace(/\.flac$/,''))),
  {ролей:б.ролей,нетНаДиске,ничьи,файлов:файлы.length});

 /* ── 8: фон места мира не тянется под пролог ── */
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 const ф=await page.evaluate(async()=>{const r={заглавный:Bank.loops.has("scape")};startIntro();await new Promise(q=>setTimeout(q,1200));
  r.пролог=Bank.loops.has("scape");Prologue.play(3,false);await new Promise(q=>setTimeout(q,800));safeFn(()=>Scape.bed());r.часть4=Bank.loops.has("scape");
  Prologue.skip();await new Promise(q=>setTimeout(q,1500));safeFn(()=>Scape.bed());r.игра=gameActive();r.мир=Bank.loops.has("scape");
  r.ждём=["deep","cave","dungeon","desert","forest","water","ship","mountain","field"].includes(safeFn(()=>roomKind(),""));return r;});
 check('8. фон места мира (день в поле с заглавного экрана) не тянется под пролог: у частей свой фон; в мире он возвращается',
  !ф.пролог&&!ф.часть4&&ф.игра&&ф.мир===ф.ждём,ф);

 /* ── 9: музыка первой части — своя тема, во второй — снова тема пролога ── */
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 const муз=await page.evaluate(async()=>{const r={};startIntro();await new Promise(q=>setTimeout(q,3000));
  const a=Bank.loops.get("score");r.часть1=a?a.role:null;r.громко=a?+(+a.el.volume).toFixed(2):0;
  Prologue.play(1,false);await new Promise(q=>setTimeout(q,3000));const b=Bank.loops.get("score");r.часть2=b?b.role:null;
  Prologue.skip();return r;});
 check('9. у первой части своя музыка — нуар под дождь, её слышно; во второй части снова тема пролога',
  муз.часть1==="pf_mus_noir"&&муз.громко>0.2&&муз.часть2==="mus_prologue",муз);

 /* ── 10: ширь, глубина и высота ── */
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 const ш=await page.evaluate(async()=>{const r={};settings.effects=1;settings.music=1;const Ш=ПрологШирь;
  const уг=m=>+(Math.atan2(m.dx,-m.dy)*180/Math.PI).toFixed(1);
  r.центр=уг(Ш.точка("gr_spot_chime",0,-2,null,"2:грань"));r.центрСнова=уг(Ш.точка("gr_spot_chime",0,-2,null,"2:грань"));
  r.бок=уг(Ш.точка("stk_dark",-2,-2,null,"x"));const шп=Ш.точка("gr_spot_whisper",0.5,0.5,null,"x");r.шёпот=[шп.dx,шп.dy];
  const дл=Ш.точка("market",0,-4,null,"x");r.даль=+Math.hypot(дл.dx,дл.dy).toFixed(2);
  r.высоты={гром:Ш.точка("sky_thunder",2,-5,null,"x").dz,дракон:Ш.точка("wyrm_roar",0,-9,null,"x").dz,шаг:Ш.точка("step_water",0.3,0.5,null,"x").dz,
   гул:Ш.точка("oc_earthquake",0,-1,null,"x").dz,явно:Ш.точка("market",1,-1,3.5,"x").dz};
  const г1=Ш.глубина("market",0,-1,0),г2=Ш.глубина("market",0,-9,0);r.глубина={близко:[г1.воздух,+г1.отзвук.toFixed(2)],далеко:[Math.round(г2.воздух),+г2.отзвук.toFixed(2)]};
  /* часть 4: петли через ширитель, акустика гор */
  startIntro();await new Promise(q=>setTimeout(q,500));Prologue.play(3,false);await new Promise(q=>setTimeout(q,1800));
  const фон=Bank.loops.get("prolog");r.фонШирь=!!(фон&&Ш.узлы.has(фон.el));r.акустика=Room.kind;r.объём=Spatial.on();
  /* ширитель звучит: уровень на его выходе */
  const ур=async el=>{const n=el&&Ш.узлы.get(el);if(!n)return 0;const an=AE.ctx.createAnalyser();an.fftSize=2048;n.выход.connect(an);
   let m=0;const d=new Float32Array(2048);for(let k=0;k<12;k++){await new Promise(q=>setTimeout(q,60));an.getFloatTimeDomainData(d);let s2=0;for(const v of d)s2+=v*v;m=Math.max(m,Math.sqrt(s2/d.length));}
   try{n.выход.disconnect(an);}catch(_){}return m;};
  r.уровеньФона=+(await ур(фон&&фон.el)).toFixed(4);
  /* стерео «плоско» — через ширитель */
  Prologue.звукЗ(["0:+0","pf_thunder_far",0,0,0.4,3,"плоско"]);const гр=Bank.shots[Bank.shots.length-1];r.громШирь=!!(гр&&Ш.узлы.has(гр));
  /* рой боя: со всех сторон и на разной высоте */
  const зв=[];const at0=Spatial.at;Spatial.at=function(f,dx,dy,o){зв.push({dx,dy,dz:(o&&o.dz)||0,lp:(o&&o.lp)||0});return at0.apply(this,arguments);};
  прологРой(Prologue.ход,PROLOGUE[3].бой,"бой");await new Promise(q=>setTimeout(q,5000));Prologue.бой=false;Spatial.at=at0;
  r.рой={всего:зв.length,сзади:зв.filter(z=>z.dy>0).length,слева:зв.filter(z=>z.dx<-1).length,справа:зв.filter(z=>z.dx>1).length,
   выше:зв.filter(z=>z.dz>0.5).length,срез:зв.filter(z=>z.lp>0).length};
  /* из пролога — в мир: ширитель отдан, акустика мира */
  Prologue.skip();await new Promise(q=>setTimeout(q,1500));safeFn(()=>Room.set());r.послеМир=Room.kind;r.ждём=safeFn(()=>roomKind(),"");
  r.отдан=!(фон&&Ш.узлы.has(фон.el));return r;});
 check('10. ширь, глубина и высота: угол шире, центр расходится в свою сторону, шёпот у уха; дальнее дальше, глуше и в отзвуке; гром и драконы сверху, шаги и гул снизу; рой боя со всех сторон и на высоте; петли и стерео через ширитель и звучат; у части своя акустика, в мире — своя',
  Math.abs(ш.центр)>=15&&Math.abs(ш.центр)<=35&&ш.центр===ш.центрСнова&&ш.бок<=-60&&ш.шёпот[0]===0.5&&ш.шёпот[1]===0.5&&ш.даль>=5
  &&ш.высоты.гром>=4&&ш.высоты.дракон>=4&&ш.высоты.шаг<0&&ш.высоты.гул<0&&ш.высоты.явно===3.5
  &&ш.глубина.близко[0]===0&&ш.глубина.далеко[0]>0&&ш.глубина.далеко[0]<12000&&ш.глубина.далеко[1]>ш.глубина.близко[1]
  &&ш.объём&&ш.фонШирь&&ш.уровеньФона>0.0005&&ш.громШирь&&ш.акустика==="mountain"
  &&ш.рой.всего>=10&&ш.рой.сзади>=1&&ш.рой.слева>=2&&ш.рой.справа>=2&&ш.рой.выше>=1&&ш.рой.срез>=3
  &&ш.послеМир===ш.ждём&&ш.отдан,ш);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

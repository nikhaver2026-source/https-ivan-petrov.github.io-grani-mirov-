/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 119: ЖИВАЯ РЕЧЬ НАРОДОВ

   Житель отзывался гулом толпы — одним и тем же у эльфа, у тролля и у
   соляной вдовы. Теперь говорит человек: живая запись на русском, среднего
   темпа, своя у каждого из ста двенадцати народов.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Таблицы полны: сто двенадцать народов, сорок шесть ремёсел, семь общих
      слов, двадцать один ход разговора — и ни одного народа, ремесла или
      хода без записи.
   2. Каждая запись и вправду лежит на сервере: ни одной битой ссылки среди
      ста девяноста трёх файлов.
   3. Рядом лежит CREDITS.md, он называет ElevenLabs, условия и перечисляет
      каждый файл; титры энциклопедии говорят то же.
   4. Вживую: оклик жителя звучит записью его народа, а следом — записью его
      ремесла; ответ в разговоре — общим словом.
   5. Голос героя звучит на ход разговора, и звучит ПЕРВЫМ.
   6. Гул толпы под живой речью приглушается.
   7. Мера: одна и та же запись не звучит дважды подряд, между репликами
      пауза, а переключатель настроек выключает речь целиком.
   8. Народ-ветвь говорит голосом своего народа, а самопроверка мира знает
      строку «folk».
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const ROOT=path.resolve(__dirname,'..');
 const VOICE=path.join(ROOT,'sounds','voice');

 /* ── 3. титры рядом с записями ── */
 const files=fs.existsSync(VOICE)?fs.readdirSync(VOICE):[];
 const mp3=files.filter(f=>f.endsWith('.mp3'));
 check('папка sounds/voice с тремястами шестьюдесятью одной записью',mp3.length===361,mp3.length);
 const cr=fs.existsSync(path.join(VOICE,'CREDITS.md'))?fs.readFileSync(path.join(VOICE,'CREDITS.md'),'utf8'):'';
 check('CREDITS.md называет ElevenLabs и условия',
  /ElevenLabs/.test(cr)&&/Terms of Service/.test(cr)&&/eleven_multilingual_v2/.test(cr));
 const нетВТитрах=mp3.filter(f=>cr.indexOf(f)<0);
 check('CREDITS.md перечисляет каждую запись',нетВТитрах.length===0,нетВТитрах.slice(0,5));
 check('CREDITS.md честно называет, чем озвучены тридцать четыре народа: голоса Piper и их лицензия',
  /Тридцать четыре народа/.test(cr)&&/Piper/.test(cr)&&/Apache-2\.0/.test(cr)&&/rraaww\/ru_piper/.test(cr));

 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);

 /* Перехват: что именно уходит в звук. Речь идёт либо объёмным путём
    (Spatial.at по файлу), либо плоским (Bank.file), поэтому слушаем оба. */
 await page.evaluate(()=>{
  window.VOICED=[];window.CUED=[];
  const at=Spatial.at.bind(Spatial);
  Spatial.at=(p,dx,dy,o)=>{VOICED.push({f:p,gain:(o||{}).gain,rate:(o||{}).rate,t:Date.now()});return at(p,dx,dy,o);};
  const bf=Bank.file.bind(Bank);
  Bank.file=(p,o)=>{VOICED.push({f:p,gain:(o||{}).gain,rate:(o||{}).rate,t:Date.now()});return bf(p,o);};
  /* Плоский путь голоса теперь свой — через сжатие (набор 175). */
  const fp=Folk.плоско.bind(Folk);
  Folk.плоско=(p,o)=>{VOICED.push({f:p,gain:(o||{}).gain,rate:(o||{}).rate,t:Date.now()});return fp(p,o);};
  const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{CUED.push({r,gain:(o||{}).gain,t:Date.now()});return bp(r,o);};
  const sr=Spatial.role.bind(Spatial);
  Spatial.role=(r,dx,dy,o)=>{CUED.push({r,gain:(o||{}).gain,t:Date.now()});return sr(r,dx,dy,o);};
 });

 /* ── 1. таблицы полны ── */
 const полнота=await page.evaluate(()=>{
  const все=[].concat(ALL_RACE_NAMES,DARK_RACE_NAMES);
  const ремёсла=[...new Set([].concat(...Object.values(PROFS)))];
  return {
   счёт:Folk.счёт(),
   всего:все.length,
   безГолоса:все.filter(n=>!VOICE_RACES[n]),
   лишние:Object.keys(VOICE_RACES).filter(n=>все.indexOf(n)<0),
   файлыРазные:new Set(Object.values(VOICE_RACES).map(v=>v[0])).size,
   регистры:[...new Set(Object.values(VOICE_RACES).map(v=>v[2]))].sort(),
   темпы:Object.values(VOICE_RACES).every(v=>v[1]>=0.5&&v[1]<=2),
   ремёсел:ремёсла.length,
   безРемесла:ремёсла.filter(p=>!VOICE_PROFS[p]),
   безХода:DLG_MOVES.filter(m=>VOICE_HERO.indexOf(m.id)<0).map(m=>m.id),
   ветвь:(()=>{const b=Object.keys(RACE_BRANCH)[0];return b?{ветка:b,есть:!!Folk.раса(b)}:{ветка:null,есть:true};})()};});
 check('двести восемьдесят рас и народов, и у каждого свой файл',
  полнота.счёт.народов===280&&полнота.всего===280&&полнота.безГолоса.length===0
  &&полнота.лишние.length===0&&полнота.файлыРазные===280,полнота);
 check('все двести восемьдесят рас и народов говорят своей строкой',полнота.счёт.своих===280,полнота.счёт.своих);
 check('у народа есть регистр и разумный темп',
  полнота.регистры.join(",")==="ж,м"&&полнота.темпы,полнота.регистры);
 check('сорок шесть ремёсел, и ни одно не без слова',
  полнота.ремёсел===46&&полнота.безРемесла.length===0&&полнота.счёт.ремёсел===46,полнота.безРемесла);
 check('двадцать один ход разговора озвучен',
  полнота.счёт.ходов===21&&полнота.безХода.length===0,полнота.безХода);
 check('семь общих слов',полнота.счёт.общих===7,полнота.счёт.общих);
 check('народ-ветвь говорит голосом своего народа',полнота.ветвь.есть,полнота.ветвь);

 /* ── 2. ни одной битой ссылки ──
    Сеть странице закрыта (connect-src 'none'), поэтому наличие файлов
    проверяется по диску, а читаемость — тем же путём, каким игра их и
    проигрывает: через элемент Audio. */
 const пути=await page.evaluate(()=>{
  const out=[];
  Object.values(VOICE_RACES).forEach(v=>out.push(VOICE_DIR+"race_"+v[0]+".mp3"));
  Object.values(VOICE_PROFS).forEach(v=>{out.push(VOICE_DIR+"prof_"+v[0]+".mp3");
   if(v[1])out.push(VOICE_DIR+"prof_"+v[0]+"_f.mp3");});
  VOICE_SAY.forEach(k=>out.push(VOICE_DIR+"say_"+k+".mp3"));
  VOICE_HERO.forEach(k=>out.push(VOICE_DIR+"hero_"+k+".mp3"));
  return out;});
 const нетНаДиске=пути.filter(p=>!fs.existsSync(path.join(ROOT,'sounds',p)));
 check('каждая запись речи лежит на диске',
  пути.length===361&&нетНаДиске.length===0,нетНаДиске.slice(0,5));
 const лишниеФайлы=mp3.filter(f=>пути.indexOf('voice/'+f)<0);
 check('в папке нет записей, которые игра не зовёт',лишниеФайлы.length===0,лишниеФайлы.slice(0,5));
 const читается=await page.evaluate(async(список)=>{
  const плохо=[];
  for(const p of список){
   const ok=await new Promise(r=>{
    const a=new Audio("sounds/"+p);
    a.addEventListener("loadeddata",()=>r(true),{once:true});
    a.addEventListener("error",()=>r(false),{once:true});
    setTimeout(()=>r(false),4000);});
   if(!ok)плохо.push(p);}
  return плохо;},[пути[0],пути[40],пути[111],пути[120],пути[170],пути[192]]);
 check('записи речи читаются проигрывателем',читается.length===0,читается);

 /* ── 4. вживую: оклик, ремесло, ответ ── */
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(400);
 const оклик=await page.evaluate(async()=>{
  const n=getNPC(120,120,0);
  VOICED.length=0;CUED.length=0;
  npcVoice(n,"оклик");
  await new Promise(r=>setTimeout(r,1800));
  return {народ:n.race,ремесло:n.prof,речь:VOICED.map(v=>v.f),гул:CUED.map(c=>c.gain),
   ожидалась:"voice/race_"+Folk.раса(n.race)[0]+".mp3",
   ремФайл:"voice/prof_"+VOICE_PROFS[n.prof][0]};});
 check('оклик жителя — запись его народа',
  оклик.речь[0]===оклик.ожидалась,оклик);
 check('следом идёт слово его ремесла',
  оклик.речь.some(f=>f.indexOf(оклик.ремФайл)===0),оклик.речь);
 check('под живую речь гул толпы приглушён',
  оклик.гул.length>0&&оклик.гул[0]<=0.15,оклик.гул);

 /* ── 7. мера: повтор не проходит, выключатель гасит ── */
 const мера=await page.evaluate(async()=>{
  const n=getNPC(200,200,0);
  VOICED.length=0;
  Folk.когда=0;Folk.было.clear();
  const первый=Folk.народ(n);
  const сразу=Folk.народ(n);            /* тот же файл сразу — не должен пройти */
  await new Promise(r=>setTimeout(r,1100));
  const повтор=Folk.народ(n);           /* пауза прошла, но запись та же — тоже нет */
  settings.folk=0;
  Folk.когда=0;Folk.было.clear();
  const доВыкл=VOICED.length;
  const выкл=Folk.народ(n);
  settings.folk=1;
  /* Одна реплика — одна запись; попыток две, потому что объёмный путь и
     плоский считаются отдельно, а второй берётся, только если первый не
     вышел. Важно другое: после выключателя не прибавилось ни одной. */
  return {первый,сразу,повтор,выкл,добавилось:VOICED.length-доВыкл};});
 check('первая реплика звучит, вторая подряд — нет',
  мера.первый===true&&мера.сразу===false,мера);
 check('одна и та же запись не повторяется восемь секунд',мера.повтор===false,мера);
 check('переключатель «Живая речь народов» гасит речь',
  мера.выкл===false&&мера.добавилось===0,мера);

 /* ── 5. голос героя и порядок ── */
 const герой=await page.evaluate(async()=>{
  const n=getNPC(260,260,0);
  Folk.когда=0;Folk.было.clear();VOICED.length=0;
  const t0=Date.now();
  const вышло=dlgDo(n,"rassprosit");
  const сразуПосле=VOICED.map(v=>v.f);
  /* Житель отвечает, когда герой договорил: ждём длину реплики героя и
     ещё немного (раньше ответ шёл через 1,5 с — поверх героя). */
  const герояМс=Math.round(Folk.длина("hero_rassprosit")*1000);
  await new Promise(r=>setTimeout(r,герояМс+1600));
  const ответ=VOICED.find(v=>v.f.indexOf("voice/say_")===0);
  return {вышло:typeof вышло==="boolean",сразуПосле,всё:VOICED.map(v=>v.f),
   герояМс,ответЧерез:ответ?ответ.t-t0:null};});
 check('ход разговора звучит голосом героя',
  герой.сразуПосле[0]==="voice/hero_rassprosit.mp3",герой);
 check('голос героя идёт раньше ответа собеседника',
  герой.всё.length>=2&&герой.всё[0].indexOf("voice/hero_")===0
  &&герой.всё.slice(1).some(f=>f.indexOf("voice/say_")===0),герой.всё);
 check('ответ жителя не наслаивается на героя: начинается, когда тот договорил',
  герой.ответЧерез!==null&&герой.ответЧерез>=герой.герояМс,{ответЧерез:герой.ответЧерез,герояМс:герой.герояМс});

 /* Слово ремесла и общее слово идут в высоте народа. */
 const высоты=await page.evaluate(async()=>{
  const n=getNPC(300,300,0);
  Folk.когда=0;Folk.было.clear();VOICED.length=0;
  Folk.ремесло(n,{всегда:true});
  const г=Folk.раса(n.race);
  /* Высота народа, сдвинутая тембром самого жителя (±5 %, набор 175). */
  return {rate:VOICED.length?VOICED[0].rate:null,ждём:г[1]*Folk.тембр(n),тембр:Folk.тембр(n)};});
 check('слово ремесла звучит в высоте народа',
  высоты.rate!==null&&Math.abs(высоты.rate-высоты.ждём)<1e-9&&высоты.тембр>=0.95&&высоты.тембр<=1.05,высоты);

 /* ── 8. самопроверка мира и руководство ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();
  const строка=(c.rows||c.строки||c).find?((c.rows||c.строки||c).find(r=>r.id==="folk"||r.k==="folk"||r[0]==="folk")):null;
  const гл=GUIDE.find(g=>/Живая речь народов/i.test(g.title));
  const титры=GUIDE.find(g=>/Кто написал эти звуки/i.test(g.title));
  return {строка:строка||null,сырое:JSON.stringify(c).indexOf("folk")>=0,
   глава:!!гл,строк:гл?гл.body.length:0,
   титрыElevenLabs:!!титры&&титры.body.some(t=>/ElevenLabs/.test(t))};});
 check('самопроверка мира знает строку «folk»',свод.сырое,свод);
 check('в руководстве есть глава о живой речи',свод.глава&&свод.строк>=6,свод);
 check('титры энциклопедии называют ElevenLabs',свод.титрыElevenLabs);

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

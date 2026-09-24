/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 181: СТО ПЯТЬДЕСЯТ РАС, СТО ТРИДЦАТЬ НАРОДОВ, ВЫБОР В НАЧАЛЕ ПУТИ

   Просьба игрока: в начале пути выбирать не только ремесло, но и народ; рас
   в мире — около полутораста, народов — около ста тридцати; у всех новых —
   голос по-русски.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Рас сто пятьдесят: девяносто восемь светлых земель и пятьдесят две
      тёмных; народов-ветвей сто тридцать. У каждой новой расы полное досье,
      бог, клан и держава из мира игры.
   2. У каждой расы и каждого народа свой голос и свой файл на диске.
   3. В «Начале пути» есть пункт «Выбрать народ»; окно показывает все
      девяносто восемь рас по шести разрядам, пункт называет покровителя,
      наследие и народы.
   4. Двойное касание выбирает народ: происхождение меняется, окно
      закрывается, игра называет выбор; второй раз выбрать нельзя, и пункт
      из меню уходит.
   5. Позже начала пути выбор закрыт.
   6. Житель-«речанин» знает, что он человек, и говорит своим голосом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(_){}});
 await page.waitForTimeout(500);

 /* ── 1–2. счёт ── */
 const счёт=await page.evaluate(()=>{
  const новые=RACES_DB.slice(46);
  const все=[].concat(ALL_RACE_NAMES,DARK_RACE_NAMES);
  return {светлых:RACES_DB.length,тёмных:DARK_RACES.length,рас:RACES_DB.length+DARK_RACES.length,
   народов:Object.keys(RACE_BRANCH).length,имён:все.length,
   пустые:новые.filter(r=>!(r.hist&&r.econ&&r.pol&&r.war&&r.myth&&r.tr&&r.res.length&&r.sell.length&&r.buy.length)).map(r=>r.n),
   безБога:новые.filter(r=>!GOD_BY_ID[r.god]).map(r=>r.n),безКлана:новые.filter(r=>!CLAN_BY_NAME[r.clan]).map(r=>r.n),
   безГолоса:все.filter(n=>!VOICE_RACES[n]),
   файлы:все.map(n=>VOICE_RACES[n]&&VOICE_RACES[n][0]).filter(Boolean),
   описаний:Object.keys(PEOPLE_INFO).length};});
 const нетФайла=счёт.файлы.filter(f=>!fs.existsSync(path.join(__dirname,'..','sounds','voice','race_'+f+'.mp3')));
 check('1. рас сто пятьдесят: девяносто восемь светлых и пятьдесят две тёмных',
  счёт.светлых===98&&счёт.тёмных===52&&счёт.рас===150,счёт);
 check('1б. народов-ветвей сто тридцать, у новых — описание',счёт.народов===130&&счёт.описаний===116,
  {народов:счёт.народов,описаний:счёт.описаний});
 check('1в. у каждой новой расы полное досье, бог и клан из мира игры',
  счёт.пустые.length===0&&счёт.безБога.length===0&&счёт.безКлана.length===0,счёт);
 check('2. у каждой из двухсот восьмидесяти рас и народов свой голос и файл на диске',
  счёт.имён===280&&счёт.безГолоса.length===0&&new Set(счёт.файлы).size===280&&нетФайла.length===0,
  {имён:счёт.имён,безГолоса:счёт.безГолоса.slice(0,3),нетФайла:нетФайла.slice(0,3)});

 /* ── 3. пункт и окно ── */
 const окно=await page.evaluate(()=>{
  const пункт=amAvailable("race_start");
  const вМеню=AM_GROUP_BY_ID.start[1].some(x=>x[0]==="race_start");
  CMD.race_start();
  const m=document.getElementById("modal-racepick");
  const кнопки=[...m.querySelectorAll('[data-cmd^="racepick:"]')];
  const разделы=[...m.querySelectorAll(".sec-head")].map(h=>h.dataset.secTitle);
  const болотники=кнопки.find(b=>b.dataset.cmd==="racepick:bolotnik");
  return {пункт,вМеню,открыто:activeLayer()===m,кнопок:кнопки.length,разделы,
   речь:болотники&&болотники.dataset.speak};});
 check('3. в «Начале пути» есть пункт «Выбрать народ», и он доступен в начале',окно.пункт===true&&окно.вМеню,окно);
 check('3б. окно показывает девяносто восемь рас по шести разрядам',
  окно.открыто&&окно.кнопок===98&&окно.разделы.length===6,{кнопок:окно.кнопок,разделы:окно.разделы});
 check('3в. пункт называет разряд, покровителя, наследие и народы',
  /Болотники — обычный народ/.test(окно.речь||"")&&/Покровитель: Нерея/.test(окно.речь||"")&&/Наследие:/.test(окно.речь||"")
  &&/Народы: Гатевики, Клюквенники/.test(окно.речь||""),окно.речь);

 /* ── 4. двойное касание выбирает ── */
 const место=await page.evaluate(()=>{
  const b=document.querySelector('#modal-racepick [data-cmd="racepick:bolotnik"]');
  setCursor(b,false);const r=b.getBoundingClientRect();
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__said.push(String(t));return s0(t,o);};
  return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 const касание=async()=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:место.x,y:место.y,id:0}]});
  await page.waitForTimeout(40);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:место.x,y:место.y,id:0}]});};
 await касание();await page.waitForTimeout(90);await касание();await page.waitForTimeout(600);
 const выбор=await page.evaluate(()=>({раса:G.race,выбран:G.raceChosen,окно:!document.getElementById("modal-racepick").hidden,
  сказано:window.__said.filter(t=>/происхождение/i.test(t)).join(" "),пункт:amAvailable("race_start"),
  второй:(()=>{window.__said.length=0;CMD.racepick("elf");return {раса:G.race,сказано:window.__said.join(" ")};})()}));
 check('4. двойное касание выбирает народ: происхождение меняется, окно закрыто, выбор назван',
  выбор.раса==="Болотники"&&выбор.выбран===1&&!выбор.окно&&/Болотники/.test(выбор.сказано),выбор);
 check('4б. второй раз выбрать нельзя, и пункт из меню уходит',
  выбор.второй.раса==="Болотники"&&/уже выбран/.test(выбор.второй.сказано)&&выбор.пункт===false,выбор.второй);

 /* ── 5. позже начала пути ── */
 const поздно=await page.evaluate(()=>{G.raceChosen=0;const l=G.level;G.level=3;const r=startRaceOpen();G.level=l;G.raceChosen=1;return r;});
 check('5. позже начала пути выбор закрыт',поздно===false,поздно);

 /* ── 6. народ-ветвь ── */
 const ветвь=await page.evaluate(()=>({раса:raceInfo("Речане").n,голос:Folk.раса("Речане")[0],
  тёмные:DARK_RACE_NAMES.length,основа:RACE_BRANCH["Речане"]}));
 check('6. житель-«речанин» знает, что он человек, и говорит своим голосом',
  ветвь.раса==="Люди"&&ветвь.основа==="Люди"&&ветвь.голос==="rechane",ветвь);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

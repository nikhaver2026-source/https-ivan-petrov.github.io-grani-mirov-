/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 88: АНОМАЛИИ ГЛУБИНЫ И НОВЫЕ ДЕЙСТВИЯ С ВЕЩАМИ

   Ярусы различались породой и тварями, но не тем, как в них живётся.
   Теперь у части ярусов от третьего и ниже — своя аномалия, слышная раньше
   имени: тишина, обратное эхо, тяжесть, вода, река, платформы, механизмы,
   живые стены, временная петля (§117). А у вещей появились «положить своё»,
   «забрать своё», «задвинуть», «взломать замок», «сравнить со своим» и
   «включить или выключить» (§118).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Девять аномалий; ни одной на первых двух ярусах и в башнях; на глубине
      все девять встречаются, и аномалия яруса постоянна.
   2. Вход на аномальный ярус объявляется раз за посещение и пишется в журнал.
   3. Тишина глушит фон и мир, но не речь; вода под ногами на затопленном
      ярусе; в петле время не идёт; тяжесть снимает защиту; живые стены
      держат ход в чётный час; у аномалии свой фон.
   4. «Положить своё» кладёт меру самого частого припаса, «забрать своё»
      возвращает всё, и это переживает сохранение; «задвинуть» есть только у
      выдвинутого ящика.
   5. «Взломать замок» — только у закрытой сокровищницы и только умеющему;
      удача открывает створку, неудача бьёт крошкой, второй раз за день не
      пробуют.
   6. «Сравнить со своим» говорит числами; «включить» астролябию — картина
      шире, часы — время короче, «выключить» — обратно.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1. распределение ── */
 const распр=await page.evaluate(()=>{
  const виды={};let мелко=0,башни=0,n=0;
  for(let i=0;i<400;i++){
   const bx=200+Math.floor(H(i*13,7,5)*40000),by=200+Math.floor(H(3,i*11,6)*40000);
   const d=3+(i%40);
   const a=dungeonAnomalyAt({bx,by,depth:d,stype:"ruins"});
   if(a){виды[a.id]=(виды[a.id]||0)+1;n++;}
   if(dungeonAnomalyAt({bx,by,depth:1+(i%2),stype:"ruins"}))мелко++;
   if(dungeonAnomalyAt({bx,by,depth:d,stype:"tower"}))башни++;}
  const p={bx:5000,by:7000,depth:12,stype:"ruins"};
  const a1=dungeonAnomalyAt(p),a2=dungeonAnomalyAt(p);
  return {всего:ANOMALIES.length,видов:Object.keys(виды).length,виды,n,мелко,башни,постоянна:(a1&&a1.id)===(a2&&a2.id)};});
 check('1. девять аномалий, на глубине встречаются все, на первых ярусах и в башнях — нет, аномалия яруса постоянна',
  распр.всего===9&&распр.видов===9&&распр.n>=80&&распр.n<=320&&распр.мелко===0&&распр.башни===0&&распр.постоянна,{видов:распр.видов,n:распр.n,мелко:распр.мелко,башни:распр.башни});

 /* ── 2–3. объявление и действие ── */
 const зона=await page.evaluate(async()=>{
  const r={};
  const найти=id=>{for(let i=0;i<4000;i++){const bx=300+i*37,by=300+i*53;for(let d=3;d<40;d+=5){const a=dungeonAnomalyAt({bx,by,depth:d,stype:"ruins"});if(a&&a.id===id)return {bx,by,depth:d};}}return null;};
  const at=(id)=>{const p=найти(id);if(!p)return null;G.place={kind:"dungeon",bx:p.bx,by:p.by,stype:"ruins",name:"x",depth:p.depth,x:2,y:2};return p;};
  G.anomSeen={};G.anomNow=null;SAID.length=0;G.journal=[];
  const s=at("silence");r.silenceFound=!!s;
  refresh();refresh();
  r.объявлено=SAID.filter(t=>/Зона тишины/.test(t)).length;r.журнал=G.journal.filter(t=>/зона тишины/.test(t)).length;
  settings.effects=1;settings.ambVol=0.8;settings.fxVol=1;settings.duck=0;Speech.stop();
  r.amb=Bank.vol("ambient");r.world=Bank.vol("fx");r.speech=Bank.vol("ui");
  G.place=null;refresh();r.ambOut=Bank.vol("ambient");
  const f=at("flood");r.flood=f?indoorSurface():null;
  const l=at("loop");G.hour=10;propTime(3);r.loopHour=G.hour;G.place=null;propTime(1);r.outHour=G.hour;
  const g=at("gravity");const defG=def();G.place=null;const def0=def();r.gravity=def0-defG;
  const lv=at("living");G.hour=10;SAID.length=0;
  const o={вид:"tile",плитка:"#",n:"стена",x:1,y:1,dx:0,dy:0,d:0};IACT.hollow.делать(o);r.livingEven=SAID.some(t=>/нечётный час/.test(t));
  G.hour=11;SAID.length=0;IACT.hollow.делать(o);r.livingOdd=!SAID.some(t=>/нечётный час/.test(t));
  const loops=[];const orig=Bank.loop.bind(Bank);Bank.loop=(ch,role)=>{loops.push([ch,role]);return true;};
  at("river");liveAmbient(1);r.riverAmb=loops.some(x=>x[0]==="live"&&x[1]==="ad_river_fast");Bank.loop=orig;
  G.place=null;G.anomNow=null;return r;});
 check('2. вход на аномальный ярус объявлен ровно раз и записан в журнал',зона.silenceFound&&зона.объявлено===1&&зона.журнал===1,{о:зона.объявлено,ж:зона.журнал});
 check('3. тишина глушит фон и мир, но не голос игры; вне яруса громкость обычная',Math.abs(зона.amb-0.28)<0.01&&Math.abs(зона.world-0.5)<0.01&&зона.speech>=0.9&&Math.abs(зона.ambOut-0.8)<0.01,{amb:зона.amb,world:зона.world,ui:зона.speech,out:зона.ambOut});
 check('3б. затопленный ярус кладёт под ноги воду',зона.flood==="water",зона.flood);
 check('3в. в петле время не идёт, а снаружи идёт',зона.loopHour===10&&зона.outHour===11,{в:зона.loopHour,вне:зона.outHour});
 check('3г. тяжесть снимает единицу защиты',зона.gravity===1,зона.gravity);
 check('3д. живые стены держат ход в чётный час и отпускают в нечётный',зона.livingEven&&зона.livingOdd,{чёт:зона.livingEven,нечет:зона.livingOdd});
 check('3е. у подземной реки свой живой фон',зона.riverAmb);

 /* ── 4. своё место и задвинуть ── */
 const своё=await page.evaluate(()=>{
  G.place={kind:"house",bx:1000,by:1000,stype:"tavern",name:"x",depth:0,x:2,y:2};G.myStash={};G.propMarks={};
  G.inv={"трава":5,"кость":2};
  const o={вид:"tile",плитка:"X",вещь:"dresser",n:"комод",x:3,y:3,dx:0,dy:0,d:0};
  const до=actionsFor(o).map(a=>a.id);
  IACT.put.делать(o);IACT.put.делать(o);
  const после={трава:G.inv["трава"],стэш:JSON.parse(JSON.stringify(G.myStash)),действия:actionsFor(o).map(a=>a.id)};
  saveGame(true);const raw=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.indexOf('"myStash"')>=0)||"";
  IACT.mytake.делать(o);
  const вернул={трава:G.inv["трава"],пусто:Object.keys(G.myStash).length,действия:actionsFor(o).map(a=>a.id)};
  const закрытьДо=actionsFor(o).map(a=>a.id).includes("close");
  IACT.drawer.делать(o);const закрытьПосле=actionsFor(o).map(a=>a.id).includes("close");
  IACT.close.делать(o);const закрытьПотом=actionsFor(o).map(a=>a.id).includes("close");
  G.place=null;return {до,после,raw:raw.indexOf('"трава":2')>=0,вернул,закрытьДо,закрытьПосле,закрытьПотом};});
 check('4. «положить своё» есть у комода, кладёт по мере самого частого припаса, «забрать своё» появляется и возвращает всё',
  своё.до.includes("put")&&!своё.до.includes("mytake")&&своё.после.трава===3&&своё.после.действия.includes("mytake")&&своё.вернул.трава===5&&своё.вернул.пусто===0&&!своё.вернул.действия.includes("mytake"),{после:своё.после.трава,вернул:своё.вернул.трава});
 check('4б. своё лежит в записи сохранения',своё.raw);
 check('4в. «задвинуть» — только у выдвинутого ящика, и один раз',!своё.закрытьДо&&своё.закрытьПосле&&!своё.закрытьПотом,{до:своё.закрытьДо,после:своё.закрытьПосле,потом:своё.закрытьПотом});

 /* ── 5. взлом ── */
 const взлом=await page.evaluate(()=>{
  const r={};
  let найдено=null;
  for(let i=0;i<300&&!найдено;i++){const bx=400+i*41,by=400+i*67;for(let d=2;d<12&&!найдено;d++){
   G.place={kind:"dungeon",bx,by,stype:"ruins",name:"x",depth:d,x:1,y:1};const lvl=curLevel();if(!lvl)continue;
   for(let y=0;y<lvl.h&&!найдено;y++)for(let x=0;x<lvl.w&&!найдено;x++)if(tileAt(lvl,x,y)==="Y")найдено={bx,by,d,x,y};}}
  if(!найдено)return {нет:true};
  G.place={kind:"dungeon",bx:найдено.bx,by:найдено.by,stype:"ruins",name:"x",depth:найдено.d,x:найдено.x,y:найдено.y+1};
  G.marks={};G.vaults={};G.propMarks={};G.mast={};G.hp=G.hpMax=100;G.day=4;
  const o={вид:"tile",плитка:"Y",n:"дверь сокровищницы",x:найдено.x,y:найдено.y,dx:0,dy:0,d:0};
  r.есть=actionsFor(o).map(a=>a.id).includes("lockpick");
  SAID.length=0;IACT.lockpick.делать(o);r.безРемесла=SAID.some(t=>/первый урок/.test(t))&&!vaultIsOpen(o.x,o.y);
  G.mast.smith={ур:3,оп:0,дел:0};
  const h=hashName;
  window.hashName=(a,b,c)=>c>=8300&&c<8400?0.01:h(a,b,c);
  SAID.length=0;IACT.lockpick.делать(o);r.удача={открыта:vaultIsOpen(o.x,o.y),сказано:SAID.some(t=>/поддался/.test(t))};
  r.пропал=!actionsFor(o).map(a=>a.id).includes("lockpick");
  G.marks={};G.vaults={};G.propMarks={};G.day=5;
  window.hashName=(a,b,c)=>c>=8300&&c<8400?0.99:h(a,b,c);
  SAID.length=0;const hp0=G.hp;IACT.lockpick.делать(o);r.беда={открыта:vaultIsOpen(o.x,o.y),урон:hp0-G.hp,сказано:SAID.some(t=>/крошкой/.test(t))};
  SAID.length=0;IACT.lockpick.делать(o);r.повтор=SAID.some(t=>/уже пробовали/.test(t));
  window.hashName=h;G.place=null;return r;});
 if(взлом.нет)check('сокровищницу было где найти',false,взлом);
 else{
  check('5. «взломать замок» есть у закрытой сокровищницы, а без ремесла отказ объясняется',взлом.есть&&взлом.безРемесла,{есть:взлом.есть,без:взлом.безРемесла});
  check('5б. удача открывает створку, и взлом пропадает из действий',взлом.удача.открыта&&взлом.удача.сказано&&взлом.пропал,взлом.удача);
  check('5в. неудача бьёт крошкой, дверь заперта, второй раз за день не пробуют',!взлом.беда.открыта&&взлом.беда.урон>0&&взлом.беда.сказано&&взлом.повтор,взлом.беда);}

 /* ── 6. сравнить и включить ── */
 const прочее=await page.evaluate(()=>{
  G.place={kind:"house",bx:1000,by:1000,stype:"castle",name:"x",depth:0,x:2,y:2,active:null};G.propMarks={};
  G.inv={"трава":7,"камень":3};G.equip.weapon={name:"Меч",val:6};G.equip.armor={name:"Кольчуга",val:3};
  const r={};
  const XS={rack:3,shields:4,scales:5,bookcase:6,astrolabe:7,hourglass:8};
  const скажи=(вещь,id)=>{SAID.length=0;const o={вид:"tile",плитка:"X",вещь,n:вещь,x:XS[вещь]||4,y:4,dx:0,dy:0,d:0};IACT[id].делать(o);return SAID.find(x=>x.startsWith(вещь+":"))||SAID[SAID.length-1]||"";};
  r.rack=скажи("rack","compare");r.scales=скажи("scales","compare");r.book=скажи("bookcase","compare");
  const rad0=scapeRad();r.astro=скажи("astrolabe","toggle");const rad1=scapeRad();
  r.rad=[rad0,rad1];
  G.hour=10;скажи("hourglass","toggle");propTime(1);r.hour=G.hour;
  r.off=скажи("astrolabe","toggle");r.rad2=scapeRad();
  G.place=null;return r;});
 check('6. «сравнить со своим» говорит числами про клинок, чаши и полки',/\+6.*\+\d+/.test(прочее.rack)&&/трава ×7 против камень ×3/.test(прочее.scales)&&/страниц/.test(прочее.book),{rack:прочее.rack.slice(0,80),scales:прочее.scales.slice(0,80)});
 check('6б. включённая астролябия расширяет картину на два шага, часы укорачивают время, выключение возвращает',
  прочее.rad[1]===прочее.rad[0]+2&&Math.abs(прочее.hour-10.8)<0.01&&прочее.rad2===прочее.rad[0]&&/включено/.test(прочее.astro)&&/выключено/.test(прочее.off),{rad:прочее.rad,hour:прочее.hour,rad2:прочее.rad2});

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

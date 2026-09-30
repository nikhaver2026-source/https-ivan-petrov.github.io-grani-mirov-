/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 223: 6.0 — РАССТУПЛЕНИЕ ЗАВЕСЫ: МИР 800 000 И ДАЛЬНИЙ КРУГ

   1. Мир 800 000 по стороне; прежний мир — Средоточие в северо-западном
      углу на прежних координатах, престолы прежних держав в нём; за швом делят землю только державы Круга.
   2. Двадцать четыре державы Круга (16 суши, 8 островных) с полным досье;
      у каждой — своя область, свой младший бог, свой дар земли и голос.
   3. Двадцать пять новых рас с полным досье, по два народа у каждой; у
      записанных — оклик живым голосом (свой пол и второй), у ждущих записи
      оклик молчит, а не зовёт пустой файл.
   4. Восемь шовных застав: узлы сети, открытые сразу; шовная тропа к трём
      престолам Круга за 60 золотых и 36 часов; переход работает.
   5. Шов и карта Круга: переход шва объявляется, первая держава ложится на
      карту, четыре — звание.
   6. Породы тварей Круга: родовой голос, своё имя и облик, сила выше.
   7. Подземелья Круга: восемь новых родов под дверьми за швом.
   8. Дары земли: цена, род ресурса, выпадают при сборе на земле державы.
   9. Внешнее море: у края мира почти всё — берег, рифы и архипелаги.
  10. Прежний мир не сдвинулся: начало пути и престолы на старых местах;
      тёмные владения за разными разломами разные.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,...a){SAID.push(String(t));return n0(t,...a);};});

 /* ── 1 ── */
 const г=await page.evaluate(()=>{
  const r={W:WORLD,O:CORE_O,старт:[G.x,G.y],вЯдре:inCore(G.x,G.y)};
  r.ядро=CORE_EMPIRES.length;r.круг=DK_REALMS.length;
  r.престолыВЯдре=CORE_EMPIRES.every(e=>inCore(e.cap.x,e.cap.y));
  r.престолыЗаШвом=DK_REALMS.every(e=>!inCore(e.cap.x,e.cap.y)&&e.cap.x>0&&e.cap.x<WORLD&&e.cap.y>0&&e.cap.y<WORLD);
  let чужие=0;for(let i=0;i<400;i++){const x=Math.floor(hashName(i,1,1)*WORLD),y=Math.floor(hashName(i,2,1)*WORLD);
   const e=empireAt(x,y);if(inCore(x,y)===!!e.дальний)чужие++;}
  r.чужие=чужие;return r;});
 check('1. мир 800 000; Средоточие в северо-западном углу с двенадцатью прежними державами; за швом — только державы Круга',
  г.W===800000&&г.O===0&&г.вЯдре&&г.старт[0]===25000&&г.старт[1]===25000&&г.ядро===12&&г.круг===24&&г.престолыВЯдре&&г.престолыЗаШвом&&г.чужие===0,г);

 /* ── 2 ── */
 const д=await page.evaluate(()=>{
  const пусто=DK_REALMS.filter(e=>!e.name||!e.short||!e.gov||!e.econ||!e.hist||!e.race||!(e.races||[]).length||!GOD_BY_ID[e.god]||!(e.exports||[]).length||!(e.imports||[]).length).map(e=>e.short);
  const острова=DK_REALMS.filter(e=>e.остров).length;
  const области=DK_REALMS.map((e,i)=>regionAt(e.cap.x,e.cap.y)===REGIONS[20+i]);
  const боги=DK_REALMS.map((e,i)=>LESSER_GODS.some(g=>g.область===20+i));
  const дары=DK_REALMS.filter(e=>!DK_GIFTS[e.short]).map(e=>e.short);
  const голоса=EMPIRE_VOICE.length>=EMPIRES.length&&EMPIRE_VOICE.every(r=>Bank.has(r));
  return {пусто,острова,области:области.filter(Boolean).length,боги:боги.filter(Boolean).length,дары,голоса,регионов:REGIONS.length};});
 check('2. 24 державы Круга (16 суши, 8 островов) с досье; своя область, младший бог, дар земли и голос',
  !д.пусто.length&&д.острова===8&&д.области===24&&д.боги===24&&!д.дары.length&&д.голоса&&д.регионов===44,д);

 /* ── 3 ── */
 const р=await page.evaluate(()=>{
  const новые=RACES_DB.filter(r=>/^dk_/.test(r.id));
  const пусто=новые.filter(r=>["n","hist","econ","pol","war","myth","tr"].some(k=>!r[k])||!GOD_BY_ID[r.god]||!CLANS.includes(r.clan)||(r.br||[]).length<2).map(r=>r.n);
  const голоса=новые.filter(r=>{const v=VOICE_RACES[r.n];return !(v&&(v[3]===1||v[3]===2));}).map(r=>r.n);
  const готовы=новые.filter(r=>VOICE_RACES[r.n][3]===1).map(r=>VOICE_RACES[r.n][0]);
  const ждут=новые.filter(r=>VOICE_RACES[r.n][3]===2);
  const жд=ждут[0];let молчит=true;if(жд){const n={race:жд.n,key:"t1",пол:VOICE_RACES[жд.n][2]};молчит=Folk.народ(n,{всегда:true})===false;}
  const второй=готовы.filter(v=>VOICE_RACE_ALT[v]);
  const народыГолос=новые.flatMap(r=>r.br||[]).filter(n=>!VOICE_RACES[n]);
  return {n:новые.length,пусто,голоса,народыГолос,файлы:готовы,второй,ждут:ждут.length,молчит};});
 const нетФайлов=р.файлы.map(v=>`sounds/voice/race_${v}_g.mp3`).concat(р.второй.map(v=>`sounds/voice/race_${v}_x_g.mp3`)).filter(f=>!fs.existsSync(path.join(ROOT,f)));
 const плохие=р.файлы.map(v=>path.join(ROOT,`sounds/voice/race_${v}_g.mp3`)).filter(f=>fs.existsSync(f)).filter(f=>{
  const j=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=bit_rate,sample_rate','-of','json',f]).toString()).streams[0];
  return +j.bit_rate<320000||+j.sample_rate!==44100;});
 check(`3. 25 новых рас с полным досье и двумя народами; записанные оклики Gemini на месте (MP3 320 кбит/с), ждущие записи молчат; записано ${р.файлы.length}, ждут ${р.ждут}`,
  р.n===25&&!р.пусто.length&&!р.голоса.length&&!р.народыГолос.length&&!нетФайлов.length&&!плохие.length&&р.файлы.length>=10&&р.молчит,{р,нетФайлов,плохие});

 /* ── 4 ── */
 const з=await page.evaluate(()=>{
  const r={застав:SEAM_GATES.length};const g=SEAM_GATES[0];
  r.узел=(portalNodeAt(g.x,g.y)||{}).kind;r.все=SEAM_GATES.every(z=>inCore(z.x,z.y)&&z.к.length===3);
  G.x=g.x;G.y=g.y;G.place=null;G.gold=1000;G.portals=[];const д0=G.day;
  const e=g.к[0];r.тропа=portalFare(portalNodeAt(g.x,g.y),portalNodeAt(e.cap.x,e.cap.y));
  r.открыты=ДальнийКруг.открытыеУзлы(portalNodeAt(g.x,g.y)).length;
  r.пошли=portalTravel(e.cap.x+","+e.cap.y);r.где=empireAt(G.x,G.y).short;r.держава=e.short;r.золото=G.gold;r.дни=G.day-д0;
  return r;});
 check('4. восемь шовных застав — открытые узлы сети; шовная тропа к престолу Круга за 60 золотых и 36 часов',
  з.застав===8&&з.узел==="seam"&&з.все&&з.тропа.open&&з.тропа.gold===60&&з.тропа.hours===36&&з.открыты===11&&з.пошли&&з.где===з.держава&&з.золото===940&&з.дни>=1,з);

 /* ── 5 ── */
 const ш=await page.evaluate(()=>{
  const r={};G.dkCharted={};G.xp=0;
  const g=SEAM_GATES[3];G.x=g.x;G.y=g.y;ДальнийКруг._в=undefined;ДальнийКруг.шаг();
  SAID.length=0;G.x=g.x+2;const t1=ДальнийКруг.шаг();r.шов=/шов Завесы/.test(t1);r.карта=Object.keys(G.dkCharted).length;
  G.dkCharted={};const e=[...DK_REALMS];let зв="";for(const x of e.slice(0,4)){G.x=x.cap.x;G.y=x.cap.y;зв=ДальнийКруг.шаг()||зв;}
  r.звание=/Шагнувший за шов/.test(зв);r.xp=G.xp;r.всего=Object.keys(G.dkCharted).length;
  G.x=CORE_O+100;G.y=CORE_O+100;r.назад=/Средоточие/.test(ДальнийКруг.шаг());
  r.текст=ДальнийКруг.text();return r;});
 check('5. переход шва объявляется; держава ложится на карту Круга; четыре — звание «Шагнувший за шов»; обратно — в Средоточие',
  ш.шов&&ш.карта===1&&ш.звание&&ш.xp>0&&ш.всего>=4&&ш.назад&&/24 держав/.test(ш.текст),ш);

 /* ── 6 ── */
 const т=await page.evaluate(()=>{
  const r={пород:DK_BEASTS.length,безРода:DK_BEASTS.filter(v=>!MONSTERS.find(m=>m.id===v.база)).map(v=>v.id),
   безЗемли:DK_BEASTS.filter(v=>(v.где||[]).some(s=>!DK_REALMS.find(e=>e.short===s))).map(v=>v.id)};
  const e=DK_REALMS.find(x=>x.short==="Белые Озёра");const волк=MONSTERS.find(m=>m.id==="wolf");
  const п=dkBeastFor(волк,e,e.cap.x+5,e.cap.y+5);r.порода=п&&п.id;
  r.вЯдре=dkBeastFor(волк,CORE_EMPIRES[0],CORE_O+10,CORE_O+10);
  let найдена=null;for(let i=0;i<30000&&!найдена;i++){const x=e.cap.x+3000+(i%173)*11,y=e.cap.y-4000+Math.floor(i/173)*13;const c=cellContent(x,y);if(c&&c.monster&&c.monster.порода)найдена=c.monster;}
  r.встреча=найдена&&{n:найдена.n,род:найдена.род,lvl:найдена.lvl,id:найдена.id};
  if(найдена){SAID.length=0;G.dkSeen={};G.inCombat=false;const c={x:G.x,y:G.y,monster:Object.assign({},найдена)};
   safeFn(()=>startCombat(c));r.слово=SAID.some(t=>t.includes("из Дальнего Круга"));safeFn(()=>{G.inCombat=false;G.combat=null;while(activeLayer())closeTopUI();});}
  return r;});
 check('6. 37 пород тварей Круга на родовых голосах; порода — со своим именем и силой; в первом бою — слово о ней',
  т.пород===37&&!т.безРода.length&&!т.безЗемли.length&&/^dk_/.test(т.порода||"")&&т.вЯдре===null&&т.встреча&&т.встреча.n!==т.встреча.род&&т.слово,т);

 /* ── 7 ── */
 const п=await page.evaluate(()=>{
  const e=DK_REALMS[5];const роды=new Set();for(let i=0;i<200;i++){const k=dungeonKindAt(e.cap.x+i*37,e.cap.y+i*53,"ruins");if(k)роды.add(k.id);}
  const вЯдре=new Set();for(let i=0;i<200;i++){const k=dungeonKindAt(CORE_O+1000+i*37,CORE_O+1000+i*53,"ruins");if(k)вЯдре.add(k.id);}
  return {новых:DK_DUNGEON_KINDS.length,заШвом:[...роды].filter(id=>/^dk_/.test(id)).length,вЯдреНовых:[...вЯдре].filter(id=>/^dk_/.test(id)).length,
   поля:DK_DUNGEON_KINDS.every(k=>k.n&&k.о&&k.примета&&k.голоса.every(([r])=>Bank.has(r))&&k.твари.every(t=>MONSTERS.find(m=>m.id===t))&&DUNGEON_KIND_BY_ID[k.id])};});
 check('7. восемь родов подземелий Круга: за швом встречаются, в Средоточии — нет; голоса, твари и приметы на месте',
  п.новых===8&&п.заШвом>=6&&п.вЯдреНовых===0&&п.поля,п);

 /* ── 8 ── */
 const о=await page.evaluate(()=>{
  const r={даров:Object.keys(DK_GIFTS).length,цены:DK_GIFT_NAMES.every(n=>RES_BASE[n]>0),род:DK_GIFT_NAMES.every(n=>RES_KIND_BY_RES[n]&&RES_KIND_BY_RES[n].id==="dkgift")};
  const e=DK_REALMS.find(x=>x.short==="Тёплые Рифы");const дар=DK_GIFTS[e.short].n;G.inv[дар]=0;G.depleted={};
  let собрано=0;for(let i=0;i<4000&&собрано<60;i++){const x=e.cap.x+500+(i%97)*7,y=e.cap.y+300+Math.floor(i/97)*5;const c=cellContent(x,y);
   if(c&&c.res&&!c.structure&&empireAt(x,y)===e){G.x=x;G.y=y;G.place=null;G.inCombat=false;G.ship=null;if(gatherCurrent("tap"))собрано++;}}
  r.собрано=собрано;r.даров=Number(G.inv[дар])||0;r.дар=дар;return r;});
 check('8. 24 дара земли с ценой и своим родом ресурса; при сборе на земле державы дар ложится в котомку',
  о.цены&&о.род&&о.собрано>=20&&о.даров>=1,о);

 /* ── 9 ── */
 const м=await page.evaluate(()=>{
  let берег=0,всего=0;for(let i=0;i<300;i++){const a=hashName(i,5,2)*Math.PI/2,r=WORLD*(0.93+hashName(i,6,2)*0.4);const x=Math.floor(Math.cos(a)*r),y=Math.floor(Math.sin(a)*r);if(x>=WORLD||y>=WORLD)continue;const b=biomeAt(x,y);всего++;if(b.база==="coast")берег++;}
  let суша=0;for(let i=0;i<300;i++){const x=CORE_O+Math.floor(hashName(i,7,2)*OLD_WORLD),y=CORE_O+Math.floor(hashName(i,8,2)*OLD_WORLD);if(biomeAt(x,y).база!=="coast")суша++;}
  return {доля:берег/всего,сушаЯдра:суша/300};});
 check('9. Внешнее море: у края мира больше трёх четвертей — берег, рифы и архипелаги; в Средоточии суша как прежде',
  м.доля>0.75&&м.сушаЯдра>0.5,м);

 /* ── 10 ── */
 const с=await page.evaluate(()=>{
  const r={};const было={x:G.x,y:G.y};
  G.x=1234;G.y=4321;G.dark=false;safeFn(()=>GameIntegrity.repair());r.сдвиг=[G.x,G.y];
  r.престолы=EMPIRES.slice(0,12).map(e=>e.cap.x+","+e.cap.y).slice(0,2);
  const вл=new Set();for(let i=0;i<40;i++)вл.add(darkRealmAt(CORE_O+i*997,CORE_O+i*1511).god.id);r.владений=вл.size;
  G.x=было.x;G.y=было.y;return r;});
 check('10. прежний мир не сдвинулся: координаты из сохранения и престолы на месте; за разными разломами — разные тёмные владения',
  с.сдвиг[0]===1234&&с.сдвиг[1]===4321&&с.престолы[0]==="12500,12500"&&с.владений>=4,с);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

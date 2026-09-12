/* ════════════════════════════════════════════════════════════════════════
   ЛЕСТНИЦЫ, ПОЛ ПОД НОГОЙ И ЛИЦО КАЖДОГО МЕСТА

   Три беды, из-за которых мир не ощущался местом, и три исправления.

   ЛЕСТНИЦЫ БЫЛИ НЕНАСТОЯЩИМИ. Марш считал ступени, а внизу игрока переносило
   на «вход яруса» — клетку, никак не связанную с той лестницей, по которой он
   шёл. Спустился и тут же поднялся — оказался в другом конце уровня. Теперь
   между ярусами есть шахта: одна и та же клетка на обоих, спуск отвесен,
   подъём возвращает ровно туда, откуда ушли.

   ПОЛ ПОВТОРЯЛСЯ. Весь верхний ярус — щебень, вся середина — кости, из
   построек шесть видов на двенадцать. Три разных подвала звучали одинаково.
   Теперь у каждого яруса и вида построек своя смесь, а какая клетка какая —
   решают её координаты: место узнаётся по полу, и два соседних подвала не
   спутать.

   ПОСТРОЙКИ ОДНОГО ВИДА БЫЛИ НЕРАЗЛИЧИМЫ. Всякая таверна — стол, очаг и
   бочки; всякая башня — шар и круг. Теперь у каждой свой промысел, выведенный
   из координат: он в названии, в обстановке, на прилавке и в голосе при входе.
   А державы учат разным чарам по разной цене — чтобы выучить всё, мир надо
   объехать.
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

 /* ── 1. Шахта отвесна ── */
 const шахта=await page.evaluate(()=>{
  const беды=[];let пар=0,совпало=0;
  for(let bx=0;bx<8;bx++)for(let by=0;by<8;by++)for(let d=0;d<4;d++){
   const верх=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   const низ=safeFn(()=>genLevel(bx,by,d+1,"ruins"),null);
   if(!верх||!низ)continue;
   const ш=shaftSpot(bx,by,d);пар++;
   const тВ=верх.g[ш.y]&&верх.g[ш.y][ш.x],тН=низ.g[ш.y]&&низ.g[ш.y][ш.x];
   if(тВ===">"&&тН==="<")совпало++;
   else if(беды.length<4)беды.push(`${bx},${by},${d}: сверху «${тВ}», снизу «${тН}»`);}
  /* Ни один ярус не остаётся без спуска: это был бы тупик. */
  const безСпуска=[];
  for(let bx=0;bx<6;bx++)for(let by=0;by<6;by++)for(let d=0;d<MAX_DEPTH;d++){
   const l=safeFn(()=>genLevel(bx,by,d,"ruins"),null);if(!l)continue;
   let есть=false;
   for(let y=0;y<l.h&&!есть;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===">"){есть=true;break;}
   if(!есть)безСпуска.push(`${bx},${by},${d}`);}
  return {пар,совпало,беды,безСпуска};});
 check('шахта совпадает на соседних ярусах: спуск ведёт ровно вниз',
  шахта.пар>0&&шахта.совпало===шахта.пар,{пар:шахта.пар,совпало:шахта.совпало,беды:шахта.беды});
 check('ни один ярус не остаётся без спуска',
  шахта.безСпуска.length===0,шахта.безСпуска.slice(0,5));

 /* ── 2. Спуск и подъём возвращают на ту же клетку ── */
 const марш=await page.evaluate(()=>{
  G.place={bx:5,by:5,stype:"ruins",depth:1,name:"Руины",x:1,y:1};
  const lvl=curLevel();
  let вниз=null;
  for(let y=0;y<lvl.h&&!вниз;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]===">"){вниз={x,y};break;}
  if(!вниз)return {нет:true};
  G.place.x=вниз.x;G.place.y=вниз.y;G.place.arm=null;G.inCombat=false;G.hp=G.hpMax=9000;
  const старт={x:G.place.x,y:G.place.y,d:G.place.depth};
  window.__said=[];safeFn(()=>useHere());
  const объявление=речь();
  const мартТам=!!G.flight;
  /* Марш проходится ШАГАМИ: один шаг — одна ступень, игра не спускает сама. */
  let ш=0;const глубиныПоПути=[];
  while(G.flight&&ш<80){глубиныПоПути.push(G.place.depth);safeFn(()=>moveInside(G.flight.md));ш++;}
  const после={x:G.place.x,y:G.place.y,d:G.place.depth,
   плитка:safeFn(()=>tileAt(curLevel(),G.place.x,G.place.y),null)};
  /* Пока идёт марш, глубина не менялась: спуск случается в конце, а не сразу. */
  const неПрыгнул=глубиныПоПути.every(d=>d===старт.d);
  G.place.arm=null;window.__said=[];safeFn(()=>useHere());
  let ш2=0;while(G.flight&&ш2<80){safeFn(()=>moveInside(G.flight.md));ш2++;}
  const назад={x:G.place.x,y:G.place.y,d:G.place.depth,
   плитка:safeFn(()=>tileAt(curLevel(),G.place.x,G.place.y),null)};
  return {старт,после,назад,ступеней:ш,ступенейНазад:ш2,мартТам,неПрыгнул,
   объявление:объявление.slice(0,140)};});
 check('лестница требует шагов: игра не спускает сама',
  марш.мартТам===true&&марш.ступеней>=5&&марш.неПрыгнул===true,
  {марш:марш.мартТам,ступеней:марш.ступеней,неПрыгнул:марш.неПрыгнул});
 check('спуск выводит ровно под ту клетку, с которой начался',
  марш.после.x===марш.старт.x&&марш.после.y===марш.старт.y&&
  марш.после.d===марш.старт.d+1&&марш.после.плитка==="<",{старт:марш.старт,после:марш.после});
 check('подъём возвращает на ту же клетку, откуда спускались',
  марш.назад.x===марш.старт.x&&марш.назад.y===марш.старт.y&&
  марш.назад.d===марш.старт.d&&марш.назад.плитка===">",{старт:марш.старт,назад:марш.назад});
 check('объявление марша говорит, что шахта отвесна',
  /отвесно|ровно под/i.test(марш.объявление||''),марш.объявление);

 /* ── 3. Марш слышен по высоте ── */
 const высота=await page.evaluate(()=>{
  settings.effects=1;settings.hrtf=1;
  const поймано=[];const ор=Spatial.node.bind(Spatial);
  Spatial.node=(dx,dy,dz,roll)=>{поймано.push(Number(dz)||0);return ор(dx,dy,dz,roll);};
  G.place={bx:5,by:5,stype:"ruins",depth:1,name:"Руины",x:1,y:1};
  const lvl=curLevel();let вниз=null;
  for(let y=0;y<lvl.h&&!вниз;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]===">"){вниз={x,y};break;}
  G.place.x=вниз.x;G.place.y=вниз.y;G.place.arm=null;
  safeFn(()=>useHere());
  const начало=[],конец=[];let i=0;
  while(G.flight&&i<80){
   поймано.length=0;const доля=G.flight.i/G.flight.n;
   safeFn(()=>moveInside(G.flight.md));
   (доля<0.25?начало:доля>0.75?конец:[]).push(...поймано);
   i++;}
  Spatial.node=ор;settings.effects=0;
  return {вверхВНачале:начало.filter(z=>z>0.5).length,внизВНачале:начало.filter(z=>z<-1.5).length,
   вверхВКонце:конец.filter(z=>z>1.5).length,внизВКонце:конец.filter(z=>z<-0.5).length,
   всего:начало.length+конец.length};});
 check('на марше слышно и то, что покинули, и то, к чему идут',
  высота.всего>0&&высота.вверхВНачале>0&&высота.внизВНачале>0,высота);
 check('к концу спуска покинутый ярус уходит выше, а будущий приближается',
  высота.вверхВКонце>0&&высота.внизВКонце>0,высота);

 /* ── 4. Пол под ногой ── */
 const пол=await page.evaluate(()=>{
  const набор=(stype,depth,bx=600,by=600)=>{
   G.place={kind:depth?"dungeon":(PLACE_KIND[stype]||"house"),bx,by,stype,name:"м",depth,x:1,y:1};
   const s=new Set();
   for(let x=1;x<18;x++)for(let y=1;y<12;y++){G.place.x=x;G.place.y=y;s.add(indoorSurface());}
   return [...s].sort();};
  const виды=["temple","forge","market","tavern","port","castle","tower","school"];
  const наборы={};виды.forEach(v=>наборы[v]=набор(v,0));
  const глубины={};[1,2,3,4,5].forEach(d=>глубины[d]=набор("ruins",d));
  /* Все поверхности, что встречаются, обязаны иметь имя и звук. */
  const все=new Set();
  Object.values(наборы).forEach(a=>a.forEach(x=>все.add(x)));
  Object.values(глубины).forEach(a=>a.forEach(x=>все.add(x)));
  const безИмени=[...все].filter(k=>!SURF_NAME[k]);
  const безЗвука=[...все].filter(k=>!SURF_ROLE[k]&&!SURF_FALLBACK[k]);
  /* Два разных подвала одной глубины раскладывают смесь по-своему. */
  const ряд=(bx,by)=>{G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:1,y:1};
   const r=[];for(let x=1;x<16;x++){G.place.x=x;G.place.y=5;r.push(indoorSurface());}return r.join(",");};
  const а=ряд(1,1),б=ряд(9,2),в=ряд(4,7);
  G.place=null;
  return {наборы,глубины,безИмени,безЗвука,всего:все.size,
   разныеПодвалы:new Set([а,б,в]).size,
   различимы:new Set(виды.map(v=>наборы[v].join())).size};});
 check('поверхностей стало много, и у каждой есть имя и звук',
  пол.всего>=12&&пол.безИмени.length===0&&пол.безЗвука.length===0,
  {всего:пол.всего,безИмени:пол.безИмени,безЗвука:пол.безЗвука});
 check('внутри одного места пол не однообразен',
  Object.values(пол.наборы).every(a=>a.length>=2),пол.наборы);
 check('восемь видов построек различаются полом',
  пол.различимы===8,{различимо:пол.различимы});
 check('глубина слышна по полу, и ярусы не повторяют друг друга',
  пол.глубины[1].includes("gravel")&&пол.глубины[5].includes("crystal")&&
  !пол.глубины[1].includes("crystal")&&
  new Set([1,2,3,4,5].map(d=>пол.глубины[d].join())).size===5,пол.глубины);
 check('три разных подвала одной глубины звучат по-разному',
  пол.разныеПодвалы===3,{разных:пол.разныеПодвалы});

 /* ── 5. Лицо каждого места ── */
 const промысел=await page.evaluate(()=>{
  const беды=[];let всего=0;
  for(const [st,список] of Object.entries(PLACE_TRAITS)){
   всего+=список.length;
   const имена=new Set();
   for(const t of список){
    имена.add(t.n);
    if(!t.n||!t.слово||t.слово.length<25)беды.push(`${st}/${t.id}: нет слова`);
    if(t.звук&&!SOUND_BANK[t.звук])беды.push(`${st}/${t.id}: нет звука «${t.звук}»`);
    (t.вещи||[]).forEach(v=>{if(!PROP_BY_ID[v])беды.push(`${st}/${t.id}: нет вещи «${v}»`);});
    (t.товар||[]).forEach(r=>{if(!RESICON[r])беды.push(`${st}/${t.id}: нет товара «${r}»`);});}
   if(имена.size!==список.length)беды.push(`${st}: повторяющиеся имена промыслов`);}
  /* Соседние постройки одного вида различаются. */
  const найти=(вид,n)=>{const r=[];
   for(let d=1;d<300&&r.length<n;d++)for(let dy=-d;dy<=d&&r.length<n;dy++)for(let dx=-d;dx<=d;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;
    const c=cellContent(1000+dx,1000+dy);
    if(c.structure&&c.structure.type===вид){r.push({x:1000+dx,y:1000+dy});break;}}
   return r;};
  const разнообразие={};
  for(const вид of ["village","tavern","forge","tower","temple","castle"]){
   const места=найти(вид,8);
   if(места.length<3)continue;
   const имена=места.map(m=>{const t=placeTrait(m.x,m.y,вид);return t?t.n:"—";});
   разнообразие[вид]={мест:места.length,разных:new Set(имена).size,имена:имена.slice(0,5)};}
  /* Промысел неизменен: одна и та же постройка всегда с тем же промыслом. */
  const м=найти("village",1)[0];
  const постоянен=м?placeTrait(м.x,м.y,"village").id===placeTrait(м.x,м.y,"village").id:true;
  /* Промысел слышен в названии и виден в обстановке. */
  let вНазвании=false,вОбстановке=false;
  if(м){
   G.place={bx:м.x,by:м.y,stype:"village",depth:0,name:"Деревня Проба",x:2,y:2,kind:"city"};
   const t=hereTrait();
   вНазвании=!!t&&placeTitle().includes(t.n);
   const выпало=new Set();
   for(let x=1;x<20;x++)for(let y=1;y<14;y++){G.place.x=x;G.place.y=y;
    const pr=safeFn(()=>propAt(x,y),null);if(pr)выпало.add(pr.id);}
   вОбстановке=(t.вещи||[]).every(v=>выпало.has(v));
   G.place=null;}
  return {всего,видов:Object.keys(PLACE_TRAITS).length,беды,разнообразие,постоянен,
   вНазвании,вОбстановке};});
 check('у построек появился промысел, и он полон: слово, звук, вещи, товар',
  промысел.всего>=50&&промысел.видов>=12&&промысел.беды.length===0,
  {всего:промысел.всего,видов:промысел.видов,беды:промысел.беды.slice(0,5)});
 check('соседние постройки одного вида различаются промыслом',
  Object.values(промысел.разнообразие).every(v=>v.разных>=3),промысел.разнообразие);
 check('промысел неизменен и слышен в названии места',
  промысел.постоянен===true&&промысел.вНазвании===true,промысел);
 check('промысел меняет обстановку внутри, а не только слова',
  промысел.вОбстановке===true,промысел);

 /* ── 6. Державы учат разному ── */
 const учение=await page.evaluate(()=>{
  const наборы=[],цены=[];
  const всё=new Set();
  EMPIRES.forEach(e=>{G.x=e.cap.x;G.y=e.cap.y;
   const t=teachHere();
   наборы.push(t.чему.slice().sort().join('|'));
   t.чему.forEach(c=>всё.add(c));
   const sp=SPELLS.find(s=>t.чему.includes(s.n));
   if(sp)цены.push(spellPriceHere(sp));});
  const нет=[...всё].filter(c=>!SPELLS.some(s=>s.n===c));
  /* Чужому не учат, своему учат. */
  G.x=EMPIRES[0].cap.x;G.y=EMPIRES[0].cap.y;G.gold=99999;G.spells=[];G.place=null;
  window.__said=[];
  const чужое=SPELLS.findIndex(s=>!teachHere().чему.includes(s.n));
  safeFn(()=>learnSpell(чужое));
  const отказ={выучил:G.spells.length>0,сказано:речь()};
  window.__said=[];
  const своё=SPELLS.findIndex(s=>teachHere().чему.includes(s.n));
  safeFn(()=>learnSpell(своё));
  const успех={выучил:G.spells.length===1,сказано:речь()};
  G.spells=["Искра"];
  return {держав:наборы.length,разных:new Set(наборы).size,покрыто:всё.size,нет,
   ценыРазные:new Set(цены).size>1,отказ,успех};});
 check('каждая держава учит своему набору чар',
  учение.держав===8&&учение.разных===8&&учение.нет.length===0,учение);
 check('вместе державы покрывают все заклинания: мир надо объехать',
  учение.покрыто>=12,{покрыто:учение.покрыто});
 check('цена обучения зависит от державы и отношения к вам',
  учение.ценыРазные===true,учение);
 check('чему здесь не учат — того не выучить, и это объясняется',
  учение.отказ.выучил===false&&/не преподают|учат/i.test(учение.отказ.сказано),учение.отказ);
 check('чему учат — тому учат за деньги этой державы',
  учение.успех.выучил===true&&/Изучено/i.test(учение.успех.сказано),учение.успех);

 /* ── 7. У каждой державы свои поручения ── */
 const наряды=await page.evaluate(()=>{
  const списки=[],награды=[],беды=[];
  EMPIRES.forEach((e,i)=>{
   const n={x:e.cap.x,y:e.cap.y,key:"emp"+i,name:"Имярек",prof:"Правитель",tier:2,race:e.race};
   const q=safeFn(()=>empireQuestFor(n),null);
   if(!q){беды.push(e.short+": поручения нет");return;}
   списки.push(q.наряд);награды.push(q.reward.gold);
   if(!q.text.includes(e.short))беды.push(e.short+": держава не названа в поручении");
   if(!q.дар||!q.дар.res||!(q.дар.n>0))беды.push(e.short+": нечем платить, кроме золота");
   if(!["fetch","kill","hunt","visit"].includes(q.type))беды.push(e.short+": непонятный тип "+q.type);
   if(q.type==="hunt"&&!MONSTERS.some(m=>m.id===q.monsterId))беды.push(e.short+": зверя такого нет");
   if(q.type==="fetch"&&!LAND_RES.includes(q.res))беды.push(e.short+": такого ресурса нет");});
  /* Все восемь наборов должны быть на месте: у каждой державы своя роспись. */
  const наборы=EMPIRE_QUESTS.map(н=>{
   (н.дела||[]).forEach(д=>{
    if(д.тип==="hunt"&&!MONSTERS.some(m=>m.id===д.зверь))беды.push(н.звание+": зверь "+д.зверь);
    if(д.тип==="fetch"&&!LAND_RES.includes(д.res))беды.push(н.звание+": товар "+д.res);
    if(!д.слово||д.слово.length<40)беды.push(н.звание+": повод не рассказан");});
   if(!LAND_RES.includes(н.дар.res))беды.push(н.звание+": платят несуществующим");
   return н.звание;});
  /* Поручение доходит до жителя обычным путём, а не только напрямую. */
  let через=0,всего=0;
  for(let i=0;i<200;i++){
   const n={x:400+i*7,y:520+i*11,key:"q"+i,name:"Имярек",prof:"Правитель",tier:2,race:"Люди"};
   const q=safeFn(()=>questFor(n),null);всего++;if(q&&q.наряд)через++;}
  /* И платят за него товаром державы, а не одним золотом. */
  G.quests=[];G.inv={};G.gold=0;G.xp=0;
  const n={x:EMPIRES[0].cap.x,y:EMPIRES[0].cap.y,key:"pay",name:"Имярек",prof:"Правитель",tier:2,race:"Дракониды"};
  const q=empireQuestFor(n);
  if(q.type==="fetch")G.inv[q.res]=q.need;
  else if(q.type==="visit")q.doneFlag=true;
  else q.have=q.need;
  q.done=false;G.quests.push(q);
  window.__said=[];
  safeFn(()=>completeQuest(q.id));
  const плата={сказано:речь(),товар:q.дар?(Number(G.inv[q.дар.res])||0):0,надо:q.дар?q.дар.n:0,золото:G.gold};
  G.quests=[];G.inv={};
  return {держав:списки.length,разных:new Set(списки).size,наборов:new Set(наборы).size,
   наградыРазные:new Set(награды).size>1,беды,через,всего,плата};});
 check('у каждой из восьми держав своё поручение со своим поводом',
  наряды.держав===8&&наряды.разных===8&&наряды.наборов===8&&наряды.беды.length===0,
  {держав:наряды.держав,разных:наряды.разных,беды:наряды.беды.slice(0,5)});
 check('державное поручение доходит до игрока обычным путём',
  наряды.через>0&&наряды.через<наряды.всего,{поручений:наряды.через,всего:наряды.всего});
 check('за державное поручение платят и золотом, и своим товаром',
  наряды.плата.товар===наряды.плата.надо&&наряды.плата.золото>0&&/Сверх того выдано/.test(наряды.плата.сказано),
  наряды.плата);
 check('плата за поручение зависит от державы',наряды.наградыРазные===true,наряды);

 /* ── 8. Лицо подземелья идёт вниз вместе с игроком ── */
 const глубь=await page.evaluate(()=>{
  const беды=[];let подземных=0;
  for(const st of ["ruins","cave_entrance"])
   for(const t of PLACE_TRAITS[st]){подземных++;
    if(!t.твари||!t.твари.length)беды.push(st+"/"+t.id+": некому жить");
    (t.твари||[]).forEach(id=>{if(!MONSTERS.some(m=>m.id===id))беды.push(st+"/"+t.id+": нет твари "+id);});
    if(!t.низ||t.низ.length<30)беды.push(st+"/"+t.id+": глубина не описана");}
  /* Обстановка промысла попадается и под землёй, и живут там свои твари. */
  const родня={},вещиНесут=[];
  for(let i=0;i<8;i++){
   G.place=null;
   enterPlace({x:1200+i*61,y:800+i*47,structure:{type:"ruins",name:"Руины",beacon:"ruins"}});
   G.place.depth=2;
   const т=safeFn(()=>hereTrait(),null);
   if(!т)continue;
   const базовый=MONSTERS.filter(m=>m.biomes.includes("cave"));
   const pool=safeFn(()=>dungeonPool(базовый),базовый);
   const доля=pool.filter(m=>(т.твари||[]).indexOf(m.id)>=0).length/pool.length;
   родня[т.n]=+доля.toFixed(2);
   const вещи=new Set();
   for(let x=1;x<18;x++)for(let y=1;y<12;y++){G.place.x=x;G.place.y=y;
    const pr=safeFn(()=>propAt(x,y),null);if(pr)вещи.add(pr.id);}
   вещиНесут.push((т.вещи||[]).every(v=>вещи.has(v)));
   while(activeLayer())closeTopUI();G.place=null;}
  /* Спуск объявляет, куда именно спустились. */
  G.place=null;
  enterPlace({x:1500,y:900,structure:{type:"cave_entrance",name:"Пещера",beacon:"cave_entrance"}});
  window.__said=[];
  safeFn(()=>changeDepth(1));
  const т=safeFn(()=>hereTrait(),null);
  const сказано=речь();
  while(activeLayer())closeTopUI();G.place=null;
  return {подземных,беды,родня,вещиНесут,
   промыселГлубины:!!(т&&т.низ),назвался:!!(т&&сказано.includes(т.n))};});
 check('у каждого подземелья есть, кто в нём живёт и как выглядит его глубина',
  глубь.подземных===8&&глубь.беды.length===0,{подземных:глубь.подземных,беды:глубь.беды.slice(0,5)});
 check('свои твари водятся чаще прочих, но чужие не исчезают',
  Object.values(глубь.родня).length>0&&
  Object.values(глубь.родня).every(д=>д>0.15&&д<0.8),глубь.родня);
 check('обстановка промысла попадается и под землёй',
  глубь.вещиНесут.length>0&&глубь.вещиНесут.every(Boolean),
  {мест:глубь.вещиНесут.length,несут:глубь.вещиНесут.filter(Boolean).length});
 check('спуск говорит, куда именно спустились',
  глубь.промыселГлубины===true&&глубь.назвался===true,глубь);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

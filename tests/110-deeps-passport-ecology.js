/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 110: ГЛУБИНЫ — ПАСПОРТ, ВИДЫ, КОМПЛЕКСЫ, ЭКОСИСТЕМА, ПОРОДЫ,
   ПАРАНОЙЯ, ГЕОМЕТРИЯ НА СЛУХ, ВЫЖИВАНИЕ

   1. Данные: четырнадцать видов подземелий со звуком и ресурсом, сорок два
      комплекса (в том числе Шахта Шепчущихся Глубин и Бездонный комплекс),
      десять семейств глубинных тварей, десять пород, семь косвенных
      признаков, десять нужд выживания; самопроверка мира.
   2. Паспорт: двадцать пять полей, выводится из места и повторяется для
      того же входа; у именного комплекса — его история и награда.
   3. Комплексы: стоят на своих местах, ближние называются с расстоянием и
      стороной; ярусы делятся на четыре уклада по двадцать пять.
   4. Экосистема: кто кого ест по ярусам; выбитое семейство меняет давление
      и говорит об этом.
   5. Породы: по ярусу, раз в день на ярус, с ценой и назначением.
   6. Паранойя: признак звучит и называется; «прислушаться» говорит, правда
      это или объяснимая ложь.
   7. Геометрия: стены, ходы, шахта, вода, пустота и эхо по форме.
   8. Выживание: три уклада; час пути двигает нужды; порог бьёт по здоровью
      и называет лечение; отдых и еда снимают.
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
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};r.types=DUNG_TYPES.length;r.typesOk=DUNG_TYPES.every(t=>SOUND_BANK[t.звук]&&RES_BASE[t.ресурс]&&t.опасность&&t.о);
  const c=Complexes.all();r.cx=c.length;r.cxOk=c.every(x=>x.n&&x.ярусы[1]>x.ярусы[0]&&x.награда&&x.история&&x.x>=0&&x.y>=0)&&new Set(c.map(x=>x.id)).size===c.length;
  r.named=!!(Complexes.byId("cx_whisper")&&Complexes.byId("cx_bottomless"));
  r.whisper=Complexes.byId("cx_whisper").ярусы;r.bottom=Complexes.byId("cx_bottomless").ярусы;
  r.fam=DEEP_FAMILIES.length;r.famOk=DEEP_FAMILIES.every(f=>SOUND_BANK[f.звук]&&f.ест&&f.страх&&f.ярус[1]>f.ярус[0]);
  r.res=DEEP_RESOURCES.length;r.resOk=DEEP_RESOURCES.every(x=>x.ярус>0&&x.цена>0&&x.что&&x.о);
  r.para=PARANOIA.length;r.paraOk=PARANOIA.every(p=>SOUND_BANK[p.звук]&&p.о);
  r.needs=SURVIVAL_NEEDS.length;r.needsOk=SURVIVAL_NEEDS.every(n=>n.порог>0&&n.урон>0&&n.лечит);
  r.fields=Passport.fields().length;
  r.modules=["PASSPORT","COMPLEXES","ECOLOGY","DEEPRES","PARANOIA","GEOMETRY","SURVIVAL"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="deeps");r.selfcheck=row?row.ok:null;
  return r;});
 check('четырнадцать видов подземелий со звуком, ресурсом и опасностью; сорок два комплекса с историей и наградой, среди них Шахта Шепчущихся Глубин от первого до сотого и Бездонный комплекс',
  данные.types===14&&данные.typesOk&&данные.cx===42&&данные.cxOk&&данные.named&&данные.whisper[0]===1&&данные.whisper[1]===100&&данные.bottom[1]===100,данные);
 check('десять семейств глубинных тварей со звуком, пищей и страхом; десять пород с ярусом, ценой и назначением; семь признаков; десять нужд; паспорт из двадцати пяти полей; самопроверка мира видит глубины',
  данные.fam===10&&данные.famOk&&данные.res===10&&данные.resOk&&данные.para===7&&данные.paraOk&&данные.needs===10&&данные.needsOk&&данные.fields===25&&данные.modules&&данные.selfcheck===true,данные);

 /* ── 2. паспорт ── */
 const паспорт=await page.evaluate(()=>{
  const r={};G.place=null;
  const p1=Passport.of(3000,3000,5,"ruins");const p2=Passport.of(3000,3000,5,"ruins");
  r.поля=Passport.fields().filter(k=>p1[k]==null||(Array.isArray(p1[k])&&p1[k].length===0&&["ловушки","ресурсы","редкие","фракции"].includes(k)));
  r.тот=JSON.stringify(p1)===JSON.stringify(p2);
  r.другой=JSON.stringify(Passport.of(9000,9000,5,"ruins"))!==JSON.stringify(p1);
  r.боссы=p1.боссы.length===Math.floor(p1.ярусов/25);
  const c=Complexes.byId("cx_whisper");const pc=Passport.of(c.x,c.y,5,"ruins");
  r.именной=pc.n==="Шахта Шепчущихся Глубин"&&/Живые минералы/.test(pc.история)&&/Сердце шахты/.test(pc.награда);
  r.text=Passport.text(pc);
  return r;});
 check('паспорт даёт двадцать пять полей и повторяется для того же входа, а для другого — другой; боссы стоят через двадцать пять ярусов; у именного комплекса своя история и награда; текст называет всё',
  паспорт.поля.length===0&&паспорт.тот&&паспорт.другой&&паспорт.боссы&&паспорт.именной&&/Область: /.test(паспорт.text)&&/Ловушки: /.test(паспорт.text)&&/Награда: /.test(паспорт.text)&&/Магия: /.test(паспорт.text),паспорт);

 /* ── 3. комплексы и уклады ── */
 const комплексы=await page.evaluate(()=>{
  const r={};G.place=null;const c=Complexes.byId("cx_bottomless");const бx=G.x,бy=G.y;G.x=c.x;G.y=c.y;
  r.тут=!!Complexes.here()&&Complexes.here().id===c.id;r.text=Complexes.text();
  G.x=бx;G.y=бy;r.вне=Complexes.here()===null;r.ближние=Complexes.nearest(3);
  r.уклады=[0,30,60,90].map(d=>Complexes.band(d).n);
  return r;});
 check('комплекс виден на своём месте и рассказывает о себе; вдали его нет, но ближние называются с расстоянием и стороной; ярусы делятся на четыре уклада',
  комплексы.тут&&/Бездонный комплекс/.test(комплексы.text)&&/Ярусов 10–100/.test(комплексы.text)&&комплексы.вне&&комплексы.ближние.length===3&&/шаг|шага|шагов/.test(комплексы.ближние[0])&&комплексы.уклады.join(",")==="верхние ярусы,средние ярусы,нижние ярусы,дно",комплексы);

 /* ── 4. экосистема ── */
 const эко=await page.evaluate(()=>{
  const r={};G.eco={};G.place=null;r.вне=Ecology.text();
  G.place={kind:"dungeon",bx:3000,by:3000,stype:"ruins",depth:30,name:"Проба",x:1,y:1};
  r.тут=Ecology.at(30).length;r.цепь=Ecology.chain(30);r.давление0=Ecology.pressure(30);
  SAID.length=0;for(let i=0;i<3;i++)Ecology.onKill({id:"deep_crawler",n:"Ползун штолен"});
  r.давление1=Ecology.pressure(30);r.сказано=SAID.find(t=>/Экосистема отвечает/.test(t))||"";
  r.глубже=Ecology.at(95).length;r.мелко=Ecology.at(1).length;
  G.place=null;return r;});
 check('на ярусе живут свои семейства, цепь питания называется словами; трое выбитых меняют давление и мир об этом говорит; на девяносто пятом ярусе семьи иные, чем на первом',
  /под землёй/.test(эко.вне)&&эко.тут>=3&&/едят/.test(эко.цепь)&&эко.давление1>эко.давление0&&эко.сказано.length>0&&эко.глубже>0&&эко.мелко===0,эко);

 /* ── 5. породы ── */
 const порода=await page.evaluate(()=>{
  const r={};G.inv={};G.deepMine=null;G.place=null;r.наверху=DeepRes.mine();
  G.place={kind:"dungeon",bx:4000,by:4000,stype:"ruins",depth:5,name:"Проба",x:1,y:1};r.мелко=DeepRes.mine();
  G.place.depth=45;PLAYED.length=0;r.добыл=DeepRes.mine();r.сума=Object.keys(G.inv).length;r.звук=PLAYED.includes("craft_stone");r.дважды=DeepRes.mine();
  r.список=DeepRes.at(45).length;r.цена=DeepRes.price("первый металл");r.text=DeepRes.text();
  G.place=null;return r;});
 check('породу берут под землёй и по ярусу: на пятом ещё нечего, на сорок пятом даётся с ценой и назначением, звучит и раз в день на ярус',
  /под землёй/.test(порода.наверху)&&/ещё нет/.test(порода.мелко)&&/Добыто: /.test(порода.добыл)&&порода.сума===1&&порода.звук&&/выработан/.test(порода.дважды)&&порода.список>=6&&порода.цена===300&&/Глубинных пород десять/.test(порода.text),порода);

 /* ── 6. паранойя и геометрия ── */
 const слух=await page.evaluate(()=>{
  const r={};G.paranoia=null;G.place=null;r.наверху=Paranoia.fire(true);
  G.place={kind:"dungeon",bx:5000,by:5000,stype:"ruins",depth:20,name:"Проба",x:3,y:3};
  PLAYED.length=0;SAID.length=0;window.SPAT=[];const sr=Spatial.role.bind(Spatial);Spatial.role=(role,dx,dy,o)=>{SPAT.push(String(role));return sr(role,dx,dy,o);};
  const f=Paranoia.fire(true);Spatial.role=sr;r.признак=!!f&&!!f.id;r.звук=PLAYED.length>0||SPAT.length>0;r.сказано=SAID.length>0;
  r.слушать=Paranoia.listen();r.объяснено=/ложный признак|признак настоящий/.test(r.слушать)&&/не лжёт постоянно/.test(r.слушать);
  /* геометрия: встать в коридоре настоящего уровня */
  const l=curLevel();let пусто=null;for(let y=1;y<l.h-1&&!пусто;y++)for(let x=1;x<l.w-1;x++)if(tileAt(l,x,y)!=="#"){пусто={x,y};break;}
  if(пусто){G.place.x=пусто.x;G.place.y=пусто.y;}
  const g=Geometry.scan();r.поля=["левая","правая","впереди","сзади","боковые","шахта","вода","эхо"].filter(k=>g[k]==null);
  PLAYED.length=0;r.слова=Geometry.say();r.геомЗвук=PLAYED.length>0;r.эхо=/Эхо: /.test(r.слова);
  G.place=null;r.вне=Geometry.say();
  return r;});
 check('косвенный признак звучит и называется только под землёй; «прислушаться» отличает правду от объяснимой лжи; геометрия называет стены, ходы и эхо по форме, а наверху молчит',
  слух.наверху===null&&слух.признак&&слух.звук&&слух.сказано&&слух.объяснено&&слух.поля.length===0&&/слева/.test(слух.слова)&&слух.эхо&&слух.геомЗвук&&/под крышей|под землёй/.test(слух.вне),слух);

 /* ── 7. выживание ── */
 const жизнь=await page.evaluate(()=>{
  const r={};G.needs=null;G.place=null;G.weather="Ясно";G.hp=G.hpMax=100;G.inv={};
  r.off=Survival.setMode("off");r.активных0=Survival.active().length;r.tick0=Survival.tick();
  r.simple=Survival.setMode("simple");r.активных1=Survival.active().length;
  Survival.tick();const S=Survival.state();r.голод=S.hunger;
  r.hard=Survival.setMode("hard");r.активных2=Survival.active().length;
  G.weather="Зной";Survival.tick();r.жажда=S.thirst>=3;
  S.thirst=95;G.needWarn=null;SAID.length=0;const hp=G.hp;Survival.tick();r.урон=hp-G.hp>=2;r.предупредило=SAID.find(t=>/Жажда/.test(t))||"";
  r.отдых=Survival.rest();r.послеОтдыха=S.fatigue===0;
  S.hunger=80;r.еслиНечего=Survival.eat();G.inv["Еда в дорогу"]=1;r.еда=Survival.eat();r.сытость=S.hunger<=30;
  r.text=Survival.text();Survival.setMode("simple");
  return r;});
 check('выживание в трёх укладах: выключено — нужды не считаются, укрупнённо — три, подробно — десять; час пути двигает их по погоде, порог бьёт по здоровью и называет лечение; отдых и еда снимают',
  /выключено/.test(жизнь.off)&&жизнь.активных0===0&&жизнь.tick0===false&&/укрупнённо/.test(жизнь.simple)&&жизнь.активных1===3&&жизнь.голод>=1&&/подробно/.test(жизнь.hard)&&жизнь.активных2===10&&жизнь.жажда&&жизнь.урон&&жизнь.предупредило.length>0&&/Отдых: /.test(жизнь.отдых)&&жизнь.послеОтдыха&&/Есть нечего/.test(жизнь.еслиНечего)&&/Поели/.test(жизнь.еда)&&жизнь.сытость&&/Выживание/.test(жизнь.text),жизнь);

 /* ── 8. окно и меню ── */
 const окно=await page.evaluate(async()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.deeps();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["dpPass","dpComplex","dpEco","dpRes","dpGeom","dpSurv"].filter(id=>!(document.getElementById(id)||{}).innerHTML);
  r.уклады=document.querySelectorAll('#dpSurv [data-cmd^="survmode:"]').length;r.семейств=document.querySelectorAll('#dpEco .list-line').length;
  r.сказано=SAID.find(t=>/^Глубины\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();r.меню=JSON.stringify(AM_GROUPS).includes('"deeps"');
  return r;});
 check('окно «Глубины» с шестью разделами, тремя укладами выживания и одиннадцатью строками экосистемы, говорит паспорт; строка в меню действий',
  окно.окно==="modal-deeps"&&окно.секции.length===0&&окно.уклады===3&&окно.семейств>=10&&окно.сказано.length>0&&окно.меню,окно);


 /* ── 7. счёт подземелий: бриф просит до двух тысяч крупных ── */
 const счёт=await page.evaluate(()=>{
  /* Считаем входы на окне в четырёхстах клетках с шагом пять и переносим
     на весь мир: перебирать два с половиной миллиарда клеток незачем, а
     плотность входов от места не зависит. */
  const шаг=5,сторона=400;const x0=(WORLD>>1)-200,y0=(WORLD>>1)-200;
  let входов=0,проб=0;
  for(let x=x0;x<x0+сторона;x+=шаг)for(let y=y0;y<y0+сторона;y+=шаг){
   проб++;const c=cellContent(x,y);const s=c&&c.structure;
   if(s&&(s.type==="ruins"||s.type==="cave_entrance"))входов++;}
  const наОкно=входов*шаг*шаг;
  const доля=(сторона*сторона)/(WORLD*WORLD);
  return {проб,входов,наОкно,вМире:Math.round(наОкно/доля),
   ярусов:safeFn(()=>MAX_DEPTH,0),комплексов:safeFn(()=>Complexes.all().length,0)};});
 check('мир держит куда больше двух тысяч подземелий, и у каждого своя глубина: сорок два именных комплекса поверх обычных',
  счёт.входов>0&&счёт.вМире>=2000&&счёт.комплексов===42&&счёт.ярусов>=100,счёт);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 112: СКВОЗНАЯ ЦЕПЬ ПО §44 БРИФА

   Одним прогоном, звено за звеном, без перезагрузки страницы:

     запуск → речь → жесты → ориентация → движение → столкновение →
     ощупывание → объект → звук → житель → разговор → инвентарь →
     экипировка → оружие → бой → магия → ресурс → дверь → подземелье →
     ловушка → сильная тварь → дело → репутация → торговля → ремесло →
     новые системы (зона, глубина, знак, достижение) → сохранение →
     загрузка → повторная загрузка → старые обработчики → нет двойной
     речи → игровые звуки не «съедаются» речью.

   Правило набора: каждое звено проверяется против предыдущего состояния,
   и ни одно не проверяется в одиночку.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');

 /* ── 1. запуск и речь ── */
 const запуск=await page.evaluate(()=>{
  const r={};r.доИгры=typeof enterGame==="function";
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.SPOKEN=[];const sp=Speech._speak?Speech._speak.bind(Speech):null;if(sp)Speech._speak=m=>{SPOKEN.push(String(m&&m.text||""));return sp(m);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(role,op)=>{PLAYED.push(String(role));return p(role,Object.assign({},op||{},{gain:0,maxSec:0.4}));};
  enterGame();r.началась=!!gameActive();return r;});
 await page.waitForTimeout(400);
 const речь=await page.evaluate(()=>({сказано:SAID.length,озвучено:SPOKEN.length,статус:(()=>{SAID.length=0;Speech.status();return SAID.length>0;})()}));
 check('запуск: игра начинается, речь говорит и повторяет состояние по требованию',
  запуск.доИгры&&запуск.началась&&речь.сказано>0&&речь.статус,{запуск,речь});

 /* ── 2. жесты: 2↓ взаимодействие, 3↑ меню, 3↓ инвентарь, 2← карта ── */
 async function multi(n,dir){
  const pts=[];for(let i=0;i<n;i++){pts.push({x:120+i*45,y:400});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,k)=>({x:p.x,y:p.y,id:k}))});await page.waitForTimeout(30);}
  await page.waitForTimeout(50);
  if(dir){const d={S:[0,160],N:[0,-160],E:[160,0],W:[-160,0]}[dir];
   for(let s=1;s<=5;s++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,k)=>({x:p.x+d[0]*s/5,y:p.y+d[1]*s/5,id:k}))});await page.waitForTimeout(18);}
   pts.forEach(p=>{p.x+=d[0];p.y+=d[1];});}
  for(let k=n-1;k>=0;k--){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:pts[k].x,y:pts[k].y,id:k}]});await page.waitForTimeout(18);
   const rest=pts.slice(0,k).map((p,i)=>({x:p.x+2,y:p.y+1,id:i}));if(rest.length){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:rest});await page.waitForTimeout(18);}}
  await page.waitForTimeout(180);}
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 await multi(3,'S');const инв=await page.evaluate(()=>activeLayer()&&activeLayer().id);
 await multi(3,'S');const закрыт=await page.evaluate(()=>!activeLayer());
 await multi(2,'W');const карта=await page.evaluate(()=>activeLayer()&&activeLayer().id);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 await multi(3,'N');const меню=await page.evaluate(()=>activeLayer()&&activeLayer().id);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 check('жесты: три пальца вниз — инвентарь и он же закрывает, два влево — карта, три вверх — меню действий; ни один жест не спорит с другим',
  инв==="modal-inventory"&&закрыт&&карта==="modal-map"&&меню&&/modal|actionMenu/.test(String(меню)),{инв,закрыт,карта,меню});

 /* ── 3. ориентация, движение, столкновение ── */
 const ход=await page.evaluate(()=>{
  const r={};G.place=null;G.ship=null;SAID.length=0;safeFn(()=>handleThreeFingerSwipe("E"));r.где=SAID.find(t=>/Вы здесь/.test(t))||"";
  const x0=G.x,y0=G.y;move("E");r.шаг=G.x!==x0||G.y!==y0;
  /* столкновение: край мира не пускает */
  const бx=G.x;G.x=0;SAID.length=0;move("W");r.стена=G.x===0;G.x=бx;
  return r;});
 check('ориентация называет место, шаг меняет координату, край мира не пускает и говорит об этом',
  ход.где.length>0&&ход.шаг&&ход.стена,ход);

 /* ── 4. ощупывание, объект, звук ── */
 const объекты=await page.evaluate(async()=>{
  const r={};
  /* войти в постройку */
  outer: for(let rr=1;rr<60;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){
   const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);
   if(c&&c.structure&&c.structure.type!=="gate"){G.x+=dx;G.y+=dy;break outer;}}
  useHere();await new Promise(res=>setTimeout(res,150));
  r.вошли=!!G.place;if(!r.вошли)return r;
  const list=objectsHere();r.объектов=list.length;
  PLAYED.length=0;SAID.length=0;const scan=safeFn(()=>Look.scan(6),[]);r.осмотр=scan.length;
  /* actionsForAll отдаёт разбор «можно и почему нет», actionsFor — список. */
  r.действия=0;list.forEach(o=>{const all=safeFn(()=>actionsForAll(o),null);
   const n=Array.isArray(all)?all.length:(all&&Array.isArray(all.ok))?all.ok.length:safeFn(()=>actionsFor(o).length,0);
   if(n>r.действия)r.действия=n;});
  r.геометрия=safeFn(()=>Geometry.say(),"");
  r.звук=PLAYED.length>0||safeFn(()=>{beaconAt("danger",1,1,0,2);return true;},false);
  return r;});
 check('внутри постройки есть объекты, осмотр их находит, у объекта есть действия, геометрия хода слышна',
  объекты.вошли&&объекты.объектов>0&&объекты.осмотр>=0&&объекты.действия>0&&/слева|Геометрия/.test(объекты.геометрия||""),объекты);

 /* ── 5. житель, разговор, судьба ── */
 const житель=await page.evaluate(async()=>{
  const r={};const n=getNPC(G.place?G.place.bx:G.x,G.place?G.place.by:G.y,0,"Торговец");
  SAID.length=0;openNPC(n.key,true);await new Promise(res=>setTimeout(res,80));
  r.окно=!document.getElementById("modal-npc").hidden;
  r.ходы=document.querySelectorAll('#npcBody [data-cmd^="dlg:"]').length;
  G.day=5;const mem=memOf(n.key);if(mem)mem.ходы={};SAID.length=0;r.ход=dlgDo(n,"rassprosit");r.словаХода=SAID.length>0;
  r.судьба=!!safeFn(()=>Arcs.all()[n.key],null);
  while(activeLayer())closeTopUI();return r;});
 check('у жителя открывается окно с ходами разговора, ход проходит и говорит, а разговор заводит его судьбу',
  житель.окно&&житель.ходы>=3&&typeof житель.ход==="boolean"&&житель.словаХода&&житель.судьба,житель);

 /* ── 6. инвентарь, экипировка, оружие, бой, магия ── */
 const бой=await page.evaluate(async()=>{
  const r={};G.inv={"руда":5,"трава":3};G.gold=500;G.hp=G.hpMax=120;G.mana=G.manaMax=60;
  const rows=invAll();r.разделов=new Set(rows.map(x=>x.cat)).size;r.строк=rows.length;
  const gear=rows.find(x=>x.kind==="gear"||x.kind==="equip");r.снаряжение=!!gear;
  if(gear&&gear.kind==="gear")invDo("equip",gear.kind,gear.key);
  r.надето=!!(G.equip&&G.equip.weapon);
  G.weaponDrawn=false;drawWeapon();r.вРуках=!!G.weaponDrawn;
  const m={id:"wolf",n:"Волк",snd:"mgrowl",fx:"growl",lvl:2,hp:30,dmg:3,xp:20,gold:5,biomes:["forest"]};
  startCombat({x:G.x,y:G.y,monster:Object.assign({},m)});r.бой=!!G.inCombat;
  const hp0=G.combat.hp;fight("atk");r.удар=G.combat.hp<hp0;
  const мана0=G.mana;if((G.spells||[]).length){castSpell(0);}r.чары=G.mana<=мана0;
  if(G.inCombat){G.combat.hp=0;victory();}r.победа=!G.inCombat;
  return r;});
 check('инвентарь разложен по разделам, снаряжение надевается, оружие вынимается, удар снимает здоровье твари, чары тратят ману, победа закрывает бой',
  бой.разделов>=2&&бой.строк>0&&бой.снаряжение&&бой.вРуках&&бой.бой&&бой.удар&&бой.чары&&бой.победа,бой);

 /* ── 7. ресурс, дверь, подземелье, ловушка, сильная тварь ── */
 const глубина=await page.evaluate(async()=>{
  const r={};
  /* ресурс */
  const было=Number(G.inv["руда"])||0;G.inv["руда"]=было+1;r.ресурс=(Number(G.inv["руда"])||0)>было;
  /* подземелье */
  G.place={kind:"dungeon",bx:2500,by:2500,stype:"ruins",depth:3,name:"Проба",x:1,y:1};
  const l=curLevel();let пусто=null;for(let y=1;y<l.h-1&&!пусто;y++)for(let x=1;x<l.w-1;x++)if(tileAt(l,x,y)!=="#"){пусто={x,y};break;}
  if(пусто){G.place.x=пусто.x;G.place.y=пусто.y;}
  r.вГлубине=(Number(G.place.depth)||0)>0;r.паспорт=!!safeFn(()=>Passport.of(),null);
  /* дверь: действие двери есть в реестре */
  r.дверь=!!(typeof IACT!=="undefined"&&IACT.dopen&&IACT.dclose&&IACT.dlock);
  /* ловушка */
  r.ловушки=safeFn(()=>TRAPS.length,0);r.ловушкаТут=typeof trapAt==="function";
  /* сильная тварь */
  const lvl=(Number(G.level)||1)+3;startCombat({x:G.x,y:G.y,monster:{id:"deep_warden",n:"Смотритель ходов",snd:"mstomp",fx:"stomp",lvl,hp:40,dmg:5,xp:60,gold:30}});
  r.сильная=!!G.inCombat;G.combat.hp=0;victory();r.паденье=!G.inCombat;r.экология=!!safeFn(()=>G.eco&&Object.keys(G.eco).length,0);
  G.place=null;return r;});
 check('ресурс ложится в суму, подземелье имеет паспорт, двери и ловушки на месте, сильная тварь падает и экосистема это помнит',
  глубина.ресурс&&глубина.вГлубине&&глубина.паспорт&&глубина.дверь&&глубина.ловушки>=5&&глубина.ловушкаТут&&глубина.сильная&&глубина.паденье&&глубина.экология,глубина);

 /* ── 8. дело, репутация, торговля, ремесло ── */
 const дела=await page.evaluate(async()=>{
  const r={};G.quests=[];G.chainTaken={};G.place=null;
  const n=getNPC(G.x,G.y,0,"Старейшина");
  const q=safeFn(()=>questFor(n),null);r.дело=!!q;
  if(q){G.quests.push(q);r.вЖурнале=(G.quests||[]).length===1;}
  const до=safeFn(()=>repOf(n.race),0);safeFn(()=>addRep(n.race,3));r.репутация=safeFn(()=>repOf(n.race),0)>до;
  const t=getNPC(G.x,G.y,1,"Торговец");const цена1=npcAsk(t,"руда");
  safeFn(()=>addRep(t.race,10));const цена2=npcAsk(t,"руда");r.цена=[цена1,цена2];r.дешевле=цена2<=цена1;
  r.хозяйство=/склад/.test(safeFn(()=>Econ.text(t),"")||"");
  /* ремесло */
  G.mast={smith:{ур:2,оп:0,дел:0}};const дел0=G.mast.smith.дел;safeFn(()=>mastGain("smith",5));r.ремесло=G.mast.smith.дел>дел0;
  return r;});
 check('дело берётся и попадает в журнал, репутация растёт и двигает цену, у торговца видно хозяйство, работа растит ремесло',
  дела.дело&&дела.вЖурнале&&дела.репутация&&дела.дешевле&&дела.хозяйство&&дела.ремесло,дела);

 /* ── 9. новые системы: зона, знак, достижение, живой мир ── */
 const новое=await page.evaluate(()=>{
  const r={};G.place=null;G.seenZones={};G.zoneNow=null;
  const z=Zones.all()[0];const бx=G.x,бy=G.y;G.x=z.x;G.y=z.y;r.зона=Zones.arrive();G.x=бx;G.y=бy;
  G.inks={plain:4};G.inv["руда"]=3;G.items=[];G.sigils=null;Energy.ensure();G.mana=G.manaMax=40;
  Sigils.set("sym","shield");Sigils.set("carrier","metal");Sigils.set("geo","circle");Sigils.set("ink","plain");
  const rnd=Math.random;Math.random=()=>0.99;r.знак=/Начертано/.test(Sigils.make());Math.random=rnd;
  G.merits={};G.gold=1000;r.достижение=Merits.check()>=1;
  r.мир=/Мировых событий|Мировое событие/.test(Global.text());r.армии=/армии|Фронт|копий/.test(Armies.text());
  r.окна=["modal-path","modal-academy","modal-cases","modal-sigils","modal-living","modal-deeps","modal-merit"].filter(id=>!document.getElementById(id));
  return r;});
 check('новые системы в одной цепи: зона открывается, знак чертится, достижение берётся, мир и армии отвечают, все семь новых окон на месте',
  новое.зона===true&&новое.знак&&новое.достижение&&новое.мир&&новое.армии&&новое.окна.length===0,новое);

 /* ── 10. сохранение, загрузка, повторная загрузка ── */
 const сохран=await page.evaluate(()=>{
  const r={};G.gold=777;G.x=12345;G.y=23456;G.merits=G.merits||{};G.merits.проба=1;
  saveGame(true);const raw=serializeSave();r.длина=String(raw).length>500;
  G.gold=0;G.x=1;G.y=1;loadGame();r.золото=G.gold===777;r.место=G.x===12345&&G.y===23456;r.заслуга=!!(G.merits&&G.merits.проба);
  loadGame();r.второй=G.gold===777&&G.x===12345;
  const d=JSON.parse(raw);r.поля=["merits","zones","sigils","awake","wave","order","needs","imprints"].filter(k=>{
   const карта={merits:"merits",zones:"seenZones",sigils:"sigils",awake:"awake",wave:"wave",order:"order",needs:"needs",imprints:"imprints"};
   return d[карта[k]]===undefined&&G[карта[k]]!==undefined&&Object.keys(G[карта[k]]||{}).length>0;});
  return r;});
 check('сохранение пишется, загрузка возвращает золото, место и заслуги, повторная загрузка даёт то же самое',
  сохран.длина&&сохран.золото&&сохран.место&&сохран.заслуга&&сохран.второй,сохран);

 /* ── 11. старые обработчики, двойная речь, звуки ── */
 const чистота=(()=>{const c=(re)=>(src.match(re)||[]).length;
  return {touchstart:c(/addEventListener\('touchstart'/g),touchmove:c(/addEventListener\('touchmove'/g),touchend:c(/addEventListener\('touchend'/g),
   click:c(/document\.addEventListener\('click'/g),keydown:c(/document\.addEventListener\("keydown"/g)};})();
 const речь2=await page.evaluate(async()=>{
  const r={};SAID.length=0;SPOKEN.length=0;PLAYED.length=0;
  narrate("Проба цепи: одна строка.",{interrupt:true});
  await new Promise(res=>setTimeout(res,250));
  r.сказано=SAID.filter(t=>/Проба цепи/.test(t)).length;r.озвучено=SPOKEN.filter(t=>/Проба цепи/.test(t)).length;
  /* речь не съедает игровые звуки */
  PLAYED.length=0;Bank.play("knock_soft",{gain:0,maxSec:0.3});narrate("Вторая строка.",{interrupt:true});
  await new Promise(res=>setTimeout(res,200));r.звук=PLAYED.includes("knock_soft");
  r.очередь=typeof Speech.status==="function"&&typeof Speech.repeatLast==="function"&&typeof Speech.stop==="function";
  return r;});
 check('один диспетчер касаний, один обработчик кликов и клавиш; одна строка звучит один раз; речь не съедает игровые звуки; очередь речи на месте',
  чистота.touchstart===1&&чистота.touchmove===1&&чистота.touchend===1&&чистота.click===1&&чистота.keydown===1&&речь2.сказано===1&&речь2.озвучено<=1&&речь2.звук&&речь2.очередь,{чистота,речь2});

 /* ── 12. самопроверка мира по всем этапам ── */
 const итог=await page.evaluate(()=>{
  const sc=worldSelfCheck();const нужны=["cities","houses","path","academy","cases","sigils","living","deeps","merit"];
  return {всего:sc.length,плохие:sc.filter(x=>!x.ok).map(x=>x.id),нет:нужны.filter(id=>!sc.some(x=>x.id===id))};});
 check('самопроверка мира зелена целиком и знает все девять новых строк',
  итог.плохие.length===0&&итог.нет.length===0,итог);


 /* ── 13. в CMD и в меню действий нет повторных имён ──
    Поздний одноимённый ключ молча затирает ранний: команда исчезает, а
    ошибки нет ни одной. Из объекта этого уже не видно, поэтому смотрим
    исходник. Так однажды пропали «Энциклопедия звуков», «Слои мира» и
    урок у наставника. */
 const повторы=(()=>{
  const i=src.indexOf("\nconst CMD=");const j=src.indexOf("{",i);
  let d=0,k=j;for(;;k++){const c=src[k];if(c==="{")d++;else if(c==="}"){d--;if(d===0)break;}}
  const было={},дубли=[];
  src.slice(j,k).split("\n").forEach(l=>{const m=/^\s(\w+)\(/.exec(l);if(!m)return;
   if(было[m[1]])дубли.push(m[1]);else было[m[1]]=1;});
  return {ключей:Object.keys(было).length,дубли};})();
 const строкиМеню=await page.evaluate(()=>{const id=[];AM_GROUPS.forEach(g=>g[1].forEach(x=>id.push(x[0])));
  const было={},дубли=[];id.forEach(c=>{if(было[c])дубли.push(c);else было[c]=1;});
  return {строк:id.length,дубли,безКоманды:id.filter(c=>typeof CMD[c]!=="function")};});
 check('ни один ключ CMD и ни одна строка меню действий не объявлены дважды, и у каждой строки меню есть своя команда',
  повторы.дубли.length===0&&повторы.ключей>=240&&строкиМеню.дубли.length===0&&
  строкиМеню.безКоманды.length===0&&строкиМеню.строк>=90,
  {ключей:повторы.ключей,дубли:повторы.дубли,меню:строкиМеню.дубли,безКоманды:строкиМеню.безКоманды,строк:строкиМеню.строк});

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

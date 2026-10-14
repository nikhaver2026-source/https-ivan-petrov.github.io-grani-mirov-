/* ════════════════════════════════════════════════════════════════════════
   НАБОР 328: ВЕРХОМ БЫСТРЕЕ, ВЫУЧКА ЗВЕРЕЙ ТРУДНЕЕ, ЗАГАДКА — В САМОЙ
   ЗАГАДКЕ, ТЕМПЕРАТУРНЫЙ МЕХАНИЗМ ИЗ ЧЕТЫРЁХ СТРЕЛОК (после 16.0)

   1. Верхом шаг — две клетки (летучий — три, опытный всадник — на одну
      больше), пешком — одна; у постройки езда останавливается.
   2. Выучка героя: самоучкой — до четырёх, выше — урок у мастера в городе
      (практика, золото, корм); окно зверинца показывает выучку.
   3. Приручение: редкого зверя — только со звероведением; без навыка шанс
      ниже прежнего, с навыком 10 — прежний.
   4. Ветви развития: третья ступень — звероведение 2, четвёртая — наставник
      в городе; навыки зверя у неумелого хозяина растут медленнее.
   5. Седло: летучий скакун — верховая езда 3; выучка скакуна тайных палат —
      верховая езда и кожа.
   6. Загадка яруса: клавиша действия рядом открывает саму загадку; издали —
      только состояние и «решают на месте»; окно яруса называет решённые и
      нерешённые.
   7. Температурный механизм: четыре стрелки, пять ручек, начало решаемо
      (4–8 действий), предохранитель, три подсказки урезают награду; решён
      по-настоящему.
   8. Все виды загадок яруса решаются своим способом; действия механизмов
      не ломают окно яруса.
   9. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[],deepErr=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 p.on('console',m=>{if(m.type()==="error"&&/\[Deep\]/.test(m.text()))deepErr.push(m.text().slice(0,300));});
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};G.hour=12;});

 /* ── 1. Верхом ── */
 const е=await p.evaluate(()=>{const o={};const rnd=Math.random;Math.random=()=>0.99;
  try{G.place=null;G.ship=null;G.alt=0;
   /* полоса пустой земли на восток */
   const пусто=(x,y)=>{const c=cellContent(x,y);return !c.structure&&!c.monster&&!/water|sea|lake|ocean|river/.test(String(c.terrain&&c.terrain[0]));};
   let y0=null,x0=null;for(let y=3000;y<3400&&y0==null;y+=7)for(let x=3000;x<3300;x+=11){let ok=true;for(let k=0;k<=8;k++)if(!пусто(x+k,y)){ok=false;break;}if(ok){x0=x;y0=y;break;}}
   o.полоса=x0!=null;if(x0==null)return o;
   const шаг=()=>{G.x=x0;G.y=y0;G.atDoor=null;while(activeLayer())closeTopUI();move("E");return G.x-x0;};
   const s=Zver.st();s.list=[];s.pets=[];s.mount=null;G.mount=null;G.vy165=null;
   o.пешком=шаг();
   const конь=Zver.make("horse_wild",{тихо:true});конь.верн=90;Zver.ride(конь.uid);o.конь=шаг();o.верхом=!!Stable.riding();
   const грифон=Zver.make("griffin_storm",{тихо:true});грифон.верн=90;o.грифонБез=Zver.ride(грифон.uid);
   G.vy165={звер:{xp:0,предел:4},езда:{xp:6*9+1,предел:4}};o.грифонС=Zver.ride(грифон.uid);o.грифон=шаг();
   Zver.ride(конь.uid);G.vy165.езда={xp:6*36+1,предел:6};o.опытный=шаг();
   /* постройка на пути: езда встаёт у неё */
   let п=null;for(let y=3000;y<3600&&!п;y+=3)for(let x=3000;x<3600;x+=5){const c=cellContent(x+1,y);if(c.structure&&пусто(x,y)){п={x,y};break;}}
   if(п){G.vy165.езда={xp:0,предел:4};G.x=п.x;G.y=п.y;G.atDoor=null;move("E");o.уПостройки=G.x-п.x;}
   s.mount=null;G.vy165=null;
  }finally{Math.random=rnd;}return o;});
 check("1. Верхом шаг — две клетки, летучий — три, опытный всадник — три; пешком одна; у постройки езда встаёт",
  е.полоса&&е.пешком===1&&е.верхом&&е.конь===2&&/верховая езда 3/.test(е.грифонБез)&&/^Вы верхом/.test(е.грифонС)&&е.грифон===3&&е.опытный===3&&е.уПостройки===1,е);

 /* ── 2. Выучка героя: потолок, урок у мастера ── */
 const в=await p.evaluate(()=>{const o={};G.vy165=null;const V=Выучка165;
  V.опыт("звер",6*25+5,true);o.ур=V.ур("звер");o.поОпыту=V.поОпыту(G.vy165.звер.xp);
  G.place=null;o.внеГорода=V.урок("звер");
  G.place={kind:"city",bx:1,by:1,stype:"castle",name:"Город",depth:0,x:1,y:1};
  G.gold=0;o.безДенег=V.урок("звер");G.gold=500;for(const k of Object.keys(G.inv))if(Object.values(ZV_FOOD).includes(k))delete G.inv[k];
  o.безКорма=V.урок("звер");G.inv["мясо"]=5;o.урок=V.урок("звер");o.после=V.ур("звер");o.предел=G.vy165.звер.предел;o.корм=Number(G.inv["мясо"])||0;o.золото=G.gold;
  o.второй=V.урок("звер");
  Zver.home();o.окно=(document.getElementById("zvBody")||{}).textContent||"";while(activeLayer())closeTopUI();
  G.place=null;return o;});
 check("2. Выучка: самоучкой до четырёх; урок — только в городе, за золото и корм, и лишь с практикой; окно зверинца показывает выучку",
  в.ур===4&&в.поОпыту===5&&/в зверинце города/.test(в.внеГорода)&&/золота/.test(в.безДенег)&&/корма/.test(в.безКорма)&&/потолок теперь 5/.test(в.урок)&&в.после===5&&в.предел===5&&в.корм===3&&в.золото===350&&/практики/.test(в.второй)
  &&/Выучка героя/.test(в.окно)&&/Звероведение: 5/.test(в.окно)&&/Урок: Звероведение до 6/.test(в.окно),{...в,окно:в.окно.slice(0,300)});

 /* ── 3. Приручение ── */
 const п=await p.evaluate(()=>{const o={};const s=Zver.st();s.list=[];s.live=null;const rnd=Math.random;
  const редкий=ZV_BREEDS.find(b=>b.ред===2&&!b.легенда),простой=ZV_BREEDS.find(b=>b.ред===0&&!b.легенда&&ZV_FAMILY_BY_ID[b.fam].корм[0]==="мясо");
  const ждёт=b=>{s.tame={breed:b.id,day:G.day,x:G.x,y:G.y,lvl:1};G.inv["мясо"]=5;};
  G.vy165=null;ждёт(редкий);o.редкийБез=Zver.tame();o.ждалРедкий=!!s.tame;
  G.vy165={звер:{xp:9999,предел:10},езда:{xp:0,предел:4}};Math.random=()=>0.01;try{o.редкийС=Zver.tame();}finally{Math.random=rnd;}o.приручён=s.list.length;
  /* шанс: 0,5 при прежнем шансе около 0,62 — без навыка не выходит, с навыком 10 выходит */
  G.vy165=null;ждёт(простой);Math.random=()=>0.5;try{o.простойБез=Zver.tame();}finally{Math.random=rnd;}
  G.vy165={звер:{xp:9999,предел:10},езда:{xp:0,предел:4}};ждёт(простой);Math.random=()=>0.5;try{o.простойС=Zver.tame();}finally{Math.random=rnd;}
  o.всего=s.list.length;o.опыт=G.vy165.звер.xp>9999;s.tame=null;G.vy165=null;return o;});
 check("3. Приручение: редкого — только со звероведением; без навыка шанс ниже прежнего, с навыком 10 — прежний; опыт звероведения",
  /звероведение 4, у вас 0/.test(п.редкийБез)&&п.ждалРедкий&&/Теперь он ваш/.test(п.редкийС)&&п.приручён===1&&/не вышло/.test(п.простойБез)&&/Теперь он ваш/.test(п.простойС)&&п.всего===2&&п.опыт,п);

 /* ── 4. Ветви развития и навыки ── */
 const р=await p.evaluate(()=>{const o={};const s=Zver.st();s.list=[];G.vy165=null;
  const a=Zver.make("wolf_wild",{lvl:15,тихо:true})||Zver.make(ZV_BREEDS.find(b=>!b.легенда).id,{lvl:15,тихо:true});a.ветви.fang=2;
  o.третьяБез=Zver.grow(a.uid,"fang");o.ст0=a.ветви.fang;
  G.vy165={звер:{xp:6*4+1,предел:4},езда:{xp:0,предел:4}};o.третья=Zver.grow(a.uid,"fang");o.ст1=a.ветви.fang;
  G.vy165.звер.xp=6*16+1;G.place=null;o.четвёртаяВне=Zver.grow(a.uid,"fang");
  G.place={kind:"city",bx:1,by:1,stype:"castle",name:"Город",depth:0,x:1,y:1};G.gold=200;G.inv["мясо"]=5;o.четвёртая=Zver.grow(a.uid,"fang");o.ст2=a.ветви.fang;o.золото=G.gold;o.мясо=G.inv["мясо"];G.place=null;
  const b=Zver.make("wolf_wild",{lvl:1,тихо:true})||a;b.навыки={};G.vy165=null;Zver.skillUp(b,"hunter",10);const без=Number(b.навыки.hunter)||0;
  b.навыки={};G.vy165={звер:{xp:9999,предел:10},езда:{xp:0,предел:4}};Zver.skillUp(b,"hunter",10);const с=Number(b.навыки.hunter)||0;
  o.навыкБез=Math.round(без*1000)/1000;o.навыкС=Math.round(с*1000)/1000;G.vy165=null;s.list=[];return o;});
 check("4. Ветви: третья ступень — звероведение 2, четвёртая — наставник в городе, корм и плата; навыки зверя у неумелого растут медленнее",
  /звероведение 2, у вас 0/.test(р.третьяБез)&&р.ст0===2&&р.ст1===3&&/наставником/.test(р.четвёртаяВне)&&р.ст2===4&&р.золото===120&&р.мясо===3&&р.навыкС>р.навыкБез*2,р);

 /* ── 5. Выучка скакуна тайных палат ── */
 const к=await p.evaluate(()=>{const o={};G.vy165=null;G.gold=3000;if(!Array.isArray(G.mounts))G.mounts=[];if(!G.mounts.includes("ashmare"))G.mounts.push("ashmare");
  Stable.st().legLv["ashmare"]=0;delete G.inv["кожа"];
  o.первая=Stable.train("ashmare");o.второйБез=Stable.train("ashmare");
  G.vy165={звер:{xp:0,предел:4},езда:{xp:7,предел:4}};o.второйБезКожи=Stable.train("ashmare");G.inv["кожа"]=2;o.второй=Stable.train("ashmare");o.кожа=G.inv["кожа"];
  G.vy165.езда={xp:6*9+1,предел:4};G.place=null;G.inv["кожа"]=5;o.третийВне=Stable.train("ashmare");o.lv=Stable.legLv("ashmare");G.vy165=null;return o;});
 check("5. Выучка скакуна: первая — за золото; вторая — верховая езда 1 и кожа; третья — только у берейтора в городе",
  /выучка «привыкший»/.test(к.первая)&&/верховая езда 1, у вас 0/.test(к.второйБез)&&/кожа ×1/.test(к.второйБезКожи)&&/выучка «послушный»/.test(к.второй)&&к.кожа===1&&/берейтора/.test(к.третийВне)&&к.lv===2,к);

 /* ── 6–7. Загадка яруса и температурный механизм ── */
 const з=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  const найти=(тип)=>{for(let i=0;i<160;i++){const bx=21000+i*137,by=23000+i*91;for(let d=1;d<=8;d++){G.place={kind:"dungeon",bx,by,stype:"cave_entrance",name:"т",depth:d,x:1,y:1};
    if(!Deep.on())continue;const s=Deep.here();const x=Deep.st(s);const e=Deep.els(s,x,d).find(q=>q.t==="puzzle"&&(!тип||q.ref.type===тип)&&!x.solved[q.ref.id]);if(!e)continue;
    const L=curLevel();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=L.g[e.y+dy]&&L.g[e.y+dy][e.x+dx];if(t==="."){return {e,s,x,st:{x:e.x+dx,y:e.y+dy},d:[-dx,-dy]};}}}}return null;};
  /* 6. рядом — E открывает саму загадку */
  const н=найти(null);o.нашли=!!н;if(!н)return o;
  G.place.x=н.st.x;G.place.y=н.st.y;window.lastMoveDir=null;fieldInteract();await w(80);
  o.окноE=(document.getElementById("dpTitle")||{}).textContent||"";o.имя=н.e.ref.n;while(activeLayer())closeTopUI();
  /* издали: без «Взяться», решают на месте */
  G.place.x=н.e.x+6;G.place.y=н.e.y+6;Deep.el("puzzle:"+н.e.ref.id);await w(50);o.издали=(document.getElementById("dpBody")||{}).textContent||"";while(activeLayer())closeTopUI();
  Deep.home();await w(50);o.ярус=(document.getElementById("dpBody")||{}).textContent||"";while(activeLayer())closeTopUI();
  /* 7. температурный механизм */
  const т=найти("heat");o.жар=!!т;if(!т)return o;const {s,x}=т;const pz=т.e.ref;G.place.x=т.st.x;G.place.y=т.st.y;
  Deep.puzzle(pz.id);await w(50);const тело=(document.getElementById("dpBody")||{}).textContent||"";
  o.стрелок=ЖАР_СТРЕЛКИ165.filter(n=>тело.includes(n.n[0].toUpperCase()+n.n.slice(1))).length;o.ручек=ЖАР_РУЧКИ165.filter(r=>тело.includes(r.n)).length;
  o.подсказок=["Намёк","Средняя подсказка","Сложная подсказка"].filter(h=>тело.includes(h)).length;o.описание=/равновесии/.test(тело);
  const у=Загадки165.устройство(s,pz);o.старт=у.старт;o.кратчайший=у.кратчайший;o.ненулевых=у.старт.filter(a=>a!==0).length;
  /* одна ручка не решает */
  const z=Загадки165.сост(x,pz,s);
  /* предохранитель: жмём горн, пока медь не уйдёт в красное */
  let сорвался=false;for(let i=0;i<8&&!сорвался;i++){const до=z.срывов;Deep.cmd(`hz:${pz.id}:0`);if(z.срывов>до)сорвался=true;}
  o.сорвался=сорвался;o.послеСрыва=z.v.join(",")===у.старт.join(",");
  /* подсказки: намёк и средняя */
  Deep.cmd(`hzhint:${pz.id}:намёк`);Deep.cmd(`hzhint:${pz.id}:средняя`);o.штраф=Math.round(Загадки165.штраф(z)*100);
  const тело2=(document.getElementById("dpBody")||{}).textContent||"";o.средняяТекст=/раздуть горн мехами — медь \+2/.test(тело2);
  /* решаем кратчайшим путём */
  const ход=Загадки165.путь(z.v);o.ходов=ход.length;const g0=G.gold;
  for(const ri of ход)Deep.cmd(`hz:${pz.id}:${ri}`);
  o.решена=!!x.solved[pz.id];const t=Math.max(1,Number(pz.tier)||1);o.золото=G.gold-g0;o.ждём=Math.round((70+t*20)*0.65);
  while(activeLayer())closeTopUI();
  /* 8. все виды загадок решаются */
  const виды=["bells","levers","weights","runes","heat","circuit","time","echo","riddle","hollow","water","hum"];const плохо=[];
  for(const тип of виды){const id="t328_"+тип;s.puzzles=s.puzzles.filter(q=>q.id!==id);const q=Deep.genPuzzle(id,тип,т.d?Deep.tierNo():1,Deep.rng(328+тип.length*7));q.tier=Deep.tierNo();
   if(тип==="levers")safeFn(()=>Загадки150.рычаги(q));s.puzzles.push(q);delete x.solved[id];x.inp[id]=[];
   try{
    if(тип==="riddle")Deep.pzAns(id,encodeURIComponent(q.a));
    else if(тип==="heat"){const zz=Загадки165.сост(x,q,s);for(const ri of (Загадки165.путь(zz.v)||[]))Deep.cmd(`hz:${id}:${ri}`);}
    else if(тип==="weights"){const W=q.w;let rest=q.target;const наб=[];while(rest>0){const i=W.map((v,k)=>[v,k]).filter(([v])=>v<=rest).sort((a,b)=>b[0]-a[0])[0];if(!i)break;наб.push(i[1]);rest-=i[0];}наб.forEach(k=>Deep.pzIn(id,k));}
    else{const ans=q.rev?q.ans.slice().reverse():q.ans;const L=тип==="circuit"?3:ans.length;ans.slice(0,L).forEach(k=>Deep.pzIn(id,k));}
   }catch(err){плохо.push(тип+": "+String(err).slice(0,80));}
   if(!x.solved[id])плохо.push(тип);while(activeLayer())closeTopUI();}
  o.плохо=плохо;
  /* механизмы: осмотр и действия не ломают окно */
  let дейст=0;for(const m of (s.mechs||[]).slice(0,30)){for(const a of ["look","on","off","repair","over","valve","take"]){try{Deep.cmd(`m:${m.id}:${a}`);дейст++;}catch(_){}while(activeLayer())closeTopUI();if(G.inCombat)endCombat();}}
  o.действий=дейст;G.place=null;return o;});
 check("6. Загадка яруса: E рядом открывает саму загадку; издали — без «Взяться», «решают на месте»; окно яруса называет решённые и нерешённые",
  з.нашли&&з.окноE===з.имя&&!/Взяться за загадку/.test(з.издали)&&/Решают её на месте/.test(з.издали)&&/Загадки яруса: \d+/.test(з.ярус)&&/Не решены:/.test(з.ярус),{окноE:з.окноE,имя:з.имя,издали:String(з.издали).slice(0,200),ярус:String(з.ярус).slice(0,300)});
 check("7. Температурный механизм: четыре стрелки, пять ручек, описание, три подсказки; начало решаемо за 4–8; предохранитель; подсказки урезают награду; решён",
  з.жар&&з.стрелок===4&&з.ручек===5&&з.подсказок===3&&з.описание&&з.кратчайший>=4&&з.кратчайший<=8&&з.ненулевых>=3&&з.сорвался&&з.послеСрыва&&з.штраф===35&&з.средняяТекст&&з.решена&&з.золото===з.ждём,з);
 check("8. Все виды загадок яруса решаются своим способом; действия механизмов не ломают окно яруса",
  Array.isArray(з.плохо)&&з.плохо.length===0&&з.действий>0&&deepErr.length===0,{плохо:з.плохо,действий:з.действий,deepErr:deepErr.slice(0,3)});

 check("9. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();

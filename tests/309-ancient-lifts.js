/* ════════════════════════════════════════════════════════════════════════
   НАБОР 309: 15.0 — ДРЕВНИЕ ПОДЪЁМНИКИ В ПОДЗЕМЕЛЬЯХ

   Просьба игрока: «в подземельях древние лифты, чтобы не подниматься снизу
   по лестницам, а проехать до верха — и до какого-либо этажа. Вниз лифт не
   пускает дальше того уровня, который игрок уже исследовал или на котором
   был. Лестницы не убирай».
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;
  window.__тихо=()=>{G.inCombat=false;G.combat=null;safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  window.__окно=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.querySelector("#eventBody .list-line")||{}).textContent,выбор:(curEvent&&curEvent.choices||[]).map(c=>c.l)}:null;};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};});
 const W=ms=>page.waitForTimeout(ms);

 /* ── 1. площадка на каждом ярусе, у подъёма наверх, ярус остаётся проходимым ── */
 const п=await page.evaluate(()=>{const out={ярусов:0,сПлощадкой:0,далеко:[],нетПути:[],одна:true};
  for(let bx=0;bx<6;bx++)for(let by=0;by<6;by++)for(let d=1;d<=6;d++){const lvl=genLevel(1200+bx*17,1300+by*13,d,"ruins");out.ярусов++;
   let n=0,e=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]==="E"){n++;e={x,y};}
   if(n!==1)out.одна=false;if(!e)continue;out.сПлощадкой++;
   let вверх=null;for(let y=0;y<lvl.h&&!вверх;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]==="<"){вверх={x,y};break;}
   if(вверх&&Math.max(Math.abs(вверх.x-e.x),Math.abs(вверх.y-e.y))>12)out.далеко.push([d,вверх,e]);
   /* от подъёма до площадки дойти можно */
   const был=new Set([вверх.x+","+вверх.y]);const q=[вверх];let дошли=false;
   while(q.length&&!дошли){const c=q.shift();for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=c.x+dx,ny=c.y+dy;const k=nx+","+ny;if(был.has(k))continue;был.add(k);
    const t=lvl.g[ny]&&lvl.g[ny][nx];if(!t||(TILE[t]&&TILE[t].solid)||t==="Y"||t==="%")continue;if(nx===e.x&&ny===e.y){дошли=true;break;}q.push({x:nx,y:ny});}}
   if(!дошли)out.нетПути.push([d,вверх,e]);}
  return out;});
 check('1. на каждом ярусе подземелья одна площадка древнего подъёмника, в нескольких шагах от подъёма наверх, и до неё можно дойти',
  п.ярусов>0&&п.сПлощадкой===п.ярусов&&п.одна&&!п.далеко.length&&!п.нетПути.length,п);

 /* ── 2–6. сон, пробуждение, поездки ── */
 const найти=`(()=>{const c=(()=>{for(let r=1;r<160;r++)for(let dx=-r;dx<=r;dx++)for(const dy of [-r,r]){const cc=cellContent(G.x+dx,G.y+dy);
   if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"&&!airOnly(cc.structure.type))return {x:G.x+dx,y:G.y+dy,cc};}return null;})();
  G.x=c.x;G.y=c.y;G.place=null;G.lift150={};enterPlace(c.cc);__закрыть();return c;})()`;
 const а=await page.evaluate(найти+";");
 const б=await page.evaluate(()=>{__тихо();const o={};
  /* спуск по лестницам до четвёртого яруса */
  for(let i=0;i<3;i++){changeDepth(1,{bypass:true});__закрыть();}
  o.ярус=G.place.depth;o.был=Лифт150.был();
  const L=curLevel();const м=L.lift150;G.place.x=м.x;G.place.y=м.y;__said=[];useHere();o.спит=__окно();
  return o;});
 await page.evaluate(()=>{__said=[];resolveEvent(0);});await W(300);
 const в=await page.evaluate(()=>{const o={слова:__said.join(" | "),бодр:Object.keys(Лифт150.ст().бодр).length};__said=[];useHere();o.меню=__окно();return o;});
 check('2. подъёмник спит, пока не повернуть ворот: «Повернуть ворот — разбудить механизм»; после — меню ярусов',
  б.ярус===4&&б.был===4&&б.спит&&/спит/.test(б.спит.текст)&&/^Повернуть ворот/.test(б.спит.выбор[0])&&/подъёмник проснулся/.test(в.слова)&&в.бодр===1&&в.меню&&в.меню.выбор[0]==="Наверх — на первый ярус, к выходу",{б,в});
 check('3. вниз — только по пройденным: на самом глубоком пройденном ярусе пунктов «ниже» нет',
  в.меню&&!в.меню.выбор.some(l=>/ниже|самый глубокий/.test(l)),в.меню);
 await page.evaluate(()=>{__said=[];resolveEvent(0);});await W(3500);
 const г=await page.evaluate(()=>{const L=curLevel();const все=__said.join(" | ");return {ярус:G.place.depth,наПлощадке:G.place.x===L.lift150.x&&G.place.y===L.lift150.y,
  пошла:/пошла вверх: 3 яруса/.test(все),встал:/Подъёмник встал: ярус 1/.test(все),слова:все.slice(0,200),был:Лифт150.был()};});
 check('4. «Наверх» везёт на первый ярус, на площадку у подъёма; поездка слышна словами («Клеть… пошла вверх», «Подъёмник встал»)',
  г.ярус===1&&г.наПлощадке&&г.пошла&&г.встал&&г.был===4,г);
 const д=await page.evaluate(()=>{__said=[];useHere();const o={меню:__окно()};return o;});
 check('5. с первого яруса клеть везёт вниз до четвёртого — самого глубокого из пройденных, не глубже',
  д.меню&&д.меню.выбор.includes("На ярус ниже — 2-й")&&д.меню.выбор.includes("На самый глубокий из пройденных — 4-й")&&!д.меню.выбор.some(l=>/5-й/.test(l)),д.меню);
 await page.evaluate(()=>{const i=curEvent.choices.findIndex(c=>/самый глубокий/.test(c.l));__said=[];resolveEvent(i);});await W(3500);
 const е=await page.evaluate(()=>{const o={ярус:G.place.depth};
  /* попытка обойти предел: прямой вызов на пятый — клеть встаёт на четвёртом пределе */
  o.мимо=Лифт150.ехать(7);return o;});
 await W(3500);
 const е2=await page.evaluate(()=>({ярус:G.place.depth,был:Лифт150.был()}));
 check('6. вниз до самого глубокого пройденного — и ни ярусом глубже, даже если попросить прямо',е.ярус===4&&е2.ярус===4&&е2.был===4,{е,е2});

 /* ── 7. лестницы на месте: новый ярус — только по лестнице, и клеть его запоминает ── */
 const ж=await page.evaluate(()=>{__тихо();const L=curLevel();let есть=false;for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++)if(L.g[y][x]===">"||L.g[y][x]==="<")есть=true;
  changeDepth(1,{bypass:true});__закрыть();const o={лестницы:есть,ярус:G.place.depth,был:Лифт150.был()};
  const M=curLevel().lift150;G.place.x=M.x;G.place.y=M.y;useHere();o.меню=__окно();__закрыть();return o;});
 check('7. лестницы остаются: пятый ярус открыт ногами — и клеть теперь знает пять ярусов',ж.лестницы&&ж.ярус===5&&ж.был===5&&ж.меню&&ж.меню.выбор.some(l=>/На ярус выше — 4-й/.test(l)),ж);

 /* ── 8. «Выбрать ярус» десятками в глубоком подземелье; пока клеть идёт — шагать некуда ── */
 const з=await page.evaluate(()=>{const s=Лифт150.ст();s.глубь[Лифт150.ключ()]=37;__said=[];useHere();
  const i=curEvent.choices.findIndex(c=>c.l==="Выбрать ярус");resolveEvent(i);const o={десятки:__окно()};
  resolveEvent(1);o.ярусы=__окно();const j=curEvent.choices.findIndex(c=>c.l==="Ярус 15");resolveEvent(j);
  o.шаг=(()=>{__said=[];const r=moveInside("N");return {r,слова:__said.join(" | ")};})();return o;});
 await W(5000);
 const з2=await page.evaluate(()=>({ярус:G.place.depth}));
 check('8. «Выбрать ярус»: сперва десятки (1–10, 11–20…), затем ярус; пока клеть идёт, шаг не проходит («Клеть ещё идёт»)',
  з.десятки&&з.десятки.выбор[0]==="Ярусы 1–10"&&з.десятки.выбор.includes("Ярусы 31–37")&&з.ярусы&&з.ярусы.выбор.includes("Ярус 15")&&з.шаг.r===false&&/Клеть ещё идёт/.test(з.шаг.слова)&&з2.ярус===15,{з,з2});

 /* ── 9. сохранение: пройденные ярусы и разбуженный механизм переживают сохранение и загрузку ── */
 const и=await page.evaluate(async()=>{saveGame(true);const до=JSON.stringify(G.lift150);await new Promise(r=>setTimeout(r,300));loadGame();await new Promise(r=>setTimeout(r,800));
  return {до,после:JSON.stringify(G.lift150)};});
 check('9. пройденные ярусы и разбуженный механизм сохраняются и загружаются',и.до===и.после&&/37/.test(и.после),и);

 /* ── 10. площадка — объект: в «Что вокруг», маяк, двойное касание вплотную ── */
 const к=await page.evaluate(()=>{__закрыть();__тихо();const L=curLevel();const м=L.lift150;
  /* встать рядом с площадкой */
  let рядом=null;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const t=tileAt(L,м.x+dx,м.y+dy);if(t==="."){рядом={x:м.x+dx,y:м.y+dy};break;}}
  G.place.x=рядом.x;G.place.y=рядом.y;const все=objectsHere(true)||[];const o={вСписке:все.some(x=>x.плитка==="E"&&/подъёмник/.test(x.n)),маяк:!!tileBeacon("E")&&!!BEACONS[tileBeacon("E")]};o.слой=String(activeLayer()&&activeLayer().id);o.активна=gameActive();
  /* герой повернулся к площадке последним шагом: двойное касание выбирает то, к чему он повернулся */
  lastMoveDir=Object.keys(DIRV).find(k=>DIRV[k][0]===м.x-рядом.x&&DIRV[k][1]===м.y-рядом.y);__said=[];o.fi=fieldInteract();o.меню=__окно();o.слова=__said.slice(0,3);__закрыть();return o;});
 check('10. площадка подъёмника — объект: в «Что вокруг», со своим маяком; двойное касание вплотную открывает меню',к.вСписке&&к.маяк&&к.меню&&/подъёмник/i.test(к.меню.заголовок),к);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

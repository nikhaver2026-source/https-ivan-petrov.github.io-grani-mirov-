/* ════════════════════════════════════════════════════════════════════════
   НАБОР 319: НИЖНИЕ ПУТИ — ТОЖЕ ЯРУСЫ ГЛУБИ (15.5)

   Жалоба игрока: на шестом ярусе подземелья нигде ни загадок, ни древних
   механизмов — только подъёмник; в загруженном сохранении на двадцать
   четвёртом ярусе появились тайники, лазы и завалы, а загадок и механизмов
   нет. Глубь раздавала механизмы, загадки, замки и тайные ходы только своим
   ярусам 1…N; ниже шли Нижние пути без них. Теперь ярусы ниже N достраиваются
   тем же генератором, по одному, когда герой до них доходит, а ярусам 1…N без
   загадки она добавляется. Всё выводится из координат входа.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 const войти=async()=>{await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
  await page.evaluate(()=>{settings.effects=0;settings.music=0;
   window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
   window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
   window.__входы=[[25010,25100,"cave_entrance"],[24420,25330,"cave_entrance"],[25555,24870,"cave_entrance"],[26001,25777,"cave_entrance"],[24777,24555,"cave_entrance"],[25303,25909,"cave_entrance"]];
   window.__на=(bx,by,st,d)=>{G.place={kind:"dungeon",bx,by,stype:st,depth:d,name:"x",x:1,y:1};return Deep.on();};
   window.__подпись=(s,от,до)=>{const o=[];for(let i=от;i<=до;i++){const T=s.tiers[i]||{};o.push([i,T.b,s.mechs.filter(m=>m.tier===i).map(m=>m.id+":"+m.kind+":"+m.st0).join(","),
    s.secrets.filter(z=>z.tier===i).map(z=>z.id+":"+z.kind+":"+z.gives).join(","),s.puzzles.filter(p=>p.tier===i).map(p=>p.id+":"+p.type).join(","),s.locks.filter(L=>L.tier===i).map(L=>L.id+":"+L.kind).join(",")].join("|"));}return o.join(" / ");};});};
 await page.goto(process.argv[2]);await page.waitForTimeout(800);await войти();

 /* ── 1. свои ярусы 1…N: загадка на каждом ── */
 const с=await page.evaluate(()=>{const o=[];for(const [bx,by,st] of __входы){const s=Deep.spec(bx,by,st);if(!s)continue;
   o.push({N:s.N,безЗагадки:Array.from({length:s.N},(_,i)=>i+1).filter(i=>!s.puzzles.some(p=>p.tier===i)),новыеВыше:s.mechs.filter(m=>m.tier<=s.N&&/^mx/.test(m.id)).length+s.secrets.filter(z=>z.tier<=s.N&&/^sx/.test(z.id)).length});}
  return o;});
 check('1. у каждого подземелья на каждом из своих ярусов есть загадка; механизмы и тайные ходы своих ярусов прежние',
  с.length===6&&с.every(x=>x.безЗагадки.length===0&&x.новыеВыше===0),с);

 /* ── 2. ниже своих ярусов — механизмы, тайные ходы, загадка, порой замок ── */
 const н=await page.evaluate(()=>{const o=[];for(const [bx,by,st] of __входы){const s=Deep.spec(bx,by,st);const ярусы=[];
   for(let d=s.N+1;d<=s.N+6;d++){const on=__на(bx,by,st,d);ярусы.push({d,on,b:!!(s.tiers[d]&&DEEP_BIOME_BY_ID[s.tiers[d].b]),мех:s.mechs.filter(m=>m.tier===d).length,
    ход:s.secrets.filter(z=>z.tier===d).length,загадок:s.puzzles.filter(p=>p.tier===d).length,замок:s.locks.filter(L=>L.tier===d).length});}
   o.push(ярусы);}G.place=null;
  const все=o.flat();return {ярусов:все.length,плохих:все.filter(x=>!x.on||!x.b||x.мех<1||x.ход<1||x.загадок!==1).slice(0,4),замков:все.filter(x=>x.замок).length};});
 check('2. ярусы ниже своих (Нижние пути) — со своей породой, древними механизмами, тайными ходами и загадкой; иногда и с замком',
  н.ярусов===36&&н.плохих.length===0&&н.замков>=4,н);

 /* ── 3. на карте яруса механизмы и загадка стоят на своих местах ── */
 const к=await page.evaluate(()=>{const [bx,by,st]=__входы[0];const s=Deep.spec(bx,by,st);const d=s.N+2;__на(bx,by,st,d);const x=Deep.st(s);
  const els=Deep.els(s,x,d);const L=curLevel();const o={виды:[...new Set(els.map(e=>e.t))],наПолу:els.every(e=>L&&L.g[e.y]&&L.g[e.y][e.x]===".")};G.place=null;return o;});
 check('3. на карте нижнего яруса механизмы и загадка стоят на полу яруса — к ним идут по маяку',к.виды.includes("mech")&&к.виды.includes("puzzle")&&к.наПолу,к);

 /* ── 4. глубоко, как у игрока: двадцать четвёртый ярус малого подземелья ── */
 const г=await page.evaluate(()=>{let pick=null;for(const [bx,by,st] of __входы){const s=Deep.spec(bx,by,st);if(s.N<24){pick=[bx,by,st];break;}}
  const [bx,by,st]=pick;const s=Deep.spec(bx,by,st);const on=__на(bx,by,st,24);
  const o={N:s.N,on,безЗагадки:[],безМеханизма:[]};for(let d=s.N+1;d<=24;d++){if(!s.puzzles.some(p=>p.tier===d))o.безЗагадки.push(d);if(!s.mechs.some(m=>m.tier===d))o.безМеханизма.push(d);}
  o.загадкиСОтветом=s.puzzles.filter(p=>/^px/.test(p.id)&&p.type==="riddle").every(p=>p.q&&p.a&&Array.isArray(p.opts)&&p.opts.includes(p.a));
  o.строка=String(Deep.tierLine(24));G.place=null;return o;});
 check('4. сразу на двадцать четвёртый ярус (как в загруженном сохранении): на каждом ярусе от N+1 до 24 — загадка и механизм',
  г.on&&г.безЗагадки.length===0&&г.безМеханизма.length===0&&г.загадкиСОтветом,г);
 check('5. строка яруса называет Нижние пути и говорит, что здесь свои механизмы, загадки и тайные ходы',
  /Нижние пути под подземельем/.test(г.строка)&&/свои механизмы, загадки и тайные ходы/.test(г.строка),г.строка);

 /* ── 6. окно яруса: заголовок Нижних путей ── */
 const о=await page.evaluate(()=>{const [bx,by,st]=__входы[1];const s=Deep.spec(bx,by,st);__на(bx,by,st,s.N+1);Deep.home();const L=activeLayer();
  const t=L?L.textContent:"";while(activeLayer())closeTopUI();G.place=null;return {N:s.N,t:t.slice(0,240)};});
 check('6. окно «Ярус подземелья» ниже своих ярусов: «Нижние пути под подземельем … (своих ярусов у него N)»',
  new RegExp("Нижние пути под подземельем «.+?» \\(своих ярусов у него "+о.N+"\\)\\. Ярус "+(о.N+1)).test(о.t),о);

 /* ── 7–8. те же ярусы после перезагрузки; решённое — помнится ── */
 const до=await page.evaluate(()=>{const [bx,by,st]=__входы[2];const s=Deep.spec(bx,by,st);__на(bx,by,st,s.N+4);
  G.place=null;return {N:s.N,подпись:__подпись(s,s.N+1,s.N+4)};});
 await page.waitForTimeout(400);
 await page.reload();await page.waitForTimeout(800);await войти();
 const п=await page.evaluate(async()=>{while(activeLayer())closeTopUI();const [bx,by,st]=__входы[2];const s=Deep.spec(bx,by,st);const on=__на(bx,by,st,s.N+4);
  const o={on,подпись:__подпись(s,s.N+1,s.N+4)};
  /* решить загадку нижнего яруса, сохранить, забыть и загрузить */
  Deep.st(s).solved["px"+(s.N+2)]=7;saveGame(true);G.place=null;delete G.deep[s.key];await new Promise(r=>setTimeout(r,300));
  loadGame();await new Promise(r=>setTimeout(r,900));while(activeLayer())closeTopUI();
  const s2=Deep.spec(bx,by,st);__на(bx,by,st,s2.N+2);o.решено=(Deep.st(s2).solved||{})["px"+(s2.N+2)];o.загадка=s2.puzzles.some(p=>p.id==="px"+(s2.N+2));G.place=null;return o;});
 check('7. нижние ярусы выводятся из координат входа: после перезагрузки игры — те же порода, механизмы, ходы, загадки и замки',
  п.on&&п.подпись===до.подпись&&п.подпись.length>40,{до:до.подпись.slice(0,200),после:п.подпись.slice(0,200)});
 check('8. решённая загадка нижнего яруса после сохранения и загрузки остаётся решённой и на своём месте',п.решено===7&&п.загадка,п);

 /* ── 9. Нижние пути остаются собой: твари — прежние, ловушки — вперемешку (и ловушки Сводов) ── */
 const т=await page.evaluate(()=>{while(activeLayer())closeTopUI();const o={имя:null,своё:null,dw:null,сводов:0,породы:0};
  const [bx,by,st]=__входы[0];const s=Deep.spec(bx,by,st);__на(bx,by,st,s.N+2);
  const m={...MONSTERS[0],lvl:5,hp:50,dmg:6,xp:10,gold:3};o.своё=m.n;startCombat({x:G.place.x,y:G.place.y,monster:m});
  o.имя=G.combat&&G.combat.m.n;o.dw=!!(G.combat&&G.combat.m.dw);safeFn(()=>endCombat());
  for(let k=0;k<40;k++){G.place={kind:"dungeon",bx:2000+k,by:2000,stype:"ruins",name:"Проба",depth:14,x:1,y:1};const l=curLevel();
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){if(tileAt(l,x,y)!==".")continue;const t=trapAt(x,y);if(!t)continue;if(t.sv)o.сводов++;if(t.dw||t.биом||t.deep)o.породы++;}}
  G.place=null;return o;});
 check('9. в Нижних путях твари прежние (порода яруса их не перекраивает), а среди ловушек есть и ловушки Сводов',
  т.имя===т.своё&&!т.dw&&т.сводов>0,т);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

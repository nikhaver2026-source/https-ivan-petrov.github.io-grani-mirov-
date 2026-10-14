/* ════════════════════════════════════════════════════════════════════════
   НАБОР 330: ШАГ НЕ ЗАВИСАЕТ — В ЛАЗАХ, ТАЙНЫХ ХОДАХ И ПОДЗЕМЕЛЬЯХ
   (после 16.0, просьба игрока: «при быстром перемещении в лазах, тайных
   проходах, а иногда и в подземельях шаги зависают»)

   1. Гавани материков считаются один раз и запоминаются: после перезагрузки
      страницы они берутся готовыми, без обхода берегов.
   2. Вход отклика помещения — шина; за ней готовые узлы свёртки: ярус,
      заранее — тайники (каморка и целые ходы), и небесный отклик богов.
   3. Лаз туда и обратно: отклик тайной палаты и яруса берётся готовым —
      ни расчёта отклика, ни новой свёртки в самом шаге.
   4. Новое место: шаг не ждёт новый отклик — звучит прежний, новый готов в
      простое через миг.
   5. Под сводом звук по-прежнему с отзвуком: канал среды идёт во вход
      отклика, у тайной палаты отклик короче, чем у яруса.
   6. Быстрые шаги по тайной палате, тайному ходу и ярусу (с упором в стены)
      не держат игру: ни один шаг не дольше трети секунды.
   7. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const ctx=await browser.newContext();const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);

 /* ── 1. Гавани ── */
 const г1=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  for(let i=0;i<40&&!Mater._harb;i++)await w(250);
  let v=null;try{v=JSON.parse(store.get("gm165harb")||"null");}catch(_){}
  return {посчитаны:!!Mater._harb,запомнены:!!(v&&Array.isArray(v.h)&&v.h.length),число:v&&v.h?v.h.length:0};});
 await p.reload();await p.waitForTimeout(800);
 const г2=await p.evaluate(()=>{const h0=Mater._harb;Mater._harb=null;let обход=0;
  /* обход берегов — дорогая часть; готовые гавани её не зовут */
  const t=performance.now();const r=Mater.harbors();const мс=performance.now()-t;
  return {было:!!h0,мс:Math.round(мс),число:Array.isArray(r)?r.length:0,изПамяти:Mater._harb===r};});
 check("1. Гавани считаются один раз, запоминаются и после перезагрузки берутся готовыми",
  г1.посчитаны&&г1.запомнены&&г2.число===г1.число&&г2.изПамяти&&г2.мс<60,{г1,г2});

 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.effects=1;G.hour=12;try{Speech.primed=true;}catch(_){}
  AE.ensure();Room.ensure();Room.set();
  window.__счёт={отклик:0,свёртка:0};const imp=Room.impulse;Room.impulse=function(){__счёт.отклик++;return imp.apply(this,arguments);};
  const d=Object.getOwnPropertyDescriptor(ConvolverNode.prototype,"buffer");
  Object.defineProperty(ConvolverNode.prototype,"buffer",{configurable:true,get(){return d.get.call(this);},set(v){__счёт.свёртка++;d.set.call(this,v);}});});

 /* ── 2. Шина и готовые узлы ── */
 const ш=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const c=(()=>{for(let x=1000;x<60000;x+=37)for(let y=1000;y<1400;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")return {x,y,cc};}})();
  G.x=c.x;G.y=c.y;enterPlace(c.cc);await w(400);while(activeLayer())closeTopUI();Room.set();
  for(let i=0;i<40&&!(Отклик165.пул.has("vault:0.60")&&Отклик165.пул.has("vault:1.30")&&Небо165._c);i++)await w(200);
  const p0=G.place;return {шина:!!(Room.conv&&Room.conv.__вход165)&&Room.conv instanceof GainNode,ярус:Отклик165.акт&&Отклик165.акт.к,
   ключЯруса:Отклик165.ключ(Room.ak,Room.size),пул:[...Отклик165.пул.keys()],небо:!!Небо165._c,глубина:p0.depth};});
 check("2. Вход отклика — шина; за ней готовы узлы: ярус, тайники — каморка и ходы (заранее), небесный отклик",
  ш.шина&&ш.ярус===ш.ключЯруса&&ш.пул.includes("vault:0.60")&&ш.пул.includes("vault:1.30")&&ш.небо,ш);

 /* ── 3. Лаз туда и обратно — без расчёта ── */
 const л=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const p0=G.place;const o={};
  const ярус=Отклик165.акт.к;__счёт.отклик=0;__счёт.свёртка=0;
  /* тайная палата за кладкой рядом */
  p0.тайник={ключ:"шаг330",sx:p0.x+1,sy:p0.y,от:{x:p0.x,y:p0.y},prop:null,поМесту:true};
  const lv=secretRoomLevel(p0);p0.x=lv.entry.x;p0.y=lv.entry.y;
  let t=performance.now();Room.set();o.входМс=Math.round(performance.now()-t);o.внутри=Отклик165.акт.к;o.ключПалаты=Отклик165.ключ(Room.ak,Room.size);
  await w(300);
  t=performance.now();exitSecret();o.выходМс=Math.round(performance.now()-t);o.снаружи=Отклик165.акт.к;o.ярус=ярус;
  o.расчётов=__счёт.отклик;o.свёрток=__счёт.свёртка;return o;});
 check("3. Лаз туда и обратно: отклик палаты и яруса готовый — в шаге ни расчёта, ни новой свёртки",
  л.внутри===л.ключПалаты&&л.снаружи===л.ярус&&л.расчётов===0&&л.свёрток===0,л);

 /* ── 4. Новое место: в шаге не строится ── */
 const н=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  __счёт.отклик=0;__счёт.свёртка=0;const было=Отклик165.акт.к;
  Room.set("temple",true);o.сразу={акт:Отклик165.акт.к,расчётов:__счёт.отклик,свёрток:__счёт.свёртка};o.было=было;
  for(let i=0;i<30&&Отклик165.акт.к===было;i++)await w(100);
  o.потом={акт:Отклик165.акт.к,свёрток:__счёт.свёртка};o.пул=Отклик165.пул.size;o.ПУЛ=Отклик165.ПУЛ;
  Room.set(null,true);await w(200);return o;});
 check("4. Новое место: шаг не ждёт новый отклик — звучит прежний, новый готов в простое",
  н.сразу.акт===н.было&&н.сразу.расчётов===0&&н.сразу.свёрток===0&&/^temple:/.test(н.потом.акт)&&н.потом.свёрток===1&&н.пул<=н.ПУЛ,н);

 /* ── 5. Отзвук на месте ── */
 const з=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  for(let i=0;i<30&&Отклик165.акт.к!==Отклик165.ключ(Room.ak,Room.size);i++)await w(100);
  const ярус=Отклик165.акт;o.ярусСек=ярус.c.buffer.duration;
  const h=ЗвукСреда.играть(Bank.url("deep_stone"),{gain:0.3,wet:0.6});o.вход=!!(h&&h.канал.wetTo===Room.conv);try{h.стоп();}catch(_){}
  const палата=[...Отклик165.пул.values()].find(e=>/^vault:/.test(e.к));o.палатаСек=палата&&палата.c.buffer.duration;o.пул=[...Отклик165.пул.keys()];
  o.подключён=ярус.вых;return o;});
 check("5. Под сводом звук с отзвуком: канал идёт во вход отклика, у палаты отклик короче яруса",
  з.вход&&з.подключён&&з.палатаСек>0&&з.палатаСек<з.ярусСек,з);

 /* ── 6. Быстрые шаги ── */
 const б=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  const бег=async(n)=>{const dirs=["N","E","S","W"];const r=[];
   for(let i=0;i<n;i++){let dir=dirs[i%4];const стена=dirs.filter(d=>{const v=DIRV[d];return tileAt(curLevel(),G.place.x+v[0],G.place.y+v[1])==="#";});const путь=dirs.filter(d=>!стена.includes(d));
    if(i%2===0&&стена.length)dir=стена[i%стена.length];else if(путь.length)dir=путь[(i>>1)%путь.length];
    while(activeLayer())closeTopUI();if(G.inCombat)endCombat();Actors.list.length=0;
    const t=performance.now();move(dir);r.push(Math.round(performance.now()-t));await w(90);}
   return r;};
  const p0=G.place;
  p0.тайник={ключ:"шаг330b",sx:p0.x+2,sy:p0.y,от:{x:p0.x,y:p0.y},prop:null,поМесту:true};secretRoomCache.delete("шаг330b");
  {const lv=secretRoomLevel(p0);p0.x=lv.entry.x+1;p0.y=lv.entry.y;Room.set();}await w(300);o.палата=await бег(30);
  while(G.place&&G.place.тайник)exitSecret();await w(300);o.ярус=await бег(30);
  const bx=G.x+11,by=G.y+13;G.place={kind:"dungeon",bx,by,stype:"cave_entrance",name:"Ходы",depth:2,x:3,y:3};Тайны165.слухи()[placeKey(bx,by,2)]=1;
  G.place.тайник={ключ:"шаг330c",sx:5,sy:5,от:{x:3,y:3},prop:null,поМесту:true};
  {const L=curLevel();G.place.x=L.entry.x;G.place.y=L.entry.y;const к=L.комплекс165;o.комплекс=!!к;if(к){к.встречи.length=0;к.выход=null;}Room.set();}await w(600);
  o.ход=await бег(30);
  const все=[...o.палата,...o.ярус,...o.ход];o.макс=Math.max(...все);o.ср=Math.round(все.reduce((a,b)=>a+b,0)/все.length);
  return {макс:o.макс,ср:o.ср,комплекс:o.комплекс,палата:Math.max(...o.палата),ярус:Math.max(...o.ярус),ход:Math.max(...o.ход)};});
 check("6. Быстрые шаги по палате, ярусу и тайному ходу (с упором в стены) не держат игру",
  б.макс<333&&б.ср<60,б);

 check("7. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();

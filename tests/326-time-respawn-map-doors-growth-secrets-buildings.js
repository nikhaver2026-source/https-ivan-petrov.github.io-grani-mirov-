/* ════════════════════════════════════════════════════════════════════════
   НАБОР 326: ЧАСЫ, ВОЗРОЖДЕНИЕ, КАРТА И МЕТКИ, ДВЕРИ, РОСТ ТВАРЕЙ, РЕЖИССЁР,
   ТАЙНЫЕ ХОДЫ, ЗДАНИЯ ПОСЕЛЕНИЙ (после 16.0)

   1. Часы по реальному времени: шаг внутри места часов не двигает (как шаг
      по миру); дело, что нарочно стоит времени, и сон — двигают.
   2. Возрождение: павший в подземелье у деревни очнулся на дороге у этой
      деревни, за околицей, а не у столицы.
   3. Двери: в домах и подземельях нет дверей на колене коридора, посреди
      пола и в глухой стене — всякая дверь — проём с проходом по обе стороны,
      и ни одна не ведёт в тупик в одну-две клетки («два шага — и стена»).
      В городе дверь на развилке перегородок внутри квартала стала аркой;
      двери в стенах кварталов и в тюрьме — не глухие.
   4. Клавиша действия (E) открывает дверь вплотную, даже если последний шаг
      был не к ней.
   5. Shift+G — карта с координатами: стрелки двигают точку и называют, что
      там; Enter — маяк; M — метка. Ctrl+G — список меток; выбор — маяк.
   6. Рост тварей: род с опытом растёт ступенями и учит навыки; в бою тварь
      сильнее и с навыками.
   7. Режиссёр Грани: пульс решает и учится; новые руки (вожак рода и др.).
   8. Тайный ход ведёт в целое место: комнаты, встречи, находка, лаз; шаг к
      твари — бой; победа очищает встречу.
   9. Здания: в деревне — трактир-здание (стойка, очаг, жители); в большом
      городе — аптека, кузница, храм и другие; вещь здания — своя.
   10. Жители зданий: бард предлагает песню.
   11. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){window.__said.push(String(t));return s0(t,o);};
  settings.clock="real";});

 /* ── 1. Часы ── */
 const ч=await p.evaluate(()=>{const o={};
  /* деревня рядом — для шагов внутри места */
  let v=null;for(let r=1;r<200&&!v;r++)for(let dx=-r;dx<=r&&!v;dx++)for(const dy of [-r,r]){const s=isCityAt(G.x+dx,G.y+dy);if(s&&s.type==="village"){v=s;break;}}
  window.__v=v;if(!v)return {нет:true};
  G.x=v.x;G.y=v.y;enterPlace(cellContent(v.x,v.y));while(activeLayer())closeTopUI();
  const t0=Часы165.abs();
  for(const d of ["E","E","S","N","W"])moveInside(d);
  o.шаги=Math.round((Часы165.abs()-t0)*1000)/1000;
  /* дело, что нарочно стоит времени (передышка, обыск, ремесло), — как прежде */
  propTime(1);refresh();o.дело=Math.round((Часы165.abs()-t0)*1000)/1000;
  G.hour=(Number(G.hour)||0)+8;refresh();o.сон=Math.round((Часы165.abs()-t0)*100)/100;
  return o;});
 check("1. Часы: шаги внутри места времени не стоят; дело и сон — стоят",ч.шаги===0&&ч.дело>=0.5&&ч.сон>=8.4,ч);

 /* ── 2. Возрождение у деревни ── */
 const в=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const v=window.__v;if(!v)return {нет:true};
  leavePlace();while(activeLayer())closeTopUI();
  /* «подземелье» у деревни: место с глубиной у самой деревни */
  G.place={kind:"dungeon",bx:v.x,by:v.y,stype:"cave_entrance",name:"Пещера у деревни",depth:1,x:1,y:1};
  const m={...MONSTERS[0],lvl:1,hp:10,dmg:1,xp:1,gold:1};startCombat({x:G.x,y:G.y,monster:m});await w(100);
  window.__said.length=0;defeat();await w(300);
  const d=Math.max(Math.abs(G.x-v.x),Math.abs(G.y-v.y));
  return {d,место:!!G.place,сказано:window.__said.filter(s=>/очнулись/.test(s)).slice(0,2),имя:v.name};});
 check("2. Возрождение: у деревни, за околицей, на дороге",!в.нет&&!в.место&&в.d>=1&&в.d<=3&&в.сказано.some(s=>s.includes(в.имя)&&/околицей|стенами/.test(s)),в);

 /* ── 3. Двери в домах и подземельях ── */
 const д=await p.evaluate(()=>{const плохо=[],тупики=[];let всего=0,мест=0;const тв=t=>t===undefined||t==="#"||t==="%";
  const виды=[["tavern",0],["temple",0],["ruins",1],["cave_entrance",2],["forge",0],["market",0],["village",0],["castle",0]];
  for(let i=0;i<30;i++)виды.forEach(([st,dep],j)=>{
    /* кэш уровней держит место по координатам и глубине: у каждого рода свои координаты */
    const bx=G.x+i*37+j*1009+500,by=G.y-i*53-j*977-500;
    const lvl=genLevel(bx,by,dep,st);мест++;const g=lvl.g;
    const T=(a,b)=>g[b]&&g[b][a];
    /* за дверью не тупик в одну-две клетки голого пола */
    const тупик=(x,y,sx,sy)=>{const был=new Set([x+","+y,sx+","+sy]);const q=[[sx,sy]];let n=1,голо=g[sy][sx]===".";
     while(q.length){const [cx,cy]=q.shift();for(const [dx,dy] of [[0,-1],[0,1],[1,0],[-1,0]]){const nx=cx+dx,ny=cy+dy,k=nx+","+ny;if(был.has(k)||тв(T(nx,ny)))continue;был.add(k);n++;if(T(nx,ny)!==".")голо=false;if(n>2)return false;q.push([nx,ny]);}}
     return голо;};
    for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++){if(g[y][x]!=="+")continue;всего++;
     const n=!тв(T(x,y-1)),s=!тв(T(x,y+1)),e=!тв(T(x+1,y)),ww=!тв(T(x-1,y));
     if([n&&[x,y-1],s&&[x,y+1],e&&[x+1,y],ww&&[x-1,y]].some(c=>c&&тупик(x,y,c[0],c[1]))){тупики.push({st,dep,x,y});continue;}
     /* в городе дверь в стене квартала (с улицы — с угла) и двери тюрьмы — свои: их держит город; прочие — проёмы */
     if(lvl.kind==="city"){const b=(lvl.blocks||[]).find(q=>x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1);
      if(!b||x===b.x0||x===b.x1||y===b.y0||y===b.y1||/тюрем/i.test(String(b.special||""))){if(n+s+e+ww<2)плохо.push({st,dep,x,y,глухая:1});continue;}}
     const ок=(n&&s&&!e&&!ww)||(e&&ww&&!n&&!s);if(!ок)плохо.push({st,dep,x,y});}});
  return {мест,всего,плохо:плохо.length,пример:плохо.slice(0,3),тупиков:тупики.length,тупик:тупики.slice(0,3)};});
 check("3. Двери: всякая дверь — проём с проходом по обе стороны, и за ней не тупик в шаг-два",д.всего>200&&д.плохо===0&&д.тупиков===0,д);

 /* ── 4. Клавиша E у двери ── */
 const е=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  let цель=null,lvl=null;
  for(let i=0;i<30&&!цель;i++){G.place={kind:"house",bx:G.x+7777+i*13,by:G.y+7771+i*7,stype:"tavern",name:"Тестовая таверна",depth:0,x:1,y:1};
   lvl=curLevel();
   for(let y=1;y<lvl.h-1&&!цель;y++)for(let x=1;x<lvl.w-1&&!цель;x++){if(lvl.g[y][x]!=="+"||placeMark(x,y)==="open")continue;
    for(const [dir,dx,dy] of [["N",0,-1],["S",0,1],["W",-1,0],["E",1,0]]){const sx=x-dx,sy=y-dy;if(lvl.g[sy]&&lvl.g[sy][sx]==="."){цель={x:sx,y:sy,dir,dx:x,dy:y};break;}}}}
  if(!цель)return {нет:true};
  G.place.x=цель.x;G.place.y=цель.y;lastMoveDir=цель.dir==="N"?"S":"N";G.place.door147=null;Look.target=null;
  window.__said.length=0;KB_BY_ID.interact.run();await w(500);
  const открыто=placeMark(цель.dx,цель.dy)==="open";const м=document.getElementById("modal-event");
  const o={открыто,окно:!!(м&&!м.hidden),сказано:window.__said.slice(0,3)};while(activeLayer())closeTopUI();return o;});
 check("4. E открывает дверь вплотную (или спрашивает, постучаться ли)",!е.нет&&(е.открыто||е.окно),е);

 /* ── 5. Карта с координатами и метки ── */
 const к=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.place=null;while(activeLayer())closeTopUI();
  const o={};KB_BY_ID.mapcoords.run();await w(100);const m=document.getElementById("modal-karta165");o.открыта=!!(m&&!m.hidden);
  const x0=Карта165.x;const key=(k,mod)=>document.dispatchEvent(new KeyboardEvent("keydown",Object.assign({key:k,code:k,bubbles:true},mod||{})));
  window.__said.length=0;key("ArrowRight");await w(50);key("ArrowRight",{shiftKey:true});await w(50);
  o.dx=Карта165.x-x0;o.сказано=window.__said.filter(s=>/^X \d+, Y \d+/.test(s)).slice(0,2);
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"m",code:"KeyM",bubbles:true}));await w(50);
  o.меток=Карта165.метки().length;
  setCursor(null);uiCursor=null;document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));await w(100);
  o.маяк=!!(TargetBeacon.t&&TargetBeacon.t.x===Карта165.x);TargetBeacon.stop(true);
  while(activeLayer())closeTopUI();KB_BY_ID.mymarks.run();await w(100);
  const L=document.getElementById("m165List");o.кнопок=L?L.querySelectorAll('button[data-cmd^="m165:go:"]').length:0;
  const b=L&&L.querySelector('button[data-cmd^="m165:go:"]');if(b)b.click();await w(100);
  o.маяк2=!!TargetBeacon.t;TargetBeacon.stop(true);while(activeLayer())closeTopUI();
  o.клавиши=[KB_BY_ID.mapcoords&&KB_BY_ID.mapcoords.def[0],KB_BY_ID.mymarks&&KB_BY_ID.mymarks.def[0]];
  return o;});
 check("5. Shift+G — карта, стрелки, Enter — маяк, M — метка; Ctrl+G — метки и маяк",к.открыта&&к.dx===11&&к.сказано.length>=1&&к.меток===1&&к.маяк&&к.кнопок===1&&к.маяк2&&к.клавиши[0]==="Shift+KeyG"&&к.клавиши[1]==="Ctrl+KeyG",к);

 /* ── 6. Рост тварей ── */
 const р=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const base=MONSTERS.find(m=>m.id==="goblin");const z=Рост165.опыт(base,200,"проверка");
  const m={...base,lvl:3,hp:50,dmg:8,xp:40,gold:10};G.place=null;startCombat({x:G.x,y:G.y,monster:m});await w(100);
  const cm=G.combat&&G.combat.m;const o={ступень:z&&z.ступень,навыки:z&&z.навыки.slice(),hp:cm&&cm.hp,ур:cm&&cm.lvl,нав:cm&&cm.навыки165};
  endCombat();while(activeLayer())closeTopUI();return o;});
 check("6. Рост: ступень, навыки разумного рода; тварь в бою сильнее",р.ступень>=5&&р.навыки.length>=2&&р.hp>50&&р.ур>3&&Array.isArray(р.нав)&&р.нав.length>=2,р);

 /* ── 7. Режиссёр ── */
 const р7=await p.evaluate(()=>{const o={};o.руки=["champion","secret","calm","growth"].every(a=>NEURO_ARMS.includes(a));
  o.пульс=Режиссёр165.пульс();o.пульсов=G.dir165.пульсов;o.вожак=Neuro.forge("champion");
  Director.show("Режиссёр",Director.line("проверка"));Neuro.view();
  o.раздел=!!document.querySelector('#dirBody [data-r165]');while(activeLayer())closeTopUI();return o;});
 check("7. Режиссёр: новые руки, пульс, вожак, раздел «Рост тварей»",р7.руки&&р7.пульс&&р7.пульсов>=1&&/вожак/.test(р7.вожак)&&р7.раздел,р7);

 /* ── 8. Тайный ход — целое место ── */
 const т=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  const bx=G.x+11,by=G.y+13;G.place={kind:"dungeon",bx,by,stype:"cave_entrance",name:"Тестовые ходы",depth:2,x:3,y:3};
  Тайны165.слухи()[placeKey(bx,by,2)]=1;
  G.place.тайник={ключ:"тест165",sx:5,sy:5,от:{x:3,y:3},prop:null,поМесту:true};
  const lvl=curLevel();o.комплекс=!!lvl.комплекс165;o.комнат=lvl.rooms.length;o.ширина=lvl.w;
  o.лаз=lvl.g[lvl.entry.y][lvl.entry.x];o.находка=lvl.g[lvl.находка.y][lvl.находка.x];
  const к=lvl.комплекс165;o.встреч=к.встречи.length;o.вид=к.вид.n;
  const i=к.встречи.findIndex(z=>z.род!=="квест");
  if(i>=0){const z=к.встречи[i];G.place.x=z.x-1;G.place.y=z.y;if(lvl.g[z.y][z.x-1]==="#"){G.place.x=z.x;}
   Тайны165.шаг();await w(100);o.бой=!!G.inCombat;o.противник=G.combat&&G.combat.m&&G.combat.m.n;
   if(G.inCombat){G.combat.hp=0;victory();await w(300);}
   o.очищено=Тайны165.очищено(к,i);}
  while(activeLayer())closeTopUI();if(G.inCombat)endCombat();delete G.place.тайник;G.place=null;
  return o;});
 check("8. Тайный ход: целое место (комнаты, встречи, лаз, находка); тварь — бой; победа очищает",т.комплекс&&т.комнат>=5&&т.лаз==="Q"&&т.находка==="O"&&т.встреч>=1&&т.бой&&т.очищено,т);

 /* ── 9–10. Здания поселений ── */
 const з=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};const v=window.__v;
  const lv=genLevel(v.x,v.y,0,"village");const тр=lv.blocks.find(b=>b.здание165&&b.здание165.id==="трактир");
  o.трактир=тр&&тр.name;let V=0,X=0,N=0;
  if(тр)for(let y=тр.y0;y<=тр.y1;y++)for(let x=тр.x0;x<=тр.x1;x++){const t=lv.g[y][x];if(t==="V")V++;if(t==="X")X++;if(t==="N")N++;}
  o.V=V;o.X=X;o.N=N;
  const emp=empireAt(G.x,G.y);const cap=genLevel(emp.cap.x,emp.cap.y,0,"castle");
  o.здания=cap.blocks.filter(b=>b.здание165).map(b=>b.здание165.id);
  /* вещь здания и бард */
  G.place={kind:"city",bx:v.x,by:v.y,stype:"village",name:v.name,depth:0,x:1,y:1};const lvl=curLevel();
  const оч=Object.entries(lvl.пропы165).find(([k,id])=>id==="hearth");if(оч){const [x,y]=оч[0].split(",").map(Number);o.очаг=propAt(x,y).id;}
  const бард=Object.entries(lvl.жители165).find(([k,ж])=>ж.роль==="бард");
  if(бард){const [x,y]=бард[0].split(",").map(Number);talkInside("N",x,y);await w(150);
   const body=document.getElementById("eventBody");o.песня=!!(body&&/Попросить песню/.test(body.textContent));}
  while(activeLayer())closeTopUI();G.place=null;return o;});
 check("9. Деревня: трактир-здание — стойка, вещи, жители; столица — аптека, кузница, храм и др.",!!з.трактир&&з.V===1&&з.X>=6&&з.N>=3&&з.здания.length>=5&&з.здания.includes("аптека")&&з.здания.includes("кузница")&&з.очаг==="hearth",з);
 check("10. Бард в трактире предлагает песню",з.песня===true,з);

 check("11. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();

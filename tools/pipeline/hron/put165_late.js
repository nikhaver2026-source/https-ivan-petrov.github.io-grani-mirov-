/* ════════════════════════════════════════════════════════════════════════
   ПУТЬ И ЧАСЫ (после 16.0)
   Просьбы игрока: «привяжи игру к реальному времени — сейчас время идёт
   слишком быстро»; «возрождается не в цитадели, не в городе, не в таверне, а
   за стенами, на дороге у ближайшего поселения; вошёл в подземелье в
   деревне — у деревни и очнулся»; «в приложении под Windows двери — на E»;
   «Shift+G — карта с координатами: что на них находится, и маяк туда»;
   «Ctrl+G — карта меток: свои метки сохраняются, их можно просмотреть и,
   выбрав, дойти по маяку»; «проходишь в дверь — два шага, и стена: проверь
   все двери».
   1. Часы. По реальным часам (так по умолчанию) мир и так шёл с вашим
      временем, и шаг по миру времени не стоил, но каждый шаг внутри города,
      дома и подземелья прибавлял ещё пять минут: сто шагов по ярусу — девять
      часов, за вечер игры проходили дни. Теперь шаг внутри места, как и шаг
      по миру, времени не стоит — оно идёт само. Дела, что нарочно стоят
      времени (передышка у очага, обыск, ремесло, сон, дорога), — как прежде:
      иначе лечиться у очага можно было бы бесконечно и даром. Режим «по
      шагам» — как прежде.
   2. Возрождение. Павший очнётся под открытым небом, на дороге у ближайшего
      к месту гибели поселения — деревни, порта, крепости, города, — за его
      стенами или околицей. Пал в подземелье, в доме, в чертоге — ищется
      поселение у входа в это место. Нет поселения в шестидесяти шагах — у
      стен столицы, как прежде.
   3. Двери на E. Клавиша действия (E, Enter) открывает дверь вплотную, даже
      если последний шаг был не в её сторону; дверей несколько — та, что по
      ходу, иначе игра называет, где они. Подсказки у дверей в приложении
      говорят «E», а не «двойное касание».
   4. Двери без тупиков. Генератор комнат ставил дверь на колене коридора, а
      иногда посреди пола или в глухую стену: шагнул в проём — и упёрся в
      камень. Теперь всякая дверь — проём в стене с проходом по обе стороны;
      дверь на колене переносится на прямой участок рядом, лишняя снимается,
      глухая заложена.
   5. Shift+G — карта с координатами (мира снаружи, места внутри); Ctrl+G —
      метки. Метки хранятся в сохранении героя.
   ════════════════════════════════════════════════════════════════════════ */

/* ── 1. Часы мира идут с реальным временем ── */
const Часы165={
 ШАГ:0.12,
 abs(){return ((Number(G.day)||1)-1)*24+(Number(G.hour)||0);},
 set(t){t=Math.max(0,Number(t)||0);G.day=1+Math.floor(t/24);G.hour=t-(G.day-1)*24;},
 on(){return safeFn(()=>Clock.mode(),"real")!=="steps";},
 /* шаг: его прибавка (до 0,12 часа) снимается; больше — событие на шаге (ловушка, переход) — остаётся,
    без цены самого шага */
 шаг(до){try{if(!this.on()||!Number.isFinite(до))return false;const d=this.abs()-до;
  if(d>1e-6&&d<=this.ШАГ){this.set(до);return true;}
  if(d>this.ШАГ){this.set(this.abs()-0.09);return true;}return false;}catch(_){return false;}}};
const обёртка165=(w,f0)=>{try{Object.defineProperty(w,"toString",{value:function(){return String(f0);},configurable:true,writable:true});}catch(_){}return w;};
safeFn(()=>{const m0=moveInside;moveInside=обёртка165(function(){const до=Часы165.abs();const r=m0.apply(this,arguments);Часы165.шаг(до);return r;},m0);});
safeFn(()=>{if(CLOCK_MODES.real)CLOCK_MODES.real.о="час мира — час на ваших часах; шаги времени не тратят, его двигают дела, сон и дорога";});

/* ── 2. Возрождение у ближайшего поселения ── */
const Возрождение165={
 R:60,
 /* ближайшее поселение — кольцами от точки */
 поселение(x0,y0){
  for(let r=0;r<=this.R;r++){
   const кл=[];
   if(r===0)кл.push([x0,y0]);
   else{for(let dx=-r;dx<=r;dx++){кл.push([x0+dx,y0-r]);кл.push([x0+dx,y0+r]);}
    for(let dy=-r+1;dy<=r-1;dy++){кл.push([x0-r,y0+dy]);кл.push([x0+r,y0+dy]);}}
   for(const [x,y] of кл){const s=safeFn(()=>isCityAt(x,y),null);if(s)return s;}}
  return null;},
 вода(x,y){const t=safeFn(()=>terrainAt(x,y),null);const id=String((t&&(t.id||t[0]))||"");return /sea|ocean|lake|river|water|deep|reef/.test(id);},
 /* клетка за стенами: сперва дорога у самых ворот, потом любая открытая земля */
 точка(s){const кан=[];
  for(let r=1;r<=3;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=s.x+dx,y=s.y+dy;
   if(x<0||y<0||x>=WORLD_MAX||y>=WORLD_MAX)continue;
   const c=safeFn(()=>cellContent(x,y),null);if(!c||c.structure||this.вода(x,y))continue;
   const дор=!!safeFn(()=>roadAt(x,y),false);кан.push({x,y,дор,r});}
  кан.sort((a,b)=>((b.дор?1:0)-(a.дор?1:0))||(a.r-b.r));
  const лучш=кан.find(k=>k.дор&&k.r<=2)||кан[0];return лучш||null;},
 цель(){
  if(G.dark||G.ship)return null;
  const p=G.place;const x0=p?Number(p.bx):Number(G.x),y0=p?Number(p.by):Number(G.y);
  if(!Number.isFinite(x0)||!Number.isFinite(y0))return null;
  const s=this.поселение(x0,y0);if(!s)return null;const т=this.точка(s);if(!т)return null;
  return {s,x:т.x,y:т.y,дор:т.дор};},
 слова(ц){const s=ц.s;const где=safeFn(()=>dirAtWord(s.x-ц.x,s.y-ц.y),"рядом")||"рядом";
  const за=s.type==="village"?"за околицей":"за стенами";
  return `Вы очнулись под открытым небом, ${ц.дор?"на дороге":"у дороги"} ${за}: ${s.name} — ${где}, в шаге.`;}};
safeFn(()=>{const d0=defeat;defeat=обёртка165(function(){
 const ц=safeFn(()=>Возрождение165.цель(),null);
 if(!ц)return d0.apply(this,arguments);
 const n0=Speech.say;let сказано=false;
 Speech.say=function(t){
  if(typeof t==="string"&&/^Поражение\.\.\. Вы очнулись у стен столицы/.test(t)){сказано=true;
   t=t.replace(/Вы очнулись у стен столицы «[^»]*», под открытым небом\./,Возрождение165.слова(ц));}
  const a=Array.prototype.slice.call(arguments);a[0]=t;return n0.apply(Speech,a);};
 let r;try{r=d0.apply(this,arguments);}finally{Speech.say=n0;}
 if(сказано&&!G.place){
  /* дальний путь: поражение — не дорога; поручения «в путь» сдвигаются вместе с героем (как при переносе к столице) */
  safeFn(()=>{const dx=ц.x-G.x,dy=ц.y-G.y;(Director.st2().q||[]).forEach(q=>{if(q&&q.type==="travel"&&Number.isFinite(q.x)){q.x+=dx;q.y+=dy;}});});
  G.x=ц.x;G.y=ц.y;G.respawn165={x:ц.x,y:ц.y,имя:ц.s.name,день:Number(G.day)||1};
  safeFn(()=>contentCache&&contentCache.delete&&contentCache.delete(ц.x+","+ц.y));
  safeFn(()=>{const c=cellContent(G.x,G.y);Play.stopKey("amb0");if(settings.effects)Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});bankUpdateAmbient();});
  safeFn(()=>journal(`Очнулись после поражения у поселения: ${ц.s.name}.`));
  safeFn(()=>refresh());safeFn(()=>saveGame(true));}
 return r;},d0);});

/* ── 3. Двери на E ── */
const ДверьE165={
 /* все двери вплотную: проём, сокровищница, городские ворота */
 вокруг(){const p=G.place;const lvl=p&&safeFn(()=>curLevel(),null);if(!lvl||p.тайник)return [];
  const все=[];for(const dir of ["N","E","S","W"]){const v=DIRV[dir];const x=p.x+v[0],y=p.y+v[1];const raw=lvl.g[y]&&lvl.g[y][x];
   if(raw==="+"||raw==="Y")все.push({x,y,dir,вид:raw==="Y"?"сокровищница":"дверь"});
   else if(raw==="G"&&p.kind==="city")все.push({x,y,dir,вид:"ворота"});}
  return все;},
 цельВплотную(){try{const t=Look&&Look.target;const p=G.place;if(!t||!p)return false;
  return Math.max(Math.abs((t.x||0)-p.x),Math.abs((t.y||0)-p.y))<=1;}catch(_){return false;}},
 /* E: дверь по ходу, а если одна — любая; несколько и ни одной по ходу — назвать */
 нажать(){
  if(!gameActive()||G.ship||G.inCombat||!G.place||G.place.тайник)return false;
  if(safeFn(()=>somethingHere(),false)||this.цельВплотную())return false;
  if(safeFn(()=>Двери147.рядом(),null))return false;
  const все=this.вокруг();if(!все.length)return false;
  const поХоду=все.find(d=>d.dir===lastMoveDir);
  /* рядом житель, вещь или сундук, а дверь не по ходу — E для них, как прежде */
  if(!поХоду){const рядом=(safeFn(()=>nearFeatures(1),[])||[]).filter(o=>o&&o.d===1&&!/двер|ворот|сокровищниц/i.test(String(o.name||"")));if(рядом.length)return false;}
  let z=поХоду||(все.length===1?все[0]:null);
  if(!z){narrate(`Двери рядом: ${все.map(d=>(d.вид==="ворота"?"ворота ":d.вид==="сокровищница"?"сокровищница ":"")+dirWhere(d.dir)).join(", ")}. Шагните к нужной — упрётесь в неё, и E откроет её.`,{interrupt:true});return true;}
  if(z.вид==="дверь"){const дом=safeFn(()=>Двери147.дом(z),null);if(дом)z.дом=дом;}
  safeFn(()=>{G.place.door147=z;});
  return !!safeFn(()=>Двери147.действие(z),false);},
 /* подсказки у дверей в приложении: клавиша вместо касания */
 слова(t){if(typeof t!=="string"||!/двер|ворот|сокровищниц|створк|лаз/i.test(t))return t;
  return t.replace(/Двойное касание — /g,"Клавиша E — ").replace(/двойное касание — /g,"клавиша E — ")
   .replace(/Коснитесь дважды ещё раз/g,"Нажмите E ещё раз").replace(/коснитесь дважды ещё раз/g,"нажмите E ещё раз")
   .replace(/Коснитесь дважды/g,"Нажмите E").replace(/коснитесь дважды/g,"нажмите E")
   .replace(/по двойному касанию/g,"по клавише E").replace(/двойным касанием/g,"клавишей E")
   .replace(/Двойное касание/g,"Клавиша E").replace(/двойное касание/g,"клавиша E");}};
safeFn(()=>{const n0=Speech.say;Speech.say=function(t){
 if(typeof t==="string"&&safeFn(()=>isDesktopApp(),false)){const a=Array.prototype.slice.call(arguments);a[0]=ДверьE165.слова(t);return n0.apply(Speech,a);}
 return n0.apply(Speech,arguments);};});

/* ── 4. Двери без тупиков: проверка и починка каждого уровня ── */
const ДвериПорядок165={
 твёрдо(t){return t===undefined||t==="#"||t==="%";},
 проход(t){return t!==undefined&&t!=="#"&&t!=="%";},
 починить(lvl){
  try{
   if(!lvl||lvl._двери165||!Array.isArray(lvl.g)||lvl.тайник)return lvl;
   const g=lvl.g,h=g.length;if(!h||!Array.isArray(g[0]))return lvl;
   lvl._двери165=1;const w=g[0].length;
   const T=(x,y)=>(y>=0&&y<h&&x>=0&&x<(g[y]?g[y].length:0))?g[y][x]:undefined;
   const P=(x,y)=>this.проход(T(x,y)),S=(x,y)=>this.твёрдо(T(x,y));
   const проём=(x,y)=>(P(x,y-1)&&P(x,y+1)&&S(x-1,y)&&S(x+1,y))||(P(x-1,y)&&P(x+1,y)&&S(x,y-1)&&S(x,y+1));
   const открыто=(x,y)=>[[0,-1],[0,1],[1,0],[-1,0]].filter(([dx,dy])=>P(x+dx,y+dy)).length;
   /* у особой клетки (шов, тварь, лестница, вещь) дверь не ставится: вокруг проёма — только пол и стены */
   const особоеРядом=(x,y)=>[[0,-1],[0,1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].some(([dx,dy])=>{const t=T(x+dx,y+dy);return t!==undefined&&t!=="."&&t!=="#"&&t!=="%";});
   const дверьРядом=(x,y)=>[[0,-1],[0,1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].some(([dx,dy])=>T(x+dx,y+dy)==="+");
   /* у комнаты: по одну сторону проёма — простор (три и больше открытых соседей) */
   const уКомнаты=(x,y)=>[[0,-1],[0,1],[1,0],[-1,0]].some(([dx,dy])=>P(x+dx,y+dy)&&открыто(x+dx,y+dy)>=3&&g[y+dy][x+dx]!=="+");
   const st={верно:0,перенесено:0,снято:0,глухих:0,ниш:0};
   /* ниша у двери: клетка пола, из которой только и выхода, что в дверь (щель в стене рядом с проёмом) —
      заделать, и дверь становится проёмом */
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(g[y][x]!=="+"||проём(x,y))continue;
    for(const [dx,dy] of [[0,-1],[0,1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy;if(T(nx,ny)!==".")continue;
     const выходы=[[0,-1],[0,1],[1,0],[-1,0]].filter(([ex,ey])=>P(nx+ex,ny+ey));
     if(выходы.length===1){g[ny][nx]="#";st.ниш++;}}}
   /* дверь в тупик: за проёмом одна-две клетки голого пола и стена — «два шага, и стена». Такую дверь
      и её закуток заложить */
   st.тупиков=0;
   const сторона=(x,y,sx,sy)=>{const был=new Set([x+","+y,sx+","+sy]);const q=[[sx,sy]];const кл=[[sx,sy]];
    while(q.length){const [cx,cy]=q.shift();for(const [dx,dy] of [[0,-1],[0,1],[1,0],[-1,0]]){const nx=cx+dx,ny=cy+dy,k=nx+","+ny;
     if(был.has(k)||!P(nx,ny))continue;был.add(k);кл.push([nx,ny]);if(кл.length>2)return null;q.push([nx,ny]);}}
    return кл;};
   const тупики=()=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(g[y][x]!=="+"||!проём(x,y))continue;
    for(const [dx,dy] of [[0,-1],[0,1],[1,0],[-1,0]]){if(!P(x+dx,y+dy))continue;const кл=сторона(x,y,x+dx,y+dy);
     if(кл&&кл.every(([cx,cy])=>g[cy][cx]===".")){кл.forEach(([cx,cy])=>{g[cy][cx]="#";});g[y][x]="#";st.тупиков++;break;}}}};
   тупики();
   /* город — кварталы со своими дверями и службами (тюрьма, ворота): двери в стенах кварталов не трогать;
      дверь внутри квартала на развилке перегородок (две двери подряд, щель в стене) — не дверь, а арка:
      проход остаётся, а дверь, которую нечем закрыть, снимается */
   if(lvl.kind==="city"){st.арок=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(g[y][x]!=="+"||проём(x,y))continue;
     const b=(lvl.blocks||[]).find(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1);if(!b||/тюрем|тюрьм/i.test(String(b.special||"")))continue;
     g[y][x]=".";st.арок++;}
    lvl.двери165=st;return lvl;}
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(g[y][x]!=="+")continue;
    if(проём(x,y)){st.верно++;continue;}
    if(открыто(x,y)<=1){g[y][x]="#";st.глухих++;continue;}
    /* дверь на колене, на развилке или посреди пола: снять и поставить в ближний проём у комнаты */
    g[y][x]=".";
    const был=new Set([x+","+y]);let q=[[x,y,0]];const кан=[];
    while(q.length){const [cx,cy,d]=q.shift();if(d>=8)continue;
     for(const [dx,dy] of [[0,-1],[0,1],[1,0],[-1,0]]){const nx=cx+dx,ny=cy+dy,k=nx+","+ny;if(был.has(k)||!P(nx,ny))continue;был.add(k);
      if(g[ny][nx]==="."&&проём(nx,ny)&&!дверьРядом(nx,ny)&&!особоеРядом(nx,ny))кан.push({x:nx,y:ny,d:d+1,к:уКомнаты(nx,ny)?0:1});
      q.push([nx,ny,d+1]);}}
    кан.sort((a,b2)=>(a.к-b2.к)||(a.d-b2.d));
    if(кан.length){g[кан[0].y][кан[0].x]="+";st.перенесено++;}else st.снято++;}
   тупики();
   lvl.двери165=st;
  }catch(_){}
  return lvl;}};
/* за дверью: что впереди — комната или ход, сколько шагов и куда поворот */
const ЗаДверью165={
 сказать(dir){const p=G.place;const lvl=p&&safeFn(()=>curLevel(),null);if(!lvl||!DIRV[dir])return "";
  const P=(x,y)=>{const t=safeFn(()=>tileAt(lvl,x,y),"#");return t!=="#"&&t!=="%";};
  const v=DIRV[dir];const лев={N:"W",W:"S",S:"E",E:"N"}[dir],прав={N:"E",E:"S",S:"W",W:"N"}[dir];
  let x=p.x,y=p.y,шаг=0;while(шаг<15&&P(x+v[0],y+v[1])){x+=v[0];y+=v[1];шаг++;}
  let просто=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(P(p.x+dx,p.y+dy))просто++;
  const бока=[лев,прав].filter(d=>P(x+DIRV[d][0],y+DIRV[d][1]));
  const где=d=>safeFn(()=>dirWhere(d),"")||"";
  if(просто>=6)return `За дверью комната: до дальней стены ${шаг?stepWords(шаг):"шаг"}${бока.length?`; проходы ${бока.map(где).join(" и ")}`:""}.`;
  if(!шаг&&!бока.length)return "";
  return `За дверью ход: ${шаг?`${stepWords(шаг)} прямо`:"сразу"}${бока.length?`, затем поворот ${бока.map(где).join(" или ")}`:", дальше стена"}.`;}};
safeFn(()=>{const p0=Двери147.пройти.bind(Двери147);Двери147.пройти=function(d){const p=G.place;const x0=p&&p.x,y0=p&&p.y;const r=p0(d);
 safeFn(()=>{const q=G.place;if(q&&!q.тайник&&(q.x!==x0||q.y!==y0)&&d&&d.вид!=="сокровищница"){const t=ЗаДверью165.сказать(d.dir);if(t)setTimeout(()=>safeFn(()=>narrate(t,{interrupt:false})),450);}});
 return r;};});
safeFn(()=>{const g0=genLevel;genLevel=обёртка165(function(){const lvl=g0.apply(this,arguments);return ДвериПорядок165.починить(lvl);},g0);});

/* ── 5. Карта с координатами (Shift+G) и метки (Ctrl+G) ── */
const Карта165={
 x:0,y:0,мир:true,
 метки(){if(!Array.isArray(G.metki165))G.metki165=[];return G.metki165;},
 герой(){return G.place&&!this.мир?{x:G.place.x,y:G.place.y}:{x:G.x,y:G.y};},
 окно(id,заголовок,тело){let m=document.getElementById(id);if(m)return m;
  m=document.createElement("div");m.className="modal";m.id=id;m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
  m.setAttribute("aria-label",заголовок);m.hidden=true;
  m.innerHTML=`<div class="sheet"><header><h2>${заголовок}</h2><button type="button" data-cmd="close">Закрыть</button></header>${тело}</div>`;
  document.body.appendChild(m);return m;},
 q(t){return String(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 /* что на клетке */
 что(x,y){
  if(!this.мир&&G.place){const lvl=safeFn(()=>curLevel(),null);if(!lvl)return "";
   if(x<0||y<0||x>=lvl.w||y>=lvl.h)return "за пределами места";
   const t=safeFn(()=>tileAt(lvl,x,y),"#");if(t==="#")return "стена";
   const s=String(safeFn(()=>tileLabel(t,x,y),tileName(t))||"пол");
   const а=safeFn(()=>(Actors.list||[]).find(a=>a.x===x&&a.y===y),null);
   return а?`${s}; здесь ${а.name||"кто-то"}`:s;}
  if(x<0||y<0||x>=WORLD_MAX||y>=WORLD_MAX)return "край мира";
  const c=safeFn(()=>cellContent(x,y),null);if(!c)return "";
  const части=[];if(c.structure&&c.structure.name)части.push(c.structure.name);
  const т=c.terrain&&c.terrain[1];if(т)части.push(String(т).toLowerCase());
  if(safeFn(()=>roadAt(x,y),false)&&!/дорог/i.test(части.join(" ")))части.push("дорога");
  const emp=c.empire;if(emp&&emp.short)части.push(`держава «${emp.short}»`);
  const м=this.метки().filter(m=>!m.place&&m.x===x&&m.y===y);if(м.length)части.push(`ваша метка «${м[0].n}»`);
  return части.join(", ");},
 где(x,y){const h=this.герой();const dx=x-h.x,dy=y-h.y,d=Math.max(Math.abs(dx),Math.abs(dy));
  if(!d)return "здесь стоите вы";return `${stepWords(d)} ${safeFn(()=>dirAtWord(dx,dy),"")}`.trim();},
 сказать(подробно){const t=`${this.мир?"":"Место: "}X ${this.x}, Y ${this.y}: ${this.что(this.x,this.y)||"пусто"}. ${this.где(this.x,this.y)}.`;
  const el=document.getElementById("k165Cur");if(el)el.textContent=t;
  narrate(t,{interrupt:true,cat:"ui",user:true});return true;},
 открыть(){if(!gameActive())return false;
  this.окно("modal-karta165","Карта с координатами",
   `<p class="hint">Стрелки — на клетку, Shift со стрелкой — на десять, Ctrl — на сто, Alt — на тысячу. Enter — маяк на эту точку, M — сохранить метку, Home — к герою, пробел — повторить. В месте (городе, доме, подземелье) Tab… — кнопки; «Мир или место» — какую карту смотреть.</p>
   <p id="k165Cur" class="list-line" tabindex="0"></p>
   <div class="row">
    <button type="button" data-cmd="k165:beacon">Маяк на эту точку</button>
    <button type="button" data-cmd="k165:mark">Сохранить метку здесь</button>
    <button type="button" data-cmd="k165:home">К герою</button>
    <button type="button" data-cmd="k165:swap">Мир или место</button>
    <button type="button" data-cmd="k165:marks">Мои метки</button></div>
   <div class="row">
    <button type="button" data-cmd="k165:N">На шаг к северу</button><button type="button" data-cmd="k165:S">На шаг к югу</button>
    <button type="button" data-cmd="k165:W">На шаг к западу</button><button type="button" data-cmd="k165:E">На шаг к востоку</button></div>
   <h3>Перейти к координатам</h3>
   <div class="row"><label>X <input id="k165x" type="number" inputmode="numeric"></label>
    <label>Y <input id="k165y" type="number" inputmode="numeric"></label>
    <button type="button" data-cmd="k165:go">Перейти</button></div>
   <div class="row"><label>Имя метки <input id="k165n" type="text" maxlength="60"></label></div>`);
  safeFn(()=>{for(const id of ["k165x","k165y"]){const el=document.getElementById(id);if(el&&!el._k165){el._k165=1;el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();Карта165.перейти();}});}}});
  this.мир=!G.place;const h=this.герой();this.x=h.x;this.y=h.y;
  openModal("modal-karta165",{тихо:true});
  narrate(`Карта с координатами${this.мир?"":" места"}. Вы — X ${this.x}, Y ${this.y}: ${this.что(this.x,this.y)}. Стрелки водят по карте, Enter — маяк, M — метка.`,{interrupt:true,cat:"ui"});
  const el=document.getElementById("k165Cur");if(el)el.textContent=`X ${this.x}, Y ${this.y}`;
  return true;},
 шаг(dx,dy){let nx=this.x+dx,ny=this.y+dy;
  if(this.мир){nx=Math.max(0,Math.min(WORLD_MAX-1,nx));ny=Math.max(0,Math.min(WORLD_MAX-1,ny));}
  else{const lvl=safeFn(()=>curLevel(),null);if(lvl){nx=Math.max(0,Math.min(lvl.w-1,nx));ny=Math.max(0,Math.min(lvl.h-1,ny));}}
  if(nx===this.x&&ny===this.y){safeFn(()=>NavClick.play("edge",{rate:0.7}));narrate("Край карты.",{interrupt:true});return true;}
  this.x=nx;this.y=ny;safeFn(()=>UI.natStep("ui_select",0.4,1));return this.сказать();},
 перейти(){const ex=document.getElementById("k165x"),ey=document.getElementById("k165y");
  const x=Math.round(Number(ex&&ex.value)),y=Math.round(Number(ey&&ey.value));
  if(!Number.isFinite(x)||!Number.isFinite(y)||(ex&&ex.value==="")||(ey&&ey.value==="")){narrate("Впишите оба числа: X и Y.",{interrupt:true});return true;}
  this.x=x;this.y=y;return this.шаг(0,0)&&true;},
 место(){return this.мир?null:safeFn(()=>TargetBeacon.here(),null);},
 /* маяк на точку или метку */
 маяк(t){const here=safeFn(()=>TargetBeacon.here(),null);
  if((t.place||null)!==(here||null)){
   if(!t.place){narrate(`Точка «${t.n}» снаружи, в мире: сначала выйдите${G.place?` из места «${G.place.name}»`:""}, и маяк поведёт туда.`,{interrupt:true});return false;}
   narrate(`Точка «${t.n}» в другом месте${t.placeName?`: ${t.placeName}`:""}. Дойдите туда — и маяк поведёт к ней.`,{interrupt:true});return false;}
  const ok=safeFn(()=>TargetBeacon.start({n:t.n,x:t.x,y:t.y,bid:"chest",проход:true}),false);
  if(!ok){narrate(`Вы уже у точки «${t.n}».`,{interrupt:true});return true;}
  safeFn(()=>{while(activeLayer())closeTopUI();});
  const h=this.герой();const d=Math.max(Math.abs(t.x-h.x),Math.abs(t.y-h.y));
  narrate(`Маяк горит: ${t.n}, ${stepWords(d)} ${safeFn(()=>dirAtWord(t.x-h.x,t.y-h.y),"")}. Клавиша B — где цель, Shift+B — погасить маяк.`,{interrupt:true,cat:"ui"});
  return true;},
 точка(){const что=this.что(this.x,this.y);return {n:`${(что.split(",")[0]||"точка").trim()} (X ${this.x}, Y ${this.y})`,x:this.x,y:this.y,place:this.место()};},
 метить(){const ms=this.метки();const t=this.точка();const nm=(document.getElementById("k165n")||{}).value;
  if(nm&&String(nm).trim())t.n=`${String(nm).trim().slice(0,60)} (X ${t.x}, Y ${t.y})`;
  if(ms.some(m=>m.x===t.x&&m.y===t.y&&(m.place||null)===(t.place||null))){narrate("Здесь метка уже стоит.",{interrupt:true});return true;}
  t.id=(Number(G.metkiN165)||0)+1;G.metkiN165=t.id;t.день=Number(G.day)||1;t.placeName=G.place&&!this.мир?G.place.name:null;
  ms.push(t);if(ms.length>200)ms.shift();
  safeFn(()=>Bank.play("bell_small",{gain:0.7,maxSec:1,kind:"ui",rate:1.1}));
  const el=document.getElementById("k165n");if(el)el.value="";
  narrate(`Метка сохранена: ${t.n}. Всего меток ${ms.length}. Ctrl+G — список меток.`,{interrupt:true,cat:"ui"});
  safeFn(()=>saveGame(true));return true;},
 /* ── окно меток ── */
 списокHTML(){const ms=this.метки();
  if(!ms.length)return `<p class="list-line" tabindex="0">Меток пока нет. Shift+G — карта с координатами, там клавиша M сохраняет метку.</p>`;
  const h=G.place?{x:G.place.x,y:G.place.y}:{x:G.x,y:G.y};const here=safeFn(()=>TargetBeacon.here(),null);
  return ms.map(m=>{const тут=(m.place||null)===(here||null);const d=Math.max(Math.abs(m.x-h.x),Math.abs(m.y-h.y));
   const где=тут?(d?`${stepWords(d)} ${safeFn(()=>dirAtWord(m.x-h.x,m.y-h.y),"")}`:"вы здесь"):(m.place?`в другом месте${m.placeName?`: ${m.placeName}`:""}`:"снаружи, в мире");
   const t=`${m.n}: ${где}.`;
   return `<button type="button" class="item" data-cmd="m165:go:${m.id}" data-speak="${this.q(t+" Enter — маяк туда, Delete — удалить.")}">${this.q(t)}</button>`
    +`<button type="button" data-cmd="m165:del:${m.id}" data-speak="${this.q("Удалить метку "+m.n)}">Удалить</button>`;}).join("");},
 метокОкно(){if(!gameActive())return false;
  const m=this.окно("modal-metki165","Мои метки",`<p class="hint">Enter на метке — маяк туда, Delete — удалить метку. Shift+G — карта с координатами.</p><div id="m165List"></div>`);
  const L=m.querySelector("#m165List");if(L)L.innerHTML=this.списокHTML();
  if(m.hidden)openModal("modal-metki165",{тихо:true});
  const n=this.метки().length;
  narrate(`Мои метки: ${n?`${n} ${plural(n,"метка","метки","меток")}`:"пока нет"}.`,{interrupt:true,cat:"ui"});
  return true;},
 удалить(id){const ms=this.метки();const i=ms.findIndex(m=>String(m.id)===String(id));if(i<0)return false;
  const m=ms.splice(i,1)[0];narrate(`Метка «${m.n}» удалена.`,{interrupt:true});
  const L=document.getElementById("m165List");if(L)L.innerHTML=this.списокHTML();safeFn(()=>saveGame(true));return true;}};
CMD.k165=function(a){const К=Карта165;
 if(a==="N")return К.шаг(0,-1);if(a==="S")return К.шаг(0,1);if(a==="W")return К.шаг(-1,0);if(a==="E")return К.шаг(1,0);
 if(a==="beacon")return К.маяк(К.точка());if(a==="mark")return К.метить();
 if(a==="home"){const h=К.герой();К.x=h.x;К.y=h.y;return К.сказать();}
 if(a==="swap"){if(!G.place){К.мир=true;narrate("Вы снаружи: карта мира.",{interrupt:true});return true;}
  К.мир=!К.мир;const h=К.герой();К.x=h.x;К.y=h.y;narrate(К.мир?"Карта мира.":"Карта места.",{interrupt:true});return К.сказать();}
 if(a==="marks")return К.метокОкно();if(a==="go")return К.перейти();
 /* без слова — открыть карту */
 return К.открыть();};
CMD.m165=function(a){const [что,id]=String(a||"").split(":");const К=Карта165;
 if(что==="go"||что==="del"){const m=К.метки().find(m=>String(m.id)===String(id));
  if(!m){narrate("Такой метки нет. Ctrl+G — список меток.",{interrupt:true});return true;}
  return что==="go"?К.маяк(m):К.удалить(id);}
 return К.метокОкно();};
/* клавиши внутри окон карты */
safeFn(()=>{const w0=keyWindow;keyWindow=function(e,combo,layer){
 try{
  if(layer&&layer.id==="modal-karta165"){const k=e.key;
   const стр={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[k];
   if(стр){e.preventDefault();const мн=e.altKey?1000:e.ctrlKey?100:e.shiftKey?10:1;Карта165.шаг(стр[0]*мн,стр[1]*мн);return true;}
   if(k==="Home"){e.preventDefault();return CMD.k165("home");}
   if(e.code==="KeyM"&&!e.ctrlKey&&!e.altKey){e.preventDefault();return Карта165.метить();}
   if(e.code==="Space"){e.preventDefault();return Карта165.сказать();}
   if(k==="Enter"){const на=uiCursor&&layer.contains(uiCursor)&&uiCursor.dataset&&uiCursor.dataset.cmd&&uiCursor.tagName==="BUTTON";
    if(!на){e.preventDefault();return Карта165.маяк(Карта165.точка());}}}
  if(layer&&layer.id==="modal-metki165"&&e.key==="Delete"){const c=uiCursor&&uiCursor.dataset&&uiCursor.dataset.cmd||"";
   const m=/^m165:(?:go|del):(\d+)$/.exec(c);if(m){e.preventDefault();return Карта165.удалить(m[1]);}}}catch(_){}
 return w0.apply(this,arguments);};});
/* клавиши поля: Shift+G — карта с координатами, Ctrl+G — метки; E — дверь вплотную */
Promise.resolve().then(()=>safeFn(()=>{
 const вставить=(a,после)=>{if(KB_BY_ID[a.id])return;const i=KB_ACTIONS.findIndex(x=>x.id===после);KB_ACTIONS.splice(i>=0?i+1:KB_ACTIONS.length,0,a);KB_BY_ID[a.id]=a;};
 вставить({id:"mapcoords",g:"Мир",n:"карта с координатами",о:"что на клетке, маяк на точку, метка",def:["Shift+KeyG"],ctx:"field",run:()=>Карта165.открыть()},"where");
 вставить({id:"mymarks",g:"Мир",n:"мои метки",о:"сохранённые метки: маяк к выбранной",def:["Ctrl+KeyG"],ctx:"field",run:()=>Карта165.метокОкно()},"mapcoords");
 const it=KB_BY_ID.interact;if(it&&!it._e165){it._e165=1;const r0=it.run;it.run=function(){if(safeFn(()=>ДверьE165.нажать(),false))return true;return r0.apply(this,arguments);};}}));
/* жесты не трогаем: их карта — тридцать три действия; карта и метки — клавиши приложения (просьба — пока для Windows) */

/* ── 6. Шаг без зависаний (просьба игрока: «при быстром перемещении в лазах, тайных проходах и подземельях шаги
   зависают — проходит время, прежде чем персонаж сделает шаг») ──
   Замер под нагрузкой (процессор вчетверо медленнее, как на телефоне): первый же шаг после загрузки — и в
   подземелье тоже — считал гавани материков (обход берегов вокруг двадцати с лишним точек мира): больше секунды.
   Теперь гавани считаются один раз, в простое, ещё до входа в мир, и запоминаются в браузере — следующие запуски
   берут их готовыми. Подсчёт даров леса возможностей, что звучит на каждом шаге (картина звуков вокруг), берётся
   из короткой памяти, а не перебором всех узлов на каждый вызов. */
const Плавно165={
 КЛЮЧ:"gm165harb",
 гавани(){try{const v=JSON.parse(store.get(this.КЛЮЧ)||"null");
   if(v&&v.w===WORLD_MAX&&Array.isArray(v.h)&&v.h.length&&v.h.every(h=>h&&Number.isFinite(h.x)&&Number.isFinite(h.y)))return v.h;}catch(_){}
  return null;},
 запомнить(h){try{store.set(this.КЛЮЧ,JSON.stringify({w:WORLD_MAX,h}));}catch(_){}}};
safeFn(()=>{const h0=Mater.harbors;Mater.harbors=function(){if(this._harb)return this._harb;
 const v=Плавно165.гавани();if(v){this._harb=v;return v;}
 const r=h0.apply(this,arguments);if(Array.isArray(r)&&r.length)Плавно165.запомнить(r);return r;};});
/* в простое, пока игрок в меню: гавани готовы до первого шага */
safeFn(()=>{const ри=window.requestIdleCallback||(f=>setTimeout(f,1500));
 ри(()=>safeFn(()=>{if(!Mater._harb)Mater.harbors();}),{timeout:6000});});
/* дары леса возможностей: подсчёт на секунду */
safeFn(()=>{const b0=Fore.boonCount;const пам=new Map();let метка=0,открыто=-1;
 Fore.boonCount=function(id){const now=Date.now();const n=safeFn(()=>Object.keys(this.state().открыты||{}).length,-2);
  /* открыт новый узел — память сбрасывается сразу */
  if(now-метка>1000||n!==открыто){пам.clear();метка=now;открыто=n;}
  if(пам.has(id))return пам.get(id);const r=b0.apply(this,arguments);пам.set(id,r);return r;};});

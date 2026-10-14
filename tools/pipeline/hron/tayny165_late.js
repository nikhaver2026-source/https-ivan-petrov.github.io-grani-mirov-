/* ════════════════════════════════════════════════════════════════════════
   ТАЙНЫЕ ХОДЫ ВЕДУТ ДАЛЬШЕ (после 16.0)
   Просьба игрока: «в потайных проходах и залах — наткнуться на квест, босса,
   мини-босса, монстра; большинство тайников — проходы ещё куда-то: тайные
   тоннели, древние катакомбы; не лаз, где взял находку — и всё, а комнаты,
   палаты, залы, туннели, по которым можно ходить, исследовать, находить».
   1. Три из четырёх тайных ходов ведут не в каморку, а в целое место:
      тайный тоннель, древние катакомбы, потайной зал, палаты хранителя,
      контрабандный ход, забытое святилище. Пять-восемь комнат и ходы между
      ними, факелы, сундуки, книги и обстановка, находка — в дальней палате.
   2. В ходах живут: тварь, страж хода (сильнее обычной твари), хозяин
      катакомб (сильнее стража, с богатой добычей), и люди — неупокоенный дух
      (просит найти и упокоить его останки), узник в цепях (просит вывести его
      наружу), отшельник (загадает загадку и отплатит за ответ). Кто впереди —
      слышно за три-четыре шага: рык, шёпот, звон цепи. Шагнули к нему — бой
      или разговор.
   3. Ход уводит дальше: тоннель выводит наружу, в нескольких шагах от входа
      в место (за стены, в лес, к дороге), катакомбы — вниз, в ярус под этим
      местом, мимо стража шахты. Лаз назад, как прежде, у входа.
   4. Отметки (сундуки, рычаги) в ходах — свои, не путаются с комнатами над ними.
   5. Режиссёр Грани разносит слухи о тайных ходах: метка на карте у ближнего
      подземелья или руин, и ход там непременно ведёт в целое место.
   ════════════════════════════════════════════════════════════════════════ */
const ТАЙНЫ_ВИДЫ165=[
 {id:"тоннель",n:"тайный тоннель",о:"узкий ход в сыром камне уводит вдаль",выход:"наружу",комнат:[5,7],звук:"deep_stone"},
 {id:"катакомбы",n:"древние катакомбы",о:"ниши с истлевшими костями тянутся рядами, своды в копоти",выход:"ярус",комнат:[6,8],звук:"wraith_moan"},
 {id:"зал",n:"потайной зал",о:"высокий свод на колоннах, шаг отдаётся далеко",выход:null,комнат:[5,6],звук:"deep_stone"},
 {id:"палаты",n:"палаты хранителя",о:"пустые кельи, полки, след давно ушедшей жизни",выход:"наружу",комнат:[5,7],звук:"deep_door"},
 {id:"контрабанда",n:"контрабандный ход",о:"ящики, верёвки, мешки — здесь носят то, о чём не говорят",выход:"наружу",комнат:[5,7],звук:"deep_door"},
 {id:"святилище",n:"забытое святилище",о:"каменный алтарь под слоем пыли, на стенах полустёртые знаки",выход:"ярус",комнат:[5,6],звук:"magic_shimmer"}];
const ТАЙНЫ_ЛЮДИ165={
 дух:{n:"неупокоенный дух",слышно:"шёпот без голоса",bid:"npc_common"},
 узник:{n:"узник в цепях",слышно:"звон цепи и слабый кашель",bid:"npc_common"},
 отшельник:{n:"отшельник",слышно:"чьё-то бормотание",bid:"npc_common"}};
const ТАЙНЫ_ЗАГАДКИ165=[
 {в:"Что идёт, не двигаясь с места?",о:["Время","Река","Тень"],ok:0},
 {в:"Чем больше из неё берёшь, тем больше она становится. Что это?",о:["Яма","Казна","Ночь"],ok:0},
 {в:"Без рук, без ног, а ворота отворяет. Что это?",о:["Ветер","Ключ","Вор"],ok:0},
 {в:"Что можно сломать, даже не коснувшись?",о:["Слово","Лёд","Печать"],ok:0},
 {в:"Висит груша — нельзя скушать. Что это?",о:["Лампа","Гнездо","Колокол"],ok:0}];
const Тайны165={
 st(){if(!G.tayny165||typeof G.tayny165!=="object"||Array.isArray(G.tayny165))G.tayny165={};return G.tayny165;},
 слухи(){if(!G.taynySluh165||typeof G.taynySluh165!=="object")G.taynySluh165={};return G.taynySluh165;},
 зап(k){const s=this.st();if(!s[k]||typeof s[k]!=="object")s[k]={c:{},квест:{}};const z=s[k];if(!z.c)z.c={};if(!z.квест)z.квест={};return z;},
 R(p,т,i){return hashName(p.bx*7+т.sx*13+i*5,p.by*11+т.sy*17+i*3,16500+i);},
 /* три из четырёх ходов — целое место; где прошёл слух — всегда */
 комплекс(p,т){if(!p||!т)return false;if(this.слухи()[placeKey(p.bx,p.by,p.depth)])return true;return this.R(p,т,1)<0.75;},
 вид(p,т){return ТАЙНЫ_ВИДЫ165[Math.floor(this.R(p,т,2)*ТАЙНЫ_ВИДЫ165.length)%ТАЙНЫ_ВИДЫ165.length];},
 /* план места: комнаты, ходы без дверей, находка в дальней палате */
 план(p,т){
  const R=i=>this.R(p,т,10+i);const вид=this.вид(p,т);
  const w=30+Math.floor(R(1)*10),h=16+Math.floor(R(2)*6);
  const g=[];for(let y=0;y<h;y++)g.push(new Array(w).fill("#"));
  const rooms=[];const n=вид.комнат[0]+Math.floor(R(3)*(вид.комнат[1]-вид.комнат[0]+1));
  /* комнаты вдоль места с запада на восток: путь вглубь, а не клубок */
  const шаг=(w-4)/n;
  for(let i=0;i<n;i++){const rw=4+Math.floor(R(20+i)*3),rh=3+Math.floor(R(30+i)*3);
   const rx=Math.max(1,Math.min(w-rw-1,Math.floor(2+i*шаг+R(40+i)*Math.max(1,шаг-rw)))),ry=1+Math.floor(R(50+i)*(h-rh-2));
   for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)g[y][x]="q";
   rooms.push({x:rx,y:ry,w:rw,h:rh,cx:rx+(rw>>1),cy:ry+(rh>>1)});}
  for(let i=1;i<n;i++){const a=rooms[i-1],b=rooms[i];
   const x1=Math.min(a.cx,b.cx),x2=Math.max(a.cx,b.cx);for(let x=x1;x<=x2;x++)if(g[a.cy][x]==="#")g[a.cy][x]="q";
   const y1=Math.min(a.cy,b.cy),y2=Math.max(a.cy,b.cy);for(let y=y1;y<=y2;y++)if(g[y][b.cx]==="#")g[y][b.cx]="q";}
  /* боковой ход к тупиковой келье — есть что исследовать в стороне */
  if(n>=5){const r=rooms[2];const ky=r.cy<h/2?Math.min(h-3,r.y+r.h+2):Math.max(2,r.y-3);
   for(let y=Math.min(ky,r.cy);y<=Math.max(ky,r.cy);y++)if(g[y]&&g[y][r.cx]==="#")g[y][r.cx]="q";
   for(let x=r.cx-1;x<=r.cx+1;x++)for(let y=ky-1;y<=ky;y++)if(g[y]&&x>0&&x<w-1&&y>0&&y<h-1&&g[y][x]==="#")g[y][x]="q";
   rooms.push({x:r.cx-1,y:ky-1,w:3,h:2,cx:r.cx,cy:ky,келья:true});}
  const r0=rooms[0],rn=rooms[n-1];
  const entry={x:r0.x,y:r0.cy};g[entry.y][entry.x]="Q";
  const нах={x:rn.x+rn.w-1,y:rn.cy};g[нах.y][нах.x]="O";
  const свобод=(x,y)=>g[y]&&g[y][x]==="q";
  const в=(r,dx,dy)=>{const x=r.cx+dx,y=r.cy+dy;return свобод(x,y)?{x,y}:null;};
  /* факел у входа и в каждой второй комнате */
  rooms.forEach((r,i)=>{if(i%2===0){const t=в(r,-1,-1)||в(r,1,-1);if(t)g[t.y][t.x]="T";}});
  /* сундуки, книги, обстановка */
  const кл=[[1,1],[-1,1],[1,0],[0,1]];
  rooms.slice(1).forEach((r,i)=>{const k=R(60+i);const [dx,dy]=кл[i%кл.length];const t=в(r,dx,dy);if(!t)return;
   if(r.келья||k<0.28)g[t.y][t.x]="C";else if(k<0.45&&(вид.id==="палаты"||вид.id==="святилище"||вид.id==="катакомбы"))g[t.y][t.x]="K";else if(k<0.6)g[t.y][t.x]="X";});
  /* встречи: в средних комнатах; хозяин — у самой находки */
  const встречи=[];const ср=rooms.slice(1,n-1);
  const род=k=>k<0.42?"тварь":k<0.68?"мини":k<0.84?"квест":"тварь";
  ср.forEach((r,i)=>{const k=R(70+i);const t=в(r,0,0);if(!t||g[t.y][t.x]!=="q")return;встречи.push({x:t.x,y:t.y,род:род(k)});});
  if(R(80)<0.55){const t=в(rn,-1,0)||в(rn,0,0);if(t)встречи.push({x:t.x,y:t.y,род:"босс"});}
  /* люди: один на место — дух, узник или отшельник */
  const кв=встречи.find(z=>z.род==="квест");
  if(кв){const k=R(90);кв.кто=k<0.38?"дух":k<0.72?"узник":"отшельник";
   if(кв.кто==="дух"){const кр=rooms.find(r=>r.келья)||rooms[Math.max(1,n-2)];const t=в(кр,0,0)||в(кр,1,0);if(t&&!(t.x===кв.x&&t.y===кв.y))кв.останки={x:t.x,y:t.y};else кв.кто="отшельник";}}
  /* выход дальше: в предпоследней комнате */
  let выход=null;if(вид.выход){const rr=rooms[Math.max(1,n-2)];const t=в(rr,0,-1)||в(rr,1,1)||в(rr,-1,1);
   if(t&&!встречи.some(z=>z.x===t.x&&z.y===t.y)){выход={x:t.x,y:t.y,куда:вид.выход,
    dx:Math.round((R(91)*2-1)*12)||5,dy:Math.round((R(92)*2-1)*12)||-4};}}
  return {w,h,g,rooms,entry,нах,встречи,выход,вид};},
 /* уровень места для игры — того же вида, что тайная палата */
 уровень(p,т){const пл=this.план(p,т);
  return {w:пл.w,h:пл.h,g:пл.g,kind:"secret",depth:p.depth,stype:p.stype,entry:пл.entry,bx:p.bx,by:p.by,
   blocks:[],veins:{},rooms:пл.rooms.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h,cx:r.cx,cy:r.cy})),street:null,square:null,squareAt:null,
   vault:null,shops:[],тайник:true,находка:пл.нах,комплекс165:{вид:пл.вид,встречи:пл.встречи,выход:пл.выход,ключ:т.ключ}};},
 тут(){const p=G.place;if(!p||!p.тайник)return null;const lvl=safeFn(()=>curLevel(),null);return lvl&&lvl.комплекс165?{p,lvl,к:lvl.комплекс165}:null;},
 очищено(к,i){return !!this.зап(к.ключ).c[i];},
 /* противник встречи: тварь яруса, страж хода, хозяин катакомб */
 враг(p,з,i){
  const базовый=MONSTERS.filter(m=>(m.biomes||[]).includes("cave"));
  const pool=safeFn(()=>dungeonPool(базовый.length?базовый:MONSTERS),базовый)||MONSTERS;
  const m0=(pool.length?pool:MONSTERS)[Math.floor(hashName(p.bx+з.x*3+i,p.by+з.y*5,16600+i)*(pool.length||MONSTERS.length))%(pool.length||MONSTERS.length)];
  const плюс=з.род==="босс"?4:з.род==="мини"?2:0;
  const lv=Math.max(1,(Number(G.level)||1)+(Number(p.depth)||0)-1+плюс+Math.floor(hashName(з.x,з.y,16601)*2));
  const k=з.род==="босс"?3:з.род==="мини"?1.8:1,kd=з.род==="босс"?1.6:з.род==="мини"?1.3:1;
  const m=Object.assign({},m0,{lvl:lv,hp:Math.round((24+lv*9)*k*safeFn(()=>diff().foeHp,1)),dmg:Math.round((4+lv*2)*kd),
   xp:Math.round((20+lv*12)*k),gold:Math.round((8+lv*5)*(з.род==="босс"?4:з.род==="мини"?2:1)),noGrow165:з.род!=="тварь",тайна165:{род:з.род,i}});
  if(з.род==="мини")m.n=`${m0.n} — страж тайного хода`;
  if(з.род==="босс")m.n=`${m0.n} — хозяин катакомб`;
  safeFn(()=>Undead.prep(m,p.depth));
  return m;},
 слово(з){if(з.род==="квест")return (ТАЙНЫ_ЛЮДИ165[з.кто]||{}).слышно||"чьё-то дыхание";
  return з.род==="босс"?"тяжёлое дыхание и скрежет когтей о камень":з.род==="мини"?"глухое рычание":"шорох и сопение";},
 имя(з){if(з.род==="квест")return (ТАЙНЫ_ЛЮДИ165[з.кто]||{}).n||"кто-то";return з.род==="босс"?"хозяин катакомб":з.род==="мини"?"страж тайного хода":"тварь";},
 /* шаг по месту: слышно, кто впереди; шагнул к нему — бой или разговор */
 шаг(){const т=this.тут();if(!т||G.inCombat)return;const {p,к}=т;const зап=this.зап(к.ключ);
  const ws=к.встречи;
  for(let i=0;i<ws.length;i++){const з=ws[i];if(this.очищено(к,i))continue;
   const dx=з.x-p.x,dy=з.y-p.y,d=Math.max(Math.abs(dx),Math.abs(dy));
   if(d===0||(d===1&&з.род!=="квест")){return this.встреча(i);}
   if(d===1&&з.род==="квест"&&!зап.рядом?.[i]){зап.рядом=зап.рядом||{};зап.рядом[i]=1;
    narrate(`Рядом ${this.имя(з)}, ${safeFn(()=>dirAtWord(dx,dy),"")}: шагните к нему — заговорите.`,{interrupt:false});continue;}
   if(d<=4&&!зап.слышал?.[i]){зап.слышал=зап.слышал||{};зап.слышал[i]=1;
    safeFn(()=>beaconAt(з.род==="квест"?"npc_common":"lair",dx,dy,0,d));
    narrate(`Впереди, ${safeFn(()=>dirAtWord(dx,dy),"")}, ${stepWords(d)}: ${this.слово(з)}.`,{interrupt:false});}}
  /* останки для духа */
  for(let i=0;i<ws.length;i++){const з=ws[i];if(з.кто!=="дух"||!з.останки)continue;const q=зап.квест[i];
   if(q==="ищет"&&з.останки.x===p.x&&з.останки.y===p.y){зап.квест[i]="упокоен";
    safeFn(()=>Bank.play("magic_shimmer",{gain:0.7,maxSec:3}));
    const з2=40+(Number(G.level)||1)*6;G.gold=(Number(G.gold)||0)+з2;safeFn(()=>Тайны165.опыт(30+(Number(G.level)||1)*8));
    safeFn(()=>buffSet("удача",6));safeFn(()=>Режиссёр165.тронул("secret"));
    narrate(`Вы нашли останки и сложили кости, как положено. Шёпот за спиной стихает: «Спасибо…» Дух упокоен. В нише под костями — ${з2} золота, и удача на шесть часов с вами.`,{interrupt:true});
    safeFn(()=>journal("Тайный ход: дух упокоен."));safeFn(()=>saveGame(true));return;}}
  /* выход дальше */
  const в=к.выход;if(в&&в.x===p.x&&в.y===p.y)return this.выходМеню();},
 встреча(i){const т=this.тут();if(!т)return false;const {p,к}=т;const з=к.встречи[i];const зап=this.зап(к.ключ);
  if(з.род==="квест")return this.разговор(i);
  const m=this.враг(p,з,i);зап.бой=i;
  safeFn(()=>Bank.play(з.род==="босс"?"es_alarm":"lair",{gain:0.6,maxSec:4}));
  narrate(з.род==="босс"?`Из темноты поднимается ${m.n}. Он здесь хозяин — и не отступит.`:з.род==="мини"?`Ход заступает ${m.n}.`:`Из ниши бросается ${m.n}!`,{interrupt:true});
  safeFn(()=>Режиссёр165.тронул("secret"));
  startCombat({x:G.x,y:G.y,monster:m});return true;},
 /* люди тайных ходов */
 разговор(i){const т=this.тут();if(!т)return false;const {к}=т;const з=к.встречи[i];const зап=this.зап(к.ключ);const q=зап.квест[i];
  safeFn(()=>Режиссёр165.тронул("secret"));
  if(з.кто==="дух"){
   if(q==="упокоен"){this.очистить(к,i);narrate("Здесь тихо: дух ушёл.",{interrupt:true});return true;}
   if(q==="ищет"){narrate(`Дух шелестит: «Мои кости… ${safeFn(()=>dirAtWord(з.останки.x-G.place.x,з.останки.y-G.place.y),"где-то здесь")}…» Найдите останки и встаньте на них.`,{interrupt:true});return true;}
   return выбор147("Неупокоенный дух","Над полом колышется бледная тень. «Я лёг здесь без обряда, и камень меня не отпускает. Найди мои кости и уложи их — и я уйду».",[
    {l:"Обещать найти кости",run:()=>{зап.квест[i]="ищет";narrate(`«Они ${safeFn(()=>dirAtWord(з.останки.x-G.place.x,з.останки.y-G.place.y),"рядом")}…» — тень бледнеет, но не уходит. Найдите останки и встаньте на них.`,{interrupt:true});safeFn(()=>journal("Тайный ход: дух просит упокоить его кости."));}},
    {l:"Уйти",run:()=>narrate("Вы отступаете. Шёпот провожает вас.",{interrupt:true})}]);}
  if(з.кто==="узник"){
   if(q==="идёт"){narrate("Узник идёт за вами: выведите его наружу — лазом или ходом дальше.",{interrupt:true});return true;}
   return выбор147("Узник в цепях","У стены сидит человек, прикованный за ногу. «Меня бросили здесь те, кто носит этим ходом. Сбей цепь — и выведи меня. В долгу не останусь».",[
    {l:"Сбить цепь",run:()=>{зап.квест[i]="идёт";this.очистить(к,i);safeFn(()=>Bank.play("oc_chain",{gain:0.7,maxSec:2}));
     narrate("Цепь лопнула. Узник поднимается и идёт за вами. Выведите его отсюда — лазом назад или ходом дальше.",{interrupt:true});safeFn(()=>journal("Тайный ход: освобождён узник — вывести наружу."));}},
    {l:"Оставить",run:()=>narrate("«Будь ты проклят», — тихо говорит узник вам в спину.",{interrupt:true})}]);}
  if(з.кто==="отшельник"){
   if(q==="ответил"||q==="ошибся"){narrate(q==="ответил"?"Отшельник кивает вам, как старому знакомому.":"Отшельник отворачивается: второй загадки не будет.",{interrupt:true});return true;}
   const зг=ТАЙНЫ_ЗАГАДКИ165[Math.floor(hashName(з.x,з.y,16610)*ТАЙНЫ_ЗАГАДКИ165.length)%ТАЙНЫ_ЗАГАДКИ165.length];
   const пор=[0,1,2].sort((a,b)=>hashName(з.x+a,з.y,16611)-hashName(з.x+b,з.y,16611));
   return выбор147("Отшельник",`Сухой старик у огарка поднимает глаза. «Давно сюда не забредали. Ответь — и уйдёшь не с пустыми руками. ${зг.в}»`,
    пор.map(j=>({l:зг.о[j],run:()=>{if(j===зг.ok){зап.квест[i]="ответил";this.очистить(к,i);
      const з2=30+(Number(G.level)||1)*5;G.gold=(Number(G.gold)||0)+з2;safeFn(()=>Тайны165.опыт(25+(Number(G.level)||1)*6));
      const сл=this.слух(true);
      narrate(`«Верно», — улыбается отшельник и отсчитывает ${з2} золота. ${сл?`«И вот тебе ещё: ${сл}»`:""}`,{interrupt:true});}
     else{зап.квест[i]="ошибся";narrate("«Нет», — вздыхает отшельник и гасит огарок. Больше он с вами не говорит.",{interrupt:true});}
     safeFn(()=>saveGame(true));}})));}
  return false;},
 очистить(к,i){this.зап(к.ключ).c[i]=1;},
 опыт(n){G.xp=(Number(G.xp)||0)+xpGain(n);safeFn(()=>checkLevelUp());},
 /* узник выведен — награда */
 вывел(){const т=G.place&&G.place.тайник;if(!т)return;const зап=this.зап(т.ключ);
  for(const i in зап.квест)if(зап.квест[i]==="идёт"){зап.квест[i]="выведен";
   const з2=50+(Number(G.level)||1)*8;G.gold=(Number(G.gold)||0)+з2;safeFn(()=>Тайны165.опыт(35+(Number(G.level)||1)*8));
   setTimeout(()=>safeFn(()=>narrate(`Узник щурится на свет и жмёт вам руку: «Я твой должник». Он отдаёт ${з2} золота — всё, что успел спрятать за подкладку.`,{interrupt:false})),1200);
   safeFn(()=>journal("Тайный ход: узник выведен на волю."));}},
 /* ход ведёт дальше */
 выходМеню(){const т=this.тут();if(!т)return false;const в=т.к.выход;if(!в)return false;
  const куда=в.куда==="наружу"?"наружу, за пределы места":"вниз, в ярус под этим местом";
  return выбор147("Ход дальше",`Здесь ход уводит ${куда}. Пойти?`,[
   {l:"Идти дальше",run:()=>this.дальше()},{l:"Остаться",run:()=>narrate("Вы остаётесь в тайном ходе.",{interrupt:true})}]);},
 дальше(){const т=this.тут();if(!т)return false;const {p,к}=т;const в=к.выход;if(!в)return false;
  this.вывел();const тайн=p.тайник;
  safeFn(()=>Bank.play("oc_gate_move",{gain:0.55,maxSec:2}));
  if(в.куда==="наружу"){
   delete p.тайник;const bx=p.bx,by=p.by;const имя=p.name;
   safeFn(()=>Actors.stop());safeFn(()=>Scape.stop());
   G.place=null;G.flight=null;
   const x=Math.max(0,Math.min(WORLD_MAX-1,bx+в.dx)),y=Math.max(0,Math.min(WORLD_MAX-1,by+в.dy));G.x=x;G.y=y;
   safeFn(()=>{const c=cellContent(G.x,G.y);Play.stopKey("amb0");Play.stopKey("amb1");if(settings.effects)Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});Weather.resume();Music.start(c.terrain[0]);bankUpdateAmbient();});
   const d=Math.max(Math.abs(в.dx),Math.abs(в.dy));
   narrate(`Ход долго петляет и выводит наружу: вы выбираетесь из-под замшелой плиты. «${имя}» осталось ${stepWords(d)} ${safeFn(()=>dirAtWord(bx-x,by-y),"позади")}. ${safeFn(()=>cellContent(G.x,G.y).terrain[1],"")}.`,{interrupt:true});
   safeFn(()=>journal(`Тайный ход вывел наружу из «${имя}».`));
   safeFn(()=>{refresh();saveGame(true);});return true;}
  /* катакомбы — вниз, мимо стража шахты */
  delete p.тайник;p.arm=null;
  const ok=safeFn(()=>changeDepth(1,{bypass:true}),false);
  if(!ok){p.тайник=тайн;narrate("Ход дальше завален наглухо.",{interrupt:true});return false;}
  narrate("Узкий спуск в конце катакомб выводит вас ярусом ниже — мимо шахты и её стража.",{interrupt:false});
  safeFn(()=>journal("Катакомбы вывели ярусом ниже."));safeFn(()=>{refresh();saveGame(true);});return true;},
 /* слух о тайном ходе (Режиссёр, отшельник): ближнее подземелье или руины — метка и полный ход */
 слух(тихо){
  const x0=G.place?G.place.bx:G.x,y0=G.place?G.place.by:G.y;
  for(let r=2;r<=40;r++)for(let k=0;k<16;k++){const a=k/16*Math.PI*2;const x=Math.round(x0+Math.cos(a)*r),y=Math.round(y0+Math.sin(a)*r);
   const c=safeFn(()=>cellContent(x,y),null);const s=c&&c.structure;if(!s)continue;
   const kind=PLACE_KIND[s.type];if(kind!=="dungeon"&&s.type!=="ruins")continue;
   const ключ=placeKey(x,y,1);const сл=this.слухи();if(сл[ключ])continue;сл[ключ]=1;сл[placeKey(x,y,0)]=1;
   safeFn(()=>{if(typeof Карта165!=="undefined"){const ms=Карта165.метки();if(!ms.some(m=>!m.place&&m.x===x&&m.y===y)){const id=(Number(G.metkiN165)||0)+1;G.metkiN165=id;
     ms.push({id,n:`Слух о тайном ходе: ${s.name} (X ${x}, Y ${y})`,x,y,place:null,день:Number(G.day)||1});}}});
   const d=Math.max(Math.abs(x-x0),Math.abs(y-y0));
   return `${тихо?"":"слух: "}в «${s.name}», ${stepWords(d)} ${safeFn(()=>dirAtWord(x-x0,y-y0),"")}, за кладкой есть тайный ход — целые катакомбы. Метка — на вашей карте (Ctrl+G).`;}
  return "";}};
/* тайная палата: три из четырёх — целое место */
safeFn(()=>{const s0=secretRoomLevel;secretRoomLevel=обёртка165(function(p){const т=p&&p.тайник;
 if(т&&Тайны165.комплекс(p,т)){if(secretRoomCache.has(т.ключ))return secretRoomCache.get(т.ключ);
  const lvl=Тайны165.уровень(p,т);if(secretRoomCache.size>20)secretRoomCache.clear();secretRoomCache.set(т.ключ,lvl);return lvl;}
 return s0.apply(this,arguments);},s0);});
/* вошли: сказать, что это за место */
safeFn(()=>{const e0=enterSecret;enterSecret=обёртка165(function(){const r=e0.apply(this,arguments);
 safeFn(()=>{const т=Тайны165.тут();if(!т||!r)return;const к=т.к;const n=к.встречи.filter((z,i)=>!Тайны165.очищено(к,i)).length;
  setTimeout(()=>safeFn(()=>Bank.play(к.вид.звук,{gain:0.45,maxSec:4})),2200);
  setTimeout(()=>safeFn(()=>narrate(`Это не каморка, а ${к.вид.n}: ${к.вид.о}. Ходы уводят вглубь${n?`; в темноте кто-то есть`:""}${к.выход?`; где-то впереди ход ведёт ${к.выход.куда==="наружу"?"наружу":"ещё ниже"}`:""}.`,{interrupt:false})),2600);});
 return r;},e0);});
safeFn(()=>{const e0=Тайна150.войтиПусто;Тайна150.войтиПусто=function(){const r=e0.apply(this,arguments);
 safeFn(()=>{const т=Тайны165.тут();if(т&&r)setTimeout(()=>safeFn(()=>narrate(`Это ${т.к.вид.n}: ходы на месте, можно пройти их снова${т.к.выход?` — и уйти дальше`:""}.`,{interrupt:false})),1800);});
 return r;};});
/* шаг в тайном месте */
safeFn(()=>{const m0=moveInside;moveInside=обёртка165(function(){const r=m0.apply(this,arguments);if(r!==false)safeFn(()=>Тайны165.шаг());return r;},m0);});
/* выбрались лазом — узник выведен */
safeFn(()=>{const x0=exitSecret;exitSecret=обёртка165(function(){safeFn(()=>Тайны165.вывел());return x0.apply(this,arguments);},x0);});
/* победа в тайном месте — встреча очищена, у стража и хозяина своя добыча */
safeFn(()=>{const v0=victory;victory=обёртка165(function(){const cb=G.combat;const m=cb&&cb.m;
 safeFn(()=>{const т=Тайны165.тут();if(!т||!m||!m.тайна165)return;const i=m.тайна165.i;Тайны165.очистить(т.к,i);
  const з=т.к.встречи[i];
  if(з&&(з.род==="мини"||з.род==="босс")){
   setTimeout(()=>safeFn(()=>{
    if(з.род==="босс"){const дар=safeFn(()=>grantPrize({вид:"артефакт",что:SECRET_ARTIFACTS[Math.floor(Math.random()*SECRET_ARTIFACTS.length)]},{дом:"myst",ранг:3,seed:G.place.bx*7+i,откуда:"от хозяина катакомб"}),"")||"";
     narrate(`Хозяин катакомб повержен. ${дар}`,{interrupt:false});safeFn(()=>journal("Тайный ход: повержен хозяин катакомб."));}
    else narrate("Страж тайного хода повержен: путь вглубь свободен.",{interrupt:false});}),1600);}});
 return v0.apply(this,arguments);},v0);});
/* бой в тайном месте прерван поражением — место забывает начатый бой */
safeFn(()=>{const d0=defeat;defeat=обёртка165(function(){safeFn(()=>{const т=G.place&&G.place.тайник;if(т){const z=Тайны165.зап(т.ключ);delete z.бой;}});return d0.apply(this,arguments);},d0);});
/* «что рядом» и осмотр: кто в ходах и где ход дальше */
safeFn(()=>{const nf0=nearFeatures;nearFeatures=обёртка165(function(rad){const r=nf0.apply(this,arguments)||[];
 try{const т=Тайны165.тут();if(т){const {p,к}=т;
  к.встречи.forEach((з,i)=>{if(Тайны165.очищено(к,i))return;const dx=з.x-p.x,dy=з.y-p.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(!d||d>rad)return;
   r.push({x:з.x,y:з.y,t:"тайна165",d,dx,dy,dir:dirBetween(dx,dy),name:Тайны165.имя(з),bid:з.род==="квест"?"npc_common":"lair"});});
  const в=к.выход;if(в){const dx=в.x-p.x,dy=в.y-p.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(d&&d<=rad)r.push({x:в.x,y:в.y,t:"тайна165",d,dx,dy,dir:dirBetween(dx,dy),name:в.куда==="наружу"?"ход наружу":"спуск ниже",bid:"stairs_down"});}
  r.sort((a,b)=>a.d-b.d);}}catch(_){}
 return r;},nf0);});
/* отметки сундуков и рычагов в ходах — свои, не с комнат над ними */
safeFn(()=>{const pm0=placeMark,sp0=setPlaceMark;
 placeMark=function(x,y){const p=G.place;if(p&&p.тайник&&p.тайник.ключ)return (G.marks||{})["т165:"+p.тайник.ключ+":"+x+","+y];return pm0.apply(this,arguments);};
 setPlaceMark=function(x,y,v){const p=G.place;if(p&&p.тайник&&p.тайник.ключ){if(!G.marks)G.marks={};G.marks["т165:"+p.тайник.ключ+":"+x+","+y]=v;return;}return sp0.apply(this,arguments);};});

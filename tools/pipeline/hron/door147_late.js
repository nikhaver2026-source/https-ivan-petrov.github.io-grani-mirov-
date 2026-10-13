/* ════════════════════════════════════════════════════════════════════════
   ДВЕРИ, ВОРОТА И СТРАЖА (14.7)
   Просьбы игрока: «главный игрок сам открывал двери — они не должны быть
   открыты по умолчанию; герой открывает их сам по двойному касанию или ключом,
   если он есть»; «не было автоматического входа в поселения, деревни, города:
   на входе встречает стража — кто, зачем, откуда и куда — и берёт плату за
   вход, плата зависит от репутации, отношения и заслуг»; «входит в кузницу,
   в кожевенную мастерскую — открывается меню: постучаться или открыть»;
   «открыл сокровищницу ключом, а войти в неё не может — ни двойным касанием,
   никак»; «в Windows на H — только здоровье, на Shift+H — всё остальное».
   1. Шаг в закрытую дверь больше не распахивает её: герой упирается в створку,
      и игра говорит, что дверь закрыта. Двойное касание открывает её, запертую —
      отпирает ключом (если ключ есть), открытую — проводит насквозь. Дверь
      сокровищницы так же: ключом или плечом по двойному касанию, а в открытую
      палату двойное касание вводит.
   2. Постройки на карте мира (кузница, трактир, храм, школа…) и мастерские и
      службы внутри городов: «Постучаться», «Открыть дверь» или «Отойти». Днём
      открыто, ночью мастерские заперты — хозяин может открыть на стук.
   3. Поселения — деревня, порт, посад, замок, крепость, цитадель: у ворот
      стража. Кто такой и откуда, куда и зачем, затем плата — по отношению к
      вам в этом поселении и у державы, по заслугам и по часу; можно заплатить,
      сослаться на заслуги, поторговаться или уйти. Заплатившего пускают до
      конца следующего дня без новой платы.
   4. Клавиши Windows: H — только здоровье, Shift+H — всё остальное о герое.
   ════════════════════════════════════════════════════════════════════════ */

/* ── 0. Окно выбора без записи в журнал ──
   Окно «Событие» (openEvent) — готовый выбор с кнопками, но каждый выбор
   оседал бы в журнале строкой «Событие: …». Двери и стража журналу не нужны. */
safeFn(()=>{const re0=resolveEvent;resolveEvent=function(i){
 if(curEvent&&curEvent.e&&curEvent.e.тихо){const ch=curEvent.choices[Number(i)];const m=document.getElementById("modal-event");curEvent=null;
  if(m&&!m.hidden)safeFn(()=>closeModal(m));if(!ch){narrate("Такого варианта нет.");return;}
  safeFn(()=>ch.run());safeFn(()=>{refresh();saveGame(true);});return;}
 return re0.apply(this,arguments);};});
function выбор147(title,text,choices){openEvent({тихо:true,title:()=>title,text:()=>text,choices:()=>choices},{});return true;}
const ночь147=()=>{const h=Number(G.hour)||0;return h>=22||h<6;};

/* ── 1. Двери внутри построек, подземелий и городов ── */
/* Сколько клеток пола можно обойти от (x,y), не проходя сквозь стены, двери и
   ворота, — до предела. Улица большая, комната маленькая. */
function обл147(lvl,x,y,предел){
 const стоп=new Set(["#","%","+","Y","G"]);const был=new Set();const плитки=new Set();const q=[[x,y]];
 while(q.length&&был.size<предел){const [cx,cy]=q.shift();const k=cx+","+cy;if(был.has(k))continue;
  const t=tileAt(lvl,cx,cy);if(стоп.has(t))continue;был.add(k);плитки.add(t);
  for(const v of Object.values(DIRV))q.push([cx+v[0],cy+v[1]]);}
 return {n:был.size,плитки};}
const УЛИЦА147=48;
/* Чей дом за дверью — по тому, что в комнате: горн — кузница, стойка — трактир… */
const ГОРОД_ДОМ147=[["F","кузница",false],["V","трактир",true],["H","лечебница",true],["D","торговый дом",false],["J","тюрьма",true],
 ["A","молельня",true],["B","караульня",true],["S","лавка",false],["P","лавка",false],["L","голубятня",false],["K","книжня",false],["N","жилой дом",false]];
const Двери147={
 /* дверь, в которую герой только что упёрся; двойное касание действует на неё */
 рядом(){const p=G.place;const d=p&&p.door147;if(!d)return null;
  if(Math.abs(d.x-p.x)+Math.abs(d.y-p.y)!==1){p.door147=null;return null;}return d;},
 /* или дверь вплотную: та, к которой герой повернулся последним шагом, а дверь
    сокровищницы — с любой стороны (её открывают и из меню действий, не упираясь) */
 найти(){const p=G.place;const lvl=p&&curLevel();if(!lvl||p.тайник)return null;
  const d=this.рядом();if(d)return d;
  if(safeFn(()=>somethingHere(),false))return null;
  const все=[];for(const dir of ["N","E","S","W"]){const v=DIRV[dir];const x=p.x+v[0],y=p.y+v[1];const raw=lvl.g[y]&&lvl.g[y][x];
   if(raw==="+"||raw==="Y")все.push({x,y,dir,вид:raw==="Y"?"сокровищница":"дверь"});
   else if(raw==="G"&&p.kind==="city")все.push({x,y,dir,вид:"ворота"});}
  const z=все.find(z=>z.dir===lastMoveDir)||все.find(z=>z.вид==="сокровищница")||null;
  if(z&&z.вид==="дверь"){const дом=this.дом(z);if(дом)z.дом=дом;}
  return z;},
 /* дверь с улицы в дом (герой на улице, за дверью — комната): чей это дом */
 дом(d){const p=G.place;const lvl=curLevel();if(!p||!lvl||p.kind!=="city"||p.тайник)return null;
  const v=DIRV[d.dir];if(обл147(lvl,p.x,p.y,УЛИЦА147).n<УЛИЦА147)return null;
  const там=обл147(lvl,d.x+v[0],d.y+v[1],УЛИЦА147);if(!там.n||там.n>=УЛИЦА147)return null;
  const н=ГОРОД_ДОМ147.find(([t])=>там.плитки.has(t));
  return {имя:н?н[1]:"дом",ночью:н?н[2]:false,жилой:!н||н[0]==="N"};},
 dxdy(d){const p=G.place;return {dx:d.x-p.x,dy:d.y-p.y};},
 открыта(d){const lvl=curLevel();if(!lvl)return false;if(d.вид==="сокровищница")return !!safeFn(()=>vaultIsOpen(d.x,d.y),false);
  if(d.вид==="ворота")return placeMark(d.x,d.y)==="open";
  return tileAt(lvl,d.x,d.y)==="+"&&placeMark(d.x,d.y)==="open";},
 /* пройти насквозь: на порог, затем дальше в ту же сторону, если там не стена */
 пройти(d){const dir=d.dir;
  if(d.вид==="сокровищница"&&placeMark(d.x,d.y)!=="open")setPlaceMark(d.x,d.y,"open");
  moveInside(dir);
  if(d.вид!=="ворота"&&G.place&&G.place.x===d.x&&G.place.y===d.y){const nx=d.x+DIRV[dir][0],ny=d.y+DIRV[dir][1];const t=tileAt(curLevel(),nx,ny);
   if(t!=="#"&&t!=="%"&&t!=="+"&&t!=="Y"&&t!=="G")moveInside(dir);}
  if(d.вид==="сокровищница"&&G.place&&safeFn(()=>вСокровищнице(curLevel(),G.place.x,G.place.y),false))
   narrate("Вы в сокровищнице. Казна яруса — вокруг: осмотритесь.",{interrupt:false});
  return true;},
 /* открыть самому — со звуком двери, затем пройти */
 распахнуть(d,сразу){const {dx,dy}=this.dxdy(d);const kind=safeFn(()=>doorKindHere("+"),"wood");
  setPlaceMark(d.x,d.y,"open");safeFn(()=>doorSound(kind,"open",{dx,dy}));
  /* петли и камень, как прежде у открытой шагом двери: под землёй — каменная створка */
  safeFn(()=>Bank.play(G.place&&G.place.depth>0?"deep_stone":"deep_door",{seed:d.x+d.y,gain:0.45,maxSec:3}));
  if(сразу)setTimeout(()=>safeFn(()=>{if(G.place&&Math.abs(G.place.x-d.x)+Math.abs(G.place.y-d.y)===1)this.пройти(d);}),300);},
 действие(d){const lvl=curLevel();if(!lvl)return false;const {dx,dy}=this.dxdy(d);const где=dirWhere(d.dir);const kind0=safeFn(()=>doorKindHere("+"),"wood");
  if(this.открыта(d))return this.пройти(d);
  if(d.вид==="сокровищница"){safeFn(()=>openVault(d.x,d.y));
   if(safeFn(()=>vaultIsOpen(d.x,d.y),false))setTimeout(()=>safeFn(()=>narrate("Коснитесь дважды ещё раз — войдёте в палату.",{interrupt:false})),60);
   return true;}
  if(d.вид==="ворота"){setPlaceMark(d.x,d.y,"open");
   safeFn(()=>{beaconAt("gate",dx,dy,0,1);Bank.play("siege_ram",{seed:d.x+d.y,gain:0.5,maxSec:3});Play.start("ev","rusty_gate",{dur:4});});
   narrate(`Вы отворили городские ворота ${где}. Шагните или коснитесь дважды ещё раз — встанете в воротах.`,{interrupt:true});return true;}
  /* дом в городе: постучаться или открыть самому; квартал, запертый живым городом, не открыть ничем */
  if(d.дом){const дом=d.дом;const p=G.place;
   const lc=safeFn(()=>typeof LiveCity!=="undefined"?LiveCity.blocked(d.dir):null,null);
   if(lc){safeFn(()=>doorSound(kind0,"locked",{dx,dy}));narrate(lc.text,{interrupt:true});return true;}
   const отношение=safeFn(()=>standOf("city",(isCityAt(p.bx,p.by)||{}).name||p.name),0);
   return Стук147.меню(дом.имя,дом.ночью,()=>this.распахнуть(d,true),{отношение,жилой:дом.жилой});}
  const st=placeMark(d.x,d.y);const kind=safeFn(()=>doorKindHere("+"),"wood");
  if(st==="locked"){
   if(safeFn(()=>hasKey(),false)){setPlaceMark(d.x,d.y,"open");safeFn(()=>doorSound(kind,"unlock",{dx,dy}));
    setTimeout(()=>safeFn(()=>doorSound(kind,"open",{dx,dy})),420);
    narrate(`Ключ повернулся дважды: дверь ${где} отперта и открыта. Коснитесь дважды ещё раз или шагните — пройдёте.`,{interrupt:true});return true;}
   safeFn(()=>doorSound(kind,"locked",{dx,dy}));
   narrate(`Дверь ${где} заперта, а ключа при вас нет. Взломать или открыть чарами — в действиях двери: осмотритесь и выберите её.`,{interrupt:true});return true;}
  this.распахнуть(d,false);
  const з=safeFn(()=>behindDoor({x:d.x,y:d.y}),null);
  narrate(`Вы открыли дверь ${где}${з?`: за ней ${з.вид==="тварь"?"кто-то дышит":"слышны шаги"} — ${з.n}, ${з.d} ${plural(з.d,"шаг","шага","шагов")}`:", за ней тихо"}. Коснитесь дважды ещё раз или шагните — пройдёте.`,{interrupt:true});
  return true;}};
safeFn(()=>{const m0=moveInside;moveInside=function(dir){
 const p=G.place;const lvl=p&&curLevel();
 if(p&&lvl&&DIRV[dir]&&!G.inCombat&&!G.flight&&!(p.arm&&p.arm.x===p.x&&p.arm.y===p.y&&p.arm.dir===dir)){
  const nx=p.x+DIRV[dir][0],ny=p.y+DIRV[dir][1];const t=tileAt(lvl,nx,ny);const raw=lvl.g[ny]&&lvl.g[ny][nx];const где=dirWhere(dir);
  /* открытая сокровищница — проём: шаг проходит, даже если отметка двери потерялась */
  /* квартал, запертый живым городом, держит своими словами (см. LiveCity) */
  const lc=t==="+"&&p.kind==="city"&&safeFn(()=>typeof LiveCity!=="undefined"?LiveCity.blocked(dir):null,null);
  if(lc){}
  else if(raw==="Y"&&t==="+"){if(placeMark(nx,ny)!=="open")setPlaceMark(nx,ny,"open");}
  else if(t==="+"&&placeMark(nx,ny)!=="open"&&placeMark(nx,ny)!=="locked"){
   const d={x:nx,y:ny,dir,вид:"дверь"};const дом=Двери147.дом(d);if(дом)d.дом=дом;p.door147=d;
   safeFn(()=>{beaconAt("door",DIRV[dir][0],DIRV[dir][1],0,1);Bank.play("oc_soft_hit",{seed:nx+ny,gain:0.45,maxSec:1.5});});
   narrate(дом?`Дверь ${где} закрыта: ${дом.имя}. Двойное касание — постучаться или открыть.`:`Дверь ${где} закрыта. Двойное касание — открыть.`,{interrupt:true});
   return false;}
  else if(t==="+"&&placeMark(nx,ny)==="locked"){p.door147={x:nx,y:ny,dir,вид:"дверь"};
   const r=m0.apply(this,arguments);
   if(safeFn(()=>hasKey(),false))narrate("Ключ при вас: двойное касание — отпереть и открыть.",{interrupt:false});
   return r;}
  else if(t==="Y"){p.door147={x:nx,y:ny,dir,вид:"сокровищница"};
   safeFn(()=>{beaconAt("gate",DIRV[dir][0],DIRV[dir][1],0,1);doorSound("iron","locked",{dx:DIRV[dir][0],dy:DIRV[dir][1]});});
   const ключ=(G.items||[]).includes(VAULT_KEY);
   narrate(`Дверь сокровищницы ${где} заперта. ${ключ?"Ключ при вас: двойное касание — и он повернётся в замке.":"Ключа нет: двойное касание — и вы навалитесь плечом; замок можно и взломать — в действиях двери."}`,{interrupt:true});
   return false;}
  else if(t==="G"&&p.kind==="city"&&placeMark(nx,ny)!=="open"){p.door147={x:nx,y:ny,dir,вид:"ворота"};
   safeFn(()=>{beaconAt("gate",DIRV[dir][0],DIRV[dir][1],0,1);Bank.play("oc_soft_hit",{seed:nx+ny,gain:0.4,maxSec:1.5});});
   narrate(`Городские ворота ${где} закрыты. Двойное касание — отворить.`,{interrupt:true});
   return false;}}
 const x0=p&&p.x,y0=p&&p.y;const r=m0.apply(this,arguments);
 if(G.place&&(G.place.x!==x0||G.place.y!==y0)){G.place.door147=null;
  const к=G.place.in147;if(к&&к.slice(к.indexOf("@")+1)!==G.place.x+","+G.place.y)G.place.in147=null;}
 return r;};});

/* ── 2. Постучаться или открыть: дома в городе, мастерские на улице, постройки на карте ── */
const ДОМА147={tavern:{ночью:true},temple:{ночью:true},shrine:{ночью:true},market:{ночью:false},bazaar:{ночью:false},forge:{ночью:false},
 school:{ночью:false},tower:{ночью:false},clanhall:{ночью:false},hold:{ночью:false},den:{ночью:true},smugglers:{ночью:true,свои:true},spire:{ночью:false}};
const ОТВЕТ147={
 day:["«Открыто, входите!»","«Заходите, не заперто!»","«Входи, гость, не стой на пороге».","«Кто там? А, входите, входите»."],
 жилой:["«Кто там? Входи, коли с добром»."],
 night:["«Ночь на дворе! Ну ладно уж, заходи, раз пришёл»."],
 closed:["«Закрыто до утра! Приходи, как рассветёт»."],
 спят:["«Кого там носит среди ночи? Утром приходи»."],
 свои:["Из-за двери шёпотом: «Кто прислал?» — помолчав, засов отходит: «Заходи, только тихо»."],
 чужим:["Из-за двери шёпотом: «Не знаю тебя. Проваливай»."]};
const взять147=a=>a[Math.floor(Math.random()*a.length)];
const Стук147={
 /* постучали: голос из-за двери, затем — вход или отказ */
 стук(имя,ночьюОткрыто,войти,доп){
  safeFn(()=>Bank.play("craft_knock",{gain:0.8,maxSec:2}));
  const n=ночь147();const жилой=!!(доп&&доп.жилой);let ответ,пускают=true;
  if(доп&&доп.свои){пускают=(safeFn(()=>standOf("crime",доп.держава),0)>=0);ответ=взять147(пускают?ОТВЕТ147.свои:ОТВЕТ147.чужим);}
  else if(n&&!ночьюОткрыто){const s=доп&&доп.отношение||0;пускают=s>=25||Math.random()<0.35;ответ=взять147(пускают?ОТВЕТ147.night:(жилой?ОТВЕТ147.спят:ОТВЕТ147.closed));}
  else ответ=взять147(жилой?ОТВЕТ147.жилой:ОТВЕТ147.day);
  setTimeout(()=>safeFn(()=>{
   narrate(`Вы постучали. ${ответ}`,{interrupt:true});
   if(пускают)setTimeout(()=>safeFn(войти),700);}),650);
  return true;},
 открыть(имя,ночьюОткрыто,войти,доп){
  if(ночь147()&&!ночьюОткрыто){safeFn(()=>doorSound("wood","locked",{gain:0.5}));
   narrate(`Заперто изнутри: ночью здесь не открывают. Постучите — может, хозяин ещё не спит.`,{interrupt:true});return true;}
  safeFn(войти);
  if(доп&&доп.жилой)setTimeout(()=>safeFn(()=>narrate("Хозяин оборачивается на скрип: «Стучаться не учили?»",{interrupt:false})),900);
  return true;},
 меню(имя,ночьюОткрыто,войти,доп){const Имя=имя[0].toUpperCase()+имя.slice(1);
  const текст=`${Имя}: дверь закрыта. Постучаться или открыть самому?${ночь147()&&!ночьюОткрыто?" Сейчас ночь — открыто вряд ли.":""}`;
  return выбор147(`${Имя}: дверь`,текст,[
   {l:"Постучаться",run:()=>this.стук(имя,ночьюОткрыто,войти,доп)},
   {l:"Открыть дверь",run:()=>доп&&доп.свои?this.стук(имя,ночьюОткрыто,войти,доп):this.открыть(имя,ночьюОткрыто,войти,доп)},
   {l:"Отойти",run:()=>narrate("Вы отошли от двери.",{interrupt:true})}]);}};
/* Мастерская и службы прямо на улице поселения — мастерская, трактир, лечебница,
   торговый дом, тюрьма без своего дома. Обёрнута сама служба: к ней приходят и
   «действием здесь», и двойным касанием вплотную, и из меню объектов — и всюду
   сначала дверь. Вошёл — дальше прежнее дело службы без нового стука, пока герой
   не отойдёт. Служба в доме сюда не попадает: в дом входят через его дверь. */
function клеткаСлужбы147(t){const p=G.place;const lvl=curLevel();if(!p||!lvl)return null;
 if(tileAt(lvl,p.x,p.y)===t)return {x:p.x,y:p.y};
 for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]])if(tileAt(lvl,p.x+dx,p.y+dy)===t)return {x:p.x+dx,y:p.y+dy};
 return null;}
function служба147(t,ночью,f0){return function(){const p=G.place;
 if(!p||G.inCombat||p.kind!=="city"||p.тайник)return f0.apply(this,arguments);
 const к=клеткаСлужбы147(t);if(!к)return f0.apply(this,arguments);
 const key=t+"@"+к.x+","+к.y;if(p.in147===key)return f0.apply(this,arguments);
 if(обл147(curLevel(),к.x,к.y,УЛИЦА147).n<УЛИЦА147)return f0.apply(this,arguments);
 const self=this,args=arguments;
 const имя=String(safeFn(()=>tileLabel(t,к.x,к.y),tileName(t))||tileName(t)).toLowerCase();
 const отношение=safeFn(()=>standOf("city",(isCityAt(p.bx,p.by)||{}).name||p.name),0);
 Стук147.меню(имя,ночью,()=>{const p2=G.place;if(!p2)return;p2.in147=key;
  safeFn(()=>doorSound("wood","open",{gain:0.5}));
  const был={x:p2.x,y:p2.y};p2.x=к.x;p2.y=к.y;
  try{f0.apply(self,args);}finally{if(G.place===p2){p2.x=был.x;p2.y=был.y;}}},{отношение});
 return true;};}
safeFn(()=>{prodShopUse=служба147("Z",false,prodShopUse);});
safeFn(()=>{cityTavern=служба147("V",true,cityTavern);});
safeFn(()=>{cityInfirmary=служба147("H",true,cityInfirmary);});
safeFn(()=>{cityTradeHouse=служба147("D",false,cityTradeHouse);});
safeFn(()=>{cityJail=служба147("J",true,cityJail);});

/* ── 3. Поселения: стража у ворот ── */
const ВОРОТА147={village:{n:"деревня",база:2,кто:"дозорный с копьём у околицы"},port:{n:"порт",база:5,кто:"стражник с фонарём на въезде в порт"},
 burg:{n:"посад",база:4,кто:"привратник посада у рогатки"},castle:{n:"замок",база:8,кто:"стража на стене у закрытых ворот"},
 fortress:{n:"крепость",база:10,кто:"караульные у подъёмного моста"},citadel:{n:"цитадель",база:12,кто:"гвардейцы цитадели у внешних врат"}};
const Стража147={
 ключ(c){return c.x+","+c.y;},
 пропуск(c){const g=G.gate147||{};const d=g[this.ключ(c)];return d!=null&&(Number(G.day)||0)-Number(d)<=1;},
 выдать(c){if(!G.gate147||typeof G.gate147!=="object")G.gate147={};G.gate147[this.ключ(c)]=Number(G.day)||0;},
 заслуги(){const D=G.deeds||{};const титулы=Array.isArray(G.titles)?G.titles.length:0;
  const дел=(Number(D.quests)||0)+(Number(D.questsDone)||0)+(Number(D.deeds)||0);
  return Math.round(титулы*12+Math.min(36,дел*2)+Math.min(20,(Number(G.level)||1)));},
 отношение(c){const emp=safeFn(()=>empireAt(c.x,c.y),null);const имя=(safeFn(()=>isCityAt(c.x,c.y),null)||{}).name||c.structure.name;
  const a=safeFn(()=>standOf("city",имя),0)||0,b=emp?safeFn(()=>standOf("fact",emp.short),0)||0:0;
  /* слава в самом поселении весит больше, чем у державы; дурная слава в нём — не прикрыть добрым словом державы */
  const s=a&&b?Math.round(0.6*a+0.4*b):(a||b);
  return {s:a<=-50?Math.min(s,a):s,держава:emp&&emp.short,место:a,у_державы:b};},
 /* плата: основа поселения × отношение × час − заслуги */
 плата(c,цель){const v=ВОРОТА147[c.structure.type]||ВОРОТА147.village;const o=this.отношение(c);const м=this.заслуги();const why=[];
  if(o.s<=-50)return {отказ:true,взятка:Math.max(10,v.база*5),why:["о тебе здесь дурная слава"],o,м};
  let k=1;if(o.s>=75||м>=60)return {плата:0,why:[o.s>=75?"вам здесь доверяют":"ваши заслуги знают и здесь"],o,м};
  if(o.s>=50){k=0.25;why.push("к вам с уважением");}else if(o.s>=25){k=0.5;why.push("вам рады");}
  else if(o.s<-25){k=2.5;why.push("вам здесь не верят");}else if(o.s<0){k=1.5;why.push("за вами присматривают");}
  let f=v.база*k;if(ночь147()){f*=1.5;why.push("ночью ворота отпирают за отдельную плату");}
  if(цель==="торг"){f+=2;why.push("с товара — торговый сбор");}if(цель==="храм"){f=Math.max(0,f-1);why.push("паломнику скидка");}
  const скидка=Math.floor(м/10);if(скидка>0){f=Math.max(0,f-скидка);why.push("за ваши заслуги дешевле");}
  return {плата:Math.max(0,Math.round(f)),why,o,м};},
 /* пропустили: в ворота — или, если стража встретила у «Услуг и людей», к услугам поселения */
 войти(c){const потом=this._потом;this._потом=null;safeFn(()=>{Bank.play("hall_gate",{gain:0.6,maxSec:4});});
  setTimeout(()=>safeFn(()=>потом?потом():enterPlace(c)),450);},
 /* у ворот: пропуск — проходят сразу; кому здесь доверяют — тоже, с поклоном;
    остальных — расспросы: кто, откуда, куда и зачем, затем плата */
 встреча(c,потом){const v=ВОРОТА147[c.structure.type];if(!v)return false;this._потом=потом||null;const имя=c.structure.name||v.n;const ж=!!safeFn(()=>heroVoiceFemale(),false);
  if(this.пропуск(c)){safeFn(()=>Bank.play("guard_shout",{gain:0.45,maxSec:2}));
   narrate(`Стража, ${имя}: «А, это ты. Проходи — сегодня уже ${ж?"платила":"платил"}».`,{interrupt:true});this.войти(c);return true;}
  const o=this.отношение(c);const м=this.заслуги();
  if(o.s>=75||м>=60){safeFn(()=>Bank.play("guard_shout",{gain:0.45,maxSec:2}));this.выдать(c);
   narrate(`Стража, ${имя}: стражник узнаёт вас и опускает копьё. «${o.s>=75?"Тебе здесь всегда рады":"Наслышаны о твоих делах"}, проходи без платы».`,{interrupt:true});this.войти(c);return true;}
  safeFn(()=>Bank.play("guard_shout",{gain:0.7,maxSec:2.5}));
  const народ=G.race||"люди";
  return выбор147(`Ворота: ${имя}`,`У ворот — ${v.кто}. «Стой! Кто ${ж?"такова":"таков"} и откуда путь держишь?»`,[
   {l:`${ж?"Странница":"Странник"} из народа «${народ}»`,run:()=>this.куда(c,"путь")},
   {l:`${ж?"Наёмница":"Наёмник"}: ищу работу и плату`,run:()=>this.куда(c,"наём")},
   {l:`${ж?"Торговка":"Торговец"}: везу товар на продажу`,run:()=>this.куда(c,"торг")},
   {l:`${ж?"Паломница":"Паломник"}: иду поклониться святыням`,run:()=>this.куда(c,"храм")},
   {l:"Уйти",run:()=>narrate("Вы отошли от ворот.",{interrupt:true})}]);},
 куда(c,кто){const v=ВОРОТА147[c.structure.type];const имя=c.structure.name||v.n;const правитель=/castle|citadel|fortress/.test(c.structure.type)?"К правителю — по делу":"К старосте — по делу";
  const дела=(G.quests||[]).length>0;
  const ч=[{l:"На рынок — купить и продать",run:()=>this.плату(c,кто==="торг"?"торг":"рынок")},
   {l:"В кузницу и мастерские",run:()=>this.плату(c,"мастер")},
   {l:"В трактир — поесть и переночевать",run:()=>this.плату(c,"ночлег")},
   {l:правитель,run:()=>this.плату(c,"правитель")}];
  if(кто==="храм")ч.unshift({l:"В храм — помолиться",run:()=>this.плату(c,"храм")});
  if(дела)ч.push({l:"По заданию — меня ждут",run:()=>this.плату(c,"задание")});
  ч.push({l:"Уйти",run:()=>narrate("Вы отошли от ворот.",{interrupt:true})});
  const ж=!!safeFn(()=>heroVoiceFemale(),false);
  return выбор147(`Ворота: ${имя}`,`«${кто==="торг"?(ж?"Торговка, значит. ":"Купец, значит. "):кто==="наём"?(ж?"Наёмница? Смотри у меня. ":"Наёмник? Смотри у меня. "):кто==="храм"?(ж?"Паломница — дело доброе. ":"Паломник — дело доброе. "):""}А куда идёшь и зачем?»`,ч);},
 плату(c,цель){const v=ВОРОТА147[c.structure.type];const имя=c.structure.name||v.n;const П=this.плата(c,цель);this._торг=false;return this.спрос(c,цель,П,имя);},
 спрос(c,цель,П,имя){
  if(П.отказ){const есть=(Number(G.gold)||0)>=П.взятка;
   return выбор147(`Ворота: ${имя}`,`Стражник хмурится: «Тебя я знаю — ${П.why[0]}. Не пущу». Можно сунуть ему мзду — ${П.взятка} золота.`,[
    ...(есть?[{l:`Дать мзду: ${П.взятка} золота`,run:()=>{G.gold-=П.взятка;safeFn(()=>Bank.play("prop_coins",{gain:0.6,maxSec:2}));
     safeFn(()=>addStand("crime",П.o.держава,1,true));this.выдать(c);narrate(`Монеты исчезли в кулаке стражника. «Я тебя не видел». Ворота приоткрылись. Минус ${П.взятка} золота.`,{interrupt:true});this.войти(c);}}]:[]),
    {l:"Уйти",run:()=>narrate("Вы отошли от ворот: сюда вам путь закрыт, пока о вас дурная слава.",{interrupt:true})}]);}
  if(П.плата===0){
   return выбор147(`Ворота: ${имя}`,`«${П.why[0][0].toUpperCase()+П.why[0].slice(1)}, — кивает стражник. — Проходи без платы».`,[
    {l:"Войти",run:()=>{this.выдать(c);narrate("Ворота открылись перед вами.",{interrupt:true});this.войти(c);}},
    {l:"Уйти",run:()=>narrate("Вы отошли от ворот.",{interrupt:true})}]);}
  const есть=(Number(G.gold)||0)>=П.плата;
  const почему=П.why.length?` (${П.why.join("; ")})`:"";
  const ч=[];
  if(есть)ч.push({l:`Заплатить ${П.плата} ${plural(П.плата,"золотой","золотых","золотых")}`,run:()=>{G.gold-=П.плата;safeFn(()=>Bank.play("prop_coins",{gain:0.6,maxSec:2}));
   this.выдать(c);narrate(`Вы заплатили ${П.плата} золота. «Проходи. До завтрашнего вечера пустим без платы».`,{interrupt:true});this.войти(c);}});
  if(П.м>=20)ч.push({l:"Сослаться на заслуги",run:()=>{const шанс=Math.min(0.9,П.м/80);
   if(Math.random()<шанс){this.выдать(c);narrate("Стражник прищурился, вспоминая: «Слыхал о тебе. Ладно, проходи даром».",{interrupt:true});this.войти(c);}
   else{const П2=Object.assign({},П,{плата:П.плата+1,why:П.why.concat(["стражник не поверил на слово"])});narrate("«Заслуги? Мало ли кто чем хвалится. Плати, как все — и сверху за болтовню».",{interrupt:true});setTimeout(()=>safeFn(()=>this.спрос(c,цель,П2,имя)),900);}}});
  if(!this._торг&&П.плата>=2)ч.push({l:"Поторговаться",run:()=>{this._торг=true;const шанс=Math.max(0.2,Math.min(0.8,0.3+((Number(G.cha)||10)-10)*0.04));
   const ок=Math.random()<шанс;const П2=Object.assign({},П,{плата:ок?Math.max(1,Math.floor(П.плата/2)):П.плата,why:П.why.concat([ок?"сторговались":"торга не вышло"])});
   narrate(ок?`Стражник почесал затылок: «Ладно, ${П2.плата} — и проходи».`:"«Не на базаре. Цена одна».",{interrupt:true});setTimeout(()=>safeFn(()=>this.спрос(c,цель,П2,имя)),900);}});
  ч.push({l:"Уйти",run:()=>narrate("Вы отошли от ворот.",{interrupt:true})});
  return выбор147(`Ворота: ${имя}`,`«Плата за вход — ${П.плата} ${plural(П.плата,"золотой","золотых","золотых")}»${почему}.${есть?"":` У вас ${Number(G.gold)||0} золота — не хватает.`}`,ч);}};

/* ── 4. Куда ведут вход: перехват всех путей входа игрока ── */
const Вход147={
 /* постройка под ногами на карте мира: стража, стук или прежний вход */
 туда(c){if(!c||!c.structure)return false;const тип=c.structure.type;const kind=PLACE_KIND[тип];if(!kind)return false;
  if(G.ship||(Number(G.alt)||0)>0)return false;   /* эти отказы скажет сам enterPlace */
  if(kind==="city"&&ВОРОТА147[тип])return Стража147.встреча(c);
  if(kind==="house"&&ДОМА147[тип]){const d=ДОМА147[тип];const имя=String(c.structure.name||"постройка");const emp=safeFn(()=>empireAt(c.x,c.y),null);
   return Стук147.меню(имя,d.ночью,()=>safeFn(()=>enterPlace(c)),{свои:!!d.свои,держава:emp&&emp.short});}
  return false;}};
/* двойное касание: дверь, в которую упёрлись (или вплотную по ходу); постройка на карте */
safeFn(()=>{const f0=fieldInteract;fieldInteract=function(){
 if(gameActive()&&!G.ship&&!G.inCombat){
  if(G.place){const d=Двери147.найти();if(d)return Двери147.действие(d);}
  else if(!inFlight()){const c=safeFn(()=>cellContent(G.x,G.y),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]&&Вход147.туда(c))return true;}}
 return f0.apply(this,arguments);};});
safeFn(()=>{const u0=useHere;useHere=function(){
 if(!G.ship&&!G.inCombat){
  if(G.place){const d=Двери147.рядом();if(d&&!safeFn(()=>somethingHere(),false))return Двери147.действие(d);}
  else if(!safeFn(()=>inFlight(),false)){const c=safeFn(()=>cellContent(G.x,G.y),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]&&Вход147.туда(c))return true;}}
 return u0.apply(this,arguments);};});
/* второй шаг к воротам на карте — тот же разговор, а не вход с ходу; у порога —
   свои слова: у ворот стража, у двери — стук */
const ПОРОГ147=/^(.+?): вы у входа\. Шагните ещё раз (.+?) — войдёте внутрь\.$/;
safeFn(()=>{const mv0=move;move=function(dir){
 if(G.place||G.ship)return mv0.apply(this,arguments);
 if(!G.inCombat&&G.atDoor&&G.atDoor.x===G.x&&G.atDoor.y===G.y&&G.atDoor.dir===dir&&!safeFn(()=>activeLayer(),null)){
  const c=safeFn(()=>cellContent(G.x,G.y),null);
  if(c&&c.structure&&(ВОРОТА147[c.structure.type]||ДОМА147[c.structure.type])){G.atDoor=null;safeFn(()=>stopRun());return Вход147.туда(c);}}
 const sy0=Speech.say;let r;
 Speech.say=function(t,o){
  if(typeof t==="string"){const m=t.match(ПОРОГ147);if(m){const c=safeFn(()=>cellContent(G.x,G.y),null);const тип=c&&c.structure&&c.structure.type;
   if(ВОРОТА147[тип])t=`${m[1]}: вы у ворот, тут стража. Шагните ещё раз ${m[2]} или коснитесь дважды — подойдёте к страже.`;
   else if(ДОМА147[тип])t=`${m[1]}: вы у двери. Шагните ещё раз ${m[2]} или коснитесь дважды — постучаться или открыть.`;}}
  return sy0.apply(Speech,[t,o].concat(Array.prototype.slice.call(arguments,2)));};
 try{r=mv0.apply(this,arguments);}finally{Speech.say=sy0;}
 return r;};});
/* «Услуги и люди» поселения на карте (таверна, рынок, кузница деревни, аудиенция у правителя) — тоже за воротами:
   без пропуска сначала стража, после платы — те же услуги */
safeFn(()=>{const ob0=openBuilding;openBuilding=function(c){const s=c&&c.structure;
 if(s&&ВОРОТА147[s.type]&&!G.place&&!G.inCombat&&!G.ship&&!Стража147.пропуск(c)){if(closeTopUI&&modalStack.length)safeFn(()=>closeTopUI());return Стража147.встреча(c,()=>ob0(c));}
 return ob0.apply(this,arguments);};});
/* «Войти» в окне объектов и команды входа */
safeFn(()=>{const a=IACT.enter;if(a){const d0=a.делать;a.делать=o=>{const c=cellContent(o.x,o.y);if(Вход147.туда(c))return true;return d0(o);};}});
safeFn(()=>{for(const k of ["enterplace","descend"]){const c0=CMD[k];if(typeof c0!=="function")continue;
 CMD[k]=function(){if(!G.place&&!G.ship){const c=cellContent(G.x,G.y);if(c.structure&&PLACE_KIND[c.structure.type]){if(closeTopUI&&modalStack.length)safeFn(()=>closeTopUI());if(Вход147.туда(c))return true;}}
  return c0.apply(this,arguments);};}});

/* ── 5. Клавиши Windows: H — только здоровье, Shift+H — всё остальное ── */
function остальное147(){
 try{const мана=`Мана ${Number(G.mana)||0} из ${Number(G.manaMax)||0}.`;
  const где=G.place?(G.place.name||"постройка"):(G.ship?`на борту «${G.ship.name}»`:"под открытым небом");
  const ступень=safeFn(()=>Path.statusLine(),"")||"";const сила=safeFn(()=>Energy.short(),"")||"";
  const t=`${G.inCombat?"Идёт бой. ":""}${ступень}${сила?сила+" ":""}${мана} Уровень ${Number(G.level)||1}, опыт ${Number(G.xp)||0}. Золото ${Number(G.gold)||0}. День ${Number(G.day)||1}, ${Math.floor(Number(G.hour)||0)} ${plural(Math.floor(Number(G.hour)||0),"час","часа","часов")}. ${где[0].toUpperCase()+где.slice(1)}.`;
  narrate(t.replace(/\s+/g," ").trim(),{interrupt:true,user:true});return true;}catch(_){return false;}}
/* Таблица клавиш объявлена ниже по файлу: правим её, когда весь сценарий прочитан. */
Promise.resolve().then(()=>safeFn(()=>{
 const hp=KB_BY_ID.hp;if(hp){hp.def=["Tab","KeyH"];hp.о="сколько здоровья, в бою и вне боя";}
 const st=KB_BY_ID.state;if(st){st.def=["Shift+KeyH"];st.n="всё остальное о герое";st.о="ступень, воля, эфир, пространство, мана, уровень, опыт, золото, время, место";st.run=()=>остальное147();}
 const cs=KB_BY_ID.c_self;if(cs){cs.n="только здоровье";cs.run=()=>{narrate(`Здоровье ${G.hp} из ${G.hpMax}.`,{interrupt:true,user:true});return true;};}
 if(!KB_BY_ID.c_selfrest){const a={id:"c_selfrest",g:"Бой",n:"мана и всё остальное о себе",def:["Shift+KeyH"],ctx:"combat",run:()=>остальное147()};const i=KB_ACTIONS.findIndex(x=>x.id==="c_self");KB_ACTIONS.splice(i>=0?i+1:KB_ACTIONS.length,0,a);KB_BY_ID[a.id]=a;}}));

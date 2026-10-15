/* ════════════════════════════════════════════════════════════════════════
   ДРЕВНИЕ ПОДЪЁМНИКИ (15.0)
   Просьба игрока: «в подземельях древние лифты, чтобы игрок мог не подниматься
   снизу по лестницам вверх, а проехать до верха на лифте — и до какого-либо
   этажа. Если он спускается вниз, лифт не должен пускать дальше того уровня,
   который он уже исследовал или на котором был. Лестницы не убирай: в само
   подземелье и на новые ярусы игрок спускается по ним».
   1. На каждом ярусе подземелья — и в обычном мире, и за Гранью — в шаге-двух
      от подъёма наверх стоит площадка древнего подъёмника (плитка «E»): клеть
      Безмолвных Зодчих на цепях, ворот и противовесы в толще. Механизм спит,
      пока его не разбудят: в каждом подземелье ворот в первый раз крутят руками.
   2. Клеть возит вверх — на первый ярус к выходу или на любой ярус выше, — а
      вниз только до самого глубокого яруса, где герой уже был в этом
      подземелье. Новое открывают ногами, по лестницам; страж на шахте клети не
      касается: подъёмник ходит своей шахтой, но и ниже пройденного не везёт.
   3. Поездку слышно: пуск, ход платформы (дольше — чем дальше), остановка; на
      месте ярус называет себя так же, как после лестницы.
   ════════════════════════════════════════════════════════════════════════ */
/* прежние правила, которые 15.0 оборачивает: в конце модулей Немоты обёртки показывают их текст (как matKeep) —
   наборы проверок читают исходник правила (учтены ли удача, бафф и т. п.), и прежнее правило в самом деле работает внутри */
const ДО150=Object.fromEntries(["castSpell","fight","victory","move","moveInside","changeDepth","enterPlace","leavePlace","useHere","genLevel",
 "spellAudio","castCustomEffect","deed","completeQuest","cellContent","isCityAt","mineVein","beastAt","dungeonPool","guardianAt","updateCombat",
 "renderBestiary","openBuilding","standHere","addStand","invBrief","stashSearch","hollowAround","nearFeatures","describeHere","tileLabel",
 "passageAt","enterSecret","exitSecret","revealSecret","placeRubble","clearRubble"].filter(k=>typeof window[k]==="function").map(k=>[k,window[k]]));
/* маяк — тяжёлые ворота на цепях: таблица маяков заморожена, свой в неё не добавить, а голос ворот подъёмнику впору */
TILE["E"]={n:"древний подъёмник",b:"gate"};
IOBJ_TILES["E"]="древний подъёмник";
SCAPE_TILE["E"]="lift";
if(!SCAPE_VOICE.lift)SCAPE_VOICE.lift={role:"oc_lift_move",period:6.0,gain:0.5,prio:2};
ADJ_MAIN_TILES.add("E");
/* по площадке ходят и твари: клеть стоит в полу, коридор она не перегораживает */
ACTOR_WALK.add("E");
const Лифт150={
 ключ(p){p=p||G.place;return (G.dark?"d":"w")+":"+p.bx+","+p.by;},
 ст(){if(!G.lift150||typeof G.lift150!=="object"||Array.isArray(G.lift150))G.lift150={};const s=G.lift150;
  for(const k of ["глубь","бодр","сказано"])if(!s[k]||typeof s[k]!=="object")s[k]={};return s;},
 здесь(){const p=G.place;return !!(p&&!p.тайник&&p.kind==="dungeon"&&(Number(p.depth)||0)>=1);},
 /* самый глубокий ярус этого подземелья, где герой уже был: ниже по лестницам
    не попасть, минуя верхние, поэтому всё, что выше, — пройдено */
 был(){const p=G.place;if(!this.здесь())return 0;const s=this.ст(),k=this.ключ();const d=Number(p.depth)||0;
  if(!(Number(s.глубь[k])>=d))s.глубь[k]=d;return Number(s.глубь[k])||d;},
 /* площадка яруса: свободная клетка пола у подъёма наверх — в шаге от стены */
 поставить(lvl){
  if(!lvl||lvl.lift150||!lvl.g||lvl.kind!=="dungeon"||!(lvl.depth>=1))return;
  const g=lvl.g,W=lvl.w,Hh=lvl.h;let от=null;
  for(let y=0;y<Hh&&!от;y++)for(let x=0;x<W;x++)if(g[y][x]==="<"){от={x,y};break;}
  if(!от)от=lvl.entry||{x:1,y:1};
  const стоп=t=>t==="#"||t==="%"||t==="Y";const был=new Set([от.x+","+от.y]);let q=[{x:от.x,y:от.y,d:0}],запас=null;
  while(q.length){const c=q.shift();
   if(c.d>=2&&g[c.y][c.x]==="."){
    const у=[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>(g[c.y+dy]||[])[c.x+dx]);
    const уСтены=у.some(t=>t==="#"),уДвери=у.some(t=>t==="+"||t==="Y"||t==="<"||t===">");
    if(уСтены&&!уДвери){g[c.y][c.x]="E";lvl.lift150={x:c.x,y:c.y};return;}
    if(!запас)запас=c;}
   if(c.d>=12)continue;
   for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=c.x+dx,ny=c.y+dy;const k=nx+","+ny;
    if(nx<1||ny<1||nx>=W-1||ny>=Hh-1||был.has(k))continue;был.add(k);if(стоп(g[ny][nx]))continue;q.push({x:nx,y:ny,d:c.d+1});}}
  if(запас){g[запас.y][запас.x]="E";lvl.lift150={x:запас.x,y:запас.y};}},
 /* меню площадки */
 меню(){if(!this.здесь())return false;if(this._едет){narrate("Клеть ещё идёт.",{interrupt:true});return true;}const p=G.place;const d=Number(p.depth)||0;const край=this.был();const s=this.ст(),k=this.ключ();
  if(!s.бодр[k])return выбор147("Древний подъёмник",
   "Площадка подъёмника Безмолвных Зодчих: каменная клеть на цепях, ворот под слоем пыли. Механизм спит: противовесы молчат.",[
    {l:"Повернуть ворот — разбудить механизм",run:()=>this.разбудить()},
    {l:"Отойти",run:()=>narrate("Вы отошли от подъёмника.",{interrupt:true})}]);
  const ч=[];
  if(d>1)ч.push({l:"Наверх — на первый ярус, к выходу",run:()=>this.ехать(1)});
  if(d>2)ч.push({l:`На ярус выше — ${d-1}-й`,run:()=>this.ехать(d-1)});
  if(край>d)ч.push({l:`На ярус ниже — ${d+1}-й`,run:()=>this.ехать(d+1)});
  if(край>d+1)ч.push({l:`На самый глубокий из пройденных — ${край}-й`,run:()=>this.ехать(край)});
  if(край>=4)ч.push({l:"Выбрать ярус",run:()=>this.выбрать()});
  ч.push({l:"Отойти",run:()=>narrate("Вы отошли от подъёмника.",{interrupt:true})});
  const куда=край>1?`Клеть ходит от первого яруса до ${край}-го: глубже, чем вы спускались сами, она не пойдёт — новые ярусы открывают по лестницам.`
   :"Глубже вы ещё не спускались: клеть ходит только по пройденным ярусам, новые открывают по лестницам.";
  return выбор147("Древний подъёмник",`Ярус ${d}. ${куда}`,ч);},
 /* выбор яруса: десятками, затем ярус */
 выбрать(от){const d=Number(G.place.depth)||0;const край=this.был();
  if(от==null&&край>12){const ч=[];for(let a=1;a<=край;a+=10){const b=Math.min(край,a+9);ч.push({l:`Ярусы ${a}–${b}`,run:()=>this.выбрать(a)});}
   ч.push({l:"Отойти",run:()=>narrate("Вы отошли от подъёмника.",{interrupt:true})});
   return выбор147("Древний подъёмник","Какой десяток ярусов?",ч);}
  const a=от||1,b=от?Math.min(край,от+9):край;const ч=[];
  for(let n=a;n<=b;n++){if(n===d)continue;ч.push({l:`Ярус ${n}${n===1?" — к выходу":""}`,run:()=>this.ехать(n)});}
  ч.push({l:"Отойти",run:()=>narrate("Вы отошли от подъёмника.",{interrupt:true})});
  return выбор147("Древний подъёмник",`Сейчас ярус ${d}. Куда ехать?`,ч);},
 разбудить(){const s=this.ст(),k=this.ключ();
  safeFn(()=>{Bank.play("oc_chain",{gain:0.7,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("oc_wheels",{gain:0.6,maxSec:4})),600);
   setTimeout(()=>safeFn(()=>Bank.play("oc_lift_start",{gain:0.55,maxSec:3})),1500);});
  G.hour=(Number(G.hour)||0)+0.15;if(G.hour>=24){G.hour-=24;G.day=(Number(G.day)||1)+1;}
  s.бодр[k]=true;
  narrate("Вы налегли на ворот. Он поддался со скрежетом, и где-то в толще камня отозвались противовесы: подъёмник проснулся. Двойное касание — выбрать ярус.",{interrupt:true});
  safeFn(()=>saveGame(true));return true;},
 ехать(n){const p=G.place;if(!p||!this.здесь())return false;if(G.inCombat)return false;
  /* пока клеть идёт, вторая поездка не начинается: ярус меняется на месте (changeDepth правит depth того же места),
     и поездка, заказанная с прежнего яруса, увезла бы мимо пройденного */
  if(this._едет){narrate("Клеть ещё идёт.",{interrupt:true});return false;}
  const d=Number(p.depth)||0;n=Math.max(1,Math.min(Math.round(Number(n)||1),this.был()));
  if(n===d){narrate("Вы и так на этом ярусе.",{interrupt:true});return false;}
  const путь=Math.abs(n-d),вверх=n<d;const ход=Math.min(6,1.4+путь*0.25);
  this._едет=true;
  safeFn(()=>{Bank.play("oc_lift_start",{gain:0.7,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("oc_lift_move",{gain:0.55,maxSec:ход})),450);});
  narrate(`Клеть дрогнула и пошла ${вверх?"вверх":"вниз"}: ${путь} ${plural(путь,"ярус","яруса","ярусов")}.`,{interrupt:true});
  setTimeout(()=>safeFn(()=>{this._едет=false;if(!G.place||G.place!==p||(Number(p.depth)||0)!==d)return;
   safeFn(()=>Bank.play("oc_lift_stop",{gain:0.7,maxSec:3}));
   G.hour=(Number(G.hour)||0)+0.04*путь;while(G.hour>=24){G.hour-=24;G.day=(Number(G.day)||1)+1;}
   const ok=changeDepth(n-d,{bypass:true,lift:true});
   if(ok&&G.place){const L=curLevel();const м=L&&L.lift150;if(м){G.place.x=м.x;G.place.y=м.y;}this.был();
    narrate(`Подъёмник встал: ярус ${G.place.depth}${G.place.depth===1?" — подъём к выходу в двух шагах":""}.`,{interrupt:false});}
   safeFn(()=>refresh());safeFn(()=>saveGame(true));}),450+ход*1000);
  return true;}};
/* площадки встают при порождении яруса — тем же расчётом, что и сам ярус */
safeFn(()=>{const g0=genLevel;genLevel=function(bx,by,depth,stype){const lvl=g0.apply(this,arguments);
 if(lvl&&depth>=1)safeFn(()=>Лифт150.поставить(lvl));return lvl;};});
/* учёт пройденных ярусов: лестница, вход в подземелье */
safeFn(()=>{const c0=changeDepth;changeDepth=function(delta,opts){const r=c0.apply(this,arguments);
 if(r)safeFn(()=>{const k=Лифт150.ключ();const s=Лифт150.ст();const перв=!s.сказано[k];Лифт150.был();
  if(перв&&Лифт150.здесь()&&!(opts&&opts.lift)){s.сказано[k]=true;
   setTimeout(()=>safeFn(()=>narrate("У подъёма наверх — площадка древнего подъёмника: он возит между пройденными ярусами.",{interrupt:false})),3200);}});
 return r;};});
safeFn(()=>{const e0=enterPlace;enterPlace=function(c){const r=e0.apply(this,arguments);safeFn(()=>Лифт150.был());return r;};});
/* площадка под ногами или вплотную — меню; пока клеть идёт, шагать некуда */
safeFn(()=>{const u0=useHere;useHere=function(){
 if(G.place&&!G.ship&&!G.inCombat&&Лифт150.здесь()){const lvl=curLevel();if(lvl&&tileAt(lvl,G.place.x,G.place.y)==="E")return Лифт150.меню();}
 return u0.apply(this,arguments);};});
safeFn(()=>{const m0=moveInside;moveInside=function(dir){if(Лифт150._едет){narrate("Клеть ещё идёт.",{interrupt:true});return false;}return m0.apply(this,arguments);};});

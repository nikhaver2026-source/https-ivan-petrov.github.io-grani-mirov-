/* ════════════════════════════════════════════════════════════════════════
   ПОИСК ПОД РУКОЙ: ТАЙНИКИ И ПУСТОТЫ ЗА КЛАДКОЙ (15.0, просьба игрока)
   «Обыскиваешь укромные места — постоянно ничего не находится; стучишь в
   стены — везде звук глухой и практически нигде ничего». Так и было:
   тайник лежит лишь в одном подходящем месте из семи, обыск проверял одну
   клетку, а удача броска при обычном навыке была около одной двенадцатой —
   один успех на семь десятков обысков; на полу тайников не бывает вовсе, и
   обыск «здесь» не мог найти ничего. Простукивание слушало только четыре
   стены вплотную, хотя пустота за кладкой есть почти в каждой комнате.
   Теперь:
   1. обыск «здесь» ощупывает всё, до чего достаёт рука: свою клетку и
      четыре соседние; обыск вещи — саму вещь;
   2. бросок честнее, и упорство окупается: каждый новый обыск того же
      тайника прибавляет удачи — как и обещает слово «искать можно снова»;
   3. под рукой пусто, а тайник в трёх шагах — слово скажет, в какой стороне
      кладка лежит неровно (дойти и обыскать — уже самому);
   4. стук слышит пустоту в трёх шагах: кладка с той стороны отзывается
      гулче, и звук идёт оттуда; простучать вплотную — откроется ход.
   ════════════════════════════════════════════════════════════════════════ */
const Поиск150={
 /* клетки под рукой: вещь — сама вещь; пол — своя клетка и четыре соседние */
 рука(x,y){const lvl=safeFn(()=>curLevel(),null);const t=lvl?safeFn(()=>tileAt(lvl,x,y),null):null;
  if(t&&STASH_WHERE.some(w=>w.плитки.indexOf(t)>=0))return [[x,y]];
  return [[x,y],[x,y-1],[x+1,y],[x,y+1],[x-1,y]];},
 попытки(){if(!G.stashTry||typeof G.stashTry!=="object"||Array.isArray(G.stashTry))G.stashTry={};return G.stashTry;},
 /* удача обыска: навык, трудность места и упорство (каждый неудачный обыск этого тайника — прибавка) */
 шанс(т){const n=Number(this.попытки()[т.ключ])||0;
  return Math.min(0.95,Math.max(0.25,safeFn(()=>stashSkill(),0.4)+0.3-0.08*т.где.сл)+0.2*n);},
 неудача(т){const п=this.попытки();п[т.ключ]=(Number(п[т.ключ])||0)+1;
  /* счёт держит только живые тайники: старые ключи уходят, память не растёт */
  const к=Object.keys(п);if(к.length>40)for(const k of к.slice(0,к.length-40))delete п[k];},
 /* ближний скрытый тайник в r шагах, кроме клеток под рукой */
 тайникРядом(x0,y0,r,кроме){const p=G.place;if(!p)return null;const мимо=new Set((кроме||[]).map(([a,b])=>a+","+b));let лучш=null;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(мимо.has(x+","+y))continue;
   const z=safeFn(()=>stashAt(x,y),null);if(!z||z.состояние!=="скрыт")continue;
   const d=Math.max(Math.abs(x-p.x),Math.abs(y-p.y));if(!лучш||d<лучш.d)лучш={т:z,d,dx:x-p.x,dy:y-p.y};}
  return лучш;},
 /* ближняя пустота за кладкой в r шагах: стена, к которой можно подойти, и ход за ней ещё не найден */
 пустотаРядом(r){const p=G.place;if(!p||p.тайник)return null;const lvl=safeFn(()=>curLevel(),null);if(!lvl)return null;let лучш=null;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)+Math.abs(dy)<=1)continue;const x=p.x+dx,y=p.y+dy;
   if(safeFn(()=>tileAt(lvl,x,y),"")!=="#")continue;
   const пол=[[0,-1],[1,0],[0,1],[-1,0]].some(([a,b])=>{const t=safeFn(()=>tileAt(lvl,x+a,y+b),"#");return t&&!(TILE[t]&&TILE[t].solid)&&t!=="#"&&t!=="%"&&t!=="Y";});
   if(!пол)continue;
   if(!safeFn(()=>propHidesSwitch(p.bx,p.by,p.depth,x,y,undefined),false))continue;
   const v=safeFn(()=>secretVault(p.bx,p.by,x,y),null);if(!v||secretFound(v.ключ)||secretTaken(v.ключ))continue;
   const d=Math.max(Math.abs(dx),Math.abs(dy));if(!лучш||d<лучш.d)лучш={x,y,dx,dy,d};}
  return лучш;},
 где(o){return `${safeFn(()=>dirBetween(o.dx,o.dy),"")||"рядом"}, ${o.d} ${plural(o.d,"шаг","шага","шагов")}`;},
 найден(т){const p=G.place;stashSet(т.ключ,"найден");delete this.попытки()[т.ключ];
  safeFn(()=>{Bank.play(т.где.звук,{seed:т.x+т.y,gain:0.65,maxSec:4});
   setTimeout(()=>safeFn(()=>Bank.play("deep_stone",{seed:т.x+т.y,gain:0.6,maxSec:4})),300);
   beaconAt("chest",т.x-p.x,т.y-p.y,0,Math.max(Math.abs(т.x-p.x),Math.abs(т.y-p.y)));});
  const сбоку=(т.x!==p.x||т.y!==p.y)?` (${this.где({dx:т.x-p.x,dy:т.y-p.y,d:Math.max(Math.abs(т.x-p.x),Math.abs(т.y-p.y))})})`:"";
  narrate(`Есть. ${т.где.n[0].toUpperCase()+т.где.n.slice(1)}${сбоку}: пришлось ${т.где.как}. За ней тайник. Осталось достать.`);
  safeFn(()=>{journal(`Тайник найден: ${т.где.n}.`);saveGame(true);});return true;}};
/* обыск: под рукой, с упорством и подсказкой о соседнем тайнике */
safeFn(()=>{const s0=stashSearch;stashSearch=function(x,y){
 if(G.flight||!G.place)return s0.apply(this,arguments);
 const кл=Поиск150.рука(x,y);
 const все=кл.map(([a,b])=>safeFn(()=>stashAt(a,b),null)).filter(Boolean);
 const скрытые=все.filter(т=>т.состояние==="скрыт"||т.состояние==="указан");
 if(!скрытые.length){
  const найден=все.find(т=>т.состояние==="найден");if(найден)return s0.call(this,найден.x,найден.y);
  safeFn(()=>propTime(0.25));safeFn(()=>Bank.play("oc_wood_dull",{seed:x+y,gain:0.45,maxSec:3}));
  const взят=все.find(т=>т.состояние==="взят");const н=Поиск150.тайникРядом(x,y,3,кл);
  narrate((взят?`${взят.где.n[0].toUpperCase()+взят.где.n.slice(1)}: тайник здесь был, и вы его уже выбрали.`:"Вы ощупали всё, до чего дотянулась рука: пусто. Полчаса ушло.")
   +(н?` Но ${Поиск150.где(н)}: ${н.т.где.n} — там что-то лежит не так, как должно. Подойдите и обыщите.`:""),{interrupt:false});
  return true;}
 /* указанный подсказкой находится сразу — прежним путём, со словами «как было сказано» */
 const указан=скрытые.find(т=>т.состояние==="указан");if(указан)return s0.call(this,указан.x,указан.y);
 const т=скрытые[0];safeFn(()=>propTime(0.25));
 if(Math.random()<Поиск150.шанс(т))return Поиск150.найден(т);
 Поиск150.неудача(т);safeFn(()=>Bank.play(т.где.звук,{seed:x+y,gain:0.45,maxSec:3}));
 narrate("Вы обыскали всё вокруг и ничего не нашли, но под пальцами что-то не так: здесь стоит поискать ещё. С каждым разом вернее, и каждый раз уходит время.",{interrupt:false});
 return true;};});
/* достать: и из вещи, и с пола — из того, что найдено под рукой */
safeFn(()=>{const d0=IACT.stashtake;if(!d0)return;
 const найденный=o=>{if(!G.place||!o)return null;for(const [a,b] of Поиск150.рука(o.x,o.y)){const z=safeFn(()=>stashAt(a,b),null);if(z&&z.состояние==="найден")return z;}return null;};
 iact("stashtake",Object.assign({},d0,{можно:o=>!!найденный(o),делать:o=>{const z=найденный(o);if(z)stashTake(z.x,z.y);return true;}}));});
/* стук: вплотную — как прежде; дальше — слышно, где кладка гулче */
safeFn(()=>{const h0=hollowAround;hollowAround=function(){
 const p=G.place;if(!p||G.flight)return h0.apply(this,arguments);
 const lvl=curLevel();let стен=0;
 for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy;if(tileAt(lvl,x,y)!=="#")continue;стен++;
  if(safeFn(()=>revealSecret(x,y,undefined,true),false)){safeFn(()=>deed("hollow"));return true;}}
 if(!стен)return h0.apply(this,arguments);
 safeFn(()=>Bank.play("mtg_stone_hit",{gain:0.55,maxSec:2}));safeFn(()=>propTime(0.15));
 const н=Поиск150.пустотаРядом(3);
 if(н){safeFn(()=>setTimeout(()=>safeFn(()=>Spatial.role("oc_wood_hit",н.dx,н.dy,{gain:0.6,maxSec:2})||Bank.play("oc_wood_hit",{gain:0.5,maxSec:2})),420));
  narrate(`Вы простучали ${стен===1?"стену":"стены"} вокруг: здесь сплошной камень. Но кладка отзывается гулче — ${Поиск150.где(н)}: за ней пустота. Подойдите к той стене вплотную и простучите её.`,{interrupt:false});
  return true;}
 narrate(`Вы простучали ${стен===1?"стену":"стены"} вокруг. Звук глухой и короткий: сплошной камень, и в трёх шагах кругом пустоты не слышно. Попробуйте у других стен.`,{interrupt:false});
 return true;};});

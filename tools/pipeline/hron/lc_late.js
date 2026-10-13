/* ════════════════════════════════════════════════════════════════════
   ЖИВЫЕ ГОРОДА (14.5, ФАЗА VI «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Десять городов меняют себя по своим законам — не случайной заменой
   слов, а правилом, которое можно изучить: улицы суток Сар-Дорна, шов
   Астериона, кольца обороны Ран-Каира, карман Виррена, штольни
   Нор-Каэля, створки хранилищ Кассара, ядро Вальтерна, сваи Лиорена,
   военный закон Тарвека и Черепаший город Ульм, что ходит между
   городами Запада. Закрытый квартал закрыт по-настоящему: его ворота не
   пускают с улицы (изнутри выпускают всегда). Площадь и главная улица не
   меняются никогда — это постоянные ориентиры. Увиденное состояние
   ложится в карту состояний; увидев все, герой знает закономерность, час
   следующей перемены и безопасный путь. Перемены слышны: колокол,
   скрежет стен, вода под сваями, гул ядра; временные проходы звенят.
   В сохранении — G.lc: увиденное, заряд ядра, прорытое, ключ хранителя.
   ════════════════════════════════════════════════════════════════════ */
const LC_CITIES=[
 {id:"sardorn",род:"сутки",n:"улицы по времени суток",нужно:2,звук:"bell_big",
  о:"кварталы у стен запирают на закате, а Ночной рынок открывается только в темноте",
  правило:"в девять вечера бьёт колокол: кварталы у стен запираются до шести утра и открывается Ночной рынок; в шесть утра всё наоборот"},
 {id:"asterion",род:"шов",n:"город на шве между мирами",нужно:2,звук:"portal_open",
  о:"Портальный двор стоит на шве: в полную луну он открывается на Грань, и сквозь него видно ближайший узел Сети",
  правило:"в полную луну шов открыт: Портальный двор пускает, и сквозь него виден узел Сети Граней; в прочие ночи и дни двор запечатан"},
 {id:"rankair",род:"кольца",n:"крепость, что перестраивает себя",нужно:3,звук:"cast_quake",
  о:"механизм обороны каждые четыре часа переставляет стены: одно из трёх колец кварталов отрезано",
  правило:"три кольца по очереди: каждые четыре часа скрежет механизма — и отрезана следующая треть кварталов"},
 {id:"virren",род:"карман",n:"город, что прячется в кармане пространства",нужно:2,звук:"cast_teleport",
  о:"днём Виррена нет — на его месте туман и шорох; с девяти вечера до шести утра город стоит в мире",
  правило:"с девяти вечера до шести утра Виррен в мире; на рассвете уходит в карман пространства и выносит гостей за ворота"},
 {id:"norkael",род:"рост",n:"подземный город, что растёт",нужно:2,звук:"od_dig",
  о:"горняки прорывают новые кварталы: каждые пять дней — по кварталу, а с помощью гостя — быстрее",
  правило:"сначала прорыты три квартала; каждые пять дней горняки прорывают ещё один, и каждая помощь рудой — ещё один"},
 {id:"kassar",род:"механизм",n:"древний город-механизм",нужно:3,звук:"gr_mech",
  о:"механизм Хранителей каждые шесть часов смыкает створки одного из кварталов-хранилищ, по кругу",
  правило:"каждые шесть часов створки смыкаются над следующим кварталом по кругу; ключ хранителя — рунный камень — держит их открытыми до следующего поворота"},
 {id:"valtern",род:"ядро",n:"город на магическом ядре",нужно:2,звук:"artifact_hum",
  о:"мосты между кварталами держит ток ядра; ядро слабеет каждый день, а кристаллы его заряжают",
  правило:"ядро теряет десятую часть заряда в день; ниже трети — гаснет: особый квартал и каждый второй мост обесточены, пока ядро не зарядят кристаллами"},
 {id:"lioren",род:"погода",n:"город на сваях, что живёт водой",нужно:2,звук:"oc_splash",
  о:"в дождь река поднимается под сваи, и нижние настилы уходят под воду",
  правило:"в дождь, ливень и грозу нижний ряд кварталов под водой; в сухую погоду настилы открыты"},
 {id:"tarvek",род:"режим",n:"город военного закона",нужно:2,звук:"guard_shout",
  о:"пока держава воюет или в смуте, кварталы у стен перекрыты баррикадами",
  правило:"мир — город открыт; война державы или спор о её престоле — военный закон: кварталы у стен за баррикадами"},
 {id:"ulm",род:"кочевье",n:"Черепаший город Ульм",нужно:2,звук:"oc_quake",
  о:"город на спине каменной черепахи ходит по кругу между Лиореном, Вирреном и Астерионом: два дня стоит у города, потом идёт дальше",
  правило:"круг Лиорен — Виррен — Астерион: у каждого города два дня стоянки, между ними — шесть дней пути"}];
const LC_BY_ID=Object.fromEntries(LC_CITIES.map(c=>[c.id,c]));
/* Особый квартал живого города носит имя своей перемены. */
const LC_SPECIAL={sardorn:["Ночной рынок","торг при свете фонарей: днём ряды пусты и ворота заперты"],asterion:["Портальный двор","квартал на шве между мирами: в полную луну он открывается на Грань"]};
/* Ульм: стоянки — у трёх городов Запада, чуть к востоку от их стен. */
const LC_ULM_STOPS=[["lioren","у Лиорена"],["virren","у Виррена"],["asterion","у Астериона"]];
const LiveCity={
 st(){if(!G.lc||typeof G.lc!=="object")G.lc={};const s=G.lc;for(const k of ["seen","cur","рост","ключ","ядро"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};return s;},
 day(){return Number(G.day)||1;},
 t(){return this.day()*24+(Math.floor(Number(G.hour)||0));},
 q(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));},
 btn(cmd,label){return `<button type="button" class="item" data-cmd="lc:${cmd}" data-speak="${this.q(label)}">${this.q(label)}</button>`;},
 named(id){(this._nm=this._nm||{});if(!(id in this._nm))this._nm[id]=NAMED_CITIES.find(c=>c.id===id)||null;return this._nm[id];},
 night(){return safeFn(()=>isNight(),false);},
 /* ── УЛЬМ: где черепаха сегодня ── */
 ulmStop(k){const c=this.named(LC_ULM_STOPS[k][0]);return {x:c.x+40,y:c.y};},
 ulmAt(d){if(d==null){d=this.day();if(this._ulm&&this._ulm.d===d)return this._ulm.p;const p=this.ulmAt(d);this._ulm={d,p};return p;}const leg=8,k=Math.floor(((d%(leg*3))+leg*3)%(leg*3)/leg),f=((d%leg)+leg)%leg;
  const A=this.ulmStop(k),B=this.ulmStop((k+1)%3);if(f<2)return {x:A.x,y:A.y,стоит:k};
  const u=(f-1)/7;return {x:Math.round(A.x+(B.x-A.x)*u),y:Math.round(A.y+(B.y-A.y)*u),идёт:(k+1)%3};},
 ulmHome(){return this.ulmStop(0);},
 isUlm(x,y){const p=this.ulmAt();return p.x===x&&p.y===y;},
 /* ── ГДЕ ГОРОД И В КАКОМ МЫ ── */
 pos(L){if(L.id==="ulm"){const p=this.ulmAt();return {x:p.x,y:p.y};}const c=this.named(L.id);return c?{x:c.x,y:c.y}:null;},
 name(L){return L.id==="ulm"?"Черепаший город Ульм":(this.named(L.id)||{}).n||L.id;},
 here(){const p=G.place;if(!p||p.depth||p.тайник)return null;if(p.live==="ulm")return LC_BY_ID.ulm;
  const c=safeFn(()=>namedCityAt(p.bx,p.by),null);return c&&LC_BY_ID[c.id]||null;},
 /* ── КВАРТАЛЫ ── у стен, нижний ряд, особый, двери на улицу */
 edge(lvl,b){return b.x0<=3||b.y0<=3||b.x1>=lvl.w-4||b.y1>=lvl.h-4;},
 bottom(lvl){return Math.max(...(lvl.blocks||[]).map(b=>b.y1));},
 doors(lvl){if(lvl.__lcDoors)return lvl.__lcDoors;const out=(lvl.blocks||[]).map(b=>{const d=[];
   for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){if(!(y===b.y0||y===b.y1||x===b.x0||x===b.x1))continue;if(lvl.g[y]&&lvl.g[y][x]==="+")d.push({x,y});}return d;});
  try{Object.defineProperty(lvl,"__lcDoors",{value:out,enumerable:false,configurable:true});}catch(_){}return out;},
 special(lvl){return (lvl.blocks||[]).findIndex(b=>b.special);},
 /* заряд ядра Вальтерна: сохраняется только последняя зарядка */
 core(){const s=this.st().ядро;if(!Number.isFinite(Number(s.з))){s.з=60+Math.round(hashName(7,7,9701)*30);s.д=this.day();}
  return Math.max(0,Math.min(100,Number(s.з)-10*(this.day()-Number(s.д||this.day()))));},
 grown(lvl){const s=this.st().рост;if(!s.с)s.с=this.day();const N=(lvl.blocks||[]).length;return Math.min(N,3+Math.floor((this.day()-s.с)/5)+(Number(s.п)||0));},
 realm(L){const p=this.pos(L);return p?Math.max(0,safeFn(()=>empireIndexAt(p.x,p.y),0)):0;},
 /* ── СОСТОЯНИЕ ── чистая функция мира: время, луна, погода, война, заряд, прорытое */
 state(L,lvl){const B=(lvl&&lvl.blocks)||[],N=B.length,sp=lvl?this.special(lvl):-1;const set=[];
  const t=this.t(),d=this.day();let id="",n="",why="",через=null;
  if(L.род==="сутки"){if(this.night()){id="ночь";n="ночь: кварталы у стен заперты, Ночной рынок открыт";B.forEach((b,i)=>{if(i!==sp&&this.edge(lvl,b))set.push(i);});why="заперт на ночь: откроют в шесть утра";}
   else{id="день";n="день: всё открыто, кроме Ночного рынка";if(sp>=0)set.push(sp);why="спит до заката: откроют в девять вечера";}
   const h=Math.floor(Number(G.hour)||0)%24;через=this.night()?(h>=21?30-h:6-h):21-h;}
  else if(L.род==="шов"){const w=safeFn(()=>Grani.moonWord(),"растущая");if(w==="полная"){id="прилив Граней";n="полная луна: шов открыт, Портальный двор пускает на Грань";}
   else{id="покой";n="шов запечатан: Портальный двор закрыт до полной луны";if(sp>=0)set.push(sp);why="запечатан: шов между мирами открывается в полную луну";}}
  else if(L.род==="кольца"){const k=Math.floor(t/4)%3;id=["первое кольцо","второе кольцо","третье кольцо"][k];n=`${id} отрезано механизмом`;B.forEach((b,i)=>{if(i%3===k)set.push(i);});
   why="отрезан стеной кольца обороны";через=4-t%4;}
  else if(L.род==="карман"){if(this.night()){id="в мире";n="ночь: Виррен стоит в мире";}else{id="в кармане";n="день: Виррен в кармане пространства";}
   const h=Math.floor(Number(G.hour)||0)%24;через=this.night()?(h>=21?30-h:6-h):21-h;}
  else if(L.род==="рост"){const g=lvl?this.grown(lvl):3;id=`прорыто ${g}`;n=`прорыто кварталов: ${g} из ${N}`;B.forEach((b,i)=>{if(i>=g&&i!==sp)set.push(i);});why="ещё не прорыт: горняки только ведут к нему штольню";}
  else if(L.род==="механизм"){const k=N?Math.floor(t/6)%N:0;const держит=(Number(this.st().ключ[L.id])||0)>t;id=держит?"створки на ключе":`створка ${k+1}`;
   n=держит?"ключ хранителя держит створки открытыми":`створки сомкнуты над кварталом ${B[k]?B[k].name:""}`;if(!держит&&N)set.push(k);why="сомкнут створками механизма Хранителей";через=6-t%6;}
  else if(L.род==="ядро"){const c=this.core();if(c<30){id="ядро гаснет";n=`ядро гаснет (заряд ${c} из ста): мосты обесточены`;B.forEach((b,i)=>{if(i===sp||i%2===1)set.push(i);});why="обесточен: ядро Вальтерна гаснет, мост не держит"}
   else{id="ядро горит";n=`ядро горит (заряд ${c} из ста): все мосты под током`;}}
  else if(L.род==="погода"){const w=safeFn(()=>Weather.cur,"Ясно")||"Ясно";if(["Дождь","Ливень","Гроза"].includes(w)){id="вода под сваями";n=`${w.toLowerCase()}: нижние настилы под водой`;const bt=lvl?this.bottom(lvl):0;B.forEach((b,i)=>{if(b.y1===bt)set.push(i);});why="под водой: дождь поднял реку под сваями"}
   else{id="сухо";n="сухо: все настилы открыты";}}
  else if(L.род==="режим"){const i=this.realm(L);const война=safeFn(()=>warsAt(d).some(w=>w.a===i||w.b===i),false),смута=!!safeFn(()=>Throne.crisis(i),null);
   if(война||смута){id="военный закон";n=`военный закон: ${смута?"спор о престоле":"держава воюет"}, кварталы у стен за баррикадами`;B.forEach((b,j)=>{if(this.edge(lvl,b))set.push(j);});why="за баррикадой военного закона"}
   else{id="мир";n="мир: город открыт";}}
  else if(L.род==="кочевье"){const p=this.ulmAt();id=p.стоит!=null?LC_ULM_STOPS[p.стоит][1]:`в пути ${LC_ULM_STOPS[p.идёт][1].replace(/^у /,"к ")}`;n=`Ульм ${id}`;}
  return {id,n,закрыто:new Set(set),why,через};},
 /* ── ШАГ ── закрытые ворота не пускают с улицы */
 blocked(dir){const L=this.here();if(!L||!DIRV[dir])return null;const lvl=curLevel();if(!lvl||lvl.kind!=="city")return null;const p=G.place;
  const nx=p.x+DIRV[dir][0],ny=p.y+DIRV[dir][1];const S=this.state(L,lvl);if(!S.закрыто.size)return null;const D=this.doors(lvl);
  for(const i of S.закрыто){const b=lvl.blocks[i];if(!b||!D[i].some(z=>z.x===nx&&z.y===ny))continue;
   if(p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1)return null;
   return {b,i,text:`Квартал «${b.name}» ${S.why}.${S.через?` Перемена через ${S.через} ${plural(S.через,"час","часа","часов")}.`:""}`};}
  return null;},
 /* ── ПЕРЕМЕНЫ ── слышны и ложатся в карту состояний */
 seen(L,S){const s=this.st();if(!s.seen[L.id])s.seen[L.id]={};const was=!!s.seen[L.id][S.id];s.seen[L.id][S.id]=this.day();return !was;},
 learned(L){return Object.keys(this.st().seen[L.id]||{}).length>=L.нужно;},
 check(){const L=this.here();if(!L)return false;const lvl=curLevel();const S=this.state(L,lvl);const s=this.st();const было=s.cur[L.id];
  if(L.род==="карман"&&S.id==="в кармане"){s.cur[L.id]=S.id;safeFn(()=>Bank.play(L.звук,{gain:0.6,maxSec:3}));leavePlace();
   narrate("Рассвет: Виррен уходит в карман пространства, и вас выносит за ворота. На месте города — туман и шорох; он вернётся в девять вечера.");return true;}
  if(было!==S.id){s.cur[L.id]=S.id;const new_=this.seen(L,S);
   if(было){safeFn(()=>Bank.play(L.звук,{gain:0.6,maxSec:4}));narrate(`${this.name(L)}: ${S.n}.${new_?" Новое состояние — в карте состояний.":""}`,{interrupt:false});
    this.event(L,S);}}
  this.chime(L,lvl,S);return false;},
 /* событие перемены — в летопись и молву */
 event(L,S){const p=this.pos(L);let t="";
  if(L.род==="рост")t=`в ${this.name(L)} горняки прорыли новый квартал`;
  else if(L.род==="ядро"&&S.id==="ядро гаснет")t=`в ${this.name(L)} гаснет ядро, и мосты обесточены`;
  else if(L.род==="шов"&&S.id==="прилив Граней")t=`в ${this.name(L)} открылся шов между мирами`;
  else if(L.род==="режим"&&S.id==="военный закон")t=`в ${this.name(L)} ввели военный закон`;
  if(!t)return;safeFn(()=>Ledger.add("история",t,"город"));safeFn(()=>rumorSeed("город",t,p.x,p.y,true));},
 /* временный проход — тихий звон у его ворот */
 chime(L,lvl,S){const p=G.place;if(!lvl||!lvl.blocks)return;const D=this.doors(lvl);const тмп=this.temp(L,lvl);const key=this.t();
  for(const i of тмп){if(S.закрыто.has(i))continue;if(!D[i].some(z=>Math.max(Math.abs(z.x-p.x),Math.abs(z.y-p.y))<=2))continue;
   const k=L.id+":"+i;if(this._зв&&this._зв[k]===key)continue;(this._зв=this._зв||{})[k]=key;
   const z=D[i][0];safeFn(()=>Bank.play("arc_chimes",{gain:0.25,maxSec:1.5}));safeFn(()=>beaconAt("artifact",z.x-p.x,z.y-p.y,0,Math.max(1,Math.max(Math.abs(z.x-p.x),Math.abs(z.y-p.y)))));}},
 /* какие кварталы бывают закрыты хоть в одном состоянии */
 temp(L,lvl){const B=lvl.blocks||[],sp=this.special(lvl),out=new Set();
  B.forEach((b,i)=>{if(L.род==="сутки"&&(i===sp||this.edge(lvl,b)))out.add(i);else if(L.род==="шов"&&i===sp)out.add(i);else if(L.род==="кольца"||L.род==="механизм")out.add(i);
   else if(L.род==="рост"&&i>=3&&i!==sp)out.add(i);else if(L.род==="ядро"&&(i===sp||i%2===1))out.add(i);else if(L.род==="погода"&&b.y1===this.bottom(lvl))out.add(i);else if(L.род==="режим"&&this.edge(lvl,b))out.add(i);});return out;},
 /* вошли в город: что сейчас и что заперто */
 enter(){const L=this.here();if(!L)return;const lvl=curLevel();const S=this.state(L,lvl);const s=this.st();s.cur[L.id]=S.id;const new_=this.seen(L,S);
  narrate(`${this.name(L)} — ${L.n}: ${S.n}.${new_?" Это состояние ложится в карту состояний.":""}${this.learned(L)&&S.через?` Перемена — через ${S.через} ${plural(S.через,"час","часа","часов")}.`:""}`,{interrupt:false});},
 /* «Осмотреться»: состояние, заперто, ориентиры */
 lookText(){const L=this.here();if(!L)return "";const lvl=curLevel();const S=this.state(L,lvl);const B=lvl.blocks||[];
  const з=[...S.закрыто].map(i=>B[i]&&B[i].name).filter(Boolean);
  return `${this.name(L)}: ${S.n}.${з.length?` Заперто: ${з.join(", ")}.`:" Все кварталы открыты."} Площадь и главная улица не меняются никогда — по ним можно держать путь.${this.learned(L)&&S.через?` Перемена через ${S.через} ${plural(S.через,"час","часа","часов")}.`:""}`;},
 /* безопасный путь: кварталы, открытые при любом состоянии */
 safe(L,lvl){const T=this.temp(L,lvl);return (lvl.blocks||[]).filter((b,i)=>!T.has(i)).map(b=>b.name);},
 /* ── ДЕЛА ГОСТЯ ── */
 help(){const L=this.here();if(!L||L.id!=="norkael"){narrate("Помогают горнякам в самом Нор-Каэле.");return false;}const s=this.st().рост;if(s.день===this.day()){narrate("Сегодня вы уже помогли: горняки отдыхают.");return false;}
  if((Number((G.inv||{}).руда)||0)<3){narrate("Горнякам нужна руда — три меры.");return false;}G.inv.руда-=3;if(G.inv.руда<=0)delete G.inv.руда;s.п=(Number(s.п)||0)+1;s.день=this.day();
  safeFn(()=>Bank.play("od_dig",{gain:0.6,maxSec:3}));narrate("Руда ушла в крепи новой штольни: горняки прорвутся к следующему кварталу быстрее.");this.check();safeFn(()=>saveGame(true));return true;},
 key(){const L=this.here();if(!L||L.id!=="kassar"){narrate("Ключ хранителя вставляют в механизм Кассара.");return false;}if((Number((G.inv||{})["рунный камень"])||0)<1){narrate("Ключ хранителя — рунный камень с печатью; у вас его нет.");return false;}
  G.inv["рунный камень"]--;if(G.inv["рунный камень"]<=0)delete G.inv["рунный камень"];const t=this.t();this.st().ключ[L.id]=t+(6-t%6);
  safeFn(()=>Bank.play("gr_mech",{gain:0.6,maxSec:4}));narrate("Рунный камень лёг в гнездо механизма: створки замерли открытыми до следующего поворота.");this.check();safeFn(()=>saveGame(true));return true;},
 charge(){const L=this.here();if(!L||L.id!=="valtern"){narrate("Ядро заряжают в самом Вальтерне.");return false;}if((Number((G.inv||{}).кристалл)||0)<2){narrate("Ядру нужны два кристалла.");return false;}
  const c=this.core();G.inv.кристалл-=2;if(G.inv.кристалл<=0)delete G.inv.кристалл;const s=this.st().ядро;s.з=Math.min(100,c+50);s.д=this.day();
  safeFn(()=>Bank.play("artifact_hum",{gain:0.6,maxSec:4}));narrate(`Кристаллы ушли в ядро: заряд ${s.з} из ста.${c<30?" Ядро разгорается — мосты снова под током.":""}`);this.check();safeFn(()=>saveGame(true));return true;},
 /* ── ОКНО ── */
 home(){let m=document.getElementById("modal-livecity");
  if(!m){m=document.createElement("div");m.id="modal-livecity";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Живые города");
   m.innerHTML=`<div class="modal-box"><h2>Живые города</h2><div id="lcBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  const s=this.st(),H=this.here();let h=`<p tabindex="0">${this.q("Десять городов меняют себя по своим законам. Каждое увиденное состояние ложится в карту состояний; увидев все, вы знаете закономерность и безопасный путь. Площадь и главная улица не меняются нигде.")}</p>`;
  for(const L of LC_CITIES){const p=this.pos(L);const d=p?Math.max(Math.abs(p.x-G.x),Math.abs(p.y-G.y)):0;const кар=Object.keys(s.seen[L.id]||{});
   const где=H===L?"вы здесь":`${safeFn(()=>dirFromDelta(p.x-G.x,p.y-G.y),"далеко")}, ${d} ${plural(d,"шаг","шага","шагов")}`;
   h+=`<h3>${this.q(this.name(L))}</h3><p tabindex="0">${this.q(`${L.n}: ${L.о}. ${где}. Карта состояний: ${кар.length?кар.join("; "):"пока пусто — побывайте в городе"}.${this.learned(L)?` Закономерность: ${L.правило}.`:` Увидено ${кар.length} из ${L.нужно} — закономерность ещё не ясна.`}`)}</p>`;
   if(H===L){const lvl=curLevel();h+=`<p tabindex="0">${this.q(this.lookText())}</p>`;if(this.learned(L)&&lvl){const sf=this.safe(L,lvl);h+=`<p tabindex="0">${this.q(`Безопасный путь: от ворот главной улицей к площади — он открыт всегда.${sf.length?` Кварталы, открытые при любом состоянии: ${sf.join(", ")}.`:""}`)}</p>`;}
    if(L.id==="norkael")h+=this.btn("help","Помочь горнякам: руда ×3");if(L.id==="kassar")h+=this.btn("key","Вставить ключ хранителя: рунный камень");if(L.id==="valtern")h+=this.btn("charge","Зарядить ядро: кристалл ×2");}}
  m.querySelector("#lcBody").innerHTML=h;if(m.hidden)openModal("modal-livecity");return true;},
 cmd(a){const k=String(a||"");let ok=false;if(k==="help")ok=this.help();else if(k==="key")ok=this.key();else if(k==="charge")ok=this.charge();
  else{narrate("Такого дела в живом городе нет: откройте «Живые города» в разделе «Мир».");return false;}
  const m=document.getElementById("modal-livecity");if(m&&!m.hidden)this.home();return ok;}};
RUMOR_LADDER.город=["говорят: {что}","в тавернах шепчут: {что}","говорят, город сам двигает свои стены","говорят, улицы там ведут не туда, куда вели вчера","говорят, однажды город не выпустит тех, кто в нём заночует"];
/* ── ВСТРАИВАНИЕ ── */
/* Шаг по городу: закрытые ворота держат; после шага — перемены и звон временных проходов. */
{const mi8=moveInside;moveInside=matKeep(mi8,function(dir){const w=safeFn(()=>LiveCity.blocked(dir),null);
 if(w){const p=G.place;safeFn(()=>{beaconAt("door",DIRV[dir][0],DIRV[dir][1],0,1);doorSound(doorKindHere("+"),"locked",{dx:DIRV[dir][0],dy:DIRV[dir][1]});});narrate(w.text);return false;}
 const r=mi8.apply(this,arguments);safeFn(()=>LiveCity.check());return r;});}
/* Вход в город: что сейчас; Ульм помнит, что он Ульм. */
{const ep8=enterPlace;enterPlace=matKeep(ep8,function(c){const r=ep8.apply(this,arguments);safeFn(()=>{if(G.place&&c&&c.structure&&c.structure.live)G.place.live=c.structure.live;LiveCity.enter();});return r;});}
/* Выход из Ульма: черепаха ушла — сходите там, где она сейчас. */
{const lp8=leavePlace;leavePlace=matKeep(lp8,function(){const ulm=!!(G.place&&G.place.live==="ulm");const r=lp8.apply(this,arguments);
 if(ulm&&!G.place){const p=LiveCity.ulmAt();if(p.x!==G.x||p.y!==G.y){G.x=p.x;G.y=p.y;narrate(`Черепаха ушла далеко: вы сходите с её спины ${p.стоит!=null?LC_ULM_STOPS[p.стоит][1]:"в пути"}.`,{interrupt:false});}}return r;});}
/* Ульм в мире — там, где черепаха сегодня; Виррен днём — только туман. */
{const cc8=cellContent;cellContent=matKeep(cc8,function(x,y){const c=cc8.apply(this,arguments);if(G.dark||!c)return c;
 if(LiveCity.isUlm(x,y))return Object.assign({},c,{structure:{type:"burg",name:"Черепаший город Ульм",beacon:"village",live:"ulm"}});
 const v=LiveCity.named("virren");if(v&&x===v.x&&y===v.y&&!LiveCity.night()&&c.structure)return Object.assign({},c,{structure:null,карман:"virren"});return c;});}
/* Ульм внутри один и тот же, где бы ни стоял: улицы черепахи не зависят от земли под ней. */
{const gl8=genLevel;const кэш=new Map();genLevel=matKeep(gl8,function(bx,by,depth,stype){
 const ulm=!depth&&((G.place&&G.place.live==="ulm"&&G.place.bx===bx&&G.place.by===by)||safeFn(()=>LiveCity.isUlm(bx,by),false));
 if(!ulm){const L=gl8.apply(this,arguments);if(!depth&&L&&L.kind==="city"&&!L.__lcNamed)safeFn(()=>{const c=namedCityAt(bx,by),sp=c&&LC_SPECIAL[c.id];
  Object.defineProperty(L,"__lcNamed",{value:true,enumerable:false});if(!sp)return;const b=(L.blocks||[]).find(z=>z.special);if(b){b.name=sp[0];b.special=sp[0];b.lore=sp[1];}});return L;}const k=bx+","+by;if(кэш.has(k))return кэш.get(k);const H=LiveCity.ulmHome();
 const L=Object.assign({},gl8.call(this,H.x,H.y,0,"burg"),{bx,by});кэш.set(k,L);if(кэш.size>8)кэш.delete(кэш.keys().next().value);return L;});}
/* «Осмотреться»: состояние живого города; на месте Виррена днём — туман. */
{const lk8=look;look=matKeep(lk8,function(){const r=lk8.apply(this,arguments);safeFn(()=>{const t=LiveCity.lookText();if(t)narrate(t,{interrupt:false});
  const v=LiveCity.named("virren");if(!G.place&&v&&G.x===v.x&&G.y===v.y&&!LiveCity.night())narrate("Здесь туман и шорох: Виррен ушёл в карман пространства и вернётся в девять вечера.",{interrupt:false});});return r;});}
/* Шов Астериона: в полную луну сквозь особый квартал виден ближайший узел Сети. */
{const ck8=LiveCity.check.bind(LiveCity);LiveCity.check=function(){const r=ck8();safeFn(()=>{const L=LiveCity.here();if(!L||L.id!=="asterion")return;const lvl=curLevel();const S=LiveCity.state(L,lvl);if(S.id!=="прилив Граней")return;
  const b=lvl.blocks[LiveCity.special(lvl)],p=G.place;if(!b||!(p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1))return;const gs=Grani.st();const n=(Grani.nodesNear(G.x,G.y,60000)||[]).find(z=>!gs.nodes[z.key]);if(!n)return;
  gs.nodes[n.key]={seen:LiveCity.day()};safeFn(()=>Bank.play("portal_open",{gain:0.6,maxSec:4}));narrate(`Сквозь шов портального квартала видна Грань: ${safeFn(()=>Grani.nodeName(n),"узел Сети")} — ${safeFn(()=>dirFromDelta(n.x-G.x,n.y-G.y),"далеко")}, ${n.d} шагов. Узел ложится в ваши знания.`,{interrupt:false});});return r;};}
Object.assign(CMD,{livecity(){LiveCity.home();},lc(a){if(!a)return LiveCity.home();LiveCity.cmd(a);}});
{const av8=amAvailable;amAvailable=matKeep(av8,function(cmd){if(cmd==="livecity")return !G.dark;return av8.apply(this,arguments);});}
safeFn(()=>{const g=AM_GROUPS.find(x=>x[0]==="Мир");g[1].push(["livecity","Живые города"]);});

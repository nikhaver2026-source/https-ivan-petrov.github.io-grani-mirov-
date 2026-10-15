/* ════════════════════════════════════════════════════════════════════════
   ТАЙНЫЕ ХОДЫ: ЛАЗ НАЗВАН, ВХОД ШАГОМ И КАСАНИЕМ, ПОСЛЕ НАХОДКИ ЗАКРЫТ
   (15.0, просьба игрока)
   1. «В тайной палате на каждом шаге звучит „пол тайной палаты“». Весть
      «объекты рядом» пропускала обычный пол, но не пол палаты, и каждый шаг
      называл новую клетку того же пола; описание проходов говорило «север —
      пол тайной палаты». Теперь пол палаты — просто пол: звучит шаг, и всё.
   2. «Рычаг, статуя или разобранный завал открывают лаз — а клетка как
      обычная: ничего не сказано». Открытый лаз теперь назван: в подписи
      клетки, в «объектах рядом» и маяком; встали рядом — слово «рядом лаз,
      шагните туда или коснитесь дважды»; встали на клетку завала, за
      которым пролом, — «здесь ход». Войти можно двойным касанием и шагом —
      в отъехавшую кладку и в вещь, за которой открыт ход.
   3. «Находку взяли — статуя встаёт на место; попасть ещё раз — снова через
      статую или рычаг». Выбрались из пустой палаты — лаз закрылся: вещь
      встала на место, кладка задвинулась, рычаг поднялся. Тронуть ту же
      вещь, потянуть тот же рычаг или простучать ту же стену — лаз откроется
      снова (палата за ним пуста). Пролом за завалом засыпает насовсем.
   ════════════════════════════════════════════════════════════════════════ */
safeFn(()=>APPROACH_SKIP.add("q"));
const Тайна150={
 откр(){if(!G.secretOpen||typeof G.secretOpen!=="object"||Array.isArray(G.secretOpen))G.secretOpen={};return G.secretOpen;},
 /* чем открыт ход: вещью, рычагом, завалом или стуком по стене */
 род(k){const z=safeFn(()=>passageBook()[k],null);if(!z)return "стена";if(z.prop)return "вещь";
  if(z.рычаг){const lvl=safeFn(()=>curLevel(),null);const t=lvl?safeFn(()=>tileAt(lvl,z.рычаг.x,z.рычаг.y),""):"";
   if(t==="X"){const pr=safeFn(()=>propAt(z.рычаг.x,z.рычаг.y),null);if(pr&&(pr.id==="lever"||/рычаг/i.test(pr.n||"")))return "рычаг";}
   return "завал";}
  return "стена";},
 вещь(k){const z=safeFn(()=>passageBook()[k],null);return (z&&z.prop&&PROP_BY_ID[z.prop]&&PROP_BY_ID[z.prop].n)||"вещь";},
 где(dx,dy){const d=Math.max(Math.abs(dx),Math.abs(dy));return `${safeFn(()=>dirBetween(dx,dy),"")||"рядом"}${d>1?`, ${d} ${plural(d,"шаг","шага","шагов")}`:""}`;},
 /* войти в палату, которую уже выбрали, — лаз открыт заново */
 войтиПусто(x,y,v,propId,поМесту){const p=G.place;if(!p||p.тайник)return false;
  if(G.inCombat)return false;
  const запись=passageNote(x,y,propId,поМесту);G.flight=null;
  p.тайник={ключ:v.ключ,sx:x,sy:y,от:{x:p.x,y:p.y},prop:propId||(запись&&запись.prop)||null,поМесту:!!(поМесту||(запись&&запись.поМесту))};
  const lvl=secretRoomLevel(p);p.x=lvl.entry.x;p.y=lvl.entry.y;p.arm=null;
  safeFn(()=>{Look.target=null;});safeFn(()=>Actors.stop());safeFn(()=>{Room.set();Scape.stop();});
  safeFn(()=>{Bank.play("oc_gate_move",{gain:0.55,maxSec:2});setTimeout(()=>safeFn(()=>Bank.play("deep_stone",{gain:0.5,maxSec:3})),260);});
  narrate(`Вы протискиваетесь в ход: тайная палата, ${v.вид}. Здесь пусто — находку вы уже взяли. Лаз назад — у вас под ногами.`);
  safeFn(()=>{refresh();saveGame(true);});return true;},
 /* открыть заново: та же вещь, тот же рычаг, та же стена */
 открыть(x,y,v,propId,поМесту,как){this.откр()[v.ключ]=1;const z=passageNote(x,y,propId,поМесту);
  safeFn(()=>{Bank.play("oc_lock",{gain:0.6,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("oc_gate_move",{gain:0.55,maxSec:3})),320);
   setTimeout(()=>safeFn(()=>beaconAt("stairs_down",x-G.place.x,y-G.place.y,0,Math.max(Math.abs(x-G.place.x),Math.abs(y-G.place.y)))),800);});
  narrate(`${как} Лаз в тайную палату открыт снова; палата за ним пуста — находку вы уже взяли. Коснитесь дважды или шагните туда — войдёте.`,{interrupt:false});
  safeFn(()=>saveGame(true));return z;},
 /* что сказать о лазе рядом: один раз, когда он оказался под рукой */
 рядомБыл:"",
 весть(){const p=G.place;if(!p||p.тайник||G.flight)return "";
  const z=safeFn(()=>passageAt(p.x,p.y),null);
  if(z&&(z.x!==p.x||z.y!==p.y)){const k="здесь:"+z.ключ+"@"+p.x+","+p.y;if(this.рядомБыл===k)return "";this.рядомБыл=k;
   return `Здесь ход в тайную палату — ${this.где(z.x-p.x,z.y-p.y)}: шагните туда или коснитесь дважды — спуститесь.`;}
  let бл=null;for(let dy=-1;dy<=1&&!бл;dy++)for(let dx=-1;dx<=1&&!бл;dx++){if(!dx&&!dy)continue;const q=safeFn(()=>passageAt(p.x+dx,p.y+dy),null);
   if(q&&q.x===p.x+dx&&q.y===p.y+dy)бл=q;}
  if(!бл){if(this.рядомБыл&&!this.рядомБыл.startsWith("здесь:"))this.рядомБыл="";return "";}
  const k="рядом:"+бл.ключ;if(this.рядомБыл===k)return "";this.рядомБыл=k;
  return `Рядом лаз в тайную палату — ${this.где(бл.x-p.x,бл.y-p.y)}: шагните туда или коснитесь дважды — спуститесь.`;}};
/* пол палаты — просто пол: ни в «объектах рядом», ни в описании проходов */
safeFn(()=>{const nf0=nearFeatures;nearFeatures=function(rad){const r=(nf0.apply(this,arguments)||[]).filter(o=>o.t!=="q");
 try{const p=G.place;if(p&&!p.тайник){const место=placeKey(p.bx,p.by,p.depth),b=passageBook();
  for(const k in b){const z=b[k];if(!z||z.место!==место)continue;const ход=passageAt(z.x,z.y);if(!ход||ход.x!==z.x||ход.y!==z.y)continue;
   const dx=z.x-p.x,dy=z.y-p.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(!d||d>rad)continue;
   const есть=r.find(o=>o.x===z.x&&o.y===z.y);
   if(есть){есть.name=`${есть.name}: здесь открыт лаз в тайную палату`;continue;}
   r.push({x:z.x,y:z.y,t:"лаз",d,dx,dy,dir:dirBetween(dx,dy),name:"лаз в тайную палату",bid:"stairs_down"});}
  r.sort((a,b)=>a.d-b.d);}}catch(_){}
 return r;};});
safeFn(()=>{const d0=describeHere;describeHere=function(){const s=d0.apply(this,arguments);
 return typeof s==="string"?s.replace(/ — пол тайной палаты/g,"").replace(/Здесь: пол тайной палаты\. ?/g,""):s;};});
/* подпись клетки: отъехавшая кладка — лаз; вещь, за которой ход, — с лазом */
safeFn(()=>{const tl0=tileLabel;tileLabel=function(t,x,y){const s=tl0.apply(this,arguments);
 try{if(G.place&&!G.place.тайник&&Number.isFinite(x)){const z=passageAt(x,y);
  if(z&&z.x===x&&z.y===y){if(t==="#")return "лаз в тайную палату";return `${s}: здесь открыт лаз в тайную палату`;}}}catch(_){}
 return s;};});
/* ходы, открытые заново, — тоже ходы */
safeFn(()=>{const pa0=passageAt;passageAt=function(x,y){const r=pa0.apply(this,arguments);if(r)return r;
 try{const p=G.place;if(!p||p.тайник)return null;const о=Тайна150.откр();if(!Object.keys(о).length)return null;
  const место=placeKey(p.bx,p.by,p.depth),b=passageBook();
  for(const k in о){const z=b[k];if(!z||z.место!==место||!secretTaken(k))continue;
   if((z.x===x&&z.y===y)||(z.рычаг&&z.рычаг.x===x&&z.рычаг.y===y))return Object.assign({ключ:k},z);}}catch(_){}
 return null;};});
safeFn(()=>{const e0=enterSecret;enterSecret=function(x,y,propId,поМесту){const p=G.place;
 if(p&&!p.тайник){const v=safeFn(()=>secretVault(p.bx,p.by,x,y),null);if(v&&secretTaken(v.ключ)&&Тайна150.откр()[v.ключ])return Тайна150.войтиПусто(x,y,v,propId,поМесту);}
 return e0.apply(this,arguments);};});
/* выбрались из пустой палаты — лаз закрылся */
safeFn(()=>{const x0=exitSecret;exitSecret=function(){const т=G.place&&G.place.тайник;const r=x0.apply(this,arguments);
 try{if(r&&т&&secretTaken(т.ключ)){delete Тайна150.откр()[т.ключ];const род=Тайна150.род(т.ключ);
  safeFn(()=>setTimeout(()=>safeFn(()=>Bank.play(род==="завал"?"ad_hoe":"deep_stone",{gain:0.55,maxSec:3})),700));
  const слово={вещь:`За спиной ${Тайна150.вещь(т.ключ)} встаёт на место: лаз закрылся. Чтобы открыть его снова, ещё раз троньте то, что его открыло.`,
   рычаг:"Кладка за спиной задвинулась, рычаг поднялся: лаз закрылся. Потяните рычаг ещё раз — откроется снова.",
   стена:"Кладка за спиной задвинулась: лаз закрылся. Простучите эту стену ещё раз — откроется снова.",
   завал:"За спиной осыпались камни: пролом засыпало насовсем. Зал за ним вы уже выбрали."}[род];
  setTimeout(()=>safeFn(()=>narrate(слово,{interrupt:false})),900);}}catch(_){}
 return r;};});
/* та же вещь или та же стена открывают выбранную палату снова */
safeFn(()=>{const r0=revealSecret;revealSecret=function(x,y,propId,поМесту){const p=G.place;
 try{if(p&&!p.тайник){const v=secretVault(p.bx,p.by,x,y);
  if(v&&secretTaken(v.ключ)){let pid=propId;if(pid===undefined&&!поМесту)pid=safeFn(()=>{const pr=propAt(x,y);return pr&&pr.id;},undefined);
   if(!propHidesSwitch(p.bx,p.by,p.depth,x,y,pid))return false;
   if(Тайна150.откр()[v.ключ])return Тайна150.войтиПусто(x,y,v,pid,поМесту);
   const как=pid&&PROP_BY_ID[pid]?`${PROP_BY_ID[pid].n[0].toUpperCase()+PROP_BY_ID[pid].n.slice(1)} снова отходит в сторону.`:"Кладка снова поехала в сторону.";
   Тайна150.открыть(x,y,v,pid,поМесту,как);return true;}}}catch(_){}
 return r0.apply(this,arguments);};});
/* рычаг: поднять и опустить снова — открыть выбранную палату ещё раз */
safeFn(()=>{const pull0=IACT.pull;if(!pull0)return;
 iact("pull",Object.assign({},pull0,{делать:o=>{
  try{if(G.place&&propMarked(o.x,o.y,"pulled")&&!passageAt(o.x,o.y)&&leverKind(o.x,o.y)==="ход"){const p=G.place;
   for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[0,0]]){const v=secretVault(p.bx,p.by,o.x+dx,o.y+dy);
    if(secretTaken(v.ключ)&&propHidesSwitch(p.bx,p.by,p.depth,o.x+dx,o.y+dy,undefined)){
     safeFn(()=>{Bank.play("oc_lift_start",{seed:o.x+o.y,gain:0.6,maxSec:2});setTimeout(()=>safeFn(()=>Bank.play("oc_chain",{seed:o.y,gain:0.5,maxSec:2})),320);});
     const z=Тайна150.открыть(o.x+dx,o.y+dy,v,null,true,"Рычаг со скрипом поднялся и снова пошёл вниз: кладка рядом опять отъехала.");
     if(z)z.рычаг={x:o.x,y:o.y};return true;}}}}catch(_){}
  return pull0.делать(o);}}));});
/* шаг: встали на вещь, за которой открыт ход, — «здесь лаз», второй шаг в ту же сторону или двойное касание
   уводят вниз (как ступени); встали на место завала с проломом или рядом с лазом — сказать один раз */
safeFn(()=>{const m0=moveInside;moveInside=function(dir){const p=G.place;
 try{if(p&&!p.тайник&&!G.inCombat&&!G.flight&&p.arm&&p.arm.t==="лаз"&&p.arm.x===p.x&&p.arm.y===p.y&&p.arm.dir===dir){p.arm=null;
  const z=passageAt(p.x,p.y);if(z)return enterSecret(z.x,z.y,z.prop||undefined,z.поМесту);}}catch(_){}
 const r=m0.apply(this,arguments);
 if(r!==false)safeFn(()=>{const q=G.place;if(!q||q.тайник||G.flight)return;
  const z=passageAt(q.x,q.y);
  if(z&&z.x===q.x&&z.y===q.y){q.arm={x:q.x,y:q.y,dir,t:"лаз"};Тайна150.рядомБыл="на:"+z.ключ;
   narrate(`Здесь лаз в тайную палату. Коснитесь поля дважды или шагните ещё раз ${dirWhither(dir)} — спуститесь.`,{interrupt:true});return;}
  const в=Тайна150.весть();if(в)narrate(в,{interrupt:false});});
 return r;};});

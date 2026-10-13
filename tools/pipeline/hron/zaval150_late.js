/* ════════════════════════════════════════════════════════════════════════
   ЗАВАЛ РАЗБИРАЮТ НЕ ЗРЯ (15.0, просьба игрока)
   «Разбираешь завал — говорит: слева открылся проход; идёшь — а там стена.
   Игрок разбирает завал зря». Слово «проход свободен» звучало после любого
   завала, даже когда камни лежали в тупиковом кармане или посреди зала: шаг
   на расчищенную клетку — и дальше та же кладка, ничего нового. Пролом в
   стене открывался лишь в каждом пятом разборе, а в трети не было вовсе
   ничего. Теперь:
   1. обвал ложится туда, где перегораживает путь, — на клетку, за которой
      ход идёт дальше; в тупиковый карман — только если больше некуда;
   2. итог разбора говорит, что за завалом на самом деле: куда ведёт ход
      дальше — или что за ним тупик;
   3. тупиковый завал не бывает пустым: за ним всегда ниша с припрятанным,
      жила или пролом в забытый зал.
   ════════════════════════════════════════════════════════════════════════ */
const Завал150={
 шаг(lvl,x,y){const t=safeFn(()=>tileAt(lvl,x,y),"#");return !!t&&t!=="#"&&t!=="%"&&!(TILE[t]&&TILE[t].solid);},
 /* куда за клеткой можно идти дальше — кроме клетки, с которой пришли */
 дальше(lvl,x,y,ox,oy){const out=[];for(const d of ["N","E","S","W"]){const [a,b]=DIRV[d];if(x+a===ox&&y+b===oy)continue;if(this.шаг(lvl,x+a,y+b))out.push(d);}return out;},
 ключ(dx,dy){return Object.keys(DIRV).find(k=>DIRV[k][0]===dx&&DIRV[k][1]===dy)||null;}};
/* обвал — поперёк пути, а не в карман */
safeFn(()=>{const p0=placeRubble;placeRubble=function(){const p=G.place,lvl=safeFn(()=>curLevel(),null);if(!p||!lvl||p.тайник)return p0.apply(this,arguments);
 const есть=safeFn(()=>rubbleAdj(),null);if(есть)return есть;
 const [fx,fy]=(lastMoveDir&&DIRV[lastMoveDir])||[0,-1];
 const кл=[[fx,fy]].concat([[0,-1],[1,0],[0,1],[-1,0]].filter(([a,b])=>!(a===fx&&b===fy)&&!(a===-fx&&b===-fy)),[[-fx,-fy]]);
 for(const [dx,dy] of кл){const x=p.x+dx,y=p.y+dy;
  if(tileAt(lvl,x,y)!==".")continue;if(safeFn(()=>trapAt(x,y),null))continue;
  if(!Завал150.дальше(lvl,x,y,p.x,p.y).length)continue;
  setPlaceMark(x,y,"rubble");G.rubbleN=(Number(G.rubbleN)||0)+1;
  safeFn(()=>Spatial.role("od_rocks",dx,dy,{gain:0.7,maxSec:3})||Bank.play("od_rocks",{gain:0.7,maxSec:3}));
  return {x,y};}
 return p0.apply(this,arguments);};});
/* разбор: правда о том, что за завалом, и тупик — никогда не впустую */
safeFn(()=>{const c0=clearRubble;clearRubble=function(x,y){
 const p=G.place,lvl=safeFn(()=>curLevel(),null);if(!p||!lvl||tileAt(lvl,x,y)!=="%")return c0.apply(this,arguments);
 const d=3+Math.floor(Math.random()*5);G.hp=Math.max(1,G.hp-d);
 G.hour+=1;if(G.hour>=24){G.hour-=24;G.day++;}
 setPlaceMark(x,y,"cleared");G.rubbleN=Math.max(0,(Number(G.rubbleN)||1)-1);
 G.inv["камень"]=(Number(G.inv["камень"])||0)+2;G.xp+=safeFn(()=>xpGain(30),30);
 safeFn(()=>{Bank.play("ad_hoe",{gain:0.6,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("od_rocks",{gain:0.6,maxSec:3})),700);});
 const h=rubbleHash(x,y),dx=x-p.x,dy=y-p.y;const к=Завал150.ключ(dx,dy);
 const где=к?dirWhere(к):(safeFn(()=>dirBetween(dx,dy),"")||"рядом");
 const куда=Завал150.дальше(lvl,x,y,p.x,p.y);const тупик=!куда.length;
 let т=`Час работы и сбитые руки: −${d} здоровья. Камень за камнем завал ${где} ушёл в сторону. Камень ×2.`
  +(тупик?" За ним тупик: кругом сплошная кладка.":` Шагните ${к?dirWhither(к):"туда"} — за ним ход ведёт дальше: ${куда.map(z=>dirWhither(z)).join(", ")}.`);
 let исход=h<0.35?"пусто":h<0.6?"ниша":h<0.8?"пролом":"жила";
 if(тупик&&исход==="пусто")исход=hashName(x,y,9124)<0.5?"ниша":"жила";
 const ниша=()=>{const з=10+Math.floor(hashName(x,y,9121)*35);G.gold=(Number(G.gold)||0)+з;
  const вещь=hashName(y,x,9122)<0.4?safeFn(()=>genLoot(p.bx,p.by,x*97+y+p.depth,Math.max(1,p.depth)),null):null;if(вещь)G.gear.push(вещь);
  setTimeout(()=>safeFn(()=>Bank.play("treasure",{gain:0.6,maxSec:3})),1400);
  т+=` Под камнями открылась ниша в стене, а в ней припрятано: ${з} золота${вещь?` и ${вещь.name||"вещь"}`:""}.`;};
 const жила=()=>{const r=hashName(x,y,9123)<0.5?"руда":"кристалл";G.inv[r]=(Number(G.inv[r])||0)+1;
  setTimeout(()=>safeFn(()=>Bank.play("craft_ore",{gain:0.55,maxSec:3})),1400);т+=` Обвал вскрыл жилу: ${r} ×1.`;};
 if(исход==="ниша")ниша();
 else if(исход==="жила")жила();
 else if(исход==="пролом"){let ход=null;
  for(const [ax,ay] of [[0,-1],[1,0],[0,1],[-1,0]]){const wx=x+ax,wy=y+ay;
   if(wx<=0||wy<=0||wx>=lvl.w-1||wy>=lvl.h-1||tileAt(lvl,wx,wy)!=="#")continue;
   const v=secretVault(p.bx,p.by,wx,wy);if(secretTaken(v.ключ))continue;
   secretMark(v.ключ,"найден");
   const з=passageNote(wx,wy,null,true);if(з)з.рычаг={x,y};ход={wx,wy,v};break;}
  if(ход){setTimeout(()=>safeFn(()=>{Bank.play("ad_gate_open",{gain:0.6,maxSec:4});beaconAt("stairs_down",ход.wx-p.x,ход.wy-p.y,0,1);}),1400);
   const к2=Завал150.ключ(ход.wx-x,ход.wy-y);
   т+=` А в стене за завалом — пролом: ход в забытый зал, ${ход.v.вид}. Внутри ${ход.v.страж}. Коснитесь поля дважды — войдёте сразу; или шагните на место завала и дальше ${к2?dirWhither(к2):"в пролом"}.`;
   safeFn(()=>journal("За разобранным завалом найден ход в забытый зал."));}
  else if(тупик)ниша();
  else т+=" В стенах за ним — только мокрая кладка.";}
 narrate(т,{interrupt:false});
 safeFn(()=>{refresh();saveGame(true);});
 return true;};});

/* обёртки 15.0 показывают текст прежнего правила (см. ДО150 в начале подъёмников); этот модуль — последний из модулей 15.0 */
safeFn(()=>{if(typeof ДО150==="undefined")return;for(const [k,f] of Object.entries(ДО150)){const тек=window[k];
 if(typeof тек==="function"&&тек!==f&&!Object.prototype.hasOwnProperty.call(тек,"toString"))matKeep(f,тек);}});

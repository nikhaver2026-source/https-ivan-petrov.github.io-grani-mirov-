/* ════════ 15.0: ЗАДАНИЯ РАЗНЫЕ — ОСНОВНЫЕ И ПОБОЧНЫЕ; ПОБОЧНЫХ ДЕСЯТЬ ════════
   Просьба игрока: «чтобы убить можно было не только двух монстров, а каких-то
   конкретно, или куда-то сходить в подземелье, или ещё что-то; задания
   абсолютно разнообразные, как основные, так и побочные; побочных не три, а
   десять».
   1. Побочных у жителя — десять на день, все разные: к прежним шести родам
      просьб (пропажа, гостинец, покой, зверь у дороги, весточка, заимка)
      прибавлено десять — твари определённого рода, пропавший в подземелье,
      нечисть из названного подземелья, подземный клад, логово у дороги,
      ночной вой, вожак стаи, межевые камни, сторожевой зверь, лекарство.
      У стражи — пятнадцать родов службы вместо восьми.
   2. Основное задание: «очисти округу — убей двух монстров» стало делом с
      целью: твари определённого рода, нечисть названного подземелья, логово,
      ночная охота, вожак; «дойди до отметки» — спуск в названное подземелье
      или обход трёх межей; именная охота — на тварь, что водится здесь же.
   3. Новые дела считаются сами: убитая тварь своего рода, у логова, ночью,
      сильная; спуск на ярус; открытый подземный сундук; межа на месте;
      приручённый зверь — и каждый шаг звучит словом и звуком.
   4. Незакрытых дел можно держать до двадцати (было десять). */

const Q150={
 /* Роды тварей словами: «из …» — кого бить, «кто» — кто бродит. */
 FAM:{beast:{из:"из диких зверей",кто:"дикие звери"},crawler:{из:"из ползучих: пауков, змей, червей",кто:"ползучие твари"},
  humanoid:{из:"из разбойного люда: гоблинов, кобольдов, бандитов",кто:"разбойный люд"},undead:{из:"из нежити",кто:"нежить"},
  bone:{из:"из костяных тварей",кто:"костяные твари"},spirit:{из:"из призраков",кто:"призраки"},giant:{из:"из великанов",кто:"великаны"},
  construct:{из:"из големов и механизмов",кто:"големы"},deep:{из:"из глубинных тварей",кто:"глубинные твари"},
  bird:{из:"из хищных птиц",кто:"хищные птицы"},dragon:{из:"из драконьего племени",кто:"драконье племя"},fiend:{из:"из бесов",кто:"бесы"}},
 НОВЫЕ:new Set(["kill_fam","dng_depth","dng_kill","dng_chest","zone_kill","night_kill","elite","explore","tame"]),
 terr(n){return safeFn(()=>cellContent(n.x,n.y).terrain[0],"plains")||"plains";},
 /* Твари этих мест: кого здесь можно встретить. */
 local(n){const t=this.terr(n);let L=MONSTERS.filter(m=>(m.biomes||[]).includes(t));
  if(!L.length)L=MONSTERS.filter(m=>(m.biomes||[]).some(b=>b==="plains"||b==="forest"||b==="road"));return L;},
 localFams(n){const s=new Set();for(const m of this.local(n)){const f=safeFn(()=>foeFamily(m),"beast");if(this.FAM[f])s.add(f);}return s.size?[...s]:["beast"];},
 /* Точка в округе: на r клеток вокруг жителя, не на нём самом. */
 pt(n,h,k,r){let dx=Math.round((h(k)-0.5)*2*r),dy=Math.round((h(k+1)-0.5)*2*r);if(Math.abs(dx)+Math.abs(dy)<3){dx=dx>=0?r:-r;}
  return {x:Math.max(0,Math.min(WORLD_MAX-1,n.x+dx)),y:Math.max(0,Math.min(WORLD_MAX-1,n.y+dy))};},
 /* Подземелья поблизости (руины, пещерные зевы): обзор один раз на жителя. */
 _dng:new Map(),
 dungeons(n){const key=(n.x|0)+","+(n.y|0);if(this._dng.has(key))return this._dng.get(key);const out=[];const R=16;
  for(let y=n.y-R;y<=n.y+R;y++)for(let x=n.x-R;x<=n.x+R;x++){if(x<0||y<0||x>=WORLD_MAX||y>=WORLD_MAX)continue;
   const s=safeFn(()=>cellContent(x,y).structure,null);if(!s||PLACE_KIND[s.type]!=="dungeon"||safeFn(()=>airOnly(s.type),false))continue;
   out.push({x,y,name:s.name||"подземелье",type:s.type,d:Math.max(Math.abs(x-n.x),Math.abs(y-n.y))});}
  out.sort((a,b)=>a.d-b.d);if(this._dng.size>64)this._dng.clear();this._dng.set(key,out);return out;},
 dungeon(n,hv){const L=this.dungeons(n).slice(0,4);return L.length?L[Math.floor(hv*L.length)%L.length]:null;},
 тварей(n){return plural(n,"тварь","твари","тварей");},
 /* Свой жребий у каждого жителя: жители одного города стоят на одной клетке. */
 salt(n){let h=2166136261;const s=String((n&&(n.key||n.name))||"");for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;},
 /* Шаг дела: слово и звук; выполнено — победный звук и куда вернуться. */
 шаг(q,было){const стало=this.сделано(q);
  if(стало){safeFn(()=>UI.triumph());narrate(`Задание «${q.заглавие||"дело"}» выполнено. Вернитесь к ${q.npc||"заказчику"}.`,{interrupt:false});
   safeFn(()=>journal(`Цель задания выполнена: ${q.заглавие||q.text}.`));}
  else{safeFn(()=>UI.natStep("b_quest",0.5,0.95+(Number(q.have)||0)*0.04));narrate(`Задание «${q.заглавие||"дело"}»: ${qProgressText(q)}.`,{interrupt:false});}
  safeFn(()=>saveGame(true));},
 сделано(q){if(q.type==="dng_depth"||q.type==="explore")return !!q.doneFlag;return (Number(q.have)||0)>=(Number(q.need)||1);},
 open(){return (G.quests||[]).filter(q=>q&&!q.done&&this.НОВЫЕ.has(q.type));},
 inc(q){if(this.сделано(q))return;q.have=Math.min(Number(q.need)||1,(Number(q.have)||0)+1);this.шаг(q);},
 /* ── События ── */
 onKill(m){if(!m)return;const fam=safeFn(()=>foeFamily(m),"beast");const P=G.place;const вПодз=!!(P&&P.kind==="dungeon");const ночь=!!safeFn(()=>isNight(),false);
  for(const q of this.open()){
   if(q.type==="kill_fam"&&fam===q.fam)this.inc(q);
   else if(q.type==="dng_kill"&&вПодз&&(Number(P.depth)||0)>=(Number(q.depth)||1)&&(!q.bx||(P.bx===q.bx&&P.by===q.by)))this.inc(q);
   else if(q.type==="zone_kill"&&!P&&Math.max(Math.abs(G.x-q.tx),Math.abs(G.y-q.ty))<=(Number(q.r)||4))this.inc(q);
   else if(q.type==="night_kill"&&ночь)this.inc(q);
   else if(q.type==="elite"&&(Number(m.lvl)||1)>=(Number(q.lvl)||1))this.inc(q);}},
 onDepth(){const P=G.place;if(!P||P.kind!=="dungeon")return;const d=Number(P.depth)||0;
  for(const q of this.open()){if(q.type!=="dng_depth"||q.doneFlag)continue;if(q.bx&&(P.bx!==q.bx||P.by!==q.by))continue;
   q.глубже=Math.max(Number(q.глубже)||0,d);if(d>=(Number(q.depth)||1)){q.doneFlag=true;this.шаг(q);}}},
 onChest(){const P=G.place;if(!P||P.kind!=="dungeon")return;for(const q of this.open())if(q.type==="dng_chest")this.inc(q);},
 onStep(){if(G.place)return;for(const q of this.open()){if(q.type!=="explore"||q.doneFlag)continue;const got=q.got||(q.got=[]);
  const i=(q.pts||[]).findIndex((p,j)=>got.indexOf(j)<0&&p[0]===G.x&&p[1]===G.y);if(i<0)continue;got.push(i);
  const ещё=(q.pts||[]).map((p,j)=>j).filter(j=>got.indexOf(j)<0);
  if(ещё.length){const p=q.pts[ещё[0]];q.tx=p[0];q.ty=p[1];safeFn(()=>Bank.play("arte_find",{gain:0.5,maxSec:2}));
   narrate(`Межа на месте: ${got.length} из ${q.need}. Следующая — (${p[0]}; ${p[1]}).`,{interrupt:false});safeFn(()=>saveGame(true));}
  else{q.doneFlag=true;this.шаг(q);}}},
 onTame(){for(const q of this.open())if(q.type==="tame")this.inc(q);}};

/* ── 1. Новые просьбы жителей ── */
SIDE_KINDS.push(
 {id:"род",заг:"Твари у околицы",gen(n,t,h){const fams=Q150.localFams(n);const fam=fams[Math.floor(h(20)*fams.length)%fams.length];const need=2+Math.floor(h(21)*3);
  return {type:"kill_fam",fam,need,род:"hunt",text:`У околицы бродят ${Q150.FAM[fam].кто}. Убейте ${need} ${Q150.тварей(need)} ${Q150.FAM[fam].из}, и в округе станет тише.`,reward:{gold:11*t+10*need,xp:20*t+9*need}};}},
 {id:"пропавший",заг:"Пропавший в подземелье",gen(n,t,h){const d=Q150.dungeon(n,h(22));const depth=2+Math.floor(h(23)*2);
  if(!d)return {type:"dng_depth",depth,род:"rescue",text:`Брат ушёл в подземелье и не вернулся. Спуститесь в любое подземелье до ${depth}-го яруса и поищите его следы.`,reward:{gold:12*t+12*depth,xp:22*t+14*depth}};
  return {type:"dng_depth",depth,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,род:"rescue",text:`Брат ушёл в «${d.name}» у (${d.x}; ${d.y}) и не вернулся. Спуститесь там до ${depth}-го яруса и поищите его следы.`,reward:{gold:12*t+12*depth+Math.min(20,d.d),xp:22*t+14*depth}};}},
 {id:"нечисть",заг:"Нечисть из подземелья",gen(n,t,h){const d=Q150.dungeon(n,h(24));if(!d)return null;const need=3+Math.floor(h(25)*3);const depth=1+Math.floor(h(26)*2);
  return {type:"dng_kill",need,depth,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,род:"war",text:`Из «${d.name}» у (${d.x}; ${d.y}) по ночам лезет нечисть. Спуститесь${depth>1?` до ${depth}-го яруса`:""} и убейте там ${need} ${Q150.тварей(need)}.`,reward:{gold:12*t+11*need,xp:24*t+11*need}};}},
 {id:"клад",заг:"Подземный клад",gen(n,t,h){const need=1+Math.floor(h(27)*2);
  return {type:"dng_chest",need,род:"archeo",text:`Дед говорил, в подземных сундуках лежит старое добро. Откройте ${need} ${plural(need,"сундук","сундука","сундуков")} в подземельях — потом расскажете, что нашли.`,reward:{gold:10*t+16*need,xp:18*t+12*need}};}},
 {id:"логово",заг:"Логово у дороги",gen(n,t,h){const p=Q150.pt(n,h,28,10);const need=2+Math.floor(h(30)*2);
  return {type:"zone_kill",tx:p.x,ty:p.y,r:4,need,род:"hunt",text:`У (${p.x}; ${p.y}) завелось логово. Убейте ${need} ${Q150.тварей(need)} не дальше четырёх шагов от него.`,reward:{gold:12*t+11*need,xp:22*t+10*need}};}},
 {id:"вой",заг:"Ночной вой",gen(n,t,h){const need=1+Math.floor(h(31)*2);
  return {type:"night_kill",need,род:"hunt",text:`Каждую ночь кто-то воет под окнами. Убейте ${need} ${Q150.тварей(need)} ночью — с вечера до рассвета.`,reward:{gold:12*t+13*need,xp:22*t+12*need}};}},
 {id:"вожак",заг:"Вожак стаи",gen(n,t,h){const lvl=Math.max(2,(Number(G.level)||1)+1);
  return {type:"elite",lvl,need:1,род:"hunt",text:`Стаю в округе водит вожак — сильнее прочих. Найдите и убейте тварь не слабее ${lvl}-го уровня.`,reward:{gold:16*t+22,xp:28*t+20}};}},
 {id:"межа",заг:"Межевые камни",gen(n,t,h){const P=[0,1,2].map(i=>Q150.pt(n,h,32+i*2,8));
  return {type:"explore",pts:P.map(p=>[p.x,p.y]),got:[],need:3,tx:P[0].x,ty:P[0].y,род:"study",text:`Обойдите мои межевые камни: (${P[0].x}; ${P[0].y}), (${P[1].x}; ${P[1].y}) и (${P[2].x}; ${P[2].y}). Целы ли они?`,reward:{gold:9*t+18,xp:16*t+16}};}},
 {id:"сторож",заг:"Сторожевой зверь",gen(n,t,h){
  return {type:"tame",need:1,род:"hunt",text:`В округе неспокойно, а сторожевого зверя у нас нет. Приручите любого дикого зверя: подойдите к нему без оружия и предложите корм. Зверь останется у вас — мне довольно знать, что есть кому сторожить.`,reward:{gold:12*t+16,xp:20*t+16}};}},
 {id:"лекарство",заг:"Лекарство",gen(n,t,h){const res=["грибы","трава","ягоды"][Math.floor(h(38)*3)%3];const need=2+Math.floor(h(39)*2);const d=safeFn(()=>resourceDestination(n,res),{tx:n.x,ty:n.y});
  return {type:"fetch",res,need,tx:d.tx,ty:d.ty,род:"rescue",text:`Сын занемог, а знахарка велит отвар — нужно ${need} шт. «${res}». Говорят, растёт возле (${d.tx}; ${d.ty}).`,reward:{gold:9*t+9*need,xp:15*t+7*need}};}});
/* ── У стражи — пятнадцать родов службы ── */
GUARD_KINDS.push(
 {id:"ярус",заг:"Зачистка яруса",gen(n,t,h){const d=Q150.dungeon(n,h(40));if(!d)return null;const need=4+Math.floor(h(41)*3);
  return {type:"dng_kill",need,depth:2,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,род:"war",text:`В «${d.name}» у (${d.x}; ${d.y}) копится нечисть. Спуститесь на второй ярус или ниже и убейте там ${need} ${Q150.тварей(need)}.`,reward:{gold:14*t+11*need,xp:28*t+11*need}};}},
 {id:"глубины",заг:"Разведка глубин",gen(n,t,h){const d=Q150.dungeon(n,h(42));const depth=3;
  return d?{type:"dng_depth",depth,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,род:"war",text:`Нужно знать, что творится в «${d.name}» у (${d.x}; ${d.y}). Спуститесь до третьего яруса и доложите.`,reward:{gold:14*t+30,xp:28*t+30}}
   :{type:"dng_depth",depth,род:"war",text:`Нужно знать, что творится под землёй. Спуститесь в любое подземелье до третьего яруса и доложите.`,reward:{gold:14*t+30,xp:28*t+30}};}},
 {id:"логово",заг:"Логово у тракта",gen(n,t,h){const p=Q150.pt(n,h,43,12);const need=3;
  return {type:"zone_kill",tx:p.x,ty:p.y,r:4,need,род:"hunt",text:`У тракта, возле (${p.x}; ${p.y}), твари устроили логово. Убейте там трёх — не дальше четырёх шагов от него.`,reward:{gold:13*t+30,xp:24*t+30}};}},
 {id:"ночная",заг:"Ночная стража",gen(n,t,h){const need=2;
  return {type:"night_kill",need,род:"war",text:`Ночью стены держать некому. Выйдите в ночную стражу: убейте двух тварей между закатом и рассветом.`,reward:{gold:12*t+26,xp:24*t+24}};}},
 {id:"вожак",заг:"Вожак у стен",gen(n,t,h){const lvl=Math.max(2,(Number(G.level)||1)+1);
  return {type:"elite",lvl,need:1,род:"hunt",text:`К стенам ходит вожак — тварь сильнее прочих. Убейте тварь не слабее ${lvl}-го уровня.`,reward:{gold:18*t+24,xp:30*t+22}};}},
 {id:"шайка",заг:"Шайка на тракте",gen(n,t,h){const fams=Q150.localFams(n);const fam=fams.indexOf("humanoid")>=0?"humanoid":fams[Math.floor(h(44)*fams.length)%fams.length];const need=3;
  return {type:"kill_fam",fam,need,род:"war",text:`На тракте не дают проходу ${Q150.FAM[fam].кто}. Убейте ${need} ${Q150.тварей(need)} ${Q150.FAM[fam].из}.`,reward:{gold:14*t+30,xp:26*t+26}};}},
 {id:"межи",заг:"Обход межевых столбов",gen(n,t,h){const P=[0,1,2].map(i=>Q150.pt(n,h,45+i*2,10));
  return {type:"explore",pts:P.map(p=>[p.x,p.y]),got:[],need:3,tx:P[0].x,ty:P[0].y,род:"war",text:`Обойдите межевые столбы: (${P[0].x}; ${P[0].y}), (${P[1].x}; ${P[1].y}) и (${P[2].x}; ${P[2].y}). Проверьте, не тронуты ли.`,reward:{gold:10*t+22,xp:18*t+20}};}});

/* ── 2. Десять побочных на день вместо трёх ── */
const Q150_SIDE_N=10;
sideQuestsFor=matKeep(sideQuestsFor,function(n){
 try{
  if(!n||G.dark)return [];
  const day=Number(G.day)||1,t=Math.max(1,Number(n.tier)||1),out=[];
  const взятые=new Set((G.quests||[]).map(q=>q&&q.id));
  const идут=new Set();
  const KINDS=GUARD_RE.test(String(n.prof||""))?GUARD_KINDS:SIDE_KINDS;
  for(let i=0;i<Q150_SIDE_N;i++){
   const h=j=>hashName((n.x|0)+i*7+j*3,(n.y|0)+day*13+String(n.key).length,9700+j+i*19);
   let k=Math.floor(h(0)*KINDS.length)%KINDS.length,шаг=0;
   while(идут.has(k)&&шаг<KINDS.length){k=(k+1)%KINDS.length;шаг++;}
   if(идут.has(k))break;
   идут.add(k);
   const вид=KINDS[k];let q=safeFn(()=>вид.gen(n,t,h),null);
   /* род не сложился (рядом нет подземелья, нет городов) — берём следующий свободный */
   let ещё=0;while(!q&&ещё<KINDS.length){k=(k+1)%KINDS.length;ещё++;if(идут.has(k))continue;идут.add(k);q=safeFn(()=>KINDS[k].gen(n,t,h),null);if(q){Object.assign(q,{вид:KINDS[k].id,заглавие:KINDS[k].заг});}}
   if(!q)continue;
   if(!q.вид)Object.assign(q,{вид:вид.id,заглавие:вид.заг});
   Object.assign(q,{id:`${n.key}s${day}_${i}`,npc:n.name,npcKey:n.key,побочный:true,have:0});
   q.text=safeFn(()=>Род.жителя(n,q.text),q.text);
   if(!взятые.has(q.id))out.push(q);}
  return out;
 }catch(_){return [];}});

/* ── 3. Основное задание с целью ── */
safeFn(()=>{const qr0=questForRaw;questForRaw=matKeep(qr0,function(npc){const q=qr0.apply(this,arguments);
 try{
  if(!q||G.dark||q.chain||!npc)return q;
  const t=Math.max(1,Number(npc.tier)||1);const соль=Q150.salt(npc);const h=k=>H(npc.x+соль%1009,npc.y+соль%997,9150+k);const базово={id:q.id,npc:q.npc};
  /* «Очисти округу: убей N монстров» — дело с целью */
  if(q.type==="kill"&&/^Очисти округу/.test(String(q.text||""))){const r=h(0);
   if(r<0.25){const fams=Q150.localFams(npc);const fam=fams[Math.floor(h(1)*fams.length)%fams.length];const need=2+t;
    return Object.assign(базово,{type:"kill_fam",fam,need,have:0,род:"hunt",заглавие:"Твари округи",text:`В округе расплодились ${Q150.FAM[fam].кто}. Убей ${need} ${Q150.тварей(need)} ${Q150.FAM[fam].из} и возвращайся.`,reward:{gold:30*t+8*need,xp:35*t+8*need}});}
   if(r<0.45){const d=Q150.dungeon(npc,h(2));if(d){const need=3+t,depth=1+Math.min(2,Math.floor(t/2));
    return Object.assign(базово,{type:"dng_kill",need,depth,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,have:0,род:"war",заглавие:"Нечисть подземелья",text:`Из «${d.name}» у (${d.x}; ${d.y}) лезет нечисть. Спустись${depth>1?` до ${depth}-го яруса`:""} и убей там ${need} ${Q150.тварей(need)}.`,reward:{gold:32*t+10*need,xp:40*t+10*need}});}}
   if(r<0.6){const p=Q150.pt(npc,h,3,12);const need=2+t;
    return Object.assign(базово,{type:"zone_kill",tx:p.x,ty:p.y,r:4,need,have:0,род:"hunt",заглавие:"Логово",text:`Возле (${p.x}; ${p.y}) логово тварей. Убей ${need} ${Q150.тварей(need)} не дальше четырёх шагов от него и возвращайся.`,reward:{gold:30*t+8*need,xp:36*t+8*need}});}
   if(r<0.75){const need=1+t;
    return Object.assign(базово,{type:"night_kill",need,have:0,род:"hunt",заглавие:"Ночная охота",text:`Твари выходят по ночам. Убей ${need} ${Q150.тварей(need)} между закатом и рассветом.`,reward:{gold:32*t+8*need,xp:38*t+8*need}});}
   if(r<0.9){const lvl=Math.max(2,(Number(G.level)||1)+1+Math.floor(t/2));
    return Object.assign(базово,{type:"elite",lvl,need:1,have:0,род:"hunt",заглавие:"Вожак",text:`Здешних тварей водит вожак. Найди и убей тварь не слабее ${lvl}-го уровня.`,reward:{gold:36*t+20,xp:44*t+20}});}
   return q;}
  /* «Дойди до отметки» — спуск в подземелье или обход меж */
  if(q.type==="visit"&&!q.куда&&/^Дойди до отметки/.test(String(q.text||""))){const r=h(4);
   if(r<0.35){const d=Q150.dungeon(npc,h(5));if(d){const depth=2+Math.min(2,Math.floor(t/2));
    return Object.assign(базово,{type:"dng_depth",depth,bx:d.x,by:d.y,tx:d.x,ty:d.y,куда:d.name,род:"study",заглавие:"Спуск в подземелье",text:`Из «${d.name}» у (${d.x}; ${d.y}) по ночам слышны странные звуки. Спустись там до ${depth}-го яруса и расскажи, что видел.`,reward:{gold:28*t+10*depth,xp:34*t+12*depth}});}}
   if(r<0.65){const P=[0,1,2].map(i=>Q150.pt(npc,h,6+i*2,14));
    return Object.assign(базово,{type:"explore",pts:P.map(p=>[p.x,p.y]),got:[],need:3,tx:P[0].x,ty:P[0].y,род:"study",заглавие:"Обход меж",text:`Обойди три межи: (${P[0].x}; ${P[0].y}), (${P[1].x}; ${P[1].y}) и (${P[2].x}; ${P[2].y}). Там видели чужих — проверь и возвращайся.`,reward:{gold:28*t+10,xp:34*t+10}});}
   return q;}
  /* Именная охота — на тварь, что водится здесь же */
  if(q.type==="hunt"&&q.monsterId){const t0=Q150.terr(npc);const м=MONSTERS.find(m=>m.id===q.monsterId);
   if(м&&!(м.biomes||[]).includes(t0)){const L=Q150.local(npc);const z=L[Math.floor(h(12)*L.length)%Math.max(1,L.length)];
    if(z){const need=1+(z.max>=8?0:1);
     return Object.assign(q,{monsterId:z.id,monsterName:z.n,need,have:0,
      text:`Особое задание: выследи и убей «${z.n}» — ${need>1?`${need} таких`:"одного такого"}. Эта тварь водится здесь, в местностях: ${z.biomes.map(b=>TERR[b]?TERR[b][1]:b).join(", ")}. Обычных монстров для этого задания мало — нужен именно этот вид.`});}}}
  return q;
 }catch(_){return q;}});});

/* ── 4. Как дело называется, сколько сделано, можно ли сдать ── */
safeFn(()=>{const n0=questNeedText;questNeedText=matKeep(n0,function(q){
 try{if(!q||!Q150.НОВЫЕ.has(q.type))return n0.apply(this,arguments);const T=Q150.тварей;
  switch(q.type){
   case "kill_fam":return `убить ${q.need} ${T(q.need)} ${(Q150.FAM[q.fam]||Q150.FAM.beast).из}`;
   case "dng_depth":return `спуститься${q.куда?` в «${q.куда}» (${q.tx}; ${q.ty})`:" в любое подземелье"} до ${q.depth}-го яруса`;
   case "dng_kill":return `убить ${q.need} ${T(q.need)}${q.куда?` в «${q.куда}» (${q.tx}; ${q.ty})`:" в подземелье"}${q.depth>1?`, на ${q.depth}-м ярусе или ниже`:""}`;
   case "dng_chest":return `открыть ${q.need} ${plural(q.need,"сундук","сундука","сундуков")} в подземельях`;
   case "zone_kill":return `убить ${q.need} ${T(q.need)} у логова (${q.tx}; ${q.ty})`;
   case "night_kill":return `убить ${q.need} ${T(q.need)} ночью`;
   case "elite":return `убить тварь не слабее ${q.lvl}-го уровня`;
   case "explore":return `обойти три межи: ${(q.pts||[]).map(p=>`(${p[0]}; ${p[1]})`).join(", ")}`;
   case "tame":return "приручить дикого зверя";}
 }catch(_){}return n0.apply(this,arguments);});});
safeFn(()=>{const p0=qProgressText;qProgressText=matKeep(p0,function(q){
 try{if(!q||!Q150.НОВЫЕ.has(q.type))return p0.apply(this,arguments);const есть=Math.min(Number(q.have)||0,Number(q.need)||1),нужно=Number(q.need)||1;
  switch(q.type){
   case "kill_fam":return `${есть} из ${нужно} — ${(Q150.FAM[q.fam]||Q150.FAM.beast).кто}`;
   case "dng_depth":return q.doneFlag?"ярус достигнут, вернитесь к заказчику":`спуститесь${q.куда?` в «${q.куда}» (${q.tx}; ${q.ty})`:" в любое подземелье"} до ${q.depth}-го яруса${q.глубже?`; глубже всего были на ${q.глубже}-м`:""}`;
   case "dng_kill":return `${есть} из ${нужно} ${Q150.тварей(нужно)}${q.куда?` в «${q.куда}» (${q.tx}; ${q.ty})`:" подземелья"}${q.depth>1?`, с ${q.depth}-го яруса`:""}`;
   case "dng_chest":return `${есть} из ${нужно} подземных сундуков`;
   case "zone_kill":return `${есть} из ${нужно} у логова (${q.tx}; ${q.ty})`;
   case "night_kill":return `${есть} из ${нужно} ночью; сейчас ${safeFn(()=>isNight(),false)?"ночь":"день"}`;
   case "elite":return есть>=нужно?"вожак повержен, вернитесь к заказчику":`тварь не слабее ${q.lvl}-го уровня ещё не повержена`;
   case "explore":{const got=(q.got||[]).length;return q.doneFlag?"все межи обойдены, вернитесь к заказчику":`${got} из ${q.need} меж; следующая — (${q.tx}; ${q.ty})`;}
   case "tame":return есть>=нужно?"зверь приручён, вернитесь к заказчику":"зверь ещё не приручён: подойдите к дикому зверю без оружия — «Приручить зверя»";}
 }catch(_){}return p0.apply(this,arguments);});});
safeFn(()=>{const c0=completeQuest;completeQuest=matKeep(c0,function(id){
 const q=(G.quests||[]).find(x=>x&&x.id===id&&!x.done);
 if(q&&Q150.НОВЫЕ.has(q.type)&&!Q150.сделано(q)){narrate(`Задание ещё не выполнено: ${qProgressText(q)}.`);return;}
 return c0.apply(this,arguments);});});

/* ── 5. Счёт новых дел ── */
safeFn(()=>{const m0=questMonsterProgress;questMonsterProgress=matKeep(m0,function(monster){const r=m0.apply(this,arguments);safeFn(()=>Q150.onKill(monster));return r;});});
safeFn(()=>{const d0=changeDepth;changeDepth=matKeep(d0,function(){const r=d0.apply(this,arguments);if(r!==false)safeFn(()=>Q150.onDepth());return r;});});
safeFn(()=>{const e0=enterPlace;enterPlace=matKeep(e0,function(){const r=e0.apply(this,arguments);if(r!==false)safeFn(()=>Q150.onDepth());return r;});});
safeFn(()=>{const o0=openChest;openChest=matKeep(o0,function(){const r=o0.apply(this,arguments);if(r===true)safeFn(()=>Q150.onChest());return r;});});
safeFn(()=>{const a0=arrive;arrive=matKeep(a0,function(){const r=a0.apply(this,arguments);safeFn(()=>Q150.onStep());return r;});});
safeFn(()=>{const n0=Director.note;Director.note=function(kind){const r=n0.apply(this,arguments);if(kind==="tame")safeFn(()=>Q150.onTame());return r;};});

/* ════════════════════════════════════════════════════════════════════════
   НЕМОТА — НУЛЕВОЙ ПРЕДЕЛ (15.0), ядро
   Не отдельный пласт мира: Немота — память Эпохи Безмолвия, проступающая
   там, где имена истёрлись. Она стоит в уже существующих аномальных зонах
   («мёртвая тишина», «тянущая магия», «шепчущая пустошь»), растёт в глубине
   ярусов (как «Тишина» Стоустого Рудника) и меняет чары по общим законам
   игры: цена — через тот же множитель, что у мест силы, срыв — у того же
   творения чар. Тихая Мера — полевая наука уже существующей школы «Подавление
   чар»: двенадцать приёмов, которые открываются опытом, а не покупкой; они
   тратят волю (Energy), а не одну ману, и сильнее всего там, где Немота глубже.
   Подробно — docs/НЕМОТА.md.
   ════════════════════════════════════════════════════════════════════════ */
const НЕМ_СТУПЕНИ=[
 {n:"обычная земля",цена:1,срыв:0},
 {n:"Шёпот",цена:1.15,срыв:0,о:"чары чуть дороже, их звук глуше"},
 {n:"Глушь",цена:1.35,срыв:0.15,о:"чары дороже на треть, сложные срываются"},
 {n:"Немота",цена:1.6,срыв:0.35,о:"чары дороги и часто срываются, перенос не работает"},
 {n:"Мёртвая речь",цена:2,срыв:0.7,о:"чары школ почти не держатся; работает Тихая Мера"},
 {n:"Нуль",цена:3,срыв:1,о:"магии нет; Тихая Мера берёт плату телом"}];
const Немота={
 /* глубина клетки мира: аномальные зоны — проявления Немоты */
 мир(x,y){try{const z=safeFn(()=>Zones.at(x,y),null);if(!z)return 0;const r=Zones.rule(z);if(!r)return 0;
   const от=Math.max(Math.abs(z.x-x),Math.abs(z.y-y));const ядро=от<=Math.max(1,Math.floor(z.r/3));
   if(r.id==="silence")return ядро?3:2;if(r.id==="magnet"||r.id==="whisper")return ядро?2:1;return 0;}catch(_){return 0;}},
 /* глубина яруса: с сорокового — шёпот, с шестидесятого — глушь, с восьмидесятого — немота */
 ярус(dd){dd=Number(dd)||0;return dd>=95?4:dd>=80?3:dd>=60?2:dd>=40?1:0;},
 здесь(){try{const p=G.place;
  /* зелье «немота» (Перекрой): «час вас не слышно, но и колдовать нельзя» — личная Немота мёртвой речи */
  const своя=Math.max(this.купол(),safeFn(()=>buffActive("немота"),false)?4:0);
  if(p){const dd=Number(p.depth)||0;return Math.max(своя,dd>0?this.ярус(dd):this.мир(p.bx,p.by));}
  return Math.max(своя,this.мир(G.x,G.y));}catch(_){return 0;}},
 /* личный купол тиши вне боя: на время — глубина три вокруг героя */
 купол(){const s=this.ст();const now=(Number(G.day)||1)*24+(Number(G.hour)||0);return s.купол&&s.купол>now?3:0;},
 ст(){if(!G.nem||typeof G.nem!=="object"||Array.isArray(G.nem))G.nem={};const s=G.nem;if(!s.опыт||typeof s.опыт!=="object")s.опыт={};return s;},
 ступень(d){return НЕМ_СТУПЕНИ[Math.max(0,Math.min(5,Number(d)||0))];},
 /* тварь колдует: её чары гаснут в куполе и уходят назад от «Отвести» */
 маг(m){return /cast|mage|wraith|witch|lich|shaman|druid|колдун|маг|чарод|ведьм|шаман|жрец/i.test(String((m&&(m.id+" "+m.n))||""));},
 /* чары подавления (школа «Подавление чар» и приёмы Тихой Меры) Немоте свои: не срываются и дешевле в ней */
 тихое(sp){return !!(sp&&(sp.тихое||sp.school==="counter"));},
 приём(sp){return !!(sp&&sp.тихое);},
 /* вход и выход слышны и названы, один раз на перемену */
 сверить(){try{const s=this.ст();const d=this.здесь();const было=Number(s.было)||0;if(d===было)return false;s.было=d;
  const ст=this.ступень(d);
  if(d>было){safeFn(()=>{Bank.play("oc_drone_die",{gain:0.55,maxSec:3});if(d>=3)setTimeout(()=>safeFn(()=>Bank.play("stk_dark",{gain:0.45,maxSec:4})),500);});
   const первый=!s.знал;s.знал=true;
   narrate(`${d>=3?"Уши словно заложило: ":"Звук вокруг становится глуше: "}Немота, ${ст.n.toLowerCase()} — ${ст.о}.${первый?" Здесь гаснут имена, на которых держатся чары; Тихая Мера здесь, наоборот, сильнее.":""}`,{interrupt:false});}
  else{safeFn(()=>Bank.play("magic_shimmer",{gain:0.35,maxSec:2}));
   narrate(d===0?"Немота отступила: звук снова идёт далеко, чары держатся.":`Немота слабеет: ${ст.n.toLowerCase()}.`,{interrupt:false});}
  return true;}catch(_){return false;}},
 текст(){const d=this.здесь();const ст=this.ступень(d);return d?`Немота здесь: ${ст.n.toLowerCase()} — ${ст.о}.`:"Немоты здесь нет: чары держатся как обычно.";}};
/* цена чар — тем же множителем, что у мест силы */
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){const k=k0(sp);if(Немота.тихое(sp))return k*(1-0.1*Math.min(3,Немота.здесь()));
 /* в куполе тиши свои чары школ тоже держатся хуже — вполовину дороже */
 const куп=G.inCombat&&G.combat&&(Number(G.combat.немКупол)||0)>0?1.5:1;
 return k*Немота.ступень(Немота.здесь()).цена*куп;};});
/* срыв чар — у самого творения: часть маны уходит впустую, чары нет */
safeFn(()=>{const c0=castSpell;castSpell=function(i){const sp=SPELLS[i];
 try{if(sp&&G.spells&&G.spells.includes(sp.n)&&!Немота.тихое(sp)){const d=Немота.здесь();const р=Немота.ступень(d).срыв;
   const сложные=sp.custom&&sp.усиление&&sp.усиление!=="none";const шанс=d===2?(сложные?р:0):р;
   if(шанс>0&&(Number(G.mana)||0)>=(Number(sp.cost)||0)&&Math.random()<шанс){const ушло=Math.max(1,Math.ceil((Number(sp.cost)||2)/2));
    G.mana=Math.max(0,(Number(G.mana)||0)-ушло);
    safeFn(()=>{Bank.play("oc_drone_die",{kind:"magic",gain:0.6,maxSec:2});setTimeout(()=>safeFn(()=>Bank.play("hero_nomana",{kind:"magic",gain:0.45,maxSec:2})),250);});
    narrate(`«${sp.n}» сорвалось: Немота (${Немота.ступень(d).n.toLowerCase()}) глушит имя чар. Ушло ${ушло} маны.`,{interrupt:true});
    safeFn(()=>{deed("nemfizzle");refresh();});return;}}}catch(_){}
 return c0.apply(this,arguments);};});
/* звук чар в Немоте глуше: каждая ступень снимает с него долю */
safeFn(()=>{const a0=spellAudio;spellAudio=function(sp,opts){const d=Немота.здесь();
 if(d>=1&&!(sp&&Немота.тихое(sp)))opts=Object.assign({},opts||{},{gain:(Number(opts&&opts.gain)||1)*Math.max(0.3,1-0.15*d)});
 return a0.call(this,sp,opts);};});
/* «перенос не работает» с третьей ступени: ни шаг сквозь камень, ни узел Сети не переносят */
safeFn(()=>{const e0=castCustomEffect;castCustomEffect=function(sp){
 try{if(sp&&!Немота.тихое(sp)&&Немота.здесь()>=3&&(safeFn(()=>spellCoreOf(sp),{})||{}).id==="shift"){safeFn(()=>Bank.play("oc_drone_die",{kind:"magic",gain:0.5,maxSec:2}));
   return " Шаг сквозь пространство не вышел: Немота держит место, перенос здесь не работает.";}}catch(_){}
 return e0.apply(this,arguments);};});
safeFn(()=>{const t0=Grani.transit.bind(Grani);Grani.transit=function(n,opts){
 if(Немота.здесь()>=3){safeFn(()=>Bank.play("oc_drone_die",{gain:0.5,maxSec:2}));narrate("Узел молчит: Немота глушит перенос. Выйдите из её поля — тогда узел отзовётся.",{interrupt:true});return false;}
 return t0(n,opts);};});
/* вход в Немоту и выход из неё слышны после каждого шага, спуска и входа */
safeFn(()=>{const m0=move;move=function(){const r=m0.apply(this,arguments);safeFn(()=>Немота.сверить());return r;};});
safeFn(()=>{const m0=moveInside;moveInside=function(){const r=m0.apply(this,arguments);safeFn(()=>Немота.сверить());return r;};});
safeFn(()=>{const c0=changeDepth;changeDepth=function(){const r=c0.apply(this,arguments);if(r)setTimeout(()=>safeFn(()=>Немота.сверить()),2600);return r;};});
safeFn(()=>{const e0=enterPlace;enterPlace=function(){const r=e0.apply(this,arguments);safeFn(()=>Немота.сверить());return r;};});
safeFn(()=>{const l0=leavePlace;leavePlace=function(){const r=l0.apply(this,arguments);safeFn(()=>Немота.сверить());return r;};});

/* ── ТИХАЯ МЕРА: приёмы школы «Подавление чар» в общей кузне ──
   Школа уже есть («Подавление чар»: Глушь, Немота, Зеркало отказа — им учат в
   академии). Тихая Мера — её полевая наука: двенадцать приёмов, которые не
   продаются, а открываются опытом в самой Немоте. Новой школы не заводится. */
const НЕМ_ЯДРА=[
 {id:"muffle",n:"Приглушение",род:"приглушения",k:1.0,сем:["контроль"],формы:["mark","wave"],о:"чары и удары твари слабее на четверть"},
 {id:"shake",n:"Расшатывание",род:"расшатывания",k:1.0,сем:["контроль"],формы:["beam","mark"],о:"защита твари трещит: ваш удар тяжелее; запертый замок поддаётся"},
 {id:"deflect",n:"Отвод",род:"отвода",k:1.0,сем:["защита"],формы:["ward"],о:"чара твари уходит назад, удар — вполсилы"},
 {id:"absorb",n:"Впитывание",род:"впитывания",k:1.0,сем:["защита"],формы:["ward"],о:"чужая чара идёт в ману"},
 {id:"hushdome",n:"Купол тиши",род:"купола тиши",k:1.0,сем:["защита","контроль"],формы:["dome","field"],о:"в куполе чары не держатся — ни чужие, ни свои"},
 {id:"overload",n:"Перегрузка",род:"перегрузки",k:1.1,сем:["урон","контроль"],формы:["bolt","beam"],о:"канал заклинателя лопается: оглушение и урон; не заклинателю — откат по вам"},
 {id:"quench",n:"Гашение свойства",род:"гашения",k:1.0,сем:["исцеление","контроль"],формы:["ward","mark"],о:"гаснет одно свойство: яд, кровотечение, проклятие, особый удар твари"},
 {id:"lull",n:"Усыпление чар",род:"усыпления",k:0.9,сем:["контроль","скрытность"],формы:["mark"],о:"руна ловушки засыпает; зачарованный клинок твари тупится"},
 {id:"thread",n:"Слух нити",род:"слуха нити",k:0.85,сем:["скрытность","контроль"],формы:["wave","call"],о:"слышно скрытое: тайные ходы, ловушки, проклятое"},
 {id:"mend",n:"Сшивание",род:"сшивания",k:1.0,сем:["исцеление","защита"],формы:["ward","call"],о:"сшивает повреждённое: вещь, снаряжение, оберег"},
 {id:"rewrite",n:"Переписывание",род:"переписывания",k:1.2,сем:["контроль"],формы:["mark"],о:"условие чар меняется: запертое по слову открывается"}];
/* приёмы — не ядра кузни: у кузни ровно шестнадцать ядер, и каждое работает в любой школе;
   свойства приёма живут в его собственном описании (НЕМ_ЯДРА), а не в оси составителя */
const НЕМ_ЯДРО_ПО_ID=Object.fromEntries(НЕМ_ЯДРА.map(c=>[c.id,c]));
/* двенадцать приёмов: двенадцать способов воздействия из ТЗ; «Развеять» — старое ядро «Развеивание» */
const НЕМ_ПРИЁМЫ=[
 {id:"hm_muffle",n:"Приглушить",ядро:"muffle",форма:"mark",ранг:1,воля:2,способ:1},
 {id:"hm_dispel",n:"Развеять тишью",ядро:"dispel",форма:"wave",ранг:1,воля:3,способ:2},
 {id:"hm_shake",n:"Расшатать",ядро:"shake",форма:"beam",ранг:1,воля:2,способ:3},
 {id:"hm_deflect",n:"Отвести",ядро:"deflect",форма:"ward",ранг:2,воля:4,способ:4},
 {id:"hm_absorb",n:"Впитать",ядро:"absorb",форма:"ward",ранг:2,воля:3,способ:5},
 {id:"hm_dome",n:"Купол тиши",ядро:"hushdome",форма:"dome",ранг:2,воля:4,способ:6},
 {id:"hm_overload",n:"Перегрузить",ядро:"overload",форма:"bolt",ранг:2,воля:3,способ:7},
 {id:"hm_quench",n:"Погасить свойство",ядро:"quench",форма:"ward",ранг:1,воля:3,способ:8},
 {id:"hm_lull",n:"Усыпить чары",ядро:"lull",форма:"mark",ранг:1,воля:2,способ:9},
 {id:"hm_thread",n:"Услышать нить",ядро:"thread",форма:"wave",ранг:1,воля:1,способ:10},
 {id:"hm_mend",n:"Сшить",ядро:"mend",форма:"ward",ранг:3,воля:4,способ:11},
 {id:"hm_rewrite",n:"Переписать условие",ядро:"rewrite",форма:"mark",ранг:3,воля:6,способ:12}];
for(const t of НЕМ_ПРИЁМЫ){const sc=MSCHOOL_BY_ID.counter||SCHOOLS[0];const f=FORM_BY_ID[t.форма]||SPELL_FORMS[0];const c=НЕМ_ЯДРО_ПО_ID[t.ядро]||CORE_BY_ID[t.ядро];
 const sp={id:t.id,n:t.n,school:"counter",форма:t.форма,ядро:t.ядро,ранг:t.ранг,сила:1,cost:1,откат:t.ранг>=3?6:t.ранг===2?2:0,золото:[0,60,160,360][t.ранг],
  о:c?c.о:"",воля:t.воля,способ:t.способ,тихое:true};
 /* в школьный список не входят: у школы ровно три академические чары (самопроверка), приёмы — из опыта */
 SPELLS.push(Object.assign({},sp,{price:0,школьное:true,custom:true,уровень:t.ранг*3,радиус:f.радиус||0,дальность:f.дальность||0,
  звук:sc.звук,голос:sc.голос,вид:`тихая мера (подавление чар) в форме ${f.род||t.форма}`,источник:"опыт Немоты"}));}
/* воля: Тихая Мера платит волей; в Нуле — ещё и телом */
safeFn(()=>{const c0=castSpell;castSpell=function(i){const sp=SPELLS[i];
 if(sp&&Немота.приём(sp)&&G.spells&&G.spells.includes(sp.n)&&!safeFn(()=>spellCooling(sp),0)&&(Number(G.mana)||0)>=(Number(sp.cost)||0)){safeFn(()=>Energy.ensure());const нужно=Number(sp.воля)||1;
  if((Number(G.will)||0)<нужно){safeFn(()=>Bank.play("hero_nomana",{kind:"magic",gain:0.5,maxSec:2}));
   narrate(`На «${sp.n}» нужно ${нужно} ${plural(нужно,"единица","единицы","единиц")} воли, у вас ${Number(G.will)||0}. Воля возвращается отдыхом и сном.`,{interrupt:true});return;}
  G.will=(Number(G.will)||0)-нужно;
  if(Немота.здесь()>=5){G.hp=Math.max(1,(Number(G.hp)||1)-нужно);}
  const s=Немота.ст();s.опыт[sp.id]=(Number(s.опыт[sp.id])||0)+1;}
 return c0.apply(this,arguments);};});
/* действия приёмов — в общем творении чар кузни */
const Тишь={
 сила(sp){return (1+0.15*Math.min(3,Немота.здесь()))*(Немота.здесь()===0?0.8:1);},
 бой(){return !!(G.inCombat&&G.combat&&G.combat.m);},
 звук(r,g){safeFn(()=>Bank.play(r,{kind:"magic",gain:g||0.5,maxSec:3}));},
 рядом(пред){const p=G.place;const lvl=p&&curLevel();if(!lvl)return null;
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy;if(пред(tileAt(lvl,x,y),x,y))return {x,y,dx,dy};}return null;},
 сделать(sp){const c=sp.ядро;const k=this.сила(sp);const cb=G.combat;const бой=this.бой();
  switch(c){
   case "muffle":{if(бой){cb.zvWeak=Math.max(Number(cb.zvWeak)||0,Math.round(3*k));if(Немота.маг(cb.m))cb.немГлушь=Math.round(3*k);this.звук("oc_drone_die");
     return ` Тварь приглушена: ${Немота.маг(cb.m)?"её чары и удары":"её удары"} слабее на ${Math.round(3*k)} ${plural(Math.round(3*k),"ход","хода","ходов")}.`;}
    safeFn(()=>buffSet("тишь",2));safeFn(()=>itogTish());return " Шаги и голос приглушены: два часа вас слышно хуже.";}
   case "shake":{if(бой){cb.zvBreak=Math.max(Number(cb.zvBreak)||0,2);cb.zvWard=0;this.звук("oc_glass_hit",0.45);return ` Защита твари трещит: следующие удары тяжелее.`;}
    const д=this.рядом((t,x,y)=>t==="+"&&placeMark(x,y)==="locked");
    if(д){if(Math.random()<Math.min(0.9,0.45*k)){setPlaceMark(д.x,д.y,"closed");safeFn(()=>doorSound(doorKindHere("+"),"unlock",{dx:д.dx,dy:д.dy}));return ` Замок двери ${dirWhere(Object.keys(DIRV).find(z=>DIRV[z][0]===д.dx&&DIRV[z][1]===д.dy))} расшатан и отошёл: дверь не заперта.`;}
     return " Замок дрогнул, но устоял: попробуйте ещё раз.";}
    return " Расшатывать здесь нечего: ни щита, ни запертого замка рядом.";}
   case "deflect":{if(бой){cb.немОтвод=1;this.звук("oc_gust",0.45);return " Вы встали в стойку отвода: следующая чара твари уйдёт назад, удар — вполсилы.";}
    return " Отвод держат в бою.";}
   case "absorb":{if(бой){cb.немВпит=2;this.звук("magic_hum",0.45);return " Два следующих удара чарами пойдут в ману, а не в тело.";}
    return " Впитывать здесь нечего.";}
   case "hushdome":{if(бой){cb.немКупол=Math.round(4*k);this.звук("stk_dark",0.5);return ` Купол тиши: ${Math.round(4*k)} ${plural(Math.round(4*k),"ход","хода","ходов")} чары твари гаснут, ваши дороже.`;}
    const s=Немота.ст();s.купол=(Number(G.day)||1)*24+(Number(G.hour)||0)+1;safeFn(()=>Немота.сверить());this.звук("stk_dark",0.5);return " Купол тиши на час: вокруг вас Немота, ловушки на чарах и чужие чары не держатся.";}
   case "overload":{if(бой){const m=cb.m;
     if(Немота.маг(m)){const d=Math.max(4,Math.round((8+(Number(m.lvl||m.level)||1)*2)*k));cb.hp=Math.max(0,(Number(cb.hp)||0)-d);cb.svStun=(Number(cb.svStun)||0)+1;this.звук("oc_electrical",0.55);
      safeFn(()=>updateCombat());if(cb.hp<=0){setTimeout(()=>safeFn(()=>{if(G.combat===cb)victory();}),50);}
      return ` Канал твари лопнул: −${d} и оцепенение на ход.`;}
     const отк=3;G.hp=Math.max(1,(Number(G.hp)||1)-отк);this.звук("oc_soft_hit",0.5);return ` ${m.n} не колдует — перегружать нечего: откат по вам, −${отк} здоровья.`;}
    return " Перегрузка — против заклинателя в бою.";}
   case "quench":{const сн=[];if(G.poisoned){G.poisoned=null;сн.push("яд");}
    safeFn(()=>{for(const b of ["кровотечение","проклятие","порча","отдача"])if(buffActive(b)){delete G.buffs[b];сн.push(b);}});
    if(бой&&cb.m&&cb.m.svAbil){cb.m=Object.assign({},cb.m,{svAbil:null});сн.push("особый удар твари");}
    this.звук("oc_pshsh",0.45);return сн.length?` Погашено: ${сн.join(", ")}.`:" Гасить нечего: ни яда, ни проклятия.";}
   case "lull":{const л=safeFn(()=>trapFound(),null);if(л){safeFn(()=>setPlaceMark(л.x,л.y,"trap_off"));this.звук("oc_lock",0.45);return ` ${л.n}: руна уснула, ловушка не сработает.`;}
    if(бой){cb.zvWeak=Math.max(Number(cb.zvWeak)||0,1);return " Чары на оружии твари задремали: её удар слабее.";}
    return " Усыплять здесь нечего: найденных ловушек рядом нет.";}
   case "thread":return this.нить(k);
   case "mend":{const сш=[];safeFn(()=>{const э=G.equip||{};for(const s of Object.keys(э)){const it=э[s];if(it&&typeof it==="object"&&Number(it.сост)>=0&&it.сост<100){it.сост=Math.min(100,(Number(it.сост)||0)+Math.round(30*k));сш.push(it.n||s);}}});
    const в=this.рядом((t,x,y)=>t==="X"&&safeFn(()=>propStateNow(x,y),"")==="broken");
    if(в){safeFn(()=>propMark(в.x,в.y,"fixed"));сш.push("сломанная вещь рядом");}
    this.звук("arte_cloth",0.5);return сш.length?` Сшито: ${сш.slice(0,4).join(", ")}.`:" Сшивать нечего: всё цело.";}
   case "rewrite":{const д=this.рядом((t,x,y)=>t==="+"&&(placeMark(x,y)==="locked"||placeMark(x,y)!=="open"));
    if(д){setPlaceMark(д.x,д.y,"open");safeFn(()=>doorSound(doorKindHere("+"),"open",{dx:д.dx,dy:д.dy}));return " Условие замка переписано: дверь считает вас своим и открыта.";}
    return " Переписывать здесь нечего: рядом нет запертого по слову.";}}
  return null;},
 /* «Услышать нить»: тайные ходы, ловушки, проклятое — со стороны, откуда звенит */
 нить(k){const p=G.place;const нашли=[];const рад=Math.round(6+2*k);
  if(p){const lvl=curLevel();
   for(let dy=-рад;dy<=рад;dy++)for(let dx=-рад;dx<=рад;dx++){const x=p.x+dx,y=p.y+dy;
    const ход=safeFn(()=>passageAt(x,y),null);if(ход&&нашли.length<6)нашли.push({n:"тайный ход",dx,dy});
    const л=safeFn(()=>trapAt(x,y),null);if(л&&л.состояние==="не найдена"){л.состояние="найдена";safeFn(()=>setPlaceMark(x,y,"trap_on"));if(нашли.length<6)нашли.push({n:л.n||"ловушка",dx,dy});}}}
  нашли.slice(0,3).forEach((н,i)=>setTimeout(()=>safeFn(()=>Spatial.role("magic_shimmer",н.dx,н.dy,{gain:0.5,maxSec:1.5})||Bank.play("magic_shimmer",{gain:0.4,maxSec:1.5})),300+i*450));
  if(!нашли.length)return " Нить молчит: в округе ничего скрытого.";
  return " Нить звенит: "+нашли.map(н=>`${н.n} ${dirBetween(н.dx,н.dy)||"рядом"}, ${Math.max(Math.abs(н.dx),Math.abs(н.dy))} ${plural(Math.max(Math.abs(н.dx),Math.abs(н.dy)),"шаг","шага","шагов")}`).join("; ")+".";}};
safeFn(()=>{const e0=castCustomEffect;castCustomEffect=function(sp){if(sp&&Немота.приём(sp)&&sp.ядро!=="dispel"){const r=Тишь.сделать(sp);if(r!=null)return r;}return e0.apply(this,arguments);};});
/* удар твари: купол, отвод, впитывание, приглушённые чары */
safeFn(()=>{const f0=foeStrike;foeStrike=matKeep(f0,function(o){const cb=G.combat;if(!cb||!cb.m)return f0.apply(this,arguments);const m=cb.m;const род=(o&&o.kind)||"melee";
 const маг=род==="bolt"||род==="breath"||Немота.маг(m);
 if(маг&&(Number(cb.немКупол)||0)>0){cb.немКупол--;safeFn(()=>Bank.play("oc_drone_die",{kind:"combat",gain:0.55,maxSec:2}));
  narrate(" Чара твари гаснет в куполе тиши.",{key:"enemyhit",pri:1,ttl:1500,cat:"combat",interrupt:false});safeFn(()=>{updateCombat();refresh();});return 0;}
 if((Number(cb.немОтвод)||0)>0){cb.немОтвод=0;
  if(маг){const d=Math.max(1,Math.round((Number(m.dmg)||4)*1.0));cb.hp=Math.max(0,(Number(cb.hp)||0)-d);safeFn(()=>Bank.play("oc_gust",{kind:"combat",gain:0.55,maxSec:2}));
   narrate(` Отвод: чара твари ушла назад — −${d} ей самой.`,{key:"enemyhit",pri:1,ttl:1500,cat:"combat",interrupt:false});
   safeFn(()=>updateCombat());if(cb.hp<=0)setTimeout(()=>safeFn(()=>{if(G.combat===cb)victory();}),50);return 0;}
  const hp0=Number(G.hp)||0;const r=f0.apply(this,arguments);const взято=Math.max(0,hp0-(Number(G.hp)||0));const вернуть=Math.floor(взято/2);
  if(вернуть>0)G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+вернуть);return r;}
 if(маг&&(Number(cb.немВпит)||0)>0){cb.немВпит--;const hp0=Number(G.hp)||0;const r=f0.apply(this,arguments);const взято=Math.max(0,hp0-(Number(G.hp)||0));
  if(взято>0){G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+взято);G.mana=Math.min(Number(G.manaMax)||0,(Number(G.mana)||0)+взято);safeFn(()=>Немота.счёт("впитал"));
   narrate(` Впитано: ${взято} в ману.`,{interrupt:false});}return r;}
 if(маг&&(Number(cb.немГлушь)||0)>0){cb.немГлушь--;const hp0=Number(G.hp)||0;const r=f0.apply(this,arguments);const взято=Math.max(0,hp0-(Number(G.hp)||0));
  const вернуть=Math.floor(взято*0.25);if(вернуть>0)G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+вернуть);return r;}
 return f0.apply(this,arguments);});});
/* ── ЗНАНИЕ ИЗ ОПЫТА ──
   Девять приёмов не купить: их слышат в самой Немоте — на своих ошибках и
   удачах. Условие у каждого своё; приём открывается словом и звуком, один раз. */
const НЕМ_ОПЫТ=[
 {n:"Услышать нить",счёт:"шаги2",нужно:10,о:"десять шагов в Немоте — и вы услышали тонкий звон там, где спрятанное держит чару"},
 {n:"Приглушить",счёт:"нить",нужно:2,о:"нить дважды привела вас к скрытому — теперь вы умеете не только слушать, но и глушить"},
 {n:"Развеять тишью",счёт:"срывы",нужно:3,о:"три ваших чары сорвались в Немоте — и вы услышали, как именно глохнет имя"},
 {n:"Расшатать",счёт:"приглушил",нужно:4,о:"приглушённая защита трещит — вы научились раскачивать её нарочно"},
 {n:"Впитать",счёт:"чарой",нужно:5,о:"пять раз чужая чара прошла сквозь вас в Немоте — вы почувствовали, где её можно взять"},
 {n:"Отвести",счёт:"впитал",нужно:3,о:"трижды взяв чужую чару, вы поняли, как отправить её назад"},
 {n:"Купол тиши",счёт:"глубь",нужно:30,о:"тридцать шагов в глубокой Немоте — и вы унесли её с собой"},
 {n:"Перегрузить",счёт:"купол",нужно:2,о:"дважды купол гасил чужую чару — вы услышали, как лопается её канал"},
 {n:"Погасить свойство",счёт:"развеял",нужно:3,о:"развеивая, вы научились гасить одно свойство, не трогая остального"},
 {n:"Усыпить чары",счёт:"ловушки",нужно:3,о:"три ловушки, услышанные нитью, — вы поняли, как руна засыпает"},
 {n:"Сшить",счёт:"чинил",нужно:3,о:"три починки руками — и вы услышали, где у вещи разорвана её чара"},
 {n:"Переписать условие",счёт:"приёмов",нужно:8,о:"восемь приёмов Тихой Меры — и вы слышите не только чару, но и условие, на котором она держится"}];
Object.assign(Немота,{
 счёт(k,n){const s=this.ст();if(!s.счёт||typeof s.счёт!=="object")s.счёт={};s.счёт[k]=(Number(s.счёт[k])||0)+(Number(n)||1);this.открыть();return s.счёт[k];},
 открыть(){const s=this.ст();if(!s.счёт||typeof s.счёт!=="object")s.счёт={};const сч=s.счёт;if(!Array.isArray(G.spells))G.spells=[];
  сч.приёмов=НЕМ_ПРИЁМЫ.filter(t=>G.spells.includes(t.n)).length;
  for(const о of НЕМ_ОПЫТ){if(G.spells.includes(о.n))continue;if((Number(сч[о.счёт])||0)<о.нужно)continue;
   G.spells.push(о.n);safeFn(()=>{Bank.play("stk_dark",{gain:0.45,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("magic_shimmer",{gain:0.45,maxSec:2})),500);});
   narrate(`Тихая Мера: вы научились приёму «${о.n}» — ${о.о}. Его можно поставить в слот магии.`,{interrupt:false});
   safeFn(()=>journal(`Тихая Мера: приём «${о.n}».`));}}});
/* что считается опытом */
safeFn(()=>{const d0=deed;deed=function(k){const r=d0.apply(this,arguments);if(k==="nemfizzle")safeFn(()=>Немота.счёт("срывы"));if(k==="mechanisms")safeFn(()=>Немота.счёт("чинил"));return r;};});
safeFn(()=>{const t0=Тишь.сделать.bind(Тишь);Тишь.сделать=function(sp){const r=t0(sp);
 safeFn(()=>{if(sp.ядро==="thread"&&r&&/звенит/.test(r)){Немота.счёт("нить");const n=(r.match(/ловушк|капкан|плит|жил[аы]|самострел/gi)||[]).length;if(n)Немота.счёт("ловушки",n);}
  if(sp.ядро==="muffle"&&G.inCombat)Немота.счёт("приглушил");if(sp.ядро==="hushdome")Немота.счёт("купол",0);});
 return r;};});
safeFn(()=>{const e0=castCustomEffect;castCustomEffect=function(sp){const r=e0.apply(this,arguments);if(sp&&sp.ядро==="dispel"&&r&&!/нечего/.test(String(r)))safeFn(()=>Немота.счёт("развеял"));return r;};});
safeFn(()=>{const f0=foeStrike;foeStrike=matKeep(f0,function(o){const cb=G.combat;const m=cb&&cb.m;const род=(o&&o.kind)||"melee";
 const маг=m&&(род==="bolt"||род==="breath"||Немота.маг(m));const куп=cb&&(Number(cb.немКупол)||0);
 const r=f0.apply(this,arguments);
 safeFn(()=>{if(маг&&Немота.здесь()>=1&&r>0)Немота.счёт("чарой");if(маг&&куп>0&&cb&&(Number(cb.немКупол)||0)<куп)Немота.счёт("купол");});
 return r;});});
safeFn(()=>{const m0=moveInside;moveInside=function(){const r=m0.apply(this,arguments);if(r!==false){const d=Немота.здесь();if(d>=2)safeFn(()=>Немота.счёт("шаги2"));if(d>=3)safeFn(()=>Немота.счёт("глубь"));}return r;};});
/* шаг по миру; внутри места move() идёт через moveInside — там шаг уже посчитан, второй раз его не считать */
safeFn(()=>{const m0=move;move=function(){const внутри=!!G.place;const r=m0.apply(this,arguments);if(внутри||r===false)return r;
 const d=Немота.здесь();if(d>=2)safeFn(()=>Немота.счёт("шаги2"));if(d>=3)safeFn(()=>Немота.счёт("глубь"));return r;};});

/* ════ МЕСТА НЕМОТЫ: поверх существующих клеток, мир не сдвигается ════
   Клетки выбраны пустыми (ни постройки, ни дороги, ни воды) рядом с началом
   игры: Сильвен — деревня исследователей у края Сильвенской Тиши (редколесье,
   Драконий Пик); Боргин — подгорный посад Гильдии Тихой Меры над копями немого
   кварца (Земли Туманов); Драгош — крепость Драгошского Затвора на перевале,
   на рубеже Золотой Зари и Земель Туманов; Немые штольни — заброшенные копи
   Боргина, где Немота растёт с каждым ярусом. */
const НЕМ_МЕСТА=[
 {id:"silven",n:"Сильвен",тип:"village",x:24898,y:24665,маяк:"village",орден:"zvm",о:"деревня исследователей у края Сильвенской Тиши"},
 {id:"borgin",n:"Боргин",тип:"burg",x:24941,y:25294,маяк:"village",орден:"gtm",о:"подгорный посад Гильдии Тихой Меры над копями немого кварца"},
 {id:"dragosh",n:"Драгош",тип:"fortress",x:25000,y:25300,маяк:"castle",орден:"dz",о:"крепость Драгошского Затвора на перевале, на рубеже двух держав"},
 {id:"shtolni",n:"Немые штольни",тип:"cave_entrance",x:24936,y:25289,маяк:"cave_entrance",о:"заброшенные копи Боргина: Немота растёт с каждым ярусом"}];
const НЕМ_ПО_КЛЕТКЕ=new Map(НЕМ_МЕСТА.map(м=>[м.x+","+м.y,м]));
const НЕМ_ПОЛЯ=[
 {id:"tish",n:"Сильвенская Тишь",x:24905,y:24655,r:7,ядро:2,гл:[2,3]},
 {id:"kopi",n:"Боргинские копи",x:24938,y:25290,r:4,ядро:1,гл:[1,2]}];
/* двенадцать орденов — в уже существующем круге отношений «в гильдии» (гильдии, братства, ордена); трое — с делами уже в 15.0 */
const НЕМ_ОРДЕНА=[
 {id:"zvm",род:"ж",n:"Звёздная Мера",о:"наследники Звездочётов Предела: меряют Немоту и ищут, откуда она",где:"Сильвен"},
 {id:"pokrov",род:"ж",n:"Стража Покрова",о:"бережёт людей у разломов и полей Немоты",где:"у разломов"},
 {id:"dz",род:"м",n:"Драгошский Затвор",о:"гарнизон, что держит глушители как оружие",где:"Драгош"},
 {id:"gtm",род:"ж",n:"Гильдия Тихой Меры",о:"мастера приборов: камертоны, глушители, плащи тиши",где:"Боргин"},
 {id:"ryad",род:"м",n:"Безгласный Ряд",о:"торговый дом немого кварца и звонкой меди",где:"торговые пути"},
 {id:"bratya",род:"мн",n:"Немые Братья",о:"вышли из Раскола Покрова: магия для них — нарушение тишины",где:"монастыри у полей"},
 {id:"zvon",род:"ж",n:"Коллегия Звона",о:"маги, что учатся колдовать сквозь Немоту",где:"столицы"},
 {id:"sluh",род:"мн",n:"Вольные Слухачи",о:"вольные искатели: идут туда, где тихо",где:"везде"},
 {id:"hod",род:"м",n:"Тихий Ход",о:"контрабанда глушителей без грамоты",где:"схроны"},
 {id:"sovet",род:"м",n:"Нулевой Совет",о:"хотят сделать из Немоты оружие держав",где:"скрыто"},
 {id:"priyut",род:"м",n:"Приют Тишайших",о:"бережёт тех, кого Немота изменила",где:"лесные хутора"},
 {id:"dver",род:"мн",n:"Хранители Двери",о:"служат Старшей Зодчей; их цель неизвестна",где:"неизвестно"}];
const НЕМ_ОРДЕН_ПО_ID=Object.fromEntries(НЕМ_ОРДЕНА.map(o=>[o.id,o]));
/* нового круга нет: у мира их ровно двенадцать, ордена живут в круге «в гильдии» — standOf("guild", id ордена) */
/* поля Немоты вокруг мест */
safeFn(()=>{const м0=Немота.мир.bind(Немота);Немота.мир=function(x,y){let d=м0(x,y);
 for(const п of НЕМ_ПОЛЯ){const от=Math.max(Math.abs(п.x-x),Math.abs(п.y-y));if(от<=п.r)d=Math.max(d,от<=п.ядро?п.гл[1]:п.гл[0]);}return d;};});
/* Немые штольни: Немота растёт с ярусом — 2, 2, 3, 3, 4, дальше Нуль */
safeFn(()=>{const я0=Немота.ярус.bind(Немота);Немота.ярус=function(dd){let d=я0(dd);const p=G.place;
 if(p&&p.bx===24936&&p.by===25289&&!G.dark)d=Math.max(d,Math.min(5,1+Math.ceil((Number(dd)||0)/2)));return d;};});
/* постройка на клетке и поселение для стражи, цен и отношений */
safeFn(()=>{const cc0=cellContent;cellContent=function(x,y){const c=cc0.apply(this,arguments);
 if(!G.dark&&c){const м=НЕМ_ПО_КЛЕТКЕ.get(x+","+y);if(м&&(!c.structure||c.structure.нем))c.structure={type:м.тип,name:м.n,beacon:м.маяк,нем:м.id};}
 return c;};});
safeFn(()=>{const ic0=isCityAt;isCityAt=function(x,y){const м=НЕМ_ПО_КЛЕТКЕ.get(x+","+y);
 if(м&&!G.dark&&PLACE_KIND[м.тип]==="city")return {x,y,type:м.тип,name:м.n,emp:empireAt(x,y),size:м.тип==="village"?1:2,нем:м.id};
 return ic0.apply(this,arguments);};});
/* немой кварц: жилы Немых штолен и Боргинских копей дают его вместо прежней руды */
safeFn(()=>{const v0=mineVein;mineVein=function(x,y){const p=G.place;
 if(p&&p.bx===24936&&p.by===25289&&!G.dark){const m=placeMark(x,y);if(m==="empty")return v0.apply(this,arguments);
  setPlaceMark(x,y,"empty");G.inv=G.inv||{};const n=1+((x+y)%2);G.inv["немой кварц"]=(Number(G.inv["немой кварц"])||0)+n;
  safeFn(()=>{Bank.play("oc_glass_hit",{gain:0.55,maxSec:2});setTimeout(()=>safeFn(()=>Bank.play("oc_drone_die",{gain:0.4,maxSec:2})),300);});
  narrate(`Немой кварц: ${n} ${plural(n,"кусок","куска","кусков")}. Камень глушит звук в ладони — стук кирки уходит в него, как в вату.`,{interrupt:true});
  safeFn(()=>{deed("mined");refresh();saveGame(true);});return true;}
 return v0.apply(this,arguments);};});
/* ── «Записки о Пределе»: первое дело Звёздной Меры у жителей Сильвена ── */
const НЕМ_ТОЧКИ=[[24903,24652],[24908,24657],[24901,24659]];
/* дело можно взять у жителей Сильвена или у самой Ваэль в доме Звёздной Меры */
function немЗаписки(кто,ключ){return {id:"nem_zapiski",type:"explore",pts:НЕМ_ТОЧКИ.map(p=>p.slice()),got:[],need:3,tx:НЕМ_ТОЧКИ[0][0],ty:НЕМ_ТОЧКИ[0][1],род:"study",вид:"межа",
 заглавие:"Записки о Пределе",npc:кто,npcKey:ключ,побочный:true,have:0,нем:"zvm",
 text:`Ваэль Звездочётная, глава Звёздной Меры, собирает «Записки о Пределе». Сделайте замеры Немоты в трёх точках Сильвенской Тиши: (${НЕМ_ТОЧКИ[0].join("; ")}), (${НЕМ_ТОЧКИ[1].join("; ")}) и (${НЕМ_ТОЧКИ[2].join("; ")}). Там глушь: чары дороже и срываются — Тихая Мера, наоборот, сильнее.`,
 reward:{gold:40,xp:60}};}
safeFn(()=>{const s0=sideQuestsFor;sideQuestsFor=matKeep(s0,function(n){const L=s0.apply(this,arguments);
 try{if(n&&!G.dark&&(n.x|0)===24898&&(n.y|0)===24665){const s=Немота.ст();
   if(!s.записки&&!(G.quests||[]).some(q=>q&&q.id==="nem_zapiski"))L.unshift(немЗаписки(n.name,n.key));}}catch(_){}
 return L;});});
safeFn(()=>{const c0=completeQuest;completeQuest=function(id){const q=(G.quests||[]).find(x=>x&&x.id===id);const r=c0.apply(this,arguments);
 safeFn(()=>{if(q&&q.нем&&q.done&&!q.немОтмечено){q.немОтмечено=true;const s=Немота.ст();
  addStand("guild",q.нем,Number(q.немОчки)||12,true);
  if(q.id==="nem_zapiski"){s.записки=true;
   const научил=!(G.spells||[]).includes("Услышать нить");if(научил){G.spells=G.spells||[];G.spells.push("Услышать нить");}
   setTimeout(()=>safeFn(()=>narrate(`Звёздная Мера вас запомнила.${научил?" Ваэль показала, как слушать нить, на которой держатся скрытые чары: приём Тихой Меры «Услышать нить» — ваш.":""}`,{interrupt:false})),1200);}
  else{const о=НЕМ_ОРДЕН_ПО_ID[q.нем];if(о)setTimeout(()=>safeFn(()=>narrate(`${о.n} ${о.род==="мн"?"запомнили":о.род==="м"?"запомнил":"запомнила"} вас: отношение ордена выросло.`,{interrupt:false})),1200);}}});
 return r;};});

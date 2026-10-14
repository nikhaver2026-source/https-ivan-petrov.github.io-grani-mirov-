/* ════════════════════════════════════════════════════════════════════════
   ЗАГАДКА — В САМОЙ ЗАГАДКЕ; ТЕМПЕРАТУРНЫЙ МЕХАНИЗМ — ЧЕТЫРЕ СТРЕЛКИ (после 16.0)
   Просьбы игрока: «пункт „Взяться за загадку" должен быть в самой загадке,
   а не через ярусы подземелья; в ярусах — только какие загадки решены, а
   какие нет»; «температурный механизм решается сразу: медная стрелка на 1,
   нагрел до 2 — решилась. Усложни: минимум четыре стрелки с разными видами
   температур и условием сойтись в середине, интересное описание, подсказки —
   сложная, средняя и намёк; чем больше подсказок взято, тем меньше
   награда»; «просмотри все виды загадок и механизмов».
   1. Клавиша действия (E) или двойное касание рядом с загадкой яруса сразу
      открывает её — прежде клавиша рядом с загадкой молчала, а цель осмотра
      у загадки не открывала ничего; рядом с книжной полкой E открывал книгу.
      Загадка вдали — в окне яруса только её состояние, где она и маяк;
      решать — на месте. Окно яруса называет, какие загадки решены и какие нет.
   2. Температурный механизм: четыре стрелки — медная (жар горна), серебряная
      (холод ледяного змеевика), железная (давление пара), стеклянная с
      ртутью (тепло зала) — и пять ручек, каждая трогает несколько стрелок.
      Решено, когда все четыре сошлись в середине; стрелка, ушедшая в красное
      (жар или холод 6), срывает предохранитель — всё к началу. Начало
      всегда решаемо, кратчайший путь — от четырёх до восьми действий.
      Три подсказки: намёк (−10 % награды), средняя (−25 %), сложная (−40 %);
      награда — золото и вещество яруса, урезанные за подсказки (без подсказок — ещё и прежняя награда загадки).
   ════════════════════════════════════════════════════════════════════════ */
const ЖАР_СТРЕЛКИ165=[
 {id:"медь",n:"медная стрелка",чует:"жар горна"},
 {id:"серебро",n:"серебряная стрелка",чует:"холод ледяного змеевика"},
 {id:"железо",n:"железная стрелка",чует:"давление пара"},
 {id:"стекло",n:"стеклянная стрелка с ртутью",чует:"тепло всего зала"}];
const ЖАР_РУЧКИ165=[
 {id:"горн",n:"Раздуть горн мехами",d:[2,0,1,1],звук:"ad_fire_crackle"},
 {id:"змеевик",n:"Открыть ледяной змеевик",d:[-1,-2,0,-1],звук:"oc_splash"},
 {id:"пар",n:"Стравить пар через клапан",d:[0,1,-2,0],звук:"oc_steam"},
 {id:"вода",n:"Плеснуть воды на кожух",d:[-1,0,1,-1],звук:"oc_sizzle"},
 {id:"заслонка",n:"Повернуть заслонку тяги",d:[0,-1,0,2],звук:"oc_wheels"}];
const ЖАР_ПОДСКАЗКИ165=[{id:"намёк",n:"Намёк",м:0.10},{id:"средняя",n:"Средняя подсказка",м:0.25},{id:"сложная",n:"Сложная подсказка",м:0.40}];
const Загадки165={
 КРАЙ:6,
 /* ── устройство механизма: начало из обратного хода от середины, проверенное поиском ── */
 ключ(v){return v.join(",");},
 путь(старт){const K=this.КРАЙ;const цель="0,0,0,0";const был=new Map([[this.ключ(старт),null]]);const q=[старт];
  while(q.length){const v=q.shift();const k=this.ключ(v);if(k===цель){const ход=[];let z=k;while(был.get(z)){const [пред,ри]=был.get(z);ход.unshift(ри);z=пред;}return ход;}
   ЖАР_РУЧКИ165.forEach((r,ri)=>{const u=v.map((a,i)=>a+r.d[i]);if(u.some(a=>Math.abs(a)>=K))return;const uk=this.ключ(u);if(был.has(uk))return;был.set(uk,[k,ri]);q.push(u);});}
  return null;},
 устройство(s,p){if(p.жар165)return p.жар165;
  const seed=(Number(s.bx)||0)*31+(Number(s.by)||0)*17+String(p.id).length*101+(Number(p.tier)||1)*7;
  for(let t=0;t<80;t++){const R=k=>hashName(seed+t*13,k+t,16500+k);const n=5+Math.floor(R(1)*4);const v=[0,0,0,0];
   for(let i=0;i<n;i++){const r=ЖАР_РУЧКИ165[Math.floor(R(10+i)*ЖАР_РУЧКИ165.length)%ЖАР_РУЧКИ165.length];for(let j=0;j<4;j++)v[j]-=r.d[j];}
   if(v.some(a=>Math.abs(a)>4)||v.filter(a=>a!==0).length<3)continue;
   const ход=this.путь(v);if(!ход||ход.length<4||ход.length>8)continue;
   return (p.жар165={старт:v,кратчайший:ход.length});}
  return (p.жар165={старт:[2,-1,1,-2],кратчайший:(this.путь([2,-1,1,-2])||[]).length});},
 сост(x,p,s){x.жар165=x.жар165&&typeof x.жар165==="object"?x.жар165:{};const у=this.устройство(s,p);
  let z=x.жар165[p.id];if(!z||!Array.isArray(z.v)||z.v.length!==4){z=x.жар165[p.id]={v:у.старт.slice(),ходов:0,срывов:0,подсказки:{}};}
  if(!z.подсказки||typeof z.подсказки!=="object")z.подсказки={};return z;},
 слово(a){return a>0?`жар ${a}`:a<0?`холод ${-a}`:"середина";},
 стрелки(z){return ЖАР_СТРЕЛКИ165.map((n,i)=>`${n.n[0].toUpperCase()+n.n.slice(1)} — ${this.слово(z.v[i])}`).join("; ");},
 штраф(z){return ЖАР_ПОДСКАЗКИ165.reduce((a,h)=>a+(z.подсказки[h.id]?h.м:0),0);},
 описание(){return "Древний температурный механизм: медный круг с четырьмя стрелками, под ним — горн с мехами, ледяной змеевик в инее, паровой клапан, ковш с водой у кожуха и заслонка тяги. Механизм дышит то жаром, то стужей. Засов откроется, лишь когда все четыре стрелки сойдутся в середине — в равновесии. Каждая ручка трогает не одну стрелку; уйдёт хоть одна в красное — жар или холод шесть — сорвётся предохранитель, и всё вернётся, как было.";},
 подсказка(id,z,s,p){
  if(id==="намёк")return "На ободе круга выбито: «Огонь будит медь, лёд — серебро, пар держит железо, а стекло слушает всех». Стеклянную стрелку выравнивайте последней: её сдвигает почти каждая ручка.";
  if(id==="средняя")return "Как ручки трогают стрелки: "+ЖАР_РУЧКИ165.map(r=>`${r.n.toLowerCase()} — ${r.d.map((a,i)=>a?`${ЖАР_СТРЕЛКИ165[i].id} ${a>0?"+":"−"}${Math.abs(a)}`:"").filter(Boolean).join(", ")}`).join("; ")+".";
  const ход=this.путь(z.v)||[];if(!ход.length)return "Механизм уже в равновесии.";
  return `Отсюда до равновесия — ${ход.length} ${plural(ход.length,"действие","действия","действий")}. Начните так: ${ход.slice(0,Math.min(3,ход.length)).map(i=>ЖАР_РУЧКИ165[i].n.toLowerCase()).join(", затем ")}.`;},
 /* ── окно механизма ── */
 окно(D,s,x,p,сверху){const z=this.сост(x,p,s);
  let h=(сверху?D.line(сверху):"")+D.line(this.описание())+D.line(`Стрелки: ${this.стрелки(z)}.`);
  ЖАР_СТРЕЛКИ165.forEach(n=>{h+=D.line(`${n.n[0].toUpperCase()+n.n.slice(1)} чует ${n.чует}.`);});
  ЖАР_РУЧКИ165.forEach((r,ri)=>{h+=D.btn(`hz:${p.id}:${ri}`,r.n);});
  h+=D.btn(`hzlook:${p.id}`,"Осмотреть стрелки");
  ЖАР_ПОДСКАЗКИ165.forEach(H=>{if(z.подсказки[H.id])h+=D.line(`${H.n}: ${this.подсказка(H.id,z,s,p)}`);
   else h+=D.btn(`hzhint:${p.id}:${H.id}`,`${H.n} — награда меньше на ${Math.round(H.м*100)} %`);});
  const ш=this.штраф(z);if(ш>0)h+=D.line(`Взято подсказок: ${Object.keys(z.подсказки).length}; награда будет меньше на ${Math.round(ш*100)} %.`);
  if(z.ходов)h+=D.btn(`hzreset:${p.id}`,"Вернуть стрелки к началу");
  h+=D.btn("view","Назад");return D.show(p.n,h,сверху||undefined);},
 ход(D,id,ri){const s=D.here();const x=D.st(s);const p=s.puzzles.find(q=>q.id===id);if(!p||p.type!=="heat")return D.view();if(x.solved[id])return D.puzzle(id);
  const r=ЖАР_РУЧКИ165[+ri];if(!r)return D.puzzle(id);const z=this.сост(x,p,s);
  safeFn(()=>Bank.play(r.звук,{gain:0.55,maxSec:2}));z.ходов++;
  const u=z.v.map((a,i)=>a+r.d[i]);
  if(u.some(a=>Math.abs(a)>=this.КРАЙ)){const i=u.findIndex(a=>Math.abs(a)>=this.КРАЙ);z.v=this.устройство(s,p).старт.slice();z.срывов++;
   safeFn(()=>Bank.play("oc_steam",{gain:0.7,maxSec:2}));
   return this.окно(D,s,x,p,`${r.n}: ${ЖАР_СТРЕЛКИ165[i].n} ушла в красное — ${u[i]>0?"жар":"холод"} ${Math.abs(u[i])}. Сорвался предохранитель: шипение, лязг — стрелки вернулись к началу.`);}
  z.v=u;
  if(z.v.every(a=>a===0))return this.решено(D,s,x,p,z);
  return this.окно(D,s,x,p,`${r.n}. ${this.стрелки(z)}.`);},
 решено(D,s,x,p,z){const м=Math.max(0.25,1-this.штраф(z));const t=Math.max(1,Number(p.tier)||1);
  const g=Math.round((70+t*20)*м);const b=DEEP_BIOME_BY_ID[s.tiers[p.tier].b];const рес=b&&b.ресурсы?b.ресурсы[2]:null;const n=Math.max(1,Math.round(3*м));
  G.gold=(Number(G.gold)||0)+g;if(рес)G.inv[рес]=(Number(G.inv[рес])||0)+n;
  /* дальше — общий путь решённой загадки: замки, тайные ходы, летопись; награда типа загадки — только без подсказок */
  const было=p.reward;if(this.штраф(z)>0)p.reward="нет165";const say0=D.say;
  D.say=function(t,o){let тт=String(t||"");if(/^Загадка решена!/.test(тт)){
    тт=тт.replace(/^Загадка решена!\s*[;.]?\s*/,`Загадка решена! Стрелки сошлись в середине — засов отходит: ${g} золота${рес?`, ${рес} ×${n}`:""}${м<1?` (за подсказки — меньше на ${Math.round((1-м)*100)} %)`:""}; `).replace(/;\s*$/,".").replace(/;\s*\./g,".").replace(/;\s*;/g,";");}
   return say0.call(this,тт,o);};
  try{return D.pzSolve(s,x,p);}finally{D.say=say0;p.reward=было;}},
 /* ── загадки яруса для окна яруса ── */
 яруса(D){try{const s=D.here();const x=D.st(s);const d=D.tierNo();const все=s.puzzles.filter(p=>p.tier===d);if(!все.length)return "";
  const реш=все.filter(p=>x.solved[p.id]).map(p=>p.n),нет=все.filter(p=>!x.solved[p.id]).map(p=>p.n);
  return `Загадки яруса: ${все.length}. ${реш.length?`Решены: ${реш.join(", ")}.`:"Решённых нет."} ${нет.length?`Не решены: ${нет.join(", ")} — решают на месте: подойдите вплотную, клавиша E или двойное касание.`:"Все решены."}`;}catch(_){return "";}}};

/* ── команды ── */
safeFn(()=>{const c0=Deep.cmd;Deep.cmd=function(a){const t=String(a||"");
 if(t.indexOf("hz:")===0){const [,id,ri]=t.split(":");return Загадки165.ход(this,id,ri);}
 if(t.indexOf("hzlook:")===0){const id=t.slice(7);const s=this.here();const x=this.st(s);const p=s.puzzles.find(q=>q.id===id);if(!p)return this.view();
  const z=Загадки165.сост(x,p,s);return Загадки165.окно(this,s,x,p,`Стрелки: ${Загадки165.стрелки(z)}.`);}
 if(t.indexOf("hzhint:")===0){const [,id,h]=t.split(":");const s=this.here();const x=this.st(s);const p=s.puzzles.find(q=>q.id===id);const H=ЖАР_ПОДСКАЗКИ165.find(q=>q.id===h);
  if(!p||!H||x.solved[id])return this.view();const z=Загадки165.сост(x,p,s);z.подсказки[H.id]=1;
  return Загадки165.окно(this,s,x,p,`${H.n}: ${Загадки165.подсказка(H.id,z,s,p)}`);}
 if(t.indexOf("hzreset:")===0){const id=t.slice(8);const s=this.here();const x=this.st(s);const p=s.puzzles.find(q=>q.id===id);if(!p)return this.view();
  const z=Загадки165.сост(x,p,s);z.v=Загадки165.устройство(s,p).старт.slice();return Загадки165.окно(this,s,x,p,`Стрелки вернулись к началу. ${Загадки165.стрелки(z)}.`);}
 return c0.apply(this,arguments);};});
/* ── окно загадки: температурный механизм — свой ── */
safeFn(()=>{const pz0=Deep.puzzle;Deep.puzzle=function(id){
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const p=s&&(s.puzzles||[]).find(q=>q.id===id);
 if(p&&x&&p.type==="heat"&&!x.solved[id]){const e=this.els(s,x,p.tier).find(q=>q.t==="puzzle"&&q.ref.id===id);
  if(e&&this.near(e))return Загадки165.окно(this,s,x,p);}
 return pz0.apply(this,arguments);};});
/* ── вещь яруса издали: загадку решают на месте ── */
safeFn(()=>{const el0=Deep.el;Deep.el=function(id){const [t,rid]=String(id).split(":");
 if(t==="puzzle"){const s=safeFn(()=>this.here(),null);const x=s&&this.st(s);const e=s&&this.els(s,x,this.tierNo()).find(q=>q.t==="puzzle"&&String(q.ref.id)===rid);
  if(e&&this.near(e)&&!x.solved[rid])return this.puzzle(rid);
  const sh0=this.show;const D=this;
  this.show=function(title,html,сказать){html=String(html).split(D.btn("pz:"+rid,"Взяться за загадку")).join("");
   if(e)html=D.line(x.solved[rid]?`${D.cap(e.n)}: решена.`:`${D.cap(e.n)}: не решена. Решают её на месте: подойдите вплотную — клавиша E или двойное касание откроет загадку.`)+html;
   return sh0.call(this,title,html,сказать);};
  try{return el0.apply(this,arguments);}finally{this.show=sh0;}}
 return el0.apply(this,arguments);};});
/* ── окно яруса: какие загадки решены, а какие нет ── */
safeFn(()=>{const h0=Deep.home;Deep.home=function(){const sh0=this.show;const D=this;
 this.show=function(title,html,сказать){if(title==="Ярус подземелья"){const t=Загадки165.яруса(D);if(t){const html2=String(html);const i=html2.indexOf("<button");html=i>=0?html2.slice(0,i)+D.line(t)+html2.slice(i):html2+D.line(t);}}
  return sh0.call(this,title,html,сказать);};
 try{return h0.apply(this,arguments);}finally{this.show=sh0;}};});
/* ── клавиша действия у загадки: сама загадка ── */
safeFn(()=>{const f0=fieldInteract;fieldInteract=function(){
 try{const p=G.place;
  if(gameActive()&&p&&!p.тайник&&!G.ship&&!G.inCombat&&!activeLayer()&&safeFn(()=>Deep.on(),false)){
   /* цель осмотра — загадка или вещь яруса */
   const T=Look.target;if(T&&T.place===placeKey(p.bx,p.by,p.depth)){const s=Deep.here(),x=Deep.st(s);
    const e=Deep.els(s,x,Deep.tierNo()).find(q=>q.x===T.x&&q.y===T.y);
    if(e&&Deep.near(e)){Look.target=null;if(e.t==="puzzle")Deep.puzzle(e.ref.id);else Deep.el(e.t+":"+(e.ref.id||""));return true;}}
   const r=Deep.elNear(1);
   if(r&&r.e.t==="puzzle"){const под=safeFn(()=>somethingHere(),false);const v=(lastMoveDir&&DIRV[lastMoveDir])||null;
    const лицом=!!v&&r.e.x===p.x+v[0]&&r.e.y===p.y+v[1];
    /* по ходу — другая вещь (полка, сундук): ей; иначе — загадке */
    const поХоду=!лицом&&v?safeFn(()=>tileAt(curLevel(),p.x+v[0],p.y+v[1]),"#"):null;
    const другое=поХоду&&ADJ_MAIN_TILES.has(поХоду);
    if(лицом||(!под&&!другое)){Deep.puzzle(r.e.ref.id);return true;}}}}catch(_){}
 return f0.apply(this,arguments);};});
/* ── история яруса: подстановка {империя}, {войны}, {бог}… (ключи по-русски — прежний разбор их не видел) ── */
const ЯрусИстория165={
 заполнить(s){try{if(!s||!s.ctx)return;const n=Object.keys(s.tiers||{}).length;if(s.ист165===n)return;try{Object.defineProperty(s,"ист165",{value:n,writable:true,configurable:true});}catch(_){}const ctx=s.ctx;const f=t=>String(t||"").replace(/\{([^{}]+)\}/g,(m,k)=>ctx[k]||m);s.fill=f;
  for(const k in (s.tiers||{})){const T=s.tiers[k];if(T&&typeof T.hist==="string"&&T.hist.indexOf("{")>=0)T.hist=f(T.hist);}}catch(_){}}};
safeFn(()=>{const sp0=Deep.spec;Deep.spec=function(){const s=sp0.apply(this,arguments);ЯрусИстория165.заполнить(s);return s;};});

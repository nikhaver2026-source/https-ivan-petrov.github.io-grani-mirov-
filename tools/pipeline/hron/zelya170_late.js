/* ════════════════════════════════════════════════════════════════════════
   17.0: ЗЕЛЬЯ ПО РАНГАМ — ОТ ПРОСТОГО ДО БОЖЕСТВЕННОГО; ЗЕЛЬЯ ДВОЙНОГО НАЗНАЧЕНИЯ
   Просьба игрока: «расширь и добавь список зелий, которые игрок может изготовить, от ранга простое до ранга
   божественное — это касается и зелья маны, и зелья здоровья, и всех остальных. Плюс зелья с двойным назначением,
   но их можно только изготовить или получить в награду».
   1. Семь рангов: простое, обычное, крепкое, отборное, великое, легендарное, божественное. Чем выше ранг, тем
      сильнее и дольше действие: зелье здоровья простое возвращает шестую долю здоровья, божественное — всё
      здоровье и сверх того защиту.
   2. Четырнадцать родов, у каждого все семь рангов (98 зелий): здоровья, маны, сил, противоядие, стойкости, силы,
      скорости, чутья, ночного зрения, тепла, прохлады, скрытности, удачи, дыхания.
   3. Двенадцать зелий двойного назначения, ранги с крепкого до божественного (60 зелий): эликсир равновесия
      (здоровье и мана), целебное противоядие, зелье витязя (сила и стойкость), лазутчика (скорость и скрытность),
      совы (ночное зрение и чутьё), северянина (тепло и силы), пустынника (прохлада и силы), ведуна (мана и чутьё),
      искателя (удача и сила), ныряльщика (дыхание и стойкость), берсерка (здоровье и сила), гонца-чародея (мана и
      скорость). Их не продают: только сварить своими руками или получить наградой за большое дело.
   4. Варка — в окне «Зелья», разделы «Зелья по рангам» и «Двойного назначения»: род → ранг → что нужно. Основа
      рода (трава, кристалл, ягоды, грибы, кость, кровь, перья, ракушки, уголь), а сверх неё на каждый ранг своё:
      обычному — травяная вытяжка, крепкому — отстоянная кровь, отборному — серебряная пыль, великому — золотая пыль
      и кровяная эссенция, легендарному — мифриловая пыль и сердечная кровь, божественному — звёздная пыль,
      драконья кровь и эфир. На каждое зелье — пустая склянка; с крепкого — ещё и ступка с пестиком. Ступень
      алхимии: простое и обычное — с первой, крепкое — со второй, отборное — с третьей, великое — с четвёртой,
      легендарное и божественное — с пятой; божественное варят лишь под покровительством бога.
   5. Торг: простые и обычные — у всякого, кто продаёт зелья; крепкие — в городах; отборные — изредка в
      столицах. Выше — только своими руками или наградой.
   ════════════════════════════════════════════════════════════════════════ */
const Зелья170={
 РАНГИ:[{n:"простое",м:"простой",k:0.55,ур:1,доп:{}},{n:"обычное",м:"обычный",k:0.8,ур:1,доп:{"травяная вытяжка":1}},
  {n:"крепкое",м:"крепкий",k:1.1,ур:2,доп:{"отстоянная кровь":1}},{n:"отборное",м:"отборный",k:1.45,ур:3,доп:{"серебряная пыль":1}},
  {n:"великое",м:"великий",k:1.85,ур:4,доп:{"золотая пыль":1,"кровяная эссенция":1}},
  {n:"легендарное",м:"легендарный",k:2.35,ур:5,доп:{"мифриловая пыль":1,"сердечная кровь":1}},
  {n:"божественное",м:"божественный",k:3,ур:5,доп:{"звёздная пыль":1,"драконья кровь":1,"эфир":1}}],
 ДОЛЯ:[0.17,0.25,0.38,0.52,0.66,0.82,1],
 /* род: имя («зелье …» или своё), основа, действие (r — ранг 0…6, q — качество) */
 РОДЫ:{
  heal:{n:"зелье здоровья",о:"раны затягиваются на глазах",осн:{"трава":2},звук:"potion_long",
   дать(r,q){const h=Math.min(G.hpMax,G.hp+Math.round(G.hpMax*Зелья170.ДОЛЯ[r]*q))-G.hp;G.hp+=h;let t=`здоровья +${h}`;
    if(r>=5){if(G.buffs){delete G.buffs["кровотечение"];delete G.buffs["яд"];}t+=", раны и яд ушли";}
    if(r>=6){buffSet("страж",3);t+=", три часа удары по вам слабее";}return t;}},
  mana:{n:"зелье маны",о:"по жилам идёт тепло силы",осн:{"кристалл":1,"трава":1},звук:"cast_potion",
   дать(r,q){const m=Math.min(G.manaMax,G.mana+Math.round(G.manaMax*Зелья170.ДОЛЯ[r]*q))-G.mana;G.mana+=m;let t=`маны +${m}`;
    if(r>=6){buffSet("чутьё",4);t+=", четыре часа чары слышны острее";}return t;}},
  energy:{n:"зелье сил",о:"тело отпускает усталость",осн:{"ягоды":2},звук:"potion_clay",
   дать(r,q){safeFn(()=>adaptRest(Math.round(6*(r+1)*q)));const б=Number(G.water)||0;G.water=Math.min(safeFn(()=>waterCap(),100),б+Math.round(12*(r+1)));
    let t=`усталость снята, воды +${(Number(G.water)||0)-б}`;if(r>=4){buffSet("скорость",r-2);t+=`, ${Зелья170.часы(r-2)} шаг быстрее`;}return t;}},
  antidote:{n:"противоядие",о:"жар уходит из крови",осн:{"грибы":2},звук:"potion_cork",
   дать(r,q){if(G.buffs){delete G.buffs["яд"];delete G.buffs["кровотечение"];}G.poisoned=false;const h=Math.min(G.hpMax,G.hp+Math.round(4*(r+1)*q))-G.hp;G.hp+=h;
    let t=`яд выведен, здоровья +${h}`;if(r>=2){buffSet("стойкость",r+1);t+=`, ${Зелья170.часы(r+1)} яд не берёт`;}return t;}},
  resist:{n:"зелье стойкости",о:"кожа делается плотной",осн:{"кость":1,"трава":1},звук:"potion_elixir",
   дать(r,q){const ч=Math.round(2*(r+1)*q);buffSet("стойкость",ч);let t=`${Зелья170.часы(ч)} защита выше, яд трав не берёт`;
    if(r>=3){buffSet("страж",r-1);t+=`; ${Зелья170.часы(r-1)} удары по вам слабее`;}return t;}},
  strength:{n:"зелье силы",о:"плечи наливаются",осн:{"звериная кровь":1,"ягоды":1},звук:"potion_elixir",
   дать(r,q){const ч=Math.max(1,Math.round(1.5*(r+1)*q));buffSet("мощь",ч);return `${Зелья170.часы(ч)} удар сильнее`;}},
  speed:{n:"зелье скорости",о:"ноги делаются лёгкими",осн:{"перо":2,"ягоды":1},звук:"potion_quick",
   дать(r,q){const ч=Math.round(2*(r+1)*q);buffSet("лёгкость",ч);let t=`${Зелья170.часы(ч)} шаг легче`;if(r>=4){buffSet("скорость",r-2);t+=`, ${Зелья170.часы(r-2)} и быстрее`;}return t;}},
  sense:{n:"зелье чутья",о:"дальнее слышно как близкое",осн:{"грибы":1,"перо":1},звук:"cast_potion",
   дать(r,q){const ч=Math.round(2*(r+1)*q);buffSet("чутьё",ч);return `${Зелья170.часы(ч)} звуковая картина шире`;}},
  night:{n:"зелье ночного зрения",о:"ночь делается серой, а не чёрной",осн:{"грибы":2},звук:"cast_potion",
   дать(r,q){const ч=Math.round(3*(r+1)*q);buffSet("ночное зрение",ч);return `${Зелья170.часы(ч)} видно в темноте`;}},
  warm:{n:"зелье тепла",о:"внутри разгорается печка",осн:{"древесный уголь":1,"трава":1},звук:"potion_clay",
   дать(r,q){const ч=Math.round(3*(r+1)*q);buffSet("тепло",ч);return `${Зелья170.часы(ч)} стужа не берёт`;}},
  cool:{n:"зелье прохлады",о:"в груди ровный холодок",осн:{"ракушка":1,"трава":1},звук:"potion_clay",
   дать(r,q){const ч=Math.round(3*(r+1)*q);buffSet("прохлада",ч);return `${Зелья170.часы(ч)} жар не берёт`;}},
  stealth:{n:"зелье скрытности",о:"воздух вокруг густеет",осн:{"трава":1,"грибы":1},звук:"potion_cork",
   дать(r,q){const ч=Math.max(1,Math.round(1.5*(r+1)*q));buffSet("морок",ч);return `${Зелья170.часы(ч)} встреч меньше`;}},
  luck:{n:"зелье удачи",о:"в груди будто звенит монета",осн:{"ракушка":1,"ягоды":1},звук:"potion_quick",
   дать(r,q){const ч=Math.max(1,Math.round((r+1)*q));buffSet("удача",ч);return `${Зелья170.часы(ч)} удача на вашей стороне`;}},
  breath:{n:"зелье дыхания",о:"грудь не просит воздуха",осн:{"ракушка":2},звук:"potion_clay",
   дать(r,q){const ч=Math.round(2*(r+1)*q);buffSet("дыхание",ч);return `${Зелья170.часы(ч)} под водой дышится дольше`;}}},
 /* двойного назначения: два рода сразу; только сварить или получить в награду */
 ДВОЙНЫЕ:{
  balance:{n:"эликсир равновесия",м:true,из:["heal","mana"],о:"здоровье и мана разом"},
  healanti:{n:"целебное противоядие",из:["heal","antidote"],о:"и раны, и яд"},
  knight:{n:"зелье витязя",из:["strength","resist"],о:"сила удара и стойкость"},
  scout:{n:"зелье лазутчика",из:["speed","stealth"],о:"лёгкий шаг и скрытность"},
  owl:{n:"зелье совы",из:["night","sense"],о:"ночное зрение и чутьё"},
  north:{n:"зелье северянина",из:["warm","energy"],о:"тепло и силы"},
  desert:{n:"зелье пустынника",из:["cool","energy"],о:"прохлада и силы"},
  seer:{n:"зелье ведуна",из:["mana","sense"],о:"мана и чутьё"},
  seeker:{n:"зелье искателя",из:["luck","strength"],о:"удача и сила"},
  diver:{n:"зелье ныряльщика",из:["breath","resist"],о:"дыхание и стойкость"},
  berserk:{n:"зелье берсерка",из:["heal","strength"],о:"здоровье и ярость удара"},
  courier:{n:"зелье гонца-чародея",из:["mana","speed"],о:"мана и быстрый шаг"}},
 часы(ч){ч=Math.max(1,Math.round(ч));return ч===1?"час":ч<5?["","","два","три","четыре"][ч]+" часа":ч+" часов";},
 cap(t){t=String(t||"");return t?t[0].toUpperCase()+t.slice(1):t;},
 id(вид,r,двойное){return `r170_${двойное?"d_":""}${вид}_${r+1}`;},
 /* имя зелья ранга: «Крепкое зелье здоровья», «Великий эликсир равновесия» */
 имя(вид,r,двойное){const d=двойное?this.ДВОЙНЫЕ[вид]:this.РОДЫ[вид];const R=this.РАНГИ[r];return this.cap(`${d.м?R.м:R.n} ${d.n}`);},
 /* что нужно на варку */
 нужно(вид,r,двойное){const o={};const add=(m,k)=>{for(const x in m)o[x]=(o[x]||0)+m[x]*(k||1);};
  if(двойное){const d=this.ДВОЙНЫЕ[вид];d.из.forEach(x=>add(this.РОДЫ[x].осн));}else add(this.РОДЫ[вид].осн);
  add(this.РАНГИ[r].доп);o["пустая склянка"]=(o["пустая склянка"]||0)+1;return o;},
 ступень(r,двойное){return Math.min(5,this.РАНГИ[r].ур+(двойное?1:0));},
 ступка(){return (G.items||[]).includes("Ступка с пестиком");},
 почему(вид,r,двойное){const ур=safeFn(()=>mastLevel("alchemy"),0);const надо=this.ступень(r,двойное);
  if(ур<надо)return `нужна ${["","первая","вторая","третья","четвёртая","пятая"][надо]} ступень алхимии (у вас ${ур})`;
  if(r>=2&&!this.ступка())return "нужна ступка с пестиком — у торговца или в мастерской";
  if(r>=6&&!G.patron)return "божественное варят под покровительством бога: примите покровительство в храме";
  const н=this.нужно(вид,r,двойное);const нет=Object.keys(н).filter(x=>(Number(G.inv[x])||0)<н[x]).map(x=>`${x} (${Number(G.inv[x])||0} из ${н[x]})`);
  return нет.length?`не хватает: ${нет.join(", ")}`:"";},
 состав(вид,r,двойное){const н=this.нужно(вид,r,двойное);return Object.keys(н).map(x=>`${x}${н[x]>1?` ×${н[x]}`:""}`).join(", ");},
 /* сварить */
 сварить(вид,r,двойное){const pt=POTION_BY_ID[this.id(вид,r,двойное)];if(!pt){narrate("Такого зелья нет.");return false;}
  const why=this.почему(вид,r,двойное);if(why){narrate(`${this.имя(вид,r,двойное)}: ${why}.`,{interrupt:true});return false;}
  const н=this.нужно(вид,r,двойное);for(const x in н){G.inv[x]=(Number(G.inv[x])||0)-н[x];if(G.inv[x]<=0)delete G.inv[x];}
  const ур=safeFn(()=>mastLevel("alchemy"),0);const q=+Math.min(1.5,0.85+0.08*ур+(Math.random()*0.1)).toFixed(2);
  const rec=potionGive(pt.id,{q,стаб:Math.min(0.97,0.8+0.03*ур),имя:this.имя(вид,r,двойное)});
  safeFn(()=>{Bank.play("oc_boiling",{gain:0.55,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play("arte_potion",{gain:0.5,maxSec:2})),700);});
  safeFn(()=>mastGain("alchemy",2+r+(двойное?2:0)));safeFn(()=>propTime(0.3+0.1*r));const xp=xpGain(6+6*r+(двойное?10:0));G.xp+=xp;safeFn(()=>checkLevelUp());
  journal(`Сварено: ${this.имя(вид,r,двойное)}.`);
  narrate(`Сварено: ${this.имя(вид,r,двойное)}. Качество ${potionQualityWord(q)}. Опыт +${xp}. Лежит в разделе «Зелья».`,{interrupt:true});
  safeFn(()=>{saveGame(true);refresh();});return !!rec;},
 /* дать в награду */
 наградой(r,двойное,seed){const виды=Object.keys(двойное?this.ДВОЙНЫЕ:this.РОДЫ);const вид=виды[Math.floor(hashName(Number(seed)|0,r*7+(двойное?3:1),17101)*виды.length)%виды.length];
  r=Math.max(двойное?2:0,Math.min(6,r));potionGive(this.id(вид,r,двойное),{q:1.1,стаб:0.95,имя:this.имя(вид,r,двойное)});return this.имя(вид,r,двойное);},
 /* окно: разделы варки по рангам */
 вид:null,двойное:false,
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 разделы(){const ур=safeFn(()=>mastLevel("alchemy"),0);
  return `<h3>Зелья по рангам</h3><button class="item" data-cmd="z170:list" data-speak="${this.q(`Зелья по рангам: четырнадцать родов, у каждого семь рангов — от простого до божественного. Ваша ступень алхимии ${ур}.`)}">Зелья по рангам — 14 родов, 7 рангов</button>`+
   `<button class="item" data-cmd="z170:dlist" data-speak="${this.q("Зелья двойного назначения: двенадцать, от крепкого до божественного. Их не продают — только сварить или получить в награду.")}">Двойного назначения — 12 зелий</button>`;},
 список(двойное){this.двойное=!!двойное;this.вид=null;const box=document.getElementById("potBody");if(!box)return false;
  const виды=Object.keys(двойное?this.ДВОЙНЫЕ:this.РОДЫ);const ур=safeFn(()=>mastLevel("alchemy"),0);
  let html=`<div class="list-line" tabindex="0" data-speak="${this.q(двойное?`Зелья двойного назначения: ${виды.length}. Только сварить или получить в награду. Выберите зелье.`:`Зелья по рангам: ${виды.length} родов. Выберите род.`)}">${двойное?"Двойного назначения":"Зелья по рангам"} · ступень алхимии ${ур}</div>`;
  for(const v of виды){const d=двойное?this.ДВОЙНЫЕ[v]:this.РОДЫ[v];let лучш=-1;
   for(let r=двойное?2:0;r<7;r++)if(!this.почему(v,r,двойное))лучш=r;
   const t=`${this.cap(d.n)} — ${d.о}${лучш>=0?`; можно сварить до ранга «${this.РАНГИ[лучш].n}»`:""}`;
   html+=`<button class="item" data-cmd="z170:${двойное?"d":"k"}~${v}" data-speak="${this.q(t)}">${this.q(t)}</button>`;}
  html+=`<div class="row"><button class="item" data-cmd="z170:back" data-speak="Назад, к зельям.">Назад</button></div>`;
  box.innerHTML=html;safeFn(()=>setCursor(box.querySelector(".list-line,button.item"),true));return true;},
 ранги(v,двойное){this.вид=v;this.двойное=!!двойное;const box=document.getElementById("potBody");if(!box)return false;const d=двойное?this.ДВОЙНЫЕ[v]:this.РОДЫ[v];if(!d)return false;
  let html=`<div class="list-line" tabindex="0" data-speak="${this.q(`${this.cap(d.n)}: ${d.о}. Ранги — от ${двойное?"крепкого":"простого"} до божественного. Двойное касание по рангу — сварить.`)}">${this.cap(d.n)}</div>`;
  for(let r=двойное?2:0;r<7;r++){const why=this.почему(v,r,двойное);const имя=this.имя(v,r,двойное);const pt=POTION_BY_ID[this.id(v,r,двойное)];
   const пример=safeFn(()=>Зелья170.описать(v,r,двойное),"");
   const t=`${имя}: ${пример}. Нужно: ${this.состав(v,r,двойное)}. ${why?why[0].toUpperCase()+why.slice(1)+".":"Можно сварить."}`;
   html+=`<button class="item" data-cmd="z170:b~${двойное?"d":"k"}~${v}~${r}" data-speak="${this.q(t)}">${this.q(имя)}${why?"":" · можно сварить"}</button>`;}
  html+=`<div class="row"><button class="item" data-cmd="z170:${двойное?"dlist":"list"}" data-speak="Назад, к списку.">Назад</button></div>`;
  box.innerHTML=html;safeFn(()=>setCursor(box.querySelector(".list-line,button.item"),true));return true;},
 /* что сделает зелье — словами, не выпивая */
 описать(v,r,двойное){const сл={heal:`здоровья ${Math.round(this.ДОЛЯ[r]*100)} из ста`,mana:`маны ${Math.round(this.ДОЛЯ[r]*100)} из ста`,energy:"снимает усталость и жажду",
   antidote:"выводит яд",resist:`стойкость ${this.часы(2*(r+1))}`,strength:`удар сильнее ${this.часы(1.5*(r+1))}`,speed:`лёгкий шаг ${this.часы(2*(r+1))}`,
   sense:`чутьё ${this.часы(2*(r+1))}`,night:`ночное зрение ${this.часы(3*(r+1))}`,warm:`тепло ${this.часы(3*(r+1))}`,cool:`прохлада ${this.часы(3*(r+1))}`,
   stealth:`скрытность ${this.часы(1.5*(r+1))}`,luck:`удача ${this.часы(r+1)}`,breath:`дыхание под водой ${this.часы(2*(r+1))}`};
  if(двойное)return this.ДВОЙНЫЕ[v].из.map(x=>сл[x]).join(" и ");return сл[v]||"";},
 /* торг: простые и обычные — у всех, кто держит зелья; крепкие — в городах; отборные — изредка в столицах */
 ЦЕНА:[12,24,48,110],
 прилавок(n,out){try{if(!n||G.dark)return out;if(!out.some(o=>o&&o.зелье))return out;const город=!!safeFn(()=>isCityAt(n.x,n.y),null);
   const столица=G.place&&["castle","citadel"].includes(G.place.stype);const виды=Object.keys(this.РОДЫ);const k=safeFn(()=>priceDyn(n.x,n.y),1);
   const сколько=3+(hashName(n.x|0,n.y|0,17110)<0.5?1:0);
   for(let i=0;i<сколько;i++){const v=виды[Math.floor(hashName((n.x|0)+i*7,(n.y|0)+i*3,17111)*виды.length)%виды.length];
    let r=hashName((n.x|0)+i,(n.y|0)-i,17112)<0.5?0:1;if(город&&hashName(n.x|0,(n.y|0)+i,17113)<0.4)r=2;if(столица&&hashName((n.x|0)+i,n.y|0,17114)<0.2)r=3;
    const id=this.id(v,r,false);if(out.some(o=>o.зелье===id))continue;
    out.push({n:this.имя(v,r,false),зелье:id,price:Math.max(4,Math.round(this.ЦЕНА[r]*k*(v==="heal"||v==="mana"?1:0.8)))});}
   return out;}catch(_){return out;}}};
/* ── все ранги и двойные — в общий список зелий (из опыта: в прежний список варки не попадают) ── */
safeFn(()=>{if(POTION_BY_ID["r170_heal_1"])return;const Z=Зелья170;
 for(const v in Z.РОДЫ)for(let r=0;r<7;r++){const d=Z.РОДЫ[v];const id=Z.id(v,r,false);
  const p={id,n:Z.имя(v,r,false).toLowerCase(),из:[],срок:14+4*r,стаб:0.8,о:d.о,опыт:true,gen:true,р170:{вид:v,r},дать:q=>d.дать(r,Number(q)||1)};
  POTIONS.push(p);POTION_BY_ID[id]=p;POTION_SOUND[id]=d.звук;}
 for(const v in Z.ДВОЙНЫЕ)for(let r=2;r<7;r++){const d=Z.ДВОЙНЫЕ[v];const id=Z.id(v,r,true);
  const p={id,n:Z.имя(v,r,true).toLowerCase(),из:[],срок:20+4*r,стаб:0.85,о:d.о,опыт:true,gen:true,двойное:true,р170:{вид:v,r,двойное:true},
   дать:q=>d.из.map(x=>Z.РОДЫ[x].дать(r,Number(q)||1)).join("; ")};
  POTIONS.push(p);POTION_BY_ID[id]=p;POTION_SOUND[id]=Z.РОДЫ[d.из[0]].звук;}});
/* у склянки ранга всегда своё имя: «Крепкое зелье здоровья» */
safeFn(()=>{const p0=potionsOf;potionsOf=matKeep(p0,function(){const L=p0.apply(this,arguments);
 try{for(const r of L)if(r&&!r.имя&&String(r.id).startsWith("r170_")){const pt=POTION_BY_ID[r.id];if(pt&&pt.р170)r.имя=Зелья170.имя(pt.р170.вид,pt.р170.r,pt.р170.двойное);}}catch(_){}return L;});});
/* окно «Зелья»: разделы варки по рангам */
safeFn(()=>{const r0=renderPotions;renderPotions=matKeep(r0,function(){const r=r0.apply(this,arguments);
 safeFn(()=>{const box=document.getElementById("potBody");if(!box)return;const h=[...box.querySelectorAll("h3")].find(x=>/Сварить/.test(x.textContent));
  if(h)h.insertAdjacentHTML("beforebegin",Зелья170.разделы());else box.insertAdjacentHTML("beforeend",Зелья170.разделы());});return r;});});
CMD.z170=function(a){a=String(a||"");const p=a.split("~");
 if(a==="list")return Зелья170.список(false);if(a==="dlist")return Зелья170.список(true);if(a==="back"){Зелья170.вид=null;return renderPotions();}
 if(p[0]==="k")return Зелья170.ранги(p[1],false);if(p[0]==="d")return Зелья170.ранги(p[1],true);
 if(p[0]==="b"){const ok=Зелья170.сварить(p[2],Number(p[3])||0,p[1]==="d");Зелья170.ранги(p[2],p[1]==="d");return ok;}
 return false;};
/* торг: зелья рангов у тех, кто продаёт зелья */
safeFn(()=>{const s0=stockPotions;stockPotions=matKeep(s0,function(n,deep){const out=s0.apply(this,arguments);return Зелья170.прилавок(n,out);});});

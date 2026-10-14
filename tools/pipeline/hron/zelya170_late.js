/* ════════════════════════════════════════════════════════════════════════
   17.0: ЗЕЛЬЯ ПО РАНГАМ — ОТ ПРОСТОГО ДО БОЖЕСТВЕННОГО; ЗЕЛЬЯ ДВОЙНОГО НАЗНАЧЕНИЯ
   Просьба игрока: «расширь и добавь список зелий, которые игрок может изготовить, от ранга простое до ранга
   божественное — это касается и зелья маны, и зелья здоровья, и всех остальных. Плюс зелья с двойным назначением,
   но их можно только изготовить или получить в награду».
   1. Одиннадцать рангов: простое, обычное, крепкое, отборное, превосходное, великое, героическое, легендарное,
      мифическое, небесное, божественное. Чем выше ранг, тем сильнее и дольше действие: зелье здоровья простое
      возвращает седьмую долю здоровья, божественное — всё здоровье и сверх того защиту.
   2. Четырнадцать родов, у каждого все одиннадцать рангов (154 зелья): здоровья, маны, сил, противоядие, стойкости,
      силы, скорости, чутья, ночного зрения, тепла, прохлады, скрытности, удачи, дыхания.
   3. Пятнадцать именных зелий двойного назначения, ранги с крепкого до божественного (135 зелий): эликсир
      равновесия, целебное противоядие, зелье витязя, лазутчика, совы, северянина, пустынника, ведуна, искателя,
      ныряльщика, берсерка, гонца-чародея, тени (скрытность и ночное зрение), пророка (чутьё и удача), странника
      (силы и скорость). Их не продают: только сварить своими руками или получить наградой за большое дело.
   4. Варка — в окне «Зелья», разделы «Зелья по рангам» и «Двойного назначения»: род → ранг → что нужно. Основа
      рода, а сверх неё на каждый ранг своё: травяная вытяжка, отстоянная кровь, серебряная пыль, кровяная соль,
      золотая пыль и кровяная эссенция, мифриловая пыль и сердечная кровь, эфир, звёздная пыль, драконья кровь.
      На каждое зелье — пустая склянка. Ступень алхимии: первая — до обычного, вторая — до отборного, третья — до
      великого, четвёртая — до легендарного, пятая — выше. Оборудование алхимика: ступка с пестиком — с крепкого,
      перегонный куб — с превосходного, стеклянная реторта — с героического, атанор — с мифического;
      божественное варят лишь под покровительством бога.
   5. Не накладываются: зелье того же рода, пока действует прежнее, не выпить, если оно не сильнее (слабое
      осталось бы без толку — склянка цела); сильное заменяет слабое. Больше четырёх зелий рангов за час — тело
      не принимает: пятое и следующие действуют вполсилы.
   6. Торг: простые и обычные — у всякого, кто продаёт зелья; крепкие и отборные — в городах; превосходные —
      изредка в столицах. Выше — только своими руками или наградой. Оборудование — у травников и в мастерских.
   ════════════════════════════════════════════════════════════════════════ */
const Зелья170={
 РАНГИ:[{n:"простое",м:"простой",ур:1,доп:{}},{n:"обычное",м:"обычный",ур:1,доп:{"травяная вытяжка":1}},
  {n:"крепкое",м:"крепкий",ур:2,доп:{"отстоянная кровь":1}},{n:"отборное",м:"отборный",ур:2,доп:{"серебряная пыль":1}},
  {n:"превосходное",м:"превосходный",ур:3,доп:{"серебряная пыль":1,"кровяная соль":1}},
  {n:"великое",м:"великий",ур:3,доп:{"золотая пыль":1,"кровяная эссенция":1}},
  {n:"героическое",м:"героический",ур:4,доп:{"золотая пыль":2,"кровяная эссенция":1}},
  {n:"легендарное",м:"легендарный",ур:4,доп:{"мифриловая пыль":1,"сердечная кровь":1}},
  {n:"мифическое",м:"мифический",ур:5,доп:{"мифриловая пыль":2,"сердечная кровь":1,"эфир":1}},
  {n:"небесное",м:"небесный",ур:5,доп:{"звёздная пыль":1,"сердечная кровь":1,"эфир":1}},
  {n:"божественное",м:"божественный",ур:5,доп:{"звёздная пыль":1,"драконья кровь":1,"эфир":1}}],
 ДОЛЯ:[0.15,0.22,0.3,0.38,0.47,0.56,0.65,0.75,0.85,0.93,1],
 ВЫСШИЙ:10,
 /* сила действия ранга: 1 у простого … 7 у божественного (часы и прибавки растут с ней) */
 С(r){return 1+0.6*r;},
 /* награды больших дел писаны по прежней мере (0…6): переводим в ранги */
 НАГРАДА:[0,1,2,3,5,7,10],
 /* оборудование алхимика: с какого ранга что нужно */
 ОБОРУДОВАНИЕ:[{r:2,n:"Ступка с пестиком"},{r:4,n:"Перегонный куб"},{r:6,n:"Стеклянная реторта"},{r:8,n:"Атанор"}],
 /* род: имя («зелье …» или своё), основа, действие (r — ранг 0…6, q — качество) */
 РОДЫ:{
  heal:{n:"зелье здоровья",о:"раны затягиваются на глазах",осн:{"трава":2},звук:"potion_long",
   дать(r,q){const h=Math.min(G.hpMax,G.hp+Math.round(G.hpMax*Зелья170.ДОЛЯ[r]*q))-G.hp;G.hp+=h;let t=`здоровья +${h}`;
    if(r>=7){if(G.buffs){delete G.buffs["кровотечение"];delete G.buffs["яд"];}t+=", раны и яд ушли";}
    if(r>=9){const ч=r>=10?3:2;buffSet("страж",ч);t+=`, ${Зелья170.часы(ч)} удары по вам слабее`;}return t;}},
  mana:{n:"зелье маны",о:"по жилам идёт тепло силы",осн:{"кристалл":1,"трава":1},звук:"cast_potion",
   дать(r,q){const m=Math.min(G.manaMax,G.mana+Math.round(G.manaMax*Зелья170.ДОЛЯ[r]*q))-G.mana;G.mana+=m;let t=`маны +${m}`;
    if(r>=8){const ч=r>=10?4:2;buffSet("чутьё",ч);t+=`, ${Зелья170.часы(ч)} чары слышны острее`;}return t;}},
  energy:{n:"зелье сил",о:"тело отпускает усталость",осн:{"ягоды":2},звук:"potion_clay",
   дать(r,q){const С=Зелья170.С(r);safeFn(()=>adaptRest(Math.round(6*С*q)));const б=Number(G.water)||0;G.water=Math.min(safeFn(()=>waterCap(),100),б+Math.round(12*С));
    let t=`усталость снята, воды +${(Number(G.water)||0)-б}`;if(r>=5){const ч=Math.round(С-2.5);buffSet("скорость",ч);t+=`, ${Зелья170.часы(ч)} шаг быстрее`;}return t;}},
  antidote:{n:"противоядие",о:"жар уходит из крови",осн:{"грибы":2},звук:"potion_cork",
   дать(r,q){const С=Зелья170.С(r);if(G.buffs){delete G.buffs["яд"];delete G.buffs["кровотечение"];}G.poisoned=false;const h=Math.min(G.hpMax,G.hp+Math.round(4*С*q))-G.hp;G.hp+=h;
    let t=`яд выведен, здоровья +${h}`;if(r>=2){const ч=Math.round(С);buffSet("стойкость",ч);t+=`, ${Зелья170.часы(ч)} яд не берёт`;}return t;}},
  resist:{n:"зелье стойкости",о:"кожа делается плотной",осн:{"кость":1,"трава":1},звук:"potion_elixir",
   дать(r,q){const С=Зелья170.С(r);const ч=Math.round(2*С*q);buffSet("стойкость",ч);let t=`${Зелья170.часы(ч)} защита выше, яд трав не берёт`;
    if(r>=4){const с=Math.round(С-1.5);buffSet("страж",с);t+=`; ${Зелья170.часы(с)} удары по вам слабее`;}return t;}},
  strength:{n:"зелье силы",о:"плечи наливаются",осн:{"звериная кровь":1,"ягоды":1},звук:"potion_elixir",
   дать(r,q){const ч=Math.max(1,Math.round(1.5*Зелья170.С(r)*q));buffSet("мощь",ч);return `${Зелья170.часы(ч)} удар сильнее`;}},
  speed:{n:"зелье скорости",о:"ноги делаются лёгкими",осн:{"перо":2,"ягоды":1},звук:"potion_quick",
   дать(r,q){const С=Зелья170.С(r);const ч=Math.round(2*С*q);buffSet("лёгкость",ч);let t=`${Зелья170.часы(ч)} шаг легче`;if(r>=5){const с=Math.round(С-2.5);buffSet("скорость",с);t+=`, ${Зелья170.часы(с)} и быстрее`;}return t;}},
  sense:{n:"зелье чутья",о:"дальнее слышно как близкое",осн:{"грибы":1,"перо":1},звук:"cast_potion",
   дать(r,q){const ч=Math.round(2*Зелья170.С(r)*q);buffSet("чутьё",ч);return `${Зелья170.часы(ч)} звуковая картина шире`;}},
  night:{n:"зелье ночного зрения",о:"ночь делается серой, а не чёрной",осн:{"грибы":2},звук:"cast_potion",
   дать(r,q){const ч=Math.round(3*Зелья170.С(r)*q);buffSet("ночное зрение",ч);return `${Зелья170.часы(ч)} видно в темноте`;}},
  warm:{n:"зелье тепла",о:"внутри разгорается печка",осн:{"древесный уголь":1,"трава":1},звук:"potion_clay",
   дать(r,q){const ч=Math.round(3*Зелья170.С(r)*q);buffSet("тепло",ч);return `${Зелья170.часы(ч)} стужа не берёт`;}},
  cool:{n:"зелье прохлады",о:"в груди ровный холодок",осн:{"ракушка":1,"трава":1},звук:"potion_clay",
   дать(r,q){const ч=Math.round(3*Зелья170.С(r)*q);buffSet("прохлада",ч);return `${Зелья170.часы(ч)} жар не берёт`;}},
  stealth:{n:"зелье скрытности",о:"воздух вокруг густеет",осн:{"трава":1,"грибы":1},звук:"potion_cork",
   дать(r,q){const ч=Math.max(1,Math.round(1.5*Зелья170.С(r)*q));buffSet("морок",ч);return `${Зелья170.часы(ч)} встреч меньше`;}},
  luck:{n:"зелье удачи",о:"в груди будто звенит монета",осн:{"ракушка":1,"ягоды":1},звук:"potion_quick",
   дать(r,q){const ч=Math.max(1,Math.round(Зелья170.С(r)*q));buffSet("удача",ч);return `${Зелья170.часы(ч)} удача на вашей стороне`;}},
  breath:{n:"зелье дыхания",о:"грудь не просит воздуха",осн:{"ракушка":2},звук:"potion_clay",
   дать(r,q){const ч=Math.round(2*Зелья170.С(r)*q);buffSet("дыхание",ч);return `${Зелья170.часы(ч)} под водой дышится дольше`;}}},
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
  courier:{n:"зелье гонца-чародея",из:["mana","speed"],о:"мана и быстрый шаг"},
  shadow:{n:"зелье тени",из:["stealth","night"],о:"скрытность и ночное зрение"},
  prophet:{n:"зелье пророка",из:["sense","luck"],о:"чутьё и удача"},
  wanderer:{n:"зелье странника",из:["energy","speed"],о:"силы и быстрый шаг"}},
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
 есть(вещь){return (G.items||[]).includes(вещь)||!!safeFn(()=>Torg.has(вещь),false);},
 ступка(){return this.есть("Ступка с пестиком");},
 почему(вид,r,двойное){const ур=safeFn(()=>mastLevel("alchemy"),0);const надо=this.ступень(r,двойное);
  if(ур<надо)return `нужна ${["","первая","вторая","третья","четвёртая","пятая"][надо]} ступень алхимии (у вас ${ур})`;
  const нетОб=this.ОБОРУДОВАНИЕ.filter(o=>r>=o.r&&!this.есть(o.n)).map(o=>o.n.toLowerCase());
  if(нетОб.length)return `нужно оборудование: ${нетОб.join(", ")} — у травника, в мастерской или в «Крафте»`;
  if(r>=this.ВЫСШИЙ&&!G.patron)return "божественное варят под покровительством бога: примите покровительство в храме";
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
 наградой(r,двойное,seed){r=this.НАГРАДА[Math.max(0,Math.min(6,Number(r)||0))];const виды=Object.keys(двойное?this.ДВОЙНЫЕ:this.РОДЫ);const вид=виды[Math.floor(hashName(Number(seed)|0,r*7+(двойное?3:1),17101)*виды.length)%виды.length];
  r=Math.max(двойное?2:0,Math.min(this.ВЫСШИЙ,r));potionGive(this.id(вид,r,двойное),{q:1.1,стаб:0.95,имя:this.имя(вид,r,двойное)});return this.имя(вид,r,двойное);},
 /* окно: разделы варки по рангам */
 вид:null,двойное:false,
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 разделы(){const ур=safeFn(()=>mastLevel("alchemy"),0);
  return `<h3>Зелья по рангам</h3><button class="item" data-cmd="z170:list" data-speak="${this.q(`Зелья по рангам: четырнадцать родов, у каждого одиннадцать рангов — от простого до божественного. Ваша ступень алхимии ${ур}.`)}">Зелья по рангам — 14 родов, 11 рангов</button>`+
   `<button class="item" data-cmd="z170:dlist" data-speak="${this.q("Зелья двойного назначения: пятнадцать, от крепкого до божественного. Их не продают — только сварить или получить в награду.")}">Двойного назначения — 15 зелий</button>`;},
 список(двойное){this.двойное=!!двойное;this.вид=null;const box=document.getElementById("potBody");if(!box)return false;
  const виды=Object.keys(двойное?this.ДВОЙНЫЕ:this.РОДЫ);const ур=safeFn(()=>mastLevel("alchemy"),0);
  let html=`<div class="list-line" tabindex="0" data-speak="${this.q(двойное?`Зелья двойного назначения: ${виды.length}. Только сварить или получить в награду. Выберите зелье.`:`Зелья по рангам: ${виды.length} родов. Выберите род.`)}">${двойное?"Двойного назначения":"Зелья по рангам"} · ступень алхимии ${ур}</div>`;
  for(const v of виды){const d=двойное?this.ДВОЙНЫЕ[v]:this.РОДЫ[v];let лучш=-1;
   for(let r=двойное?2:0;r<=this.ВЫСШИЙ;r++)if(!this.почему(v,r,двойное))лучш=r;
   const t=`${this.cap(d.n)} — ${d.о}${лучш>=0?`; можно сварить до ранга «${this.РАНГИ[лучш].n}»`:""}`;
   html+=`<button class="item" data-cmd="z170:${двойное?"d":"k"}~${v}" data-speak="${this.q(t)}">${this.q(t)}</button>`;}
  html+=`<div class="row"><button class="item" data-cmd="z170:back" data-speak="Назад, к зельям.">Назад</button></div>`;
  box.innerHTML=html;safeFn(()=>setCursor(box.querySelector(".list-line,button.item"),true));return true;},
 ранги(v,двойное){this.вид=v;this.двойное=!!двойное;const box=document.getElementById("potBody");if(!box)return false;const d=двойное?this.ДВОЙНЫЕ[v]:this.РОДЫ[v];if(!d)return false;
  let html=`<div class="list-line" tabindex="0" data-speak="${this.q(`${this.cap(d.n)}: ${d.о}. Ранги — от ${двойное?"крепкого":"простого"} до божественного. Двойное касание по рангу — сварить.`)}">${this.cap(d.n)}</div>`;
  for(let r=двойное?2:0;r<=this.ВЫСШИЙ;r++){const why=this.почему(v,r,двойное);const имя=this.имя(v,r,двойное);const pt=POTION_BY_ID[this.id(v,r,двойное)];
   const пример=safeFn(()=>Зелья170.описать(v,r,двойное),"");
   const t=`${имя}: ${пример}. Нужно: ${this.состав(v,r,двойное)}. ${why?why[0].toUpperCase()+why.slice(1)+".":"Можно сварить."}`;
   html+=`<button class="item" data-cmd="z170:b~${двойное?"d":"k"}~${v}~${r}" data-speak="${this.q(t)}">${this.q(имя)}${why?"":" · можно сварить"}</button>`;}
  html+=`<div class="row"><button class="item" data-cmd="z170:${двойное?"dlist":"list"}" data-speak="Назад, к списку.">Назад</button></div>`;
  box.innerHTML=html;safeFn(()=>setCursor(box.querySelector(".list-line,button.item"),true));return true;},
 /* что сделает зелье — словами, не выпивая */
 описать(v,r,двойное){const С=this.С(r);const сл={heal:`здоровья ${Math.round(this.ДОЛЯ[r]*100)} из ста`,mana:`маны ${Math.round(this.ДОЛЯ[r]*100)} из ста`,energy:"снимает усталость и жажду",
   antidote:"выводит яд",resist:`стойкость ${this.часы(2*С)}`,strength:`удар сильнее ${this.часы(1.5*С)}`,speed:`лёгкий шаг ${this.часы(2*С)}`,
   sense:`чутьё ${this.часы(2*С)}`,night:`ночное зрение ${this.часы(3*С)}`,warm:`тепло ${this.часы(3*С)}`,cool:`прохлада ${this.часы(3*С)}`,
   stealth:`скрытность ${this.часы(1.5*С)}`,luck:`удача ${this.часы(С)}`,breath:`дыхание под водой ${this.часы(2*С)}`};
  if(двойное)return this.ДВОЙНЫЕ[v].из.map(x=>сл[x]).join(" и ");return сл[v]||"";},
 /* торг: простые и обычные — у всех, кто держит зелья; крепкие — в городах; отборные — изредка в столицах */
 ЦЕНА:[12,24,48,80,140],
 прилавок(n,out){try{if(!n||G.dark)return out;if(!out.some(o=>o&&o.зелье))return out;const город=!!safeFn(()=>isCityAt(n.x,n.y),null);
   const столица=G.place&&["castle","citadel"].includes(G.place.stype);const виды=Object.keys(this.РОДЫ);const k=safeFn(()=>priceDyn(n.x,n.y),1);
   const сколько=3+(hashName(n.x|0,n.y|0,17110)<0.5?1:0);
   for(let i=0;i<сколько;i++){const v=виды[Math.floor(hashName((n.x|0)+i*7,(n.y|0)+i*3,17111)*виды.length)%виды.length];
    let r=hashName((n.x|0)+i,(n.y|0)-i,17112)<0.5?0:1;if(город&&hashName(n.x|0,(n.y|0)+i,17113)<0.4)r=hashName(n.x|0,(n.y|0)-i,17115)<0.6?2:3;if(столица&&hashName((n.x|0)+i,n.y|0,17114)<0.2)r=4;
    const id=this.id(v,r,false);if(out.some(o=>o.зелье===id))continue;
    out.push({n:this.имя(v,r,false),зелье:id,price:Math.max(4,Math.round(this.ЦЕНА[r]*k*(v==="heal"||v==="mana"?1:0.8)))});}
   return out;}catch(_){return out;}}};
/* ── все ранги и двойные — в общий список зелий (из опыта: в прежний список варки не попадают) ── */
safeFn(()=>{if(POTION_BY_ID["r170_heal_1"])return;const Z=Зелья170;
 for(const v in Z.РОДЫ)for(let r=0;r<=Z.ВЫСШИЙ;r++){const d=Z.РОДЫ[v];const id=Z.id(v,r,false);
  const p={id,n:Z.имя(v,r,false).toLowerCase(),из:[],срок:14+3*r,стаб:0.8,о:d.о,опыт:true,gen:true,р170:{вид:v,r},дать:q=>d.дать(r,Number(q)||1)};
  POTIONS.push(p);POTION_BY_ID[id]=p;POTION_SOUND[id]=d.звук;}
 for(const v in Z.ДВОЙНЫЕ)for(let r=2;r<=Z.ВЫСШИЙ;r++){const d=Z.ДВОЙНЫЕ[v];const id=Z.id(v,r,true);
  const p={id,n:Z.имя(v,r,true).toLowerCase(),из:[],срок:20+3*r,стаб:0.85,о:d.о,опыт:true,gen:true,двойное:true,р170:{вид:v,r,двойное:true},
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
/* ── оборудование алхимика: у травников и в мастерских, или смастерить ── */
safeFn(()=>{const T={
 alembic:{n:"Перегонный куб",где:"item",одна:true,цена:120,о:"Медный куб со змеевиком: перегонка — зелья с превосходного ранга.",звук:"arte_metal"},
 retort:{n:"Стеклянная реторта",где:"item",одна:true,цена:260,о:"Тонкое стекло для тонких составов: зелья с героического ранга.",звук:"arte_potion"},
 athanor:{n:"Атанор",где:"item",одна:true,цена:640,о:"Печь алхимика, что держит ровный жар сутками: зелья с мифического ранга.",звук:"craft_knock"}};
 for(const id in T){if(!TORG_TOOLS[id]){TORG_TOOLS[id]=T[id];TORG_TOOL_BY_NAME[T[id].n]=Object.assign({id},T[id]);}}
 safeFn(()=>Inventory.registerRule("tool",/^(Перегонный куб|Стеклянная реторта|Атанор)$/,true));
 const t0=Torg.toolsFor;Torg.toolsFor=function(n,д){const out=new Set(t0.apply(this,arguments));
  try{const вид=д&&д.вид?д.вид.id:null;const город=!!safeFn(()=>isCityAt(n.x,n.y),null);
   if(вид==="snadob"){out.add("alembic");if(город)out.add("retort");if(G.place&&["castle","citadel"].includes(G.place.stype))out.add("athanor");}}catch(_){}return [...out];};
 if(!CRAFT_RECIPES.some(r=>r.з170))[{n:"Перегонный куб",из:{"медный слиток":2,"кристалл":1}},{n:"Стеклянная реторта",из:{"кристалл":3,"медный слиток":1}},
  {n:"Атанор",из:{"камень":8,"стальной слиток":2,"кристалл":2}}].forEach(r=>CRAFT_RECIPES.push({n:r.n,из:r.из,торг:true,сколько:1,з170:true}));});
/* ── зелья одного рода не складываются; перебор за час — вполсилы ── */
safeFn(()=>{const Z=Зелья170;
 Z.ЧАСЫ={resist:2,strength:1.5,speed:2,sense:2,night:3,warm:3,cool:3,stealth:1.5,luck:1,breath:2,antidote:1};
 Z.ст=function(){const g=G.з170&&typeof G.з170==="object"?G.з170:(G.з170={действует:{},глотки:[]});if(!g.действует||typeof g.действует!=="object")g.действует={};if(!Array.isArray(g.глотки))g.глотки=[];return g;};
 Z.сейчас=function(){return ((Number(G.day)||1)-1)*24+(Number(G.hour)||0);};
 Z.роды=function(pt){return pt&&pt.р170?(pt.р170.двойное?this.ДВОЙНЫЕ[pt.р170.вид].из:[pt.р170.вид]):[];};
 const d0=drinkPotion;drinkPotion=matKeep(d0,function(i,user){
  try{const rec=potionsOf()[Number(i)];const pt=rec&&POTION_BY_ID[rec.id];
   if(pt&&pt.р170){const g=Z.ст();const now=Z.сейчас();const r=pt.р170.r;const роды=Z.роды(pt).filter(x=>Z.ЧАСЫ[x]);
    const мешает=роды.map(x=>({x,a:g.действует[x]})).filter(o=>o.a&&o.a.до>now&&o.a.r>=r);
    if(роды.length&&мешает.length===роды.length){const a=мешает[0].a;
     narrate(`${rec.имя||Z.cap(pt.n)}: ещё действует ${Z.имя(a.вид,a.r,!!a.двойное).toLowerCase()} — не слабее этого, а зелья одного рода не складываются. Склянка цела; прежнее кончится через ${Z.часы(a.до-now)}.`,user?{interrupt:true,user:true}:{interrupt:true});return false;}
    g.глотки=g.глотки.filter(t=>now-t<1);const перебор=g.глотки.length>=4;g.глотки.push(now);
    let q0=null;if(перебор){q0=rec.q;rec.q=(Number(rec.q)||1)*0.5;}
    const ok=d0.apply(this,arguments);
    if(ok){роды.forEach(x=>{g.действует[x]={r,вид:pt.р170.вид,двойное:!!pt.р170.двойное,до:now+Z.ЧАСЫ[x]*Z.С(r)};});
     if(перебор)setTimeout(()=>safeFn(()=>narrate("Пятое зелье за час: тело не принимает столько сразу — подействовало вполсилы.",{interrupt:false})),1200);}
    else if(q0!=null)rec.q=q0;
    return ok;}}catch(_){}
  return d0.apply(this,arguments);});});
/* ── сохранения: зелья прежней меры (семь рангов) — на одиннадцать ── */
Зелья170.перевести=function(){if(Number(G.з170v)>=2)return 0;const map=[0,1,2,3,5,7,10];let n=0;
 for(const rec of (Array.isArray(G.potions)?G.potions:[])){const m=/^r170_(d_)?([a-z]+)_(\d+)$/.exec(String(rec&&rec.id||""));if(!m)continue;const r=Number(m[3])-1;if(r<0||r>6)continue;
  rec.id=`r170_${m[1]||""}${m[2]}_${map[r]+1}`;delete rec.имя;n++;}
 G.з170v=2;if(n)safeFn(()=>journal(`Зелья рангов пересчитаны на одиннадцать ступеней: ${n}.`));return n;};
safeFn(()=>{const l0=loadGame;loadGame=matKeep(l0,function(){const r=l0.apply(this,arguments);safeFn(()=>Зелья170.перевести());return r;});});
safeFn(()=>{const g0=potionGive;potionGive=matKeep(g0,function(id){if(String(id||"").startsWith("r170_")&&!G.з170v)G.з170v=2;return g0.apply(this,arguments);});});

/* ════════════════════════════════════════════════════════════════════════
   17.0: РЕПУТАЦИЯ ПО СТУПЕНЯМ — ПЯТНАДЦАТЬ СТУПЕНЕЙ, ПОТОЛКИ, СЛАВА РЕМЕСЛА, ПАМЯТЬ ЖИТЕЛЕЙ
   Просьба игрока: «Расширенная система квестов репутационных, социальных…» и мастер-промпт «Грань миров»:
   многоуровневая репутация — у человека, у селения, у ремесла, у державы и её сословий; пятнадцать ступеней с
   потолками; защита от накрутки.
   Не заводит второго счёта: работает поверх кругов отношения (G.standing, STAND_SCOPES) и памяти жителей
   (npcRemember) — те же числа, та же стража у ворот, те же цены.
   1. Пятнадцать ступеней от «кровного врага» до «легенды»: имя ступени и что она даёт — в окне «Репутация».
   2. Потолки: работой по хозяйству отношение деревни поднимается не выше семидесяти («свой» — только делом:
      поручения, большие дела, защита); одна и та же мелкая помощь за день даёт всё меньше (каждая следующая —
      на четверть меньше прежней).
   3. Слава ремесла: у каждого ремесла своя (круг «в гильдии», имя — ремесло): за дела кузнецов растёт слава у
      кузнецов, за дела торговцев — у торговцев. Она меняет цену у людей этого ремесла (от наценки в четверть
      до скидки в пятую часть), а на «доверии» мастер один раз делится секретом — ступень мастерства.
   4. Память жителей: закрытое дело — житель помнит, что вы помогли; проваленный срок — что подвели. Это
      меняет его собственное отношение и то, что о вас говорят.
   5. Окно «Репутация» (в списке заданий): все круги, где вас знают, ступень, потолок, скидка и чем известны.
   ════════════════════════════════════════════════════════════════════════ */
const Слава170={
 СТУПЕНИ:[
  {от:-100,n:"кровный враг",о:"за вашу голову назначена цена"},
  {от:-85,n:"ненависть",о:"вас убьют, если решатся"},
  {от:-70,n:"вражда",о:"с вами не говорят и не торгуют"},
  {от:-55,n:"недоверие",о:"каждое ваше слово проверяют"},
  {от:-40,n:"неприязнь",о:"цены выше, двери закрыты"},
  {от:-25,n:"настороженность",о:"за вами присматривают"},
  {от:-10,n:"чужак",о:"вас здесь не знают"},
  {от:5,n:"знакомый",о:"с вами здороваются"},
  {от:18,n:"приятель",о:"вам рады"},
  {от:30,n:"симпатия",о:"уступают в мелочах"},
  {от:45,n:"уважение",о:"ваше слово здесь что-то значит"},
  {от:60,n:"доверие",о:"рассказывают то, что чужим не скажут"},
  {от:75,n:"свой",о:"зовут к столу и в совет"},
  {от:90,n:"почёт",о:"о вас поют за работой"},
  {от:100,n:"легенда",о:"о вас рассказывают тем, кто вас не видел"}],
 ступень(v){v=Number(v)||0;let i=0;for(let k=0;k<this.СТУПЕНИ.length;k++)if(v>=this.СТУПЕНИ[k].от)i=k;return Object.assign({номер:i+1},this.СТУПЕНИ[i]);},
 /* ── потолки и убывающая отдача ── */
 ПОТОЛОК_ХОЗЯЙСТВА:70,
 ст(){const g=G.слава170&&typeof G.слава170==="object"?G.слава170:(G.слава170={день:{},секреты:{}});if(!g.день||typeof g.день!=="object")g.день={};if(!g.секреты||typeof g.секреты!=="object")g.секреты={};return g;},
 /* сколько даст очередная мелкая помощь этому кругу сегодня: 1, 0.75, 0.56, … но не меньше единицы */
 отдача(ключ,n){const g=this.ст();const день=Number(G.day)||1;const r=g.день[ключ];const k=r&&r.д===день?Number(r.k)||0:0;
  g.день[ключ]={д:день,k:k+1};if(Object.keys(g.день).length>300){for(const kk in g.день)if(g.день[kk].д<день-2)delete g.день[kk];}
  return Math.max(1,Math.round(n*Math.pow(0.75,k)));},
 /* ── слава ремесла ── */
 ремёсла(){if(!this._рем){const s=new Set(Object.keys(this.СЕКРЕТЫ));safeFn(()=>Object.values(PROFS).forEach(a=>a.forEach(p=>s.add(p))));safeFn(()=>Object.values(CITY_TEACHERS).forEach(a=>a.forEach(p=>s.add(p))));this._рем=s;}return this._рем;},
 ремесло(prof){return safeFn(()=>standOf("guild",prof),0)||0;},
 множитель(prof){const v=this.ремесло(prof);
  return v>=90?0.8:v>=75?0.85:v>=60?0.88:v>=45?0.92:v>=30?0.95:v<=-70?1.25:v<=-40?1.12:v<=-25?1.05:1;},
 СЕКРЕТЫ:{"Кузнец":["smith","кузнечное дело"],"Мастер-кузнец":["smith","кузнечное дело"],"Целительница":["alchemy","травы и снадобья"],"Лекарь":["alchemy","травы и снадобья"],
  "Алхимик":["alchemy","перегонка и настои"],"Кожевенный мастер":["leather","выделка кож"],"Ювелир":["jewel","огранка"],"Мастер рун":["runes","руны"],"Трактирщик":["cook","стряпня"],
  "Повар":["cook","стряпня"],"Плотник":["wood","плотницкое дело"],"Магистр":["arte","чары и вещи"],"Маг-отшельник":["arte","чары и вещи"]},
 поднятьРемесло(prof,n){if(!prof||!n)return 0;const было=this.ремесло(prof);const стало=safeFn(()=>addStand("guild",prof,n,true),было);
  const w1=this.ступень(было),w2=this.ступень(стало);if(w1.номер!==w2.номер)safeFn(()=>narrate(`Слава у ремесла «${prof}»: теперь ${w2.n} — ${w2.о}.`,{interrupt:false}));
  /* на «доверии» мастер один раз делится секретом ремесла */
  if(было<60&&стало>=60){const с=this.СЕКРЕТЫ[prof];const g=this.ст();if(с&&!g.секреты[prof]){g.секреты[prof]=Number(G.day)||1;safeFn(()=>{const m=mastOf(с[0]);if(m.ур<5){if(!G.mast)G.mast={};G.mast[с[0]]={ур:m.ур+1,оп:m.оп,дел:m.дел};}});
   const t=`Мастера ремесла «${prof}» считают вас своим и делятся секретом: ${с[1]} — на ступень выше (теперь «${MAST_RANK[safeFn(()=>mastLevel(с[0]),1)]||"умелец"}»).`;
   safeFn(()=>{journal(t);narrate(t,{interrupt:false});Bank.play("throng_hail_m",{gain:0.5,maxSec:4});});}}
  return стало;},
 /* ── окно «Репутация» ── */
 ИМЕНА:{npc:"человек",city:"город",vill:"селение",guild:"ремесло и гильдии",army:"войско и стража",faith:"храм",fact:"держава",race:"народ",crime:"преступный мир",trade:"торговый люд",noble:"знать",house:"Дом"},
 строки(){const st=G.standing&&typeof G.standing==="object"?G.standing:{};const out=[];
  for(const k in st){const v=Math.max(-100,Math.min(100,Number(st[k])||0));if(!v)continue;const i=k.indexOf(":");const sc=k.slice(0,i),id=k.slice(i+1);if(sc==="npc")continue;
   const w=this.ступень(v);let имя=id||"вообще";if(sc==="guild"&&this.ремёсла().has(id))имя=`ремесло «${id}»`;
   let доп="";if(sc==="guild"&&this.ремёсла().has(id)){const m=this.множитель(id);if(m!==1)доп=m<1?` Цены у них для вас ниже на ${Math.round((1-m)*100)}%.`:` Цены у них для вас выше на ${Math.round((m-1)*100)}%.`;}
   if(sc==="vill"&&v>=this.ПОТОЛОК_ХОЗЯЙСТВА-5&&v<100)доп+=` Работой по хозяйству выше ${this.ПОТОЛОК_ХОЗЯЙСТВА} не подняться — дальше только делом.`;
   out.push({sc,id,v,t:`${this.ИМЕНА[sc]||sc}${id?` — ${имя}`:""}: ${w.n}, ступень ${w.номер} из 15 (${v}). ${this.cap(w.о)}.${доп}`});}
  out.sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));return out;},
 cap(t){t=String(t||"");return t?t[0].toUpperCase()+t.slice(1):t;},
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 окно(){const r=this.строки();const оси=(typeof STAND_AXES!=="undefined"?STAND_AXES:[]).map(a=>({n:a.n,v:safeFn(()=>axisOf(a.id),0)})).filter(a=>a.v>0);
  const ч=r.slice(0,40).map(x=>({l:x.t,run:()=>narrate(x.t,{interrupt:true})}));
  if(оси.length)ч.push({l:`Чем вы известны: ${оси.map(a=>`${a.n} ${a.v}`).join(", ")}.`,run:()=>{}});
  ч.push({l:"Закрыть",run:()=>{}});
  return выбор147("Репутация",r.length?`Вас знают в ${r.length} ${r.length===1?"круге":"кругах"}. Пятнадцать ступеней — от «кровного врага» до «легенды». Пункты — по убыванию силы.`:"Вас пока нигде не знают: ни селения, ни ремёсла, ни державы. Помогайте людям — и о вас заговорят.",ч);},
 кнопка(){const n=this.строки().length;return `<button class="item" data-cmd="rep170" data-speak="${this.q(`Репутация: где и как вас знают, ${n} ${n===1?"круг":"кругов"}.`)}">Репутация (${n})</button>`;}};
CMD.rep170=function(){return Слава170.окно();};
/* хозяйство: потолок и убывающая отдача — только для работы по хозяйству; поручения, дела и защита не ограничены */
safeFn(()=>{if(typeof Хозяйство170==="undefined")return;const s0=Хозяйство170.сделать;Хозяйство170.сделать=function(id){
  const з=this.здесь();const р=this.РАБОТЫ.find(x=>x.id===id);
  if(з&&р&&!this.почему(р,з.имя)){const v=this.отношение(з.имя);const пот=Слава170.ПОТОЛОК_ХОЗЯЙСТВА;
   if(v>=пот){narrate(`${р.n}: деревня «${з.имя}» и так считает вас своим человеком (${v} из ста). Работой по хозяйству выше ${пот} не подняться — дальше только делом: поручения жителей, большие дела, защита деревни.`,{interrupt:true});return false;}
   const p0=р.плюс;const плюс=Math.min(пот-v,Слава170.отдача(`хоз:${з.имя}`,p0));р.плюс=плюс;
   try{return s0.apply(this,arguments);}finally{р.плюс=p0;}}
  return s0.apply(this,arguments);};});
/* большие дела: слава ремесла заказчика и память жителя */
safeFn(()=>{if(typeof Цепи170==="undefined")return;const f0=Цепи170.финал;Цепи170.финал=function(c){const был=c&&c.done;const r=f0.apply(this,arguments);
  if(c&&!был&&c.done)safeFn(()=>{const кто=c.кто||{};const малое=!!c.малое;
   Слава170.поднятьРемесло(кто.prof,малое?4:8);
   const n=safeFn(()=>getNPCByKey(кто.key),null);if(n){safeFn(()=>npcRemember(n,"помог",c.n,5));safeFn(()=>addStand("npc",n.key,малое?6:12,true));}});
  return r;};
 const z0=Цепи170.закрыть;Цепи170.закрыть=function(c,p,слова){const r=z0.apply(this,arguments);
  if(p&&p.провален&&!p._помнят)safeFn(()=>{p._помнят=true;const n=getNPCByKey((c.кто||{}).key);if(n){npcRemember(n,"нарушил",p.текст,4);addStand("npc",n.key,-8,true);}});return r;};
 const v0=Цепи170.провалить;Цепи170.провалить=function(c,p){const r=v0.apply(this,arguments);
  if(r)safeFn(()=>{const n=getNPCByKey((c.кто||{}).key);if(n){npcRemember(n,"нарушил",c.n,5);addStand("npc",n.key,-10,true);}Слава170.поднятьРемесло((c.кто||{}).prof,-4);});return r;};});
/* цены у людей ремесла */
safeFn(()=>{const b0=buyModifier;buyModifier=matKeep(b0,function(npc){const r=b0.apply(this,arguments);if(!npc||!npc.prof)return r;const m=Слава170.множитель(npc.prof);return m===1?r:Math.max(0.5,r*m);});});
/* окно «Репутация» — в списке заданий; у жителя — что он помнит */
safeFn(()=>{const r0=renderQuests;renderQuests=matKeep(r0,function(){const r=r0.apply(this,arguments);
 safeFn(()=>{const el=document.getElementById("questList");if(!el||el.querySelector('[data-cmd="rep170"]'))return;el.insertAdjacentHTML("afterbegin",Слава170.кнопка());});return r;});});
safeFn(()=>{const o0=openNPC;openNPC=matKeep(o0,function(key){const r=o0.apply(this,arguments);
 safeFn(()=>{const n=getNPCByKey(key);const b=document.getElementById("npcBody");if(!n||!b||b.querySelector(".slava170"))return;
  const рем=Слава170.ремесло(n.prof);const лич=standOf("npc",n.key);if(!рем&&!лич)return;const ч=[];
  if(лич){const w=Слава170.ступень(лич);ч.push(`${n.name} к вам: ${w.n} (${лич})`);}
  if(рем){const w=Слава170.ступень(рем);const m=Слава170.множитель(n.prof);ч.push(`слава у ремесла «${n.prof}»: ${w.n}${m!==1?(m<1?`, скидка ${Math.round((1-m)*100)}%`:`, наценка ${Math.round((m-1)*100)}%`):""}`);}
  const t=ч.join("; ")+".";b.insertAdjacentHTML("afterbegin",`<div class="list-line slava170" tabindex="0" data-speak="${Слава170.q(t)}">${Слава170.q(Слава170.cap(t))}</div>`);});return r;});});

/* ════════════════════════════════════════════════════════════════════════
   17.0: ЛАВКИ — ИНСТРУМЕНТ ДОБРОТНОЙ И МАСТЕРСКОЙ РАБОТЫ, ЗАПАС НА ДЕНЬ, ЦЕНА ОТ СПРОСА, ТОРГОВЦЫ-ЗНАТОКИ
   Просьба игрока: «Добавь торговцам различные товары, типа грабли, мотыги и прочее, прочее». Мастер-промпт: варианты
   инструмента, расходники, материалы, особые торговцы с ограниченным запасом и живой ценой.
   1. Инструмент трёх ступеней: простой, добротной работы и мастерской работы — мотыга, грабли, вилы, коса, лопата,
      плотницкий молоток, пила, топор лесоруба, серп травника, свежевальный нож, ведро, корзина. Добротный — у
      скобяного ряда и кузнецов, мастерский — в городах; оба можно смастерить. Лучший инструмент заменяет простой
      везде, где тот нужен: в работе по хозяйству — больше отношения (+2 и +4) и быстрее (на четверть и вдвое), на
      сборе — лишняя горсть сверх обычной.
   2. Запас лавки на день: у каждого торговца каждого сырья — свой запас (от шести до двадцати трёх); выкупили —
      «приходите завтра». Цена растёт, пока скупаете: каждая купленная сегодня штука — на четыре сотых дороже, не
      больше чем в полтора раза с лишком; назавтра всё по-старому. Остаток слышен в окне торговли.
   3. Торговцы-знатоки в городах: рудознатец (руды, слитки, минералы, самоцветы), меховщик (мех и шкуры всех
      ступеней), аптекарь (основы зелий и оборудование). Кто он — сказано в окне жителя.
   ════════════════════════════════════════════════════════════════════════ */
const Лавка170={
 ОРУДИЯ:["Мотыга","Грабли","Вилы","Коса","Лопата","Плотницкий молоток","Пила","Топор лесоруба","Серп травника","Свежевальный нож","Ведро","Корзина"],
 СТУП:["","добротной работы","мастерской работы"],
 имя(база,ст){return ст?`${база} (${this.СТУП[ст]})`:база;},
 /* лучшая ступень этого инструмента у героя: −1 — нет вовсе */
 ступень(база){const it=G.items||[];if(it.includes(this.имя(база,2)))return 2;if(it.includes(this.имя(база,1)))return 1;
  return (it.includes(база)||!!safeFn(()=>this._has0(база),false))?0:-1;},
 лучшая(список){return Math.max(0,...(список||[]).map(x=>this.ОРУДИЯ.includes(x)?this.ступень(x):0));},
 h(a,b){return Цепи170.h(a,b);},
 сейчас(){return Number(G.day)||1;},
 ст(){const g=G.лавка170&&typeof G.лавка170==="object"?G.лавка170:(G.лавка170={д:0,к:{}});if(g.д!==this.сейчас()){g.д=this.сейчас();g.к={};}return g;},
 лимит(n,имя){return 6+Math.floor(this.h(String(n.key),"лимит|"+имя)*18);},
 куплено(n,имя){return Number(this.ст().к[`${n.key}|${имя}`])||0;},
 множ(n,имя){return Math.min(1.6,1+0.04*this.куплено(n,имя));},
 /* торговцы-знатоки: в городах */
 ЗНАТОКИ:{
  рудознатец:{n:"рудознатец",о:"руды, слитки, минералы и самоцветы",товар:["медная руда","оловянная руда","серебряная руда","золотая руда","кобальтовая руда","мифриловая руда","медный слиток","бронзовый слиток","стальной слиток","серебряный слиток","кварц","графит","слюда","агат","аметист","гранат","топаз"]},
  меховщик:{n:"меховщик",о:"мех и шкуры всех ступеней",товар:["волчья шкура","медвежья шкура","оленья шкура","лисий мех","куний мех","соболий мех","горностаевый мех","бобровый мех","солёная шкура","дублёная кожа","выделанная кожа","замша","очищенный мех","выделанный мех","крашеный мех","стриженый мех"]},
  аптекарь:{n:"аптекарь",о:"основы зелий и оборудование алхимика",товар:["травяная вытяжка","отстоянная кровь","кровяная соль","серебряная пыль","золотая пыль","пустая склянка","квасцы","змеиная кровь","звериная кровь","кристалл","грибы","трава"]}},
 знаток(n){try{if(!n||G.dark||n.prof!=="Торговец"||!safeFn(()=>isCityAt(n.x,n.y),null))return null;const v=this.h(String(n.key),"знаток");
  return v<0.18?"рудознатец":v<0.36?"меховщик":v<0.5?"аптекарь":null;}catch(_){return null;}},
 /* прилавок: товар знатока, затем живая цена и остаток */
 прилавок(n,out){try{if(!n||!Array.isArray(out))return out;const з=this.знаток(n);
   if(з){const есть=r=>out.some(o=>o.n===r);this.ЗНАТОКИ[з].товар.forEach((r,i)=>{if(!(r in RES_BASE)||есть(r))return;if(this.h(String(n.key),з+i)<0.72)
     out.push({n:r,res:true,full:true,знаток:з,price:Math.max(1,Math.round(safeFn(()=>npcAsk(n,r),RES_BASE[r]||5)))});});}
   for(const row of out){if(!row||!row.res)continue;const k=this.множ(n,row.n);if(k>1)row.price=Math.max(1,Math.round(row.price*k));row.остаток=Math.max(0,this.лимит(n,row.n)-this.куплено(n,row.n));}
   return out;}catch(_){return out;}},
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");}};
/* ── инструмент ступеней: товары, проверка «есть ли», крафт ── */
safeFn(()=>{const L=Лавка170;
 for(const база of L.ОРУДИЯ){const t0=TORG_TOOL_BY_NAME[база];if(!t0)continue;
  [1,2].forEach(ст=>{const id=`${t0.id}_t${ст}`;if(TORG_TOOLS[id])return;const n=L.имя(база,ст);
   const T={n,где:"item",одна:true,цена:Math.round((t0.цена||10)*(ст===1?3:8)),о:`${t0.о} ${ст===1?"Добротной работы: работа идёт на четверть быстрее и даёт больше.":"Мастерской работы: работа идёт вдвое быстрее и даёт ещё больше."}`,звук:t0.звук,ступень170:ст,база170:база};
   TORG_TOOLS[id]=T;TORG_TOOL_BY_NAME[n]=Object.assign({id},T);});}
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 safeFn(()=>Inventory.registerRule("tool",new RegExp("^("+L.ОРУДИЯ.map(esc).join("|")+") \\((добротной|мастерской) работы\\)$"),true));
 /* лучший инструмент заменяет простой везде, где тот нужен */
 L._has0=Torg.has.bind(Torg);const h0=Torg.has;Torg.has=function(name){if(h0.apply(this,arguments))return true;
  return L.ОРУДИЯ.includes(name)&&((G.items||[]).includes(L.имя(name,1))||(G.items||[]).includes(L.имя(name,2)));};
 L._has0=h0.bind(Torg);
 if(!CRAFT_RECIPES.some(r=>r.л170))for(const база of L.ОРУДИЯ){if(!TORG_TOOL_BY_NAME[база])continue;
  CRAFT_RECIPES.push({n:L.имя(база,1),из:{"стальной слиток":1,"дерево":1},торг:true,сколько:1,л170:true});
  CRAFT_RECIPES.push({n:L.имя(база,2),из:{"булатный слиток":1,"тиснёная кожа":1},торг:true,сколько:1,л170:true});}});
/* кто продаёт ступени: скобяной ряд и кузнецы — добротный, в городах — и мастерский */
safeFn(()=>{const L=Лавка170;const t0=Torg.toolsFor;Torg.toolsFor=function(n,д){const out=new Set(t0.apply(this,arguments));
 try{const вид=д&&д.вид?д.вид.id:null;const город=!!safeFn(()=>isCityAt(n.x,n.y),null);
  for(const id of [...out]){const T=TORG_TOOLS[id];if(!T||T.ступень170||!L.ОРУДИЯ.includes(T.n))continue;
   if((вид==="instr"||n.prof==="Кузнец")&&TORG_TOOLS[id+"_t1"])out.add(id+"_t1");
   if(город&&(вид==="instr"||n.prof==="Кузнец")&&L.h(String(n.key||n.x),"t2|"+id)<0.5&&TORG_TOOLS[id+"_t2"])out.add(id+"_t2");}}catch(_){}
 return [...out];};});
/* сбор: лучший инструмент — ещё горсть */
safeFn(()=>{const L=Лавка170;const g0=ToolKit.gather;ToolKit.gather=function(res){const r=g0.apply(this,arguments);if(!r)return r;
 const база=String(res)==="дерево"?"Топор лесоруба":["трава","ягоды","грибы"].includes(String(res))?"Серп травника":null;if(!база)return r;
 const ст=L.ступень(база);if(ст<=0)return r;return {n:(r.n||1)+ст,t:`${r.t||""} ${L.имя(база,ст)}: ещё ${ст===1?"горсть":"две горсти"}.`};};});
/* хозяйство: лучший инструмент — больше отношения и быстрее */
safeFn(()=>{if(typeof Хозяйство170==="undefined")return;const L=Лавка170;const s0=Хозяйство170.сделать;Хозяйство170.сделать=function(id){
 const р=this.РАБОТЫ.find(x=>x.id===id);const ст=р?L.лучшая(р.инстр):0;if(!р||ст<=0)return s0.apply(this,arguments);
 const p0=р.плюс,h0=р.часов,o0=р.о;р.плюс=p0+2*ст;р.часов=Math.max(0.5,h0*(1-0.25*ст));р.о=`${o0} Инструмент ${L.СТУП[ст]} — дело спорится.`;
 try{return s0.apply(this,arguments);}finally{р.плюс=p0;р.часов=h0;р.о=o0;}};});
/* лавка: товар знатока, живая цена, остаток; выкупили — до завтра */
safeFn(()=>{const s0=stockFor;stockFor=matKeep(s0,function(n){const out=s0.apply(this,arguments);return Лавка170.прилавок(n,out);});});
safeFn(()=>{const L=Лавка170;const b0=buyItem;buyItem=matKeep(b0,function(key,i){
 try{const n=getNPCByKey(key);const st=n?stockFor(n):[];const it=st[+i];
  if(n&&it&&it.res){if(it.остаток<=0){narrate(`У ${n.name} больше нет «${it.n}»: весь запас на сегодня выкуплен. Приходите завтра — подвезут.`,{interrupt:true});return;}
   const g0=Number(G.gold)||0;const r=b0.apply(this,arguments);if((Number(G.gold)||0)<g0){const g=L.ст();const k=`${n.key}|${it.n}`;g.к[k]=(Number(g.к[k])||0)+1;}return r;}}catch(_){}
 return b0.apply(this,arguments);});});
/* покупка счётом (5, 10, всё) идёт мимо покупки по одной: здесь — тот же запас и тот же счёт */
safeFn(()=>{const L=Лавка170;const y0=shopYes;shopYes=matKeep(y0,function(){
 try{const n=shopNpc();const c=SHOP.confirm;if(n&&c&&c.tab==="buy"&&SHOP.sel&&c.count>1){const r=shopStockRows(n)[SHOP.sel.idx];const st=r&&r.s;
   if(st&&st.res&&st.остаток!=null){if(st.остаток<=0){SHOP.confirm=null;narrate(`У ${n.name} больше нет «${st.n}»: весь запас на сегодня выкуплен. Приходите завтра — подвезут.`,{interrupt:true});safeFn(()=>renderShop());return false;}
    if(c.count>st.остаток){narrate(`У ${n.name} осталось только ${st.остаток} — столько и продаст.`,{interrupt:false});c.count=st.остаток;}
    const g0=Number(G.gold)||0,k=c.count;const ret=y0.apply(this,arguments);if((Number(G.gold)||0)<g0){const g=L.ст();const кл=`${n.key}|${st.n}`;g.к[кл]=(Number(g.к[кл])||0)+k;}return ret;}}}catch(_){}
 return y0.apply(this,arguments);});});
/* окно торговли: «осталось на сегодня N» в строке и карточке товара; счёт — не больше остатка */
safeFn(()=>{const r0=shopStockRows;shopStockRows=matKeep(r0,function(n){const rows=r0.apply(this,arguments);
 try{for(const r of rows){const st=r&&r.s;if(!st||!st.res||st.остаток==null)continue;r.доступно=st.остаток>0?`осталось на сегодня ${st.остаток}`:"весь запас на сегодня выкуплен — приходите завтра";}}catch(_){}return rows;});});
safeFn(()=>{if(typeof ShopCount==="undefined")return;const m0=ShopCount.maxOf;ShopCount.maxOf=function(tab,r){const m=m0.apply(this,arguments);
 try{if(tab==="buy"&&r&&r.s&&r.s.res&&r.s.остаток!=null)return Math.max(1,Math.min(m,r.s.остаток));}catch(_){}return m;};});
/* окно жителя: кто этот торговец */
safeFn(()=>{const L=Лавка170;const o0=openNPC;openNPC=matKeep(o0,function(key){const r=o0.apply(this,arguments);
 safeFn(()=>{const n=getNPCByKey(key);const з=L.знаток(n);const b=document.getElementById("npcBody");if(!з||!b||b.querySelector(".lavka170"))return;const z=L.ЗНАТОКИ[з];
  const t=`${n.name} — ${z.n}: ${z.о}. Запас на день у него свой, а цена растёт, когда скупаете много.`;
  b.insertAdjacentHTML("afterbegin",`<div class="list-line lavka170" tabindex="0" data-speak="${L.q(t)}">${L.q(t)}</div>`);});return r;});});

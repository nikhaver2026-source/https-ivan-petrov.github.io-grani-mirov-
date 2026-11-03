/* ════════════════════════════════════════════════════════════════════════
   ПОЛНАЯ ПРОВЕРКА ИГРЫ (3 ноября 2026, после Альфы 1.0)
   Просьба игрока: «проверь всю игру по пунктам… если будешь замечать ошибки,
   сразу исправляй их»; «включи в проверке, чтобы нельзя было искусственно
   накручивать золото… чтобы в игре не было каких-либо читерств. Вообще».
   1. Купить и тут же продать дороже нельзя. Торговцы военных станов скупали
      припас по военной цене (хлеб, свечи, квас, простые зелья), а продавали
      его по обычной: хлеб брали за 4, принимали за 6 — круг «купил — продал»
      давал золото без конца. Теперь цена, по которой торговец (и его соседи
      по тому же месту) принимает вещь, всегда ниже цены, по которой здесь же
      эту вещь продают: не больше четырёх пятых её. Торговля между далёкими
      местами — честная выгода купца — остаётся.
   ════════════════════════════════════════════════════════════════════════ */

/* ── 1. Купить и тут же продать дороже нельзя ── */
const Скупка={кэш:new Map(),внутри:false,
 /* наименьшая цена каждой вещи на прилавках этого места — та, что игрок платит (со скидками и инструментом
    лавки): имя → цена. Скидка торговца меняется от сделки к сделке. */
 цены(n){
  const k=[n.x|0,n.y|0,(G.place&&Number(G.place.depth))|0,Number(G.day)|0,Number(G.hour)|0].join(",");
  /* запомнено только на один такт: внутри одной отрисовки лавки цены считаются раз, к следующему действию — заново */
  if(!this._сброс){this._сброс=true;setTimeout(()=>{this.кэш.clear();this._сброс=false;},0);}
  const был=this.кэш.get(k);if(был)return был.m;const m=new Map();
  this.внутри=true;
  try{const все=[n];
   safeFn(()=>{const c=cellContent(n.x,n.y);(npcsFor(c)||[]).forEach(x=>{if(x&&x.trade&&x.key!==n.key)все.push(x);});});
   const взять=(k,p)=>{const было=m.get(k);if(было==null||p<было)m.set(k,p);};
   for(const t of все){(safeFn(()=>shopStockRows(t),[])||[]).forEach(r=>{const имя=r&&r.name;const p=Number(r&&r.price);
    if(!имя||!(p>0))return;взять(String(имя).toLowerCase(),p);
    /* зелье в суме зовётся иначе, чем на прилавке: сверяем и по его роду */
    const з=r.s&&r.s.зелье;if(з)взять("зелье:"+з,p);if(r.name==="Зелье здоровья")взять("зелье:heal",p);});}}
  finally{this.внутри=false;}
  this.кэш.set(k,{t:Date.now(),m});return m;},
 /* цена скупки не выше четырёх пятых цены продажи здесь же (и не меньше одной монеты) */
 предел(n,имя,v){
  if(this.внутри||!n||!имя||!(Number(v)>0))return v;
  const м=safeFn(()=>this.цены(n),null);if(!м)return v;
  const p=typeof имя==="object"?(м.get("зелье:"+имя.id)??null):(м.get(String(имя).toLowerCase())??null);if(p==null)return v;
  const cap=Math.max(1,Math.floor(p*0.8));return v>cap?cap:v;}};
safeFn(()=>{const su0=sellUnit;sellUnit=matKeep(su0,function(n,res){return Скупка.предел(n,res,su0.apply(this,arguments));});});
safeFn(()=>{const sp0=sellPriceOf;sellPriceOf=matKeep(sp0,function(n,row){let v=Скупка.предел(n,row&&row.name,sp0.apply(this,arguments));
 if(row&&row.kind==="potion"&&row.it&&row.it.id)v=Скупка.предел(n,{id:row.it.id},v);return v;});});

/* ── 2. Отмена касания, которую браузер уже не принимает ──
   Игра отменяет касание (preventDefault), чтобы жест не прокручивал страницу. Когда браузер уже начал прокрутку,
   отменить касание нельзя: Chrome (и WebView Android) пишет в журнал «Ignored attempt to cancel a touch event with
   cancelable=false» на каждое такое касание. Сама отмена здесь ничего не делает, поэтому и не просим её. */
safeFn(()=>{if(typeof TouchEvent==="undefined"||TouchEvent.prototype.__отмена)return;const pd=TouchEvent.prototype.preventDefault;
 TouchEvent.prototype.preventDefault=function(){if(this.cancelable===false)return;return pd.call(this);};TouchEvent.prototype.__отмена=true;});

/* ── 3. Полоса боя без боя ──
   Загрузка сохранения посреди боя гасит бой (G.inCombat), но полоса боя оставалась на экране с прежней надписью
   («Поле боя: Лихой человек, вплотную») и перехватывала касание по полю: двойное касание читало давний бой, а не
   действие здесь. Теперь, когда боя нет, полоса прячется при каждом обновлении экрана. */
safeFn(()=>{const r0=refresh;refresh=matKeep(r0,function(){const r=r0.apply(this,arguments);
 try{if(!G.inCombat){const bar=document.getElementById("combatBar");if(bar&&!bar.hidden){bar.hidden=true;const log=document.getElementById("cbLog");if(log)log.textContent="";}}}catch(_){}
 return r;});});

/* ════════════════════════════════════════════════════════════════════
   РЕЖИССЁР С ПРОВЕРКОЙ (14.5, ФАЗА IX «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Режиссёр Грани придумывает новое сам: зелья, припасы, вещи, чары,
   земли, народы, тварей, места, богов, породы, оружие, книги, союзы.
   Теперь каждое определение проходит проверку, прежде чем остаться в
   мире: допустимые поля и значения, ссылки на существующее (ниши трав,
   школа, форма, ядро и стихия чар и их совместимость, база твари, земля,
   народ, координаты в пределах мира), уникальное имя. Негодное
   отзывается — и из мира, и из таблиц, куда успело встать, — с записью в
   хронике Режиссёра. И ОГРАНИЧЕНИЯ СИМУЛЯЦИИ: у каждого рода свой предел
   в мире и общий предел нового в день; дойдя до него, Режиссёр ждёт.
   При загрузке сохранения проверяется всё придуманное прежде.
   В сохранении — G.dchk: счёт проверенного, отказы (до сорока), счёт
   дня.
   ════════════════════════════════════════════════════════════════════ */
const DCHK_LIMIT={potions:40,res:40,arts:40,spells:40,lands:40,peoples:30,beasts:60,quests:20,devices:30,masters:40,places:40,gods:12,pets:30,weapons:40,books:40,rel:30};
const DCHK_DAY=6;
/* род новинки → где она живёт в мире Режиссёра */
const DCHK_ARM={potion:"potions",resource:"res",artifact:"arts",spell:"spells",land:"lands",sky:"lands",deep:"lands",people:"peoples",race:"peoples",clan:"peoples",faction:"peoples",branch:"peoples",
 beast:"beasts",quest:"quests",saga:"quests",device:"devices",master:"masters",town:"places",village:"places",water:"places",god:"gods",pet:"pets",mount:"pets",weapon:"weapons",book:"books",politics:"rel"};
const DCHK_EFF=["hp","mana","rest","buff"];
const DirCheck={
 st(){if(!G.dchk||typeof G.dchk!=="object")G.dchk={};const s=G.dchk;if(!Array.isArray(s.отказ))s.отказ=[];if(!Number.isFinite(Number(s.ок)))s.ок=0;if(!Number.isFinite(Number(s.пред)))s.пред=0;return s;},
 inWorld(x,y){return Number.isFinite(Number(x))&&Number.isFinite(Number(y))&&x>=0&&y>=0&&x<WORLD_MAX&&y<WORLD_MAX;},
 nm(t){return typeof t==="string"&&t.trim().length>=2;},
 resKnown(k,g){return RES_BASE[k]>0||k==="кожа"||!!safeFn(()=>RES_KIND_BY_RES[k],null)||!!safeFn(()=>MIX_NATURE[k],null)||((g||Neuro.gen()).res||[]).some(z=>z.n===k);},
 /* ── ПРОВЕРКА ОДНОГО ОПРЕДЕЛЕНИЯ ── пустая строка — годно, иначе — почему нет */
 why(k,r,g){g=g||Neuro.gen();const id=x=>new Set((g[x]||[]).map(z=>z.id));
  if(!r||typeof r!=="object")return "не запись";if(k!=="rel"&&k!=="books"&&k!=="quests"&&!this.nm(r.n||r.name))return "без имени";
  const dup=(arr,key)=>(g[arr]||[]).filter(z=>z!==r&&(z[key]||"")===(r[key]||"")).length>0;
  switch(k){
   case "potions":{if(!Array.isArray(r.из)||r.из.length!==2||r.из[0]===r.из[1]||r.из.some(c=>!PLANT_CAT_BY_ID[c]))return "ниши трав не те";
    if(!(Array.isArray(r.родители)&&r.родители.length&&r.родители.every(p=>POTION_BY_ID[p]))&&!(Array.isArray(r.эф)&&r.эф.length&&r.эф.every(e=>DCHK_EFF.includes(e[0])&&(e[0]!=="buff"||(typeof e[1]==="string"&&Number(e[2])>0))&&(e[0]==="buff"||Number(e[1])>0))))return "действие не из тех, что знает варка";
    if(!(Number(r.срок)>0)||!(r.стаб>0&&r.стаб<1))return "срок или устойчивость вне пределов";if(POTIONS.some(p=>p.id!==r.id&&p.n===r.n))return "имя уже занято";return "";}
   case "res":{if(!(Number(r.цена)>0&&Number(r.цена)<1000))return "цена вне пределов";if(r.земля&&!id("lands").has(r.земля))return "земля не существует";if(dup("res","n"))return "имя уже занято";return "";}
   /* из чего делать — из того, что знает мир: припасы, все роды ресурсов и природы опытов (зеркальный осколок
      тёмных земель тоже), кожа (её дубят из шкур) и собственные припасы Режиссёра */
   case "arts":{if(!(Number(r.цена)>0))return "без цены";if(!r.нужно||typeof r.нужно!=="object"||!Object.keys(r.нужно).length||Object.entries(r.нужно).some(([k2,v])=>!(Number(v)>0)||!this.resKnown(k2,g)))return "из чего делать — неизвестно";if(dup("arts","n"))return "имя уже занято";return "";}
   case "spells":{const q=r.rec;if(!q)return "без чар";if(!MSCHOOL_BY_ID[q.school]||!FORM_BY_ID[q.форма]||(q.ядро&&!CORE_BY_ID[q.ядро])||(q.стихия&&!ELEM_BY_ID[q.стихия]))return "школа, форма, ядро или стихия не существуют";
    const w=safeFn(()=>spellIncompat(q.school,q.форма,q.усиление||"none",q.ядро,q.стихия),"");if(w)return "чары не складываются: "+w;if(dup("spells","n"))return "имя уже занято";return "";}
   case "lands":{if(!this.inWorld(r.x,r.y))return "за пределами мира";if(!(Number(r.r)>0))return "без размера";if(!(Number(r.опасность)>=0&&Number(r.опасность)<=5))return "опасность вне пределов";if(dup("lands","n"))return "имя уже занято";return "";}
   case "peoples":{if(r.земля&&!id("lands").has(r.земля))return "земля не существует";if(dup("peoples","n"))return "имя уже занято";return "";}
   case "beasts":{if(!MONSTERS.some(m=>m.id===r.base))return "такой твари нет в бестиарии";if(r.земля&&!id("lands").has(r.земля))return "земля не существует";if(!(Number(r.k)>=0.5&&Number(r.k)<=3))return "сила вне пределов";return "";}
   /* у поручения n — сколько сделать, а суть — в т */
   case "quests":{if(!this.nm(r.т))return "поручение без сути";if(r.p&&!id("peoples").has(r.p))return "заказчика нет";if(r.земля&&!id("lands").has(r.земля))return "земля не существует";if(!(Number(r.награда)>0))return "без награды";return "";}
   case "devices":{if(!(Number(r.заряды)>0)||!(Number(r.цена)>0))return "без зарядов или цены";if(!Array.isArray(r.эф)||!r.эф.every(e=>DCHK_EFF.includes(e[0])))return "действие не из тех, что знает мир";return "";}
   case "masters":return Number(r.умение)>0?"":"без умения";
   case "places":{if(!this.inWorld(r.x,r.y))return "за пределами мира";if(r.народ&&!id("peoples").has(r.народ))return "народа нет";if(dup("places","n"))return "имя уже занято";return "";}
   case "gods":{if(r.культ&&!id("peoples").has(r.культ))return "народа-культа нет";if(dup("gods","n"))return "имя уже занято";return "";}
   case "pets":return Number(r.цена)>0?"":"без цены";
   case "weapons":return Number(r.val)>0&&Number(r.val)<200?"":"удар вне пределов";
   case "books":return this.nm(r.n)&&typeof r.t==="string"&&r.t.length>5?"":"книга пуста";
   case "rel":return this.nm(r.a)&&this.nm(r.b)&&r.a!==r.b&&this.nm(r.kind)?"":"союз без сторон";}
  return "";},
 /* отозвать: из мира Режиссёра и из таблиц, куда встало */
 revoke(k,r,why){const g=Neuro.gen();g[k]=(g[k]||[]).filter(z=>z!==r);
  if(k==="potions"){const i=POTIONS.findIndex(p=>p.id===r.id);if(i>=0)POTIONS.splice(i,1);delete POTION_BY_ID[r.id];}
  if(k==="spells"&&r.rec){const i=SPELLS.findIndex(s=>s.n===r.n||s.id===r.id);if(i>=0)SPELLS.splice(i,1);}
  const s=this.st();const имя=this.title(k,r);s.отказ.push({д:Number(G.day)||1,род:k,n:имя,why});if(s.отказ.length>40)s.отказ.shift();
  safeFn(()=>Neuro.chron(`Режиссёр отозвал «${имя}»: ${why}`));},
 title(k,r){return String((k==="quests"?r.т:(r.n||r.name))||r.id||"?");},
 /* проверить всё придуманное: при загрузке и в такт дня */
 audit(){const g=Neuro.gen();let отозвано=0;for(let pass=0;pass<3;pass++){let n=0;
   for(const k of Object.keys(DCHK_LIMIT))for(const r of (g[k]||[]).slice()){const w=this.why(k,r,g);if(w){this.revoke(k,r,w);n++;}}
   отозвано+=n;if(!n)break;}return отозвано;},
 /* пределы: род и день */
 limit(arm){const k=DCHK_ARM[arm];const g=Neuro.gen(),s=this.st(),d=Number(G.day)||1;if(s.день!==d){s.день=d;s.сегодня=0;}
  if(!this.офлайн&&(Number(s.сегодня)||0)>=DCHK_DAY)return "за день Режиссёр придумал довольно";if(k&&(g[k]||[]).length>=DCHK_LIMIT[k])return `в мире уже довольно: ${k}`;return "";},
 /* ── ОКНО ── в окне Режиссёра */
 text(){const s=this.st(),g=Neuro.gen();const полн=Object.entries(DCHK_LIMIT).map(([k,v])=>`${k} ${(g[k]||[]).length}/${v}`).join(", ");
  const о=s.отказ.slice(-5).map(x=>`«${x.n}» — ${x.why}`).join("; ");
  return `Проверка Режиссёра: принято ${s.ок}, отозвано ${s.отказ.length}${о?` (последние: ${о})`:""}; упёрлось в пределы — ${s.пред} раз. Пределы мира: ${полн}; нового в день — не больше ${DCHK_DAY}.`;}};
/* ── ВСТРАИВАНИЕ ── */
{const fg11=Neuro.forge.bind(Neuro);Neuro.forge=matKeep(fg11,function(arm){const s=DirCheck.st();const w=DirCheck.limit(arm);
 if(w){s.пред=(Number(s.пред)||0)+1;return "";}const g=Neuro.gen();const до={};for(const k of Object.keys(DCHK_LIMIT))до[k]=(g[k]||[]).length;
 const t=fg11(arm);s.сегодня=(Number(s.сегодня)||0)+1;let плохо=0;
 for(const k of Object.keys(DCHK_LIMIT)){const arr=g[k]||[];for(const r of arr.slice(до[k]||0)){
  /* новинка тянет за собой и другие роды (земля — свой припас, зелье — своего мастера): предел держит каждый род */
  const why=(g[k]||[]).length>DCHK_LIMIT[k]?"в мире уже довольно":DirCheck.why(k,r,g);if(why){DirCheck.revoke(k,r,why);плохо++;if(why==="в мире уже довольно")s.пред=(Number(s.пред)||0)+1;}else s.ок=(Number(s.ок)||0)+1;}}
 return плохо?"":t;});}
/* «Мир живёт без вас»: дни отсутствия (до десяти) Режиссёр проживает разом — у каждого из них свой дневной предел,
   поэтому догоняющий счёт идёт мимо предела дня; пределы родов держатся и здесь. */
{const of11=Neuro.offline.bind(Neuro);Neuro.offline=matKeep(of11,function(){DirCheck.офлайн=true;try{return of11.apply(this,arguments);}finally{DirCheck.офлайн=false;}});}
/* Зелье встаёт в таблицу варки только проверенным. */
{const rp11=Neuro.regPotion.bind(Neuro);Neuro.regPotion=matKeep(rp11,function(rec){if(DirCheck.why("potions",rec))return;return rp11(rec);});}
/* При загрузке — проверить всё придуманное прежде. */
{const rh11=Neuro.rehydrate.bind(Neuro);Neuro.rehydrate=matKeep(rh11,function(){safeFn(()=>DirCheck.audit());return rh11.apply(this,arguments);});}
{const wd11=Director.worldDay;Director.worldDay=matKeep(wd11,function(){const r=wd11.apply(this,arguments);safeFn(()=>DirCheck.audit());return r;});}
/* Окно Режиссёра: что проверено, что отозвано, где пределы — строкой в его окне «Кузница нового». */
{const vw11=Neuro.view.bind(Neuro);Neuro.view=matKeep(vw11,function(){const D=Director,sh=D.show;
 D.show=function(title,h){return sh.call(D,title,String(h||"")+safeFn(()=>D.line(DirCheck.text()),""));};try{return vw11.apply(this,arguments);}finally{D.show=sh;}});}
/* Поражение — не дальний путь. Поручение «Дальний путь» считает клетки от места, где оно взято; павшего героя
   несут к стенам столицы, и перенос засчитывался шагами — поражение платило наградой. Начало пути сдвигается
   вместе с героем — на столько, на сколько его перенесли (у камня возврата — ни на сколько). */
{const df11=defeat;defeat=matKeep(df11,function(){const x0=G.x,y0=G.y;const qs=(safeFn(()=>Director.st2().q,[])||[]).filter(q=>q&&q.type==="travel");
 const cap=safeFn(()=>empireAt(x0,y0).cap,null);const dx=cap?cap.x-x0:0,dy=cap?cap.y-y0:0;const было=qs.map(q=>[q.x,q.y]);qs.forEach(q=>{q.x+=dx;q.y+=dy;});
 try{return df11.apply(this,arguments);}finally{qs.forEach((q,i)=>{q.x=было[i][0]+(G.x-x0);q.y=было[i][1]+(G.y-y0);});}});}

/* ════════════════════════════════════════════════════════════════════════
   ТОРГ: ПОЛЗУНОК СЧЁТА ВЕЗДЕ, ИНСТРУМЕНТЫ И ЕДА СВОЕГО КРАЯ, ОДНА ФЛЯГА
   (после 16.0, просьбы игрока)

   «В обозах не работает выбор количества ползунками: там те же пункты —
   купить один, пять, десять и все. Во всех местах, где можно купить товар,
   должны быть ползунки». «Расширь список товаров у обозников и у всех
   торговцев; каждому месту и торговцу — свои товары; чтобы можно было купить
   удочку, сеть и так далее; посмотри всю игру — и чтобы нужное можно было
   смастерить самому». «Флягу можно купить только одну».

   1. Ползунок счёта (CountRow) — одна строка на товар: свайп вверх или вниз
      (в Windows — стрелки вверх и вниз) меняет, сколько взять, двойное
      касание (Enter) — сделка. Так у торговца было с 14.6; теперь так же у
      обоза (товары, зелья, скупка), в карточке товара, на торге поселений
      Глуби, в Кузнице нового и в мастерской Гильдии Тихой Меры.
   2. Инструменты, которых игра ждёт, продаются: удочка и рыболовная сеть,
      верёвка, факел, свеча, щуп ловчего, отмычки, кирка — и новые: топор
      лесоруба, серп травника, точильный камень, ремонтный набор. Кто чем
      торгует, решает ремесло и место: скобяной ряд держит инструмент,
      лавочник — дорожное, тихий торг — отмычки, рыбацкая деревня и порт —
      снасти. Купленное ложится туда, где игра его ищет (прежде верёвка,
      факел и щуп с прилавка уходили в запас ресурсов, и колодец, тайный ход
      и ловушка их не видели). Одиночные вещи берут по одной.
   3. Еда своего края: у каждого торговца, что держит припас, — два-три
      блюда здешних мест (берег, лес, горы, степь, пустыня, топи, север,
      город, подземье), и всякий раз своё: копчёная рыба у моря, овечий сыр
      в горах, финики в пустыне, пещерные грибы в соли под землёй. У каждого
      блюда своя польза — здоровье, вода, сила, и на несколько часов тепло,
      прохлада, стойкость к яду, твёрдый шаг или ночное зрение.
   4. Обоз везёт больше: до шести товаров и дорожный припас — инструмент,
      еду края, откуда идёт, и иногда заморское лакомство.
   5. Всё нужное делается в мастерской: верёвка, свеча, щуп, отмычки, кирка,
      топор, серп, точильный камень, ремонтный набор. Одиночную вещь, что уже
      есть, второй раз не делают — и сырьё не тратится (прежде удочка и сеть
      сверх первой съедали сырьё молча).
   6. Фляга — одна. В лавке только те, что больше вашей, строкой «Сменить
      флягу», и ваша идёт в счёт: половина её цены. Меньшую не продают.
   ════════════════════════════════════════════════════════════════════════ */

/* ── 1. ПОЛЗУНОК СЧЁТА ── */
const CountRow={
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 gold(k){return `${k} ${plural(k,"золотой","золотых","золотых")}`;},
 step(n,max,d){let m;
  if(d>0)m=n<10?n+1:n<50?Math.floor(n/5)*5+5:n<100?Math.floor(n/10)*10+10:Math.floor(n/50)*50+50;
  else m=n<=10?n-1:n<=50?Math.ceil(n/5)*5-5:n<=100?Math.ceil(n/10)*10-10:Math.ceil(n/50)*50-50;
  return Math.max(1,Math.min(max,m));},
 hint(verb){const д=verb==="продать"?"продать":"купить";
  return isDesktopApp()?`Стрелки вверх и вниз на товаре — сколько, Enter — ${д}.`:`Свайп вверх или вниз на товаре — сколько, двойное касание — ${д}.`;},
 on(el){return !!(el&&el.dataset&&el.dataset.cnttpl);},
 text(o,n){return `${o.name}${o.verb==="продать"&&o.max>1?` ×${o.max}`:""} — ${o.price}${o.max>1?` · ${o.verb} ${n} (${o.price*n})`:""}`;},
 say(o,n){const Д=o.verb==="продать"?"Продать":"Купить";const цена=`${this.gold(o.price)}${o.unit?" за штуку":""}`;
  const head=o.verb==="продать"?`${o.name}${o.max>1?`, у вас ${o.max}`:""} — ${цена}.`:`${o.name} — ${цена}.`;
  const счёт=o.max>1?` ${Д} ${n} из ${o.max} — ${this.gold(o.price*n)}. ${isDesktopApp()?"Стрелки вверх и вниз":"Свайп вверх или вниз"} — сколько.`:"";
  return `${head}${счёт}${o.extra?" "+o.extra:""}${o.card?" "+o.card:""}`;},
 /* Строка товара. tpl — команда с местом под счёт: «carbuyn:соль~{n}». */
 html(o){const verb=o.verb||"купить";const price=Math.max(0,Math.round(Number(o.price)||0));const max=Math.max(0,Math.floor(Number(o.max)||0));
  const icon=o.icon?String(o.icon)+" ":"";const tpl=String(o.tpl);
  if(max<1){const why=o.why||(verb==="купить"?`Не хватает золота: ${o.name} стоит ${price}, у вас ${G.gold}.`:`У вас нет: ${o.name}.`);
   return `<button class="item" data-cmd="${this.q(tpl.replace("{n}","1"))}" data-speak="${this.q(`${o.name} — ${this.gold(price)}. ${why}`)}">${this.q(icon)}${this.q(o.name)} — ${price} · ${this.q(why)}</button>`;}
  const oo={verb,name:o.name,price,max,unit:!!o.unit,extra:o.extra||"",card:o.card||""};
  return `<button class="item" data-cmd="${this.q(tpl.replace("{n}","1"))}" data-cnttpl="${this.q(tpl)}" data-cntn="1" data-cntmax="${max}" data-cntprice="${price}"`
   +` data-cntverb="${verb}" data-cntname="${this.q(o.name)}" data-cntunit="${oo.unit?1:0}" data-cntextra="${this.q(oo.extra)}" data-cntcard="${this.q(oo.card)}" data-cnticon="${this.q(icon)}"`
   +` data-speak="${this.q(this.say(oo,1))}">${this.q(icon)}${this.q(this.text(oo,1))}</button>`;},
 of(el){const d=el.dataset;return {verb:d.cntverb==="продать"?"продать":"купить",name:d.cntname||"",price:Number(d.cntprice)||0,max:Number(d.cntmax)||1,unit:d.cntunit==="1",extra:d.cntextra||"",card:d.cntcard||"",icon:d.cnticon||""};},
 nudge(d){const el=uiCursor;if(!this.on(el))return false;const o=this.of(el);const n0=Math.max(1,Number(el.dataset.cntn)||1);
  if(o.max<=1){safeFn(()=>Sliders.play({min:0,max:1,value:d>0?1:0},d));
   narrate(o.verb==="купить"?(o.extra&&/золота|уже есть/.test(o.extra)?o.extra:"Эта вещь продаётся одна."):"Эта вещь у вас одна.",{interrupt:true,cat:"ui"});return true;}
  const n=this.step(n0,o.max,d);const край=n===n0;
  el.dataset.cntn=String(n);el.dataset.cmd=String(el.dataset.cnttpl).replace("{n}",String(n));
  safeFn(()=>{el.textContent=`${o.icon}${this.text(o,n)}`;});el.dataset.speak=this.say(o,n);
  safeFn(()=>Sliders.play({min:1,max:o.max,value:n},d));
  narrate(`${n} из ${o.max} — ${this.gold(o.price*n)}${край?(d>0?(o.verb==="купить"?". Больше не хватает золота или товара":". Это вся стопка"):". Меньше одной нельзя"):""}.`,{interrupt:true,cat:"ui"});
  return true;}};
/* Кнопки «Купить 1, 5, 10, на всё» — у обоза и везде, где их звали, — стали ползунком. */
/* (Альфа 1.0) единственное определение: прежнее в основе снято */
function buyCountButtons(price,cmd,name){const цена=Math.max(1,Number(price)||1);
 return CountRow.html({tpl:cmd("{n}"),name:String(name),price:цена,max:Math.min(999,Math.floor((Number(G.gold)||0)/цена)),verb:"купить",unit:true});};

/* ── 2. ИНСТРУМЕНТЫ И ЕДА: ЧТО ЭТО ЗА ВЕЩИ ── */
const TORG_TOOLS={
 rod:   {n:"Удочка",где:"item",одна:true,цена:24,о:"Снасть для берега, причала, топей и борта: меню действий, «Рыбачить».",звук:"arte_wood"},
 net:   {n:"Рыболовная сеть",где:"item",одна:true,цена:44,о:"Улов больше, чем с удочкой.",звук:"arte_cloth"},
 rope:  {n:"Верёвка",где:"item",одна:true,цена:12,о:"Пенька в руку толщиной: спуск, колодец, подстраховка у ловушек.",звук:"arte_cloth"},
 torch: {n:"Факел",где:"item",цена:6,о:"Свет в глубине: стены слышны лучше, тайные ходы находятся легче; от огня зажигают и у очага.",звук:"ad_fire_crackle"},
 candle:{n:"Свеча",где:"item",цена:3,о:"Огонёк на два часа: «Зажечь свечу» в меню вещи.",звук:"arte_wood"},
 probe: {n:"Щуп ловчего",где:"item",одна:true,цена:34,о:"Длинная жила с крючком: плиту перед собой пробуют, прежде чем ступить.",звук:"arte_metal"},
 pick:  {n:"Отмычка",где:"inv",ключ:"отмычка",цена:14,о:"Крючок для замков: с ней замки чертогов и ярусов поддаются чаще; на тугом замке ломается.",звук:"arte_metal"},
 kirka: {n:"Кирка",где:"inv",ключ:"кирка",одна:true,цена:38,о:"Разбирает завалы, берёт жилу и кристалл; при сборе руды, камня и кристалла — лишняя горсть.",звук:"arte_metal"},
 axe:   {n:"Топор лесоруба",где:"item",одна:true,цена:30,о:"При рубке дерева — лишняя вязанка.",звук:"arte_metal"},
 sickle:{n:"Серп травника",где:"item",одна:true,цена:18,о:"При сборе травы, ягод и грибов — лишняя горсть.",звук:"arte_metal"},
 whet:  {n:"Точильный камень",где:"item",цена:12,о:"«Наточить оружие» в меню вещи: состояние клинка выше, четыре часа удар острее.",звук:"craft_knock"},
 mend:  {n:"Ремонтный набор",где:"item",цена:20,о:"«Поправить броню» в меню вещи: иглы, заклёпки и вощёная нить для надетого доспеха.",звук:"arte_cloth"}};
const TORG_TOOL_BY_NAME=Object.fromEntries(Object.entries(TORG_TOOLS).map(([id,t])=>[t.n,Object.assign({id},t)]));
/* Слова баффа — как их скажет игра после еды. */
const TORG_BUFF_WORD={мощь:"удар сильнее",скорость:"шаг быстрее",тепло:"стужа не берёт",прохлада:"жар не берёт",стойкость:"яд не берёт",
 страж:"удары по вам слабее",чутьё:"чутьё острее","ночное зрение":"видно в темноте",лёгкость:"шаг легче",удача:"удача на вашей стороне",дыхание:"под водой дышится дольше"};
const TORG_HOURS=h=>`${h===1?"час":h<5?["","","два","три","четыре"][h]+" часа":h+" часов"}`;
/* Блюдо: здоровье, сила, вода и бафф на сколько-то часов. */
const torgFood=(n,о,край,цена,hp,mana,water,buff,часов)=>({n,о,край,цена,эф:()=>{const ч=[];
  const h=hp?hpUp(hp):0,m=mana?manaUp(mana):0,w=water?waterUp(water):0;
  if(h)ч.push(`здоровья +${h}`);if(m)ч.push(`силы +${m}`);if(w)ч.push(`воды +${w}`);
  let т=ч.join(", ");if(buff){safeFn(()=>buffSet(buff,часов));т+=`${т?"; ":""}${TORG_HOURS(часов)} ${TORG_BUFF_WORD[buff]||buff}`;}
  if(water)safeFn(()=>Survival.relieve("thirst",Math.round(water*0.8)));return т||"сытно";}});
const TORG_FOODS=[
 torgFood("Копчёная рыба","Золотистая, с дымком, пахнет морем.",["берег"],7,10,0,0,"дыхание",2),
 torgFood("Уха в горшочке","Горячая, с перцем и лавровым листом.",["берег"],12,16,0,10,"тепло",3),
 torgFood("Сушёные кальмары","Солёные полоски, жуются долго.",["берег"],8,8,0,0,"чутьё",2),
 torgFood("Солёная треска","Плотная, белая, на дорогу в бочонке.",["берег","север"],9,12,0,0,"стойкость",2),
 torgFood("Грибной пирог","Румяный, с белыми грибами и луком.",["лес"],10,14,0,0,"мощь",2),
 torgFood("Брусничный морс","Кислый, прохладный, в глиняной бутылке.",["лес","север"],6,5,0,35,"прохлада",3),
 torgFood("Лесной мёд в сотах","Тёмный, с горечью полыни.",["лес","поле"],11,10,8,0,"удача",2),
 torgFood("Ореховая халва","Тягучая, сладкая, сытная.",["лес","горы","город"],9,12,0,0,"лёгкость",3),
 torgFood("Овечий сыр","Солоноватый, крошится, пахнет горной травой.",["горы"],10,14,0,0,"стойкость",3),
 torgFood("Горный чай с чабрецом","Душистый, согревает до кончиков пальцев.",["горы"],7,0,10,25,"тепло",4),
 torgFood("Вяленая баранина","Тонкие ломти, с чесноком.",["горы","поле"],12,16,0,0,"страж",2),
 torgFood("Ржаной каравай","Тяжёлый, кисловатый, на неделю пути.",["поле"],6,14,0,0,null,0),
 torgFood("Лепёшки с луком","Тонкие, с поджаристым краем.",["поле","пустыня"],6,10,0,0,"скорость",2),
 torgFood("Квас на корках","Шипит в кружке, пахнет хлебом.",["поле","город"],5,4,0,30,null,0),
 torgFood("Кумыс","Кобылье молоко, кислое и бодрое.",["поле"],8,8,0,30,"стойкость",2),
 torgFood("Финики","Сладкие, как мёд, и не портятся в зной.",["пустыня"],9,10,0,5,"прохлада",4),
 torgFood("Верблюжий сыр","Белый, плотный, в тряпице с солью.",["пустыня"],10,14,0,0,"прохлада",3),
 torgFood("Мятный щербет","Холодок во рту посреди жары.",["пустыня","город"],8,0,6,30,"прохлада",5),
 torgFood("Клюквенный кисель","Густой, кислый, отбивает болотную гниль.",["болото","север"],7,8,0,25,"стойкость",3),
 torgFood("Копчёный угорь","Жирный, сытный, коптят на ольхе.",["болото","берег"],12,14,0,0,"ночное зрение",2),
 torgFood("Строганина","Мороженая рыба тонкой стружкой, с солью.",["север"],10,12,0,0,"тепло",4),
 torgFood("Сбитень медовый","Горячий, на травах и мёде.",["север","город"],8,6,0,20,"тепло",6),
 torgFood("Мочёная брусника","Холодная, с горчинкой, в кадушке.",["север","лес"],6,6,0,15,"чутьё",2),
 torgFood("Медовый пряник","С печатным узором и запахом гвоздики.",["город"],8,8,0,0,"удача",3),
 torgFood("Пирог с капустой","Пышный, ещё тёплый.",["город","поле"],8,14,0,0,null,0),
 torgFood("Калач","С ручкой, чтобы есть на ходу.",["город"],5,10,0,0,"мощь",1),
 torgFood("Пещерные грибы в соли","Бледные, хрустящие, светятся в темноте.",["подземье"],9,10,0,0,"ночное зрение",3),
 torgFood("Вяленая слепая рыба","Без глаз, но вкусная, из подземных озёр.",["подземье"],10,12,0,0,"чутьё",3),
 torgFood("Земляной хлеб","Из корней и мха, тяжёлый, как камень.",["подземье"],7,14,0,0,"стойкость",2),
 torgFood("Мох-чай","Горьковатый настой, бодрит в темноте.",["подземье"],6,0,8,25,null,0),
 torgFood("Солдатская каша","Густая, с салом, в котелке на двоих.",["всюду"],7,12,0,0,"страж",2),
 torgFood("Сухари с тмином","Хрустят и не портятся.",["всюду"],4,8,0,0,null,0)];
const TORG_FOOD_BY_NAME=Object.fromEntries(TORG_FOODS.map(f=>[f.n,f]));
/* Блюда едят, как всякую еду: «Съесть» в меню вещи, раздел «Еда». */
TORG_FOODS.forEach(f=>{FOOD_EFFECTS[f.n]={о:f.о,эф:f.эф};});
safeFn(()=>Inventory.registerRule("food",new RegExp("^("+TORG_FOODS.map(f=>f.n).join("|")+")$"),true));
safeFn(()=>Inventory.registerRule("tool",/^(Топор лесоруба|Серп травника|Щуп ловчего|Точильный камень|Ремонтный набор|Свеча)$/,true));

const Torg={
 h(a,b,k){return hashName(Number(a)|0,Number(b)|0,k);},
 has(name){const t=TORG_TOOL_BY_NAME[name];if(t&&t.где==="inv")return invHas(t.ключ,1);return (G.items||[]).includes(name);},
 /* Положить купленное или сделанное туда, где его ищет игра. */
 give(name,k){k=Math.max(1,Math.floor(Number(k)||1));if(!Array.isArray(G.items))G.items=[];const t=TORG_TOOL_BY_NAME[name];
  if(t&&t.где==="inv"){G.inv[t.ключ]=(Number(G.inv[t.ключ])||0)+(t.одна?1:k);return t.одна?1:k;}
  if(t&&t.одна){if(!G.items.includes(name))G.items.push(name);return 1;}
  for(let i=0;i<k;i++)G.items.push(name);return k;},
 one(name){const t=TORG_TOOL_BY_NAME[name];return !!(t&&t.одна);},
 /* Старые сохранения: верёвка, факел, щуп и снасти с прилавка лежали в запасе ресурсов — переносим. */
 migrate(){try{if(!G||!G.inv)return 0;if(!Array.isArray(G.items))G.items=[];let n=0;
   for(const name of ["Факел","Верёвка","Щуп ловчего","Свеча","Удочка","Рыболовная сеть","Топор лесоруба","Серп травника","Точильный камень","Ремонтный набор"]){
    const k=Number(G.inv[name])||0;if(k>0){delete G.inv[name];this.give(name,k);n+=k;}}
   for(const [a,b] of [["Отмычка","отмычка"],["Кирка","кирка"]]){const k=Number(G.inv[a])||0;if(k>0){delete G.inv[a];G.inv[b]=(Number(G.inv[b])||0)+k;n+=k;}}
   return n;}catch(_){return 0;}},
 /* Край, где стоит торговец: по биому и климату; под землёй — подземье, в именном городе — город. */
 region(x,y){try{if(G.place&&Number(G.place.depth)>0)return "подземье";
   if(safeFn(()=>!!cityAt(x,y),false)||(G.place&&["castle","citadel","burg"].includes(G.place.stype)))return "город";
   const c=safeFn(()=>climateAt(x,y),null);if(c&&Number.isFinite(c.тепло)&&typeof CLIM!=="undefined"&&c.тепло<CLIM.ТГ_СРЕД)return "север";
   const t=(safeFn(()=>terrainAt(x,y),null)||[])[0];
   return {coast:"берег",forest:"лес",mountains:"горы",plains:"поле",road:"поле",desert:"пустыня",swamp:"болото",cave:"подземье"}[t]||"поле";}catch(_){return "поле";}},
 regionWord(r){return {берег:"побережья",лес:"лесного края",горы:"гор",поле:"степи и полей",пустыня:"пустыни",болото:"топей",север:"севера",город:"города",подземье:"подземья"}[r]||"этих мест";},
 /* Еда края: blocks — сколько блюд, seed — чтобы у каждого своё. */
 foodsFor(r,seedA,seedB,сколько){const свои=TORG_FOODS.filter(f=>f.край.includes(r)),всюду=TORG_FOODS.filter(f=>f.край.includes("всюду"));
  const пул=свои.slice();const out=[];
  for(let k=0;k<сколько&&пул.length;k++){const i=Math.floor(this.h(seedA+k*17,seedB+k*29,16100)*пул.length)%пул.length;out.push(пул.splice(i,1)[0]);}
  if(this.h(seedA,seedB,16101)<0.35&&всюду.length)out.push(всюду[Math.floor(this.h(seedB,seedA,16102)*всюду.length)%всюду.length]);
  return out;},
 /* Что из инструмента держит этот торговец: ремесло, промысел места, порт. */
 toolsFor(n,д){const вид=д&&д.вид?д.вид.id:null;const S=k=>this.h((n.x|0)*3+k,(n.y|0)*5+k,16200+k);const out=new Set();
  const всегда={pripas:["rope","torch","candle","rod"],obshiy:["rope","torch"],instr:["kirka","axe","sickle","probe","rope","whet","mend"],
   mech:["whet"],bron:["mend"],zapret:["pick","probe"],snadob:["sickle","candle"],knigi:["candle"],star:[]}[вид]||[];
  всегда.forEach(id=>out.add(id));
  const иногда={pripas:[["sickle",0.5],["net",0.35],["whet",0.3]],obshiy:[["rod",0.6],["axe",0.4],["whet",0.5],["candle",0.5]],
   instr:[["rod",0.6],["net",0.45],["pick",0.3]],star:[["pick",0.4],["rope",0.5],["axe",0.4],["kirka",0.35],["rod",0.4]],mech:[["kirka",0.3]],zapret:[["rope",0.4]]}[вид]||[];
  иногда.forEach(([id,p],i)=>{if(S(i+1)<p)out.add(id);});
  if(["Кузнец"].includes(n.prof)){out.add("whet");if(S(9)<0.5)out.add("kirka");}
  if(["Трактирщик"].includes(n.prof)){out.add("torch");out.add("candle");}
  if(["Контрабандист","Отверженный"].includes(n.prof))out.add("pick");
  /* Промысел места: рыбацкая деревня и порт — снасти, рудник и шахта — кирка, лесной двор — топор. */
  const tr=safeFn(()=>hereTrait(),null),тип=G.place&&G.place.stype;
  if((tr&&tr.id==="fish")||тип==="port"){out.add("rod");out.add("net");}
  if(tr&&(tr.товар||[]).includes("руда"))out.add("kirka");
  if(tr&&tr.id==="coal")out.add("axe");
  if(tr&&tr.id==="arms")out.add("whet");
  return [...out];},
 /* Цена с теми же поправками, что у прочего товара этого торговца. */
 km(n){return safeFn(()=>buyModifier(n),1)*safeFn(()=>deepMarkup(),1)*safeFn(()=>tradeBuyK(n.race),1)*safeFn(()=>npcMoodK(n),1);},
 /* Добавка к прилавку: инструмент и еда края. Порядок постоянный — номера товаров не прыгают. */
 stockExtra(n,out){try{const д=safeFn(()=>merchSoul(n),null);const вид=д&&д.вид?д.вид.id:null;const k=safeFn(()=>priceDyn(n.x,n.y),1)*this.km(n);
   const старьё=вид==="star";
   for(const id of this.toolsFor(n,д)){const t=TORG_TOOLS[id];if(!t)continue;if(t.одна&&this.has(t.n))continue;if(out.some(o=>o.n===t.n))continue;
    out.push({n:t.n,торг:id,full:true,price:Math.max(1,Math.round(t.цена*k*(старьё?0.7:1))),подержан:старьё});}
   /* Еда края — у тех, кто держит припас, и у трактирщика; у прочих — иногда одно блюдо. */
   const кормит=["pripas","obshiy"].includes(вид)||n.prof==="Трактирщик";const сколько=кормит?2+(this.h(n.x,n.y,16300)<0.5?1:0):(this.h(n.x,n.y,16301)<0.35?1:0);
   if(сколько){const r=this.region(n.x,n.y);this.foodsFor(r,n.x|0,n.y|0,сколько).forEach((f,i)=>{if(out.some(o=>o.n===f.n))return;
     out.push({n:f.n,торг:"food",край:r,фирм:i===0&&кормит,full:true,price:Math.max(2,Math.round(f.цена*k))});});}}catch(_){}
  return out;},
 /* Фляга одна: в лавке только больше вашей, и ваша идёт в счёт. */
 flaskFix(n,out){try{const моя=flaskOf();const k=safeFn(()=>priceDyn(n.x,n.y),1)*this.km(n);const вСчёт=Math.round((моя.price||0)*k*0.5);
   for(let i=out.length-1;i>=0;i--){const o=out[i];if(!o||!o.фляга)continue;const f=FLASK_BY_ID[o.фляга];
    if(!f||f.cap<=моя.cap){out.splice(i,1);continue;}
    o.n=`Сменить флягу: ${f.n}, ${f.cap} мер`;o.вСчёт=вСчёт;o.price=Math.max(1,Math.round(f.price*k)-вСчёт);o.full=true;}}catch(_){}
  return out;},
 /* Карточка и род строки прилавка для нашего товара. */
 rowFix(r){const s=r.s;if(!s)return r;
  if(s.фляга){const f=FLASK_BY_ID[s.фляга],моя=safeFn(()=>flaskOf(),null);r.count=null;r.cat="tool";
   r.card=`${f?f.n+": "+f.о+". ":""}Фляга у вас одна: новая заменит ${моя?моя.n.toLowerCase():"прежнюю"}${s.вСчёт?`, а прежняя пойдёт в счёт — минус ${s.вСчёт} золота к цене`:""}.`;return r;}
  if(!s.торг)return r;
  if(s.торг==="food"){const f=TORG_FOOD_BY_NAME[s.n];r.cat="food";r.count="счётом";
   r.card=`${f?f.о+" ":""}${s.фирм?"Фирменное у этого торговца. ":""}Еда ${this.regionWord(s.край)}. Съесть — в меню вещи, раздел «Еда».`;return r;}
  const t=TORG_TOOLS[s.торг];r.cat="tool";r.count=t&&t.одна?null:"счётом";
  r.card=`${t?t.о:""}${s.подержан?" Подержанное, зато дешевле.":""}${t&&t.одна?" Нужна одна: вторую не берут.":""}`;return r;},
 /* Сделка за нашим товаром: у торговца, у обоза. */
 buy(src,n,s,count){const k0=Math.max(1,Math.floor(Number(count)||1));const t=TORG_TOOLS[s.торг];
  if(t&&t.одна&&this.has(t.n)){narrate(`${t.n} у вас уже есть — вторая не нужна.`,{interrupt:true});return false;}
  const k=t&&t.одна?1:k0;const итог=s.price*k;
  if((Number(G.gold)||0)<итог){narrate(`Не хватает золота: нужно ${итог}, у вас ${G.gold}.${src==="shop"?safeFn(()=>npcSayText(n,"trade_poor"),""):""}`,{interrupt:true});return false;}
  if(!safeFn(()=>cargoFits(k,`«${s.n}»`),true))return false;
  G.gold-=итог;this.give(s.n,k);
  safeFn(()=>{UI.pickup();Bank.play("arte_coins",{seed:итог,gain:0.5,maxSec:3});if(t&&t.звук)Bank.play(t.звук,{seed:итог,gain:0.45,maxSec:2});else Bank.play("oc_munch",{gain:0.25,maxSec:1});});
  let слово="";if(src==="shop"&&n){safeFn(()=>addRep(n.race,1));safeFn(()=>noteTrade(n,итог));safeFn(()=>npcRemember(n,"купил",итог,5));слово=safeFn(()=>merchDeal(n,"buy",итог),"")||"";}
  const где=t?" Лежит в котомке, раздел «Инструменты».":TORG_FOOD_BY_NAME[s.n]?" Лежит в котомке, раздел «Еда».":"";
  narrate(`Куплено: ${s.n}${k>1?` ×${k}`:""} за ${итог} золота. Осталось золота: ${G.gold}.${где}${слово}`,{interrupt:true});
  journal(`Покупка: ${s.n}${k>1?` ×${k}`:""} за ${итог}.`);safeFn(()=>{refresh();saveGame(true);});return true;},
 /* Дорожный припас обоза: инструмент, еда края, откуда он идёт, иногда заморское. */
 caravanStock(car){try{const rt=car.rt||{};const sa=(car.from&&car.from.x|0)+((car.to&&car.to.x)|0)*3,sb=(car.from&&car.from.y|0)+((car.to&&car.to.y)|0)*7;
   const ids={trade:["rope","torch","rod","whet"],salt:["torch","rope"],ore:["kirka","whet","axe"],pilgrim:["candle","torch"],war:["whet","mend","rope"]}[(car.kind||{}).id]||["rope","torch"];
   const out=[];const k=1.2*safeFn(()=>priceDyn(car.x,car.y),1);
   ids.forEach(id=>{const t=TORG_TOOLS[id];if(t.одна&&this.has(t.n))return;out.push({n:t.n,торг:id,price:Math.max(1,Math.round(t.цена*k))});});
   const откуда=this.region(car.from?car.from.x:car.x,car.from?car.from.y:car.y);
   this.foodsFor(откуда,sa,sb,2).forEach(f=>out.push({n:f.n,торг:"food",край:откуда,price:Math.max(2,Math.round(f.цена*k))}));
   if(this.h(sa,sb,16400)<0.4){const r=["берег","пустыня","горы","север","лес"][Math.floor(this.h(sb,sa,16401)*5)%5];
    const f=this.foodsFor(r,sb,sa,1)[0];if(f&&!out.some(o=>o.n===f.n))out.push({n:f.n,торг:"food",край:r,заморское:true,price:Math.max(3,Math.round(f.цена*k*1.4))});}
   return out;}catch(_){return [];}}};

/* ── 3. ЛАВКА: ДОБАВКА К ПРИЛАВКУ, ОДНА ФЛЯГА, СДЕЛКА ── */
safeFn(()=>{const s0=stockFor;stockFor=function(n){const out=s0.apply(this,arguments);safeFn(()=>Torg.migrate());
 if(n){Torg.flaskFix(n,out);Torg.stockExtra(n,out);}return out;};});
safeFn(()=>{const r0=shopStockRows;shopStockRows=function(n){const rows=r0.apply(this,arguments);rows.forEach(r=>safeFn(()=>Torg.rowFix(r)));return rows;};});
safeFn(()=>{const b0=buyItem;buyItem=function(key,i){const n=getNPCByKey(key);const it=n?safeFn(()=>stockFor(n)[+i],null):null;
 if(it&&it.торг){const ок=Torg.buy("shop",n,it,1);if(ок)safeFn(()=>afterTrade(key));else safeFn(()=>renderShop());return;}
 return b0.apply(this,arguments);};});
safeFn(()=>{const y0=shopYes;shopYes=function(){const n=shopNpc();const c=SHOP.confirm;
 if(n&&c&&c.tab==="buy"&&SHOP.sel){const r=shopStockRows(n)[SHOP.sel.idx];
  if(r&&r.s&&r.s.торг){SHOP.confirm=null;Torg.buy("shop",n,r.s,c.count);SHOP.sel=null;safeFn(()=>renderShop());return true;}}
 return y0.apply(this,arguments);};});
/* Фляга: новая — только больше прежней. */
safeFn(()=>{const f0=Body.buyFlask;Body.buyFlask=function(id,цена){const f=FLASK_BY_ID[id],моя=safeFn(()=>flaskOf(),null);
 if(f&&моя&&G.flask!==id&&f.cap<=моя.cap){narrate(`${моя.n} у вас уже есть, и она не меньше: ${моя.cap} мер. Фляга нужна одна — меньшую брать незачем.`,{interrupt:true});return false;}
 return f0.apply(this,arguments);};});
/* Карточка товара: вместо «Купить 1, 5, 10, на всё» — ползунок. */
safeFn(()=>{const c0=shopItemCard;shopItemCard=function(idx){const r=c0.apply(this,arguments);safeFn(()=>Torg.cardPost());return r;};});
Torg.cardPost=function(){const box=document.getElementById("shopBody");if(!box)return;const n=shopNpc();if(!n||!SHOP.sel)return;
 const tab=SHOP.sel.tab;const rows=tab==="buy"?shopStockRows(n):shopSellRows(n).filter(r=>r.ок);const r=rows[SHOP.sel.idx];if(!r)return;
 const btns=[...box.querySelectorAll(`button[data-cmd^="shopask:${tab}:"]`)];if(btns.length<2)return;
 const max=tab==="buy"?Math.max(0,Math.min(999,Math.floor((Number(G.gold)||0)/Math.max(1,r.price)))):Math.max(1,Number(r.n)||1);
 const h=CountRow.html({tpl:`shopask:${tab}:{n}`,name:r.name,price:r.price,max:tab==="buy"&&(!r.count||(r.s&&TORG_TOOL_BY_NAME[r.name]&&Torg.one(r.name)))?Math.min(1,max):max,verb:tab==="buy"?"купить":"продать",unit:tab==="buy"?!!r.count:(Number(r.n)||1)>1});
 btns[0].insertAdjacentHTML("beforebegin",h);btns.forEach(b=>b.remove());};

/* ── 4. ОБОЗ: БОЛЬШЕ ТОВАРА, ПРИПАС, СКУПКА ПОЛЗУНКОМ ── */
safeFn(()=>{const g0=caravanGoods;caravanGoods=function(rt,from,to,day){const g=g0.apply(this,arguments);
 try{const pf=cityProfile(from),pt=cityProfile(to);const emp=EMPIRES[Math.max(0,empireIndexAt(from.x,from.y))]||{};
  const поРоду={salt:["белая соль","чужая соль","ракушка"],ore:["руда","слиток","дроблёная руда","кованая полоса"],trade:["полотно","пряжа","выделанная кожа","доска"],
   pilgrim:["трава","ягоды","летописный лист"],war:["кованая полоса","кожаный крой","руда","шкура"]}[(rt.kind||{}).id]||[];
  const sa=(from.x|0)+(to.x|0),sb=(from.y|0)+(to.y|0);
  const род=поРоду.filter((r,i)=>hashName(sa+i*7,sb+i*3,16500)<0.6);
  const carry=[...new Set([...(g.carry||[]),...(pf.surplus||[]),...род,...(emp.exports||[])])].filter(r=>r&&r in RESICON).slice(0,6);
  const wants=[...new Set([...(g.wants||[]),...(pt.demand||[]),...(pf.demand||[])])].filter(r=>r&&r in RESICON&&!carry.includes(r)).slice(0,5);
  return {carry:carry.length?carry:g.carry,wants:wants.length?wants:g.wants};}catch(_){return g;}};});
safeFn(()=>{const m0=meetCaravan;meetCaravan=function(car){const r=m0.apply(this,arguments);safeFn(()=>Torg.caravanPost(car));return r;};});
Torg.caravanPost=function(car){const body=document.getElementById("caravanBody");if(!body||!car)return;
 /* Скупка: одна строка на ресурс, сколько продать — ползунком. */
 const lines=[...body.querySelectorAll(".list-line")].filter(l=>l.querySelector('button[data-cmd^="carselln:"],button[data-cmd^="carsellall:"]'));
 lines.forEach(l=>{const b=l.querySelector('button[data-cmd^="carsellall:"]')||l.querySelector('button[data-cmd^="carselln:"]');
  const res=String(b.dataset.cmd).replace(/^carsell(all|n):/,"").split("~")[0];const have=Number(G.inv[res])||0;
  const цена=safeFn(()=>carSellPrice(car,res),0)||0;
  l.querySelectorAll("button").forEach(x=>x.remove());
  l.insertAdjacentHTML("beforeend",CountRow.html({tpl:`carselln:${res}~{n}`,name:res,price:цена,max:have,verb:"продать",unit:true,icon:RESICON[res]||""}));});
 /* Дорожный припас — перед скупкой. */
 const припас=Torg.caravanStock(car);
 if(припас.length){const h3=[...body.querySelectorAll("h3")].find(h=>/скупает/.test(h.textContent));
  const html=`<h3>Дорожный припас</h3>`+припас.map(s=>{const t=TORG_TOOLS[s.торг],f=TORG_FOOD_BY_NAME[s.n];
   const max=t&&t.одна?Math.min(1,Math.floor((Number(G.gold)||0)/Math.max(1,s.price))):Math.min(999,Math.floor((Number(G.gold)||0)/Math.max(1,s.price)));
   const card=t?t.о:`${f?f.о+" ":""}${s.заморское?"Заморское: едет издалека. ":""}Еда ${Torg.regionWord(s.край)}.`;
   return CountRow.html({tpl:`cartorg:${s.n}~{n}`,name:s.n,price:s.price,max,verb:"купить",unit:!(t&&t.одна),card});}).join("");
  if(h3)h3.insertAdjacentHTML("beforebegin",html);else body.insertAdjacentHTML("beforeend",html);}
 /* Подсказка — в первой строке окна. */
 const head=body.querySelector(".list-line[data-speak]");if(head&&!/Свайп вверх или вниз на товаре|Стрелки вверх и вниз на товаре/.test(head.dataset.speak))head.dataset.speak+=" "+CountRow.hint("купить");};
CMD.cartorg=function(a){const [name,k]=String(a||"").split("~");if(!curCaravan){narrate("Обоз ушёл.");return;}
 const s=Torg.caravanStock(curCaravan).find(x=>x.n===name);if(!s){narrate("Этого у обоза нет.");return;}
 if(Torg.buy("car",null,s,Number(k)||1)){safeFn(()=>{const t=carSay(curCaravan,"car_buy");if(t)narrate(t.trim(),{interrupt:false});});}
 safeFn(()=>meetCaravan(curCaravan));};

/* ── 5. ТОРГ ПОСЕЛЕНИЙ ГЛУБИ: ПОЛЗУНОК ── */
Torg.deepPost=function(i){const box=document.getElementById("dpBody");if(!box)return;
 box.querySelectorAll('button[data-cmd^="dp:buy:"],button[data-cmd^="dp:sell:"]').forEach(b=>{
  const m=String(b.dataset.cmd).match(/^dp:(buy|sell):(\d+):(.+)$/);if(!m)return;const [,вид,ii,r]=m;const t=b.textContent;
  const цена=Number((t.match(/—\s*(\d+)\s*золота/)||[])[1])||0;const есть=Number((t.match(/\((?:есть|у вас)\s*(\d+)\)/)||[])[1]);
  let max;if(вид==="buy"){const поЗолоту=Math.floor((Number(G.gold)||0)/Math.max(1,цена));max=Math.min(999,Number.isFinite(есть)?Math.min(есть,поЗолоту):поЗолоту);}
  else max=Number(G.inv[r])||0;
  b.insertAdjacentHTML("beforebegin",CountRow.html({tpl:`dp:${вид}n:${ii}:${r}:{n}`,name:r,price:цена,max,verb:вид==="buy"?"купить":"продать",unit:true,
   extra:вид==="buy"&&Number.isFinite(есть)?`На прилавке ${есть}.`:"" ,card:вид==="buy"?"Цена растёт, когда товара на прилавке мало.":""}));b.remove();});};
safeFn(()=>{const t0=Deep.trade;Deep.trade=function(i){const r=t0.apply(this,arguments);safeFn(()=>Torg.deepPost(i));return r;};});
safeFn(()=>{const c0=Deep.cmd;Deep.cmd=function(a){const p=String(a||"").split(":");
 if(p[0]==="buyn"||p[0]==="selln"){const i=+p[1],k=Math.max(1,Number(p[p.length-1])||1),r=p.slice(2,-1).join(":");return p[0]==="buyn"?Torg.deepBuy(this,i,r,k):Torg.deepSell(this,i,r,k);}
 return c0.apply(this,arguments);};});
Torg.deepBuy=function(D,i,r,k){const s=D.here();if(!s)return D.view();const x=D.st(s);const z=x.set[i];if(!z)return D.view();let n=0,итог=0;
 for(let j=0;j<k;j++){const клапан=r==="латунный клапан";const p=клапан?60+i*4:D.price(s,x,i,r,true);if((Number(G.gold)||0)<p)break;
  if(!клапан){if(!(z.stock[r]>0))break;z.stock[r]--;}G.gold-=p;G.inv[r]=(Number(G.inv[r])||0)+1;итог+=p;n++;}
 if(!n){D.say(`Не хватает золота или товара.`);return D.trade(i);}
 z.wealth=Math.min(1,+(z.wealth+0.01*n).toFixed(3));safeFn(()=>Bank.play("arte_coins",{gain:0.5,maxSec:2}));safeFn(()=>D.chainCheck(s,x));
 D.say(`Куплено: ${r}${n>1?` ×${n}`:""} за ${итог} золота.${n<k?` Больше взять не вышло.`:""}`);return D.trade(i);};
Torg.deepSell=function(D,i,r,k){const s=D.here();if(!s)return D.view();const x=D.st(s);const z=x.set[i];if(!z)return D.view();let n=0,итог=0;
 for(let j=0;j<k&&(Number(G.inv[r])||0)>0;j++){const p=D.price(s,x,i,r,false);G.inv[r]--;if(!G.inv[r])delete G.inv[r];G.gold=(Number(G.gold)||0)+p;z.stock[r]=(Number(z.stock[r])||0)+1;итог+=p;n++;}
 if(!n)return D.trade(i);safeFn(()=>Bank.play("arte_coins",{gain:0.5,maxSec:2}));D.say(`Продано: ${r}${n>1?` ×${n}`:""}, +${итог} золота.`);return D.trade(i);};

/* ── 6. КУЗНИЦА НОВОГО: ПОЛЗУНОК ВМЕСТО «КУПИТЬ 1, 5, 10» ── */
Torg.nxPost=function(){const all=[...document.querySelectorAll('button[data-cmd*="nx:buy:"]')];const групп=new Map();
 all.forEach(b=>{const m=String(b.dataset.cmd).match(/^(.*nx:buy:[pr]:[^:]+:)(\d+)$/);if(!m)return;if(!групп.has(m[1]))групп.set(m[1],[]);групп.get(m[1]).push(b);});
 for(const [pre,bs] of групп){if(bs.length<2)continue;const t=bs[0].textContent;const m=t.match(/Купить\s+(\d+)\s*\((\d+)\)/);if(!m)continue;
  const цена=Math.max(1,Math.round(Number(m[2])/Math.max(1,Number(m[1]))));const строка=bs[0].closest(".row")||bs[0].parentElement;
  const имя=((строка&&строка.previousElementSibling&&строка.previousElementSibling.textContent)||"").split(":")[0].trim()||"товар";
  bs[0].insertAdjacentHTML("beforebegin",CountRow.html({tpl:`${pre}{n}`,name:имя,price:цена,max:Math.min(999,Math.floor((Number(G.gold)||0)/цена)),verb:"купить",unit:true}));
  bs.forEach(b=>b.remove());}};
safeFn(()=>{const v0=Neuro.view;Neuro.view=function(){const r=v0.apply(this,arguments);safeFn(()=>Torg.nxPost());return r;};});

/* ── 7. ОКНО СОБЫТИЯ: ВЫБОР СО СЧЁТОМ (мастерская Гильдии) ── */
let TORG_EVT_N=null;
safeFn(()=>{const o0=openEvent;openEvent=function(e,c){const r=o0.apply(this,arguments);
 safeFn(()=>{if(!curEvent)return;const body=document.getElementById("eventBody");if(!body)return;
  curEvent.choices.forEach((ch,i)=>{if(!ch||!ch.счёт)return;const b=body.querySelector(`button[data-cmd="evt:${i}"]`);if(!b)return;const с=ch.счёт;
   b.insertAdjacentHTML("beforebegin",CountRow.html({tpl:`evt:${i}~{n}`,name:с.name,price:с.price,max:Math.min(999,Math.floor((Number(G.gold)||0)/Math.max(1,с.price))),verb:"купить",unit:true,card:с.card||""}));b.remove();});});
 return r;};});
safeFn(()=>{const e0=CMD.evt;CMD.evt=function(a){const [i,k]=String(a).split("~");TORG_EVT_N=k!=null?Math.max(1,Number(k)||1):null;return e0.call(this,i);};});
/* Гильдия Тихой Меры: сырьё — счётом. */
safeFn(()=>{if(typeof НемЛюди==="undefined"||typeof НЕМ_СЫРЬЁ==="undefined")return;
 const купить1=НемВещи.купить.bind(НемВещи);
 НемВещи.купитьСчётом=function(name,k){let n=0,трачено=0,t="";for(let j=0;j<k;j++){const g0=Number(G.gold)||0;t=купить1(name);const g1=Number(G.gold)||0;if(g1>=g0)break;n++;трачено+=g0-g1;}
  return n>1?`Куплено: ${name} ×${n} за ${трачено} золотых.${n<k?" На большее не хватило.":""}`:t;};
 /* Строки сырья в выборе получают счёт; выбор числом — с ползунка. */
 const в0=выбор147;выбор147=function(title,text,choices){
  if(title==="Мастерская: товар"&&Array.isArray(choices))choices=choices.map(ch=>{const r=Object.keys(НЕМ_СЫРЬЁ).find(k=>ch&&String(ch.l).toLowerCase().startsWith(k.toLowerCase()+" —"));
   if(!r)return ch;const цена=safeFn(()=>НемВещи.цена(НЕМ_СЫРЬЁ[r]),НЕМ_СЫРЬЁ[r]);
   return Object.assign({},ch,{счёт:{name:r[0].toUpperCase()+r.slice(1),price:цена},run:()=>{const k=TORG_EVT_N||1;TORG_EVT_N=null;return НемЛюди.итог(НемВещи.купитьСчётом(r,k),t=>НемЛюди.лавка(t));}});});
  return в0.call(this,title,text,choices);};});

/* ── 8. МАСТЕРСКАЯ: НУЖНОЕ ДЕЛАЕТСЯ САМОМУ ── */
const TORG_CRAFT=[
 {n:"Верёвка",из:{"трава":3}},
 {n:"Свеча",из:{"кость":1,"трава":1}},
 {n:"Щуп ловчего",из:{"дерево":1,"кость":1}},
 {n:"Отмычка",из:{"руда":1},сколько:2},
 {n:"Кирка",из:{"дерево":1,"руда":2}},
 {n:"Топор лесоруба",из:{"дерево":1,"руда":2}},
 {n:"Серп травника",из:{"дерево":1,"руда":1}},
 {n:"Точильный камень",из:{"камень":2}},
 {n:"Ремонтный набор",из:{"шкура":1,"руда":1}}];
TORG_CRAFT.forEach(r=>CRAFT_RECIPES.push({n:r.n,из:r.из,торг:true,сколько:r.сколько||1}));
safeFn(()=>{const c0=CMD.craftdo;CMD.craftdo=function(i){const r=CRAFT_RECIPES[Number(i)];
 /* Одиночная вещь, что уже есть, не делается — и сырьё не тратится. */
 if(r&&(r.n==="Удочка"||r.n==="Рыболовная сеть"||(r.торг&&Torg.one(r.n)))&&Torg.has(r.n)){narrate(`${r.n} у вас уже есть — вторая не нужна. Сырьё цело.`,{cat:"result"});return;}
 if(!r||!r.торг)return c0.apply(this,arguments);
 for(const k in r.из)if((Number(G.inv[k])||0)<r.из[k]){narrate(`Не хватает: ${k}. Нужно: ${Object.entries(r.из).map(([a,b])=>`${a} ×${b}`).join(", ")}.`);return;}
 for(const k in r.из){G.inv[k]-=r.из[k];if(G.inv[k]<=0)delete G.inv[k];}
 const n=Torg.give(r.n,r.сколько||1);
 safeFn(()=>{Bank.play("arte_coins",{seed:Number(i),gain:0.5,maxSec:3});setTimeout(()=>safeFn(()=>Bank.play((TORG_TOOL_BY_NAME[r.n]||{}).звук||"craft_knock",{gain:0.5,maxSec:3})),180);});
 safeFn(()=>journal(`Крафт: ${r.n}${n>1?` ×${n}`:""}.`));safeFn(()=>deed("crafts"));
 narrate(`Создано: ${r.n}${n>1?` ×${n}`:""}. Лежит в котомке, раздел «Инструменты».`);safeFn(()=>saveGame(true));safeFn(()=>refresh());safeFn(()=>renderCraft());};});

/* ── 9. ИНСТРУМЕНТ В ДЕЛЕ ── */
const ToolKit={
 /* Сбор на поверхности: топор — дерево, серп — трава, ягоды и грибы, кирка — камень, руда и кристалл. */
 gather(res){const r=String(res||"");
  if(r==="дерево"&&Torg.has("Топор лесоруба"))return {n:1,t:" Топор лесоруба: лишняя вязанка."};
  if(["трава","ягоды","грибы"].includes(r)&&Torg.has("Серп травника"))return {n:1,t:" Серп травника: лишняя горсть."};
  if(["камень","руда","кристалл"].includes(r)&&Torg.has("Кирка"))return {n:1,t:" Кирка: лишняя горсть."};
  return null;},
 /* Жила в месте: с киркой — ещё одна. */
 vein(res){return Torg.has("Кирка")?{n:1,t:" Кирка берёт глубже."}:null;}};
const torgWeapon=()=>{try{const it=G.equip&&G.equip.weapon;return it&&typeof it==="object"?it:null;}catch(_){return null;}};
const torgArmor=()=>{try{return ["armor","helm","gloves","boots","shield"].map(k=>G.equip&&G.equip[k]).filter(it=>it&&typeof it==="object");}catch(_){return [];}};
iaction("torgwhet",{n:"Наточить оружие",значок:"",cats:["tool"],
 можно:(row)=>String(row.name)!=="Точильный камень"?false:torgWeapon()?true:"в руках нет оружия",
 делать:(row,ctx,done)=>{const it=torgWeapon();if(!it)return done("В руках нет оружия.");const было=itemCondition(it);it.сост=Math.min(100,было+30);
  invRemoveItem(row);safeFn(()=>buffSet("заточка",4));safeFn(()=>Bank.play("craft_knock",{gain:0.5,maxSec:2}));safeFn(()=>saveGame(true));
  return done(`Наточено: ${it.name}. Состояние ${было} → ${itemCondition(it)} из ста; четыре часа удар острее.`);}});
iaction("torgmend",{n:"Поправить броню",значок:"",cats:["tool"],
 можно:(row)=>String(row.name)!=="Ремонтный набор"?false:torgArmor().some(it=>itemCondition(it)<100)?true:torgArmor().length?"броня цела":"брони на вас нет",
 делать:(row,ctx,done)=>{const все=torgArmor().filter(it=>itemCondition(it)<100);if(!все.length)return done("Чинить нечего: броня цела.");
  все.forEach(it=>{it.сост=Math.min(100,itemCondition(it)+25);});invRemoveItem(row);safeFn(()=>Bank.play("arte_cloth",{gain:0.5,maxSec:2}));safeFn(()=>saveGame(true));
  return done(`Поправлено: ${все.map(it=>it.name).join(", ")} — плюс четверть к состоянию.`);}});
iaction("torgcandle",{n:"Зажечь свечу",значок:"",cats:["tool"],
 можно:(row)=>String(row.name)!=="Свеча"?false:buffActive("свет")?"свет уже горит":true,
 делать:(row,ctx,done)=>{invRemoveItem(row);safeFn(()=>buffSet("свет",2));safeFn(()=>Bank.play("ad_fire_crackle",{gain:0.35,maxSec:2}));safeFn(()=>saveGame(true));
  return done(G.place&&G.place.depth>0?"Свеча зажжена: два часа огонёк держит темноту на шаг дальше.":"Свеча зажжена: два часа при вас огонёк.");}});

/* ── 10. ЗАГРУЗКА: ПЕРЕНОС СТАРОГО ── */
safeFn(()=>{const a0=applySave;applySave=function(){const r=a0.apply(this,arguments);safeFn(()=>Torg.migrate());return r;};});
safeFn(()=>Torg.migrate());

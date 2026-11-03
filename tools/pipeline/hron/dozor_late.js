/* ════════════════════════════════════════════════════════════════════════
   НОЧНОЙ ДОЗОР СО СТРАЖЕЙ (3 ноября 2026)
   Просьба игрока: «чтобы игрок реально стоял, вернее, ходил со стражей в
   ночном дозоре, чтобы он мог навестись на стражу, и она озвучивалась,
   показывалась ему как тоже маячком. Только звук маяка должен быть другой».
   Прежде «Постоять в ночном дозоре» было мгновенной работой: четыре часа
   пропускались одним касанием.
   1. Дозор — настоящий обход. Ночью (с восьми вечера до пяти утра) у
      поселения — в окне деревни («Помочь по хозяйству»), у стражи ворот или в
      меню действий («Квесты» → «Ночной дозор») — герой выходит с двумя
      стражниками: десятником и стражником. У каждого своё имя и свой голос
      (записанные голоса стражи). Они идут по пяти постам вокруг поселения
      и возвращаются к воротам; шаги и кольчуга слышны с их стороны.
   2. Стражники ждут героя: отстал больше чем на три шага — десятник
      останавливается и зовёт («Шагом марш! Не растягиваться!»); ушёл дальше
      двенадцати шагов или зашёл в дом — дозор уходит без него.
   3. Навестись на стражу: маяк дозора — свой звук, звон кольчуги, а не
      колокольчик обычного маяка; он идёт за стражником, пока тот шагает.
      Включается сам при выходе в дозор; снова — в окне «Ночной дозор»,
      клавишей B (на телефоне — жест «где цель маяка») или выбором стражника в
      осмотре: стражники видны в нём как живые цели. Shift+B — погасить.
   4. На постах — слово стражи и порой тревога: лихие люди у плетня или волк
      у загонов. Обошли все посты — плата поселения, опыт и доброе слово:
      отношение растёт. Снова в дозор того же поселения — не раньше чем через
      двенадцать часов (накрутить нельзя).
   ════════════════════════════════════════════════════════════════════════ */
const ДОЗОР_ИМЕНА=["Ивар","Борута","Ждан","Светозар","Гордей","Остап","Радим","Влас","Тихон","Мирон","Добрыня","Яромир","Велимир","Станимир"];
const ДОЗОР_ПОСТЫ=["у ворот","у колодца","у амбаров","на околице у леса","у старой мельницы","у моста через ручей","у кладбищенской ограды",
 "у загонов со скотом","у сторожевой вышки","у дальнего плетня","у кузни","у дороги на тракт"];
/* посты вокруг поселения: смещения от его клетки, по кругу */
const ДОЗОР_КРУГ=[[3,0],[1,3],[-2,2],[-3,-1],[0,-3]];
const ДОЗОР_ИТОГ=["тихо","всё спокойно","огни горят, чужих нет","собаки молчат — значит, спокойно","ветер да шорох листвы, и только"];
const Дозор={
 ШАГ:1300,ЖДАТЬ:3,УШЁЛ:12,КД:12,
 ст(){if(!G.дозор||typeof G.дозор!=="object")G.дозор={кд:{}};if(!G.дозор.кд)G.дозор.кд={};return G.дозор;},
 идёт(){const d=G.дозор;return !!(d&&d.идёт);},
 час(){return ((Number(G.day)||1)-1)*24+(Number(G.hour)||0);},
 ночь(){const h=(Number(G.hour)||0)%24;return h>=20||h<5;},
 /* поселение под ногами (или то, в котором стоит герой), где есть стража */
 поселение(){
  const c=safeFn(()=>cellContent(G.x,G.y),null);
  if(!c||!c.structure)return null;
  const т=c.structure.type;if(typeof ВОРОТА147==="undefined"||!ВОРОТА147[т])return null;
  return c;},
 имя(c){return String((c&&c.structure&&c.structure.name)||"поселение").split(" — ")[0];},
 ключ(c){return (c.x|0)+","+(c.y|0);},
 /* почему нельзя выйти в дозор сейчас; пустая строка — можно */
 почему(c){
  if(!c)return "дозор собирают у поселения со стражей";
  if(this.идёт())return "вы уже в дозоре";
  if(!this.ночь())return "дозор — только ночью, с восьми вечера до пяти утра";
  if(G.inCombat)return "сначала бой";
  const ч=this.ст().кд[this.ключ(c)];
  if(ч!=null&&this.час()-Number(ч)<this.КД){const ост=Math.ceil(this.КД-(this.час()-Number(ч)));return `в этом поселении вы уже ходили в дозор — снова через ${ост} ${plural(ост,"час","часа","часов")}`;}
  return "";},
 доступен(){return this.идёт()||(!G.place&&!!this.поселение()&&this.ночь())||(!!G.place&&!G.place.depth&&this.ночь()&&!!this.поселение());},
 hash(c,i){return Math.abs(Math.sin((c.x|0)*12.9898+(c.y|0)*78.233+(Number(G.day)|0)*3.7+i*19.19)*43758.5453)%1;},
 /* выйти в дозор */
 начать(c,откуда){
  c=c||this.поселение();const why=this.почему(c);
  if(why){narrate(`Ночной дозор: ${why}.`,{interrupt:true});return false;}
  /* из поселения дозор выходит за ворота */
  if(G.place){if(G.place.depth){narrate("Ночной дозор: дозор собирают наверху, у поселения.",{interrupt:true});return false;}safeFn(()=>leavePlace());}
  while(safeFn(()=>activeLayer(),null)&&safeFn(()=>closeTopUI(),false));
  const h=i=>this.hash(c,i);
  const и1=ДОЗОР_ИМЕНА[Math.floor(h(1)*ДОЗОР_ИМЕНА.length)];let и2=ДОЗОР_ИМЕНА[Math.floor(h(2)*ДОЗОР_ИМЕНА.length)];if(и2===и1)и2=ДОЗОР_ИМЕНА[(ДОЗОР_ИМЕНА.indexOf(и1)+5)%ДОЗОР_ИМЕНА.length];
  const г1=Math.floor(h(3)*3),г2=(г1+1+Math.floor(h(4)*2))%3;
  const сдв=Math.floor(h(5)*ДОЗОР_ПОСТЫ.length);
  const посты=ДОЗОР_КРУГ.map(([dx,dy],i)=>({x:Math.max(0,Math.min(WORLD_MAX-1,(c.x|0)+dx)),y:Math.max(0,Math.min(WORLD_MAX-1,(c.y|0)+dy)),n:ДОЗОР_ПОСТЫ[(сдв+i*5)%ДОЗОР_ПОСТЫ.length],готов:false}));   /* шаг 5 взаимно прост с 12: имена постов не повторяются */
  посты.push({x:c.x|0,y:c.y|0,n:"у ворот — конец обхода",готов:false,конец:true});
  const st=this.ст();
  st.идёт=true;st.где={x:c.x|0,y:c.y|0,имя:this.имя(c),тип:c.structure.type,откуда:откуда||""};st.посты=посты;st.пост=0;st.тревог=0;st.начат=this.час();
  st.стража=[{кто:"десятник",имя:и1,голос:г1,x:c.x|0,y:c.y|0},{кто:"стражник",имя:и2,голос:г2,x:c.x|0,y:c.y|0}];
  st.зов=0;st.болтовня=Date.now()+9000;st.драка=false;
  safeFn(()=>Bank.play("guard_shout",{gain:0.55,maxSec:2.5}));
  safeFn(()=>journal(`Ночной дозор: ${st.где.имя}, с десятником ${и1} и стражником ${и2}.`));
  narrate(`Ночной дозор, ${st.где.имя}. С вами десятник ${и1} и стражник ${и2}: пять постов вокруг поселения и назад к воротам. `+
   `Маяк дозора звенит кольчугой — идите на звон, держитесь не дальше трёх шагов. B — где десятник, Shift+B — погасить маяк; навестись снова — окно «Ночной дозор» в меню действий.`,{interrupt:true});
  setTimeout(()=>safeFn(()=>this.сказать(st.стража[0],"patrol","Шагом марш! Не растягиваться!")),2600);
  setTimeout(()=>safeFn(()=>this.навестись(0,true)),900);
  this.пуск();safeFn(()=>saveGame(true));return true;},
 пуск(){clearTimeout(this._t);this._t=setTimeout(()=>safeFn(()=>this.такт()),this.ШАГ);},
 страж(i){const st=G.дозор;return st&&st.идёт&&st.стража?st.стража[Number(i)||0]:null;},
 /* стражник говорит своим записанным голосом; записи нет — читает голос игры */
 /* строка из списка — не та же, что звучала в прошлый раз */
 выбрать(список,ключ){const st=G.дозор||{};const был=(st.было||{})[ключ];const можно=список.filter(x=>x!==был);const v=(можно.length?можно:список)[Math.floor(Math.random()*(можно.length||список.length))];
  if(G.дозор){if(!G.дозор.было)G.дозор.было={};G.дозор.было[ключ]=v;}return v;},
 сказать(g,пул,строка){if(!g)return false;
  const ok=safeFn(()=>Folk.реплика(пул,строка,{x:g.x,y:g.y},false,{всегда:true,голос:g.голос}),false);
  if(!ok)narrate(`${g.кто[0].toUpperCase()+g.кто.slice(1)} ${g.имя}: «${строка}»`,{interrupt:false});
  else safeFn(()=>sub(`${g.кто[0].toUpperCase()+g.кто.slice(1)} ${g.имя}: «${строка}»`,"speech"));
  return ok;},
 /* шаг стражника слышен с его стороны */
 шагЗвук(g,i){safeFn(()=>{const dx=g.x-G.x,dy=g.y-G.y;if(Math.max(Math.abs(dx),Math.abs(dy))>8)return;
  Spatial.role("step_dirt",dx,dy,{gain:0.32,maxSec:0.6})||Bank.play("step_dirt",{gain:0.25,maxSec:0.6});
  if(i===0&&Math.random()<0.4)setTimeout(()=>safeFn(()=>Spatial.role("gear_guard_mail",dx,dy,{gain:0.25,maxSec:0.9})),180);});},
 далеко(){const g=this.страж(0);return g?Math.max(Math.abs(G.x-g.x),Math.abs(G.y-g.y)):99;},
 такт(){
  const st=G.дозор;if(!st||!st.идёт)return;
  /* бой, открытое окно или игра на паузе — дозор ждёт */
  if(G.inCombat||!safeFn(()=>gameActive(),true)||safeFn(()=>activeLayer(),null)){this.пуск();return;}
  if(st.драка){st.драка=false;setTimeout(()=>safeFn(()=>this.сказать(this.страж(0),"guard","Тихо сегодня. Даже слишком тихо.")),600);}
  if(G.place){this.бросить("вы зашли под крышу, а дозор ушёл дальше без вас");return;}
  const d=this.далеко();
  if(d>this.УШЁЛ){this.бросить("вы отстали больше чем на двенадцать шагов, и дозор ушёл без вас");return;}
  const L=st.стража[0],S=st.стража[1],p=st.посты[st.пост];
  if(d>this.ЖДАТЬ){
   /* десятник ждёт и зовёт */
   if(Date.now()-st.зов>7000){st.зов=Date.now();
    this.сказать(L,"patrol",Math.random()<0.5?"Шагом марш! Не растягиваться!":"Левой! Левой! Держать строй!");
    narrate(`Десятник ${L.имя} ждёт вас: ${stepWords(d)}, ${dirAtWord(L.x-G.x,L.y-G.y)}.`,{interrupt:false,cat:"approach"});}
   this.пуск();return;}
  if(p&&(L.x!==p.x||L.y!==p.y)){
   const пред={x:L.x,y:L.y};L.x+=Math.sign(p.x-L.x);L.y+=Math.sign(p.y-L.y);
   if(S.x!==пред.x||S.y!==пред.y){S.x=пред.x;S.y=пред.y;this.шагЗвук(S,1);}
   this.шагЗвук(L,0);
   /* дорогой стража переговаривается */
   if(Date.now()>st.болтовня){st.болтовня=Date.now()+16000+Math.random()*10000;
    const строки=["Тихо сегодня. Даже слишком тихо.","Смена кончается, а ночь только начинается.","Кто без огня после заката — того спрашиваем.",
     "Третий обход за день. Ноги гудят.","Пристанет кто — кричи. Мы рядом.","Слыхал, за стеной волков видели. Держись дорог."];
    this.сказать(Math.random()<0.6?L:S,"guard",this.выбрать(строки,"болтовня"));}}
  else if(p&&d<=2)this.пост(p);
  this.пуск();},
 пост(p){
  const st=G.дозор;if(!st||p.готов)return;p.готов=true;const L=st.стража[0];
  if(p.конец){this.конец();return;}
  safeFn(()=>Spatial.role("gear_guard_thud",L.x-G.x,L.y-G.y,{gain:0.5,maxSec:1.2}));
  const ночные=["Стой! Кто идёт? А, путник. Ступай.","Тише. Город спит.","Держись света. В тени нынче неспокойно.","Ночь длинная, а смена ещё длиннее.","Ступай. Ночной дозор своё дело знает."];
  const тревога=st.тревог<2&&Math.random()<0.3;
  if(!тревога){this.сказать(L,"guard_night",this.выбрать(ночные,"пост"));
   narrate(`Пост ${p.n}: ${this.выбрать(ДОЗОР_ИТОГ,"итог")}. ${this.осталось()}`,{interrupt:false});}
  else this.тревога(p);
  st.пост++;safeFn(()=>saveGame(true));},
 осталось(){const st=G.дозор;const n=st.посты.filter(x=>!x.готов&&!x.конец).length;return n?`Осталось постов: ${n}.`:"Посты обойдены — назад к воротам.";},
 тревога(p){
  const st=G.дозор;st.тревог++;st.драка=true;const lvl=Math.max(1,Number(G.level)||1);const L=st.стража[0];
  this.сказать(L,"guard","Слышал шум у дальнего квартала? Проверю.");
  const волк=Math.random()<0.4;
  setTimeout(()=>safeFn(()=>{
   if(волк){narrate(`Пост ${p.n}: у загонов рычит волк — кидается на стражу!`,{interrupt:true});
    startCombat({x:G.x,y:G.y,monster:{id:"wolf",n:"Серый волк",snd:"mgrowl",fx:"growl",lvl,hp:20+lvl*7,dmg:3+lvl,xp:14+lvl*6,gold:0}});}
   else{narrate(`Пост ${p.n}: во тьме шорох — лихие люди лезут через плетень!`,{interrupt:true});
    startCombat({x:G.x,y:G.y,monster:{id:"bandit",n:"Лихой человек",snd:"mgrowl",fx:"growl",lvl,hp:26+lvl*9,dmg:4+lvl,xp:20+lvl*10,gold:8+lvl*3}});}}),1400);},
 конец(){
  const st=G.дозор;if(!st||!st.идёт)return;const где=st.где;const lvl=Math.max(1,Number(G.level)||1);
  const плата=6+Math.round(lvl/2)+st.тревог*4;const xp=xpGain(12+lvl+st.тревог*6);
  G.gold=(Number(G.gold)||0)+плата;G.xp=(Number(G.xp)||0)+xp;safeFn(()=>checkLevelUp());
  let было=0,стало=0;const плюс=8+st.тревог*3;
  if(где.тип==="village"&&typeof Хозяйство170!=="undefined"){[было,стало]=Хозяйство170.поднять(где.имя,плюс);
   safeFn(()=>{Хозяйство170.ст()[где.имя+":dozor"]=Хозяйство170.сейчас();});}
  else{было=safeFn(()=>standOf("city",где.имя),0)||0;safeFn(()=>addStand("city",где.имя,плюс,true));стало=safeFn(()=>standOf("city",где.имя),0)||0;}
  st.кд[где.x+","+где.y]=this.час();st.идёт=false;st.сделано=(Number(st.сделано)||0)+1;clearTimeout(this._t);
  safeFn(()=>TargetBeacon.t&&TargetBeacon.t.дозор&&TargetBeacon.stop(true));
  safeFn(()=>Bank.play("guard_shout",{gain:0.5,maxSec:2.5}));
  this.сказать(st.стража[0],"guard_friend","Своим у нас всегда рады.");
  safeFn(()=>journal(`Ночной дозор окончен: ${где.имя}. Плата ${плата}, опыт ${xp}.`));
  narrate(`Дозор окончен: посты обойдены, ворота «${где.имя}» на месте. Десятник отдаёт плату — ${плата} ${plural(плата,"золотой","золотых","золотых")}. Опыт +${xp}. Отношение: было ${было}, стало ${стало}.`,{interrupt:false});
  safeFn(()=>{saveGame(true);refresh();});},
 бросить(почему){const st=G.дозор;if(!st||!st.идёт)return;st.идёт=false;clearTimeout(this._t);
  safeFn(()=>TargetBeacon.t&&TargetBeacon.t.дозор&&TargetBeacon.stop(true));
  st.кд[st.где.x+","+st.где.y]=this.час();
  narrate(`Ночной дозор: ${почему}.`,{interrupt:true});safeFn(()=>saveGame(true));},
 /* навестись на стражника: маяк дозора за ним */
 навестись(i,тихо){const g=this.страж(i);if(!g){if(!тихо)narrate("Вы не в дозоре: навестись не на кого.",{interrupt:true});return false;}
  const n=`${g.кто} ${g.имя}`;
  safeFn(()=>TargetBeacon.start({n,род:"стража",x:g.x,y:g.y,живое:true,дозор:true,кто:Number(i)||0,bid:"guard"}));
  const d=Math.max(Math.abs(g.x-G.x),Math.abs(g.y-G.y));
  if(!тихо||d)narrate(`Маяк дозора: ${n}${d?`, ${stepWords(d)}, ${dirAtWord(g.x-G.x,g.y-G.y)}`:", рядом с вами"}. Звон кольчуги — с его стороны.`,{interrupt:true,cat:"approach"});
  return true;},
 /* окно «Ночной дозор» */
 окно(){
  const st=G.дозор;
  if(!this.идёт()){const c=this.поселение();const why=this.почему(c);
   return выбор147("Ночной дозор",why?`Выйти в дозор сейчас нельзя: ${why}.`:`Стража «${this.имя(c)}» собирается в ночной обход: пять постов вокруг поселения. Пойдёте с ними?`,
    why?[{l:"Отойти",run:()=>narrate("Вы отошли.",{interrupt:true})}]:[{l:"Выйти в ночной дозор",run:()=>this.начать(c,"меню")},{l:"Отойти",run:()=>narrate("Вы отошли.",{interrupt:true})}]);}
  const L=st.стража[0],S=st.стража[1],p=st.посты[st.пост];const d=this.далеко();
  const где=p?`Следующий: ${p.n}, ${stepWords(Math.max(Math.abs(p.x-G.x),Math.abs(p.y-G.y)))}, ${dirAtWord(p.x-G.x,p.y-G.y)||"здесь"}.`:"";
  return выбор147("Ночной дозор",`${st.где.имя}: десятник ${L.имя} — ${d?stepWords(d)+", "+dirAtWord(L.x-G.x,L.y-G.y):"рядом"}. ${this.осталось()} ${где}`,[
   {l:`Навестись на десятника ${L.имя}`,run:()=>this.навестись(0)},
   {l:`Навестись на стражника ${S.имя}`,run:()=>this.навестись(1)},
   {l:"Спросить десятника, всё ли спокойно",run:()=>this.сказать(L,"guard_night","Ступай. Ночной дозор своё дело знает.")},
   {l:"Покинуть дозор",run:()=>this.бросить("вы покинули дозор, и стража пошла дальше без вас")},
   {l:"Закрыть",run:()=>narrate("Дозор идёт дальше.",{interrupt:true})}]);}};
CMD.dozor=function(){return Дозор.окно();};
CMD.dozorbeacon=function(i){return Дозор.навестись(Number(i)||0);};

/* ── маяк дозора: идёт за стражником и звенит кольчугой ── */
safeFn(()=>{const TB=TargetBeacon;const st0=TB.start,tk0=TB.tick,pg0=TB.ping,rp0=TB.report;
 TB.start=function(t){if(!(t&&t.дозор))return st0.apply(this,arguments);
  this.stop(true);this.t={...t,place:this.here()};this.n=0;this.lastD=null;
  /* свой звук и у запуска: звон кольчуги и удар древка, а не колокольчик обычного маяка */
  safeFn(()=>{if(!settings.effects)return;Bank.play("gear_guard_mail",{gain:0.9,maxSec:1.4,kind:"ui"});
   setTimeout(()=>safeFn(()=>Bank.play("gear_guard_thud",{gain:0.8,maxSec:1,kind:"ui"})),260);this.lastCue={что:"start",дозор:true,t:Date.now()};});
  if(this.mode()==="constant")this.timer=setTimeout(()=>this.tick(),900);return true;};
 TB.tick=function(){const t=this.t;if(!(t&&t.дозор))return tk0.apply(this,arguments);
  clearTimeout(this.timer);this.timer=null;
  const g=Дозор.страж(t.кто);if(!g||G.place){this.t=null;return;}
  t.x=g.x;t.y=g.y;if(this.mode()!=="constant")return;
  if(!safeFn(()=>gameActive(),true)){this.timer=setTimeout(()=>this.tick(),1500);return;}
  const r=this.rel();
  /* «Вы рядом» — в первый раз и после того, как отставали больше чем на три шага; дальше рядом идут молча */
  if(r.d<=1){if(!t.рядом){t.рядом=true;if(!t.сказаноРядом||t.отставал){t.сказаноРядом=true;t.отставал=false;narrate(`Вы рядом: ${t.n}.`,{interrupt:false,cat:"approach"});}}}
  else{t.рядом=false;if(r.d>3)t.отставал=true;if(!G.inCombat&&!safeFn(()=>activeLayer(),null)){this.n++;this.ping(r);}}
  this.lastD=r.d;this.timer=setTimeout(()=>this.tick(),this.gap(Math.max(2,r.d)));};
 TB.ping=function(r,голосом){const t=this.t;if(!(t&&t.дозор))return pg0.apply(this,arguments);if(!r)return;
  safeFn(()=>{const f=Bank.pick("gear_guard_mail",this.n);
   if(!(f&&Spatial.at(f,r.dx,r.dy,{gain:1,maxSec:1.2,kind:"ui",roll:0.55,occl:0})))beaconAt("guard",r.dx,r.dy,0,r.d);
   this.lastPing={дозор:true,file:f,t:Date.now()};});};
 TB.report=function(){const t=this.t;if(!(t&&t.дозор))return rp0.apply(this,arguments);
  const g=Дозор.страж(t.кто);if(!g){this.t=null;return "";}t.x=g.x;t.y=g.y;const r=this.rel();if(!r)return "";
  if(this.mode()==="gesture"){this.n++;setTimeout(()=>this.ping(r),350);}
  return `${t.n}: ${r.d?stepWords(r.d)+", "+dirAtWord(r.dx,r.dy):"рядом с вами"}.`;};});
/* B — где цель маяка: в дозоре без цели — навестись на десятника; на стражника — где он сейчас */
safeFn(()=>{if(typeof beaconWhere!=="function")return;const b0=beaconWhere;beaconWhere=matKeep(b0,function(){
 const t=safeFn(()=>TargetBeacon.t,null);
 if(Дозор.идёт()&&(!t||t.дозор)){
  if(!t)return Дозор.навестись(0);
  const g=Дозор.страж(t.кто);if(!g)return b0.apply(this,arguments);t.x=g.x;t.y=g.y;const r=TargetBeacon.rel();
  TargetBeacon.n++;setTimeout(()=>safeFn(()=>TargetBeacon.ping(r)),300);
  narrate(`${t.n}: ${r.d?stepWords(r.d)+", "+dirAtWord(r.dx,r.dy):"рядом с вами"}.`,{interrupt:true,cat:"approach",user:true});return true;}
 return b0.apply(this,arguments);});});
/* стражники дозора — живые цели в осмотре */
safeFn(()=>{const s0=Look.scan;Look.scan=function(rad){const out=s0.apply(this,arguments);
 try{if(Дозор.идёт()&&!G.place)G.дозор.стража.forEach((g,i)=>{const dx=g.x-G.x,dy=g.y-G.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(d>12)return;
  out.push({n:`${g.кто} ${g.имя} (ночной дозор)`,род:"стража",x:g.x,y:g.y,dx,dy,d,dir:d?dirBetween(dx,dy):"здесь",bid:"guard",живое:true,дозор:true,кто:i});});}catch(_){}
 return out;};});
/* «Постоять в ночном дозоре» в деревне — теперь настоящий обход */
safeFn(()=>{if(typeof Хозяйство170==="undefined")return;const р=Хозяйство170.РАБОТЫ.find(x=>x.id==="dozor");if(р){р.n="Выйти в ночной дозор со стражей";р.часов=3;}
 const s0=Хозяйство170.сделать;Хозяйство170.сделать=function(id){if(id!=="dozor")return s0.apply(this,arguments);
  const з=this.здесь();if(!з)return false;const why=this.почему(this.РАБОТЫ.find(x=>x.id==="dozor"),з.имя);
  if(why){narrate(`Ночной дозор: ${why}.`,{interrupt:true});return false;}
  return Дозор.начать(з.c,"деревня");};});
/* у ворот ночью — пойти с дозором */
safeFn(()=>{if(typeof Стража147==="undefined")return;const v0=Стража147.встреча;Стража147.встреча=function(c){Дозор._ворота=c;try{return v0.apply(this,arguments);}finally{Дозор._ворота=null;}};
 const w0=выбор147;выбор147=matKeep(w0,function(title,text,choices){
  try{const c=Дозор._ворота;if(c&&/^Ворота: /.test(String(title))&&Array.isArray(choices)&&Дозор.ночь()&&!Дозор.идёт()&&!Дозор.почему(c)){
   const i=Math.max(0,choices.length-1);choices=choices.slice();choices.splice(i,0,{l:"Пойти с ночным дозором вокруг стен",run:()=>Дозор.начать(c,"ворота")});}}catch(_){}
  return w0.call(this,title,text,choices);});});
/* меню действий: «Квесты» → «Ночной дозор» — ночью у поселения и пока идёт обход */
safeFn(()=>{const g=AM_GROUPS.find(x=>x[2]&&x[2].id==="quests")||AM_GROUPS.find(x=>x[0]==="Квесты");if(g&&!g[1].some(z=>z[0]==="dozor"))g[1].push(["dozor","Ночной дозор"]);
 const a0=amAvailable;amAvailable=matKeep(a0,function(cmd){if(cmd==="dozor")return Дозор.доступен();return a0.apply(this,arguments);});});
/* загрузка сохранения посреди обхода: дозор продолжает путь */
safeFn(()=>{if(typeof loadGame!=="function")return;const l0=loadGame;loadGame=matKeep(l0,function(){const r=l0.apply(this,arguments);
 safeFn(()=>{if(Дозор.идёт())Дозор.пуск();});return r;});});

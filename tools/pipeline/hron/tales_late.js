/* ════════════════════════════════════════════════════════════════════
   СЮЖЕТЫ МИРА (14.5, ФАЗА VII «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Задания рождаются из настоящего состояния мира, а не из списка: спор о
   престоле (Throne), война держав (warsAt), нехватка товара на рынке
   державы (marketPrice), живое морское чудище (Mater), гаснущее ядро
   Вальтерна (LiveCity). У каждого сюжета несколько путей — и почти ни
   один не «убить главного врага»: переговоры, грамоты из архива,
   снабжение, ввоз, предупреждение гаваней, кристаллы для ядра. Мир не
   ждёт героя: спор решается сам, война кончается, купцы справляются,
   чудище топит суда, гильдия зажигает ядро — и сюжет закрывается тем,
   что случилось. Исход — последствия в мире (отношения держав, цены,
   летопись, молва) и ПАМЯТЬ ЖИТЕЛЕЙ: в державе помнят, что сделал герой,
   говорят об этом, торгуют иначе. Вести можно ПРОВЕРИТЬ: свидетели,
   документы архива, расследование на месте, сопоставление двух вестей.
   В сохранении — G.tales: сюжеты (до тридцати), память, перемирия.
   ════════════════════════════════════════════════════════════════════ */
const TALE_KINDS={
 престол:{n:"спор о престоле",пути:[["поддержать","поддержать претендента при дворе — пока он не возьмёт престол"],["примирить","примирить стороны в престольном городе"],["грамота","найти в архивах Кассара грамоту о праве и предъявить её при дворе"]]},
 война:{n:"война держав",пути:[["мир","отвезти мирные дары в обе столицы — сто золота в каждую"],["снабжение","продать товара на триста золота в городах одной из сторон"],["оружие","одержать три победы на земле одной из сторон"]]},
 дефицит:{n:"нехватка товара",пути:[["привезти","продать на рынке этой державы пять мер нужного товара"],["ввоз","оплатить купцам ввоз в столице державы — сто пятьдесят золота"]]},
 чудище:{n:"морское чудище",пути:[["одолеть","одолеть чудище в его водах"],["гавани","предупредить две гавани материков, чтобы суда обходили его воды"]]},
 ядро:{n:"гаснущее ядро",пути:[["зарядить","зарядить ядро в самом Вальтерне двумя кристаллами"],["гильдия","продать в Вальтерне три кристалла гильдии артефакторов"]]}};
const TALE_SURE={свидетели:"свидетели",документы:"документы архива",место:"расследование на месте",сличение:"сопоставление двух вестей"};
const Tales={
 st(){if(!G.tales||typeof G.tales!=="object")G.tales={};const s=G.tales;if(!Array.isArray(s.list))s.list=[];if(!Array.isArray(s.пам))s.пам=[];
  for(const k of ["seen","продано","победы","мир"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};return s;},
 day(){return Number(G.day)||1;},
 q(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));},
 btn(cmd,label){return `<button type="button" class="item" data-cmd="tl:${cmd}" data-speak="${this.q(label)}">${this.q(label)}</button>`;},
 active(){return this.st().list.filter(T=>!T.исход);},
 byId(id){return this.st().list.find(T=>T.id===id)||null;},
 E(i){return EMPIRES[i]||EMPIRES[0];},
 hereRealm(){return Math.max(0,safeFn(()=>empireIndexAt(G.place?G.place.bx:G.x,G.place?G.place.by:G.y),0));},
 inCity(){return !!safeFn(()=>isCityAt(G.place?G.place.bx:G.x,G.place?G.place.by:G.y),false);},
 atCapital(i){return !!safeFn(()=>Throne.atCapital(i),false);},
 /* сюжет зовёт того, кто рядом: о дальних бедах герой узнаёт молвой */
 near(x,y,R){return Math.max(Math.abs(x-G.x),Math.abs(y-G.y))<=R;},
 /* ── РОЖДЕНИЕ ── из настоящего состояния мира; не больше одного нового в день и шести открытых */
 open(вид,k,o){const s=this.st();if(s.seen[k])return null;if(this.active().length>=6)return null;
  const T=Object.assign({id:"tl"+this.day()+"_"+(s.list.length+1),вид,k,d0:this.day(),пути:{},исход:null},o);s.list.push(T);s.seen[k]=this.day();
  if(s.list.length>30)s.list.splice(0,s.list.length-30);safeFn(()=>journal(`Сюжет мира: ${T.n}. ${T.причина}`));
  safeFn(()=>rumorSeed("сюжет",T.n,T.x,T.y,true));return T;},
 find(){const d=this.day(),s=this.st();
  /* спор о престоле */
  for(let i=0;i<EMPIRES.length;i++){const C=safeFn(()=>Throne.crisis(i),null);if(!C)continue;const k="престол:"+i+":"+C.нач;if(s.seen[k])continue;
   const c=this.E(i).cap;if(!this.near(c.x,c.y,300000)&&i!==this.hereRealm())continue;return this.open("престол",k,{i,x:c.x,y:c.y,n:`Спор о престоле державы «${this.E(i).short}»`,причина:`${C.cl[0].n} и ${C.cl[1].n} делят престол; дома встали за обоих`,срок:d+90,кл:[C.cl[0].n,C.cl[1].n]});}
  /* война */
  {const W=safeFn(()=>warsAt(d),[])||[];for(const w of W){const k="война:"+Math.min(w.a,w.b)+":"+Math.max(w.a,w.b);if(s.seen[k])continue;const c=this.E(w.a).cap,c2=this.E(w.b).cap;
   if(!this.near(c.x,c.y,300000)&&!this.near(c2.x,c2.y,300000)&&![w.a,w.b].includes(this.hereRealm()))continue;
   return this.open("война",k,{i:w.a,j:w.b,x:c.x,y:c.y,n:`Война: «${this.E(w.a).short}» и «${this.E(w.b).short}»`,причина:"старая вражда переросла в набеги и осады; деревни горят с обеих сторон",срок:d+60});}}
  /* нехватка товара: цена на рынке державы выше полутора обычных */
  {const i=this.hereRealm();for(const r of LAND_RES){const v=safeFn(()=>marketPrice(r,i,d),0),b=Number(RES_BASE[r])||0;if(!(b>0&&v>=b*1.6))continue;const k="дефицит:"+i+":"+r+":"+Math.floor(d/30);if(s.seen[k])continue;
   const c=this.E(i).cap;return this.open("дефицит",k,{i,res:r,x:c.x,y:c.y,n:`Нехватка: ${r} в державе «${this.E(i).short}»`,причина:`${r} стоит здесь ${v} золота — втрое выше обычного не бывало давно; пути подвоза встали`,срок:d+15,цена0:v});}}
  /* морское чудище */
  for(const m of (typeof MAT_MONSTERS!=="undefined"?MAT_MONSTERS:[])){const st=safeFn(()=>Mater.mon(m.id),null);if(!st||st.убит)continue;const k="чудище:"+m.id;if(s.seen[k])continue;
   const c=safeFn(()=>Mater.monPos(m),{x:G.x,y:G.y});if(!this.near(c.x,c.y,3000000))continue;return this.open("чудище",k,{м:m.id,x:c.x,y:c.y,n:`Чудище: ${m.n}`,причина:`${m.n} топит суда в своих водах; моряки боятся выходить`,срок:d+25,гавани:[]});}
  /* гаснущее ядро Вальтерна */
  if(typeof LiveCity!=="undefined"&&safeFn(()=>LiveCity.core(),100)<30){const k="ядро:"+Math.floor(d/20);if(!s.seen[k]){const v=LiveCity.named("valtern");
   return this.open("ядро",k,{x:v.x,y:v.y,n:"Гаснет ядро Вальтерна",причина:"ток ядра слабеет, мосты между кварталами обесточены; гильдия артефакторов не справляется",срок:d+10});}}
  return null;},
 /* ── ХОД ДНЯ ── мир доходит до развязки и без героя */
 tick(){const s=this.st();if(s.дн===this.day())return;s.дн=this.day();safeFn(()=>this.find());for(const T of this.active())safeFn(()=>this.step(T));},
 step(T){const d=this.day(),s=this.st();
  if(T.вид==="престол"){if(safeFn(()=>Throne.crisis(T.i),null))return;const R=safeFn(()=>Throne.ruler(T.i),null),кто=R?R.n:"";
   const infl=(Throne.st().infl||{})[T.i+":"+кто]||0;
   if(T.пути.примирить)return this.end(T,"примирить",`Герой примирил стороны; на престоле — ${кто}.`,+1);
   if(T.пути.грамота&&T.пути.грамота.предъявлена&&T.пути.грамота.за===кто)return this.end(T,"грамота",`Грамота о праве решила спор: на престоле — ${кто}.`,+1);
   if(infl>=25)return this.end(T,"поддержать",`Претендент, за которого стоял герой, взял престол: ${кто}.`,+1);
   return this.end(T,null,`Спор решился без вас: на престоле — ${кто||"новый государь"}.`,0);}
  if(T.вид==="война"){const идёт=safeFn(()=>warsAt(d).some(w=>(w.a===T.i&&w.b===T.j)||(w.a===T.j&&w.b===T.i)),false);
   const p=T.пути;if(p.мир&&p.мир.a&&p.мир.b&&!идёт)return this.end(T,"мир",`Мирные дары героя сделали своё: «${this.E(T.i).short}» и «${this.E(T.j).short}» заключили мир.`,+1);
   for(const сторона of [T.i,T.j]){const снаб=(Number(s.продано["зол:"+сторона])||0)-(Number(T.пр0&&T.пр0[сторона])||0),побед=(Number(s.победы[сторона])||0)-(Number(T.поб0&&T.поб0[сторона])||0);
    if(снаб>=300||побед>=3){const враг=сторона===T.i?T.j:T.i;safeFn(()=>{G.diplo=G.diplo||{};const key=diploKey(T.i,T.j);G.diplo[key]=Math.min(40,(G.diplo[key]||0)+30);});
     safeFn(()=>addStand("fact",this.E(сторона).short,8));safeFn(()=>addStand("fact",this.E(враг).short,-8));
     return this.end(T,снаб>=300?"снабжение":"оружие",`С помощью героя «${this.E(сторона).short}» взяла верх над «${this.E(враг).short}»; война идёт к концу.`,+1,сторона,враг);}}
   if(!идёт)return this.end(T,null,`Война «${this.E(T.i).short}» и «${this.E(T.j).short}» кончилась сама.`,0);
   if(d>=T.срок)return this.end(T,null,"Война затянулась; о ней больше не говорят как о деле, которое можно решить.",0);return;}
  if(T.вид==="дефицит"){const v=safeFn(()=>marketPrice(T.res,T.i,d),0),b=Number(RES_BASE[T.res])||1;
   if((Number(s.продано[T.i+":"+T.res])||0)-(Number(T.пр0)||0)>=5)return this.end(T,"привезти",`Герой привёз ${T.res}: рынок державы «${this.E(T.i).short}» вздохнул.`,+1);
   if(T.пути.ввоз)return this.end(T,"ввоз",`Ввоз, оплаченный героем, пришёл: ${T.res} снова на прилавках.`,+1);
   if(v<b*1.3||d>=T.срок)return this.end(T,null,`Купцы справились без вас: ${T.res} снова в продаже.`,0);return;}
  if(T.вид==="чудище"){const st=safeFn(()=>Mater.mon(T.м),{});if(st.убит)return this.end(T,T.пути.одолеть?"одолеть":null,T.пути.одолеть?"Герой одолел чудище: моряки снова выходят в море.":"Чудище убил кто-то другой.",T.пути.одолеть?+1:0);
   if((T.гавани||[]).length>=2)return this.end(T,"гавани","Гавани предупреждены: суда обходят воды чудища, и топить ему больше некого.",+1);
   if(d>=T.срок){T.беда=d+10;return this.end(T,null,"Чудище потопило караван судов: морской товар — ракушки — подорожал.",-1);}return;}
  if(T.вид==="ядро"){const c=safeFn(()=>LiveCity.core(),100);
   if(T.пути.зарядить&&c>=30)return this.end(T,"зарядить","Герой зарядил ядро: мосты Вальтерна снова под током.",+1);
   if((Number(s.продано[LiveCity.realm(LC_BY_ID.valtern)+":кристалл"])||0)-(Number(T.пр0)||0)>=3){const st=LiveCity.st().ядро;st.з=60;st.д=d;return this.end(T,"гильдия","Гильдия артефакторов получила кристаллы героя и зажгла ядро.",+1);}
   if(c>=30)return this.end(T,null,"Ядро зажгли без вас.",0);
   if(d>=T.срок){const st=LiveCity.st().ядро;st.з=50;st.д=d;T.дорого=d+10;return this.end(T,null,"Гильдия сама зажгла ядро — втридорога: артефакторы подняли цены.",0);}}},
 /* ── РАЗВЯЗКА ── последствия и память */
 end(T,путь,текст,тон,за,против){T.исход={путь,д:this.day(),текст,тон};const s=this.st();
  if(путь){const i=T.i!=null?(за!=null?за:T.i):this.hereRealm();s.пам.push({д:this.day(),i,t:текст,тон:тон||1});if(s.пам.length>40)s.пам.shift();
   safeFn(()=>addStand("fact",this.E(i).short,5));safeFn(()=>deed("quests"));safeFn(()=>Bank.play("bell_big",{gain:0.5,maxSec:3}));}
  safeFn(()=>Ledger.add("история",текст,"сюжет"));safeFn(()=>rumorSeed("сюжет",текст,T.x,T.y,true));safeFn(()=>journal(`Развязка: ${T.n}. ${текст}`));
  narrate(`Развязка сюжета «${T.n}»: ${текст}`,{interrupt:false});return true;},
 /* ── ДЕЛА ГЕРОЯ ── пути, у которых есть своё действие */
 act(id,что){const T=this.byId(id);if(!T||T.исход){narrate("Этот сюжет уже закрыт.");return false;}const s=this.st(),d=this.day();
  if(T.вид==="престол"&&что==="архив"){const v=safeFn(()=>NAMED_CITIES.find(c=>c.id==="kassar"),null);const тут=v&&(G.place?G.place.bx===v.x&&G.place.by===v.y:Math.max(Math.abs(G.x-v.x),Math.abs(G.y-v.y))<=2);
   if(!тут){narrate("Грамоты о праве хранят архивы Кассара: идите туда.");return false;}if((Number(G.gold)||0)<50){narrate("Хранители просят пятьдесят золота за поиск.");return false;}
   const C=safeFn(()=>Throne.crisis(T.i),null);if(!C){narrate("Спор уже решён.");return false;}G.gold-=50;const k=C.cl[0].l>=C.cl[1].l?0:1;T.пути.грамота={за:C.cl[k].n,есть:true};
   safeFn(()=>Bank.play("arte_page",{gain:0.6,maxSec:3}));narrate(`В архиве нашлась грамота: право на престол — за ${C.cl[k].n}. Предъявите её при дворе державы «${this.E(T.i).short}».`);return true;}
  if(T.вид==="престол"&&что==="предъявить"){const g=T.пути.грамота;if(!g||!g.есть){narrate("Сначала найдите грамоту в архивах Кассара.");return false;}if(!this.atCapital(T.i)){narrate("Грамоту предъявляют при дворе — в престольном городе.");return false;}
   const C=safeFn(()=>Throne.crisis(T.i),null);if(!C){narrate("Спор уже решён.");return false;}const c=C.cl.find(x=>x.n===g.за);if(!c){narrate("Того претендента уже нет в споре.");return false;}
   c.д=Math.min(99,c.д+20);C.cl.find(x=>x!==c).д=100-c.д;g.есть=false;g.предъявлена=d;safeFn(()=>Bank.play("bell_small",{gain:0.6,maxSec:3}));
   narrate(`Грамота прочитана при дворе: дома переходят к ${c.n}, доля — ${c.д} из ста.`);return true;}
  if(T.вид==="война"&&что==="дары"){const p=T.пути.мир=T.пути.мир||{};const где=this.atCapital(T.i)?"a":this.atCapital(T.j)?"b":null;if(!где){narrate(`Мирные дары везут в столицы: «${this.E(T.i).short}» и «${this.E(T.j).short}».`);return false;}
   if(p[где]){narrate("Здесь дары уже приняты.");return false;}if((Number(G.gold)||0)<100){narrate("Мирные дары — сто золота.");return false;}G.gold-=100;p[где]=d;
   if(p.a&&p.b)safeFn(()=>{G.diplo=G.diplo||{};const key=diploKey(T.i,T.j);G.diplo[key]=Math.min(40,(G.diplo[key]||0)+35);});
   narrate(p.a&&p.b?"Дары приняты обеими сторонами: послы садятся за стол.":"Дары приняты; теперь — во вторую столицу.");return true;}
  if(T.вид==="дефицит"&&что==="ввоз"){if(!this.atCapital(T.i)){narrate(`Ввоз оплачивают купцам в столице державы «${this.E(T.i).short}».`);return false;}if((Number(G.gold)||0)<150){narrate("Ввоз — сто пятьдесят золота.");return false;}
   G.gold-=150;T.пути.ввоз=d;narrate("Купцы взяли плату: обоз с товаром уже в пути.");return true;}
  narrate("Этот путь проходят делом в мире: окно сюжета говорит, каким.");return false;},
 /* ── ПАМЯТЬ ЖИТЕЛЕЙ ── что помнят о герое в этой державе */
 memory(i){const d=this.day();return this.st().пам.filter(m=>m.i===i&&d-m.д<=60);},
 memoryLine(i){const M=this.memory(i);if(!M.length)return "";const m=M[M.length-1];return m.тон>0?`Здесь помнят: ${m.t.replace(/\.$/,"")}. Вам здесь рады.`:`Здесь помнят: ${m.t.replace(/\.$/,"")}. К вам здесь холодны.`;},
 /* ── ПРОВЕРКА ВЕСТЕЙ ── свидетели, документы, место, сопоставление */
 verify(rid,как){const r=(G.rumors||[]).find(x=>x.id===rid);if(!r){narrate("Этой вести здесь больше нет.");return false;}if(r.проверено){narrate(`Весть уже проверена: ${RUMOR_CLASS_BY_ID[r.проверено].n} (${TALE_SURE[r.как]||r.как}).`);return false;}
  const род=rumorClass(r);let ок=null;
  if(как==="место"){if(Math.max(Math.abs(G.x-r.x),Math.abs(G.y-r.y))>20){narrate(`Расследуют там, где всё случилось: ${safeFn(()=>dirFromDelta(r.x-G.x,r.y-G.y),"далеко")}, ${Math.max(Math.abs(G.x-r.x),Math.abs(G.y-r.y))} шагов.`);return false;}ок=род.id;}
  else if(как==="документы"){if(!this.inCity()){narrate("Документы смотрят в городском архиве.");return false;}if(this.day()-(Number(r.д0)||this.day())<2){narrate("О такой свежей вести записей ещё нет: приходите через пару дней.");return false;}
   if((Number(G.gold)||0)<30){narrate("Писцы архива берут тридцать золота.");return false;}G.gold-=30;ок=род.id;}
  else if(как==="свидетели"){const i=this.hereRealm();if(!this.inCity()&&!safeFn(()=>(cellContent(G.x,G.y).structure||{}).type==="village",false)){narrate("Свидетелей ищут в городах и деревнях.");return false;}
   if(Number(r.держава)!==i){narrate("Свидетели — в той державе, откуда весть.");return false;}if((Number(G.gold)||0)<10){narrate("Свидетели развязывают язык за десять золота.");return false;}G.gold-=10;
   /* свидетели честны, но слышали то, что им сказали: подброшенную весть они считают частично правдивой */
   ок=род.id==="manip"?"partial":род.id;}
  else if(как==="сличение"){const друг=(G.rumors||[]).find(x=>x!==r&&x.в===r.в&&Number(x.держава)!==Number(r.держава));if(!друг){narrate("Сличать не с чем: нужна вторая весть о том же из другой державы.");return false;}
   ок=род.id;друг.проверено=друг.проверено||rumorClass(друг).id;друг.как=друг.как||"сличение";}
  else{narrate("Так вести не проверяют.");return false;}
  r.проверено=ок;r.как=как;safeFn(()=>Bank.play("arte_page",{gain:0.45,maxSec:2}));
  narrate(`Весть «${rumorText(r).текст}» проверена (${TALE_SURE[как]}): ${RUMOR_CLASS_BY_ID[ок].n} — ${RUMOR_CLASS_BY_ID[ок].о}.${ок!==род.id?" Но свидетели могли слышать то, что им нарочно сказали.":""}`);
  if(ок===род.id)safeFn(()=>Ledger.add("история",`проверена весть: «${rumorText(r).текст}» — ${род.n}`,"весть"));return true;},
 /* ── ОКНО ── */
 pathState(T,id){const s=this.st(),p=T.пути;
  if(T.вид==="престол"){if(id==="поддержать")return `ваше влияние за претендентов: ${(T.кл||[]).map(n=>`${n} — ${(Throne.st().infl||{})[T.i+":"+n]||0}`).join(", ")}`;if(id==="грамота")return p.грамота?(p.грамота.есть?`грамота за ${p.грамота.за} у вас — предъявите при дворе`:`грамота предъявлена`):"грамоты нет";if(id==="примирить")return p.примирить?"стороны примирены":"не сделано";}
  if(T.вид==="война"){if(id==="мир"){const m=p.мир||{};return `дары: ${m.a?"первая столица — да":"первая столица — нет"}, ${m.b?"вторая — да":"вторая — нет"}`;}
   if(id==="снабжение")return [T.i,T.j].map(z=>`${this.E(z).short} — ${(Number(s.продано["зол:"+z])||0)-(Number(T.пр0&&T.пр0[z])||0)} из 300`).join(", ");
   if(id==="оружие")return [T.i,T.j].map(z=>`${this.E(z).short} — ${(Number(s.победы[z])||0)-(Number(T.поб0&&T.поб0[z])||0)} из 3`).join(", ");}
  if(T.вид==="дефицит"){if(id==="привезти")return `продано ${(Number(s.продано[T.i+":"+T.res])||0)-(Number(T.пр0)||0)} из 5`;if(id==="ввоз")return p.ввоз?"оплачен":"не оплачен";}
  if(T.вид==="чудище"){if(id==="гавани")return `предупреждено гаваней: ${(T.гавани||[]).length} из 2`;if(id==="одолеть")return "чудище живо";}
  if(T.вид==="ядро"){if(id==="зарядить")return `заряд ядра ${safeFn(()=>LiveCity.core(),0)} из ста`;if(id==="гильдия")return `кристаллов продано ${(Number(s.продано[safeFn(()=>LiveCity.realm(LC_BY_ID.valtern),0)+":кристалл"])||0)-(Number(T.пр0)||0)} из 3`;}
  return "";},
 home(){let m=document.getElementById("modal-tales");
  if(!m){m=document.createElement("div");m.id="modal-tales";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Сюжеты мира");
   m.innerHTML=`<div class="modal-box"><h2>Сюжеты мира</h2><div id="tlBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  const s=this.st();let h=`<p tabindex="0">${this.q("Сюжеты рождаются из того, что происходит в мире, и развиваются без вас. У каждого несколько путей; исход меняет мир и то, что о вас помнят.")}</p>`;
  const A=this.active();h+=`<h3>Открытые (${A.length})</h3>`;if(!A.length)h+=`<p tabindex="0">${this.q("Сейчас мир не зовёт: открытых сюжетов нет.")}</p>`;
  for(const T of A){const K=TALE_KINDS[T.вид];const d=Math.max(Math.abs(T.x-G.x),Math.abs(T.y-G.y));
   h+=`<p tabindex="0">${this.q(`${T.n}. ${T.причина}. Где: ${safeFn(()=>dirFromDelta(T.x-G.x,T.y-G.y),"далеко")}, ${d} ${plural(d,"шаг","шага","шагов")}. Срок мира — ${Math.max(0,T.срок-this.day())} ${plural(Math.max(0,T.срок-this.day()),"день","дня","дней")}.`)}</p>`;
   K.пути.forEach(([id,o])=>{h+=`<p tabindex="0">${this.q(`Путь: ${o}. Сейчас: ${this.pathState(T,id)||"—"}.`)}</p>`;});
   if(T.вид==="престол"){h+=this.btn(`act:${T.id}:архив`,"Искать грамоту в архивах Кассара (50 золота)")+this.btn(`act:${T.id}:предъявить`,"Предъявить грамоту при дворе");}
   if(T.вид==="война")h+=this.btn(`act:${T.id}:дары`,"Отвезти мирные дары (100 золота, в столице)");
   if(T.вид==="дефицит")h+=this.btn(`act:${T.id}:ввоз`,"Оплатить ввоз (150 золота, в столице)");}
  const R=s.list.filter(T=>T.исход).slice(-8).reverse();h+=`<h3>Развязки (${R.length})</h3>`;R.forEach(T=>{h+=`<p tabindex="0">${this.q(`${T.n}: ${T.исход.текст}`)}</p>`;});
  const мл=this.memoryLine(this.hereRealm());if(мл)h+=`<h3>Память жителей</h3><p tabindex="0">${this.q(мл)}</p>`;
  const В=safeFn(()=>rumorsHere(G.x,G.y),[])||[];h+=`<h3>Вести здесь (${В.length})</h3>`;
  В.slice(0,6).forEach(r=>{const t=rumorText(r);h+=`<p tabindex="0">${this.q(`«${t.текст}» — ${r.проверено?`проверено: ${RUMOR_CLASS_BY_ID[r.проверено].n} (${TALE_SURE[r.как]})`:`говорят, что ${t.род}; ${t.откуда}`}.`)}</p>`;
   if(!r.проверено)h+=this.btn(`vr:${r.id}:свидетели`,"Расспросить свидетелей (10 золота)")+this.btn(`vr:${r.id}:документы`,"Поднять документы архива (30 золота, в городе)")+this.btn(`vr:${r.id}:место`,"Расследовать на месте")+this.btn(`vr:${r.id}:сличение`,"Сопоставить с другой вестью");});
  m.querySelector("#tlBody").innerHTML=h;if(m.hidden)openModal("modal-tales");return true;},
 cmd(a){const p=String(a||"").split(":");let ok=false;if(p[0]==="act")ok=this.act(p[1],p[2]);else if(p[0]==="vr")ok=this.verify(p[1],p[2]);
  else{narrate("Такого дела нет: откройте «Сюжеты мира» в разделе «Квесты».");return false;}
  const m=document.getElementById("modal-tales");if(m&&!m.hidden)this.home();return ok;}};
RUMOR_LADDER.сюжет=["говорят: {что}","в тавернах только и разговоров: {что}","говорят, всё решилось иначе, чем рассказывают","говорят, за всем этим стоит кто-то третий","говорят, это только начало большой беды"];
/* ── ВСТРАИВАНИЕ ── */
{const wd9=Director.worldDay;Director.worldDay=matKeep(wd9,function(){const r=wd9.apply(this,arguments);safeFn(()=>Tales.tick());return r;});}
/* Продажи: сколько и чего герой продал в какой державе — для путей «привезти», «снабжение», «гильдия». */
{const sr9=sellResource;sellResource=matKeep(sr9,function(key,res,all){const до=Number((G.inv||{})[res])||0,g0=Number(G.gold)||0;const r=sr9.apply(this,arguments);
 safeFn(()=>{const n=до-(Number((G.inv||{})[res])||0);if(n<=0)return;const i=Tales.hereRealm(),s=Tales.st();s.продано[i+":"+res]=(Number(s.продано[i+":"+res])||0)+n;s.продано["зол:"+i]=(Number(s.продано["зол:"+i])||0)+Math.max(0,(Number(G.gold)||0)-g0);});return r;});}
/* Победы на земле воюющей державы — путь «оружие». */
victory=matKeep(victory,(vi9=>function(){const r=vi9.apply(this,arguments);safeFn(()=>{const i=Tales.hereRealm(),s=Tales.st();s.победы[i]=(Number(s.победы[i])||0)+1;});return r;})(victory));
/* Подстрекательство помнят: двор и люди державы холодеют к герою. */
{const ti9=Throne.incite.bind(Throne);Throne.incite=matKeep(ti9,function(i,k){const ok=ti9(i,k);if(ok)safeFn(()=>{const s=Tales.st();const h=Throne.base(Number(i)).дома[Number(k)];
 s.пам.push({д:Tales.day(),i:Number(i),t:`герой подстрекал ${h?h.n:"знатный дом"} к мятежу`,тон:-1});if(s.пам.length>40)s.пам.shift();});return ok;});}
/* Посредничество — путь «примирить»; гавани материков — путь «гавани»; чудище — «одолеть». */
{const tm9=Throne.mediate.bind(Throne);Throne.mediate=matKeep(tm9,function(i){const ok=tm9(i);if(ok)safeFn(()=>{for(const T of Tales.active())if(T.вид==="престол"&&T.i===Number(i))T.пути.примирить=Tales.day();});return ok;});}
{const aw9=Mater.afterWin.bind(Mater);Mater.afterWin=matKeep(aw9,function(m){const r=aw9(m);safeFn(()=>{if(m&&m.чудище)for(const T of Tales.active())if(T.вид==="чудище"&&T.м===m.чудище)T.пути.одолеть=Tales.day();});return r;});}
{const mv9=move;move=matKeep(mv9,function(){const r=mv9.apply(this,arguments);safeFn(()=>{const h=Mater.harborAt(G.x,G.y,6);if(!h)return;for(const T of Tales.active())if(T.вид==="чудище"&&!(T.гавани||[]).includes(h.n||h.id||(h.x+","+h.y))){(T.гавани=T.гавани||[]).push(h.n||h.id||(h.x+","+h.y));narrate(`Гавань предупреждена о чудище: ${T.гавани.length} из двух.`,{interrupt:false});}});return r;});}
{const lc9=LiveCity.charge.bind(LiveCity);LiveCity.charge=function(){const ok=lc9();if(ok)safeFn(()=>{for(const T of Tales.active())if(T.вид==="ядро")T.пути.зарядить=Tales.day();});return ok;};}
/* Сюжет помнит, с чего начался счёт: прежние продажи и победы не засчитываются. */
{const op9=Tales.open.bind(Tales);Tales.open=function(вид,k,o){const T=op9(вид,k,o);if(T){const s=Tales.st();
 if(вид==="война"){T.пр0={[T.i]:Number(s.продано["зол:"+T.i])||0,[T.j]:Number(s.продано["зол:"+T.j])||0};T.поб0={[T.i]:Number(s.победы[T.i])||0,[T.j]:Number(s.победы[T.j])||0};}
 if(вид==="дефицит")T.пр0=Number(s.продано[T.i+":"+T.res])||0;if(вид==="ядро")T.пр0=Number(s.продано[safeFn(()=>LiveCity.realm(LC_BY_ID.valtern),0)+":кристалл"])||0;}return T;};}
/* Последствия в ценах: облегчение после помощи героя; беда от чудища и дорогое ядро — дороже. */
{const mp9=marketPrice;marketPrice=matKeep(mp9,function(res,idx,day){let v=mp9.apply(this,arguments);if(!Number.isFinite(v))return v;
 safeFn(()=>{const d=Number(day)||Tales.day();for(const T of Tales.st().list){if(!T.исход)continue;
  if(T.вид==="дефицит"&&T.исход.путь&&T.res===res&&Number(idx)===T.i&&d-T.исход.д<=10)v=Math.round(v*0.75);
  if(T.вид==="чудище"&&T.беда>=d&&res==="ракушка")v=Math.round(v*1.25);
  if(T.вид==="ядро"&&T.дорого>=d&&res==="кристалл")v=Math.round(v*1.15);}});return v;});}
/* Память жителей: житель державы помнит дело героя — и торгует соответственно. */
{const sp9=sellPrice;sellPrice=matKeep(sp9,function(res,idx,day,npc){let v=sp9.apply(this,arguments);if(!Number.isFinite(v))return v;
 safeFn(()=>{const M=Tales.memory(Number(idx));if(!M.length)return;v*=M[M.length-1].тон>0?1.05:0.9;});return Math.max(1,Math.round(v));});}
{const on9=openNPC;openNPC=matKeep(on9,function(key,silent,o){const r=on9.apply(this,arguments);safeFn(()=>{if(silent)return;const n=getNPCByKey(key);if(!n)return;const i=empireIndexAt(n.x,n.y);const t=Tales.memoryLine(i);
  if(!t)return;const s=Tales.st();s.сказали=s.сказали||{};const k=key+":"+Tales.day();if(s.сказали[k])return;s.сказали[k]=1;const ks=Object.keys(s.сказали);if(ks.length>60)ks.slice(0,ks.length-60).forEach(z=>delete s.сказали[z]);
  narrate(`${n.name}: ${t}`,{interrupt:false});});return r;});}
/* Вести: проверенная весть звучит с пометкой. */
{const rt9=rumorText;rumorText=matKeep(rt9,function(r){const t=rt9.apply(this,arguments);safeFn(()=>{if(t&&r&&r.проверено&&!/\(проверено:/.test(t.текст))t.текст+=` (проверено: ${RUMOR_CLASS_BY_ID[r.проверено].n})`;});return t;});}
/* Окно заданий: открытые сюжеты мира — там же, где задания жителей. */
{const rq9=renderQuests;renderQuests=matKeep(rq9,function(){const r=rq9.apply(this,arguments);safeFn(()=>{const el=document.getElementById("questList");if(!el)return;const A=Tales.active();
  const t=`Сюжеты мира: открыто ${A.length}${A.length?" — "+A.map(T=>T.n).join("; "):""}. Подробности и пути — пункт «Сюжеты мира».`;
  el.insertAdjacentHTML("beforeend",`<h3>Сюжеты мира (${A.length})</h3><div class="list-line" tabindex="0" data-speak="${Tales.q(t)}">${Tales.q(t)}</div>`);});return r;});}
Object.assign(CMD,{tales(){Tales.home();},tl(a){if(!a)return Tales.home();Tales.cmd(a);}});
{const av9=amAvailable;amAvailable=matKeep(av9,function(cmd){if(cmd==="tales")return !G.dark;return av9.apply(this,arguments);});}
safeFn(()=>{const g=AM_GROUPS.find(x=>x[0]==="Квесты");g[1].push(["tales","Сюжеты мира"]);});

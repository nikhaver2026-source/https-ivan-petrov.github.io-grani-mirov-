/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 292: 14.5 — СЮЖЕТЫ МИРА, ПАМЯТЬ ЖИТЕЛЕЙ, ПРОВЕРКА ВЕСТЕЙ
   (ФАЗА VII «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Мастер-промпт, 12–13: задания возникают из реального состояния мира
   (война, исчезновение правителя, претендент, дефицит, чудище, магический
   источник); у сюжета несколько путей и последствия; не «убить главного
   врага», а переговоры, расследование, доказательства, экономика; квесты
   живут в мире — события развиваются без игрока; жители помнят значимые
   поступки, меняют отношение и торговлю; слухи разной достоверности
   проверяются свидетелями, документами, расследованием и сопоставлением.
    1. Сюжет рождается из мира: спор о престоле, война, нехватка товара,
       морское чудище, гаснущее ядро; не больше шести открытых, по одному
       в день; дальние беды не зовут.
    2. Спор о престоле: грамота из архива Кассара, предъявленная при дворе,
       решает спор; посредничество; поддержка; без героя — решается сам.
    3. Война: мирные дары в обе столицы двигают дипломатию; три победы на
       земле стороны — она берёт верх, и отношения держав меняются.
    4. Нехватка: пять мер товара, проданных на рынке державы, или ввоз,
       оплаченный в столице; после — цена ниже.
    5. Чудище: две гавани предупреждены — суда обходят его воды; срок
       прошёл — беда, ракушки дороже.
    6. Ядро: заряд героя или кристаллы гильдии; без героя гильдия зажигает
       ядро втридорога.
    7. Память жителей: дело героя помнят в державе — жители говорят, торговцы
       платят больше; подстрекательство — меньше.
    8. Вести: свидетели, документы, место, сопоставление; подброшенную весть
       свидетели принимают за частично правдивую.
    9. Окно «Сюжеты мира», раздел в окне заданий, пункт меню, глава
       руководства, сохранение, ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.С={
   чисто(){G.tales={};G.gold=5000;G.place=null;G.inCombat=false;G.combat=null;G.inv={};},
   столица(i){const c=EMPIRES[i].cap;G.place=null;G.x=c.x;G.y=c.y;},
   /* ход дня сюжетов без остального мира */
   день(n){for(let k=0;k<(n||1);k++){G.day=(Number(G.day)||1)+1;Tales.st().дн=0;Tales.tick();}},
   торговец(i){const c=EMPIRES[i].cap;const g=findCities(c.x,c.y,600,6).find(z=>safeFn(()=>empireIndexAt(z.x,z.y),-1)===i);if(!g)return null;G.x=g.x;G.y=g.y;G.place=null;return getNPC(g.x,g.y,0,"Торговец");},
   бой(){const m=Object.assign({},MONSTERS.find(x=>x.id&&x.id!=="wolf"&&!x.boss),{hp:10,dmg:1,lvl:1,xp:1,gold:1});startCombat({x:G.x,y:G.y,monster:m});
    if(G.combat&&G.combat.m){G.combat.m.hp=0;safeFn(()=>victory());}G.inCombat=false;G.combat=null;while(activeLayer())closeTopUI();},
   /* всё, что уже идёт в мире, считается увиденным — чтобы проба открыла именно свой сюжет */
   глуше(){const s=Tales.st(),d=Number(G.day);for(const w of warsAt(d))s.seen["война:"+Math.min(w.a,w.b)+":"+Math.max(w.a,w.b)]=d;
    EMPIRES.forEach((e,i)=>{const C=Throne.crisis(i);if(C)s.seen["престол:"+i+":"+C.нач]=d;});MAT_MONSTERS.forEach(m=>{s.seen["чудище:"+m.id]=d;});},
   спор(i,a,b){const d=Number(G.day);if(Throne.crisis(i))return Throne.crisis(i);
    Throne.openCrisis(i,d,[{n:a,ж:1,b:d-30*360,l:1,г:0,t:1},{n:b,ж:0,b:d-25*360,l:0.5,г:1,t:2}],"проба");return Throne.crisis(i);}};});

 /* ── 1–2. спор о престоле ── */
 const пр=await p.evaluate(()=>{const r={};С.чисто();const d=Number(G.day);
  const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.crisis(k));С.столица(i);
  /* дальний спор не зовёт: герой далеко */
  const j=EMPIRES.findIndex((e,k)=>k>=12&&k!==i&&!Throne.crisis(k)&&Math.max(Math.abs(e.cap.x-G.x),Math.abs(e.cap.y-G.y))>300000&&empireIndexAt(G.x,G.y)!==k);
  if(j>=0){С.спор(j,"Дальняя Проба","Дальний Проба");Tales.find();r.дальнийМолчит=!Tales.active().some(T=>T.вид==="престол"&&T.i===j);}else r.дальнийМолчит=true;
  С.глуше();const C=С.спор(i,"Агния Законная","Гордей Побочный");const T=Tales.find();r.открыт=!!T&&T.вид==="престол"&&T.i===i&&/Агния Законная и Гордей Побочный делят престол/.test(T.причина);
  r.журнал=(G.journal||[]).some(t=>/Сюжет мира: Спор о престоле/.test(t));r.молва=(G.rumors||[]).some(x=>x.в==="сюжет");
  r.второйНеОткрыт=Tales.find()===null||Tales.active().filter(z=>z.вид==="престол"&&z.i===i).length===1;
  /* грамота: в Кассаре — найти, при дворе — предъявить */
  r.неТам=Tales.act(T.id,"архив")===false&&/архивы Кассара/.test(SAID.slice(-1)[0]);
  const kas=NAMED_CITIES.find(z=>z.id==="kassar");G.x=kas.x;G.y=kas.y;G.place=null;r.грамота=Tales.act(T.id,"архив")&&T.пути.грамота.за==="Агния Законная";
  r.неПриДворе=Tales.act(T.id,"предъявить")===false;С.столица(i);const д0=C.cl[0].д;r.предъявил=Tales.act(T.id,"предъявить")&&C.cl[0].д===Math.min(99,д0+20);
  C.cl[0].д=97;C.cl[1].д=3;Throne.crisisStep(i,d+1);С.день(1);r.исход=T.исход&&T.исход.путь;r.текст=T.исход&&T.исход.текст;
  r.летопись=Ledger.has("история",/Грамота о праве решила спор/);
  /* без героя: спор решается сам */
  const k=EMPIRES.findIndex((e,q)=>q>=12&&q!==i&&!Throne.crisis(q));С.столица(k);С.глуше();С.спор(k,"Лада Сама","Ратибор Сам");const T2=Tales.find();
  const C2=Throne.crisis(k);C2.cl[1].д=97;C2.cl[0].д=3;Throne.crisisStep(k,Number(G.day)+1);С.день(1);r.самСобой=T2&&T2.исход&&T2.исход.путь===null&&/без вас/.test(T2.исход.текст);
  r.памятьНет=!Tales.memory(k).length;
  return r;});
 check('1. сюжет рождается из настоящего спора о престоле рядом: журнал и молва; дальний спор не зовёт; один сюжет на одно событие',
  пр.дальнийМолчит&&пр.открыт&&пр.журнал&&пр.молва&&пр.второйНеОткрыт,пр);
 check('2а. путь расследования: грамота из архивов Кассара, предъявленная при дворе, двигает дома и решает спор; развязка — в летописи',
  пр.неТам&&пр.грамота&&пр.неПриДворе&&пр.предъявил&&пр.исход==="грамота"&&пр.летопись,пр);
 check('2б. мир не ждёт героя: спор решается сам, и о деле героя никто не помнит',пр.самСобой&&пр.памятьНет,пр);

 /* ── 3. война ── */
 const вн=await p.evaluate(()=>{const r={};С.чисто();
  const W=warsAt(Number(G.day));let w=null;for(const z of W){С.столица(z.a);Tales.st().seen={};const T=Tales.find();if(T&&T.вид==="война"){w=T;break;}}
  r.война=!!w;if(!w)return r;const T=w;
  /* дары: в обе столицы */
  r.неВСтолице=(()=>{G.x+=5000;return Tales.act(T.id,"дары")===false;})();
  const key=diploKey(T.i,T.j);const до=(G.diplo||{})[key]||0;С.столица(T.i);const a=Tales.act(T.id,"дары");r.дважды=Tales.act(T.id,"дары")===false;
  С.столица(T.j);const b=Tales.act(T.id,"дары");r.дары=a&&b&&(G.diplo[key]||0)>=Math.min(40,до+35)-0.001;
  /* три победы на земле стороны — она берёт верх */
  const сторона=T.i,враг=T.j;const s0=standOf("fact",EMPIRES[сторона].short),v0=standOf("fact",EMPIRES[враг].short);
  С.столица(сторона);for(let k=0;k<3;k++)С.бой();r.победы=Tales.pathState(T,"оружие");С.день(1);
  r.исход=T.исход&&T.исход.путь;
  /* дары могли кончить войну раньше побед — тогда это путь «мир», и держава помнит героя */
  r.отношения=r.исход==="оружие"?standOf("fact",EMPIRES[сторона].short)>s0&&standOf("fact",EMPIRES[враг].short)<v0:r.исход==="мир"&&Tales.memory(T.i).length>0;
  return r;});
 check('3. война: мирные дары — только в столицах, по разу в каждой, и двигают дипломатию двух держав; три победы на земле стороны — она берёт верх, отношения меняются',
  вн.война&&вн.неВСтолице&&вн.дары&&вн.дважды&&(вн.исход==="оружие"||вн.исход==="мир")&&вн.отношения,вн);

 /* ── 4. нехватка ── */
 const нх=await p.evaluate(()=>{const r={};С.чисто();const i=12;const n=С.торговец(i);r.торговец=!!n;const d=Number(G.day);
  /* нехватка — по цене рынка державы: на время пробы рынок показывает втрое дороже */
  const mp=marketPrice;let res=null;for(const x of LAND_RES){if(n&&safeFn(()=>sellUnit(n,x),0)>0){res=x;break;}}r.товар=res;
  С.глуше();marketPrice=function(rr,ii,dd){const v=mp.apply(this,arguments);return rr===res&&Number(ii)===i?v*3:v;};const T=Tales.find();marketPrice=mp;
  r.открыт=!!T&&T.вид==="дефицит"&&T.res===res;if(!T)return r;
  G.inv[res]=5;sellResource(n.key,res,true);r.продано=Tales.pathState(T,"привезти");const до=marketPrice(res,i,Number(G.day));С.день(1);r.исход=T.исход&&T.исход.путь;
  r.цены=[до,marketPrice(res,i,Number(G.day))];r.дешевле=r.цены[1]<=Math.round(до*0.85);
  return r;});
 check('4. нехватка товара по цене рынка державы; пять мер, проданных там, решают дело; после — товар дешевле',
  нх.торговец&&нх.открыт&&/продано 5 из 5/.test(нх.продано)&&нх.исход==="привезти"&&нх.дешевле,нх);

 /* ── 5. чудище ── */
 const чд=await p.evaluate(()=>{const r={};С.чисто();const m=MAT_MONSTERS.find(z=>!Mater.mon(z.id).убит);r.есть=!!m;if(!m)return r;
  const c=Mater.monPos(m);G.x=c.x;G.y=c.y;Tales.st().seen={};С.глуше();delete Tales.st().seen["чудище:"+m.id];let T=null;for(let k=0;k<6&&!(T&&T.вид==="чудище");k++)T=Tales.find();
  r.открыт=!!T&&T.вид==="чудище";if(!r.открыт)return r;
  const H=Mater.harbors().slice(0,2);for(const h of H){G.x=h.x;G.y=h.y+1;G.place=null;move("N");if(G.inCombat)safeFn(()=>endCombat());}
  r.гавани=(T.гавани||[]).length;С.день(1);r.исход=T.исход&&T.исход.путь;
  /* беда: другой сюжет о чудище, срок прошёл */
  const T2={id:"tl_beda",вид:"чудище",k:"проба",d0:Number(G.day),м:m.id,x:c.x,y:c.y,n:"Чудище: проба",причина:"проба",срок:Number(G.day),пути:{},исход:null,гавани:[]};
  Tales.st().list.push(T2);const р0=marketPrice("ракушка",12,Number(G.day));С.день(1);r.беда=T2.исход&&T2.исход.тон===-1&&marketPrice("ракушка",12,Number(G.day))>=Math.round(р0*1.2);
  return r;});
 check('5. чудище: две предупреждённые гавани — суда обходят его воды; срок прошёл без героя — беда, ракушки дороже',
  чд.есть&&чд.открыт&&чд.гавани>=2&&чд.исход==="гавани"&&чд.беда,чд);

 /* ── 6. ядро ── */
 const яд=await p.evaluate(()=>{const r={};С.чисто();if(typeof LiveCity==="undefined")return {нет:true};
  const st=LiveCity.st().ядро;st.з=10;st.д=Number(G.day);Tales.st().seen={};С.глуше();let T=null;for(let k=0;k<6&&!(T&&T.вид==="ядро");k++)T=Tales.find();r.открыт=!!T&&T.вид==="ядро";if(!T)return r;
  const v=NAMED_CITIES.find(z=>z.id==="valtern");G.x=v.x;G.y=v.y;enterPlace(cellContent(v.x,v.y));while(activeLayer())closeTopUI();
  G.inv.кристалл=2;r.заряд=LiveCity.charge();while(G.place)leavePlace();С.день(1);r.исход=T.исход&&T.исход.путь;
  /* без героя: гильдия — втридорога */
  st.з=10;st.д=Number(G.day);Tales.st().seen={};Tales.st().list=[];С.глуше();let T2=null;for(let k=0;k<6&&!(T2&&T2.вид==="ядро");k++)T2=Tales.find();if(T2&&T2.вид==="ядро"){T2.срок=Number(G.day);const к0=marketPrice("кристалл",12,Number(G.day));С.день(1);
   r.гильдия=T2.исход&&T2.исход.путь===null&&LiveCity.core()>=30&&marketPrice("кристалл",12,Number(G.day))>=Math.round(к0*1.1);}
  return r;});
 check('6. гаснущее ядро: заряд героя зажигает его; без героя гильдия зажигает втридорога — кристаллы дороже',яд.открыт&&яд.заряд&&яд.исход==="зарядить"&&яд.гильдия,яд);

 /* ── 7. память жителей ── */
 const пм=await p.evaluate(()=>{const r={};const i=12;Tales.st().пам=[];
  const n=С.торговец(i);r.торговец=!!n;
  /* самый дорогой товар: доли цены не теряются в округлении */
  const res=LAND_RES.slice().sort((a,b)=>sellPrice(b,i,Number(G.day),n)-sellPrice(a,i,Number(G.day),n))[0];
  const p0=sellPrice(res,i,Number(G.day),n);Tales.st().пам.push({д:Number(G.day),i,t:"герой примирил стороны",тон:1});const p1=sellPrice(res,i,Number(G.day),n);
  r.рады=p1>=p0&&/Здесь помнят: герой примирил стороны/.test(Tales.memoryLine(i));
  SAID.length=0;openNPC(n.key);while(activeLayer())closeTopUI();r.говорит=SAID.some(t=>/Здесь помнят/.test(t));SAID.length=0;openNPC(n.key);while(activeLayer())closeTopUI();r.разВДень=!SAID.some(t=>/Здесь помнят/.test(t));
  /* подстрекательство: холод */
  G.gold=1000;const k=Throne.base(i).дома.length-1;if(Throne.crisis(i)){Throne.st().r[i].сп=null;}const ok=Throne.incite(i,k);
  /* подстрекательство могло поднять мятеж и цены: сравниваем с тем же рынком без памяти */
  const p2=sellPrice(res,i,Number(G.day),n);const пам=Tales.st().пам;Tales.st().пам=[];const p3=sellPrice(res,i,Number(G.day),n);Tales.st().пам=пам;
  r.цены=[p0,p1,p2,p3,res];r.ok=ok;r.строка=Tales.memoryLine(i);r.холод=ok&&p2<p3&&/холодны/.test(Tales.memoryLine(i));return r;});
 check('7. память жителей: дело героя помнят в его державе — жители говорят о нём (раз в день), торговцы платят больше; после подстрекательства — меньше',
  пм.торговец&&пм.рады&&пм.говорит&&пм.разВДень&&пм.холод,пм);

 /* ── 8. проверка вестей ── */
 const вс=await p.evaluate(()=>{const r={};const i=12;const n=С.торговец(i);G.rumors=[];const d=Number(G.day);
  const ист=rumorSeed("бой","проба правды",G.x,G.y,true);ист.д0=d-3;const лож=rumorSeed("сюжет","проба лжи",G.x+3,G.y,false);лож.д0=d-3;
  const нароч=rumorSeed("престол","проба подброса",G.x-3,G.y,true,true);нароч.д0=d-3;
  G.gold=1000;r.место=Tales.verify(ист.id,"место")&&ист.проверено==="true";
  r.документы=Tales.verify(лож.id,"документы")&&лож.проверено==="false"&&G.gold===970;
  r.свидетели=Tales.verify(нароч.id,"свидетели")&&нароч.проверено==="partial"&&/нарочно сказали/.test(SAID.slice(-1)[0]);
  const далеко=rumorSeed("пираты","проба дали",G.x+5000,G.y,true);r.неНаМесте=Tales.verify(далеко.id,"место")===false;
  const a=rumorSeed("чудище","проба одна",G.x,G.y,true);a.держава=1;const b=rumorSeed("чудище","проба другая",G.x+100000,G.y,true);b.держава=2;
  r.сличение=Tales.verify(a.id,"сличение")&&!!a.проверено&&!!b.проверено;
  r.пометка=/\(проверено: правдивый\)/.test(rumorText(ист).текст);
  r.второйРаз=Tales.verify(ист.id,"место")===false;return r;});
 check('8. вести проверяют на месте, документами архива, свидетелями своей державы и сопоставлением; подброшенную свидетели считают частично правдивой; проверенная звучит с пометкой',
  вс.место&&вс.документы&&вс.свидетели&&вс.неНаМесте&&вс.сличение&&вс.пометка&&вс.второйРаз,вс);

 /* ── 9. окно, задания, меню, руководство, сохранение ── */
 const ок=await p.evaluate(()=>{const r={};С.столица(12);
  CMD.tales();const m=document.getElementById("modal-tales");r.окно=!!m&&!m.hidden;const тело=m&&m.querySelector("#tlBody");
  r.немых=тело?тело.querySelectorAll("button:not([data-speak])").length:-1;r.текст=тело?тело.textContent:"";closeModal(m);
  renderQuests();r.вЗаданиях=/Сюжеты мира: открыто/.test((document.getElementById("questList")||{}).innerHTML||"");
  SAID.length=0;CMD.tl("непонятное");r.немоНет=SAID.some(t=>/Такого дела нет/.test(t));
  r.меню=amAvailable("tales")&&AM_GROUPS.find(g=>g[0]==="Квесты")[1].some(x=>x[0]==="tales");
  r.глава=!!guideSec(/Сюжеты мира, память жителей и проверка вестей/);
  const до=JSON.stringify(G.tales);saveGame(true);G.tales={};loadGame();r.сохр=JSON.stringify(G.tales)===до&&до.length<20000;r.размер=до.length;return r;});
 check('9а. окно «Сюжеты мира»: открытые, развязки, память, вести с проверкой; кнопки озвучены; непонятное дело не молчит; сюжеты видны и в окне заданий',
  ок.окно&&ок.немых===0&&/Развязки/.test(ок.текст)&&/Вести здесь/.test(ок.текст)&&ок.вЗаданиях&&ок.немоНет,ок);
 check('9б. пункт «Сюжеты мира» в разделе «Квесты»; глава руководства; сюжеты переживают сохранение',ок.меню&&ок.глава&&ок.сохр,ок);
 check('9в. ошибок страницы нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИтого: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

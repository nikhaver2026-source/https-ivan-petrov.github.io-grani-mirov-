/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 289: 14.5 — ПРЕСТОЛЫ, ДИНАСТИИ И НАСЛЕДОВАНИЕ (ФАЗА IV ХРОНИКИ)
   Мастер-промпт: «государства, династии, дипломатические отношения,
   торговые сети, войны и последствия решений игрока»; «если правитель
   умирает, наследник может оказаться несовершеннолетним, незаконнорождённым,
   отсутствующим или оспариваемым — регентские советы, борьба претендентов,
   расколы знати и войны за наследство»; «игрок может предотвращать,
   провоцировать, разрешать дипломатическим путём, менять баланс сил или
   создавать собственную державу».
    1. У каждой из 99 держав свой правящий род (без повторов), правитель с
       возрастом и нравом, наследники, закон, 3–5 знатных домов с гербом,
       девизом, обычаем и враждой, храм с влиянием и нравом.
    2. Досье дальних держав — своё, а не запись двенадцатой державы.
    3. Повседневное выводится из дня: двор, где ничего не случилось, в
       сохранение не пишется; один и тот же день — те же числа.
    4. Наследование: взрослый законный наследник; малолетний — с регентом,
       регент уходит в шестнадцать; род пресёкся — новая династия дома.
    5. Спор о престоле: дома делятся, доли — сто; исход коронует победителя.
    6. Мятеж: победа мятежников — новая династия; поражение — дом разбит.
       Заговор: в назначенный день — яд.
    7. Дипломатия: брак роднит и поднимает отношения; вмешательство соседа
       в спор их роняет, а с концом спора обида вдвое слабеет.
    8. Последствия: в смуту у державы ниже дух и подвоз войска, половина
       торговых путей стоит, цены выше.
    9. Державы одного материка — соседи и воюют, через океан — нет; войны
       прежнего мира в первый день те же (отпечаток трёхсот дней).
   10. Герой: поддержать претендента, посредничать в столице, раскрыть
       заговор, подстрекать дом, сосватать роды; отказы объясняются.
   11. Вольный удел: где нельзя — объясняется; основан — растёт, подать,
       дружина, праздник, дары; «Осмотреться» называет удел.
   12. Окно «Престолы и наследники», переход по дворам, пункт меню; вести
       престолов в новостях и в молве; сохранение, старое сохранение,
       размер и скорость; ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 const r=await p.evaluate(()=>{const out={};const d=Number(G.day)||1;
  /* 9 (сначала, пока мир не тронут): отпечаток войн прежнего мира */
  {const a=[];for(let dd=1;dd<=300;dd++)a.push(warsAt(dd).filter(x=>x.a<69&&x.b<69).map(x=>x.a+":"+x.b).sort().join(","));
   const s=a.join("|");let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;out.отпечаток=h.toString(16);}
  /* 1. основа */
  const N=EMPIRES.length;const полн=[];
  for(let i=0;i<N;i++){const B=Throne.base(i),R=Throne.ruler(i);
   if(!B.род||!R.n||!(Throne.age(R)>=16)||!THR_TRAITS[R.t]||!THR_LAWS[B.закон]||B.дома.length<3||B.дома.length>5||
    B.дома.some(h=>!h.герб||!h.девиз||!h.обычай||!h.вражда||!h.вражда.из)||!B.храм.n||!(B.храм.влияние>0)||Throne.heirs(i).length<(i<12?1:2))полн.push(EMPIRES[i].short);}
  out.держав=N;out.неполных=полн;out.родов=new Set(Throne.dynNames()).size;
  /* 2. досье дальних держав */
  out.династийВЗаписях=new Set(EMPIRES.map((e,i)=>Empires.extra(i).династия)).size;
  out.досье80=Empires.text(80);out.род80=Throne.dyn(80);
  /* 3. выводится, а не хранится */
  for(let i=0;i<N;i++){Empires.text(i);Throne.ruleText(i);}
  out.записано=Object.keys(Throne.st().r).length;
  out.верностьДень=[Throne.loyal(30,0,d),Throne.loyal(30,0,d)];out.верностьИначе=[0,40,80,120].map(k=>Throne.loyal(30,0,d+k));
  /* 4. наследование */
  const старш=EMPIRES.findIndex((e,i)=>i>=12&&Throne.base(i).закон==="старшинство");out.старш=старш;
  {const R=Throne.touch(старш);R.н=[{n:"Ярополк Испытуемый",ж:0,b:d-30*360,l:1,г:0,t:6,р:"сын",з:"за войско"},{n:"Вадим Изгнанник",ж:0,b:d-28*360,l:0.5,г:1,t:1,р:"побочный сын",з:"за купцов"}];
   Throne.succession(старш,d,"проба",-1);out.коронован=Throne.ruler(старш).n;out.наследниковПосле=Throne.heirs(старш).length;}
  {const i=EMPIRES.findIndex((e,k)=>k>старш&&Throne.base(k).закон==="старшинство");const R=Throne.touch(i);
   R.н=[{n:"Лада Малая",ж:1,b:d-10*360,l:1,г:0,t:2,р:"дочь"}];Throne.succession(i,d,"проба",-1);out.регент=!!Throne.regent(i)&&/^глава дома /.test(Throne.regent(i).n);out.малолетняя=Throne.ruler(i).n;
   Throne.ruler(i).b=d+1-16*360;Throne.st().r[i].зг=null;Throne.step(i,d+1);out.регентУшёл=!Throne.regent(i);}
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&k!==старш&&!Throne.R(k));const R=Throne.touch(i);R.н=[];Throne.succession(i,d,"проба",-1);
   out.новаяДинастия=Throne.dyn(i)!==Throne.base(i).род&&Throne.base(i).дома.some(h=>h.n===Throne.dyn(i));}
  /* 5. спор о престоле */
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));out.спорДержава=i;
   Throne.openCrisis(i,d,[{n:"Агния Старшая",ж:1,b:d-30*360,l:1,г:0,t:1},{n:"Гордей Младший",ж:0,b:d-25*360,l:1,г:0,t:2}],"проба");
   const C=Throne.crisis(i);const все=C.cl[0].дм.concat(C.cl[1].дм).sort();
   out.доли=C.cl[0].д+C.cl[1].д;out.домаРазобраны=JSON.stringify(все)===JSON.stringify(Throne.base(i).дома.map((h,k)=>k));
   C.cl[0].д=97;C.cl[1].д=3;Throne.crisisStep(i,d+1);out.спорРешён=!Throne.crisis(i)&&Throne.ruler(i).n==="Агния Старшая";}
  /* 6. мятеж и заговор */
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));Throne.revolt(i,d,1);const C=Throne.crisis(i);out.мятеж=C&&C.в==="мятеж"&&C.cl[1].м===1;
   C.cl[1].д=97;C.cl[0].д=3;Throne.crisisStep(i,d+1);out.мятежПобедил=Throne.dyn(i)===Throne.base(i).дома[1].n;}
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));const до=Throne.loyal(i,0,d);Throne.revolt(i,d,0);const C=Throne.crisis(i);
   C.cl[0].д=97;C.cl[1].д=3;Throne.crisisStep(i,d+1);out.мятежПодавлен=!Throne.crisis(i)&&Throne.loyal(i,0,d+1)<до&&Throne.dyn(i)===Throne.base(i).род;}
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));const R=Throne.touch(i);const был=R.п.n;R.зг={дом:2,день:d+5,раскрыт:false};
   Throne.step(i,d+5);out.яд=(Throne.ruler(i).n!==был||Throne.vacant(i))&&Throne.st().ev.some(x=>x.i===i&&/от яда/.test(x.t));
   /* второй раз мёртвый правитель не умирает: пустой престол ждёт исхода спора */
   const ev0=Throne.st().ev.length;Throne.step(i,d+6);out.неДважды=!Throne.vacant(i)||!Throne.st().ev.slice(0,Throne.st().ev.length-ev0).some(x=>x.i===i&&/умер/.test(x.t));}
  /* 7. дипломатия */
  {let i=-1,j=-1;for(let a=12;a<N&&i<0;a++)for(let b=0;b<N;b++){if(a!==b&&warNeighbours(a,b)&&!Throne.married(a,b)&&Throne.pair(a,b)){i=a;j=b;break;}}
   const k=diploKey(i,j),до=Number((G.diplo||{})[k])||0,отн=relationAt(i,j,d);
   Throne.marry(i,j,d,false);out.брак=Throne.married(i,j)&&(G.diplo[k]-до===25||G.diplo[k]===40)&&relationAt(i,j,d)>отн;}
  {let нашли=null;for(let a=12;a<N&&!нашли;a++){if(Throne.R(a))continue;for(let dd=d;dd<d+60&&!нашли;dd++){const j=Throne.neighbour(a,dd);
    if(j!=null&&hashName(a,dd,9988)<0.45){const k=diploKey(a,j);const до=Number((G.diplo||{})[k])||0;
     Throne.openCrisis(a,dd,[{n:"Первый",ж:0,b:dd-30*360,l:1,г:0,t:0},{n:"Вторая",ж:1,b:dd-29*360,l:1,г:0,t:0}],"проба");const C=Throne.crisis(a);
     if(C&&C.вм){const после=G.diplo[diploKey(a,C.вм.j)];C.cl[0].д=97;C.cl[1].д=3;Throne.crisisStep(a,dd+1);
      нашли={вмешался:EMPIRES[C.вм.j].short,упало:после-до,после,мягче:G.diplo[diploKey(a,C.вм.j)]};}}}}
   out.вмешательство=нашли;}
  /* 8. последствия смуты */
  {/* держава с обозами у престола: торговые пути есть, и половина их встанет */
   let i=-1;for(let k=0;k<N&&i<0;k++){if(Throne.R(k))continue;const c=EMPIRES[k].cap;if(caravanRoutes(c.x,c.y,d).filter(rt=>empireIndexAt(rt.a.x,rt.a.y)===k).length>=4)i=k;}
   const c=EMPIRES[i].cap,свои=()=>caravanRoutes(c.x,c.y,d).filter(rt=>empireIndexAt(rt.a.x,rt.a.y)===i).length;
   const a0=Empires.army(i),п0=marketPrice("руда",i,d),о0=свои();
   Throne.openCrisis(i,d,[{n:"Один",ж:0,b:d-30*360,l:1,г:0,t:0},{n:"Другой",ж:0,b:d-31*360,l:1,г:0,t:0}],"проба");
   const a1=Empires.army(i),п1=marketPrice("руда",i,d),о1=свои();out.смута={дух:[a0.мораль,a1.мораль],снаб:[a0.снабжение,a1.снабжение],цена:[п0,п1],обозов:[о0,о1]};}
  /* 9. войны материков */
  {const М=EMPIRES.map((e,i)=>e.материк?i:-1).filter(i=>i>=0);const a=М[0],b=М.find(i=>EMPIRES[i].материк===EMPIRES[a].материк&&i!==a),c=М.find(i=>EMPIRES[i].материк!==EMPIRES[a].материк);
   out.соседи=[warNeighbours(a,b),warNeighbours(a,c),warNeighbours(a,0)];
   let мат=0;for(let dd=1;dd<=40;dd++)мат+=warsAt(dd).filter(w=>EMPIRES[w.a].материк&&EMPIRES[w.b].материк&&EMPIRES[w.a].материк===EMPIRES[w.b].материк).length;out.войнМатериков=мат;}
  return out;});

 check('1. у каждой из 99 держав свой правящий род, правитель с возрастом и нравом, наследники, закон, три–пять знатных домов с гербом, девизом, обычаем и враждой, храм',
  r.держав===99&&!r.неполных.length&&r.родов===99,{неполных:r.неполных.slice(0,6),родов:r.родов});
 check('2. досье дальних держав — своё: 99 разных династий, в досье свой род и закон наследования',
  r.династийВЗаписях===99&&r.досье80.includes(r.род80)&&/Закон наследования/.test(r.досье80)&&/Знатные дома/.test(r.досье80),{династий:r.династийВЗаписях,досье:r.досье80.slice(0,160)});
 check('3. повседневное выводится из дня: чтение всех 99 дворов ничего не записывает; тот же день — те же числа, другие дни — другие',
  r.записано===0&&r.верностьДень[0]===r.верностьДень[1]&&new Set(r.верностьИначе).size>1,{записано:r.записано,верность:r.верностьИначе});
 check('4. наследование: взрослый законный наследник коронован; малолетней правит регент и уходит в шестнадцать; род пресёкся — престол берёт знатный дом',
  r.коронован==="Ярополк Испытуемый"&&r.наследниковПосле>=2&&r.регент&&r.малолетняя==="Лада Малая"&&r.регентУшёл&&r.новаяДинастия,
  {к:r.коронован,н:r.наследниковПосле,рег:r.регент,ушёл:r.регентУшёл,дин:r.новаяДинастия});
 check('5. спор о престоле: доли — сто, все дома разобрали стороны; перевес коронует победителя',r.доли===100&&r.домаРазобраны&&r.спорРешён,{доли:r.доли,дома:r.домаРазобраны,решён:r.спорРешён});
 check('6. мятеж: победа мятежников — новая династия; поражение — дом разбит и обижен; заговор — яд в назначенный день',
  r.мятеж&&r.мятежПобедил&&r.мятежПодавлен&&r.яд&&r.неДважды,{м:r.мятеж,п:r.мятежПобедил,под:r.мятежПодавлен,яд:r.яд,дважды:r.неДважды});
 check('7. брак роднит роды и поднимает отношения на двадцать пять; сосед, вставший за претендента, ссорится с державой на тридцать, с концом спора обида вдвое слабеет',
  r.брак&&r.вмешательство&&r.вмешательство.упало<=-1&&Math.abs(r.вмешательство.мягче)<=Math.abs(r.вмешательство.после),r.вмешательство);
 check('8. в смуту у державы ниже дух и подвоз войска, обозы ходят реже, цены выше',
  r.смута.дух[1]<r.смута.дух[0]&&r.смута.снаб[1]<r.смута.снаб[0]&&r.смута.цена[1]>r.смута.цена[0]&&r.смута.обозов[1]<r.смута.обозов[0],r.смута);
 check('9. державы одного материка — соседи и воюют, через океан и с прежним миром — нет; войны прежнего мира в первый день те же',
  r.соседи[0]===true&&r.соседи[1]===false&&r.соседи[2]===false&&r.войнМатериков>0&&r.отпечаток==="92ec9fbb",{соседи:r.соседи,войн:r.войнМатериков,отпечаток:r.отпечаток});

 /* 10. герой */
 const г=await p.evaluate(()=>{const out={};const d=Number(G.day)||1;const N=EMPIRES.length;
  const сказ=()=>(SAID.slice(-1)[0]||"");
  const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));
  SAID.length=0;Throne.support(i,0);out.безСпора=/Спора о престоле здесь нет/.test(сказ());
  Throne.openCrisis(i,d,[{n:"Святогор",ж:0,b:d-30*360,l:1,г:0,t:0},{n:"Злата",ж:1,b:d-29*360,l:1,г:0,t:0}],"проба");
  G.gold=1000;const до=Throne.crisis(i).cl[0].д;Throne.support(i,0);out.поддержка=G.gold===850&&Throne.crisis(i).cl[0].д>до;
  G.x=0;G.y=0;SAID.length=0;Throne.mediate(i);out.неВСтолице=/престольном городе/.test(сказ())&&!!Throne.crisis(i);
  G.x=EMPIRES[i].cap.x;G.y=EMPIRES[i].cap.y;G.place=null;G.cha=100;Throne.mediate(i);out.посредничество=!Throne.crisis(i)&&["Святогор","Злата"].includes(Throne.ruler(i).n);
  SAID.length=0;Throne.expose(i);out.нетЗаговора=/не нашли/.test(сказ());
  Throne.touch(i).зг={дом:0,день:d+40,раскрыт:false};Throne.expose(i);out.раскрыт=Throne.R(i).зг.раскрыт===true&&Throne.st().ev.some(x=>x.i===i&&/раскрыл заговор/.test(x.t));
  const k=Throne.base(i).дома.length-1,в0=Throne.loyal(i,k,d);G.gold=1000;Throne.incite(i,k);out.подстрекал=G.gold===800&&(Throne.loyal(i,k,d)<в0||!!Throne.crisis(i));
  let j=-1;for(let b=0;b<N;b++)if(b!==i&&!Throne.married(i,b)&&Throne.pair(i,b)&&relationAt(i,b,d)>=-40){j=b;break;}
  G.gold=1000;Throne.matchmake(i,j);out.сватовство=G.gold===750&&Throne.married(i,j);
  G.gold=10;SAID.length=0;Throne.matchmake(i,(j+1)%N===i?(j+2)%N:(j+1)%N);out.бедно=/золота/.test(сказ())||/породнились|одного пола|крови/.test(сказ());
  return out;});
 check('10. герой: поддержка претендента за золото, посредничество — только в столице, раскрытый заговор, подстрекательство, сватовство; отказы объясняются',
  г.безСпора&&г.поддержка&&г.неВСтолице&&г.посредничество&&г.нетЗаговора&&г.раскрыт&&г.подстрекал&&г.сватовство&&г.бедно,г);

 /* 11. вольный удел */
 const у=await p.evaluate(async()=>{const out={};const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  G.place=null;G.ship=null;G.dark=false;G.x=500;G.y=500;out.вПрежнихЗемлях=Throne.canFound(500,500)||"";
  G.level=10;G.gold=5000;let место=null;
  for(const c of MATERIKI){for(let k=0;k<60&&!место;k++){const x=Math.round(c.cx+(hashName(k,1,77)-0.5)*c.rx),y=Math.round(c.cy+(hashName(k,2,77)-0.5)*c.ry);if(!Throne.canFound(x,y))место={x,y};}if(место)break;}
  out.место=!!место;G.x=место.x;G.y=место.y;G.level=3;out.уровень=Throne.canFound(G.x,G.y)||"";G.level=10;
  Throne.found();const o=Throne.own();out.основан=!!o&&G.gold===3500&&EMPIRES[o.хоз]&&Throne.inOwn(G.x,G.y);
  const л0=o.люди,r0=o.r;G.day=(Number(G.day)||1)+20;Throne.ownTick();out.растёт=o.люди>л0&&o.r>r0;
  const з0=G.gold;Throne.ownAct("tax");out.подать=G.gold>з0;SAID.length=0;Throne.ownAct("tax");out.податьРаз=/раз в десять дней/.test(SAID.slice(-1)[0]||"");
  const в0=o.войско;Throne.ownAct("hire");out.дружина=o.войско>в0;const с0=o.стаб;Throne.ownAct("feast");out.праздник=o.стаб>с0;const т0=o.отн;Throne.ownAct("gift");out.дары=o.отн>т0;
  SAID.length=0;look();await пауза(150);out.осмотр=SAID.some(t=>/Земля вашего удела/.test(t));
  return out;});
 check('11. вольный удел: в прежних землях и без уровня — отказ с причиной; на материке основан, растёт, платит подать раз в десять дней, дружина, праздник, дары; «Осмотреться» называет удел',
  /Внешним морем/.test(у.вПрежнихЗемлях)&&у.место&&/уровень/.test(у.уровень)&&у.основан&&у.растёт&&у.подать&&у.податьРаз&&у.дружина&&у.праздник&&у.дары&&у.осмотр,у);

 /* 12. окно, меню, вести, молва, сохранение, скорость */
 const о=await p.evaluate(async()=>{const out={};const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  G.x=EMPIRES[3].cap.x;G.y=EMPIRES[3].cap.y;G.place=null;
  CMD.thrones();await пауза(60);const m=document.getElementById("modal-thrones");
  out.окно=!!m&&!m.hidden&&/Престолы и наследники/.test(m.textContent)&&/Закон наследования/.test(m.textContent)&&/Знатные дома/.test(m.textContent);
  out.кнопок=m.querySelectorAll('[data-cmd^="th:"]').length;
  CMD.th("grp:mat");out.материки=m.querySelectorAll('[data-cmd^="th:see:"]').length;
  const j=EMPIRES.findIndex(e=>e.материк);CMD.th("see:"+j);out.чужойДвор=m.textContent.includes(EMPIRES[j].name);
  while(activeLayer())closeTopUI();
  const g=AM_GROUPS.find(x=>x[0]==="Державы");out.пункт=g[1].some(x=>x[0]==="thrones")&&g[1].length<=16&&amAvailable("thrones");
  /* вести и молва */
  const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.R(k));const R=Throne.touch(i);R.н=[];Throne.succession(i,Number(G.day)||1,"проба",-1);
  out.новости=Empires.news(G.day).some(t=>/^Престолы/.test(t));
  const весть=(G.rumors||[]).filter(r=>r.в==="престол").slice(-1)[0];out.молва=весть?rumorText(весть).текст:"";
  /* сохранение */
  saveGame(true);const raw=JSON.parse(localStorage.getItem(SAVE_KEY));const g2=raw.G||raw;
  out.вСохранении=!!g2.thr&&Object.keys(g2.thr.r||{}).length>0&&Array.isArray(g2.thr.ev);
  const копия=JSON.parse(JSON.stringify(G.thr));const был=Throne.ruler(i).n;G.thr=undefined;out.старый=Throne.ruler(i).n===Throne.base(i).п0.n;G.thr=копия;out.послеЗагрузки=Throne.ruler(i).n===был;
  /* размер и скорость: 300 дней мира престолов */
  G.thr=undefined;Throne.st();const t0=performance.now();for(let k=0;k<300;k++){G.day=(Number(G.day)||1)+1;Throne.tick();}
  out.мс300=Math.round(performance.now()-t0);out.байт=JSON.stringify(G.thr).length;
  return out;});
 check('12. окно «Престолы и наследники»: двор, дома, действия, переход по дворам (тридцать дворов материков) и пункт меню; вести престолов в новостях и в молве; сохранение и старое сохранение; триста дней — быстро и мало места',
  о.окно&&о.кнопок>=5&&о.материки===30&&о.чужойДвор&&о.пункт&&о.новости&&/умер|умерла/.test(о.молва)&&!/\{что\}/.test(о.молва)&&о.вСохранении&&о.старый&&о.послеЗагрузки&&о.мс300<2000&&о.байт<12000,о);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));
 for(const x of results)console.log(x);
 await browser.close();
})();

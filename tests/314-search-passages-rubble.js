/* ════════════════════════════════════════════════════════════════════════
   НАБОР 314: 15.0 — ПОИСК ПОД РУКОЙ, ТАЙНЫЕ ХОДЫ И ЗАВАЛЫ

   Просьбы игрока: «обыскиваешь укромные места — постоянно ничего не
   находится; стучишь в стены — везде звук глухой»; «в тайной палате на
   каждом шаге звучит „пол тайной палаты“ — должен быть только звук
   поверхности»; «рычаг, статуя или завал открывают лаз — а клетка как
   обычная, ничего не сказано; спуститься — двойным касанием и встав на
   клетку»; «находку взяли — статуя встаёт на место; попасть ещё раз —
   снова через статую или рычаг»; «разбираешь завал — говорит, открылся
   проход, а там стена: разбираешь зря».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Обыск «здесь» ощупывает свою клетку и четыре соседние: тайник в
      соседней стене находится, упорство окупается (не больше пяти
      обысков), «Достать из тайника» есть и с пола.
   2. Пусто под рукой, а тайник в трёх шагах — слово называет сторону.
   3. Стук слышит пустоту за кладкой в трёх шагах: называет сторону и
      расстояние; вплотную — открывает ход.
   4. В тайной палате пол не называется: ни «объекты рядом», ни описание
      проходов не говорят «пол тайной палаты».
   5. Открытый лаз назван: подпись стены — «лаз в тайную палату», в
      «объектах рядом» он есть; встали на вещь, за которой ход, — «здесь
      лаз», второй шаг в ту же сторону уводит в палату.
   6. Находку взяли и выбрались — лаз закрылся (вещь встала на место);
      та же вещь открывает его снова, и в палате пусто.
   7. Обвал ложится поперёк пути (за клеткой ход идёт дальше); разбор
      говорит, куда ведёт ход; тупиковый завал всегда что-то даёт.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;safeFn(()=>{Actors.tick=()=>{};Actors.ensure=()=>{};});
  window.__тихо=()=>{G.inCombat=false;G.combat=null;safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  window.__ярус=(bx,by,d)=>{G.place={kind:"dungeon",bx,by,stype:"ruins",depth:d,x:1,y:1,name:"Руины"};return curLevel();};
  window.__пол=(L,x,y)=>{const t=tileAt(L,x,y);return t==="."};});
 const W=ms=>page.waitForTimeout(ms);

 /* ── 1. обыск под рукой: тайник в соседней клетке ── */
 const о=await page.evaluate(()=>{__тихо();G.stash={};G.stashTry={};
  for(let k=0;k<40;k++){const L=__ярус(1500+k*11,1600+k*7,2+k%6);
   for(let y=2;y<L.h-2;y++)for(let x=2;x<L.w-2;x++){if(!__пол(L,x,y))continue;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const т=stashAt(x+dx,y+dy);
     if(т&&т.состояние==="скрыт"&&tileAt(L,x+dx,y+dy)==="#"){G.place.x=x;G.place.y=y;
      const пол=objectsHere(true).find(o=>o.вид==="floor")||{вид:"floor",x,y};
      let n=0;while(stashAt(x+dx,y+dy).состояние!=="найден"&&n<5){stashSearch(x,y);n++;}
      const найден=stashAt(x+dx,y+dy).состояние==="найден";
      const можно=!!(IACT.stashtake&&IACT.stashtake.можно(пол));__said=[];if(можно)IACT.stashtake.делать(пол);
      return {найден,обысков:n,можно,взят:stashAt(x+dx,y+dy).состояние==="взят",слово:__said.join(" ").slice(0,160)};}}}}
  return {нет:true};});
 check('1. обыск «здесь» ощупывает и соседние клетки: тайник в стене рядом находится не больше чем за пять обысков, достаётся с пола',
  !о.нет&&о.найден&&о.обысков<=5&&о.можно&&о.взят&&/Из тайника/.test(о.слово),о);

 /* ── 2. пусто под рукой — подсказка о тайнике рядом ── */
 const п=await page.evaluate(()=>{__тихо();G.stash={};
  for(let k=0;k<60;k++){const L=__ярус(1700+k*13,1800+k*5,2+k%6);
   for(let y=3;y<L.h-3;y++)for(let x=3;x<L.w-3;x++){if(!__пол(L,x,y))continue;
    const рука=[[x,y],[x,y-1],[x+1,y],[x,y+1],[x-1,y]];if(рука.some(([a,b])=>stashAt(a,b)))continue;
    G.place.x=x;G.place.y=y;const н=Поиск150.тайникРядом(x,y,3,рука);if(!н)continue;__said=[];stashSearch(x,y);
    return {слово:__said.join(" ").slice(0,240),где:dirBetween(н.dx,н.dy)};}}
  return {нет:true};});
 check('2. под рукой пусто, а тайник в трёх шагах — слово «пусто» и сторона, где искать',
  !п.нет&&/пусто/.test(п.слово)&&/Подойдите и обыщите/.test(п.слово)&&п.слово.includes(п.где),п);

 /* ── 3. стук: пустота в трёх шагах — сторона; вплотную — ход ── */
 const с=await page.evaluate(()=>{__тихо();G.secrets={};G.passages={};
  for(let k=0;k<60;k++){const L=__ярус(1900+k*17,2000+k*3,2+k%6);
   for(let y=3;y<L.h-3;y++)for(let x=3;x<L.w-3;x++){if(!__пол(L,x,y))continue;
    const стены=[[0,-1],[1,0],[0,1],[-1,0]].filter(([a,b])=>tileAt(L,x+a,y+b)==="#");if(!стены.length)continue;
    if(стены.some(([a,b])=>propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x+a,y+b,undefined)))continue;
    G.place.x=x;G.place.y=y;const н=Поиск150.пустотаРядом(3);if(!н)continue;
    __said=[];hollowAround();const слово=__said.join(" ").slice(0,260);
    /* подойти вплотную к той стене и простучать */
    let у=null;for(const [a,b] of [[0,-1],[1,0],[0,1],[-1,0]])if(!у&&Завал150.шаг(L,н.x+a,н.y+b))у=[н.x+a,н.y+b];if(!у)continue;
    G.place.x=у[0];G.place.y=у[1];__said=[];hollowAround();const ход=!!passageAt(н.x,н.y);
    return {слово,где:dirBetween(н.dx,н.dy),d:н.d,ход,второе:__said.join(" ").slice(0,160)};}}
  return {нет:true};});
 check('3. стук слышит пустоту за кладкой в трёх шагах — сторона и шаги; вплотную стук открывает ход',
  !с.нет&&/гулче/.test(с.слово)&&с.слово.includes(с.где)&&с.ход,с);

 /* ── 4–6. тайная палата за вещью: пол молчит, лаз назван, вход шагом, после находки закрыт и открывается снова ── */
 const т=await page.evaluate(async()=>{__тихо();G.secrets={};G.passages={};G.secretOpen={};
  for(let k=0;k<200;k++){const L=__ярус(2100+k*19,2200+k*7,2+k%5);
   for(let y=2;y<L.h-2;y++)for(let x=2;x<L.w-2;x++){if(tileAt(L,x,y)!=="X")continue;const pr=propAt(x,y);if(!pr)continue;
    if(!propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,pr.id))continue;
    let с=null;for(const d of ["N","E","S","W"]){const [a,b]=DIRV[d];if(__пол(L,x-a,y-b)){с={d,x:x-a,y:y-b};break;}}if(!с)continue;
    const o={вещь:pr.n};G.place.x=с.x;G.place.y=с.y;
    revealSecret(x,y,pr.id);o.открыт=!!passageAt(x,y);
    /* лаз назван: подпись, «объекты рядом» */
    o.подпись=tileLabel("X",x,y);o.рядом=nearFeatures(4).some(f=>f.x===x&&f.y===y&&/лаз/.test(f.name));
    /* встали на вещь — «здесь лаз», второй шаг — в палату */
    __said=[];moveInside(с.d);o.здесь=__said.filter(t=>/Здесь лаз/.test(t)).slice(0,1);o.взвод=!!(G.place.arm&&G.place.arm.t==="лаз");
    moveInside(с.d);o.вошли=!!G.place.тайник;
    /* пол палаты молчит */
    const lvlS=curLevel();o.полВОписании=/пол тайной палаты/.test(describeHere(true));
    o.полРядом=nearFeatures(4).some(f=>/пол тайной палаты/.test(f.name));
    __said=[];for(const d of ["E","E","S","N"])moveInside(d);o.полВШагах=__said.some(t=>/пол тайной палаты/.test(t));
    /* находку — взять, выбраться: лаз закрыт */
    takeSecretHere();o.взято=secretTaken(G.place.тайник.ключ);__said=[];exitSecret();await new Promise(r=>setTimeout(r,1100));
    o.выход=__said.join(" ").slice(0,300);o.закрыт=!passageAt(x,y);
    /* та же вещь открывает снова; в палате пусто */
    __said=[];revealSecret(x,y,pr.id);o.снова=__said.join(" ").slice(0,200);o.открытСнова=!!passageAt(x,y);
    __said=[];const z=passageAt(x,y);enterSecret(z.x,z.y,z.prop||undefined,z.поМесту);o.внутри=!!G.place.тайник;o.пусто=/пусто/.test(__said.join(" "));
    exitSecret();return o;}}
  return {нет:true};});
 check('4. в тайной палате пол не называется: ни в описании проходов, ни в «объектах рядом», ни на шагах',
  !т.нет&&т.вошли&&!т.полВОписании&&!т.полРядом&&!т.полВШагах,т);
 check('5. открытый лаз назван (подпись вещи, «объекты рядом»); встали на вещь — «здесь лаз», второй шаг в ту же сторону — в палату',
  !т.нет&&т.открыт&&/лаз в тайную палату/.test(т.подпись)&&т.рядом&&т.здесь.length===1&&т.взвод&&т.вошли,т);
 check('6. находку взяли и выбрались — вещь встала на место, лаз закрыт; та же вещь открывает его снова, в палате пусто',
  !т.нет&&т.взято&&/встаёт на место/.test(т.выход)&&т.закрыт&&/открыт снова/.test(т.снова)&&т.открытСнова&&т.внутри&&т.пусто,т);

 /* ── 7. завал: поперёк пути, правда о том, что за ним, тупик — не впустую ── */
 const з=await page.evaluate(()=>{__тихо();const o={поперёк:0,всего:0,слова:[],тупик:null};
  for(let k=0;k<20&&o.всего<6;k++){const L=__ярус(2400+k*23,2500+k*9,2+k%5);
   for(let y=2;y<L.h-2&&o.всего<6;y++)for(let x=2;x<L.w-2&&o.всего<6;x++){if(!__пол(L,x,y))continue;
    const n=[[0,-1],[1,0],[0,1],[-1,0]].filter(([a,b])=>__пол(L,x+a,y+b)).length;if(n!==2)continue;
    G.place.x=x;G.place.y=y;lastMoveDir=["N","E","S","W"][k%4];G.rubbleN=0;
    const r=placeRubble();if(!r)continue;o.всего++;
    if(Завал150.дальше(L,r.x,r.y,x,y).length)o.поперёк++;
    __said=[];clearRubble(r.x,r.y);o.слова.push(__said.join(" ").slice(0,200));setPlaceMark(r.x,r.y,"cleared");}}
  /* тупиковый карман: клетка пола с единственным соседом */
  for(let k=0;k<40&&!o.тупик;k++){const L=__ярус(2600+k*29,2700+k*3,2+k%5);
   for(let y=2;y<L.h-2&&!o.тупик;y++)for(let x=2;x<L.w-2&&!o.тупик;x++){if(!__пол(L,x,y))continue;
    const сос=[[0,-1],[1,0],[0,1],[-1,0]].filter(([a,b])=>Завал150.шаг(L,x+a,y+b));if(сос.length!==1||!__пол(L,x+сос[0][0],y+сос[0][1]))continue;
    const [a,b]=сос[0];G.place.x=x+a;G.place.y=y+b;setPlaceMark(x,y,"rubble");G.rubbleN=1;
    const з0=G.gold,и0=JSON.stringify(G.inv),г0=(G.gear||[]).length;__said=[];clearRubble(x,y);const слово=__said.join(" ");
    o.тупик={слово:слово.slice(0,260),дало:G.gold>з0||JSON.stringify(G.inv)!==и0&&/жил/.test(слово)||/пролом/.test(слово)||(G.gear||[]).length>г0};}}
  return o;});
 check('7. обвал ложится поперёк пути; разбор говорит, куда ведёт ход дальше; тупиковый завал — «тупик» и всегда находка',
  з.всего>=3&&з.поперёк===з.всего&&з.слова.every(t=>/ход ведёт дальше/.test(t)&&!/проход .* свободен/.test(t))
  &&з.тупик&&/тупик/.test(з.тупик.слово)&&/(ниша|жил|пролом)/.test(з.тупик.слово)&&з.тупик.дало,з);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

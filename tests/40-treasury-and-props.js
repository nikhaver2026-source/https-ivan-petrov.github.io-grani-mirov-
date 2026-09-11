/* ════════════════════════════════════════════════════════════════════════
   СОКРОВИЩНИЦА И ВСЯ ОБСТАНОВКА ПОДЗЕМЕЛИЙ

   Два новых слоя мира проверяются здесь целиком.

   Сокровищница. На глубоких ярусах подземелий вырезается запертая палата:
   кольцо стены, дверь «Y» и внутри сундуки, хранитель, изредка знание.
   Требования к ней жёсткие. Запертая дверь не должна отрезать НИЧЕГО, кроме
   собственного нутра палаты: ни лестницы, ни выхода, ни другого сундука —
   иначе ярус превращается в тупик и игрок остаётся заперт. Ключ обязан
   находиться на том же ярусе, в обычном сундуке снаружи палаты. Дверь должна
   поддаваться и плечу, иначе потеря ключа делает ярус наполовину закрытым.
   Открытая дверь становится проходимой клеткой, а не остаётся стеной.

   Обстановка. Сорок два предмета: подсвечники, полки со свитками, шкафы,
   гобелены, клетки, точило, престол, водомёт, песочные часы, весы, жернов и
   прочее. С каждым можно взаимодействовать по-настоящему. Проверяется, что
   ни один не молчит, ни один не ломается, ни один не выдаёт «undefined» и
   ни один не портит числа героя — ни в пустой суме, ни в полной, ни на
   десятом касании подряд. И что в каждом месте выпадает ровно та обстановка,
   которая ему положена: в кузнице — наковальня и точило, в подземелье —
   кости, цепи и грибница, а не престол.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};});

 /* ───────────────── СОКРОВИЩНИЦА ───────────────── */
 const палата=await page.evaluate(()=>{
  const out={ярусов:0,палат:0,беды:[]};
  /* Проходимость берём из самой игры, а не списком: стена — единственная
     сплошная плитка, «Y» держит только пока заперта. */
  const проходима=t=>!!TILE[t]&&!TILE[t].solid&&t!=="Y";
  for(let bx=0;bx<8;bx++)for(let by=0;by<8;by++)for(let d=1;d<=3;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(!lvl)continue;out.ярусов++;
   const v=lvl.vault;if(!v)continue;out.палат++;
   /* дверь на месте и это именно «Y» */
   if(lvl.g[v.door.y][v.door.x]!=="Y")out.беды.push(`${bx},${by},${d}: на месте двери «${lvl.g[v.door.y][v.door.x]}»`);
   /* нутро палаты не пустое: хотя бы один сундук */
   let сундуков=0;
   for(let y=v.y0;y<v.y0+v.h;y++)for(let x=v.x0;x<v.x0+v.w;x++)
    if(lvl.g[y][x]==="C")сундуков++;
   if(!сундуков)out.беды.push(`${bx},${by},${d}: палата без сундуков`);
   /* запертая дверь отрезает только нутро палаты */
   const вход=lvl.entry||{x:1,y:1};
   const видели=new Set(),очередь=[[вход.x,вход.y]];
   const ключ=(x,y)=>x+","+y;
   видели.add(ключ(вход.x,вход.y));
   while(очередь.length){
    const [x,y]=очередь.pop();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy;
     if(ny<0||ny>=lvl.g.length||nx<0||nx>=lvl.g[0].length)continue;
     if(видели.has(ключ(nx,ny)))continue;
     const t=lvl.g[ny][nx];
     if(!проходима(t))continue;                 /* «Y» заперта, сквозь неё нельзя */
     видели.add(ключ(nx,ny));очередь.push([nx,ny]);}}
   for(let y=0;y<lvl.g.length;y++)for(let x=0;x<lvl.g[0].length;x++){
    const t=lvl.g[y][x];
    if(!проходима(t))continue;
    if(видели.has(ключ(x,y)))continue;
    const внутри=x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h;
    if(!внутри)out.беды.push(`${bx},${by},${d}: запертая палата отрезала «${t}» в ${x},${y}`);}
   /* и наоборот: лестница вниз, вверх и выход снаружи палаты */
   for(let y=0;y<lvl.g.length;y++)for(let x=0;x<lvl.g[0].length;x++){
    const t=lvl.g[y][x];
    if(t!==">"&&t!=="<"&&t!=="G")continue;
    if(x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h)
     out.беды.push(`${bx},${by},${d}: лестница «${t}» заперта в палате`);}
   /* обычные сундуки снаружи есть — значит ключу где лежать */
   let снаружи=0;
   for(let y=0;y<lvl.g.length;y++)for(let x=0;x<lvl.g[0].length;x++)
    if(lvl.g[y][x]==="C"&&!(x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h))снаружи++;
   if(!снаружи)out.беды.push(`${bx},${by},${d}: ключу негде лежать, снаружи ни одного сундука`);
  }
  return out;
 });

 const дверь=await page.evaluate(()=>{
  /* Найдём настоящий ярус с палатой и войдём в него */
  let наш=null;
  for(let bx=0;bx<8&&!наш;bx++)for(let by=0;by<8&&!наш;by++)for(let d=2;d<=3&&!наш;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(lvl&&lvl.vault)наш={bx,by,d,lvl};}
  if(!наш)return {нет:true};
  const {bx,by,d,lvl}=наш,v=lvl.vault;
  G.place={bx,by,stype:"ruins",depth:d,name:"Проверочные руины",x:lvl.entry.x,y:lvl.entry.y};
  G.marks={};G.vaults={};G.hp=G.hpMax=500;G.str=10;G.level=1;G.items=[];G.gold=0;
  const из={};
  /* 1. Заперто: плитка ведёт себя как дверь, а не как пол */
  из.заперто=tileAt(curLevel(),v.door.x,v.door.y);
  /* 2. Без ключа: попытка плечом отвечает и не роняет здоровье в ноль */
  window.__said=[];
  let выломал=false;
  for(let i=0;i<80&&!выломал;i++)выломал=!!safeFn(()=>openVault(v.door.x,v.door.y),false);
  из.плечомВышло=выломал;
  из.здоровьеПослеПлеча=G.hp;
  из.речьПлечом=window.__said.join(" ").slice(0,80);
  /* 3. После взлома плитка становится проходимой */
  из.послеВзлома=tileAt(curLevel(),v.door.x,v.door.y);
  из.открытаПоМетке=vaultOpened(curLevel());
  /* 4. Ключ: заново запрём и откроем ключом */
  G.marks={};G.vaults={};G.items=[VAULT_KEY];
  window.__said=[];
  из.ключОткрыл=!!safeFn(()=>openVault(v.door.x,v.door.y),false);
  из.ключСъеден=!(G.items||[]).includes(VAULT_KEY);
  из.плиткаКлючом=tileAt(curLevel(),v.door.x,v.door.y);
  из.речьКлючом=window.__said.join(" ").slice(0,60);
  /* 5. Повторное «действие здесь» на открытой двери отвечает и не ломается */
  window.__said=[];
  G.place.x=v.door.x;G.place.y=v.door.y;
  из.повторОтвет=!!safeFn(()=>openVault(v.door.x,v.door.y),false);
  из.речьПовтор=window.__said.join(" ").slice(0,60);
  /* 6. Сундук внутри палаты богаче обычного */
  let внутрь=null;
  for(let y=v.y0;y<v.y0+v.h&&!внутрь;y++)for(let x=v.x0;x<v.x0+v.w&&!внутрь;x++)
   if(lvl.g[y][x]==="C")внутрь={x,y};
  let снаружи=null;
  for(let y=0;y<lvl.g.length&&!снаружи;y++)for(let x=0;x<lvl.g[0].length&&!снаружи;x++)
   if(lvl.g[y][x]==="C"&&!(x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h))снаружи={x,y};
  G.marks={};G.vaults={};G.gold=0;G.items=[];
  safeFn(()=>openChest(снаружи.x,снаружи.y));
  из.золотоСнаружи=G.gold;
  из.ключВыпал=(G.items||[]).includes(VAULT_KEY);
  G.gold=0;
  safeFn(()=>openChest(внутрь.x,внутрь.y));
  из.золотоВПалате=G.gold;
  /* 7. Внутри палаты — хранитель */
  let хранитель=0;
  for(let y=v.y0;y<v.y0+v.h;y++)for(let x=v.x0;x<v.x0+v.w;x++)if(lvl.g[y][x]==="M")хранитель++;
  из.хранитель=хранитель;
  /* 8. Числа героя целы */
  из.числаЦелы=Number.isFinite(G.hp)&&Number.isFinite(G.gold)&&G.hp>0&&G.gold>=0;
  return из;
 });

 const шагВДверь=await page.evaluate(()=>{
  /* Запертая створка обязана ДЕРЖАТЬ. Плитка «Y» не значится сплошной ни в
     одной таблице, и без своей ветки в moveInside герой проходил сквозь
     замок насквозь — палата стояла открытой настежь. */
  /* Нужен ярус, у которого рядом с дверью и снаружи, и внутри чистый пол:
     на нём проверяется сама створка, а не соседний сундук или логово. */
  const годный=lvl=>{
   const v=lvl&&lvl.vault;if(!v)return false;
   let сн=false,вн=false;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=v.door.x+dx,ny=v.door.y+dy;
    if(!lvl.g[ny]||!lvl.g[ny][nx])continue;
    const свой=nx>=v.x0&&nx<v.x0+v.w&&ny>=v.y0&&ny<v.y0+v.h;
    if(lvl.g[ny][nx]!==".")continue;
    if(свой)вн=true;else сн=true;}
   return сн&&вн;};
  let наш=null;
  for(let bx=0;bx<8&&!наш;bx++)for(let by=0;by<8&&!наш;by++)for(let d=2;d<=3&&!наш;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(годный(lvl))наш={bx,by,d,lvl};}
  if(!наш)return {нет:true};
  const {bx,by,d,lvl}=наш,v=lvl.vault;
  const из={};
  /* сторона, с которой к двери подходят снаружи палаты */
  const внутри=(x,y)=>x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h;
  let снаружи=null,внутрь=null,кВнутри=null;
  for(const [dx,dy,к,от] of [[1,0,"E","W"],[-1,0,"W","E"],[0,1,"S","N"],[0,-1,"N","S"]]){
   const nx=v.door.x+dx,ny=v.door.y+dy;
   if(внутри(nx,ny)){внутрь={x:nx,y:ny};кВнутри=к;}
   else if(lvl.g[ny]&&lvl.g[ny][nx]==="."){снаружи={x:nx,y:ny,к:от};}}
  if(!снаружи||!внутрь)return {нетПодхода:true,снаружи,внутрь,палата:v};
  const кДвери=снаружи.к;      /* «от» уже смотрит с соседней клетки на дверь */
  /* Живые обитатели яруса здесь ни при чём: их дело проверяется отдельно, а
     бродячий житель, вставший на пути, сорвал бы проверку самой створки. */
  const тихо=()=>{G.inCombat=false;G.combat=null;
   safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  const ор=Math.random;Math.random=()=>0.999;      /* плечо всегда мимо */
  G.place={bx,by,stype:"ruins",depth:d,name:"м",x:снаружи.x,y:снаружи.y};
  G.marks={};G.vaults={};G.hp=G.hpMax=600;G.str=1;G.level=1;G.items=[];тихо();
  let прошёл=false;
  for(let i=0;i<15;i++){window.__said=[];тихо();safeFn(()=>moveInside(кДвери));
   if(G.place.x!==снаружи.x||G.place.y!==снаружи.y){прошёл=true;break;}}
  из.держит=!прошёл;
  из.речь=window.__said.join(" ").slice(0,80);
  из.живой=G.hp>0;
  Math.random=ор;
  /* с ключом: первый шаг отпирает, второй ставит в проём, третий — внутрь */
  G.marks={};G.vaults={};G.items=[VAULT_KEY];G.hp=G.hpMax=600;
  G.place.x=снаружи.x;G.place.y=снаружи.y;тихо();
  safeFn(()=>moveInside(кДвери));
  из.отпираяНеСдвинулся=G.place.x===снаружи.x&&G.place.y===снаружи.y;
  тихо();safeFn(()=>moveInside(кДвери));
  из.вПроёме=G.place.x===v.door.x&&G.place.y===v.door.y;
  тихо();safeFn(()=>moveInside(кВнутри));
  из.вошёл=вСокровищнице(curLevel(),G.place.x,G.place.y);
  /* и обратно наружу — палата не ловушка */
  const назад=кВнутри==="E"?"W":кВнутри==="W"?"E":кВнутри==="N"?"S":"N";
  тихо();safeFn(()=>moveInside(назад));тихо();safeFn(()=>moveInside(назад));
  из.вышел=!вСокровищнице(curLevel(),G.place.x,G.place.y);
  return из;
 });

 const чистка=await page.evaluate(()=>{
  /* Отметки клеток прореживаются, когда память браузера на исходе. Палата не
     имеет права запереться обратно: ключ за неё уже отдан, и второй раз он не
     выпадет. Проверяем самый злой случай — жёсткую чистку. */
  let наш=null;
  for(let bx=0;bx<8&&!наш;bx++)for(let by=0;by<8&&!наш;by++)for(let d=2;d<=3&&!наш;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(lvl&&lvl.vault)наш={bx,by,d,lvl};}
  if(!наш)return {нет:true};
  const {bx,by,d,lvl}=наш,v=lvl.vault;
  G.place={bx,by,stype:"ruins",depth:d,name:"Руины",x:1,y:1};
  G.marks={};G.vaults={};G.items=[VAULT_KEY];G.hp=G.hpMax=400;
  safeFn(()=>openVault(v.door.x,v.door.y));
  const доЧистки=vaultOpened(curLevel());
  /* забиваем отметки под завязку и чистим по-жёсткому */
  for(let i=0;i<5000;i++)G.marks["мусор"+i]="open";
  safeFn(()=>pruneState(true));
  const послеЧистки=vaultOpened(curLevel());
  const плитка=tileAt(curLevel(),v.door.x,v.door.y);
  /* и ключ обратно в сундуки не возвращается: палата открыта */
  G.items=[];
  let ключВыпал=false;
  for(let y=0;y<lvl.g.length&&!ключВыпал;y++)for(let x=0;x<lvl.g[0].length;x++){
   if(lvl.g[y][x]!=="C")continue;
   safeFn(()=>openChest(x,y));
   if((G.items||[]).includes(VAULT_KEY)){ключВыпал=true;break;}}
  return {доЧистки,послеЧистки,плитка,ключНеВернулся:!ключВыпал,
   палат:Object.keys(G.vaults||{}).length};
 });

 const ключНаЯрусе=await page.evaluate(()=>{
  /* Ключ должен реально находиться перебором сундуков яруса, а не «в среднем» */
  let нашли=0,ярусов=0;
  for(let bx=0;bx<8;bx++)for(let by=0;by<8;by++)for(let d=2;d<=3;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(!lvl||!lvl.vault)continue;
   const v=lvl.vault;ярусов++;
   G.place={bx,by,stype:"ruins",depth:d,name:"м",x:1,y:1};
   G.marks={};G.vaults={};G.items=[];G.gold=0;G.hp=G.hpMax=9000;
   const сундуки=[];
   for(let y=0;y<lvl.g.length;y++)for(let x=0;x<lvl.g[0].length;x++)
    if(lvl.g[y][x]==="C"&&!(x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h))сундуки.push({x,y});
   for(const c of сундуки){safeFn(()=>openChest(c.x,c.y));
    if((G.items||[]).includes(VAULT_KEY))break;}
   if((G.items||[]).includes(VAULT_KEY))нашли++;
  }
  return {ярусов,нашли};
 });

 /* ───────────────── ОБСТАНОВКА ───────────────── */
 const вещи=await page.evaluate(()=>{
  const bad=[],молчали=[],говорили=new Set();
  const базовый=()=>{G.hp=G.hpMax=100;G.gold=500;G.level=5;G.xp=0;G.str=10;G.agi=10;G.mind=10;
   G.mp=G.mpMax=50;G.food=100;G.water=100;G.items=[];G.inv={};G.equip={weapon:null,armor:null};};
  const богатый=()=>{базовый();G.gold=9000;G.hp=40;G.mp=5;G.food=20;G.water=20;
   G.items=["Факел","Верёвка"];
   for(const р of Object.keys(RESICON))G.inv[р]=3;
   G.equip.weapon={id:1,name:"Меч проверки",type:"Меч",val:10};
   G.equip.armor={id:2,name:"Кольчуга проверки",type:"Кольчуга",val:8};};
  const числаЦелы=где=>{
   for(const k of ["hp","hpMax","mp","mpMax","gold","xp","level","str","agi","mind","food","water"]){
    const v=G[k];
    if(!Number.isFinite(v))bad.push(`${где}: ${k}=${v}`);
    else if(v<0)bad.push(`${где}: ${k} в минусе (${v})`);}
   if(G.hp>G.hpMax)bad.push(`${где}: здоровье выше предела`);
   if(G.mp>G.mpMax)bad.push(`${где}: сила выше предела`);
   for(const [р,н] of Object.entries(G.inv||{}))
    if(!Number.isFinite(н)||н<0)bad.push(`${где}: запас «${р}»=${н}`);};

  const места=Object.keys(PROPS_BY_PLACE);
  for(const место of места){
   const глубина=место==="dungeon"?1:0,stype=место==="dungeon"?"ruins":место;
   for(const состояние of ["пусто","полно"]){
    for(const p of PROPS){
     (состояние==="пусто"?базовый:богатый)();
     G.place={bx:12,by:7,stype,depth:глубина,name:"Проверочное место",x:3,y:3};
     window.__said=[];
     try{p.use();}catch(e){bad.push(`«${p.id}» ${место}/${состояние} сломался: ${e&&e.message}`);}
     const речь=window.__said.join(" ").trim();
     if(!речь)молчали.push(`${p.id}/${место}/${состояние}`);
     else{говорили.add(p.id);
      if(/undefined|NaN|\[object/.test(речь))bad.push(`«${p.id}» ${место}/${состояние}: ${речь.slice(0,100)}`);}
     числаЦелы(`«${p.id}» ${место}/${состояние}`);
    }}}
  /* десять касаний подряд */
  for(const p of PROPS){
   богатый();
   G.place={bx:4,by:9,stype:"castle",depth:0,name:"Замок",x:2,y:2};
   for(let i=0;i<10;i++){window.__said=[];
    try{p.use();}catch(e){bad.push(`«${p.id}» сломался на ${i+1}-м касании: ${e&&e.message}`);break;}
    числаЦелы(`«${p.id}» касание ${i+1}`);}}
  return {всего:PROPS.length,говорили:говорили.size,молчали,bad};
 });

 const раскладка=await page.evaluate(()=>{
  const беды=[],ids=PROPS.map(p=>p.id);
  const дубли=ids.filter((x,i)=>ids.indexOf(x)!==i);
  for(const [место,список] of Object.entries(PROPS_BY_PLACE))
   for(const id of список)if(!ids.includes(id))беды.push(`${место}: нет предмета «${id}»`);
  const исп=new Set(Object.values(PROPS_BY_PLACE).flat());
  for(const id of ids)if(!исп.has(id))беды.push(`«${id}» нигде не встречается`);
  for(const p of PROPS){
   if(!p.n)беды.push(`«${p.id}» без имени`);
   if(typeof p.use!=="function")беды.push(`«${p.id}» без действия`);
   if(!p.b||!(BEACONS[p.b]||BEACON_SAMPLE[p.b]||BEACON_ROLE[p.b]))
    беды.push(`«${p.id}» маяк «${p.b}» ничем не звучит`);
   const src=String(p.use);
   for(const m of src.matchAll(/Bank\.play\(\s*"([a-z0-9_]+)"/gi))
    if(!SOUND_BANK[m[1]])беды.push(`«${p.id}» зовёт несуществующую запись «${m[1]}»`);
   for(const m of src.matchAll(/beaconAt?\(\s*"([a-z0-9_]+)"/gi))
    if(!(BEACONS[m[1]]||BEACON_SAMPLE[m[1]]||BEACON_ROLE[m[1]]))
     беды.push(`«${p.id}» зовёт несуществующий маяк «${m[1]}»`);}
  /* в каждом месте выпадает ровно своё */
  const промахи=[];
  for(const место of Object.keys(PROPS_BY_PLACE)){
   const глубина=место==="dungeon"?1:0,stype=место==="dungeon"?"ruins":место;
   const выпало=new Set();
   for(let bx=0;bx<5;bx++)for(let by=0;by<5;by++)for(let x=0;x<20;x++)for(let y=0;y<20;y++){
    G.place={bx,by,stype,depth:глубина,name:"м",x,y};
    const pr=safeFn(()=>propAt(x,y),null);if(pr)выпало.add(pr.id);}
   const надо=new Set(PROPS_BY_PLACE[место]);
   for(const id of надо)if(!выпало.has(id))промахи.push(`${место}: «${id}» не выпадает`);
   for(const id of выпало)if(!надо.has(id))промахи.push(`${место}: чужой «${id}»`);}
  return {дубли,беды,промахи};
 });

 const разовость=await page.evaluate(()=>{
  /* То, что с обстановки БЕРУТ, на клетке конечно. Иначе игрок встаёт на
     груду костей и мелет её в бесконечный доход, а вся торговля и ремесло
     теряют смысл. Считаем прибыток за первое касание и за девять следующих:
     второе и дальше не должны приносить НИЧЕГО. */
  const беды=[],немые=[];
  const богатство=()=>(Number(G.gold)||0)*1000+
   Object.values(G.inv||{}).reduce((a,b)=>a+(Number(b)||0),0)*10+
   (G.items||[]).length;
  const чисто=()=>{G.hp=G.hpMax=500;G.mp=G.mpMax=200;G.gold=0;G.inv={};G.items=[];
   G.food=200;G.water=200;G.marks={};G.vaults={};
   G.equip={weapon:null,armor:null};};
  let дающих=0,первый=0,остальные=0,всеОтвечают=true;
  for(const место of Object.keys(PROPS_BY_PLACE)){
   const глубина=место==="dungeon"?1:0,stype=место==="dungeon"?"ruins":место;
   for(const id of PROPS_BY_PLACE[место]){
    /* найдём клетку, на которой выпадает именно этот предмет */
    let клетка=null;
    for(let x=0;x<24&&!клетка;x++)for(let y=0;y<24;y++){
     G.place={bx:9,by:4,stype,depth:глубина,name:"м",x,y};
     const pr=safeFn(()=>propAt(x,y),null);
     if(pr&&pr.id===id){клетка={x,y};break;}}
    if(!клетка)continue;
    чисто();
    G.place={bx:9,by:4,stype,depth:глубина,name:"м",x:клетка.x,y:клетка.y};
    const до=богатство();
    window.__said=[];safeFn(()=>useProp(клетка.x,клетка.y));
    const посл1=богатство()-до;
    if(посл1<=0)continue;                 /* эта вещь ничего не даёт — не о ней речь */
    дающих++;первый+=посл1;
    let ещё=0;
    for(let i=0;i<9;i++){
     const б=богатство();
     window.__said=[];safeFn(()=>useProp(клетка.x,клетка.y));
     if(!window.__said.join("").trim()){всеОтвечают=false;немые.push(`${id}/${место}`);}
     ещё+=богатство()-б;}
    остальные+=ещё;
    if(ещё>0)беды.push(`«${id}» (${место}) даёт снова и снова: за девять касаний ещё ${ещё}`);
   }}
  /* Соседняя такая же вещь на другой клетке должна дать своё */
  let соседняяДала=false;
  чисто();
  for(const место of ["dungeon","cave_entrance","ruins"]){
   const глубина=место==="dungeon"?1:0,stype=место==="dungeon"?"ruins":место;
   const клетки=[];
   for(let x=0;x<24;x++)for(let y=0;y<24;y++){
    G.place={bx:2,by:8,stype,depth:глубина,name:"м",x,y};
    const pr=safeFn(()=>propAt(x,y),null);
    if(pr&&pr.id==="bones")клетки.push({x,y});}
   if(клетки.length<2)continue;
   чисто();
   G.place={bx:2,by:8,stype,depth:глубина,name:"м",x:клетки[0].x,y:клетки[0].y};
   safeFn(()=>useProp(клетки[0].x,клетки[0].y));
   const после=богатство();
   safeFn(()=>useProp(клетки[0].x,клетки[0].y));
   const тажеКлетка=богатство()-после;
   G.place.x=клетки[1].x;G.place.y=клетки[1].y;
   safeFn(()=>useProp(клетки[1].x,клетки[1].y));
   const другая=богатство()-после;
   соседняяДала=тажеКлетка===0&&другая>0;
   break;}
  return {беды,дающих,первый,остальные,всеОтвечают,немые:немые.slice(0,5),соседняяДала};
 });

 const передышка=await page.evaluate(()=>{
  /* Очаг, жаровня, чаша, фонтан, мешки, жёрнов, круг и курильница лечили
     мгновенно и без счёта: игрок вставал у очага и жал одно и то же, пока
     здоровье не упрётся в предел, — и опасность мира исчезала совсем. Теперь
     всякая передышка стоит часа мира. Проверяем, что час и вправду уходит,
     что даром его не берут и что полное здоровье стоит нескольких часов. */
  const беды=[];let лечащих=0,даромНеБерут=true;
  const места=Object.keys(PROPS_BY_PLACE);
  for(const p of PROPS){
   /* Ставим героя израненным и смотрим, что стало с часами. */
   G.place={bx:6,by:6,stype:"tavern",depth:0,name:"м",x:3,y:3};
   G.hp=1;G.hpMax=400;G.mana=0;G.manaMax=200;G.mp=0;G.mpMax=200;
   G.food=10;G.water=10;G.gold=100;G.inv={трава:5,грибы:5,ягоды:5};
   G.items=[];G.equip={weapon:null,armor:null};G.marks={};G.vaults={};
   G.day=10;G.hour=8;
   const дч=G.day*24+G.hour,дhp=G.hp,дmana=G.mana;
   safeFn(()=>p.use());
   const пч=G.day*24+G.hour;
   const полегчало=G.hp>дhp||G.mana>дmana;
   if(!полегчало)continue;
   лечащих++;
   if(пч-дч<0.9)беды.push(`«${p.id}» лечит, но времени не берёт вовсе`);
   if(пч-дч>4)беды.push(`«${p.id}» съедает ${Math.round(пч-дч)} часов за одну передышку`);
   /* А с полным здоровьем и силой время стоять не должно */
   G.hp=G.hpMax;G.mana=G.manaMax;G.mp=G.mpMax;G.water=200;G.food=200;
   G.day=10;G.hour=8;
   const дч2=G.day*24+G.hour;
   safeFn(()=>p.use());
   if(G.day*24+G.hour-дч2>0.01&&G.hp>=G.hpMax&&G.mana>=G.manaMax){
    даромНеБерут=false;беды.push(`«${p.id}» берёт время, ничего не дав взамен`);}
  }
  /* Сколько часов уходит на полное здоровье у одного очага */
  const очаг=PROP_BY_ID["hearth"];
  let часов=0;
  if(очаг){
   G.place={bx:6,by:6,stype:"tavern",depth:0,name:"м",x:3,y:3};
   G.hp=1;G.hpMax=400;G.day=10;G.hour=0;G.water=0;
   const н=G.day*24+G.hour;
   for(let i=0;i<200&&G.hp<G.hpMax;i++)safeFn(()=>очаг.use());
   часов=G.day*24+G.hour-н;}
  return {беды,лечащих,даромНеБерут,часовНаПолноеЗдоровье:Math.round(часов)};
 });

 const черезПлитку=await page.evaluate(()=>{
  /* Настоящий путь игрока: «действие здесь» на клетке обстановки */
  const беды=[];let сработало=0,клеток=0;
  for(const место of Object.keys(PROPS_BY_PLACE)){
   const глубина=место==="dungeon"?1:0,stype=место==="dungeon"?"ruins":место;
   for(let x=0;x<14;x++)for(let y=0;y<14;y++){
    G.place={bx:3,by:3,stype,depth:глубина,name:"м",x,y};
    G.hp=G.hpMax=200;G.gold=100;G.mp=G.mpMax=40;
    клеток++;window.__said=[];
    let ok=false;
    try{ok=!!useProp(x,y);}catch(e){беды.push(`useProp ${место} ${x},${y}: ${e&&e.message}`);}
    if(ok&&window.__said.join("").trim())сработало++;
    if(!Number.isFinite(G.hp)||G.hp<0)беды.push(`useProp ${место} ${x},${y}: здоровье ${G.hp}`);}}
  return {клеток,сработало,беды};
 });

 /* ── итоги ── */
 check('сокровищницы вырезаются на глубоких ярусах',
  палата.палат>=10,{ярусов:палата.ярусов,палат:палата.палат});
 check('запертая палата не отрезает ничего, кроме собственного нутра',
  палата.беды.length===0,палата.беды.slice(0,5));
 check('дверь палаты — плитка «Y», пока не открыта',
  дверь.заперто==="Y",дверь.заперто);
 check('без ключа дверь поддаётся плечу и не убивает героя',
  дверь.плечомВышло&&дверь.здоровьеПослеПлеча>0,
  {вышло:дверь.плечомВышло,hp:дверь.здоровьеПослеПлеча});
 check('каждая попытка плечом отвечает словами',
  /двер/i.test(дверь.речьПлечом||''),дверь.речьПлечом);
 check('после взлома дверь становится проходимой',
  дверь.послеВзлома==="+"&&дверь.открытаПоМетке,
  {плитка:дверь.послеВзлома,метка:дверь.открытаПоМетке});
 check('ключ открывает дверь и расходуется',
  дверь.ключОткрыл&&дверь.ключСъеден&&дверь.плиткаКлючом==="+",
  {открыл:дверь.ключОткрыл,съеден:дверь.ключСъеден,плитка:дверь.плиткаКлючом});
 check('открытая дверь отвечает на повторное действие, а не молчит',
  дверь.повторОтвет&&!!(дверь.речьПовтор||'').trim(),дверь.речьПовтор);
 check('сундук в палате богаче обычного',
  дверь.золотоВПалате>дверь.золотоСнаружи,
  {вПалате:дверь.золотоВПалате,снаружи:дверь.золотоСнаружи});
 check('в палате стоит хранитель',дверь.хранитель>=1,дверь.хранитель);
 check('числа героя целы после всей возни с дверью',дверь.числаЦелы===true,дверь);
 check('запертая створка держит: сквозь замок не пройти',
  шагВДверь.держит===true&&шагВДверь.живой===true,шагВДверь);
 check('удар в запертую створку отвечает словами, а не молчанием',
  /двер|заперт/i.test(шагВДверь.речь||''),шагВДверь.речь);
 check('ключ отпирает створку с шага, не двигая героя внутрь сразу',
  шагВДверь.отпираяНеСдвинулся===true&&шагВДверь.вПроёме===true,шагВДверь);
 check('в открытую палату можно войти и из неё выйти',
  шагВДверь.вошёл===true&&шагВДверь.вышел===true,шагВДверь);
 check('отпертая палата переживает жёсткую чистку памяти отметок',
  чистка.послеЧистки===true&&чистка.ключНеВернулся===true,чистка);
 check('ключ находится в обычных сундуках яруса на каждом ярусе с палатой',
  ключНаЯрусе.ярусов>0&&ключНаЯрусе.нашли===ключНаЯрусе.ярусов,ключНаЯрусе);

 check('обстановки в игре не меньше сорока предметов',
  вещи.всего>=40,вещи.всего);
 check('каждый предмет обстановки отвечает словами',
  вещи.молчали.length===0&&вещи.говорили===вещи.всего,
  {молчали:вещи.молчали.slice(0,8),говорили:вещи.говорили});
 check('ни один предмет не ломается и не портит числа героя',
  вещи.bad.length===0,вещи.bad.slice(0,8));
 check('у предметов нет повторяющихся имён',раскладка.дубли.length===0,раскладка.дубли);
 check('все ссылки обстановки и все её звуки существуют',
  раскладка.беды.length===0,раскладка.беды.slice(0,8));
 check('в каждом месте выпадает ровно своя обстановка',
  раскладка.промахи.length===0,раскладка.промахи.slice(0,8));
 check('пожива с обстановки берётся один раз, а не доится без конца',
  разовость.беды.length===0,{беды:разовость.беды.slice(0,6),
   дающих:разовость.дающих,первый:разовость.первый,остальные:разовость.остальные});
 check('после исчерпания вещь по-прежнему отвечает и говорит, что тут прибрано',
  разовость.всеОтвечают===true,разовость.немые);
 check('исчерпание помнится на клетке, а не на предмете вообще',
  разовость.соседняяДала===true,разовость);
 check('передышка у обстановки стоит времени мира, а не даётся даром',
  передышка.беды.length===0&&передышка.лечащих>=5,
  {беды:передышка.беды.slice(0,5),лечащих:передышка.лечащих});
 check('передышка не отнимает время, когда лечить и поить уже нечего',
  передышка.даромНеБерут===true,передышка);
 check('здоровье до предела не набрать одним предметом без счёта часов',
  передышка.часовНаПолноеЗдоровье>=3,передышка);
 check('обстановка срабатывает и через клетку, по настоящему пути игрока',
  черезПлитку.беды.length===0&&черезПлитку.сработало===черезПлитку.клеток,черезПлитку);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

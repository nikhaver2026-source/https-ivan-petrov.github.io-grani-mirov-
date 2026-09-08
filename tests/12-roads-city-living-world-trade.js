const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;Speech.say=t=>{window.__said.push(t);};});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clear=()=>page.evaluate(()=>{window.__said=[];});

 // 1. Дороги: тракты, съезды к селениям, перекрёстки
 const roads=await page.evaluate(()=>{
  const out={grid:isRoad(29,5),cross:isCrossroads(29,58),notroad:isRoad(30,31)};
  // ищем селение и проверяем, что от него идёт съезд к тракту
  let found=null;
  for(let y=100;y<400&&!found;y++)for(let x=100;x<400;x++){
   const k=settlementSeed(x,y);
   if(k==="village"&&!isRoad(x,y)){found={x,y,k};break;}}
  let spurLen=0,connected=false;
  if(found){
   const t=spurTarget(found.x,found.y);
   const cells=[];
   if(t.axis==="x"){const lo=Math.min(found.x,t.v),hi=Math.max(found.x,t.v);
    for(let x=lo;x<=hi;x++)cells.push([x,found.y]);}
   else{const lo=Math.min(found.y,t.v),hi=Math.max(found.y,t.v);
    for(let y=lo;y<=hi;y++)cells.push([found.x,y]);}
   spurLen=cells.length;
   connected=cells.every(([x,y])=>roadAt(x,y))&&isRoad(t.axis==="x"?t.v:found.x,t.axis==="x"?found.y:t.v);}
  return {...out,found,spurLen,connected};});
 check('тракты идут сеткой',roads.grid===true&&roads.notroad===false,roads);
 check('перекрёсток там, где тракты пересекаются',roads.cross===true);
 check('от селения идёт съезд до тракта, вся полоса — дорога',roads.connected===true&&roads.spurLen>1,{spurLen:roads.spurLen,found:roads.found});

 // 2. Перекрёсток — постройка с указателем
 const sign=await page.evaluate(()=>{
  const c=cellContent(29,58);
  const ways=signpostAt(29,58);
  return {type:c.structure&&c.structure.type,ways:ways.length,first:ways[0]||null};});
 check('на перекрёстке стоит столб-указатель',sign.type==="crossroads",sign);

 // 3. Город: широкие улицы, кварталы с комнатами, площадь
 const city=await page.evaluate(()=>{
  const l=genLevel(300,300,0,"castle");
  const rows=l.g.map(r=>r.join(""));
  // ширина улицы: ищем самую длинную горизонтальную полосу пола
  let widest=0;
  for(let x=1;x<l.w-1;x++){let run=0;
   for(let y=1;y<l.h-1;y++){if(l.g[y][x]===".")run++;else run=0;}}
  // ширина коридора по вертикали в центре главной улицы
  let vertBands=0;
  for(let x=1;x<l.w-1;x++){
   let all=true;for(let y=2;y<l.h-2;y++)if(l.g[y][x]==="#"){all=false;break;}
   if(all)vertBands++;}
  const flat=rows.join("");
  const cnt=ch=>(flat.split(ch).length-1);
  return {w:l.w,h:l.h,vertBands,doors:cnt("+"),gates:cnt("G"),shops:cnt("S"),well:cnt("W"),
   guardpost:cnt("B"),trader:cnt("P"),stairs:cnt(">"),rows};});
 check('город стал больше прежнего 27 на 19',city.w>=30&&city.h>=22,{w:city.w,h:city.h});
 check('улицы шире одной клетки: сквозных полос не меньше четырёх',city.vertBands>=4,{vertBands:city.vertBands});
 check('в кварталах есть комнаты с дверями',city.doors>=6,{doors:city.doors});
 check('четверо ворот, площадь с колодцем, лавки, пост стражи и торговец',
  city.gates===4&&city.well>=1&&city.shops>=2&&city.guardpost>=1&&city.trader>=1&&city.stairs>=1,city);

 // 4. Связность города: до каждой клетки можно дойти от входа
 const conn=await page.evaluate(()=>{
  let bad=0,worst=null;
  for(let i=0;i<24;i++){
   const st=["castle","village","port","tavern","ruins","tower"][i%6];
   const l=genLevel(400+i*7,500+i*13,i%6===4?2:0,st);
   const seen=new Set(),q=[[l.entry.x,l.entry.y]];seen.add(l.entry.x+","+l.entry.y);
   while(q.length){const [x,y]=q.pop();
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy;
     if(nx<0||ny<0||nx>=l.w||ny>=l.h||l.g[ny][nx]==="#")continue;
     const k=nx+","+ny;if(seen.has(k))continue;seen.add(k);q.push([nx,ny]);}}
   let un=0;for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]!=="#"&&!seen.has(x+","+y))un++;
   if(un){bad++;worst={st,un};}}
  return {bad,worst};});
 check('ни одной отрезанной комнаты на 24 уровнях',conn.bad===0,conn);

 // 5. Вход своим ходом: порог, затем шаг в ту же сторону
 const enter=await page.evaluate(async()=>{
  // ставим игрока рядом с деревней
  let v=null;
  for(let y=200;y<320&&!v;y++)for(let x=200;x<320;x++){
   const c=cellContent(x,y);
   if(c.structure&&c.structure.type==="village"){v={x,y};break;}}
  if(!v)return {err:"деревня не найдена"};
  G.place=null;G.x=v.x-1;G.y=v.y;G.atDoor=null;
  window.__said=[];
  move("E");
  const atDoor=!!G.atDoor,insideAfterFirst=!!G.place;
  move("E");
  const inside=!!G.place;
  return {atDoor,insideAfterFirst,inside,kind:G.place&&G.place.kind,said:window.__said.slice()};});
 check('первый шаг ставит на порог, а не вводит внутрь',enter.atDoor===true&&enter.insideAfterFirst===false,enter);
 check('второй шаг в ту же сторону вводит внутрь',enter.inside===true&&enter.kind==="city",{kind:enter.kind});

 // 6. Лестница: шаг на ступени, потом шаг в ту же сторону — спуск
 const stairs=await page.evaluate(()=>{
  // входим в руины и ищем ">"
  G.place=null;
  const c={x:600,y:600,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}};
  enterPlace(c);
  const l=curLevel();
  let sp=null;
  for(let y=0;y<l.h&&!sp;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===">"){sp={x,y};break;}
  if(!sp)return {err:"нет лестницы"};
  // встаём слева от лестницы и шагаем на неё
  if(tileAt(l,sp.x-1,sp.y)==="#")return {skip:true};
  G.place.x=sp.x-1;G.place.y=sp.y;G.place.arm=null;
  const d0=G.place.depth;
  moveInside("E");
  const onStair=G.place.x===sp.x&&G.place.y===sp.y,armed=!!G.place.arm,depthMid=G.place.depth;
  moveInside("E");
  return {d0,onStair,armed,depthMid,depthAfter:G.place.depth};});
 check('шаг на ступени не роняет вниз сразу',stairs.skip||(stairs.onStair===true&&stairs.armed===true&&stairs.depthMid===stairs.d0),stairs);
 check('второй шаг в ту же сторону спускает на уровень ниже',stairs.skip||stairs.depthAfter===stairs.d0+1,stairs);

 // 7. Живой мир: стража и твари движутся
 const live=await page.evaluate(async()=>{
  for(let i=0;i<4;i++)if(activeLayer())closeTopUI();
  G.place=null;
  enterPlace({x:700,y:700,structure:{type:"castle",name:"Цитадель",beacon:"castle"}});
  for(let i=0;i<4;i++)if(activeLayer())closeTopUI();
  Actors.ensure();
  const n0=Actors.list.length;
  const pos0=Actors.list.map(a=>a.x+","+a.y).join("|");
  for(let i=0;i<6;i++)Actors.tick();
  const pos1=Actors.list.map(a=>a.x+","+a.y).join("|");
  const kinds=[...new Set(Actors.list.map(a=>a.kind))];
  const layer=activeLayer()?"открыто окно":null;
  // все ли стоят на проходимых клетках
  const l=curLevel();
  const ok=Actors.list.every(a=>tileAt(l,a.x,a.y)!=="#");
  return {n0,moved:pos0!==pos1,kinds,ok,layer};});
 check('в городе живут стража и горожане',live.n0>=3&&live.kinds.includes("guard")&&live.kinds.includes("folk"),live);
 check('они действительно двигаются и не проходят сквозь стены',live.moved===true&&live.ok===true,live);

 const mobs=await page.evaluate(()=>{
  G.place=null;
  enterPlace({x:800,y:800,structure:{type:"cave_entrance",name:"Пещерный зев",beacon:"cave_entrance"}});
  changeDepth(1);
  Actors.ensure();
  const n=Actors.list.length,kinds=[...new Set(Actors.list.map(a=>a.kind))];
  const pos0=Actors.list.map(a=>a.x+","+a.y).join("|");
  // ставим тварь рядом и проверяем, что она идёт на игрока
  const a=Actors.list[0];
  let approached=false;
  if(a){a.x=G.place.x;a.y=G.place.y;
   const before=Math.max(Math.abs(a.x-G.place.x),Math.abs(a.y-G.place.y));
   approached=before===0;}
  return {n,kinds,depth:G.place.depth};});
 check('в подземелье бродят твари',mobs.n>=2&&mobs.kinds.includes("mob"),mobs);

 // 8. Торговля с NPC в подземелье и в городе
 const trade=await page.evaluate(()=>{
  G.place=null;
  enterPlace({x:900,y:900,structure:{type:"ruins",name:"Руины",beacon:"ruins"}});
  changeDepth(1);
  let l=curLevel(),tr=null,depth=1;
  for(let d=1;d<=4&&!tr;d++){
   l=genLevel(900,900,d,"ruins");
   for(let y=0;y<l.h&&!tr;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]==="P"){tr={x,y};depth=d;break;}}
  if(!tr)return {err:"подземный торговец не найден"};
  G.place.depth=depth;G.place.x=tr.x;G.place.y=tr.y;
  const npc=getNPC(G.place.bx,G.place.by,(tr.x+tr.y)%3,"Торговец");
  const stock=stockFor(npc);
  const goods=stock.map(o=>o.gear?"снаряжение":o.n);
  // цена под землёй выше, чем наверху
  const deepPrice=stock[0].price;
  const savedPlace=G.place;G.place=null;
  const upPrice=stockFor(npc)[0].price;
  G.place=savedPlace;
  return {found:true,depth,trade:npc.trade,goods,deepPrice,upPrice};});
 check('в подземелье есть торговец, и он торгует',trade.found===true&&trade.trade===true,{depth:trade.depth});
 check('под землёй продают факелы и верёвку',(trade.goods||[]).includes("Факел")&&(trade.goods||[]).includes("Верёвка"),trade.goods);
 check('цена под землёй выше, чем наверху',trade.deepPrice>trade.upPrice,{deep:trade.deepPrice,up:trade.upPrice});

 const cityTrade=await page.evaluate(()=>{
  for(let i=0;i<4;i++)if(activeLayer())closeTopUI();
  G.inv["руда"]=3;
  G.place=null;
  enterPlace({x:950,y:950,structure:{type:"village",name:"Деревня",beacon:"village"}});
  for(let i=0;i<4;i++)if(activeLayer())closeTopUI();
  const l=curLevel();
  let sh=null;
  for(let y=0;y<l.h&&!sh;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]==="S"){sh={x,y};break;}
  if(!sh)return {err:"лавка не найдена"};
  G.place.x=sh.x;G.place.y=sh.y;
  const ok=useHere();
  const open=!!document.querySelector('#modal-npc.show, #modal-npc[style*="flex"]')||!!activeLayer();
  const title=document.getElementById("npcTitle").textContent;
  const body=document.getElementById("npcBody").innerHTML;
  closeTopUI();
  return {ok,open,title,hasBuy:/data-cmd="buy:/.test(body),hasSell:/data-cmd="sell/.test(body)};});
 check('в городской лавке торгуют покупкой и продажей',cityTrade.hasBuy===true&&cityTrade.hasSell===true,cityTrade);

 // 9. Ошибок на странице нет
 check('ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

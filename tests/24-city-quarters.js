const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. У каждого города свой набор имён, и он всегда один и тот же
 const uniq=await page.evaluate(()=>{
  const cities=[];
  for(let i=0;i<24;i++){
   const x=137+i*79,y=211+i*53;
   levelCache.clear();
   const l=genLevel(x,y,0,i%3===0?"castle":i%3===1?"village":"port");
   cities.push({x,y,names:l.blocks.map(b=>b.name),special:(l.blocks.find(b=>b.special)||{}).name||null,
    street:l.street,square:l.square});}
  /* Устойчивость: тот же город — те же имена. */
  levelCache.clear();
  const again=genLevel(137,211,0,"castle").blocks.map(b=>b.name);
  const same=JSON.stringify(again)===JSON.stringify(cities[0].names);
  /* Разнообразие: наборы разных городов не совпадают. */
  const sets=cities.map(c=>c.names.join("|"));
  const distinct=new Set(sets).size;
  const allNames=new Set(cities.flatMap(c=>c.names));
  const specials=new Set(cities.map(c=>c.special).filter(Boolean));
  const streets=new Set(cities.map(c=>c.street));
  const squares=new Set(cities.map(c=>c.square));
  return {городов:cities.length,наборов:distinct,устойчиво:same,
   разныхИмён:allNames.size,особых:specials.size,улиц:streets.size,площадей:squares.size,
   пример:cities[0]};});
 check('у города свои имена кварталов, и они не меняются между заходами',uniq.устойчиво===true);
 check('наборы имён у разных городов не совпадают',uniq.наборов>=20,{городов:uniq.городов,наборов:uniq.наборов});
 check('имён много и они разные',uniq.разныхИмён>=25,{разных:uniq.разныхИмён});
 check('у каждого города свой особый квартал, и они не одни и те же',uniq.особых>=5,{особых:uniq.особых});
 check('главная улица и площадь тоже названы и различаются',
  uniq.улиц>=4&&uniq.площадей>=4&&/улица/.test(uniq.пример.street||""),
  {улиц:uniq.улиц,площадей:uniq.площадей,пример:[uniq.пример.street,uniq.пример.square]});

 // 2. Особый квартал не только звучит иначе
 const special=await page.evaluate(()=>{
  const found=[];
  for(let i=0;i<40&&found.length<8;i++){
   levelCache.clear();
   const l=genLevel(311+i*97,407+i*61,0,"castle");
   const b=l.blocks.find(x=>x.special);
   if(!b)continue;
   /* Особая клетка обязана стоять внутри своего квартала. */
   let tile=null,at=null;
   for(let y=b.y0;y<=b.y1&&!tile;y++)for(let x=b.x0;x<=b.x1;x++){
    const t=l.g[y][x];
    if("RPC".includes(t)||(t==="T"&&b.special==="Голубиная башня")||(t==="N"&&b.special==="Сиротский двор")){tile=t;at={x,y};break;}}
   found.push({имя:b.special,лор:(b.lore||"").length,клетка:tile,
    жила:at?(l.veins||{})[at.x+","+at.y]||null:null});}
  return found;});
 check('в особом квартале есть своя клетка: жила, торговец или сундук',
  special.length>=5&&special.every(f=>f.клетка&&f.лор>60),special.slice(0,3));
 const veinKinds=[...new Set(special.map(f=>f.жила).filter(Boolean))];
 check('жилы особых кварталов отдают то, чем квартал живёт',
  veinKinds.length>=1&&veinKinds.every(k=>["кристалл","трава","кость","ракушка"].includes(k)),veinKinds);

 // 3. Жила особого квартала действительно даёт своё
 const mine=await page.evaluate(()=>{
  let res=null;
  for(let i=0;i<60&&!res;i++){
   G.place=null;levelCache.clear();
   const bx=311+i*97,by=407+i*61;
   const l=genLevel(bx,by,0,"castle");
   const entry=Object.entries(l.veins||{})[0];
   if(!entry)continue;
   enterPlace({x:bx,y:by,structure:{type:"castle",name:"Цитадель",beacon:"castle"}});
   const [xy,want]=entry;const [x,y]=xy.split(",").map(Number);
   G.inv={};
   mineVein(x,y);
   res={ждали:want,добыли:Object.keys(G.inv)[0]||null};}
  while(activeLayer())closeTopUI();
  return res;});
 check('добыча из такой жилы — именно то, чем квартал живёт',
  mine&&mine.ждали===mine.добыли,mine);

 // 4. План города называет всё и звучит с нужной стороны
 const plan=await page.evaluate(()=>{
  G.place=null;levelCache.clear();
  enterPlace({x:1777,y:1333,structure:{type:"castle",name:"Цитадель Проверки",beacon:"castle"}});
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const ok=cityPlan();
  Speech.say=o;
  const l=curLevel();
  const text=said.join(" ");
  const named=l.blocks.filter(b=>text.includes(b.name)).length;
  return {ok,кварталов:l.blocks.length,названо:named,
   естьУлица:text.includes(l.street||"—"),естьПлощадь:text.includes(l.square||"—"),
   естьСтороны:/север|юг|запад|восток/.test(text),естьШаги:/шаг/.test(text),
   доступен:amAvailable("cityplan")};});
 check('план города называет все кварталы, улицу и площадь',
  plan.ok===true&&plan.названо===plan.кварталов&&plan.естьУлица&&plan.естьПлощадь,plan);
 check('в плане есть стороны света и расстояния',plan.естьСтороны&&plan.естьШаги);
 check('пункт «План города» доступен внутри городских стен',plan.доступен===true);

 const outside=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  G.place=null;
  const ok=cityPlan();
  const avail=amAvailable("cityplan");
  Speech.say=o;
  return {ok,avail,said:said[0]||""};});
 check('вне города план не притворяется, что он есть',
  outside.ok===false&&outside.avail===false&&/только внутри/.test(outside.said),outside);

 // 5. На ходу игра называет квартал и один раз рассказывает об особом
 const walk=await page.evaluate(async()=>{
  G.place=null;levelCache.clear();
  const bx=1777,by=1333;
  enterPlace({x:bx,y:by,structure:{type:"castle",name:"Цитадель Проверки",beacon:"castle"}});
  const l=curLevel();
  const sp=l.blocks.find(b=>b.special);
  if(!sp)return {skip:true};
  const inSp=(x,y)=>x>=sp.x0&&x<=sp.x1&&y>=sp.y0&&y<=sp.y1;
  const walkable=(x,y)=>tileAt(l,x,y)!=="#";
  /* Ищем настоящий вход: клетку снаружи квартала, с которой шаг ведёт внутрь. */
  let from=null,dir=null;
  const dirs=[["E",1,0],["W",-1,0],["S",0,1],["N",0,-1]];
  for(let y=1;y<l.h-1&&!from;y++)for(let x=1;x<l.w-1;x++){
   if(inSp(x,y)||!walkable(x,y))continue;
   const d=dirs.find(([,dx,dy])=>inSp(x+dx,y+dy)&&walkable(x+dx,y+dy));
   if(d){from={x,y};dir=d[0];break;}}
  if(!from)return {skip:true,причина:"не найден вход в квартал"};
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  G.place.x=from.x;G.place.y=from.y;G.place.zone=whereInCity(from.x,from.y);
  /* Дверь открывается первым шагом, проходится вторым — как у игрока. */
  moveInside(dir);
  if(inSp(G.place.x,G.place.y)===false)moveInside(dir);
  /* Рассказ квартала звучит вслед за именем, с паузой — ждём его, как ждёт игрок. */
  await new Promise(r=>setTimeout(r,1400));
  const first=said.slice();
  const inside=inSp(G.place.x,G.place.y);
  said.length=0;
  /* Ещё один заход в тот же квартал: рассказ повторяться не должен. */
  G.place.zone=null;
  moveInside(dir);
  await new Promise(r=>setTimeout(r,1400));
  const second=said.slice();
  Speech.say=o;
  while(activeLayer())closeTopUI();
  return {имя:sp.special,вошёл:inside,
   названо:first.some(t=>t.includes(sp.special)),
   рассказ:first.some(t=>t===sp.lore),
   повтор:second.some(t=>t===sp.lore)};});
 check('особый квартал называется на ходу и рассказывает о себе',
  walk.skip||(walk.вошёл&&walk.названо&&walk.рассказ),walk);
 check('рассказ звучит один раз, а не при каждом шаге',walk.skip||walk.повтор===false,{повтор:walk.повтор});

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

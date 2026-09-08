const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. Что написано в карточке — то и платят
 const promise=await page.evaluate(()=>{
  const out=[];
  for(let i=0;i<300&&out.length<5;i++){
   const c=findCities(1000+i*7,1000+i*3,40,4)[0];
   if(!c)continue;
   const n=getNPC(c.x,c.y,0,"Торговец");
   G.rep={};G.place=null;G.inv={"руда":5};G.gold=0;
   const unit=sellUnit(n,"руда");
   openNPC(n.key,true);
   const body=document.getElementById("npcBody").innerHTML;
   const shown=body.includes(`по ${unit} золота`);
   closeTopUI();
   const before=G.gold;
   sellResource(n.key,"руда",false);
   while(activeLayer())closeTopUI();
   out.push({город:c.name,вКарточке:unit,получено:G.gold-before,
    надписьЕсть:shown,совпало:G.gold-before===unit});}
  return out;});
 check('в карточке торговца написана та цена, которую он и заплатит',
  promise.length>=3&&promise.every(o=>o.совпало&&o.надписьЕсть),promise.slice(0,3));

 // 2. Покупка списывает ровно столько, сколько обещала карточка
 const buy=await page.evaluate(()=>{
  const n=getNPC(1000,1000,0,"Торговец");
  G.rep={};G.place=null;G.gold=5000;
  const item=stockFor(n)[0];
  const before=G.gold;
  buyItem(n.key,0);
  while(activeLayer())closeTopUI();
  return {цена:item.price,списано:before-G.gold};});
 check('покупка списывает ровно цену из карточки',buy.цена===buy.списано,buy);

 // 3. Мера мира двигает обе стороны торга, а не одну
 const diffs=await page.evaluate(()=>{
  const city=findCities(1000,1000,40,3)[0];
  const n=getNPC(1000,1000,0,"Торговец");
  const probe=k=>{setDifficulty(k);G.rep={};G.place=null;
   return {платит:stockFor(n)[0].price,получает:sellPrice("руда",0,G.day,n),
    городПросит:citySellPrice("руда",city,G.day),городПлатит:cityBuyPrice("руда",city,G.day)};};
  const r={calm:probe("calm"),normal:probe("normal"),harsh:probe("harsh")};
  setDifficulty("normal");
  return r;});
 check('на суровом дороже покупать И дешевле продавать',
  diffs.harsh.платит>diffs.normal.платит&&diffs.harsh.получает<diffs.normal.получает,
  {платит:[diffs.calm.платит,diffs.normal.платит,diffs.harsh.платит],
   получает:[diffs.calm.получает,diffs.normal.получает,diffs.harsh.получает]});
 check('мера мира дошла и до городских цен, а не только до лавки',
  diffs.harsh.городПросит>diffs.normal.городПросит&&diffs.harsh.городПлатит<diffs.normal.городПлатит,
  {просит:[diffs.calm.городПросит,diffs.normal.городПросит,diffs.harsh.городПросит],
   платит:[diffs.calm.городПлатит,diffs.normal.городПлатит,diffs.harsh.городПлатит]});
 check('на спокойном торговать выгоднее, чем на обычном',
  diffs.calm.платит<=diffs.normal.платит&&diffs.calm.получает>=diffs.normal.получает);

 // 4. Отношение народа работает в обе стороны
 const att=await page.evaluate(()=>{
  setDifficulty("normal");
  const n=getNPC(1000,1000,0,"Торговец");
  const probe=r=>{G.rep={};G.clan=null;addRep(n.race,r);G.place=null;
   return {платит:stockFor(n)[0].price,получает:sellPrice("руда",0,G.day,n)};};
  const res={свой:probe(15),обычный:probe(0),чужой:probe(-6)};
  G.rep={};
  return res;});
 check('свой и покупает дешевле, и продаёт дороже',
  att.свой.платит<att.обычный.платит&&att.свой.получает>att.обычный.получает,att);
 check('чужой и покупает дороже, и продаёт дешевле',
  att.чужой.платит>att.обычный.платит&&att.чужой.получает<att.обычный.получает,att);

 // 5. Купить и тут же продать в том же месте нельзя с прибылью —
 //    ни при какой сложности, репутации, дарах богов и глубине
 const arb=await page.evaluate(()=>{
  const bad=[];let проверено=0;
  for(const k of ["calm","normal","harsh"]){
   setDifficulty(k);
   for(let i=0;i<40;i++){
    const c=findCities(900+i*13,900+i*11,40,3)[0];
    if(!c)continue;
    for(const rep of [20,0,-6]){
     G.rep={};G.clan=null;addRep(c.emp.race,rep);
     G.faith={road:30,zarya:30,deal:30};G.patron="road";
     /* городские цены */
     for(const r of ["руда","камень","дерево","трава","ягоды","грибы"]){
      проверено++;
      const купить=citySellPrice(r,c,G.day),продать=cityBuyPrice(r,c,G.day);
      if(продать>=купить)bad.push({уровень:k,репутация:rep,город:c.name,товар:r,купить,продать});}
     /* и прилавок живого торговца — наверху и на глубине */
     const n=getNPC(c.x,c.y,0,"Торговец");
     for(const place of [null,{kind:"dungeon",bx:c.x,by:c.y,depth:3,x:1,y:1,stype:"ruins",name:"п"}]){
      G.place=place;
      for(const st of stockFor(n)){
       if(!st.res)continue;
       проверено++;
       const продать=sellUnit(n,st.n);
       if(продать>=st.price)bad.push({уровень:k,репутация:rep,глубина:place?3:0,
        товар:st.n,просит:st.price,платит:продать});}}
     G.place=null;}}}
  G.rep={};G.faith={};G.patron=null;setDifficulty("normal");
  return {проверено,bad};});
 check('бесплатных денег нет ни при каких дарах, дружбе и мере мира',
  arb.bad.length===0,{проверено:arb.проверено,находок:arb.bad.length,примеры:arb.bad.slice(0,3)});

 // 5б. Но честная торговля между городами по-прежнему кормит
 const routes=await page.evaluate(()=>{
  const r={};
  for(const k of ["calm","normal","harsh"]){
   setDifficulty(k);
   const list=bestRoutes(1000,1000,G.day,6);
   r[k]={маршрутов:list.length,прибыль:list[0]?list[0].profit:0};}
  setDifficulty("normal");
  return r;});
 check('возить товар между городами по-прежнему выгодно',
  routes.normal.маршрутов>0&&routes.normal.прибыль>0&&routes.harsh.прибыль>0,routes);
 check('на спокойном мире торговля прибыльнее, чем на суровом',
  routes.calm.прибыль>routes.harsh.прибыль,
  {спокойный:routes.calm.прибыль,суровый:routes.harsh.прибыль});

 // 6. Голубиная почта: особый квартал даёт настоящие вести
 const post=await page.evaluate(()=>{
  for(let i=0;i<90;i++){
   const bx=311+i*97,by=407+i*61;
   levelCache.clear();
   const l=genLevel(bx,by,0,"castle");
   const sp=l.blocks.find(b=>b.special==="Голубиная башня");
   if(!sp)continue;
   let at=null;
   for(let y=sp.y0;y<=sp.y1&&!at;y++)for(let x=sp.x0;x<=sp.x1;x++)if(l.g[y][x]==="L"){at={x,y};break;}
   if(!at)return {ошибка:"башня есть, а клетки почты нет"};
   G.place=null;
   enterPlace({x:bx,y:by,structure:{type:"castle",name:"Цитадель Вестей",beacon:"castle"}});
   G.place.x=at.x;G.place.y=at.y;
   const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
   const ok=useHere();
   Speech.say=o;
   while(activeLayer())closeTopUI();
   const t=said.join(" ");
   return {ok,война:/Война:/.test(t),города:/Вести из ближних городов|голуби отсюда не достают/.test(t),
    письмо:/писем нет|есть письмо/.test(t),длина:t.length};}
  return {пропуск:true};});
 check('голубиная почта рассказывает о войне, ближних городах и ваших делах',
  post.пропуск||(post.ok===true&&post.война&&post.города&&post.письмо&&post.длина>150),post);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);
 await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());
 await page.waitForTimeout(200);
 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(25);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(60);}
 async function swipe(fx,fy,tx,ty){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fx+(tx-fx)*i/6,y:fy+(ty-fy)*i/6,id:0}]});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});await page.waitForTimeout(120);}
 async function multiTap(n){const pts=[];
  for(let i=0;i<n;i++){pts.push({x:80+i*45,y:400});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,k)=>({x:p.x,y:p.y,id:k}))});await page.waitForTimeout(35);}
  await page.waitForTimeout(70);
  for(let k=n-1;k>=0;k--){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:pts[k].x,y:pts[k].y,id:k}]});await page.waitForTimeout(20);
   const rest=pts.slice(0,k).map((p,idx)=>({x:p.x+2,y:p.y+1,id:idx}));
   if(rest.length){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:rest});await page.waitForTimeout(20);}}
  await page.waitForTimeout(150);}


 async function emptyPoint(){
  return await page.evaluate(()=>{
   for(let y=760;y>60;y-=12)for(let x of [12,20,370,378]){
    const el=document.elementFromPoint(x,y);
    if(el&&!el.closest('button,[data-cmd],a,input,select')&&activeLayer()&&activeLayer().contains(el))return {x,y};}
   return {x:8,y:8};});}
 // Меню действий двумя пальцами содержит новые пункты
 await multiTap(2);
 const items=await page.evaluate(()=>[...document.querySelectorAll('#amList button')].map(b=>b.dataset.cmd));
 check('в меню действий есть народы, пантеон и политика',
  ['am:races','am:pantheon','am:politics'].every(c=>items.includes(c)),items.length);

 // Выбираем «Народы Грани» свайпами и двойным касанием по пустому месту
 await page.evaluate(()=>{const b=[...document.querySelectorAll('#amList button')].find(x=>x.dataset.cmd==='am:races');setCursor(b,false);});
 let ep=await emptyPoint();await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(300);
 check('каталог народов открывается жестами из меню', await page.evaluate(()=>{const m=document.getElementById('modal-races');return m&&!m.hidden;}));

 // Свайп листает каталог и подводит выбранный пункт под палец
 let inView=true;
 for(let i=0;i<8;i++){
  await swipe(200,400,330,400);
  const r=await page.evaluate(()=>{const a=uiCursor;if(!a)return null;const b=a.getBoundingClientRect();return {top:b.top,bottom:b.bottom,cmd:a.dataset.cmd||a.textContent.slice(0,20)};});
  if(!r||r.bottom<0||r.top>780){inView=false;break;}
 }
 check('свайп-перелистывание держит выбранный пункт на экране',inView);

 // Двойное касание по пустому месту активирует ИМЕННО тот пункт, на котором
 // стоит курсор окна. Свайпами доводим курсор до кнопки с известным действием
 // (фильтр каталога по рангу) и смотрим, сработала ли она.
 // Ставим курсор на пункт ПЕРЕД кнопкой фильтра, затем один свайп вперёд —
 // курсор обязан встать ровно на неё, а не проскочить.
 const target=await page.evaluate(()=>{
  raceFilterRank=-1;
  const items=cursorItems(activeLayer());
  const i=items.findIndex(x=>x.dataset.cmd&&x.dataset.cmd.startsWith('racefilter:')&&x.dataset.cmd!=='racefilter:-1');
  if(i<1)return null;
  setCursor(items[i-1],false);
  return items[i].dataset.cmd;});
 await swipe(200,400,330,400);
 const onTarget=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 check('один свайп переводит курсор ровно на следующий пункт',onTarget===target,{ждали:target,курсор:onTarget});
 const before=await page.evaluate(()=>raceFilterRank);
 ep=await emptyPoint();await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(250);
 const after=await page.evaluate(()=>({race:G.race,filter:raceFilterRank}));
 const want=target?Number(target.split(':')[1]):null;
 check('двойное касание активирует выбранный свайпом пункт каталога',
  !!target&&after.filter===want&&before!==after.filter,{цель:target,было:before,стало:after.filter});
 const dossierReached=await page.evaluate(()=>{const items=visibleInteractive(activeLayer());return items.some(x=>x.dataset.speak&&x.dataset.speak.length>400);});
 check('свайп-перелистывание доходит до самих досье, а не только до кнопок',dossierReached);

 // Ощупывание читает досье целиком
 // Активация пункта каталога перестраивает список, поэтому открываем его заново
 await page.evaluate(()=>{while(activeLayer())closeTopUI();CMD.races();raceFilterRank=0;renderRaces();});
 await page.waitForTimeout(250);
 const spoken=await page.evaluate(()=>{
  const el=document.querySelector('#raceList .list-line');
  if(!el)return null;
  el.scrollIntoView({block:'start'});
  const r=el.getBoundingClientRect();
  const x=Math.max(5,Math.min(380,r.x+10)),y=Math.max(5,Math.min(770,r.y+10));
  let said='';const orig=Speech.say;Speech.say=t=>{said=t;};
  lastExploreEl=null;explorePoint(x,y);Speech.say=orig;return said;});
 check('ощупывание карточки читает досье народа',spoken&&spoken.length>300&&/Миф/.test(spoken),spoken?spoken.slice(0,60):null);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();

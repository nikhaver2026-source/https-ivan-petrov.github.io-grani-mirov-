/* ════════════════════════════════════════════════════════════════════════
   УПРАВЛЯЕМЫЕ ЧАСЫ ДЛЯ НАБОРОВ (О1)
   Касание длиной 40 мс под общей нагрузкой прогона доходило до страницы
   через 200–300 мс, и игра честно читала его как палец, лежащий на месте
   (ощупывание: «назови, что под пальцем»). Наборы краснели не по вине игры.
   Здесь время страницы на время жеста идёт по команде набора: часы
   останавливаются, палец ставится, часы продвигаются ровно на длину
   касания, палец поднимается — и игра видит касание той длины, какая
   задумана, сколько бы ни была занята машина. После жеста часы снова идут
   сами. Игра ничего не знает о подмене: подменяются только Date,
   performance и таймеры страницы (page.clock из Playwright).
   ════════════════════════════════════════════════════════════════════════ */
const ЧАСЫ={
 /* до перехода на страницу: часы ставятся и идут, как настоящие */
 async поставить(page){await page.clock.install();},
 /* остановить часы на «сейчас» страницы. Пока набор узнаёт время страницы, её часы идут дальше: останавливаем
    чуть впереди (40 мс), а если машина так занята, что и это уже прошлое, — с бо́льшим запасом. */
 async стоп(page){
  for(const запас of [40,150,500,2000]){const t=await page.evaluate(()=>Date.now());
   try{await page.clock.pauseAt(t+запас);return;}catch(e){if(!/past/i.test(String(e&&e.message||e)))throw e;}}
  throw new Error("часы страницы не остановились");},
 async идти(page){await page.clock.resume();},
 /* продвинуть остановленные часы на мс (все таймеры за это время срабатывают) */
 async шаг(page,мс){if(мс>0)await page.clock.runFor(мс);},
 /* касание одним пальцем: ms — сколько палец лежит, после — сколько ждать после отрыва;
    пустойОтрыв — отрыв без точек (как в части наборов), иначе — с точкой отрыва */
 async касание(page,cdp,x,y,{ms=40,после=140,id=0,пустойОтрыв=false}={}){
  await this.стоп(page);
  try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id}]});
   await this.шаг(page,ms);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:пустойОтрыв?[]:[{x,y,id}]});
   await this.шаг(page,после);}
  finally{await this.идти(page);}},
 /* свайп: от (fx,fy) к (tx,ty) за steps шагов по stepMs */
 async свайп(page,cdp,fx,fy,tx,ty,{steps=6,stepMs=14,после=150,id=0,пустойОтрыв=false}={}){
  await this.стоп(page);
  try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id}]});
   await this.шаг(page,stepMs);
   for(let i=1;i<=steps;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(fx+(tx-fx)*i/steps),y:Math.round(fy+(ty-fy)*i/steps),id}]});
    await this.шаг(page,stepMs);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:пустойОтрыв?[]:[{x:tx,y:ty,id}]});
   await this.шаг(page,после);}
  finally{await this.идти(page);}},
 /* подождать мс по часам страницы (не по нагрузке машины) */
 async ждать(page,мс){await this.стоп(page);try{await this.шаг(page,мс);}finally{await this.идти(page);}}};
module.exports=ЧАСЫ;

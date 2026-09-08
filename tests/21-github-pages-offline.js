const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const BASE=process.argv[2].replace(/index\.html$/,'');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},serviceWorkers:'allow'});
 const page=await ctx.newPage();
 const errors=[],console404=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')console404.push(m.text().slice(0,110));});
 const bad=[];page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url().replace(BASE,''));});

 // 1. Страница по подпути проекта, как на Pages
 await page.goto(BASE);await page.waitForTimeout(900);
 const boot=await page.evaluate(()=>({title:document.title,base:location.pathname,
  bank:typeof Bank!=="undefined"&&Bank.base, screen:!!document.getElementById("screen-game")}));
 check('игра открывается по адресу проекта, а не в корне',/grani-mirov/.test(boot.base)&&/Грань Миров/.test(boot.title),boot);

 // 2. Никаких 404 и ошибок в консоли на загрузке
 check('ни одного ответа 404 при загрузке',bad.length===0,bad.slice(0,6));
 check('консоль чистая: прежняя ошибка про sw.js ушла',console404.length===0,console404.slice(0,4));

 // 3. Манифест подключён на ходу и читается
 const man=await page.evaluate(()=>{
  const l=document.querySelector('link[rel="manifest"]');
  const i=document.querySelector('link[rel="apple-touch-icon"]');
  return {link:!!l,href:l&&l.getAttribute("href"),icon:!!i};});
 const manJson=await (await page.request.get(BASE+'manifest.json')).json();
 check('манифест подключается на ходу и валиден',
  man.link===true&&man.href==="manifest.json"&&man.icon===true&&/Грань Миров/.test(manJson.name||"")&&(manJson.icons||[]).length===3,
  {...man,name:manJson.name,icons:(manJson.icons||[]).length,display:manJson.display});

 // 4. Служебный работник зарегистрировался
 const sw=await page.evaluate(async()=>{
  const r=await navigator.serviceWorker.getRegistration();
  if(!r)return {reg:false};
  await navigator.serviceWorker.ready;
  return {reg:true,scope:r.scope,active:!!(r.active||r.waiting||r.installing)};});
 check('служебный работник зарегистрирован в области проекта',sw.reg===true&&sw.active===true&&/grani-mirov/.test(sw.scope||""),sw);

 // 5. Он кэширует страницу и записи
 await page.evaluate(()=>enterGame());
 await page.evaluate(async()=>{
  // играем пару записей так же, как это делает сама игра: элементом audio
  const play=f=>new Promise(res=>{const a=new Audio("sounds/"+f);a.volume=0.01;
   a.addEventListener("loadeddata",()=>res(1),{once:true});
   a.addEventListener("error",()=>res(0),{once:true});
   a.play().catch(()=>{});setTimeout(()=>res(2),4000);});
  await play("nat/door_wood_01.flac");
  await play("inst/harp_light_01.mp3");});
 await page.waitForTimeout(900);
 const cached=await page.evaluate(async()=>{
  const names=await caches.keys();
  const out={};
  for(const n of names){const c=await caches.open(n);out[n]=(await c.keys()).length;}
  const shell=await caches.match("./index.html");
  const media=await caches.match(new URL("sounds/nat/door_wood_01.flac",location.href).toString());
  const media2=await caches.match(new URL("sounds/inst/harp_light_01.mp3",location.href).toString());
  return {names,out,shell:!!shell,media:!!media,media2:!!media2};});
 check('страница и записи попали в кэш',cached.shell===true&&cached.media===true&&cached.media2===true,{кэши:cached.out,страница:cached.shell,запись:cached.media});

 // 6. Игра поднимается без сети
 await ctx.setOffline(true);
 const page2=await ctx.newPage();
 const errs2=[];page2.on('pageerror',e=>errs2.push(String(e)));
 let offlineOk=true;
 try{await page2.goto(BASE,{timeout:15000});}catch(e){offlineOk=false;}
 await page2.waitForTimeout(700);
 const off=await page2.evaluate(()=>({title:document.title,btn:!!document.querySelector('[data-cmd="enter"],#screen-game'),
  bank:typeof SOUND_BANK!=="undefined"&&Object.keys(SOUND_BANK).length})).catch(()=>({}));
 check('без сети игра всё равно открывается из кэша',offlineOk&&/Грань Миров/.test(off.title||"")&&off.bank>100,{offlineOk,...off});
 const offSound=await page2.evaluate(async()=>{
  const a=new Audio("sounds/nat/door_wood_01.flac");a.volume=0.01;
  return await new Promise(res=>{
   a.addEventListener("loadeddata",()=>res("звучит, длительность "+a.duration.toFixed(2)+" с"),{once:true});
   a.addEventListener("error",()=>res("ошибка загрузки"),{once:true});
   a.play().catch(()=>{});setTimeout(()=>res("не успела"),5000);});});
 check('кэшированная запись играет без сети',/звучит/.test(offSound),offSound);
 await ctx.setOffline(false);
 await page2.close();

 // 7. Обновление доходит: страница берётся из сети, когда сеть есть
 const r3=await page.request.get(BASE+'index.html');
 check('при живой сети страница по-прежнему отдаётся сервером',r3.ok()&&/text\/html/.test(r3.headers()['content-type']||""),
  {код:r3.status(),тип:r3.headers()['content-type']});

 // 8. Игра работает: вход, шаг, звук
 const play=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  move("E");move("E");
  const ok=!!Bank.play("harp_light",{gain:0.02,maxSec:1});
  Speech.say=o;
  return {pos:[G.x,G.y],said:said.length,sound:ok};});
 check('после установки работника игра ходит и звучит',play.said>0&&play.sound===true,play);

 check('ни одной ошибки страницы за весь прогон',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

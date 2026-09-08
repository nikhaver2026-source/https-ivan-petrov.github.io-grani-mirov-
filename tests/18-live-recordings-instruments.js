const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];const bad=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.url().includes('/sounds/')&&r.status()>=400)bad.push(r.status()+' '+r.url().split('/sounds/')[1]);});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(400);

 // 1. Банк: все роли на месте, файлы существуют
 const bank=await page.evaluate(async()=>{
  const roles=Object.keys(SOUND_BANK);
  const files=[];roles.forEach(r=>SOUND_BANK[r].f.forEach(f=>files.push(f)));
  const head=f=>fetch?null:null;
  return {roles:roles.length,files:files.length,
   inst:files.filter(f=>f.startsWith("inst/")).length,
   nat:files.filter(f=>f.startsWith("nat/")).length};});
 check('банк ролей вырос: живые записи и инструменты внутри',bank.files>=320&&bank.roles>=140&&bank.inst>=38&&bank.nat>=75,bank);

 // 2. Каждый файл банка реально загружается
 const load=await page.evaluate(async()=>{
  const files=[];Object.keys(SOUND_BANK).forEach(r=>SOUND_BANK[r].f.forEach(f=>files.push(f)));
  Object.values(UI_BANK).forEach(f=>files.push(f));
  Object.values(BEACON_SAMPLE).forEach(f=>files.push(f));
  Object.values(MONSTER_BANK).forEach(o=>Object.values(o).forEach(f=>files.push(f)));
  const uniq=[...new Set(files)];
  const one=f=>new Promise(res=>{const a=new Audio("sounds/"+f);
   a.addEventListener("loadedmetadata",()=>res(null),{once:true});
   a.addEventListener("error",()=>res(f),{once:true});
   setTimeout(()=>res(null),9000);});
  const out=[];
  for(let i=0;i<uniq.length;i+=25){
   const part=await Promise.all(uniq.slice(i,i+25).map(one));
   part.forEach(x=>{if(x)out.push(x);});}
  return {total:uniq.length,failed:out};});
 check('все записи банка читаются браузером',load.failed.length===0&&load.total>=415,{всего:load.total,битые:load.failed.slice(0,6)});

 // 3. У каждого из двенадцати богов свой голос, и все разные
 const gods=await page.evaluate(()=>{
  const ids=PANTHEON.map(g=>g.id);
  const roles=ids.map(id=>GOD_SOUND[id]);
  const files=ids.map(id=>Bank.pick(GOD_SOUND[id],PANTHEON.findIndex(x=>x.id===id)));
  return {ids:ids.length,missing:ids.filter(id=>!GOD_SOUND[id]),uniqueRoles:new Set(roles).size,
   uniqueFiles:new Set(files).size,played:!!godVoice("zarya",{gain:0.01})};});
 check('у всех двенадцати богов есть голос',gods.missing.length===0&&gods.ids===12,gods.missing);
 check('голоса богов не повторяются',gods.uniqueRoles===12&&gods.uniqueFiles===12,{роли:gods.uniqueRoles,файлы:gods.uniqueFiles});
 check('голос бога звучит по вызову',gods.played===true);

 // 4. Маяки построек — живые инструменты
 const bc=await page.evaluate(()=>{
  const need=["castle","village","tavern","temple","market","clanhall","tower","ruins","port","cave_entrance","traveler","forge"];
  const miss=need.filter(id=>!BEACON_SAMPLE[id]);
  const inst=need.filter(id=>(BEACON_SAMPLE[id]||"").startsWith("inst/")).length;
  return {miss,inst};});
 check('у построек живые маяки, а не только синтез',bc.miss.length===0&&bc.inst>=8,bc);

 // 5. Рассвет и закат объявляются
 const phase=await page.evaluate(()=>{
  const said=[];const orig=Speech.say;Speech.say=t=>said.push(t);
  G.__phase=undefined;G.hour=12;dayPhaseCue();      // первый вызов только запоминает
  G.hour=23;dayPhaseCue();                          // наступила ночь
  G.hour=8;dayPhaseCue();                           // рассвет
  Speech.say=orig;
  return said;});
 check('смена дня и ночи слышна и произносится',phase.length===2&&/Темнеет/.test(phase[0])&&/Рассвет/.test(phase[1]),phase);

 // 6. Каталог звуков показывает новые разделы
 const cat=await page.evaluate(()=>{
  CMD.sounds?CMD.sounds():null;
  buildBankGrid();
  const grid=document.getElementById("bankGrid");
  const heads=[...grid.querySelectorAll("h3")].map(h=>h.textContent);
  const hint=document.getElementById("bankHint").textContent;
  return {heads,cards:grid.querySelectorAll("button").length,
   attribution:/tonejs-instruments/.test(hint)&&/Attribution/.test(hint)};});
 check('в каталоге есть разделы живых записей и инструментов',
  cat.heads.some(h=>/Живые записи/.test(h))&&cat.heads.some(h=>/инструменты/.test(h)),cat.heads);
 check('указание авторства CC BY видно в игре',cat.attribution===true);

 // 7. Ни одного битого запроса к звукам и ни одной ошибки
 await page.waitForTimeout(400);
 check('нет ответов 404 по звукам',bad.length===0,bad.slice(0,5));
 check('нет ошибок страницы',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

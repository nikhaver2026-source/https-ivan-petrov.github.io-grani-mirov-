/* ════════════════════════════════════════════════════════════════════════
   НАБОР 84: ЛЕСТНИЦА РЕМЕСЛА ВИДНА ЦЕЛИКОМ

   Работы выше вашей ступени прятались. Игрок у наковальни с первой ступенью
   слышал две работы и не знал, что их семь: лестница была, а ступеней на
   ней не видно. Спецификация (§64, §73) просит иначе: без навыка — только
   осмотреть; с навыком — простое; выше — сложное; а то, что закрыто
   условием, показать с причиной, но не как рабочую кнопку.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Без ремесла у горна только общие действия: ни одной работы, ни одной
      запертой — чужое ремесло не показывают вовсе.
   2. С первой ступенью доступна простая работа, а сложные показаны запертыми
      с причиной — ступенью и её именем.
   3. С высшей ступенью запертых нет.
   4. Запертая работа не срабатывает: припас цел, время не идёт, а ответ
      называет, чего не хватает, и звучит.
   5. Вслух список делится на «можно» и «выше вашей ступени».
   6. Старые вызовы не изменились: techsAt с одним доводом даёт только
      доступное.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 const лестница=await page.evaluate(()=>{
  G.place={kind:"house",bx:1000,by:1000,stype:"tower",name:"Башня",depth:0,x:2,y:2};
  const o={вид:"tile",плитка:"X",вещь:"orb",станок:"orb",n:"хрустальный шар",x:2,y:2,dx:0,dy:0,d:0};
  const срез=()=>{const a=actionsFor(o);
   return {работ:a.filter(z=>z.id.indexOf("tech:")===0&&!z.заблокировано).map(z=>z.id),
    запертых:a.filter(z=>z.заблокировано).map(z=>z.n),
    всего:a.length};};
  G.mast={};const без=срез();
  G.mast={flux:{ур:1,оп:0,дел:0}};const первая=срез();
  G.mast={flux:{ур:3,оп:0,дел:0}};const третья=срез();
  G.mast={flux:{ур:5,оп:0,дел:0}};const высшая=срез();
  const всехУШара=techsAt("orb",true).filter(t=>t.маст==="flux").length;
  G.mast={flux:{ур:1,оп:0,дел:0}};
  return {без,первая,третья,высшая,всехУШара,
   одинДовод:techsAt("orb").every(t=>mastLevel(t.маст)>=t.ур)};});
 check('без ремесла у шара ни одной работы и ни одной запертой: чужое ремесло не показывают',
  лестница.без.работ.length===0&&лестница.без.запертых.length===0&&лестница.без.всего>0,лестница.без);
 check('с первой ступенью простая работа доступна, а сложные показаны запертыми с причиной',
  лестница.первая.работ.length>0&&лестница.первая.запертых.length>0
  &&лестница.первая.запертых.every(n=>/нужна ступень \d/.test(n)),лестница.первая);
 check('чем выше ступень, тем больше доступно и меньше заперто; на высшей запертых нет',
  лестница.третья.работ.length>лестница.первая.работ.length
  &&лестница.третья.запертых.length<лестница.первая.запертых.length
  &&лестница.высшая.запертых.length===0
  &&лестница.высшая.работ.length>=лестница.всехУШара,лестница);
 check('старый вызов techsAt с одним доводом по-прежнему даёт только доступное',лестница.одинДовод,лестница);

 const запертая=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  G.place={kind:"house",bx:1000,by:1000,stype:"tower",name:"Башня",depth:0,x:2,y:2};
  G.mast={flux:{ур:1,оп:0,дел:0}};
  G.inv={"руда":20,"слиток":20,"кристалл":20,"камень":20,"кость":20,"самоцвет":20};
  const o={вид:"tile",плитка:"X",вещь:"orb",станок:"orb",n:"хрустальный шар",x:2,y:2,dx:0,dy:0,d:0};
  const a=actionsFor(o).find(z=>z.заблокировано);
  if(!a){Speech.say=был;Bank.play=bp;return {нет:true};}
  const инв=Object.values(G.inv).reduce((s,v)=>s+v,0),час=G.day*24+G.hour,оп=mastOf("flux").оп;
  const з=звуки.length;
  a.делать(o);
  const t=сказ.join(" ");
  Speech.say=был;Bank.play=bp;
  return {припасЦел:Object.values(G.inv).reduce((s,v)=>s+v,0)===инв,
   времяСтоит:G.day*24+G.hour===час,опытСтоит:mastOf("flux").оп===оп,
   прозвучало:звуки.length>з,
   объяснило:/не по рукам/.test(t)&&/[Нн]ужна ступень/.test(t)&&/у вас/.test(t)};});
 check('запертая работа не срабатывает: припас цел, время и опыт стоят',
  !запертая.нет&&запертая.припасЦел&&запертая.времяСтоит&&запертая.опытСтоит,запертая);
 check('а ответ объясняет, какая ступень нужна и какая есть, и звучит',
  запертая.объяснило&&запертая.прозвучало,запертая);

 const вслух=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"house",bx:1000,by:1000,stype:"tower",name:"Башня",depth:0,x:2,y:2};
  G.mast={flux:{ур:1,оп:0,дел:0}};
  objList=[{вид:"tile",плитка:"X",вещь:"orb",станок:"orb",n:"хрустальный шар",x:2,y:2,dx:0,dy:0,d:0,маяк:null}];
  openObjActions(0);
  const t=сказ.join(" ");
  const кнопок=document.querySelectorAll('#objBody [data-cmd^="objact:"]').length;
  const замков=[...document.querySelectorAll('#objBody [data-cmd^="objact:"]')].filter(b=>/нужна ступень/.test(b.textContent)).length;
  while(activeLayer())closeTopUI();
  Speech.say=был;
  return {делится:/Действий: \d+:/.test(t)&&/Выше вашей ступени ещё \d+/.test(t),кнопок,замков};});
 check('вслух список делится на «можно» и «выше вашей ступени», а запертые помечены замком',
  вслух.делится&&вслух.замков>0&&вслух.кнопок>вслух.замков,вслух);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();

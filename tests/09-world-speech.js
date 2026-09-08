const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(200);

 const talk=await page.evaluate(()=>{
  const npc=getNPC(G.x,G.y,0);
  let said='';const orig=Speech.say;Speech.say=t=>{said=t;};
  try{tellNPCStory(npc);}finally{Speech.say=orig;}
  return {said,race:npc.race};});
 check('реплика жителя рассказывает о его народе',talk.said.includes(talk.race)&&talk.said.length>200,{race:talk.race,len:talk.said.length});

 const border=await page.evaluate(()=>{
  let said=[];const orig=Speech.say;Speech.say=t=>{said.push(t);};
  try{G.x=EMPIRES[0].cap.x;G.y=EMPIRES[0].cap.y;lastEmp=null;lastArrive=null;arrive("E");
   said=[];G.x=EMPIRES[1].cap.x;G.y=EMPIRES[1].cap.y;arrive("E");}finally{Speech.say=orig;}
  return said.join(" | ");});
 check('смена державы объявляет её народы и войны',/Народы:/.test(border)&&/чтут/.test(border),border.slice(0,120));

 const prose=await page.evaluate(()=>PROSE.join(" "));
 check('пролог говорит о 8 державах, 45 народах и 12 богах',/восьми державах/.test(prose)&&/сорока пяти народах/.test(prose)&&/двенадцати богах/.test(prose));

 const guide=await page.evaluate(()=>GUIDE.map(g=>g.title).join(" | "));
 check('в руководстве есть главы о народах, богах и политике',/Сорок пять народов/.test(guide)&&/Двенадцать богов/.test(guide)&&/Политика, войны и торговля/.test(guide),guide.split(" | ").length+" глав");
 const dupCh=await page.evaluate(()=>{const nums=GUIDE.map(g=>(g.title.match(/Глава (\d+)/)||[])[1]);return nums.filter((v,i,a)=>a.indexOf(v)!==i);});
 check('нумерация глав руководства без повторов',dupCh.length===0,dupCh);

 const rumors=await page.evaluate(()=>{const out=[];for(let i=0;i<40;i++)out.push(rumor());return out;});
 check('слухи опираются на настоящую политику мира',rumors.some(r=>/воюют|скрепили|дорого идут|Клан|чтут/.test(r)));

 // ощупывание карточки бога и державы читает полный текст
 const spoken=await page.evaluate(()=>{
  CMD.pantheon();
  const el=document.querySelector('#godList .list-line');
  return el?el.dataset.speak.length:0;});
 check('карточка бога озвучивается целиком',spoken>300,spoken);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();

/* ════════════════════════════════════════════════════════════════════════
   НАБОР 239: ДЕЙСТВИЕ С ТЕМ, ЧТО ВПЛОТНУЮ ПО ДИАГОНАЛИ (E И ENTER)

   Жалоба игрока (8.0, приложение для Windows): у шкафа, скрижали и других
   вещей, кроме сундука и ресурса, E и Enter ничего не делали. Игра
   называла «Рядом: шкаф на юго-востоке», а действие смотрело только на
   клетки спереди, сзади и сбоку — вещь в углу комнаты оставалась
   недоступной.
   1. Носитель знаний (полка, шкаф, скрижаль) по диагонали — E открывает его.
   2. То же по Enter.
   3. Если вплотную есть и прямой сосед, и диагональный, — берётся прямой.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,600)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const r=await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  Actors.ensure=function(){};Actors.stop();
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return s0(t,o);};
  const ЖМИ=(code,key)=>{const e=new KeyboardEvent("keydown",{code,key,bubbles:true,cancelable:true});document.dispatchEvent(e);};
  const ДИАГ=[[-1,-1],[1,-1],[-1,1],[1,1]],ПРЯМО=[[0,-1],[0,1],[-1,0],[1,0]];
  /* Найти клетку пола, у которой прямо — только пол или стена, а по
     диагонали — носитель знаний. */
  let м=null;
  for(const st of ["temple","school","tower","castle","tavern"]){if(м)break;
   for(let bx=3;bx<40&&!м;bx++)for(let by=3;by<40&&!м;by++){
    G.place={kind:"house",bx,by,stype:st,name:"Проба",depth:0,x:1,y:1};
    const l=safeFn(()=>curLevel(),null);if(!l)continue;
    for(let y=1;y<l.h-1&&!м;y++)for(let x=1;x<l.w-1&&!м;x++){
     if(tileAt(l,x,y)!==".")continue;
     if(ПРЯМО.some(([dx,dy])=>!["." ,"#"].includes(tileAt(l,x+dx,y+dy))))continue;
     const д=ДИАГ.filter(([dx,dy])=>tileAt(l,x+dx,y+dy)!=="."&&tileAt(l,x+dx,y+dy)!=="#");
     if(д.length!==1||tileAt(l,x+д[0][0],y+д[0][1])!=="K")continue;
     м={st,bx,by,x,y,dx:д[0][0],dy:д[0][1]};}}}
  if(!м)return {м};
  const out={м};
  for(const [code,key] of [["KeyE","e"],["Enter","Enter"]]){
   while(activeLayer())closeTopUI();
   G.place={kind:"house",bx:м.bx,by:м.by,stype:м.st,name:"Проба",depth:0,x:м.x,y:м.y};G.loot=null;lastMoveDir="N";__said.length=0;
   ЖМИ(code,key);
   const слой=activeLayer();out[code]={окно:слой?слой.id:null,сказано:__said.slice(0,2).join(" / ").slice(0,200)};}
  while(activeLayer())closeTopUI();
  /* прямой сосед важнее диагонального */
  out.прямоПервым=String(interactAdjacent).includes("рядом.find(прямо)");
  return out;});
 const ок=c=>r[c]&&(r[c].окно==="modal-read"||/изучено|Перечитываю|Изучено/.test(r[c].сказано))&&!/Под ногами пусто/.test(r[c].сказано);
 check('1. носитель знаний по диагонали — E открывает его',!!r.м&&ок("KeyE"),r);
 check('2. то же по Enter',!!r.м&&ок("Enter"),r);
 check('3. прямой сосед берётся раньше диагонального',r.прямоПервым===true,r.прямоПервым);
 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(x=>x.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

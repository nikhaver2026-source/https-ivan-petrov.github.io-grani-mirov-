/* boy_okna.js URL — что слышно в тихом бою, когда игрок сам открывает окна и листает их */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const ош=[];p.on('pageerror',e=>ош.push(String(e).slice(0,200)));
 await p.addInitScript(()=>{window.__gvAuto=true;});
 await p.goto(process.argv[2]);await p.waitForTimeout(3000);
 await p.evaluate(()=>{enterGame();let k=0;while(activeLayer()&&k++<12)closeTopUI();G.tutorDone=1;
  const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:900,dmg:0,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));ЖурналРЗ.очистить();});
 await p.waitForTimeout(1500);
 const шаг=async(имя,дело)=>{await p.evaluate(()=>ЖурналРЗ.очистить());await дело();await p.waitForTimeout(900);
  return await p.evaluate(и=>({что:и,бой:!!G.inCombat,окно:safeFn(()=>{const l=activeLayer();return l&&(l.id||l.className)},null),
   журнал:ЖурналРЗ.речь.map(z=>z.итог+": "+z.что),сказано:ЖурналРЗ.счёт.речь["сказано"]||0}),имя);};
 const R=[];
 R.push(await шаг("I — снаряжение/сумка",()=>p.keyboard.press("i")));
 R.push(await шаг("стрелка вниз в окне",()=>p.keyboard.press("ArrowDown")));
 R.push(await шаг("Escape",()=>p.keyboard.press("Escape")));
 R.push(await шаг("Enter (действие здесь)",()=>p.keyboard.press("Enter")));
 R.push(await шаг("стрелка вниз",()=>p.keyboard.press("ArrowDown")));
 R.push(await шаг("Escape",()=>p.keyboard.press("Escape")));
 for(const r of R)console.log(JSON.stringify(r));
 console.log("ошибки",ош.slice(0,3));await b.close();})();

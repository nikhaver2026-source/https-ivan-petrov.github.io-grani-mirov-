/* fon_sverka.js URL — каждые 2 с: фон места (Bank.loops.place) == bankAmbientRole(), музыка == locationMusicKey();
   путь: поверхность → подземелье → два яруса вниз → обратно наверх по лестницам → выход → поверхность → бой → поверхность */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const ош=[];p.on('pageerror',e=>ош.push(String(e).slice(0,200)));
 await p.addInitScript(()=>{window.__gvAuto=true;});
 await p.goto(process.argv[2]);await p.waitForTimeout(3000);
 await p.evaluate(()=>{settings.effects=1;settings.music=1;settings.bgMusic=1;settings.scape=1;enterGame();let k=0;while(activeLayer()&&k++<12)closeTopUI();G.tutorDone=1;});
 const сверка=async(этап)=>p.evaluate(э=>{const r=Bank.loops.get("place");const мк=safeFn(()=>Music.key||Music.cur||Music.current,null);
   return {этап:э,место:G.place?(G.place.stype+":"+(G.place.depth||0)):(G.ship?"палуба":"верх"),бой:!!G.inCombat,фон:r&&r.role,ждём:safeFn(()=>bankAmbientRole(),"?"),
    музыка:(Bank.loops.get("score")||{}).role,ключ:safeFn(()=>locationMusicKey(),"?")};},этап);
 const жур=[];const снять=async(э,n,ms=2000)=>{for(let i=0;i<n;i++){await p.waitForTimeout(ms);жур.push(await сверка(э));}};
 const ход=async(э,n)=>{for(let i=0;i<n;i++){await p.evaluate(i=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();move(["E","S","W","N"][Math.floor(i/3)%4]);},i);await p.waitForTimeout(500);if(i%4===3)жур.push(await сверка(э));}};
 await снять("поверхность",3);await ход("поверхность-ход",12);
 const c=await p.evaluate(()=>{for(let x=1000;x<60000;x+=37)for(let y=1000;y<1400;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")return {x,y};}return null;});
 await p.evaluate(c=>{G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let n=0;while(activeLayer()&&n++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());},c);
 await снять("подземелье 1",3);
 for(const d of [1,1]){await p.evaluate(d=>{safeFn(()=>changeDepth(d,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());},d);await снять("вниз",2);}
 for(const d of [-1,-1]){await p.evaluate(d=>{safeFn(()=>changeDepth(d,{bypass:true}));let n=0;while(activeLayer()&&n++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());},d);await снять("вверх",2);}
 await p.evaluate(()=>{safeFn(()=>leavePlace());let n=0;while(activeLayer()&&n++<12)closeTopUI();if(G.inCombat)safeFn(()=>endCombat());});
 await снять("вышли",3);
 await p.evaluate(()=>{G.x+=40;G.y+=40;safeFn(()=>refresh());});await ход("поверхность 2",12);
 await p.evaluate(()=>{const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:30,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));});
 for(let k=0;k<20;k++){const идёт=await p.evaluate(()=>!!G.inCombat);if(!идёт)break;await p.keyboard.press("Enter");await p.waitForTimeout(500);}
 await p.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});
 await снять("после боя",4);await ход("поверхность 3",8);
 const плохо=жур.filter(x=>!x.бой&&(x.фон!==x.ждём));
 console.log(жур.map(x=>`${x.этап} | ${x.место}${x.бой?" бой":""} | фон ${x.фон}${x.фон===x.ждём?"":" ≠ "+x.ждём} | музыка ${x.музыка} (ключ ${x.ключ})`).join("\n"));
 console.log("\nрасхождений фона вне боя:",плохо.length,"из",жур.filter(x=>!x.бой).length);console.log("ошибки",ош.slice(0,3));await b.close();})();

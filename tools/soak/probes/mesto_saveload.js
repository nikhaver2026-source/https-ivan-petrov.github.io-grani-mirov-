/* saveload.js URL — сохранение и загрузка в особых местах: где окажется герой и сможет ли выйти */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await b.newContext();const out=[];
 const новая=async()=>{const page=await ctx.newPage();await page.addInitScript(()=>{window.__gvAuto=true;});await page.goto(process.argv[2]);await page.waitForTimeout(2500);
  await page.evaluate(()=>{try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});return page;};
 const осмотр=`(()=>{const p=G.place;if(!p)return {место:"поверхность"};const lvl=curLevel();if(!lvl)return {нет:"уровня"};
   const t=(x,y)=>tileAt(lvl,x,y);const W=lvl.w,H=lvl.h;const тв=c=>c==="#";
   const сос=[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>t(p.x+dx,p.y+dy)).join("");
   const вид=new Set();const q=[[p.x,p.y]];вид.add(p.x+","+p.y);let выход=false;
   while(q.length){const [x,y]=q.pop();const c=t(x,y);if(/[<>GQE]/.test(c))выход=true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+","+ny;if(вид.has(k)||nx<0||ny<0||nx>=W||ny>=H||тв(t(nx,ny)))continue;вид.add(k);q.push([nx,ny]);}}
   return {вид:p.kind,стип:p.stype,глуб:p.depth,тайник:!!p.тайник,x:p.x,y:p.y,клетка:t(p.x,p.y),соседи:сос,выход,область:вид.size,полёт:!!G.flight};})()`;
 const сценарий=async(имя,подготовка)=>{
  const a=await новая();let до=null,raw=null;
  try{до=await a.evaluate(подготовка);await a.waitForTimeout(800);до=Object.assign({},до||{},await a.evaluate(осмотр));raw=await a.evaluate(()=>serializeSave());}catch(e){out.push({имя,ошибка:String(e).slice(0,200)});await a.close();return;}
  await a.close();
  const b2=await новая();await b2.evaluate(raw=>applySave(raw,"проба"),raw);await b2.waitForTimeout(1500);
  const после=await b2.evaluate(осмотр);out.push({имя,до,после});await b2.close();};
 const подземелье=`(()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
   G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));let k=0;while(activeLayer()&&k++<12)closeTopUI();return c;})()`;
 await сценарий("ярус 1",new Function(`${подземелье};return {};`));
 await сценарий("ярус 3",new Function(`${подземелье};for(let d=0;d<2;d++){safeFn(()=>changeDepth(1,{bypass:true}));let k=0;while(activeLayer()&&k++<12)closeTopUI();}return {};`));
 await сценарий("тайная палата",new Function(`G.place={kind:"dungeon",bx:1200,by:1300,stype:"dungeon",name:"Проба",depth:3,x:1,y:1};
  const l=curLevel();let w=null;for(let y=2;y<l.h-2&&!w;y++)for(let x=2;x<l.w-2;x++){if(tileAt(l,x,y)==="#"&&tileAt(l,x+1,y)==="."&&!propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,undefined)){w={x,y};break;}}
  G.place.x=w.x+1;G.place.y=w.y;const v=secretVault(G.place.bx,G.place.by,w.x,w.y);secretMark(v.ключ,"найден");passageNote(w.x,w.y,null,true);
  enterSecret(w.x,w.y,null,true);return {};`));
 await сценарий("марш лестницы",new Function(`${подземелье};const pl=G.place,lvl=curLevel();for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)===">"){pl.x=x;pl.y=y;}
  safeFn(()=>markGuardianDead(pl.bx,pl.by,pl.depth));startFlight(1,"S");if(G.flight){flightStep(G.flight.md||"S");flightStep(G.flight.md||"S");}return {полёт:!!G.flight};`));
 await сценарий("чертог",new Function(`const e=safeFn(()=>{for(let i=0;i<10000;i++){const s=InstanceGenerator.spec?InstanceGenerator.spec(i):null;if(s)return {i,x:G.x,y:G.y};}return {i:0,x:G.x,y:G.y};},{i:0,x:G.x,y:G.y});
  safeFn(()=>Chertog.enter(e,0));if(!safeFn(()=>Chertog.run(),null))safeFn(()=>Chertog.cmd("diff:0"));let k=0;while(activeLayer()&&k++<12)closeTopUI();return {внутри:safeFn(()=>Chertog.inside(),null)};`));
 await сценарий("Грань",new Function(`const r=safeFn(()=>{const g=Grani.all?Grani.all()[0]:null;return g;},null);
  safeFn(()=>{if(typeof Grani.enterFacet==="function")Grani.enterFacet(0);else if(typeof Grani.go==="function")Grani.go(0);});let k=0;while(activeLayer()&&k++<12)closeTopUI();return {грань:!!(G.place&&G.place.gran)};`));
 console.log(JSON.stringify(out,null,1));await b.close();})();

/* pockets.js URL — замкнутые карманы ярусов: доля проходимых клеток, не связанных шагами (4 стороны) с входом яруса */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const page=await (await b.newContext()).newPage();
 await page.addInitScript(()=>{window.__gvAuto=true;});
 await page.goto(process.argv[2]);await page.waitForTimeout(3000);
 const r=await page.evaluate(()=>{try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();
  const стены=new Set(["#","%"]);const знаки={};const итог={уровней:0,сКарманами:0,клетокВКарманах:0,одиночек:0,примеры:[],видов:{}};
  const мест=[];const типы={};for(let r=0;r<20000&&мест.length<160;r+=13)for(let a=0;a<24;a++){const x=G.x+Math.round(r*Math.cos(a*0.26)),y=G.y+Math.round(r*Math.sin(a*0.26));
   const c=safeFn(()=>cellContent(x,y),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]==='dungeon'&&(типы[c.structure.type]||0)<6&&!мест.some(m=>m.x===x&&m.y===y)){типы[c.structure.type]=(типы[c.structure.type]||0)+1;мест.push({x,y,type:c.structure.type,kind:'dungeon'});}}
  for(const m of мест){
   for(const d of [1,2,3,4,5,6,7,8,9,10,12,15,20,30,40,50]){if(d>safeFn(()=>{G.place={kind:"dungeon",stype:m.type,bx:m.x,by:m.y,depth:1,x:0,y:0};return maxDepthHere();},10))break;let lvl=null;
    try{G.place={kind:m.kind,stype:m.type,bx:m.x,by:m.y,depth:d,x:0,y:0};lvl=curLevel();}catch(e){continue;}
    if(!lvl||!lvl.g)continue;итог.уровней++;итог.видов[m.kind]=(итог.видов[m.kind]||0)+1;
    const W=lvl.w,H=lvl.h;const t=(x,y)=>tileAt(lvl,x,y);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=lvl.g[y][x];знаки[c]=(знаки[c]||0)+1;}
    /* вход: лестница вверх, ворота, иначе первая проходимая */
    let s=null;for(let y=0;y<H&&!s;y++)for(let x=0;x<W&&!s;x++){const c=t(x,y);if(c==="<"||(d===0&&c==="G"))s=[x,y];}
    if(!s)continue;
    const вид=new Uint8Array(W*H);const q=[s];вид[s[1]*W+s[0]]=1;
    while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const i=ny*W+nx;if(вид[i])continue;if(стены.has(t(nx,ny)))continue;вид[i]=1;q.push([nx,ny]);}}
    let карман=0,один=0;const пример=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(вид[y*W+x]||стены.has(t(x,y)))continue;карман++;
     const n4=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>!стены.has(t(x+dx,y+dy))).length;if(n4===0)один++;if(пример.length<3)пример.push([x,y,t(x,y)]);}
    if(карман){итог.сКарманами++;итог.клетокВКарманах+=карман;итог.одиночек+=один;if(итог.примеры.length<12)итог.примеры.push({m:m.type,d,карман,один,пример});}}}
  G.place=null;итог.знаки=знаки;итог.типы=типы;return итог;});
 console.log(JSON.stringify(r,null,1));await b.close();})();

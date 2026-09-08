const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(200);

 // 1. Генерация уровней: связность, наличие входа/выхода, лестниц
 const gen=await page.evaluate(()=>{
  const out={bad:[],kinds:{}};
  const check=(bx,by,depth,stype)=>{
   const l=genLevel(bx,by,depth,stype);
   let floors=0,down=0,up=0,gates=0;
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){const t=l.g[y][x];
    if(t!=="#")floors++;if(t===">")down++;if(t==="<")up++;if(t==="G")gates++;}
   // связность от входа
   const seen=new Set(),st=[[l.entry.x,l.entry.y]];
   while(st.length){const [x,y]=st.pop();const k=x+","+y;
    if(seen.has(k)||x<0||y<0||x>=l.w||y>=l.h||l.g[y][x]==="#")continue;
    seen.add(k);st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
   const reach=seen.size/floors;
   out.kinds[l.kind]=(out.kinds[l.kind]||0)+1;
   if(reach<0.6)out.bad.push({bx,by,depth,stype,reach:Math.round(reach*100)/100});
   if(l.kind!=="city"&&up===0&&depth>0)out.bad.push({bx,by,depth,stype,noUp:true});
   if(l.kind==="city"&&gates===0)out.bad.push({bx,by,stype,noGates:true});
   return {floors,down,up,gates,reach};};
  for(let i=0;i<12;i++){check(500+i*7,500+i*11,0,"village");check(300+i*5,700+i*3,0,"castle");
   check(900+i*3,900+i*7,0,"tavern");check(120+i*9,640+i*5,1,"ruins");
   check(200+i*4,300+i*6,3,"cave_entrance");}
  return out;});
 check('уровни связны от входа и имеют лестницы/ворота',gen.bad.length===0,gen.bad.slice(0,3));
 check('генерируются города, дома и подземелья',Object.keys(gen.kinds).length>=3,gen.kinds);

 // 2. Вход в постройку, ходьба, двери
 const walk=await page.evaluate(()=>{
  outer: for(let r=1;r<50;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]==="city"){G.x+=dx;G.y+=dy;break outer;}}
  const c=cellContent(G.x,G.y);
  if(!c.structure)return {skip:true};
  const ok=enterPlace(c);
  const start={x:G.place.x,y:G.place.y};
  let moved=0;
  for(let i=0;i<40;i++){const d=["E","S","W","N"][i%4];if(moveInside(d))moved++;}
  return {ok,kind:G.place.kind,start,now:{x:G.place.x,y:G.place.y},moved,name:G.place.name};});
 check('вход в город работает и внутри можно ходить',walk.ok&&walk.moved>0,walk);

 // 3. Стены не пропускают
 const wall=await page.evaluate(()=>{
  const l=curLevel();
  // ищем клетку рядом со стеной
  for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   if(tileAt(l,x,y)==="."&&tileAt(l,x+1,y)==="#"){G.place.x=x;G.place.y=y;
    const before={x:G.place.x,y:G.place.y};const r=moveInside("E");
    return {blocked:r===false&&G.place.x===before.x};}}
  return {blocked:true};});
 check('стены не пропускают игрока',wall.blocked,wall);

 // 4. Двери: первый шаг открывает, второй проводит
 const door=await page.evaluate(()=>{
  const c=cellContent(G.x,G.y);
  G.place={kind:"house",bx:c.x,by:c.y,stype:"tavern",name:"Тест",depth:0,x:1,y:1};
  const l=curLevel();
  const dirs=[["E",-1,0],["W",1,0],["S",0,-1],["N",0,1]];
  for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   if(l.g[y][x]!=="+")continue;
   for(const [d,ox,oy] of dirs){
    if(l.g[y+oy][x+ox]==="#")continue;
    G.place.x=x+ox;G.place.y=y+oy;G.marks={};
    const first=moveInside(d);const opened=placeMark(x,y)==="open";
    const second=moveInside(d);
    return {first,opened,second,dir:d,pos:[G.place.x,G.place.y],target:[x,y]};}}
  return {skip:true};});
 check('дверь сначала открывается, затем пропускает',door.skip||(door.first===false&&door.opened&&door.second===true),door);

 // 5. Лестницы: спуск и подъём
 const stairs=await page.evaluate(()=>{
  const c=cellContent(G.x,G.y);
  G.place=null;enterPlace(c);
  const l=curLevel();let f=null;
  for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===">")f={x,y};
  if(!f)return {skip:true};
  G.place.x=f.x;G.place.y=f.y;
  const d0=G.place.depth;const down=useHere();const d1=G.place.depth;
  const l2=curLevel();let up=null;
  for(let y=0;y<l2.h;y++)for(let x=0;x<l2.w;x++)if(l2.g[y][x]==="<")up={x,y};
  if(up){G.place.x=up.x;G.place.y=up.y;}
  const back=useHere();const d2=G.place?G.place.depth:null;
  return {d0,d1,d2,down,back};});
 check('лестница вниз и вверх работают',stairs.skip||(stairs.d1===stairs.d0+1&&stairs.d2===stairs.d0),stairs);

 // 6. Подземелье: сундук, жила, алтарь, логово
 const dung=await page.evaluate(()=>{
  const c=cellContent(G.x,G.y);
  G.place={kind:"dungeon",bx:c.x,by:c.y,stype:"ruins",name:"Тест",depth:3,x:1,y:1};
  const l=curLevel();
  const find=ch=>{for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===ch)return {x,y};return null;};
  const res={};
  const ch=find("C");
  if(ch){G.place.x=ch.x;G.place.y=ch.y;G.gold=0;G.items=[];useHere();res.chest={gold:G.gold,mark:placeMark(ch.x,ch.y)};}
  const rv=find("R");
  if(rv){G.place.x=rv.x;G.place.y=rv.y;const before=JSON.stringify(G.inv);useHere();res.vein=JSON.stringify(G.inv)!==before;}
  const al=find("A");
  if(al){G.place.x=al.x;G.place.y=al.y;G.faith={};useHere();res.altar=Object.keys(G.faith).length>0;}
  const mo=find("M");
  if(mo){G.place.x=mo.x;G.place.y=mo.y-0;
   // встаём рядом и шагаем на логово
   G.place.x=mo.x;G.place.y=mo.y;startInsideCombat(mo.x,mo.y);
   res.combat=!!G.inCombat;
   const kills=G.dungeonKills||0;victory();res.kills=(G.dungeonKills||0)>kills;res.dead=placeMark(mo.x,mo.y)==="dead";}
  return res;});
 check('сундук в подземелье даёт добычу и закрывается',dung.chest&&dung.chest.gold>0&&dung.chest.mark==="open",dung.chest);
 check('жила ресурса добывается',dung.vein===true);
 check('алтарь в подземелье принимает молитву',dung.altar===true);
 check('логово начинает бой, победа очищает клетку',dung.combat&&dung.kills&&dung.dead,{c:dung.combat,k:dung.kills,d:dung.dead});

 // 6b. Город: ворота, дома с дверями, лавка, горн, алтарь, колодец, спуск
 const city=await page.evaluate(()=>{
  const l=genLevel(500,500,0,"castle");
  const count=ch=>{let n=0;for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===ch)n++;return n;};
  // дверь должна вести с улицы в комнату
  let doorOk=false;
  for(let y=1;y<l.h-1&&!doorOk;y++)for(let x=1;x<l.w-1;x++){
   if(l.g[y][x]==="+"&&l.g[y-1][x]==="."&&l.g[y+1][x]==="."){doorOk=true;break;}}
  return {gates:count("G"),doors:count("+"),shop:count("S"),forge:count("F"),altar:count("A"),
   well:count("W"),down:count(">"),homes:count("N"),doorOk};});
 check('в городе есть ворота, дома с дверями, лавка, горн, храм и спуск вниз',
  city.gates===4&&city.doors>=4&&city.doorOk&&city.shop>0&&city.forge>0&&city.altar>0&&city.down>0,city);

 // 7. Маяки: у всех типов клеток есть звук
 const bset=await page.evaluate(()=>{
  const miss=[];for(const k of Object.keys(TILE)){const b=TILE[k].b;if(b&&!BEACONS[b])miss.push(k+"→"+b);}
  const info=[];for(const k of Object.keys(BEACONS))if(!BEACON_INFO[k])info.push(k);
  return {miss,info};});
 check('у каждой клетки есть существующий маяк',bset.miss.length===0,bset.miss);
 check('все маяки описаны в энциклопедии звуков',bset.info.length===0,bset.info);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();

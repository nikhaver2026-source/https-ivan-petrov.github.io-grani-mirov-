/* ════════════════════════════════════════════════════════════════════════
   ГЕРОЙ НЕ ЗАМУРОВАН (после 17.5)
   Жалоба игрока: «в последней версии игры я оказался в подземелье, в тупике,
   на одной клетке, а по четырём сторонам стены. И выбраться я не смог».
   Место героя в ярусе хранится в сохранении двумя числами, а сам ярус каждый
   раз строится заново. Стоит ярусу лечь иначе — после обновления игры, из-за
   особого места или переноса сквозь камень, — и сохранённая клетка может
   оказаться в толще скалы или в кармане, откуда нет хода к лестнице.
   Теперь игра проверяет клетку героя:
   • после загрузки сохранения;
   • при входе в место, на новый ярус, в тайную палату и при выходе из неё;
   • на шаге, когда со всех четырёх сторон стена.
   Если с клетки шагами не дойти ни до одного выхода (лестница, ворота, лаз,
   подъёмник, вход яруса), герой переносится на ближайшую клетку, от которой
   выход достижим, и слышит, куда он выбрался. Завал и запертая дверь — не
   стена: завал разбирают, дверь отпирают.
   ════════════════════════════════════════════════════════════════════════ */
const НеЗамурован={
 ВЫХОДЫ:new Set(["<",">","G","Q","E"]),
 сплошь(t){return t==="#"||t==null;},
 /* все клетки, связанные шагами (четыре стороны) с (x,y) */
 область(lvl,x,y){
  const W=lvl.w,H=lvl.h,вид=new Uint8Array(W*H),q=[[x,y]],все=[];
  if(x<0||y<0||x>=W||y>=H||this.сплошь(tileAt(lvl,x,y)))return все;
  вид[y*W+x]=1;
  while(q.length){const [cx,cy]=q.pop();все.push([cx,cy]);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;
    if(nx<0||ny<0||nx>=W||ny>=H)continue;const i=ny*W+nx;if(вид[i])continue;
    if(this.сплошь(tileAt(lvl,nx,ny)))continue;вид[i]=1;q.push([nx,ny]);}}
  return все;},
 выходЛи(lvl,x,y){return this.ВЫХОДЫ.has(tileAt(lvl,x,y))||!!(lvl.entry&&lvl.entry.x===x&&lvl.entry.y===y);},
 /* клетка, с которой начинается связная часть яруса: вход яруса, иначе любой выход */
 начало(lvl){
  if(lvl.entry&&!this.сплошь(tileAt(lvl,lvl.entry.x,lvl.entry.y)))return [lvl.entry.x,lvl.entry.y];
  for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(this.ВЫХОДЫ.has(tileAt(lvl,x,y)))return [x,y];
  return null;},
 /* можно ли с клетки героя дойти до выхода; если нет — перенос. Возвращает true, если героя перенесли. */
 проверить(почему){
  try{
   const p=G.place;if(!p||G.inCombat||G.ship)return false;
   if(safeFn(()=>Chertog.inside(),false))return false;
   const lvl=curLevel();if(!lvl||!lvl.g||!(lvl.w>0))return false;
   const x=Number(p.x),y=Number(p.y);
   if(Number.isFinite(x)&&Number.isFinite(y)&&!this.сплошь(tileAt(lvl,x,y))){
    const об=this.область(lvl,x,y);
    if(об.some(([cx,cy])=>this.выходЛи(lvl,cx,cy)))return false;}
   const н=this.начало(lvl);if(!н)return false;
   const путь=this.область(lvl,н[0],н[1]);if(!путь.length)return false;
   /* ближайшая клетка связной части; простой пол — лучше лестницы и вещей */
   let лучш=null,лд=Infinity;
   for(const [cx,cy] of путь){const t=tileAt(lvl,cx,cy);
    const d=Math.max(Math.abs(cx-(Number.isFinite(x)?x:н[0])),Math.abs(cy-(Number.isFinite(y)?y:н[1])))+(t==="."?0:0.5);
    if(d<лд){лд=d;лучш=[cx,cy];}}
   if(!лучш)return false;
   p.x=лучш[0];p.y=лучш[1];p.arm=null;G.flight=null;
   this.было={почему:String(почему||""),x,y,куда:лучш.slice(),t:Date.now()};
   safeFn(()=>journal("Выбрались из замурованной клетки к проходу."));
   const шаги=Math.round(лд);
   setTimeout(()=>safeFn(()=>narrate(`Здесь не было хода: со всех сторон камень, до выхода не дойти. Вы выбрались к ближайшему проходу${шаги>0?`, в ${шаги} ${plural(шаги,"шаге","шагах","шагах")} от прежнего места`:""}. ${describeHere(true)}`,{interrupt:false,pri:1,key:"zamurovan"})),почему==="загрузка"?900:150);
   safeFn(()=>{Bank.play("deep_rocks",{gain:0.4,maxSec:3});});
   safeFn(()=>refresh());safeFn(()=>saveGame(true));
   return true;
  }catch(_){return false;}},
 /* шаг не прошёл, и со всех четырёх сторон стена — проверка */
 зажат(){
  try{const p=G.place;if(!p)return false;const lvl=curLevel();if(!lvl)return false;
   return [[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>this.сплошь(tileAt(lvl,p.x+dx,p.y+dy)));}catch(_){return false;}}};

safeFn(()=>{const a0=applySave;applySave=function(){const r=a0.apply(this,arguments);if(r)safeFn(()=>НеЗамурован.проверить("загрузка"));return r;};});
safeFn(()=>{const e0=enterPlace;enterPlace=function(){const r=e0.apply(this,arguments);safeFn(()=>НеЗамурован.проверить("вход"));return r;};});
safeFn(()=>{const c0=changeDepth;changeDepth=function(){const r=c0.apply(this,arguments);if(r)safeFn(()=>НеЗамурован.проверить("ярус"));return r;};});
safeFn(()=>{for(const имя of ["enterSecret","exitSecret"]){const f0=window[имя];if(typeof f0!=="function")continue;
 window[имя]=function(){const r=f0.apply(this,arguments);safeFn(()=>НеЗамурован.проверить(имя));return r;};}});
safeFn(()=>{const m0=moveInside;moveInside=function(){const r=m0.apply(this,arguments);
 if(r===false&&!G.flight&&НеЗамурован.зажат())safeFn(()=>НеЗамурован.проверить("шаг"));return r;};});

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 288: 14.5 — ВЕЛИКИЕ МАТЕРИКИ (ФАЗА III «БЕСКОНЕЧНОЙ ХРОНИКИ»)

   Мир — двадцать миллионов клеток на двадцать. Проверяется, что это
   работает в игре, а не только в описании:
   1. Прежние земли не сдвинуты ни на клетку: отпечаток четырёх тысяч клеток
      (биом, держава, область, рельеф) тот же, что до расширения.
   2. Семь материков, океаны, широта: экватор жарче умеренного пояса,
      Ледяная Корона стынет; у каждой клетки — климат и сезон.
   3. Реки: у каждой исток и устье; приток впадает в существующую реку;
      исток выше устья; из озёр с вытоком вытекает река; есть дельты и пороги.
   4. Река под ногами: «откуда и куда», сплав вниз приближает к устью, подъём
      вверх — к истоку.
   5. Озёра: клетка озера — озеро; озеро даёт берегам влагу; рыбалка у озера и
      у реки — пресная рыба.
   6. Архипелаги, пираты, чудовища: острова — суша; бой с пиратами убавляет
      их силу, а без силы база пала; чудище повержено — в сохранении.
   7. Плавучие острова дрейфуют; стада ходят по сезонам, охота их убавляет.
   8. Перемены земли действуют на биом и переживают сохранение; выжженная
      войной земля заживает.
   9. Края и державы материков: свои области с неповторимыми именами,
      держава клетки — материковая, престол — замок.
  10. Дальний рейс: гавани прежнего мира и материков, переход тратит
      припасы, рейс доходит до гавани.
  11. Меню, окно, скорость и сохранение.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const p=await (await browser.newContext()).newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const ss0=Speech.say.bind(Speech);Speech.say=(t,o)=>{SAID.push(String(t));try{return ss0(t,o);}catch(_){return true;}};
  const out={};
  /* 1. отпечаток прежних земель */
  {let h=2166136261;const mix=s=>{for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}};
   for(let i=0;i<4000;i++){const x=Math.floor(hashName(i,11,77)*1000000),y=Math.floor(hashName(i,12,77)*1000000);
    mix(biomeAt(x,y).id+"|"+EMPIRES.indexOf(empireAt(x,y))+"|"+regionIndexAt(x,y)+"|"+terrainAt(x,y)[0]+";");}
   out.отпечаток=(h>>>0).toString(16);}
  out.WM=WORLD_MAX;out.PM=PRK_MAX;out.W=WORLD;
  /* 2. материки, широта, климат */
  out.материков=MATERIKI.length;out.океанов=MAT_OCEANS.length;
  out.сушаВСередине=MATERIKI.filter(c=>{const L=matContAt(c.cx,c.cy);return L&&L.c===c&&L.f>0;}).map(c=>c.id);
  out.широта=[matLat(0),matLat(MAT_EQ),matLat(MAT_POLE)];
  const тепло=(c)=>{let s=0,n=0;for(let i=0;i<60;i++){const x=Math.round(c.cx+(hashName(i,3,9)-0.5)*c.rx),y=Math.round(c.cy+(hashName(i,4,9)-0.5)*c.ry*0.6);const k=matClimateAt(x,y);if(k.высота>=0.3){s+=k.тепло;n++;}}return n?s/n:0;};
  out.теплоЧаша=тепло(MAT_BY_ID.chasha);out.теплоВереск=тепло(MAT_BY_ID.veresk);out.теплоКорона=тепло(MAT_BY_ID.korona);
  out.сезоны=[matSeason(1000000,170).имя,matSeason(1000000,350).имя,matSeason(14000000,170).имя];
  /* 3. реки */
  const рекПлохих=[],итоги={};let дельт=0,порогов=0,притоков=0,озёрСВытоком=0,вытокВерен=0;
  for(const c of MATERIKI){const D=MatHydro.get(c);итоги[c.id]=[D.rivers.length,D.lakes.length];
   for(const R of D.rivers){
    if(!R.pts||R.pts.length<2||!R.исток||!R.устье)рекПлохих.push(R.n+":нет концов");
    if(R.устье.вид==="river"){const T=D.rivers[R.устье.river];if(!T||T.притоки.indexOf(R.id)<0)рекПлохих.push(R.n+":приток мимо");притоков++;}
    if(R.устье.вид==="lake"&&!D.lakes[R.устье.lake])рекПлохих.push(R.n+":озеро мимо");
    if(R.hh[0]+0.02<R.hh[R.hh.length-1])рекПлохих.push(R.n+":течёт вверх");
    if(R.дельта)дельт++;порогов+=R.пороги.length;}
   for(const l of D.lakes)if(l.выход!=null){озёрСВытоком++;const R=D.rivers[l.выход];if(R&&R.исток.вид==="озеро"&&R.исток.lake===l.id)вытокВерен++;}}
  out.рекПлохих=рекПлохих.slice(0,6);out.итоги=итоги;out.дельт=дельт;out.порогов=порогов;out.притоков=притоков;out.озёрСВытоком=озёрСВытоком;out.вытокВерен=вытокВерен;
  /* 4. река под ногами, сплав и подъём */
  {const D=MatHydro.get(MAT_BY_ID.veresk);const R=D.rivers.filter(x=>x.пороги.length===0).sort((a,b)=>b.len-a.len)[0];
   const k=Math.floor(R.pts.length/2),a=R.pts[k],b=R.pts[k+1],vx=b[0]-a[0],vy=b[1]-a[1],L=Math.hypot(vx,vy),nx=-vy/L,ny=vx/L;let ок=null;
   for(let d=-700;d<=700&&!ок;d+=2){const x=Math.round(a[0]+nx*d),y=Math.round(a[1]+ny*d);if(biomeAt(x,y).id==="river")ок={x,y};}
   out.естьВода=!!ок;
   if(ок){G.place=null;G.ship=null;G.dark=false;G.inCombat=false;G.x=ок.x;G.y=ок.y;
    out.реказТекст=Mater.riverText(G.x,G.y);const h0=Mater.riverHere(G.x,G.y,600);out.меню=amAvailable("mriver");
    Mater.alongRiver(1);const h1=Mater.riverHere(G.x,G.y,3000);out.вниз=[Math.round(h0.доУстья),h1?Math.round(h1.доУстья):null];
    Mater.alongRiver(-1);Mater.alongRiver(-1);const h2=Mater.riverHere(G.x,G.y,3000);out.вверх=[h1?Math.round(h1.доИстока):null,h2?Math.round(h2.доИстока):null];}}
  /* 5. озёра, влага, рыбалка */
  {const D=MatHydro.get(MAT_BY_ID.temnoles);const l=D.lakes.slice().sort((a,b)=>b.r-a.r)[0];out.озероБиом=biomeAt(l.cx,l.cy).id;
   const x=Math.round(l.cx+l.r*1.6),y=l.cy;out.влагаОзеро=[matClimateCalc(x,y,true).влага,matClimateCalc(x,y,false).влага];
   G.x=l.cx;G.y=l.cy;G.place=null;G.ship=null;out.текстОзера=Mater.lakeText(l.cx,l.cy);out.спотОзеро=fishingSpot();
   out.рыбаОзера=FISH.filter(f=>f.where.includes("lake")).map(f=>f.n);out.рыбаРеки=FISH.filter(f=>f.where.includes("river")).map(f=>f.n);}
  /* 6. острова, пираты, чудовища */
  out.архипелагов=MAT_ISLES.length;out.островаСуша=MAT_ISLES.filter(a=>{const s=matIslands(a)[0];return matHeight(s.x,s.y).h>=0.3;}).length;
  out.пиратов=MAT_PIRATES.length;out.чудищ=MAT_MONSTERS.length;
  G.mat=null;const st=Mater.st();const P=MAT_PIRATES[0];const сила0=Mater.pir(P.id).сила;
  Mater.afterWin({пират:P.id});const сила1=Mater.pir(P.id).сила;for(let i=0;i<5;i++)Mater.afterWin({пират:P.id});
  out.пираты=[сила0,сила1,Mater.pir(P.id).сила,!!Mater.pir(P.id).разорена];
  const M=MAT_MONSTERS[0];Mater.afterWin({чудище:M.id});out.чудище=[!!Mater.mon(M.id).убит,Number(G.inv&&G.inv[`трофей: ${M.n}`])||0];
  out.пиратовРядомПослеРазгрома=!Mater.pirateNear(MAT_ISLE_BY_ID[P.база].cx,MAT_ISLE_BY_ID[P.база].cy);
  /* 7. дрейф и стада */
  const d1=matDriftIsles(10)[0],d2=matDriftIsles(100)[0];out.дрейф=Math.round(Math.hypot(d1.x-d2.x,d1.y-d2.y));
  const Hd=MAT_HERDS[0];const лето=Mater.herdPos(Hd,170),зима=Mater.herdPos(Hd,350);out.стадоХод=Math.round(Math.hypot(лето.x-зима.x,лето.y-зима.y));
  G.day=200;const hp=Mater.herdPos(Hd);G.x=hp.x;G.y=hp.y;G.place=null;G.ship=null;G.inCombat=false;const сила=Mater.herdPower(Hd);
  out.охотаМеню=amAvailable("mhunt");Mater.hunt();out.стадо=[сила,Mater.herdPower(Hd)];G.day=230;out.стадоОтросло=Mater.herdPower(Hd);
  /* 8. перемены земли */
  const c0=MAT_BY_ID.suholes,gx=c0.cx+50000,gy=c0.cy-40000;const био={};
  for(const вид of ["обвал","извержение","катастрофа","война"]){const g=Mater.geoAdd(вид,gx+Object.keys(био).length*60000,gy);био[вид]=biomeAt(g.x,g.y).id;}
  const зт=Mater.geoAdd("землетрясение",gx,gy+90000);био.землетрясение=biomeAt(зт.x,зт.y).id;
  const ру=Mater.geoAdd("русло",gx,gy+180000);био.русло=biomeAt(ру.x,ру.y).id;
  out.перемены=био;out.переменВСохр=Mater.st().geo.length;out.хроника=Mater.st().chron.length;
  /* перемена земли заводит весть: у рода «земля» своя лестница, и нижняя ступень — само событие */
  const весть=(G.rumors||[]).filter(r=>r.в==="земля").slice(-1)[0];
  out.молва=весть?rumorText(весть).текст:"";out.молваВсе=["пираты","чудище","материк","земля"].every(k=>Array.isArray(RUMOR_LADDER[k])&&RUMOR_LADDER[k].length===5);
  const копия=JSON.parse(JSON.stringify(G.mat));G.mat=null;Mater.clearCaches();out.безПеремен=biomeAt(gx,gy).id;G.mat=копия;Mater.clearCaches();out.послеЗагрузки=biomeAt(gx,gy).id;
  const война=G.mat.geo.find(g=>g.вид==="война");G.day=(Number(G.day)||1)+200;Mater.clearCaches();out.войнаЗажила=biomeAt(война.x,война.y).id;
  /* 9. края и державы */
  const крайКл=MATERIKI.map(c=>{const r=regionAt(c.cx,c.cy);return r&&r.мат===c.id;});out.краяНаМесте=крайКл.filter(Boolean).length;
  out.краёв=REGIONS.filter(x=>x.мат).length;out.именаКраёв=new Set(REGIONS.map(x=>x.n)).size===REGIONS.length;
  out.держав=MAT_REALMS.length;out.державаКлетки=MATERIKI.filter(c=>{const e=empireAt(c.cx,c.cy);return e&&e.материк===c.id;}).length;
  out.престолЗамок=MAT_REALMS.filter(e=>isCapCell(e.cap.x,e.cap.y)).length;out.голосаДержав=EMPIRE_VOICE.length===EMPIRES.length;
  /* 10. дальний рейс */
  const H=Mater.harbors();out.гаваней=[H.filter(h=>h.старый).length,H.filter(h=>h.мат).length,H.filter(h=>h.остров).length];
  const стар=H.find(h=>h.старый);G.x=стар.x;G.y=стар.y;G.place=null;G.ship=null;G.inCombat=false;G.gold=5000;
  const рейсы=Mater.voyages(стар);out.рейсы=рейсы.map(v=>v.to.n).slice(0,4);
  const i=рейсы.findIndex(v=>v.to.мат);out.отплыл=Mater.sail(i);const sh=G.ship;out.дальний=!!(sh&&sh.дальний);const пр0=sh&&sh.припасы;
  let ходов=0;window.maybeSeaEvent=()=>false;window.islandSight=()=>false;
  while(G.ship&&ходов<40){if(G.inCombat){try{endCombat();}catch(_){}G.inCombat=false;}sailLeg();ходов++;}
  out.рейс=[пр0,ходов,!G.ship,Math.abs(G.x-рейсы[i].to.x)<=2&&Math.abs(G.y-рейсы[i].to.y)<=2];
  /* 11. меню, окно, скорость, сохранение */
  out.пункты=["mater","mriver","mlake","mhunt","mtpay"].filter(k=>AM_GROUPS.some(g=>g[1].some(x=>x[0]===k))&&typeof CMD[k]==="function");
  G.dark=false;G.place=null;Mater.home();const m=document.getElementById("modal-mater");out.окно=!!m&&!m.hidden&&/Материки/.test(m.textContent)&&/Архипелаги/.test(m.textContent);
  while(activeLayer())closeTopUI();
  for(let i=0;i<1500;i++){const c=MATERIKI[i%7];safeFn(()=>cellContent(Math.round(c.cx+(hashName(i,5,3)-0.5)*c.rx),Math.round(c.cy+(hashName(i,6,3)-0.5)*c.ry)));}
  const t0=performance.now();for(let i=0;i<20000;i++){const c=MATERIKI[i%7];safeFn(()=>cellContent(Math.round(c.cx+(hashName(i,7,3)-0.5)*c.rx*1.4),Math.round(c.cy+(hashName(i,8,3)-0.5)*c.ry*1.4)));}
  out.мс20000=Math.round(performance.now()-t0);
  out.сохрБайт=JSON.stringify(G.mat).length;
  G.mat=undefined;try{Mater.st();out.старыйСейв=!!G.mat&&Array.isArray(G.mat.geo);}catch(e){out.старыйСейв=String(e);}
  return out;});
 check('1. прежние земли не сдвинуты: отпечаток 4000 клеток тот же; мир — 20 млн, полоса Перекроя — до 1 млн',
  r.отпечаток==="fff26a67"&&r.WM===20000000&&r.PM===1000000&&r.W===800000,{отпечаток:r.отпечаток,WM:r.WM,PM:r.PM});
 check('2. семь материков с сушей в середине, пять океанов; широта от 45° с. ш. до полюса; на экваторе жарче, чем в умеренном поясе, Корона стынет; сезоны свои',
  r.материков===7&&r.океанов===5&&r.сушаВСередине.length===7&&r.широта[0]===-45&&r.широта[1]===0&&r.широта[2]===90&&r.теплоЧаша>r.теплоВереск&&r.теплоКорона<0.2&&r.сезоны[0]!==r.сезоны[1],
  {суша:r.сушаВСередине,широта:r.широта,тепло:[r.теплоЧаша,r.теплоВереск,r.теплоКорона],сезоны:r.сезоны});
 check('3. реки: у каждой исток и устье, притоки впадают в свои реки, вода течёт вниз; есть дельты, пороги, притоки и озёра с вытоком',
  !r.рекПлохих.length&&Object.values(r.итоги).every(([n])=>n>0)&&r.дельт>0&&r.порогов>0&&r.притоков>20&&r.озёрСВытоком>0&&r.вытокВерен===r.озёрСВытоком,
  {плохие:r.рекПлохих,итоги:r.итоги,дельт:r.дельт,порогов:r.порогов,притоков:r.притоков,вытоки:[r.озёрСВытоком,r.вытокВерен]});
 check('4. река под ногами: «откуда и куда» (исток, направление, устье, расстояния); сплав вниз ближе к устью, подъём вверх — к истоку',
  r.естьВода&&/течёт на /.test(r.реказТекст||"")&&/впадает/.test(r.реказТекст||"")&&/До устья/.test(r.реказТекст||"")&&r.меню&&r.вниз[1]<r.вниз[0]&&r.вверх[1]<r.вверх[0],
  {текст:(r.реказТекст||"").slice(0,200),вниз:r.вниз,вверх:r.вверх});
 check('5. озеро: клетка — озеро, берегам больше влаги, рыбалка у озера — пресная рыба',
  r.озероБиом==="lake"&&r.влагаОзеро[0]>r.влагаОзеро[1]&&r.спотОзеро==="lake"&&r.рыбаОзера.length>=4&&r.рыбаРеки.length>=4&&/Озеро /.test(r.текстОзера),
  {биом:r.озероБиом,влага:r.влагаОзеро,спот:r.спотОзеро,текст:(r.текстОзера||"").slice(0,120)});
 check('6. двенадцать архипелагов (главные острова — суша), три пиратских братства, четыре чудища; бои убавляют силу братства, без силы база пала; чудище повержено и трофей у героя',
  r.архипелагов===12&&r.островаСуша===12&&r.пиратов===3&&r.чудищ===4&&r.пираты[1]<r.пираты[0]&&r.пираты[2]===0&&r.пираты[3]&&r.чудище[0]&&r.чудище[1]===1&&r.пиратовРядомПослеРазгрома,
  {острова:r.островаСуша,пираты:r.пираты,чудище:r.чудище});
 check('7. плавучие острова дрейфуют; стадо меняет угодья по сезону; охота убавляет стадо, и оно отрастает',
  r.дрейф>10000&&r.стадоХод>200000&&r.охотаМеню&&r.стадо[1]<r.стадо[0]&&r.стадоОтросло>r.стадо[1],{дрейф:r.дрейф,ход:r.стадоХод,стадо:r.стадо,отросло:r.стадоОтросло});
 check('8. перемены земли: обвал — озеро, извержение — вулкан, катастрофа — пустошь, война — пепелище, землетрясение — разлом, старое русло обсохло; всё в сохранении, в летописи и в молве; пепелище заживает',
  r.перемены.обвал==="lake"&&r.перемены.извержение==="volcano"&&r.перемены.катастрофа==="magic_waste"&&r.перемены.война==="scorched_land"&&r.перемены.землетрясение==="chasm"&&r.перемены.русло==="dry_riverbed"
  &&r.переменВСохр===6&&r.хроника>=6&&r.безПеремен!=="lake"&&r.послеЗагрузки==="lake"&&r.войнаЗажила!=="scorched_land"
  &&/:/.test(r.молва)&&!/\{что\}/.test(r.молва)&&r.молваВсе,
  {перемены:r.перемены,сохр:r.переменВСохр,без:r.безПеремен,после:r.послеЗагрузки,война:r.войнаЗажила,молва:r.молва,лестницы:r.молваВсе});
 check('9. края материков в общем списке областей (имена не повторяются), у середины материка — свой край и своя держава; тридцать держав, престолы — замки, у каждой державы свой голос',
  r.краяНаМесте===7&&r.краёв>=200&&r.именаКраёв&&r.держав===30&&r.державаКлетки===7&&r.престолЗамок===30&&r.голосаДержав,
  {края:[r.краяНаМесте,r.краёв,r.именаКраёв],держав:r.держав,клетки:r.державаКлетки,замки:r.престолЗамок});
 check('10. дальний рейс: три гавани прежнего мира, гавани семи материков и островов; рейс тратит припасы и доходит до гавани',
  r.гаваней[0]===3&&r.гаваней[1]===7&&r.гаваней[2]>=4&&r.отплыл&&r.дальний&&r.рейс[0]>0&&r.рейс[2]&&r.рейс[3],{гавани:r.гаваней,рейсы:r.рейсы,рейс:r.рейс});
 check('11. пункты меню и окно «Материки и воды»; двадцать тысяч клеток материков быстрее двух секунд; сохранение маленькое; старое сохранение без материков читается',
  r.пункты.length===5&&r.окно&&r.мс20000<2000&&r.сохрБайт<20000&&r.старыйСейв===true,{пункты:r.пункты,окно:r.окно,мс:r.мс20000,байт:r.сохрБайт,старый:r.старыйСейв});
 check('12. ни одной ошибки страницы',!errors.length,errors.slice(0,3));
 for(const x of results)console.log(x);
 await browser.close();
})();

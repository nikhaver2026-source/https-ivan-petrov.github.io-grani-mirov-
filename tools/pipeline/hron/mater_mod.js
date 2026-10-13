/* ── МОДУЛЬ «МАТЕРИКИ» ── края, державы, воды, острова, моря, стада,
   пираты, чудовища, перемены земли, дальние рейсы. */
const Mater={
 st(){if(!G.mat||typeof G.mat!=="object")G.mat={};const s=G.mat;
  for(const k of ["pir","mon","herd","seen","rivers","lakes","isles","firsts"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  for(const k of ["geo","chron"])if(!Array.isArray(s[k]))s[k]=[];
  if(!Number.isFinite(Number(s.day)))s.day=0;if(!Number.isFinite(Number(s.geoN)))s.geoN=0;
  return s;},
 day(){return Number(G.day)||1;},
 say(t,o){if(t)narrate(t,Object.assign({interrupt:false},o||{}));},
 play(role,o){safeFn(()=>Bank.play(role,Object.assign({gain:0.6,maxSec:6},o||{})));},
 q(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));},
 btn(cmd,label,speak){return `<button type="button" class="item" data-cmd="mt:${cmd}" data-speak="${this.q(speak||label)}">${this.q(label)}</button>`;},
 chron(t){const s=this.st();s.chron.unshift(`День ${this.day()}: ${t}`);if(s.chron.length>60)s.chron.length=60;
  safeFn(()=>journal("Материки: "+t));safeFn(()=>Director.chron("Материки — "+t));},
 dist(v){/* расстояние в шагах: крупное — тысячами и миллионами */const d=Math.round(v);
  if(d>=1000000){const m=Math.round(d/100000)/10;return `${String(m).replace(".",",")} ${Number.isInteger(m)?plural(m,"миллион","миллиона","миллионов"):"миллиона"} шагов`;}
  if(d>=10000){const t=Math.round(d/1000);return `${t} ${plural(t,"тысяча","тысячи","тысяч")} шагов`;}
  return `${d} ${plural(d,"шаг","шага","шагов")}`;},
 dirWord(dx,dy){const a=Math.atan2(dy,dx);const W=["восток","юго-восток","юг","юго-запад","запад","северо-запад","север","северо-восток"];return W[((Math.round(a/(Math.PI/4))%8)+8)%8];},
 /* ── ГДЕ МЫ ── */
 pos(){return {x:G.x,y:G.y};},
 contAt(x,y){const L=matContAt(x,y);return L&&L.f>-0.02?L.c:null;},
 here(){if(G.place||G.dark)return null;return inNewLands(G.x,G.y)?{c:this.contAt(G.x,G.y),o:matOceanAt(G.x,G.y)}:null;},
 regionsOf(c){return MatGen.regionsOf(c);},
 regionAt(x,y){
  const c=this.contAt(x,y);if(!c){const o=matOceanAt(x,y);return this.oceanRegion(o);}
  const R=this.regionsOf(c);let best=R[0],bd=Infinity;for(const r of R){const d=(x-r.x)*(x-r.x)+(y-r.y)*(y-r.y);if(d<bd){bd=d;best=r;}}return best;},
 _oreg:{},oceanRegion(o){return this._oreg[o.id]||(this._oreg[o.id]={id:"mt_ocean_"+o.id,n:o.n,о:`Открытая вода: ${o.о}.`,климат:"морской",биомы:["inner_sea"],ресурс:"рыба",опасность:3,звук:[o.звук],ярус:"wild",океан:o.id});},
 buildRealms(){return MatGen.buildRealms();},
 _rc:new Map(),
 realmAt(x,y){
  const k=Math.floor(x/25000)*4096+Math.floor(y/25000);const was=this._rc.get(k);
  let reg=null;if(was)return was;
  const c=this.contAt(x,y);if(c){reg=this.regionAt(x,y);}
  let e=reg&&reg.realm;
  if(!e){let bd=Infinity;for(const m of MAT_REALMS){const d=Math.hypot(m.cap.x-x,m.cap.y-y);if(d<bd){bd=d;e=m;}}}
  if(this._rc.size>8000)this._rc.clear();this._rc.set(k,e);return e;},
 /* ── ВОДЫ ── */
 lakeNear(x,y){return MatHydro.lakeNear(x,y);},
 flooding(R,day){const d=((Number(day||this.day())%360)+360)%360,[a,b]=R.разлив;return a<=b?(d>=a&&d<=b):(d>=a||d<=b);},
 volcanic(x,y){const c=this.contAt(x,y);if(c)for(const v of c.вулканы)if(matPolyDist(x,y,v.pts)<130000)return true;
  const I=matIsleAt(x,y);return !!(I&&I.a.id==="kaldera");},
 waterAt(x,y,cl){
  const lk=MatHydro.lakeNear(x,y);
  if(lk){const l=lk.l,rr=l.r*(1+0.2*(matFbm(x,y,Math.max(3000,l.r*0.5),9841+l.id,2)-0.5)*2);if(lk.d<rr)return "lake";if(lk.d<rr*1.12)return "lakeland";}
  const nr=MatHydro.near(x,y);if(!nr)return null;
  for(const dl of nr.D.deltas)if(Math.abs(x-dl.x)<dl.r&&Math.abs(y-dl.y)<dl.r&&Math.hypot(x-dl.x,y-dl.y)<dl.r*(0.8+0.4*matFbm(x,y,9000,9851,2)))return nr.hit&&nr.hit.e<=0?"river_mouth":"river_delta";
  const h=nr.hit;if(!h)return null;
  if(h.e>0){if(h.R&&this.flooding(h.R)&&h.e<h.w*1.5+400)return "flood_plain";return null;}
  if(h.S)return "stream";
  if(h.R.пороги.indexOf(h.k)>=0&&h.t>0.35&&h.t<0.65)return "waterfall";
  /* в карсте река ныряет под камень и течёт в темноте */
  if(cl&&cl.высота>=MAT_TH.ХОЛМЫ&&cl.высота<MAT_TH.ГОРЫ&&hashName(Math.floor(x/4000),Math.floor(y/4000),9941)<0.25)return "underground_river";
  return "river";},
 /* Река под ногами или рядом: что за река, куда течёт, до устья и истока. */
 riverHere(x,y,rad){
  x=x==null?G.x:x;y=y==null?G.y:y;
  if(!inNewLands(x,y))return this.oldRiver(x,y,rad);
  const nr=MatHydro.near(x,y);if(!nr||!nr.hit||!nr.hit.R)return null;const h=nr.hit;if(h.e>(rad||300))return null;
  const R=h.R,a=R.pts[h.k],b=R.pts[h.k+1];
  let доУстья=Math.hypot(b[0]-x,b[1]-y);for(let k=h.k+1;k+1<R.pts.length;k++)доУстья+=Math.hypot(R.pts[k+1][0]-R.pts[k][0],R.pts[k+1][1]-R.pts[k][1]);
  let доИстока=Math.hypot(x-a[0],y-a[1]);for(let k=0;k<h.k;k++)доИстока+=Math.hypot(R.pts[k+1][0]-R.pts[k][0],R.pts[k+1][1]-R.pts[k][1]);
  return {R,D:nr.D,k:h.k,t:h.t,dx:b[0]-a[0],dy:b[1]-a[1],доУстья,доИстока,в:h.e<=0};},
 /* Реки прежних земель — полосы по высотам: течение — вниз по склону. */
 oldRiver(x,y,rad){
  const b=safeFn(()=>biomeAt(x,y),null);if(!b||["river","stream","waterfall","river_mouth"].indexOf(b.id)<0)return null;
  const D=40,h=(a,c)=>climateAt(a,c).высота,gx=h(x+D,y)-h(x-D,y),gy=h(x,y+D)-h(x,y-D);
  const n=`${["Серебр","Тих","Быстр","Чёрн","Бел","Студ","Золот","Ясн"][Math.floor(hashName(Math.floor(x/9000),Math.floor(y/9000),9881)*8)]}${["ица","янка","ава","ея","ка"][Math.floor(hashName(Math.floor(x/9000),Math.floor(y/9000),9882)*5)]}`;
  return {old:true,n,dx:-gx,dy:-gy,в:true,b:b.id};},
 riverText(x,y){
  const r=this.riverHere(x,y,600);if(!r)return "Реки рядом нет. Реки видно по шуму воды; на новых землях они текут от гор к морю.";
  if(r.old)return `Река ${r.n}. Течёт на ${this.dirWord(r.dx,r.dy)} — вниз по склону, к низинам и морю.`;
  const R=r.R,уст=R.устье.вид==="sea"?`в ${matOceanAt(R.pts[R.pts.length-1][0],R.pts[R.pts.length-1][1]).n}${R.дельта?" широкой дельтой":""}`:R.устье.вид==="lake"?`в озеро ${r.D.lakes[R.устье.lake].n}`:`в реку ${r.D.rivers[R.устье.river].n} — это её приток`;
  const ист=R.исток.вид==="озеро"?`вытекает из озера ${r.D.lakes[R.исток.lake].n}`:R.исток.вид==="горы"?"берёт начало в горах":R.исток.вид==="болото"?"берёт начало в болотах":"начинается родником";
  const пр=R.притоки.length?` Притоков ${R.притоки.length}: ${R.притоки.slice(0,4).map(i=>r.D.rivers[i].n).join(", ")}${R.притоки.length>4?" и другие":""}.`:"";
  const ниже=R.притоки.map(i=>r.D.rivers[i]).filter(t=>t.устье.at>r.k).sort((a,b)=>a.устье.at-b.устье.at)[0];
  const разлив=this.flooding(R)?" Сейчас разлив: вода вышла из берегов.":` Разлив — ${this.floodWhen(R)}.`;
  const пор=R.пороги.filter(k=>k>r.k).length;
  return `${r.в?"Вы у реки":"Рядом река"} ${R.n}${R.устье.вид==="river"?"":""}: ${ист}, течёт на ${this.dirWord(r.dx,r.dy)} и впадает ${уст}. До устья ${this.dist(r.доУстья)}, до истока ${this.dist(r.доИстока)}.${пр}${ниже?` Ниже по течению впадает ${ниже.n}.`:""}${пор?` Ниже — ${пор} ${plural(пор,"порог","порога","порогов")} или водопад: на плоту не пройти.`:""}${разлив}`;},
 floodWhen(R){const [a,b]=R.разлив;const m=d=>["зимой","зимой","весной","весной","весной","летом","летом","летом","осенью","осенью","осенью","зимой"][Math.floor((((d%360)+360)%360)/30)];return m(a)===m(b)?m(a):`${m(a)}`;},
 lakeText(x,y){x=x==null?G.x:x;y=y==null?G.y:y;const lk=inNewLands(x,y)?MatHydro.lakeNear(x,y):null;
  if(!lk||lk.d>lk.l.r*1.6){const b=safeFn(()=>biomeAt(x,y),null);if(b&&(b.id==="lake"||b.id==="lakeland"))return "Озеро прежних земель: вода стоит в низине, рыба берёт у камыша. Пополнить воду можно прямо здесь.";return "Озера рядом нет.";}
  const l=lk.l,D=MatHydro._c[l.мат],вых=l.выход!=null&&D?D.rivers[l.выход]:null;
  return `Озеро ${l.n}: шириной около ${this.dist(l.r*2)}, глубина до ${l.глуб} саженей. ${l.входы.length?`${l.входы.length===1?"Впадает одна река":`Впадают ${l.входы.length} ${plural(l.входы.length,"река","реки","рек")}`}. `:""}${вых?`Вытекает река ${вых.n}. `:"Стока нет: вода уходит только паром. "}Рыба: ${l.рыба.join(", ")||"мелочь"}. Озеро смягчает погоду на берегах и даёт им влагу; вода здесь пресная.`;},
 /* Сплав и ход вдоль реки: вниз — быстро, вверх — медленно; пороги и водопады останавливают. */
 alongRiver(dir){
  if(G.place||G.dark||G.ship||G.inCombat){narrate("Сейчас не до реки.");return false;}
  const r=this.riverHere(G.x,G.y,600);if(!r){narrate("Здесь нет реки. Встаньте у берега.");return false;}
  if(r.old){const v=Math.hypot(r.dx,r.dy)||1,s=dir>0?1:-1,n=dir>0?40:15;G.x=Math.round(G.x+r.dx/v*n*s);G.y=Math.round(G.y+r.dy/v*n*s);
   G.hour+=1;if(G.hour>=24){G.hour-=24;G.day++;}this.play("wild_river");narrate(`${dir>0?"Вниз":"Вверх"} по реке ${r.n}: ${n} шагов.`);refresh();return true;}
  const R=r.R,шаг=dir>0?2500:900;let k=r.k,t=r.t,остаток=шаг,стоп="";
  const P=R.pts;let x=G.x,y=G.y;
  if(dir>0){for(;k+1<P.length&&остаток>0;){if(R.пороги.indexOf(k)>=0&&k>r.k){стоп=" Впереди пороги и водопад: дальше — волоком по берегу.";break;}
    const a=P[k],b=P[k+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,left=L*(1-t);if(left>остаток){t+=остаток/L;x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t;остаток=0;break;}
    остаток-=left;k++;t=0;x=b[0];y=b[1];}
   if(k+1>=P.length)стоп=` Река кончилась: устье ${R.устье.вид==="sea"?"— впереди море":R.устье.вид==="lake"?"— впереди озеро":"— здесь она впадает в другую реку"}.`;}
  else{for(;k>=0&&остаток>0;){if(R.пороги.indexOf(k)>=0&&k<r.k){стоп=" Выше — пороги: против течения не подняться.";break;}
    const a=P[k],b=P[k+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,left=L*t;if(left>остаток){t-=остаток/L;x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t;остаток=0;break;}
    остаток-=left;k--;t=1;x=a[0];y=a[1];}
   if(k<0)стоп=" Вы у истока: дальше реки нет.";}
  G.x=Math.round(x);G.y=Math.round(y);const часы=dir>0?3:4;Clock&&Clock.advance?Clock.advance(часы):(G.hour+=часы);
  this.play(dir>0?"ad_river_med":"ad_river_fast",{gain:0.55});safeFn(()=>contentCache.clear());
  const s=this.st();if(!s.rivers[R.мат+":"+R.id]){s.rivers[R.мат+":"+R.id]=this.day();this.chron(`впервые прошли по реке ${R.n} (${MAT_BY_ID[R.мат].n})`);}
  narrate(`${dir>0?"Плот идёт вниз":"Вы поднимаетесь вверх"} по реке ${R.n}: ${this.dist(шаг-остаток)} за ${часы} ${plural(часы,"час","часа","часов")}.${стоп}`);
  refresh();saveGame(true);return true;},
 /* ── ОСТРОВА И МОРЕ ── */
 isleNear(x,y){let best=null;for(const a of MAT_ISLES){const d=Math.hypot(x-a.cx,y-a.cy);if(!best||d<best.d)best={a,d};}return best;},
 seaTypeAt(x,y){if(!inNewLands(x,y))return null;const o=matOceanAt(x,y);
  return {id:"mt_"+o.id,n:o.n,род:o.род,о:o.о,шторм:o.шторм,урон:o.урон,звук:o.звук};},
 pir(id){const s=this.st();const p=MAT_PIRATE_BY_ID[id];if(!s.pir[id])s.pir[id]={сила:p.сила,разорена:0,договор:0};return s.pir[id];},
 mon(id){const s=this.st();if(!s.mon[id])s.mon[id]={убит:0};return s.mon[id];},
 pirateNear(x,y){for(const p of MAT_PIRATES){const a=MAT_ISLE_BY_ID[p.база];const d=Math.hypot(x-a.cx,y-a.cy);if(d<a.r*2.5){const st=this.pir(p.id);if(!st.разорена)return {p,st,d};}}return null;},
 monsterNear(x,y){for(const m of MAT_MONSTERS){const c=this.monPos(m);const d=Math.hypot(x-c.x,y-c.y);if(d<m.r){const st=this.mon(m.id);if(!st.убит)return {m,st,d};}}return null;},
 monPos(m){const a=m.логово?MAT_ISLE_BY_ID[m.логово]:{cx:m.cx,cy:m.cy};const s=matSeason(a.cy,this.day()).s;return {x:Math.round(a.cx+Math.cos(this.day()/45)*m.r*0.4*s),y:Math.round(a.cy+Math.sin(this.day()/45)*m.r*0.4)};},
 /* ── СТАДА ── где сегодня: между летними и зимними угодьями по сезону. */
 herdPos(h,day){const s=matSeason(h.лето[1],day==null?this.day():day).s,k=(s+1)/2;
  const w=hashName(Math.floor((day==null?this.day():day)/3),h.лето[0]%9973,9891)-0.5;
  return {x:Math.round(h.зима[0]+(h.лето[0]-h.зима[0])*k+w*h.r),y:Math.round(h.зима[1]+(h.лето[1]-h.зима[1])*k-w*h.r)};},
 herdPower(h){const s=this.st();const v=s.herd[h.id];if(!v)return h.сила;
  /* стадо отрастает: по единице в день */return Math.min(h.сила,Math.max(0,Number(v.сила)+(this.day()-(Number(v.день)||this.day()))));},
 herdsNear(x,y,R){const out=[];for(const h of MAT_HERDS){const p=this.herdPos(h);const d=Math.hypot(x-p.x,y-p.y);if(d<(R||h.r*3))out.push({h,p,d,сила:this.herdPower(h)});}return out.sort((a,b)=>a.d-b.d);},
 hunt(){const n=this.herdsNear(G.x,G.y)[0];if(!n||n.d>n.h.r){narrate("Стада рядом нет. Стада ходят по сезонам: летом и зимой — в разных угодьях.");return false;}
  if(n.сила<10){narrate(`${n.h.кто[0].toUpperCase()+n.h.кто.slice(1)} поредело: охотники выбили почти всё. Дайте ему отрасти.`);return false;}
  const s=this.st();s.herd[n.h.id]={сила:n.сила-6,день:this.day()};
  if(!G.inv)G.inv={};G.inv[n.h.добыча]=(Number(G.inv[n.h.добыча])||0)+2;this.play(n.h.звук,{gain:0.6});
  safeFn(()=>deed("hunt"));narrate(`Охота у стада: ${n.h.добыча} ×2. ${n.h.о}. Стадо убывает, если бить его часто.`);refresh();return true;},
 /* ── ПЕРЕМЕНЫ ЗЕМЛИ ── список в сохранении; биом смотрит его первым. */
 geoAdd(вид,x,y,o){const K=MAT_GEO_KINDS[вид];if(!K||!inNewLands(x,y))return null;const s=this.st();
  const r=Math.round((o&&o.r)||K.r[0]+hashName(x,y,9901)*(K.r[1]-K.r[0]));
  const g={id:++s.geoN,вид,x:Math.round(x),y:Math.round(y),r,день:this.day(),dx:Math.round(o&&o.dx!=null?o.dx:(hashName(x,y,9902)-0.5)*r),dy:Math.round(o&&o.dy!=null?o.dy:(hashName(x,y,9903)-0.5)*r)};
  s.geo.push(g);if(s.geo.length>120)s.geo.splice(0,s.geo.length-120);
  this.clearCaches();
  const где=inNewLands(x,y)?(this.contAt(x,y)||{n:"море"}).n:"прежние земли";
  this.chron(`${K.n} — ${где}, ${Math.round(x)} на ${Math.round(y)}: ${K.о}.`);
  safeFn(()=>rumorSeed("земля",`${K.n}: ${K.о}`,x,y,true));
  if(Math.hypot((G.x||0)-x,(G.y||0)-y)<r*6)this.play(K.звук,{gain:0.8,maxSec:8});
  return g;},
 clearCaches(){safeFn(()=>climCache.clear());safeFn(()=>biomeCache.clear());safeFn(()=>matClimCache.clear());safeFn(()=>contentCache.clear());this._rc.clear();},
 geoAt(x,y){const s=G.mat&&Array.isArray(G.mat.geo)?G.mat.geo:null;if(!s||!s.length)return null;
  for(let i=s.length-1;i>=0;i--){const g=s[i];if(Math.abs(x-g.x)>g.r*1.6||Math.abs(y-g.y)>g.r*1.6)continue;
   const K=MAT_GEO_KINDS[g.вид];if(K&&K.сроку&&this.day()-g.день>K.сроку)continue;
   const d=Math.hypot(x-g.x,y-g.y);
   if(g.вид==="землетрясение"){const vx=g.dx||1,vy=g.dy||0,L=Math.hypot(vx,vy)||1;const pd=Math.abs(((x-g.x)*vy-(y-g.y)*vx)/L);if(d<g.r&&pd<Math.max(40,g.r*0.02))return "chasm";continue;}
   if(g.вид==="механизм"){const vx=g.dx||1,vy=g.dy||0,L=Math.hypot(vx,vy)||1;const t=((x-g.x)*vx+(y-g.y)*vy)/(L*L);const pd=Math.abs(((x-g.x)*vy-(y-g.y)*vx)/L);if(t>-1&&t<1&&pd<120)return "shore";continue;}
   if(d>g.r)continue;
   if(g.вид==="обвал")return d<g.r*0.6?"lake":"lakeland";
   if(g.вид==="русло")return d<g.r*0.5?"dry_riverbed":null;
   if(g.вид==="извержение")return d<g.r*0.12?"volcano":"ashland";
   if(g.вид==="катастрофа")return "magic_waste";
   if(g.вид==="война")return "scorched_land";}
  return null;},
 /* Новое русло реки после смены: старое обсохло, вода идёт смещённой полосой. */
 geoRiverShift(x,y){const s=G.mat&&G.mat.geo;if(!s||!s.length)return null;
  for(const g of s){if(g.вид!=="русло")continue;const d=Math.hypot(x-g.x,y-g.y);if(d>g.r)continue;
   const b=safeFn(()=>this.baseBiomeNoGeo(x-g.dx,y-g.dy),null);if(b==="river")return "river";}
  return null;},
 baseBiomeNoGeo(x,y){return inNewLands(x,y)?matBiomeId(x,y):((typeof biomeAtOld==="function"?biomeAtOld(x,y):biomeAt(x,y))||{}).id;},
 /* ── ДЕНЬ МАТЕРИКОВ ── перемены земли случаются сами, редко; стада отрастают. */
 tick(){const s=this.st(),d=this.day();if(s.day===d)return;const пропуск=Math.min(5,d-(Number(s.day)||d));s.day=d;
  for(let k=0;k<Math.max(1,пропуск);k++){const dd=d-k,r=hashName(dd,77,9911);
   if(r<0.035){const c=MATERIKI[Math.floor(hashName(dd,78,9912)*MATERIKI.length)];
    const вид=["обвал","русло","извержение","землетрясение","катастрофа","война"][Math.floor(hashName(dd,79,9913)*6)];
    if(вид==="извержение"&&!c.вулканы.length)continue;
    let x=Math.round(c.cx+(hashName(dd,80,9914)-0.5)*c.rx),y=Math.round(c.cy+(hashName(dd,81,9915)-0.5)*c.ry);
    if(вид==="извержение"&&c.вулканы.length){const v=c.вулканы[0].pts,p=v[Math.floor(hashName(dd,82,9916)*v.length)];x=p[0];y=p[1];}
    if(вид==="русло"||вид==="обвал"){const D=MatHydro.get(c);const R=D.rivers[Math.floor(hashName(dd,83,9917)*D.rivers.length)];if(R){const p=R.pts[Math.floor(R.pts.length/2)];x=p[0];y=p[1];}}
    this.geoAdd(вид,x,y);}
   /* война держав материков выжигает землю между престолами */
   const w=safeFn(()=>warsAt(dd),[])||[];
   const wm=w.filter(q=>EMPIRES[q.a]&&EMPIRES[q.b]&&EMPIRES[q.a].материк&&EMPIRES[q.b].материк);
   if(wm.length&&hashName(dd,91,9921)<0.08){const q=wm[Math.floor(hashName(dd,92,9922)*wm.length)],A=EMPIRES[q.a].cap,B=EMPIRES[q.b].cap;
    const x=Math.round((A.x+B.x)/2+(hashName(dd,93,9923)-0.5)*60000),y=Math.round((A.y+B.y)/2+(hashName(dd,94,9924)-0.5)*60000);
    if(inNewLands(x,y)&&this.contAt(x,y))this.geoAdd("война",x,y);}}},
 /* ── ДАЛЬНИЕ РЕЙСЫ ── гавани прежнего мира и материков; рейс — переходами по дню. */
 _harb:null,
 harbors(){if(this._harb)return this._harb;const out=[];
  const coastNear=(tx,ty,R)=>{for(let r=0;r<=R;r+=(R>50000?1500:500))for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=Math.round(tx+Math.cos(a)*r),y=Math.round(ty+Math.sin(a)*r);
    const b=safeFn(()=>biomeAt(x,y),null);if(b&&b.база==="coast"&&!["inner_sea","archipelago","reef","drowned_city"].includes(b.id))return {x,y};}return null;};
  for(const [n,tx,ty] of [["Восточная Гавань Перекроя",996000,450000],["Южная Гавань Перекроя",450000,996000],["Угловая Гавань",975000,975000]]){const p=coastNear(tx,ty,30000);if(p)out.push({id:n,n,x:p.x,y:p.y,старый:true});}
  for(const c of MATERIKI){const ang=Math.atan2(500000-c.cy,500000-c.cx);const tx=c.cx+Math.cos(ang)*c.rx*0.95,ty=c.cy+Math.sin(ang)*c.ry*0.95;const p=coastNear(tx,ty,420000);if(p)out.push({id:c.id,n:MAT_HARBOR_NAMES[c.id],x:p.x,y:p.y,мат:c.id});}
  for(const a of MAT_ISLES)if(a.порт){const s=matIslands(a)[0];const p=coastNear(s.x,s.y,s.r+6000);if(p)out.push({id:"i_"+a.id,n:`Гавань ${a.n.replace(/ острова| россыпь| шхеры| венец/g,"")}`.replace("Гавань Острова Пряностей","Гавань Пряностей"),x:p.x,y:p.y,остров:a.id});}
  return this._harb=out;},
 harborAt(x,y,R){for(const h of this.harbors())if(Math.abs(h.x-x)<=(R||3)&&Math.abs(h.y-y)<=(R||3))return h;return null;},
 voyages(h){const all=this.harbors();return all.filter(o=>o!==h&&(h.старый?!o.старый:true)).map(o=>{const d=Math.hypot(o.x-h.x,o.y-h.y);
  const legs=Math.max(3,Math.min(18,Math.round(d/250000)));return {to:o,d,legs,fare:Math.round(60+d/9000),припасы:legs};}).sort((a,b)=>a.d-b.d).slice(0,8);},
 sail(i){const h=this.harborAt(G.x,G.y,6);if(!h){narrate("Дальние рейсы уходят из больших гаваней.");return false;}
  const v=this.voyages(h)[Number(i)];if(!v){narrate("Такого рейса нет.");return false;}
  if((Number(G.gold)||0)<v.fare){narrate(`Место на корабле стоит ${v.fare} золота, у вас ${G.gold}.`);return false;}
  G.gold-=v.fare;
  G.ship={name:"Дальний корабль «"+["Кит","Альбатрос","Северянка","Странник","Рассвет","Буревестник"][Math.floor(hashName(h.x,v.to.x,9921)*6)]+"»",kind:"far",speed:1,hold:40,tox:v.to.x,toy:v.to.y,toName:v.to.n,
   legs:v.legs,left:v.legs,leg:0,war:false,storm:false,fare:v.fare,дальний:true,припасы:v.припасы+1,fromx:G.x,fromy:G.y};
  const m=document.getElementById("modal-mater");if(m&&!m.hidden)safeFn(()=>closeModal(m));
  this.play("ship_depart",{gain:0.8,maxSec:8});
  narrate(`Дальний рейс: курс на ${v.to.n}. Дней пути — ${v.legs}; припасы на борту — на ${v.legs+1} ${plural(v.legs+1,"день","дня","дней")}. Свайп — следующий день плавания.`);
  journal(`Дальний рейс в ${v.to.n}.`);refresh();saveGame(true);return true;},
 /* Переход дальнего рейса: день моря, припасы, пираты, чудовища, острова по пути. */
 farLeg(s){
  const p=safeFn(()=>shipPos(),{x:G.x,y:G.y});let t="";
  s.припасы=Math.max(0,(Number(s.припасы)||0)-1);
  if(s.припасы<=0){G.hp=Math.max(1,(Number(G.hp)||1)-6);t+=" Припасы кончились: команда на половинном пайке, вы слабеете (−6 здоровья).";}
  const pir=this.pirateNear(p.x,p.y);
  if(pir&&hashName(s.leg,this.day(),9931)<Math.min(0.7,pir.st.сила/120)){
   if(pir.st.договор>this.day())t+=` На горизонте паруса: ${pir.p.n}. Узнали ваш флаг — договор в силе, проходят мимо.`;
   else{s.enc={вид:"pir",x:pir};return t+` На горизонте чёрные паруса: ${pir.p.n} идут наперерез!`;}}
  const mon=this.monsterNear(p.x,p.y);
  if(mon&&hashName(s.leg+7,this.day(),9932)<0.35){s.enc={вид:"mon",x:mon};return t+" Вода под килем вздувается горбом…";}
  const isl=this.isleNear(p.x,p.y);
  if(isl&&isl.d<isl.a.r*1.5){const st=this.st();if(!st.isles[isl.a.id]){st.isles[isl.a.id]=this.day();this.chron(`с борта виден архипелаг «${isl.a.n}»`);}
   t+=` Справа по борту — ${isl.a.n}: ${isl.a.о}. Живут здесь ${isl.a.виды.join(", ")}.${isl.a.руины?` На берегу — ${isl.a.руины}.`:""}`;
   this.play(isl.a.звук,{gain:0.5});}
  const herd=this.herdsNear(p.x,p.y).find(n=>n.h.море&&n.d<n.h.r*2);if(herd)t+=` ${herd.h.о[0].toUpperCase()+herd.h.о.slice(1)}.`;
  return t;},
 pirateBattle(pir){const P=pir.p,st=pir.st;const lvl=Math.max(8,(Number(G.level)||1)+2);
  this.play("cry_pirate",{gain:0.8});
  narrate(`Пираты! ${P.n} — ${P.о}. Капитан ${P.капитан} требует дань: ${P.дань} золота. Отказ — бой.`,{interrupt:true});
  this._pirate=P.id;
  safeFn(()=>startCombat({x:G.x,y:G.y,monster:{n:`${P.капитан}, ${P.n}`,name:`${P.капитан}`,lvl,hp:Math.round(60+lvl*12+st.сила),dmg:6+lvl*2,xp:60+lvl*15,gold:P.дань,пират:P.id}}));},
 monsterBattle(mon){const M=mon.m;this.play(M.звук,{gain:0.9,maxSec:8});
  narrate(`Из воды поднимается ${M.n}: ${M.о}!`,{interrupt:true});this._monster=M.id;
  safeFn(()=>startCombat({x:G.x,y:G.y,monster:{n:M.n,name:M.n,lvl:M.ур,hp:M.hp,dmg:M.dmg,xp:M.ур*40,gold:M.ур*12,чудище:M.id}}));},
 /* Итог боя на море: пиратам — урон силе (база падёт, когда сила кончится), чудищу — смерть. */
 afterWin(m){if(!m)return;
  if(m.пират){const st=this.pir(m.пират),P=MAT_PIRATE_BY_ID[m.пират];st.сила=Math.max(0,st.сила-25);
   if(st.сила<=0&&!st.разорена){st.разорена=this.day();this.chron(`${P.n} разбиты: база на островах «${MAT_ISLE_BY_ID[P.база].n}» пала`);safeFn(()=>rumorSeed("пираты",`${P.n} разбиты`,G.x,G.y,true));}
   else this.say(`${P.n} отступают. Сила братства: ${st.сила}.`);}
  if(m.чудище){const st=this.mon(m.чудище),M=MAT_MONSTER_BY_ID[m.чудище];st.убит=this.day();
   if(!G.inv)G.inv={};const тр=`трофей: ${M.n}`;G.inv[тр]=(Number(G.inv[тр])||0)+1;this.chron(`${M.n} повержен`);safeFn(()=>rumorSeed("чудище",`${M.n} повержен`,G.x,G.y,true));}},
 payTribute(){const id=this._pirate;if(!id)return false;const P=MAT_PIRATE_BY_ID[id];if((Number(G.gold)||0)<P.дань){narrate("Золота на дань не хватает.");return false;}
  G.gold-=P.дань;this.pir(id).договор=this.day()+30;narrate(`Дань уплачена: ${P.дань} золота. Месяц ${P.n} не тронут ваш корабль.`);this._pirate=null;return true;},
 /* ── У ВОДЫ ── озёра и реки собирают людей: у берега деревень втрое больше. */
 nearWater(x,y){if(!inNewLands(x,y))return null;
  const b=safeFn(()=>matBiomeId(x,y),null);if(!b||["lake","river","stream","waterfall","river_mouth","inner_sea","archipelago","reef","shore","ice_shelf"].indexOf(b)>=0)return null;
  const lk=MatHydro.lakeNear(x,y);if(lk&&lk.d<lk.l.r*1.45)return {вид:"озеро",n:lk.l.n};
  const nr=MatHydro.near(x,y);if(nr&&nr.hit&&nr.hit.R&&nr.hit.e>0&&nr.hit.e<320)return {вид:"река",n:nr.hit.R.n};
  return null;},
 waterVillage(x,y){if(isRoad(x,y))return null;const r3=H(x,y,3);if(r3<0.0035||r3>=0.0105)return null;const w=this.nearWater(x,y);if(!w)return null;
  const nm=VILL_A[Math.floor(H(x,y,13)*VILL_A.length)]+VILL_B[Math.floor(H(x,y,14)*VILL_B.length)];
  return {name:w.вид==="озеро"?`Рыбацкая деревня ${nm} на озере ${w.n}`:`Деревня ${nm} на реке ${w.n}`,w};},
 /* ── ТОВАР ОСТРОВОВ ── дёшев у себя, дорог за морем: чем дальше гавань от острова, тем дороже. */
 GOODS:{"птичий пух":12,"пряности":30,"китовый ус":25,"гагачий пух":18,"обсидиан":20,"жемчуг":60,"древняя бронза":45,"кораллы":22,"китовый жир":16,"звёздное стекло":70,"черепаховый панцирь":35,"моржовый клык":28},
 goodOrigin(t){return MAT_ISLES.find(a=>a.товар===t)||null;},
 goodPrice(t,x,y){const base=this.GOODS[t];if(!base)return 0;const a=this.goodOrigin(t);const d=a?Math.hypot(x-a.cx,y-a.cy):0;return Math.round(base*(1+d/6000000));},
 buyGood(){const h=this.harborAt(G.x,G.y,6);if(!h||!h.остров){narrate("Товар островов покупают в их гаванях.");return false;}
  const a=MAT_ISLE_BY_ID[h.остров],t=a.товар,цена=Math.round(this.GOODS[t]*0.8)*3;
  if((Number(G.gold)||0)<цена){narrate(`Три меры товара «${t}» стоят ${цена} золота, у вас ${G.gold}.`);return false;}
  G.gold-=цена;if(!G.inv)G.inv={};G.inv[t]=(Number(G.inv[t])||0)+3;this.play("ad_trade",{gain:0.6});
  narrate(`Куплено: ${t} ×3 за ${цена} золота. За морем, в дальних гаванях, его берут дороже.`);this.home();return true;},
 sellGood(t){const h=this.harborAt(G.x,G.y,6);if(!h){narrate("Товар островов продают в больших гаванях.");return false;}
  const n=Number(G.inv&&G.inv[t])||0;if(!n||!this.GOODS[t]){narrate("Такого товара у вас нет.");return false;}
  const ц=this.goodPrice(t,h.x,h.y);G.inv[t]=n-1;if(G.inv[t]<=0)delete G.inv[t];G.gold=(Number(G.gold)||0)+ц;this.play("coin",{gain:0.5});
  narrate(`Продано: ${t} за ${ц} золота.`);this.home();return true;},
 /* ── РУИНЫ ОСТРОВОВ И ДРЕВНИЕ МЕХАНИЗМЫ ── руины — на главном острове архипелага;
   в Обсерватории Безмолвных и в Затонувшем Городе стоит механизм: он поднимает со дна перешеек
   к ближнему материку. */
 ruinAt(x,y){for(const a of MAT_ISLES){if(!a.руины)continue;const s=matIslands(a)[0];if(s.x===x&&s.y===y)return a;}return null;},
 ruinNear(x,y,R){for(const a of MAT_ISLES){if(!a.руины)continue;const s=matIslands(a)[0];if(Math.abs(s.x-x)<=(R||3)&&Math.abs(s.y-y)<=(R||3))return {a,s};}return null;},
 mechanism(){const n=this.ruinNear(G.x,G.y,3);if(!n||["bezmolv","zatonuv"].indexOf(n.a.id)<0){narrate("Здесь нет древнего механизма.");return false;}
  const st=this.st();if(st.isles["mech_"+n.a.id]){narrate("Механизм уже сделал своё: перешеек поднят.");return false;}
  let best=null;for(const c of MATERIKI){const d=Math.hypot(c.cx-n.s.x,c.cy-n.s.y);if(!best||d<best.d)best={c,d};}
  const vx=best.c.cx-n.s.x,vy=best.c.cy-n.s.y,L=Math.hypot(vx,vy)||1,len=Math.min(60000,L*0.25);
  st.isles["mech_"+n.a.id]=this.day();
  this.geoAdd("механизм",Math.round(n.s.x+vx/L*len),Math.round(n.s.y+vy/L*len),{r:Math.round(len),dx:Math.round(vx/L*len),dy:Math.round(vy/L*len)});
  this.play("gr_mech",{gain:0.8,maxSec:8});narrate(`Механизм ${n.a.руины} пробуждается: скрежет, гул, и из воды к ${best.c.дат} поднимается перешеек — по мели теперь можно пройти пешком на ${this.dirWord(vx,vy)}.`);
  return true;},
 /* ── СЛОВА О МЕСТЕ ── */
 hereText(){
  if(G.dark||G.place)return "Вы не на просторах мира.";
  if(!inNewLands(G.x,G.y))return `Прежние земли Грани. За Внешним морем, за полосой Перекроя, на миллион клеток от угла — океаны и семь материков. Туда ходят дальние рейсы из Восточной, Южной и Угловой гаваней.`;
  const c=this.contAt(G.x,G.y),cl=matClimateAt(G.x,G.y),сз=matSeason(G.y,this.day());
  const lat=`${cl.lat<0?"Северная":"Южная"} широта ${Math.abs(Math.round(cl.lat))}°`;
  const руины=(()=>{const i=this.isleNear(G.x,G.y);if(!i||i.d>i.a.r*2||!i.a.руины)return "";const s=matIslands(i.a)[0];const d=Math.max(Math.abs(s.x-G.x),Math.abs(s.y-G.y));
   return d===0?` Здесь — ${i.a.руины}.`:` На главном острове архипелага «${i.a.n}» — ${i.a.руины}: ${this.dist(d)} на ${this.dirWord(s.x-G.x,s.y-G.y)}.`;})();
  if(!c){const o=matOceanAt(G.x,G.y);const i=this.isleNear(G.x,G.y);return `${o.n}: ${o.о}. ${lat}, ${сз.имя}.${i&&i.d<i.a.r*2?` Рядом — ${i.a.n}.`:""}${руины}`;}
  const r=this.regionAt(G.x,G.y),e=r.realm;
  return `${c.n}, край «${r.n}»${e?`, держава — ${e.name}`:""}. ${lat}, ${сз.имя}; климат — ${r.климат}.${r.флора?` Растёт: ${r.флора.join(", ")}; водятся: ${r.фауна.join(", ")}.`:""}${r.история?` ${r.история}`:""} ${c.о}`;},
 seen(){if(G.place||G.dark||!inNewLands(G.x,G.y))return;const c=this.contAt(G.x,G.y);if(!c)return;const s=this.st();
  if(!s.seen[c.id]){s.seen[c.id]=this.day();this.chron(`впервые ступили на ${c.n}`);safeFn(()=>deed("regions"));safeFn(()=>rumorSeed("материк",`видел ${c.n}`,G.x,G.y,true));
   setTimeout(()=>this.say(`Вы впервые на материке: ${c.n}. ${c.о}`),900);}},
 /* ── ОКНО ── */
 home(){
  let m=document.getElementById("modal-mater");
  if(!m){m=document.createElement("div");m.id="modal-mater";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Материки и воды");
   m.innerHTML=`<div class="modal-box"><h2>Материки и воды</h2><div id="materBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  const s=this.st(),box=m.querySelector("#materBody");
  let h=`<p tabindex="0">${this.q(this.hereText())}</p>`;
  const r=this.riverHere(G.x,G.y,600);if(r)h+=`<p tabindex="0">${this.q(this.riverText(G.x,G.y))}</p>`+this.btn("down","Вниз по реке")+this.btn("up","Вверх по реке");
  const lt=this.lakeText();if(!/^Озера рядом нет/.test(lt))h+=`<p tabindex="0">${this.q(lt)}</p>`;
  const rn=this.ruinNear(G.x,G.y,3);if(rn&&["bezmolv","zatonuv"].indexOf(rn.a.id)>=0&&!s.isles["mech_"+rn.a.id])h+=this.btn("mech","Запустить древний механизм");
  const hn=this.herdsNear(G.x,G.y,400000);if(hn.length)h+=`<h3>Стада и ходы</h3>`+hn.slice(0,3).map(n=>`<p tabindex="0">${this.q(`${n.h.кто[0].toUpperCase()+n.h.кто.slice(1)} — ${this.dist(n.d)} на ${this.dirWord(n.p.x-G.x,n.p.y-G.y)}; сила ${n.сила} из ${n.h.сила}. ${n.h.о}.`)}</p>`).join("")+(hn[0].d<hn[0].h.r?this.btn("hunt","Охотиться у стада"):"");
  const hb=this.harborAt(G.x,G.y,6);if(hb){h+=`<h3>Дальние рейсы — ${this.q(hb.n)}</h3>`;this.voyages(hb).forEach((v,i)=>{h+=this.btn("sail:"+i,`${v.to.n}: ${v.legs} ${plural(v.legs,"день","дня","дней")}, ${v.fare} золота`);});
   if(hb.остров){const a=MAT_ISLE_BY_ID[hb.остров];h+=this.btn("buy",`Купить ${a.товар} ×3 — ${Math.round(this.GOODS[a.товар]*0.8)*3} золота`);}
   for(const t of Object.keys(this.GOODS))if(Number(G.inv&&G.inv[t])>0)h+=this.btn("sell:"+t,`Продать ${t} — ${this.goodPrice(t,hb.x,hb.y)} золота (у вас ${G.inv[t]})`);}
  h+=`<h3>Материки</h3>`+MATERIKI.map(c=>`<p tabindex="0">${this.q(`${c.n}${s.seen[c.id]?" (вы там были)":""}: ${c.о}`)}</p>`).join("");
  h+=`<h3>Архипелаги</h3>`+MAT_ISLES.map(a=>{const p=MAT_PIRATES.find(x=>x.база===a.id),M=MAT_MONSTERS.find(x=>x.логово===a.id);
   return `<p tabindex="0">${this.q(`${a.n}: ${a.о}. Живут: ${a.виды.join(", ")}. Товар — ${a.товар}.${a.порт?" Есть гавань.":""}${p?` База пиратов: ${p.n}${this.pir(p.id).разорена?" (разбиты)":""}.`:""}${M?` Логово: ${M.n}${this.mon(M.id).убит?" (повержен)":""}.`:""}${a.руины?` Руины: ${a.руины}.`:""}`)}</p>`;}).join("");
  const g=s.geo.slice(-8).reverse();h+=`<h3>Перемены земли</h3>`+(g.length?g.map(x=>`<p tabindex="0">${this.q(`День ${x.день}: ${MAT_GEO_KINDS[x.вид].n} — ${MAT_GEO_KINDS[x.вид].о}.`)}</p>`).join(""):`<p tabindex="0">Пока земля спокойна.</p>`);
  if(s.chron.length)h+=`<h3>Летопись материков</h3>`+s.chron.slice(0,10).map(t=>`<p tabindex="0">${this.q(t)}</p>`).join("");
  box.innerHTML=h;openModal("modal-mater");return true;},
 cmd(a){const [k,arg]=String(a||"").split(":");
  if(k==="down")return this.alongRiver(1);if(k==="up")return this.alongRiver(-1);
  if(k==="hunt")return this.hunt();if(k==="sail")return this.sail(arg);if(k==="buy")return this.buyGood();if(k==="sell")return this.sellGood(arg);if(k==="mech")return this.mechanism();
  if(k==="river"){narrate(this.riverText(G.x,G.y));return true;}if(k==="lake"){narrate(this.lakeText());return true;}
  return this.home();}};

/* ════════════════════════════════════════════════════════════════════════
   НИЖНИЕ ПУТИ — ТОЖЕ ЯРУСЫ ГЛУБИ (15.5)
   Жалоба игрока: «на шестом ярусе нигде ни загадок, ни древних механизмов —
   только подъёмник; в загруженном сохранении на двадцать четвёртом ярусе
   тайники, лазы и завалы есть, а загадок и механизмов нет». Глубь раздавала
   механизмы, загадки, замки и тайные ходы только своим ярусам 1…N (у малых
   подземелий N — от двух до пяти); ниже шли Нижние пути без них. Теперь
   ярусы ниже N достраиваются тем же генератором и по тем же правилам — по
   одному, когда герой до них доходит: своя порода, механизмы, тайные ходы,
   загадка на каждом ярусе, иногда замок. Прежние ярусы 1…N не меняются
   (найденное и решённое в старых сохранениях остаётся на месте), а тем из
   них, где загадки не было, она добавляется. Всё выводится из координат
   входа — у старого сохранения то же, что у нового. Твари Нижних путей
   остаются прежними (порода яруса их не перекраивает), ловушки — вперемешку:
   половина своей породы, половина прежних (и ловушки Сводов).
   ════════════════════════════════════════════════════════════════════════ */
const Глубь155={
 PZ:["bells","levers","weights","runes","heat","circuit","time","echo","riddle","hollow","water","hum"],
 R(s,i,k){return Deep.rng(hashName((Number(s.bx)||0)*313+i*7+(k||0)*101,(Number(s.by)||0)*911+i*13+(k||0)*57,15501)*4294967296);},
 тип(s,i,R){const b=DEEP_BIOME_BY_ID[s.tiers[i].b];if(R()<0.3)return "riddle";return b&&b.м>=3&&R()<0.4?Deep.pick(["time","echo","runes"],R):Deep.pick(this.PZ,R);},
 /* ярусам 1…N, где загадки не было, — по загадке (новый номер: прежние не сдвигаются) */
 дополнить(s){for(let i=1;i<=s.N;i++)if(!s.puzzles.some(p=>p.tier===i)){const R=this.R(s,i,1);s.puzzles.push(Deep.genPuzzle("px"+i,this.тип(s,i,R),i,R));}},
 до(s){return (s&&s.нижн&&s.нижн.до)||((s&&s.N)||0);},
 /* достроить ярусы до d */
 ext(s,d){d=Math.min(MAX_DEPTH,Number(d)||0);if(!s||!(d>s.N))return;
  if(!s.нижн)Object.defineProperty(s,"нижн",{value:{до:s.N},writable:true,enumerable:false});
  if(d<=s.нижн.до)return;
  for(let i=s.нижн.до+1;i<=d;i++)safeFn(()=>this.ярус(s,i));
  s.нижн.до=d;safeFn(()=>Загадки150.доделать(s));
  const x=safeFn(()=>Deep.all()[s.key],null);if(x)this.эко(s,x);},
 ярус(s,i){if(s.tiers[i])return;const R=this.R(s,i,0);const глуб=i-s.N;
  const m=Math.max(1,Math.min(4,1+Math.floor(глуб/6)+Math.floor((Number(s.cls&&s.cls.древность)||1)/2)));
  let cand=DEEP_BIOMES.filter(b=>b.м===m&&b.id!=="city");if(!cand.length)cand=DEEP_BIOMES.filter(b=>Math.abs(b.м-m)<=1&&b.id!=="city");if(!cand.length)cand=DEEP_BIOMES.filter(b=>b.id!=="city");
  /* полосы по пять ярусов одной породы, как у самого подземелья */
  const полоса=Math.floor((глуб-1)/5);const bio=Deep.pick(cand,this.R(s,s.N+1+полоса*5,3));
  const T={i,b:bio.id,band:1000+полоса,feat:Deep.pick(DEEP_FEATURES,R),hist:s.fill(bio.история),part:"",нижн:true};
  T.t=Math.round(bio.т[0]+(bio.т[1]-bio.т[0])*R());s.tiers[i]=T;
  safeFn(()=>bio.ресурсы.forEach((r,k)=>{if(DEEP_PRICE[r]==null&&!(typeof RES_BASE!=="undefined"&&RES_BASE[r]))DEEP_PRICE[r]=14+bio.м*12+k*9;}));
  /* механизмы: один-два (без энергосети подземелья — как у подземелий без неё) */
  const STS=["ok","damaged","off","blocked","repair","cursed","combo"];const n=R()<0.6?1:2;
  for(let k=0;k<n;k++){let kind=Deep.pick(bio.механизмы,R);
   if(["core","console","guard","turret","generator"].includes(kind))kind="lever";else if(kind==="lift")kind="bridge";
   if(!DEEP_MECH_KINDS[kind])kind="lever";
   s.mechs.push({id:`mx${i}_${k}`,kind,tier:i,st0:kind==="valve"?"open":Deep.pick(STS,R)});}
  /* тайные ходы: один-два */
  const ns=R()<0.55?1:2;for(let k=0;k<ns;k++){const kind=Deep.pick(DEEP_SECRET_KINDS,R);const cue=Deep.pick(Object.keys(DEEP_SECRET_CUES),R);
   let gives=Deep.pick(DEEP_SECRET_GIVES,R);const to=Math.min(MAX_DEPTH,i+2+Math.floor(R()*3));if(gives==="лаз вниз"&&to<=i)gives="тайник";
   s.secrets.push({id:`sx${i}_${k}`,kind:kind.id,n:kind.n,cue,tier:i,gives,to});}
  /* загадка — на каждом ярусе; замок — иногда */
  s.puzzles.push(Deep.genPuzzle("px"+i,this.тип(s,i,R),i,R));
  if(R()<0.45){const LK=Object.keys(DEEP_LOCK_KINDS);s.locks.push(Deep.genLock("lx"+i,Deep.pick(LK,R),i,s,R));}},
 /* экосистема новых ярусов — в состоянии подземелья (тем же правилом, что и свои ярусы) */
 эко(s,x){if(!x||!x.eco)return;for(let i=s.N+1;i<=this.до(s);i++)if(!x.eco[i]){const R=Deep.rng(hashName(s.bx*17+i,s.by*23+i,2468)*4294967296);
   x.eco[i]={f:+(0.5+R()*0.4).toFixed(2),h:+(0.3+R()*0.3).toFixed(2),p:+(0.2+R()*0.2).toFixed(2),a:+(0.04+R()*0.06).toFixed(2),w:R()<0.3?1:0,lowP:0,highA:0};}}};
/* при построении подземелья: ярусам без загадки — загадка */
safeFn(()=>{const sp0=Deep.spec.bind(Deep);Deep.spec=function(bx,by,stype){const s=sp0(bx,by,stype);
 if(s&&!s.г155){safeFn(()=>Глубь155.дополнить(s));safeFn(()=>Загадки150.доделать(s));safeFn(()=>Object.defineProperty(s,"г155",{value:true}));}
 return s;};});
/* Глубь включена и ниже своих ярусов — до самого дна */
safeFn(()=>{const o0=Deep.on.bind(Deep);Deep.on=function(){if(o0())return true;
 try{const p=G.place;if(!p||G.dark||p.тайник)return false;const d=Number(p.depth)||0;if(d<=0||d>MAX_DEPTH)return false;if(PLACE_KIND[p.stype]!=="dungeon")return false;
  const s=this.spec(p.bx,p.by,p.stype);if(!s||d<=s.N)return false;Глубь155.ext(s,d);return d<=Глубь155.до(s);}catch(_){return false;}};});
safeFn(()=>{const st0=Deep.st.bind(Deep);Deep.st=function(s){const x=st0(s);
 try{const sp=s||this.here();if(x&&sp&&Глубь155.до(sp)>sp.N)Глубь155.эко(sp,x);}catch(_){}return x;};});
/* строка яруса ниже своих: Нижние пути, но со своими механизмами и загадками */
safeFn(()=>{const t0=Deep.tierLine.bind(Deep);Deep.tierLine=function(d){const s=safeFn(()=>this.here(),null);
 if(!s||!(Number(d)>s.N)||!this.on())return t0(d);
 const x=this.st(s);const T=s.tiers[d];const b=T&&DEEP_BIOME_BY_ID[T.b];if(!b)return t0(d);const first=!x.seen[d];x.seen[d]=Number(G.day)||1;x.visits++;
 let t=`Ярус ${d}, Нижние пути под подземельем «${s.n}»: ${b.n.toLowerCase()}. ${first?this.cap(b.арх)+"; ":""}${T.t} градусов, ${b.влага}, ${b.свет}.`;
 if(first)t+=" И здесь свои механизмы, загадки и тайные ходы: окно яруса — в меню действий, «Ярус подземелья».";
 return t;};});
/* окно яруса ниже своих: заголовок — Нижние пути */
safeFn(()=>{const h0=Deep.home.bind(Deep);Deep.home=function(){const s=safeFn(()=>this.here(),null);const d=this.tierNo();
 if(!s||!(d>s.N)||!this.on())return h0();
 const l0=this.line;let первая=true;
 this.line=function(t){if(первая){первая=false;t=String(t).replace(/^Подземелье «(.+?)» — .*?, ярусов \d+\. Ярус (\d+):/,(m,n,dd)=>`Нижние пути под подземельем «${n}» (своих ярусов у него ${s.N}). Ярус ${dd}:`);}return l0.call(this,t);};
 try{return h0();}finally{this.line=l0;}};});
/* Нижние пути остаются собой: твари — прежние твари Нижних путей (порода яруса их не перекраивает и не усиливает),
   а ловушки — вперемешку: половина — ловушки породы яруса, половина — прежние (и ловушки Сводов). */
safeFn(()=>{const c0=Deep.onCombat.bind(Deep);Deep.onCombat=function(m,c){
 try{const s=this.here();if(s&&Number(G.place&&G.place.depth)>s.N)return;}catch(_){}return c0(m,c);};});
safeFn(()=>{const t0=Deep.trapPick.bind(Deep);Deep.trapPick=function(p,x,y){
 try{const s=this.here();if(s&&p&&Number(p.depth)>s.N&&hashName(p.bx+x*7,p.by+y*5,15541+Number(p.depth))<0.5)return null;}catch(_){}
 return t0(p,x,y);};});

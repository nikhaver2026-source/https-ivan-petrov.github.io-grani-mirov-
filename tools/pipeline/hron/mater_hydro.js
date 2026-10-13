/* ── ВОДЫ МАТЕРИКА ──
   При первом обращении материк кладёт на себя сетку высот (≈150 узлов по
   длинной стороне), заливает низины (из них выходят озёра, вода копится до
   края и переливается), проводит сток от каждого узла к морю и копит его.
   Где стока много — река: у неё исток (горы, родник, озеро), направление,
   притоки (у слияния главная та, у которой больше воды), устье (море,
   озеро или другая река), сезон разлива; у больших рек — дельта, на
   крутых участках — водопады. Где стока меньше — ручьи. */
const MatHydro={
 _c:{},
 rain(x,y){const al=Math.abs(matLat(y));return Math.max(0.15,0.55+0.30*Math.cos(al/90*Math.PI*3)*(al<75?1:0.4)+0.18*(matFbm(x,y,500000,9132,3)-0.5));},
 get(c){if(!this._c[c.id]){if(window.__matTrace)(window.__matStacks=window.__matStacks||[]).push(c.id+": "+String(new Error().stack).split("\n").slice(9,40).join(" | "));this._c[c.id]=this.build(c);}return this._c[c.id];},
 build(c){
  const N=128,W=c.bx1-c.bx0,Hh=c.by1-c.by0,step=Math.max(W,Hh)/N;
  const nx=Math.ceil(W/step)+1,ny=Math.ceil(Hh/step)+1,n=nx*ny;
  const h=new Float32Array(n),land=new Uint8Array(n),X=i=>c.bx0+(i%nx)*step,Y=i=>c.by0+Math.floor(i/nx)*step;
  let landN=0;
  for(let i=0;i<n;i++){const r=matHeight(X(i),Y(i));h[i]=r.h;if(r.c===c&&r.h>=0.30){land[i]=1;landN++;}}
  /* сгладить мелкие бугры (два прохода): вода видит долины, а не каждую кочку — иначе
     каждая ямка в шуме становилась озером, и реки не доходили до моря */
  /* Темнолесье — край тысячи озёр: ледник оставил ямы, их не сглаживаем */
  const озёрный=c.id==="temnoles";
  for(let it=0;it<(озёрный?1:2);it++){const h2=h.slice();for(let i=0;i<n;i++){if(!land[i])continue;const ix=i%nx,iy=Math.floor(i/nx);let sm=0,k=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=ix+dx,b=iy+dy;if(a<0||b<0||a>=nx||b>=ny)continue;const j=b*nx+a;if(!land[j])continue;sm+=h2[j];k++;}
   h[i]=Math.max(0.301,sm/k);}}
  /* заливка низин: от моря вглубь, по возрастанию высоты (двоичная куча) */
  const lvl=new Float32Array(n),down=new Int32Array(n).fill(-1),done=new Uint8Array(n),order=[];
  const hp=[],hv=[];
  const push=(p,i)=>{hp.push(p);hv.push(i);let k=hp.length-1;while(k>0){const q=(k-1)>>1;if(hp[q]<=hp[k])break;[hp[q],hp[k]]=[hp[k],hp[q]];[hv[q],hv[k]]=[hv[k],hv[q]];k=q;}};
  const pop=()=>{const p=hp[0],i=hv[0],lp=hp.pop(),li=hv.pop();if(hp.length){hp[0]=lp;hv[0]=li;let k=0;for(;;){const a=2*k+1,b=a+1;let m=k;if(a<hp.length&&hp[a]<hp[m])m=a;if(b<hp.length&&hp[b]<hp[m])m=b;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];[hv[m],hv[k]]=[hv[k],hv[m]];k=m;}}return [p,i];};
  const NB=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  for(let i=0;i<n;i++)if(!land[i]){done[i]=1;lvl[i]=h[i];
   const ix=i%nx,iy=Math.floor(i/nx);let бер=false;for(const [dx,dy] of NB){const a=ix+dx,b=iy+dy;if(a>=0&&b>=0&&a<nx&&b<ny&&land[b*nx+a]){бер=true;break;}}
   if(бер)push(h[i],i);}
  while(hp.length){const [p,i]=pop();order.push(i);const ix=i%nx,iy=Math.floor(i/nx);
   for(const [dx,dy] of NB){const a=ix+dx,b=iy+dy;if(a<0||b<0||a>=nx||b>=ny)continue;const j=b*nx+a;if(done[j])continue;done[j]=1;
    if(!land[j])continue;down[j]=i;lvl[j]=Math.max(h[j],p+1e-5);push(lvl[j],j);}}
  /* сток: от верхних узлов к нижним */
  const acc=new Float32Array(n);
  for(let k=order.length-1;k>=0;k--){const i=order[k];if(!land[i])continue;acc[i]+=this.rain(X(i),Y(i));const d=down[i];if(d>=0&&land[d])acc[d]+=acc[i];}
  const lake=new Int32Array(n).fill(-1);const isLakeNode=i=>land[i]&&lvl[i]-h[i]>(озёрный?0.004:0.008);
  /* озёра: связные залитые узлы (от двух) */
  const lakes=[];
  for(let i=0;i<n;i++){if(lake[i]>=0||!isLakeNode(i))continue;const q=[i],grp=[];lake[i]=-2;
   while(q.length){const u=q.pop();grp.push(u);const ux=u%nx,uy=Math.floor(u/nx);for(const [dx,dy] of NB){const a=ux+dx,b=uy+dy;if(a<0||b<0||a>=nx||b>=ny)continue;const j=b*nx+a;if(lake[j]===-1&&isLakeNode(j)){lake[j]=-2;q.push(j);}}}
   if(grp.length<(озёрный?2:3)){for(const u of grp)lake[u]=-1;continue;}
   const id=lakes.length;let sx=0,sy=0,dep=0,out=-1;
   for(const u of grp){lake[u]=id;sx+=X(u);sy+=Y(u);dep=Math.max(dep,lvl[u]-h[u]);}
   for(const u of grp){const d=down[u];if(d>=0&&lake[d]!==id){out=u;break;}}
   const L={id,n:this.lakeName(c,id),cx:Math.round(sx/grp.length),cy:Math.round(sy/grp.length),r:Math.round(Math.sqrt(grp.length/Math.PI)*step*0.95),
    глуб:Math.round(4+dep*900),узлов:grp.length,мат:c.id,выход:null,входы:[],рыба:[]};
   L.рыба=MAT_FISH.filter((f,k)=>f.where.includes("lake")&&hashName(id*7+k,c.seed,9811)<0.75).map(f=>f.n);
   lakes.push(L);}
  /* реки и ручьи */
  const T=Math.max(8,landN*0.0022),TS=T/3.2,riv=i=>land[i]&&lake[i]<0&&acc[i]>=T;
  const kids=new Map();for(let i=0;i<n;i++){if(!riv(i))continue;const d=down[i];if(d>=0&&riv(d)){if(!kids.has(d))kids.set(d,[]);kids.get(d).push(i);}}
  let accMax=1;for(let i=0;i<n;i++)if(riv(i)&&acc[i]>accMax)accMax=acc[i];
  const rivers=[],nodeRiver=new Int32Array(n).fill(-1);
  const trace=(mouth,mk)=>{/* вверх по главным детям */
   const path=[mouth];let u=mouth;
   for(;;){const ks=kids.get(u);if(!ks||!ks.length)break;let best=ks[0];for(const k of ks)if(acc[k]>acc[best])best=k;path.push(best);u=best;}
   path.reverse();const id=rivers.length;
   for(const u of path)nodeRiver[u]=id;
   const src=path[0],srcLake=(()=>{const ux=src%nx,uy=Math.floor(src/nx);for(const [dx,dy] of NB){const a=ux+dx,b=uy+dy;if(a<0||b<0||a>=nx||b>=ny)continue;const j=b*nx+a;if(lake[j]>=0&&down[j]===src)return lake[j];}return -1;})();
   /* последняя точка — куда река впадает: берег моря, озеро или узел главной реки */
   const dn=down[mouth],P0=dn>=0?path.concat([dn]):path.concat([mouth]);
   const R={id,мат:c.id,n:this.riverName(c,id),pts:P0.map(u=>[X(u),Y(u)]),acc:P0.map((u,k)=>k<path.length?acc[u]:acc[mouth]),hh:P0.map(u=>h[u]),устье:mk,исток:srcLake>=0?{вид:"озеро",lake:srcLake}:{вид:h[src]>0.55?"горы":(this.rain(X(src),Y(src))>0.7?"болото":"родник")},притоки:[],пороги:[]};
   rivers.push(R);
   /* притоки: не главные дети каждого узла */
   for(let k=0;k<path.length;k++){const ks=kids.get(path[k]);if(!ks)continue;for(const ch of ks){if(nodeRiver[ch]>=0)continue;const t=trace(ch,{вид:"river",river:id,at:k});R.притоки.push(t);}}
   return id;};
  for(let i=0;i<n;i++){if(!riv(i)||nodeRiver[i]>=0)continue;const d=down[i];
   if(d<0||!land[d])trace(i,{вид:"sea"});else if(lake[d]>=0){const lid=lake[d];const t=trace(i,{вид:"lake",lake:lid});lakes[lid].входы.push(t);}}
  /* вытоки озёр */
  for(const R of rivers)if(R.исток.вид==="озеро"&&lakes[R.исток.lake])lakes[R.исток.lake].выход=R.id;
  /* сгладить ломаные (Чайкин, два прохода), ширина от стока, пороги и водопады */
  for(const R of rivers){
   let P=R.pts.map((p,k)=>[p[0],p[1],R.acc[k],R.hh[k]]);
   for(let it=0;it<2;it++){if(P.length<3)break;const Q=[P[0]];for(let k=0;k+1<P.length;k++){const a=P[k],b=P[k+1];Q.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25,a[2]*0.75+b[2]*0.25,a[3]*0.75+b[3]*0.25]);Q.push([a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75,a[2]*0.25+b[2]*0.75,a[3]*0.25+b[3]*0.75]);}Q.push(P[P.length-1]);P=Q;}
   R.pts=P.map(p=>[Math.round(p[0]),Math.round(p[1])]);R.w=P.map(p=>Math.round(4+26*Math.sqrt(Math.min(1,p[2]/accMax))));R.hh=P.map(p=>p[3]);
   R.len=0;for(let k=0;k+1<R.pts.length;k++)R.len+=Math.hypot(R.pts[k+1][0]-R.pts[k][0],R.pts[k+1][1]-R.pts[k][1]);R.len=Math.round(R.len);
   for(let k=0;k+1<R.hh.length;k++)if(R.hh[k]-R.hh[k+1]>0.011&&R.hh[k]>0.40)R.пороги.push(k);
   R.сток=Math.round(P[P.length-1][2]*10)/10;R.дельта=R.устье.вид==="sea"&&P[P.length-1][2]>=accMax*0.35;
   const lat=matLat(R.pts[R.pts.length-1][1]),al=Math.abs(lat);
   R.разлив=al<12?(lat<0?[150,240]:[330,60]):(al>62?(lat<0?[150,200]:[330,20]):(lat<0?[60,120]:[240,300]));}
  /* ручьи: узлы со стоком поменьше — отрезки до нижнего узла */
  const streams=[];
  for(let i=0;i<n;i++){if(!land[i]||lake[i]>=0||riv(i)||acc[i]<TS)continue;const d=down[i];if(d<0||!land[d])continue;streams.push([X(i),Y(i),X(d),Y(d),Math.round(1+2*Math.min(1,acc[i]/T))]);}
  /* корзины для поиска: отрезки рек и ручьёв, круги озёр */
  const bs=step,key=(a,b)=>a*65536+b,bk=new Map(),addSeg=(ref,ax,ay,bx,by,w)=>{const m=w/2+2500;
   const a0=Math.floor((Math.min(ax,bx)-m-c.bx0)/bs),a1=Math.floor((Math.max(ax,bx)+m-c.bx0)/bs),b0=Math.floor((Math.min(ay,by)-m-c.by0)/bs),b1=Math.floor((Math.max(ay,by)+m-c.by0)/bs);
   for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++){const k=key(a+8,b+8);if(!bk.has(k))bk.set(k,[]);bk.get(k).push(ref);}};
  rivers.forEach(R=>{for(let k=0;k+1<R.pts.length;k++)addSeg({r:R.id,k},R.pts[k][0],R.pts[k][1],R.pts[k+1][0],R.pts[k+1][1],Math.max(R.w[k],R.w[k+1]));});
  streams.forEach((s,k)=>addSeg({s:k},s[0],s[1],s[2],s[3],s[4]));
  const lk=new Map();lakes.forEach(L=>{const m=L.r*3.2;for(let a=Math.floor((L.cx-m-c.bx0)/bs);a<=Math.floor((L.cx+m-c.bx0)/bs);a++)for(let b=Math.floor((L.cy-m-c.by0)/bs);b<=Math.floor((L.cy+m-c.by0)/bs);b++){const k=key(a+8,b+8);if(!lk.has(k))lk.set(k,[]);lk.get(k).push(L.id);}});
  const deltas=rivers.filter(R=>R.дельта).map(R=>({R,x:R.pts[R.pts.length-1][0],y:R.pts[R.pts.length-1][1],r:Math.round(step*1.1)}));
  return {c,step,nx,ny,rivers,lakes,streams,bk,lk,accMax,key,bs,deltas};},
 riverName(c,id){const A=MAT_NAMES.рекаA,B=MAT_NAMES.рекаB;return A[Math.floor(hashName(id,c.seed,9801)*A.length)]+B[Math.floor(hashName(id,c.seed,9802)*B.length)];},
 lakeName(c,id){const A=MAT_NAMES.озероA,B=MAT_NAMES.озероB;const a=A[Math.floor(hashName(id,c.seed,9803)*A.length)];let b=B[Math.floor(hashName(id,c.seed,9804)*B.length)];
  /* «Глубокий», «Тихий»: после к, г, х — «-ий» */if(/[кгх]$/.test(a)&&/^ый/.test(b))b="ий"+b.slice(2);return a+b;},
 /* Ближайшее русло: река (с номером отрезка и долей), ручей или ничего. */
 near(x,y){
  const L=matContAt(x,y);if(!L||L.f<-0.05)return null;const D=this.get(L.c);
  const k=D.key(Math.floor((x-L.c.bx0)/D.bs)+8,Math.floor((y-L.c.by0)/D.bs)+8),cand=D.bk.get(k);if(!cand)return {D,hit:null};
  let best=null;
  for(const ref of cand){
   if(ref.r!=null){const R=D.rivers[ref.r],a=R.pts[ref.k],b=R.pts[ref.k+1];const s=matSegDist(x,y,a[0],a[1],b[0],b[1]);
    const w=R.w[ref.k]+(R.w[ref.k+1]-R.w[ref.k])*s.t;
    /* извилистость: русло гуляет на сотни клеток по одну и другую сторону середины долины
       (расстояние со знаком — сторона берега; иначе вышло бы два русла) */
    const A=Math.min(500,D.step*0.025),m=(matFbm(x,y,6000,9821+R.id,2)-0.5)*2*A;
    const vx=b[0]-a[0],vy=b[1]-a[1],L=Math.hypot(vx,vy)||1,sd=(s.t>0&&s.t<1)?((x-a[0])*vy-(y-a[1])*vx)/L:s.d*Math.sign(((x-a[0])*vy-(y-a[1])*vx)||1);
    const dd=Math.abs(sd-m);
    if(!best||dd-w/2<best.e)best={e:dd-w/2,R,k:ref.k,t:s.t,w,d:s.d};}
   else{const S=D.streams[ref.s];const s=matSegDist(x,y,S[0],S[1],S[2],S[3]);const m=(matFbm(x,y,3000,9831,2)-0.5)*2*Math.min(250,D.step*0.012);
    const vx=S[2]-S[0],vy=S[3]-S[1],L=Math.hypot(vx,vy)||1,sd=(s.t>0&&s.t<1)?((x-S[0])*vy-(y-S[1])*vx)/L:s.d;const dd=Math.abs(sd-m);
    if(!best||dd-S[4]/2<best.e)best={e:dd-S[4]/2,S,w:S[4],d:s.d};}}
  return {D,hit:best};},
 lakeNear(x,y){const L=matContAt(x,y);if(!L||L.f<-0.08)return null;const D=this.get(L.c);
  const ids=D.lk.get(D.key(Math.floor((x-L.c.bx0)/D.bs)+8,Math.floor((y-L.c.by0)/D.bs)+8));if(!ids)return null;
  let best=null;for(const id of ids){const l=D.lakes[id];const d=Math.hypot(x-l.cx,y-l.cy);if(!best||d<best.d)best={l,d};}return best;}};

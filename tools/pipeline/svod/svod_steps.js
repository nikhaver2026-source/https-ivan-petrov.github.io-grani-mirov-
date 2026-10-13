global.safeFn=(f,d)=>{try{return f();}catch(e){return d;}};global.CH_RIDDLES=JSON.parse(require('fs').readFileSync('/root/S/dev155/riddles_old.json','utf8'));
const src=require('fs').readFileSync('/root/S/hron/svod155_late.js','utf8');const кон=src.indexOf('/* ── СВОД: окно');eval((кон>0?src.slice(0,кон):src).replace(/^const /gm,'var '));
const решатели={
 кувшины(п){return СводШаги.кувшины.решить(п.a,п.b,п.t);},
 переправа(п){return ["2","0","1","2","3","0","2"];},
 мост(п){const t=п.t;const парой=2*t[1]<=t[0]+t[2];return парой?["01","0","23","1","01"]:["03","0","02","0","01"];},
 монета(п){/* стратегия: 1-3|4-6, затем внутри кучки */return null;},
 ханой(п){const out=[];const h=(n,a,b,c)=>{if(!n)return;h(n-1,a,c,b);out.push(`${a}${c}`);h(n-1,b,a,c);};const via=[0,1,2].find(x=>x!==п.с&&x!==п.ц);h(п.n,п.с,via,п.ц);return out;}};
let всего=0,ок=0;const плохо=[];
for(const где of ["п","д"]){const N=Свод.размер(где);for(let i=0;i<N;i++){const z=Свод.загадка(где,i);if(z.ui!=="шаги")continue;всего++;const п=z.шаги;const M=СводШаги[п.вид];let s=M.нач(п);
 if(п.вид==="монета"){/* честная игра весами */const w=д=>{const r=M.шаг(п,s,д);if(r.s)s=r.s;return r;};const r1=w("w1-3|4-6");let куч;
  if(/равновесии/.test(r1.сказать))куч=[7,8,9];else if(/левая/.test(r1.сказать))куч=[1,2,3];else куч=[4,5,6];
  const r2=w(`w${куч[0]}|${куч[1]}`);const ответ=/равновесии/.test(r2.сказать)?куч[2]:/левая/.test(r2.сказать)?куч[0]:куч[1];const r3=M.шаг(п,s,"n"+ответ);if(r3.s&&M.готово(п,r3.s))ок++;else плохо.push([z.id,"монета",JSON.stringify(п)]);continue;}
 const ходы=решатели[п.вид](п);let провал=null;for(const д of ходы){const r=M.шаг(п,s,д);if(r.провал||r.ошибка){провал=r.провал||r.ошибка;break;}s=r.s;}
 if(!провал&&M.готово(п,s))ок++;else плохо.push([z.id,п.вид,провал,JSON.stringify(п).slice(0,100)]);}}
console.log("пошаговых",всего,"решено",ок,"не решено",плохо.length);плохо.slice(0,8).forEach(x=>console.log(x));

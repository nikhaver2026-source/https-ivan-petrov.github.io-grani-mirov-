global.safeFn=(f,d)=>{try{return f();}catch(e){return d;}};
global.CH_RIDDLES=JSON.parse(require('fs').readFileSync('/root/S/dev155/riddles_old.json','utf8'));
const src=require('fs').readFileSync('/root/S/hron/svod155_late.js','utf8');
const кон=src.indexOf('/* ── СВОД: окно');eval((кон>0?src.slice(0,кон):src).replace(/^const /gm,'var '));
for(const где of ["п","д"]){const N=Свод.размер(где);const m=new Map();const по={};
 for(let i=0;i<N;i++){const z=Свод.загадка(где,i);const p=Свод.подпись(z);if(m.has(p)){(по[z.мех]=по[z.мех]||[]).push([m.get(p),i,p.slice(0,160)]);}else m.set(p,i);}
 for(const k in по)console.log(где,k,по[k].length,JSON.stringify(по[k].slice(0,2)));}

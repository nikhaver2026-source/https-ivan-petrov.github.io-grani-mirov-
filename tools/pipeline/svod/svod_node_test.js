/* проверка ядра свода в Node: заглушки игры, перебор всех номеров, уникальность и время */
global.safeFn=(f,d)=>{try{return f();}catch(e){if(process.env.DBG)console.error(e);return d;}};
global.CH_RIDDLES=JSON.parse(require('fs').readFileSync('/root/S/dev155/riddles_old.json','utf8'));
const src=require('fs').readFileSync('/root/S/hron/svod155_late.js','utf8');
const кон=src.indexOf('/* ── СВОД: окно');const code=кон>0?src.slice(0,кон):src;
eval(code.replace(/^const /gm,'var '));
const t0=Date.now();const R={};
for(const где of ["п","д"]){const N=Свод.размер(где);const s=new Set();let dup=0;const по={};const ур={1:0,2:0,3:0};let ошибок=0;
 for(let i=0;i<N;i++){let z;try{z=Свод.загадка(где,i);}catch(e){ошибок++;if(ошибок<4)console.log("ОШИБКА",где,i,String(e).slice(0,200));continue;}
  const p=Свод.подпись(z);if(s.has(p))dup++;else s.add(p);по[z.мех]=(по[z.мех]||0)+1;ур[z.ур]=(ур[z.ур]||0)+1;
  if(z.ui==="выбор"&&!(z.opts||[]).includes(z.ans)){ошибок++;if(ошибок<6)console.log("нет ответа среди вариантов",где,i,z.мех,z.ans,z.opts);}
  if(z.ui==="выбор"&&new Set(z.opts).size!==z.opts.length){ошибок++;if(ошибок<6)console.log("повтор варианта",где,i,z.мех,z.opts);}
 }
 R[где]={N,уникальных:s.size,повторов:dup,ошибок,по,ур};}
console.log(JSON.stringify(R,null,0));console.log("всего",Свод.всего(),"за",Date.now()-t0,"мс");
for(const [где,i] of [["п",0],["п",1],["п",2],["д",5],["д",77],["д",1234]]){const z=Свод.загадка(где,i);console.log(где+i,z.мех,z.ур,"|",z.q.slice(0,230),"|",JSON.stringify(z.ans).slice(0,40));}

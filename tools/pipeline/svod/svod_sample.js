global.safeFn=(f,d)=>{try{return f();}catch(e){return d;}};
global.CH_RIDDLES=JSON.parse(require('fs').readFileSync('/root/S/dev155/riddles_old.json','utf8'));
const src=require('fs').readFileSync('/root/S/hron/svod155_late.js','utf8');
const кон=src.indexOf('/* ── СВОД: окно');eval((кон>0?src.slice(0,кон):src).replace(/^const /gm,'var '));
const где=process.argv[2]||"п",seed=+(process.argv[3]||7);const N=Свод.размер(где);const видел=new Set();
for(let t=0;t<N&&видел.size<30;t++){const i=(t*7919+seed*104729)%N;const z=Свод.загадка(где,i);if(видел.has(z.мех))continue;видел.add(z.мех);
 console.log(`\n[${z.мех} ур${z.ур} ui=${z.ui} #${i}] ${z.q}`);
 if(z.opts)console.log('  варианты:',z.opts.join(' | '),' → ',z.ans);
 if(z.шаги)console.log('  шаги:',JSON.stringify(z.шаги).slice(0,300));
 if(z.sym)console.log('  sym:',JSON.stringify(z.sym).slice(0,200),' ans:',JSON.stringify(z.ans));
 if(z.звук)console.log('  звук:',JSON.stringify(z.звук).slice(0,200));
 if(z.hints)console.log('  подсказки:',z.hints.join(' / '));}

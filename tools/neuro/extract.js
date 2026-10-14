/* extract.js — данные мира для нейросети Режиссёра Грани (в игру не входит).
   Открывает собранную страницу игры, берёт все таблицы верхнего уровня (const ИМЯ=[…] и {…}) без функций и
   выгружает их в JSON: из них нейросеть учится, каким бывает мир — боги, народы, твари, вещи, ресурсы, земли, места.
   node extract.js <url страницы> <папка вывода> */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const url=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
 const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
 const имена=[...new Set([...src.matchAll(/^const ([A-ZА-ЯЁ][A-ZА-ЯЁ0-9_]*)=[\[{]/gm)].map(m=>m[1]))];
 const b=await chromium.launch();const p=await (await b.newContext()).newPage();await p.goto(url);await p.waitForTimeout(1500);
 const r=await p.evaluate((имена)=>{const o={},пропуск=[];
  /* только данные: числа, строки, массивы, простые объекты; функции и узлы — мимо */
  const чисто=(v,d)=>{if(d>12)return undefined;if(v==null||typeof v==="number"||typeof v==="string"||typeof v==="boolean")return v;
   if(typeof v==="function"||v instanceof Node)return undefined;
   if(Array.isArray(v)){const a=[];for(const x of v){const y=чисто(x,d+1);if(y!==undefined)a.push(y);}return a;}
   if(typeof v==="object"){if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)return undefined;const q={};for(const k of Object.keys(v)){const y=чисто(v[k],d+1);if(y!==undefined)q[k]=y;}return q;}
   return undefined;};
  for(const n of имена){try{const v=(0,eval)(n);const c=чисто(v,0);const s=JSON.stringify(c);if(!s||s.length<3||s.length>4e6){пропуск.push(n);continue;}o[n]=c;}catch(_){пропуск.push(n);}}
  return {o,пропуск};},имена);
 fs.writeFileSync(path.join(out,'world_tables.json'),JSON.stringify(r.o));
 const размеры=Object.entries(r.o).map(([k,v])=>[k,JSON.stringify(v).length]).sort((a,b)=>b[1]-a[1]);
 fs.writeFileSync(path.join(out,'world_tables_index.txt'),размеры.map(([k,n])=>k+"\t"+n).join("\n"));
 console.log("таблиц",Object.keys(r.o).length,"пропущено",r.пропуск.length,"объём",размеры.reduce((a,x)=>a+x[1],0));
 await b.close();})();

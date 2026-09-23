/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 152: КАЧЕСТВО ЗАПИСЕЙ — 320 КБИТ/С ВСЕМУ НОВОМУ

   Правило: всякая НОВАЯ запись в sounds/ — либо без потерь (flac, wav),
   либо сжата не ниже 320 кбит/с.

   Записи, пришедшие раньше правила, перечислены поимённо в
   sounds/BITRATE_BASELINE.txt. Пережимать их в 320 бессмысленно: пережатие
   не возвращает того, чего в файле нет, а вес втрое поднимает. Они
   остаются как есть — но список закрыт, и всё, чего в нём нет, обязано
   быть в 320 или без потерь.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Список старых записей на месте, читается и не пуст.
   2. Каждая запись из списка существует: список не гниёт, пока файлы
      переименовывают.
   3. Всякая запись, которой в списке НЕТ, — без потерь или не ниже
      320 кбит/с. Это и есть правило.
   4. Список не растёт незаметно: в нём ровно столько строк, сколько было
      записано, и ни одной новой.
   5. Битых и пустых файлов в банке нет.
   ═══════════════════════════════════════════════════════════════════════ */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

const ROOT=path.resolve(__dirname,'..');
const ЗВУК=['.mp3','.ogg','.opus','.m4a','.aac'];          /* сжатые с потерями */
const БЕЗ_ПОТЕРЬ=['.flac','.wav','.aiff'];                  /* потерь нет вовсе */
const ПОРОГ=315;                                            /* 320 с допуском на VBR */

function обойти(дир,out){
 for(const имя of fs.readdirSync(дир)){
  const п=path.join(дир,имя);
  const st=fs.statSync(п);
  if(st.isDirectory())обойти(п,out);
  else{
   const e=path.extname(имя).toLowerCase();
   if(ЗВУК.includes(e)||БЕЗ_ПОТЕРЬ.includes(e))
    out.push({путь:path.relative(ROOT,п).replace(/\\/g,'/'),байт:st.size,потери:ЗВУК.includes(e)});}}
 return out;}

function битрейт(п){
 try{
  const r=cp.execFileSync('ffprobe',['-v','error','-show_entries','format=bit_rate',
   '-of','csv=p=0',path.join(ROOT,п)],{encoding:'utf8',timeout:20000}).trim();
  const v=parseInt(r,10);
  return Number.isFinite(v)?Math.round(v/1000):null;
 }catch(_){return null;}}

(async()=>{
 /* ── 1. Список ── */
 const БАЗА=path.join(ROOT,'sounds','BITRATE_BASELINE.txt');
 const естьБаза=fs.existsSync(БАЗА);
 const строки=естьБаза?fs.readFileSync(БАЗА,'utf8').split('\n')
   .filter(l=>l.trim()&&!l.startsWith('#')):[];
 const старые=new Map();
 строки.forEach(l=>{const [p,k]=l.split('\t');if(p)старые.set(p.trim(),parseInt(k,10)||0);});
 check('список записей, пришедших до правила, на месте и не пуст',
  естьБаза&&старые.size>0,{есть:естьБаза,записей:старые.size});

 /* ── 2–5. Обход банка ── */
 const все=fs.existsSync(path.join(ROOT,'sounds'))?обойти(path.join(ROOT,'sounds'),[]):[];
 const пустые=все.filter(f=>f.байт<512).map(f=>f.путь);
 check('битых и пустых записей в банке нет',пустые.length===0,
  {всего:все.length,пустых:пустые.length,примеры:пустые.slice(0,3)});

 const путиБанка=new Set(все.map(f=>f.путь));
 const пропавшие=[...старые.keys()].filter(p=>!путиБанка.has(p));
 check('каждая запись из списка на месте: список не отстал от банка',
  пропавшие.length===0,{пропавших:пропавшие.length,примеры:пропавшие.slice(0,5)});

 /* Новое — это всё, чего в списке нет. Без потерь проходит сразу; сжатое
    меряем. */
 const новые=все.filter(f=>!старые.has(f.путь));
 const плохие=[];
 for(const f of новые){
  if(!f.потери)continue;                 /* flac и wav — потерь нет вовсе */
  const k=битрейт(f.путь);
  if(k===null){плохие.push([f.путь,'не читается']);continue;}
  if(k<ПОРОГ)плохие.push([f.путь,k+' кбит/с']);}
 check('всякая новая запись — без потерь или не ниже 320 кбит/с',
  плохие.length===0,{новых:новые.length,нарушений:плохие.length,примеры:плохие.slice(0,6)});

 /* ── 4. Список закрыт ── */
 check('список старых записей закрыт: ровно 1303 строки, ни одной новой',
  старые.size===1303,{вСписке:старые.size,надо:1303});

 /* Сводка для глаз: сколько чего в банке. */
 const свод={всего:все.length,безПотерь:все.filter(f=>!f.потери).length,
  сжатых:все.filter(f=>f.потери).length,старых:старые.size,новых:новые.length};
 check('сводка банка сходится',
  свод.сжатых>=свод.старых&&свод.всего===свод.безПотерь+свод.сжатых,свод);

 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

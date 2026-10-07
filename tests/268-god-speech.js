/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 268: 10.5 — ДВЕНАДЦАТЬ БОГОВ ГОВОРЯТ СВОИМ ГОЛОСОМ

   Просьба игрока: озвучить богов лучшими голосами (Gemini) — у каждого из
   двенадцати свой голос и свои слова.

   1. У каждого из двенадцати богов семь реплик: две у алтаря,
      благословение, обет, знамение, откровение, гнев за нарушенный запрет.
   2. Опись записей GOD_SPEECH_LEN: каждая запись — бог из двенадцати и вид
      из семи, у каждой есть длительность, файлы лежат в sounds/voice_god.
   3. С записью бог говорит ею (god_<бог>_<вид>_g, папка voice_god, FLAC) в
      общей очереди голосов и субтитром «Бог: «…»»; без записи — молчит
      словом и отвечает, как прежде, стихией.
   4. Слово звучит там, где бог отвечает: у алтаря, после молитвы, при
      обете покровительства (и обете у придорожного камня), в знамении, в
      откровении и в гневе за нарушенный в его праздник запрет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  const out={};const ВИДЫ=["altar1","altar2","bless","patron","omen","reveal","anger"];
  /* 1. реплики */
  out.богов=PANTHEON.length;out.плохие=[];
  PANTHEON.forEach(g=>ВИДЫ.forEach(k=>{const t=(GOD_SPEECH[g.id]||{})[k];if(!t||t.length<12||!/[а-яё]/i.test(t))out.плохие.push(g.id+"_"+k);}));
  /* 2. опись */
  out.записи=Object.keys(GOD_SPEECH_LEN);
  out.чужие=out.записи.filter(x=>{const m=/^god_([a-z]+)_([a-z0-9]+)_g$/.exec(x);return !m||!GOD_BY_ID[m[1]]||ВИДЫ.indexOf(m[2])<0||!(GOD_SPEECH_LEN[x]>0.3);});
  /* 3. с записью — запись в очереди голосов и субтитр; без записи — ничего */
  const путь="god_zarya_bless_g",было=GOD_SPEECH_LEN[путь];GOD_SPEECH_LEN[путь]=было||2.5;
  const сказано=[],субтитры=[];const оФ=Folk.сказать.bind(Folk);
  Folk.сказать=(пп,n,o)=>{сказано.push({пп,dir:o&&o.dir});return true;};
  const оS=window.sub;window.sub=(t,k)=>{субтитры.push(String(t));return оS?оS(t,k):0;};
  out.сЗаписью=godSpeak("zarya","bless",{delay:0});await new Promise(res=>setTimeout(res,80));
  out.сказано=сказано.slice();out.субтитр=субтитры.find(t=>/Аурис/.test(t))||"";
  if(!было)delete GOD_SPEECH_LEN[путь];
  сказано.length=0;const пусто="god_road_omen_g",былоП=GOD_SPEECH_LEN[пусто];delete GOD_SPEECH_LEN[пусто];
  out.безЗаписи=godSpeak("road","omen",{delay:0});await new Promise(res=>setTimeout(res,80));out.безЗаписиСказано=сказано.length;
  if(былоП)GOD_SPEECH_LEN[пусто]=былоП;
  Folk.сказать=оФ;window.sub=оS;
  /* файл записи — FLAC из папки богов */
  out.файл=null;
  if(safeFn(()=>Folk.on(),false)){const n0=Folk.очередь.length;GOD_SPEECH_LEN[путь]=GOD_SPEECH_LEN[путь]||2.5;
   /* Очередь пуста — запись звучит сразу, мимо очереди: файл берём у самого запуска. */
   let пущен=null;const оЗв=Folk._звук;Folk._звук=function(п,ф,n,оп){пущен=ф;return оЗв.call(this,п,ф,n,оп);};
   Folk.сказать(путь,null,{dir:GOD_SPEECH_DIR,всегда:true});const q=Folk.очередь[Folk.очередь.length-1];
   Folk._звук=оЗв;
   out.файл=q&&Folk.очередь.length>n0?q.файл:(пущен||null);if(!было)delete GOD_SPEECH_LEN[путь];}
  /* 4. места: молитва и покровительство вызывают слово своего вида */
  const вызовы=[];const оG=window.godSpeak;window.godSpeak=(id,k,o)=>{вызовы.push(id+":"+k);return false;};
  safeFn(()=>prayToGod("wood"));safeFn(()=>choosePatron("forge"));
  window.godSpeak=оG;out.вызовы=вызовы;
  out.табу=String(Gods.taboo).indexOf('godSpeak(g.id,"anger"')>=0;
  out.алтарь=String(useAltar).indexOf('godSpeak(g.id,"altar"')>=0;
  return out;});
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 r.места=['godSpeak(c.patron.id,"patron"','godSpeak(G.patron,"omen"','godSpeak(god.id,"reveal"'].map(x=>html.indexOf(x)>=0);
 r.файлов=r.записи.map(x=>{try{return fs.statSync(path.join(__dirname,'..','sounds','voice_god',x+'.flac')).size>3000;}catch(_){return false;}});
 check('1. у каждого из двенадцати богов семь реплик',r.богов===12&&!r.плохие.length,r.плохие.slice(0,6));
 check('2. опись записей богов: свои боги и виды, длительности есть, файлы на месте',!r.чужие.length&&r.файлов.every(Boolean),
  {записей:r.записи.length,чужие:r.чужие.slice(0,4),нетФайла:r.записи.filter((x,i)=>!r.файлов[i]).slice(0,4)});
 check('3. с записью бог говорит ею в очереди голосов и субтитром, без записи — молчит словом; запись — FLAC из voice_god (без удвоенного sounds/sounds)',
  r.сЗаписью===true&&r.сказано.length===1&&r.сказано[0].пп==="god_zarya_bless_g"&&r.сказано[0].dir==="voice_god/"&&/^Аурис Зарний: «/.test(r.субтитр)
  &&r.безЗаписи===false&&r.безЗаписиСказано===0&&(r.файл===null||(/voice_god\/god_zarya_bless_g\.flac$/.test(r.файл)&&!/sounds\/sounds\//.test(r.файл))),
  {сказано:r.сказано,субтитр:r.субтитр,безЗаписи:r.безЗаписи,файл:r.файл});
 check('4. слово звучит у алтаря, после молитвы, при обете, в знамении, в откровении и в гневе за запрет',
  r.вызовы.indexOf("wood:bless")>=0&&r.вызовы.indexOf("forge:patron")>=0&&r.табу&&r.алтарь&&r.места.every(Boolean),
  {вызовы:r.вызовы,табу:r.табу,алтарь:r.алтарь,места:r.места});
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

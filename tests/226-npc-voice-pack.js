/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 226: ТРЕТЬИ ГОЛОСА ЖИТЕЛЕЙ — В ГОЛОСОВОМ ПАКЕТЕ, APK МЕНЬШЕ 2 ГиБ

   Третий и дальнейшие голоса жителя (записи «_v2», «_v3») лежат в
   sounds/gvoice_pack/npc, а не в сборке.
   1. Опись пакета на месте; каждая запись описи лежит в пакете, в сборке
      (voice_npc) записей «_v2» и дальше не осталось.
   2. Пока пакета нет, житель говорит первым или вторым своим голосом:
      строка не молчит и не просит файла, которого в сборке нет.
   3. С пакетом звучит третий голос, и файл берётся из gvoice_pack/npc/.
   4. Полные сборки — при любом весе (14.5): один APK и один архив Windows,
      все записи с голосовым пакетом внутри, без сжатия, игроку ничего не
      докачивать. Архив Windows — ZIP64 без предела, записи на машине сборки
      переносятся, а не копируются. APK больше 4 ГиБ — архив ZIP64
      (android/full-apk.py) с подписью v1 и целевым API 29 (подписи v2/v3 у
      ZIP64 Android не принимает); перед выпуском он ставится и читает запись
      из конца архива на эмуляторах Android 12 и 15. Сборщик проверен на малом
      APK: прежняя подпись выброшена, всё прочее на месте, записи — без сжатия.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
const ROOT=path.resolve(__dirname,'..');
const PACK=path.join(ROOT,'sounds','gvoice_pack','npc');
(async()=>{
 /* ── 1. Опись и файлы ── */
 let опись={p:{}};try{const b=fs.readFileSync(path.join(PACK,'bank.js'),'utf8');опись=JSON.parse(b.slice(b.indexOf('{'),b.lastIndexOf('}')+1));}catch(_){}
 const ключи=Object.keys(опись.p||{});
 const нет=ключи.filter(k=>!fs.existsSync(path.join(PACK,k+'.flac')));
 const вСборке=fs.readdirSync(path.join(ROOT,'sounds','voice_npc')).filter(f=>/_v[2-9]/.test(f)&&!/^street_/.test(f));  /* у стражи все голоса в сборке */
 const вПакете=fs.readdirSync(PACK).filter(f=>f.endsWith('.flac'));
 check('1. опись пакета жителей на месте, все её записи лежат в пакете, в сборке третьих голосов нет',
  ключи.length>1000&&!нет.length&&!вСборке.length&&вПакете.length===ключи.length,{описи:ключи.length,файлов:вПакете.length,нет:нет.slice(0,3),вСборке:вСборке.slice(0,3)});

 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.ФАЙЛЫ=[];const z0=Folk._звук.bind(Folk);Folk._звук=(путь,файл,n,оп)=>{ФАЙЛЫ.push(файл);return z0(путь,файл,n,оп);};});

 /* строка с третьим голосом */
 const строка=await page.evaluate(()=>{for(const роль of Object.keys(VOICE_NPC))for(const [t,r] of Object.entries(VOICE_NPC[роль]))
  if(((Number(r[2])||1)>>2)&1&&npcInPack(r[0]+"_v2_g"))return {роль,t,r};return null;});

 /* ── 2. Без пакета ── */
 const без=await page.evaluate(async с=>{const p=VOICE_NPC_PACK.pack;const было={state:p.state,map:p.map};
  p.state="failed";p.map=null;
  const имя=Folk.вариант(с.r,2,false);
  ФАЙЛЫ.length=0;Folk.реплика(с.роль,с.t,null,false,{всегда:true,голос:2});
  for(let i=0;i<100&&!ФАЙЛЫ.length;i++)await new Promise(z=>setTimeout(z,100));
  const файлы=ФАЙЛЫ.slice();p.state=было.state;p.map=было.map;return {имя,файлы};},строка);
 check('2. без пакета житель говорит первым или вторым голосом, файл — из сборки',
  !!строка&&!/_v[2-9]/.test(без.имя)&&без.файлы.length>0&&без.файлы.every(f=>/voice_npc\//.test(f)&&!/gvoice_pack/.test(f)),без);

 /* ── 3. С пакетом ── */
 const с=await page.evaluate(async с=>{const p=VOICE_NPC_PACK.pack;p.state="off";p.map=null;
  npcPackHas("x");for(let i=0;i<50&&p.state!=="ready"&&p.state!=="failed";i++)await new Promise(z=>setTimeout(z,100));
  const имя=Folk.вариант(с.r,2,false);
  await new Promise(z=>setTimeout(z,6000));ФАЙЛЫ.length=0;Folk.реплика(с.роль,с.t,null,false,{всегда:true,голос:2});
  for(let i=0;i<100&&!ФАЙЛЫ.length;i++)await new Promise(z=>setTimeout(z,100));
  return {state:p.state,имя,файлы:ФАЙЛЫ.slice()};},строка);
 check('3. с пакетом звучит третий голос, файл берётся из gvoice_pack/npc/',
  с.state==="ready"&&/_v2$/.test(с.имя)&&с.файлы.some(f=>/gvoice_pack\/npc\/.+_v2_g\.flac$/.test(f)),с);

 /* ── 4. Полные сборки при любом весе ── */
 const {execFileSync}=require('child_process'),os=require('os');
 const врем=fs.mkdtempSync(path.join(os.tmpdir(),'grani226-'));
 const zipPy=(код,...а)=>execFileSync('python3',['-c',код,...а],{encoding:'utf8'});
 zipPy(`import sys,zipfile
z=zipfile.ZipFile(sys.argv[1],"w")
z.writestr(zipfile.ZipInfo("AndroidManifest.xml"),b"m"*500,compress_type=zipfile.ZIP_DEFLATED)
z.writestr("resources.arsc",b"r"*100)
for n in ("META-INF/MANIFEST.MF","META-INF/GRANI.SF","META-INF/GRANI.RSA"):z.writestr(n,b"old")
z.writestr("META-INF/androidx.webkit_webkit.version",b"1.11.0")
z.writestr("assets/www/index.html",b"<!doctype html>")
z.close()`,path.join(врем,'small.apk'));
 const звуки=path.join(врем,'sounds');fs.mkdirSync(path.join(звуки,'gvoice_pack','m'),{recursive:true});fs.mkdirSync(path.join(звуки,'voice'),{recursive:true});
 fs.writeFileSync(path.join(звуки,'gvoice_pack','m','p00001.flac'),Buffer.alloc(3000,7));fs.writeFileSync(path.join(звуки,'voice','a.flac'),Buffer.alloc(1200,9));
 fs.writeFileSync(path.join(звуки,'CREDITS.md'),'x');
 let отчёт='',состав={};
 try{отчёт=execFileSync('python3',[path.join(ROOT,'android','full-apk.py'),path.join(врем,'small.apk'),звуки,path.join(врем,'full.apk')],{encoding:'utf8'});
  состав=JSON.parse(zipPy(`import sys,zipfile,json
z=zipfile.ZipFile(sys.argv[1]);print(json.dumps({i.filename:[i.file_size,i.compress_type] for i in z.infolist()}))`,path.join(врем,'full.apk')));}catch(e){отчёт=String(e);}
 const сборщик=!!состав['AndroidManifest.xml']&&состав['AndroidManifest.xml'][1]===8&&!!состав['resources.arsc']&&!!состав['assets/www/index.html']
  &&!!состав['META-INF/androidx.webkit_webkit.version']&&!состав['META-INF/MANIFEST.MF']&&!состав['META-INF/GRANI.SF']&&!состав['META-INF/GRANI.RSA']
  &&JSON.stringify(состав['assets/www/sounds/gvoice_pack/m/p00001.flac'])==='[3000,0]'&&JSON.stringify(состав['assets/www/sounds/voice/a.flac'])==='[1200,0]'&&!!состав['assets/www/sounds/CREDITS.md'];
 fs.rmSync(врем,{recursive:true,force:true});
 const wa=fs.readFileSync(path.join(ROOT,'.github','workflows','android.yml'),'utf8'),ww=fs.readFileSync(path.join(ROOT,'.github','workflows','windows.yml'),'utf8');
 const андроид=/full-apk\.py "\$SMALL" sounds/.test(wa)&&/TARGET_SDK: '29'/.test(wa)&&/jarsigner .*-signedjar grani-mirov-[\d.]+-full\.apk/.test(wa)
  &&(wa.match(/install-check\.sh/g)||[]).length>=2&&/api-level: 31/.test(wa)&&!/gvoice_pack/.test(wa)&&!/3900e6|3,9 ГБ/.test(wa);
 const виндоус=/mv sounds "\$G"\//.test(ww)&&/mv \.\.\/build\/game "\$D\/resources\/game"/.test(ww)&&/7z a -tzip -mx=0/.test(ww)&&!/gvoice_pack\/\*\*/.test(ww)&&!/3900e6|3,9 ГБ/.test(ww);
 check('4. полные сборки при любом весе: один APK (ZIP64, подпись v1, проверка на Android 12 и 15) и один архив Windows; сборщик APK кладёт все записи без сжатия',
  сборщик&&андроид&&виндоус,{отчёт:отчёт.trim().slice(0,200),андроид,виндоус,состав:Object.keys(состав).length});

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

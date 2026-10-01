/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 225: СВОЯ СКЛЯНКА У КАЖДОГО РОДА ЗЕЛИЙ

   Шесть записей выпитого зелья (sounds/potion) разложены по родам зелий
   (POTION_SOUND).
   1. Шесть ролей банка (стеклянный флакон — общая cast_potion, остальные
      potion_*), у каждой свой файл, файлы на месте, все — FLAC 48 кГц / 24 бита.
   2. У каждого из зелий POTIONS своя склянка из этих шести, и в дело идут
      все шесть.
   3. Мана, здоровье, противоядие, сила, скорость и восстановление сил
      звучат разными склянками.
   4. Выпитое сваренное зелье звучит своей склянкой (лечебное, маны, силы).
   5. Зелье здоровья из лавки — долгий глоток, противоядие — флакон с
      пробкой; зелье посреди боя — короткий глоток.
   6. Общая роль cast_potion — стеклянный флакон, старых сборок не осталось.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.PLAYED=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(r);return b0(r,o);};});

 /* ── 1. Роли и файлы ── */
 const роли=await page.evaluate(()=>Object.keys(SOUND_BANK).filter(r=>/^potion_|^cast_potion$/.test(r)).map(r=>({r,f:SOUND_BANK[r].f,d:SOUND_BANK[r].d})));
 const файлы=роли.map(x=>x.f[0]);
 const формат=файлы.map(f=>{const п=path.join(ROOT,'sounds',f);if(!fs.existsSync(п))return f+": нет файла";
  const r=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,sample_rate,bits_per_raw_sample','-of','csv=p=0',п],{encoding:'utf8'}).trim();
  return r==="flac,48000,24"?"":f+": "+r;}).filter(Boolean);
 check('1. шесть ролей склянок со своим файлом, все FLAC 48 кГц / 24 бита',
  роли.length===6&&new Set(файлы).size===6&&роли.every(x=>x.f.length===1&&x.d)&&!формат.length,{роли:роли.map(x=>x.r),формат});

 /* ── 2–3. Разложено по зельям ── */
 const р=await page.evaluate(()=>({без:POTIONS.filter(p=>!SOUND_BANK[potionSound(p.id)]||!/^potion_|^cast_potion$/.test(potionSound(p.id))).map(p=>p.id),
  взято:[...new Set(POTIONS.map(p=>potionSound(p.id)))],
  главные:["mana","heal","antidote","strength","speed","energy"].map(potionSound)}));
 check('2. у каждого зелья своя склянка из шести, и в деле все шесть',
  !р.без.length&&р.взято.length===6,р);
 check('3. мана, здоровье, противоядие, сила, скорость и восстановление сил звучат разными склянками',
  new Set(р.главные).size===6,р.главные);

 /* ── 4. Выпить сваренное зелье ── */
 const в=await page.evaluate(()=>{const out={};
  for(const id of ["heal","mana","strength"]){
   G.potions=[{id,q:1,стаб:1,день:Number(G.day)||1,срок:10}];PLAYED.length=0;
   drinkPotion(0);out[id]=PLAYED.filter(r=>/^potion_|^cast_potion/.test(r));}
  while(activeLayer())closeTopUI();return out;});
 check('4. выпитое сваренное зелье звучит своей склянкой',
  в.heal.join()==="potion_long"&&в.mana.join()==="cast_potion"&&в.strength.join()==="potion_elixir",в);

 /* ── 5. Лавка и бой ── */
 const л=await page.evaluate(()=>{const out={};
  for(const n of ["Зелье здоровья","Противоядие"]){
   G.items=[n];PLAYED.length=0;G.hp=Math.max(1,G.hpMax-30);
   const row=invAll().find(x=>x.kind==="item"&&x.name===n);
   const a=ITEM_ACTIONS.find(x=>x.id==="drink");
   if(row)a.делать(row,invContext(),()=>true);
   out[n]={нашлось:!!row,звук:PLAYED.filter(r=>/^potion_|^cast_potion/.test(r))};}
  while(activeLayer())closeTopUI();
  /* ветка «выпить зелье» в бою */
  const бой=[...document.querySelectorAll("script")].map(s=>s.textContent).join("\n");
  const i=бой.indexOf('cbLog(`Зелье здоровья: +');const кусок=бой.slice(Math.max(0,i-200),i);
  out.бой=(кусок.match(/Bank\.play\("([a-z_]+)"/g)||[]).pop()||"";return out;});
 check('5. зелье здоровья из лавки — долгий глоток, противоядие — флакон с пробкой, в бою — короткий глоток',
  л["Зелье здоровья"].звук.join()==="potion_long"&&л["Противоядие"].звук.join()==="potion_cork"&&/potion_quick/.test(л.бой),л);

 /* ── 6. Общая роль ── */
 const о=await page.evaluate(()=>SOUND_BANK.cast_potion.f);
 const старые=fs.readdirSync(path.join(ROOT,'sounds','potion')).filter(f=>/potion_drink_/.test(f));
 check('6. общая роль cast_potion — стеклянный флакон, старых сборок не осталось',
  о.join()==="potion/potion_vial.flac"&&!старые.length,{о,старые});

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 212: 4.6 — ЗВУКИ КЛИНКОВ, ЩИТОВ И НАДЕВАНИЯ ВЕЩЕЙ

   Жалоба игрока: «меч по звуку бьёт как молот», у остального оружия то же;
   надевание и снятие доспехов, амулетов, колец и браслетов не слышно
   по-своему.

   1. Новые записи на месте: FLAC без потерь, у каждого файла строка в
      CREDITS.md и лицензия рядом.
   2. Меч, топор, кинжал и копьё бьют одной записью клинка по материалу:
      в их ударе нет глухих записей (lug_thud, lug_impact, lug_sword).
   3. В бою меч по плоти звучит режущим ударом клинка — и тяжёлый удар
      тоже без глухого отзвука; по голему — звон по броне; кинжал — укол,
      топор — рубка; булава по-прежнему бьёт глухо.
   4. Блок щитом звучит оковкой или деревом; без щита — парирование клинком.
   5. Род звука надевания: кольцо, амулет, браслет, щит, кольчуга, латы,
      кожа, ткань.
   6. «Надеть» и «Снять» в сумке играют свои записи: *_on и *_off.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.maybeEvent=()=>{};settings.effects=1;G.inCombat=false;G.combat=null;G.place=null;G.ship=null;
  window.PLAYED=[];const bp=Bank.play.bind(Bank);Bank.play=function(r,o){PLAYED.push(r);return bp(r,o);};});

 /* ── 1. файлы ── */
 const роли=await page.evaluate(()=>Object.keys(SOUND_BANK).filter(r=>/^(blade_(flesh|armor|clash|dagger|spear|axe|shield_metal|shield_wood)|equip_)/.test(r))
  .map(r=>({r,f:SOUND_BANK[r].f})));
 const нет=[],неFlac=[],безОписи=[];
 const описи={blade:fs.readFileSync(path.join(ROOT,'sounds/blade/CREDITS.md'),'utf8'),equip:fs.readFileSync(path.join(ROOT,'sounds/equip/CREDITS.md'),'utf8')};
 роли.forEach(({f})=>f.forEach(x=>{const p=path.join(ROOT,'sounds',x);
  if(!fs.existsSync(p))нет.push(x);else if(fs.readFileSync(p).slice(0,4).toString()!=='fLaC')неFlac.push(x);
  const d=x.split('/')[0];if(!описи[d]||описи[d].indexOf('`'+x.split('/')[1]+'`')<0)безОписи.push(x);}));
 const лицензии=['blade','equip'].every(d=>fs.existsSync(path.join(ROOT,'sounds',d,'LICENSE-CC-BY-SA-3.0.txt')));
 const всеФайлы=['blade','equip'].flatMap(d=>fs.readdirSync(path.join(ROOT,'sounds',d)).filter(f=>f.endsWith('.flac')).map(f=>d+'/'+f));
 const вБанке=new Set(роли.flatMap(x=>x.f));
 const лишние=всеФайлы.filter(f=>!вБанке.has(f));
 check('1. записи клинков и надевания на месте: FLAC, опись и лицензия, лишних нет',
  роли.length>=26&&!нет.length&&!неFlac.length&&!безОписи.length&&лицензии&&!лишние.length,{ролей:роли.length,нет,неFlac,безОписи,лицензии,лишние});

 /* ── 2. таблица ── */
 const табл=await page.evaluate(()=>{
  const глухие=/^(lug_thud|lug_impact|lug_sword|oc_general_hit)$/;
  const r={};["sword","axe","dagger","spear"].forEach(k=>{const m=WEAPON_SOUND[k];
   r[k]={solo:!!m.solo,глухих:["hit","hit_flesh","hit_armor"].flatMap(s=>m[s]||[]).filter(x=>глухие.test(x)),
    клинок:["hit","hit_flesh"].every(s=>(m[s]||[]).every(x=>/^blade_/.test(x)))};});
  r.mace=!WEAPON_SOUND.mace.solo&&WEAPON_SOUND.mace.hit.indexOf("lug_impact")>=0;
  return r;});
 check('2. клинки бьют записью клинка, без глухих ударов; булава — глухо',
  ["sword","axe","dagger","spear"].every(k=>табл[k].solo&&!табл[k].глухих.length&&табл[k].клинок)&&табл.mace,табл);

 /* ── 3. бой ── */
 const бой=await page.evaluate(async()=>{
  const ждать=ms=>new Promise(z=>setTimeout(z,ms));
  const удар=async(имя,тварь,урон)=>{G.equip.weapon={name:имя,slot:"weapon",id:"t_"+имя};
   G.combat={m:{id:тварь,n:тварь,hp:100,lvl:1}};PLAYED.length=0;playWeaponCombatSfx(true,"N",урон);await ждать(500);
   const p=PLAYED.slice();G.combat=null;return p;};
  return {меч:await удар("Стальной меч","wolf",6),мечТяж:await удар("Стальной меч","wolf",20),
   мечБроня:await удар("Стальной меч","golem",6),кинжал:await удар("Кинжал","wolf",6),
   топор:await удар("Боевой топор","wolf",6),булаваТяж:await удар("Булава","wolf",20)};});
 const глух=p=>p.some(x=>/^(lug_thud|lug_impact|lug_sword)$/.test(x));
 check('3. меч по плоти — режущий удар клинка, и тяжёлый тоже без глухого отзвука',
  бой.меч.includes("blade_flesh")&&!глух(бой.меч)&&бой.мечТяж.includes("blade_flesh")&&!глух(бой.мечТяж),{меч:бой.меч,тяж:бой.мечТяж});
 check('3. по голему — звон клинка о броню; кинжал — укол; топор — рубка; булава — глухо',
  бой.мечБроня.includes("blade_armor")&&бой.кинжал.includes("blade_dagger")&&бой.топор.includes("blade_axe")&&бой.булаваТяж.includes("lug_impact"),бой);

 /* ── 4. блок ── */
 const блок=await page.evaluate(()=>{
  const m=WEAPON_SOUND.sword;
  return {блок:m.block,парир:m.parry,
  };});
 check('4. блок щитом — оковка или дерево, парирование — звон клинка',
  блок.блок.every(x=>/^blade_shield_/.test(x))&&блок.парир[0]==="blade_clash",блок);

 /* ── 5. род звука надевания ── */
 const род=await page.evaluate(()=>({
  кольцо:equipSoundKind({name:"Серебряное кольцо"},"ring"),кольцо2:equipSoundKind({name:"Перстень"},"ring2"),
  амулет:equipSoundKind({name:"Амулет луны"},"amulet"),браслет:equipSoundKind({name:"Браслет"},"bracelet"),
  щит:equipSoundKind({name:"Дубовый щит"},"shield"),кольчуга:equipSoundKind({name:"Железная кольчуга"},"armor"),
  латы:equipSoundKind({name:"Стальные латы"},"armor"),кожа:equipSoundKind({name:"Кожаная куртка"},"armor"),
  плащ:equipSoundKind({name:"Плащ странника"},"cloak"),сапоги:equipSoundKind({name:"Сапоги"},"boots")}));
 check('5. у каждой вещи свой род звука надевания',
  род.кольцо==="ring"&&род.кольцо2==="ring"&&род.амулет==="amulet"&&род.браслет==="bracelet"&&род.щит==="shield"&&
  род.кольчуга==="chain"&&род.латы==="plate"&&род.кожа==="leather"&&род.плащ==="cloth"&&род.сапоги==="leather",род);

 /* ── 6. надеть и снять ── */
 const вещи=await page.evaluate(()=>{
  const r={};
  const it={name:"Серебряное кольцо",slot:"ring",id:"t_ring",rank:1,qual:1};
  G.gear.push(it);G.equip.ring=null;G.equip.ring2=null;
  PLAYED.length=0;
  const txt=invWearDo({it,kind:"gear"},"ring",t=>t);
  r.надето=G.equip.ring===it;r.текст=txt;r.звукНадеть=PLAYED.filter(x=>/^equip_/.test(x));
  PLAYED.length=0;
  const un=ITEM_ACTIONS.find(a=>a.id==="unequip");
  r.текстСнять=un.делать({kind:"equip",key:"ring"},{},t=>t);
  r.снято=!G.equip.ring;r.звукСнять=PLAYED.filter(x=>/^equip_/.test(x));
  const ch={name:"Железная кольчуга",slot:"armor",id:"t_chain",rank:1,qual:1};G.gear.push(ch);const prevA=G.equip.armor;G.equip.armor=null;
  PLAYED.length=0;invWearDo({it:ch,kind:"gear"},"armor",t=>t);r.кольчуга=PLAYED.filter(x=>/^equip_/.test(x));
  G.equip.armor=prevA;
  return r;});
 check('6. «Надеть» и «Снять» звучат своими записями вещи',
  вещи.надето&&вещи.звукНадеть.includes("equip_ring_on")&&вещи.снято&&вещи.звукСнять.includes("equip_ring_off")&&вещи.кольчуга.includes("equip_chain_on"),вещи);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

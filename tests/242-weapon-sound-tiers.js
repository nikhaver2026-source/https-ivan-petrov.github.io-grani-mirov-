/* ════════════════════════════════════════════════════════════════════════
   НАБОР 242: ЗВУК ОРУЖИЯ ПО КАЧЕСТВУ (8.5)

   Просьба игрока: у каждого рода оружия свой звук, и чем лучше вещь, тем
   лучше она звучит; все записи — в высоком качестве.
   1. Ступень звука растёт с редкостью и качеством; щербатое — ступенью ниже.
   2. У меча, кинжала, топора, булавы, посоха, копья, лука и арбалета свои
      роли; у меча, кинжала и лука ступени звучат разными записями.
   3. Все роли ступеней есть в банке, их файлы лежат в sounds/weapons, все
      без потерь (FLAC) и не тише 320 кбит/с.
   4. Легендарный и певучий клинок отзываются чарами, простой — нет.
   5. Арбалет звучит своим набором, лук — своим.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{enterGame();});await page.waitForTimeout(400);

 const r1=await page.evaluate(()=>({
  грубое:weaponTier({rank:0,qual:0}),простое:weaponTier({rank:0,qual:2}),добротное:weaponTier({rank:3,qual:3}),
  редкое:weaponTier({rank:5,qual:4}),легендарное:weaponTier({rank:8,qual:5}),
  щербатое:weaponTier({rank:3,qual:3,черты:["old"]})}));
 check('1. ступень растёт с качеством, щербатое — ниже',r1.грубое===0&&r1.простое===1&&r1.добротное===2&&r1.редкое===3&&r1.легендарное===4&&r1.щербатое===1,r1);

 const r2=await page.evaluate(()=>{const o={};
  ["sword","dagger","axe","mace","staff","spear","bow","crossbow"].forEach(k=>o[k]=!!WEAPON_TIERS[k]);
  o.мечРазных=new Set(WEAPON_TIERS.sword.swing).size;o.кинжалРазных=new Set(WEAPON_TIERS.dagger.swing).size;o.лукРазных=new Set(WEAPON_TIERS.bow.shoot).size;
  o.мечНеКинжал=WEAPON_TIERS.sword.swing[2]!==WEAPON_TIERS.dagger.swing[2];return o;});
 check('2. у всех родов свои роли, у меча, кинжала и лука ступени разные',Object.values(r2).every(v=>v===true||v>=3)&&r2.мечРазных>=5&&r2.лукРазных>=5,r2);

 const r3=await page.evaluate(()=>{const роли=new Set();
  Object.values(WEAPON_TIERS).forEach(m=>Object.values(m).forEach(ряд=>ряд.forEach(x=>x&&роли.add(x))));
  const нет=[...роли].filter(x=>!Bank.has(x));
  const файлы=[...роли].filter(x=>/^w_/.test(x)).map(x=>SOUND_BANK[x].f).flat();
  return {ролей:роли.size,нет,файлы};});
 const ROOT=path.resolve(__dirname,'..');
 const плохие=[];
 for(const f of r3.файлы){const p=path.join(ROOT,'sounds',f);
  if(!fs.existsSync(p)){плохие.push(f+' нет');continue;}
  if(!/\.flac$/i.test(f)){плохие.push(f+' не flac');continue;}
  const b=fs.readFileSync(p);if(b.slice(0,4).toString()!=='fLaC')плохие.push(f+' не flac внутри');
  /* битрейт: размер / длительность из STREAMINFO */
  const sr=(b[18]<<12)|(b[19]<<4)|(b[20]>>4);
  const tot=((b[21]&0x0f)*2**32)+((b[22]<<24)>>>0)+(b[23]<<16)+(b[24]<<8)+b[25];
  const кбит=tot&&sr?b.length*8/(tot/sr)/1000:0;
  if(кбит<320)плохие.push(f+' '+Math.round(кбит)+' кбит/с');}
 check('3. роли ступеней в банке, файлы на месте, без потерь, не ниже 320 кбит/с',!r3.нет.length&&r3.файлы.length>=30&&!плохие.length,{ролей:r3.ролей,файлов:r3.файлы.length,нет:r3.нет,плохие});

 const r4=await page.evaluate(async()=>{const o={};
  const играли=[];const p=Bank.play.bind(Bank);Bank.play=(r,x)=>{играли.push(r);return p(r,x);};
  const мечи=[{name:"Простой меч",type:"Меч",slot:"weapon",rank:0,qual:1},{name:"Легендарный меч",type:"Меч",slot:"weapon",rank:8,qual:5},{name:"Певучий меч",type:"Меч",slot:"weapon",rank:1,qual:1,черты:["sung"]}];
  for(const m of мечи){G.equip.weapon=m;играли.length=0;weaponSound("swing",{one:true});await new Promise(r=>setTimeout(r,120));o[m.name]={роли:играли.slice(),чары:играли.includes("magic_shimmer")};}
  Bank.play=p;return o;});
 check('4. легендарный и певучий клинок отзываются чарами, простой — нет',!r4["Простой меч"].чары&&r4["Легендарный меч"].чары&&r4["Певучий меч"].чары&&r4["Простой меч"].роли[0]!==r4["Легендарный меч"].роли[0],r4);

 const r5=await page.evaluate(()=>{const o={};
  G.equip.weapon={name:"Тяжёлый арбалет",type:"Арбалет",slot:"weapon",rank:2,qual:2};o.арбалет=weaponSoundClass();weaponSound("shoot",{one:true});o.арбалетЗвук=G.lastWeaponSound.role;
  G.equip.weapon={name:"Длинный лук",type:"Лук",slot:"weapon",rank:2,qual:2};o.лук=weaponSoundClass();weaponSound("shoot",{one:true});o.лукЗвук=G.lastWeaponSound.role;
  o.дальность=weaponClass();return o;});
 check('5. арбалет звучит своим набором, лук — своим',r5.арбалет==="crossbow"&&r5.лук==="bow"&&/xbow/.test(r5.арбалетЗвук)&&/bow_shoot/.test(r5.лукЗвук),r5);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();

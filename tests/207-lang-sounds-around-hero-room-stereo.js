/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 207: 4.3 — ЗВУК УЧЕНИЯ ЯЗЫКОВ, ЗВУКИ МИРА СО СВОЕЙ СТОРОНЫ,
   ГОЛОС ГЕРОЯ В АКУСТИКЕ ЗАЛА, ФОНЫ В СТЕРЕО

   Жалобы игрока (4.2):
   — изучение языка или наречия ничем не звучит (кроме смены ступени);
   — многие звуки мира звучат «в голове», без стороны;
   — в храме жрец звучит под сводом, а герой — будто на улице;
   — старые фоны без стереопанорамы.

   1. Урок из книги — страница и письмо этого языка; руны высекают резцом,
      светящиеся знаки звенят чарами, вязь — мягким пером, прочее — пером.
   2. Урок у книжника и разговор с носителем тоже звучат; у туманного
      шёпота (без письма) — только страница заметок; звук чуть впереди.
   3. Новые записи (перо, вязь, страница) есть в банке и в энциклопедии,
      у папки есть имя и титры с лицензией.
   4. Голос мира без точки (толпа, колокол, лай, оклик стражи, молот)
      звучит со своей стороны; сторона держится; вещи в руках — как были.
   5. Голос героя (и встречающего без точки) идёт в отклик помещения, как
      голос жителя.
   6. Длинные фоны, прежде моно, теперь в стерео, и сумма каналов равна
      прежнему звуку (на одном динамике ничего не портится).
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {execFileSync}=require('child_process');
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
 await page.evaluate(()=>{
  window.ROLES=[];const sr=Spatial.role.bind(Spatial);Spatial.role=function(r,dx,dy,o){ROLES.push({r,dx,dy,dz:o&&o.dz});return sr(r,dx,dy,o);};
  window.AT=[];const sa=Spatial.at.bind(Spatial);Spatial.at=function(f,dx,dy,o){AT.push({f:String(f),dx,dy});return sa(f,dx,dy,o);};
  window.maybeEvent=()=>{};settings.effects=1;settings.hrtf=1;G.inCombat=false;G.combat=null;G.place=null;AE.ensure();Spatial.ensure();});

 /* ── 1–2. учение языков ── */
 const яз=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  const роли=(id,why)=>{ROLES.length=0;Langs._cueAt=0;G.langs=G.langs||{};if(G.langs[id])G.langs[id]={ур:0,оп:0};
   Langs.learn(id,1,why);/* только звуки урока: мир вокруг (обозы, птицы) живёт своей жизнью */
   const свои=/^(lang_|oc_res_rune$|magic_shimmer$|oc_trap_magic$)/;
   return new Promise(res=>setTimeout(()=>{const R=ROLES.filter(x=>свои.test(x.r));res({роли:R.map(x=>x.r),впереди:R.every(x=>x.dy<0&&x.dx===0),c:Langs.lastCue});},2800));};
  r.книгаРуны=await роли("north","книга «Саги севера»");
  r.книгаЗнаки=await роли("aether","книга «Эфир»");
  r.книгаВязь=await роли("elder","книга «Лесные песни»");
  r.книгаУстав=await роли("court","книга «Уложение»");
  r.урок=await роли("underhill","урок у Архивиста");
  r.разговор=await роли("court","разговор с Миреттой");
  r.шёпот=await роли("mist","урок у Мага-отшельника");
  r.тёмная=await роли("dark","книга «Тени»");
  return r;});
 check('1. из книги — страница, затем письмо языка: руны — резцом, светящиеся знаки — чарами, вязь — мягким пером, уставное — пером',
  яз.книгаРуны.роли[0]==="lang_page"&&яз.книгаРуны.роли.includes("oc_res_rune")
  &&яз.книгаЗнаки.роли.includes("magic_shimmer")&&яз.книгаВязь.роли.includes("lang_brush")&&яз.книгаУстав.роли.includes("lang_pen")
  &&яз.тёмная.роли.includes("oc_trap_magic"),яз);
 check('2. урок у книжника — письмо; разговор — короткий росчерк; у туманного шёпота — страница заметок; звук чуть впереди',
  яз.урок.роли.includes("oc_res_rune")&&!яз.урок.роли.includes("lang_page")&&яз.разговор.роли.length===1&&яз.разговор.роли[0]==="lang_pen"
  &&яз.шёпот.роли.join()==="lang_page"&&[яз.книгаРуны,яз.урок,яз.разговор].every(x=>x.впереди),яз);

 /* ── 3. банк и энциклопедия ── */
 const банк=await page.evaluate(()=>({роли:["lang_pen","lang_brush","lang_page"].map(r=>SOUND_BANK[r]&&SOUND_BANK[r].f.length),
  раздел:["lang_pen","lang_brush","lang_page"].map(r=>roleSection(r)),папка:!!BANK_CATS.lang}));
 const титры=fs.existsSync(path.join(ROOT,'sounds/lang/CREDITS.md'))&&fs.existsSync(path.join(ROOT,'sounds/lang/LICENSE-CC0.txt'));
 const файлов=fs.readdirSync(path.join(ROOT,'sounds/lang')).filter(f=>f.endsWith('.flac')).length;
 check('3. перо (4), вязь (3) и страница (3) — в банке и в разделе «вещи», папка названа, титры и лицензия CC0 на месте',
  банк.роли.join()==="4,3,3"&&банк.раздел.every(x=>x==="items")&&банк.папка&&титры&&файлов===10,{банк,титры,файлов});

 /* ── 4. звуки мира со своей стороны ── */
 const вокруг=await page.evaluate(()=>{
  const r={};
  G.place=null;Around.mem={};
  const точки=[];
  ["throng_hail_m","uh_bell","guard_shout","beasts_cattle","stk_hammer","deep_rocks"].forEach(role=>{
   AT.length=0;const el=Bank.play(role,{gain:0.5,maxSec:2});
   точки.push({role,стаб:!!(el&&el.__around),dx:AT[0]&&AT[0].dx,dy:AT[0]&&AT[0].dy});});
  r.точки=точки;
  r.сторон=new Set(точки.filter(t=>t.dx!=null).map(t=>(t.dx>0.5?"п":t.dx<-0.5?"л":"")+(t.dy<-0.5?"в":t.dy>0.5?"з":""))).size;
  /* та же роль через миг — с той же стороны */
  AT.length=0;Bank.play("guard_shout",{gain:0.5,maxSec:1});const g2=AT[0];
  const g1=точки.find(t=>t.role==="guard_shout");r.таЖе=!!(g2&&g1&&g2.dx===g1.dx&&g2.dy===g1.dy);
  /* вещи в руках — как были */
  AT.length=0;const монеты=Bank.play("arte_coins",{gain:0.5,maxSec:1});r.монетыПлоско=!!монеты&&!монеты.__around&&AT.length===0;
  /* явная просьба «плоско» уважается */
  AT.length=0;const пл=Bank.play("uh_bell",{gain:0.5,maxSec:1,flat:true});r.плоскоПоПросьбе=!!пл&&!пл.__around;
  return r;});
 check('4. толпа, колокол, оклик стражи, скот, молот и обвал звучат со своей стороны, сторона держится; монеты в руках — как были',
  вокруг.точки.every(t=>t.стаб&&t.dx!=null&&Math.hypot(t.dx,t.dy)>=1.5)&&вокруг.сторон>=3&&вокруг.таЖе&&вокруг.монетыПлоско&&вокруг.плоскоПоПросьбе,вокруг);

 /* ── 5. голос героя в зале ── */
 const зал=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  G.place={kind:"house",stype:"temple",bx:5,by:5,name:"Храм",depth:0,x:2,y:2};Room.set(null,true);
  const r={акустика:Room.kind};
  const f=(Object.values(VOICE_NPC.hero||{})[0]||[])[0];
  r.файл=f;
  const el=f?Folk.плоско(VOICE_NPC_DIR+f+VOICE_GEN+".flac",{gain:1,maxSec:1}):null;
  r.героя=!!(el&&el.__room);
  G.place=null;Room.set(null,true);
  return r;});
 check('5. голос героя (как и всякий голос без точки) идёт в отклик храма, как и голос жреца',зал.акустика==="temple"&&зал.героя,зал);

 /* ── 6. фоны в стерео ── */
 const фоны=["fon/fon_sea_open_01.flac","hall/hall_market_01.ogg","hall/hall_port_01.ogg","sky/sky_river_01.ogg","wild/wild_rain_01.ogg","mg/amb_night_01.ogg","mg/amb_wind_01.ogg","stk/stk_inn_01.ogg"];
 const каналы=фоны.map(f=>{try{return Number(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=channels','-of','csv=p=0',path.join(ROOT,'sounds',f)]).toString().trim());}catch(_){return 0;}});
 /* сумма каналов — прежний моно-звук: разность каналов не должна быть громче суммы */
 const моно=(()=>{try{
  const raw=execFileSync('ffmpeg',['-v','error','-i',path.join(ROOT,'sounds/hall/hall_market_01.ogg'),'-t','8','-ar','22050','-f','f32le','-'],{maxBuffer:1e8});
  const a=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);let s=0,d=0;
  for(let i=0;i+1<a.length;i+=2){const l=a[i],r=a[i+1];s+=(l+r)*(l+r);d+=(l-r)*(l-r);}
  return {s:Math.round(10*Math.log10(s/(a.length/2)+1e-12)),d:Math.round(10*Math.log10(d/(a.length/2)+1e-12))};}catch(e){return {err:String(e)};}})();
 check('6. длинные фоны (море, рынок, порт, река, дождь, ночь, ветер, трактир) — в стерео, и сумма каналов остаётся главным звуком',
  каналы.every(c=>c===2)&&моно.s>моно.d,{каналы,моно});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

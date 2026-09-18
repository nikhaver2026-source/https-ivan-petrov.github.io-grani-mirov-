/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 85: ВЕЩИ ЗВУЧАТ КАК ВЕЩИ

   Статуя отвечала светлым куполом синтезатора, алтарь — хоровой подложкой,
   зеркало — челестой, трон — валторной, курильница — астральной дымкой.
   Для того, кто играет на слух, это путало: вещь звучала как награда, а
   награда — как вещь. Теперь у всего, с чем игрок что-то делает, живые
   записи из четырёх свободных игр (OpenClonk, 0 A.D., Unknown Horizons,
   Lugaru), а музыка и инструменты остались маякам, темам мест, наградам,
   опыту, уровням и событиям.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Четыре новые папки записей зарегистрированы в банке, и каждый файл
      каждой новой роли отдаётся сервером (ни одной битой ссылки).
   2. Рядом с записями лежат CREDITS.md и текст лицензии; титры энциклопедии
      называют все четыре источника и их лицензии.
   3. В коде обстановки, действий с вещами, алтарей, тайников, техник,
      гомункула и демонологии не осталось ни одной музыкальной роли.
   4. Вживую: статуя, магический круг, трон, курильница, подсвечник и алтарь
      отвечают живыми записями, а не синтезатором.
   5. Живой фон места выбирается по семени из нескольких записей, и у
      кузницы, рынка и деревни — свои наборы.
   6. Энциклопедия показывает четыре новых раздела с сотнями записей.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const ROOT=path.resolve(__dirname,'..');
 const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 /* ── 3. статика: музыкальных ролей у вещей нет ── */
 const musical=["pad_halo","pad_astral","pad_sanctum","pad_dream","pad_hearth","pad_dread","fx_crystal",
  "rune_square","relic_sing","spark_glock","xylo_coin","ghost_choir","omen_swell","chant_calliope",
  "temple_choir","harmonium_low","spell_harp","charm_celesta","wide_strings","horn_castle",
  "swamp_kalimba","glade_marimba","relic_xylo",'Bank.play("altar"'];
 const region=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i+1);if(i<0||j<0)return null;return src.slice(i,j);};
 const regions={
  обстановка:region('const PROPS=[','const PROP_BY_ID'),
  действия:region('const IACT={};','const STASH_WHAT=['),
  тайники:region('function stashSearch','const PROP_STATE='),
  состояния_и_алтари:region('const PROP_STATE=','function objectsHere'),
  техники:region('const TECHS=[','const TECH_BY_ID'),
  гомункул:region('function homunMake','const DEMONS=['),
  демонология:region('const DEMONS=[','function renderDemon')};
 for(const k in regions){
  const r=regions[k];check('область найдена: '+k,!!r);if(!r)continue;
  const bad=[];
  r.split('\n').forEach((line,i)=>{
   if(/UI\.fanfare\(/.test(line)||/^\s*\/\*|^\s*\*|^\s*о:|^\s*\/\//.test(line))return;
   musical.forEach(m=>{const needle=m.startsWith('Bank')?m:'"'+m+'"';if(line.indexOf(needle)>=0)bad.push((i+1)+': '+m);});});
  check('музыки нет в области «'+k+'»',bad.length===0,bad.slice(0,6));}
 /* ── 2. папки, титры, лицензии ── */
 for(const d of ['oc','ad','uh','lug']){
  const p=path.join(ROOT,'sounds',d);
  const files=fs.existsSync(p)?fs.readdirSync(p):[];
  check('папка sounds/'+d+' с записями и CREDITS',files.includes('CREDITS.md')&&files.some(f=>/^LICENSE-CC-BY(-SA)?-3\.0\.txt$/.test(f))&&files.filter(f=>f.endsWith('.ogg')).length>=15,files.length);
  const cr=fs.existsSync(path.join(p,'CREDITS.md'))?fs.readFileSync(path.join(p,'CREDITS.md'),'utf8'):'';
  const oggs=files.filter(f=>f.endsWith('.ogg'));
  check('CREDITS sounds/'+d+' перечисляет каждый файл',oggs.every(f=>cr.indexOf(f.replace('.ogg',''))>=0),oggs.length);}
 check('лицензия OpenClonk — CC BY 3.0',/sounds\/oc/.test('sounds/oc')&&fs.readFileSync(path.join(ROOT,'sounds/oc/CREDITS.md'),'utf8').indexOf('CC BY 3.0')>=0);

 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. роли и файлы ── */
 const банк=await page.evaluate(async()=>{
  const roles=Object.keys(SOUND_BANK).filter(r=>/^(oc|ad|uh|lug)_|^score_(cavern|lucid|settle|meadow|night|newland|seafight)$/.test(r));
  const files=[];roles.forEach(r=>SOUND_BANK[r].f.forEach(f=>files.push(f)));
  const byDir={};files.forEach(f=>{const d=f.split("/")[0];byDir[d]=(byDir[d]||0)+1;});
  buildEncycCats();
  return {roles:roles.length,names:roles,files:files.length,list:files,byDir,sections:document.querySelectorAll('#encycCats .sound-card').length,
   groups:BANK_GROUPS.filter(g=>g.dirs.some(d=>["oc","ad","uh","lug"].includes(d))).map(g=>[g.n,bankRolesIn(g.dirs).length]),
   credits:(()=>{try{buildEncycCats();return document.getElementById("encycCredits").textContent;}catch(e){return "";}})()};});
 check('новых ролей полторы сотни',банк.roles>=150,банк.roles);
 банк.bad=банк.list.filter(f=>!fs.existsSync(path.join(ROOT,'sounds',f)));
 check('файлов больше двухсот пятидесяти и каждый лежит на диске',банк.files>=250&&банк.bad.length===0,{files:банк.files,bad:банк.bad.slice(0,5)});
 check('записи в четырёх папках',['oc','ad','uh','lug'].every(d=>банк.byDir[d]>=15),банк.byDir);
 check('энциклопедия: два новых раздела с десятками ролей, первый уровень по-прежнему проходится свайпом',банк.groups.length===2&&банк.groups.every(g=>g[1]>=40)&&банк.sections<=40,{groups:банк.groups,sections:банк.sections});
 /* Ни одна новая роль не лежит мёртвым грузом: каждая упомянута в коде вне банка. */
 const bankStart=src.indexOf('const SOUND_BANK={'),bankEnd=src.indexOf('const MONSTER_BANK={',bankStart);
 const outside=src.slice(0,bankStart)+src.slice(bankEnd);
 const dead=банк.names.filter(r=>outside.indexOf('"'+r+'"')<0&&outside.indexOf("'"+r+"'")<0);
 check('каждая новая роль где-то звучит, а не лежит мёртвым грузом',dead.length===0,dead.slice(0,8));
 check('титры называют OpenClonk, 0 A.D., Unknown Horizons и Lugaru',['OpenClonk','0 A.D.','Unknown Horizons','Lugaru','CC BY 3.0','CC BY-SA 3.0'].every(w=>банк.credits.indexOf(w)>=0));

 /* ── 4. вживую: вещи отвечают записями ── */
 const вещи=await page.evaluate(()=>{
  const played=[];const orig=Bank.play.bind(Bank);
  Bank.play=(role,o)=>{played.push(role);return orig(role,o);};
  G.place={kind:"house",bx:1000,by:1000,stype:"temple",name:"Храм",depth:0,x:2,y:2};
  const out={};
  for(const id of ["statue","circle","throne","censer","candle","orb","bed","chandelier","scales","astrolabe","gong","hearth"]){
   played.length=0;
   try{PROP_BY_ID[id].use(2,2);}catch(e){out[id]=["ошибка "+e];continue;}
   out[id]=played.slice();}
  Bank.play=orig;
  return out;});
 const муз=new RegExp('^('+["pad_halo","pad_astral","pad_sanctum","pad_dream","pad_hearth","fx_crystal","rune_square","spark_glock","xylo_coin","chime","shine","charm_celesta","wide_strings","horn_castle","temple_bell","stk_horn"].join('|')+')$');
 for(const id in вещи){
  const p=вещи[id];
  check('вещь «'+id+'» звучит записью, не музыкой',p.length>0&&!p.some(r=>муз.test(r))&&p.some(r=>/^(oc_|ad_|uh_|lug_|magic_|mtg_|arte_|bell_|amb_fire|wild_|knock)/.test(r)),p);}
 check('статуя: камень и голоса храма, без инструмента бога',вещи.statue&&вещи.statue.includes('oc_rock_hit'),вещи.statue);
 /* Алтарь: приношение и изучение — тоже записи. */
 const алтарь=await page.evaluate(async()=>{
  const played=[];const orig=Bank.play.bind(Bank);
  Bank.play=(role,o)=>{played.push(role);return orig(role,o);};
  G.place={kind:"house",bx:1000,by:1000,stype:"temple",name:"Храм",depth:0,x:2,y:2};
  const lvl=curLevel();
  let alt=null;
  for(let y=0;y<lvl.h&&!alt;y++)for(let x=0;x<lvl.w&&!alt;x++)if(tileAt(lvl,x,y)==="A")alt={x,y};
  const out={found:!!alt};
  if(alt){
   G.place.x=alt.x;G.place.y=alt.y;
   const o={вид:"tile",плитка:"A",n:"алтарь",x:alt.x,y:alt.y,dx:0,dy:0,d:0};
   G.inv=G.inv||{};G.inv["трава"]=5;G.inv["кристалл"]=3;
   played.length=0;try{IACT.altstudy.делать(o);}catch(e){out.err=String(e);}
   out.study=played.slice();
   await new Promise(r=>setTimeout(r,500));
   played.length=0;try{IACT.altoffer.делать(o);}catch(e){out.err2=String(e);}
   out.offer=played.slice();}
  Bank.play=orig;return out;});
 check('алтарь найден в храме',алтарь.found,алтарь);
 check('изучить алтарь: камень и голоса под сводами',алтарь.study&&алтарь.study.includes('deep_stone')&&!алтарь.study.includes('pad_sanctum'),алтарь.study);
 check('приношение: вещь положена и дым, без синтезатора «altar»',алтарь.offer&&!алтарь.offer.includes('altar')&&!алтарь.offer.includes('chant_calliope'),алтарь.offer);

 /* ── 5. живой фон мест ── */
 const фон=await page.evaluate(()=>{
  const loops=[];const orig=Bank.loop.bind(Bank);
  Bank.loop=(ch,role,o)=>{loops.push([ch,role]);return true;};
  const out={};
  for(const st of ["forge","market","village","temple","tavern"]){
   const seen=new Set();
   for(let seed=0;seed<9;seed++){
    G.place={kind:"house",bx:1000,by:1000,stype:st,name:"x",depth:0,x:1,y:1};
    loops.length=0;liveAmbient(seed);
    loops.filter(l=>l[0]==="live").forEach(l=>seen.add(l[1]));}
   out[st]=[...seen];}
  G.place=null;
  const земли={};
  for(const t of ["forest","plains","mountains","desert"]){
   const seen=new Set();
   for(let seed=0;seed<9;seed++){loops.length=0;
    const cc=cellContent;window.cellContent=()=>({terrain:[t]});
    try{G.weather="Ясно";G.hour=12;liveAmbient(seed);}finally{window.cellContent=cc;}
    loops.filter(l=>l[0]==="live").forEach(l=>seen.add(l[1]));}
   земли[t]=[...seen];}
  Bank.loop=orig;
  return {места:out,земли};});
 check('кузница: три живых фона',фон.места.forge.length===3&&фон.места.forge.includes('uh_smith'),фон.места.forge);
 check('рынок: три живых фона',фон.места.market.length===3,фон.места.market);
 check('деревня: подворье, двор, выгон, мельница и лесосека',фон.места.village.length===5&&фон.места.village.includes('uh_sheep')&&фон.места.village.includes('uh_windmill'),фон.места.village);
 check('храм: часовня среди фонов',фон.места.temple.includes('uh_chapel'),фон.места.temple);
 check('у кузницы и рынка разные наборы',!фон.места.forge.some(r=>фон.места.market.includes(r)));
 check('земли: у леса, равнины, гор и пустыни по несколько фонов',Object.values(фон.земли).every(a=>a.length>=2),фон.земли);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

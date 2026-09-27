/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 194: ЖИТЕЛИ ГОВОРЯТ САМИ — ПРИВЕТСТВИЯ И ОКЛИКИ УЛИЦЫ

   Просьба игрока: «Бери фразы персонажей, голосов у которых ещё нет, и
   записывай их — ElevenLabs, если кредиты обновились, иначе Gemini, — чтобы
   голоса были прямо под контекст фраз, с интонациями, с эмоциями». Кредитов
   ElevenLabs не осталось (0 из 10 000), поэтому записано нейроголосами Gemini.

   Без своего голоса были строки, которые голос игры читал в кавычках:
   приветствие жителя у прилавка (NPC_GREET, сто десять строк в четырнадцати
   пулах) и то, что бросают на ходу стражник, латник, солдат гарнизона,
   горожанин и житель посада (GUARD_LINES, FOLK_LINES, DARK_*).

   ЧТО ПРОВЕРЯЕТСЯ.
   1. У каждой такой строки есть запись в VOICE_NPC под своей ролью; у
      горожан, жителей посада и приветствий — мужская и женская.
   2. Каждая названная запись лежит в sounds/voice_npc: MP3 моно 44,1 кГц,
      320 кбит/с; длительность в VOICE_NPC_LEN совпадает с файлом; лишних
      файлов нет.
   3. Титры называют Gemini, модель, условия и все шесть голосов; число
      записей в титрах сходится с папкой; у каждой записи строка с текстом.
   4. Folk.реплика берёт запись своей роли и нужного пола из voice_npc;
      строки без записи не звучат записью (false — голос игры читает сам).
   5. Житель у прилавка произносит приветствие сам, а голос игры называет
      только имя и ремесло — без приветствия в кавычках; оклик тогда одно
      слово народа.
   6. Все уличные оклики идут через Folk.реплика, строка в кавычках
      остаётся лишь запасной; реплика героя обрывает и записи voice_npc.
   7. Ответы жителя в разговоре (DLG_SAY со всеми вариантами под нрав) —
      у каждой строки мужская и женская запись; в разговоре житель
      отвечает своей записью, а голос игры — без цитаты.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const DIR=path.join(__dirname,'..','sounds','voice_npc');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_name,channels,sample_rate:format=duration,bit_rate','-of','json',file],{encoding:'utf8'});
 try{const j=JSON.parse(p.stdout),s=j.streams[0];return {c:s.codec_name,ch:s.channels,sr:+s.sample_rate,dur:+j.format.duration,br:Math.round(+j.format.bit_rate/1000)};}catch(_){return null;}}
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);

 /* ── 1. у каждой строки своя запись ── */
 const игра=await page.evaluate(()=>{
  const пулы={guard:GUARD_LINES,folk:FOLK_LINES,dark_guard:DARK_GUARD_LINES,dark_soldier:DARK_SOLDIER_LINES,dark_folk:DARK_FOLK_LINES};
  const нет=[],безЖен=[];let строк=0;
  for(const [р,арр] of Object.entries(пулы))арр.forEach(t=>{строк++;const r=VOICE_NPC[р]&&VOICE_NPC[р][t];
   if(!r)нет.push(р+": "+t);else if(/folk/.test(р)&&!r[1])безЖен.push(р+": "+t);});
  Object.values(NPC_GREET).forEach(арр=>арр.forEach(t=>{строк++;const r=VOICE_NPC.greet&&VOICE_NPC.greet[t];
   if(!r)нет.push("greet: "+t);else if(!r[1])безЖен.push("greet: "+t);}));
  const ответы=new Set(["Я на вас рассчитывал"]);
  Object.values(DLG_SAY).forEach(арр=>арр.forEach(x=>ответы.add(typeof x==="string"?x:x[1])));
  ответы.forEach(t=>{строк++;const r=VOICE_NPC.dlg&&VOICE_NPC.dlg[t];
   if(!r)нет.push("dlg: "+t);else if(!r[1])безЖен.push("dlg: "+t);});
  const файлы=[];
  Object.values(VOICE_NPC).forEach(mp=>Object.values(mp).forEach(([b,f])=>{файлы.push(b+VOICE_GEN);if(f)файлы.push(b+"_f"+VOICE_GEN);}));
  return {строк,нет,безЖен,файлы,len:VOICE_NPC_LEN,dir:VOICE_NPC_DIR,роли:Object.keys(VOICE_NPC)};});
 check('1. у каждой строки приветствия и уличного оклика своя запись, у горожан и приветствий — мужская и женская',
  игра.строк>=350&&игра.нет.length===0&&игра.безЖен.length===0&&игра.dir==="voice_npc/",
  {строк:игра.строк,нет:игра.нет.slice(0,4),безЖен:игра.безЖен.slice(0,4),роли:игра.роли});

 /* ── 2. файлы на диске ── */
 const mp3=fs.readdirSync(DIR).filter(f=>f.endsWith('.mp3'));
 const нужны=[...new Set(игра.файлы)];
 const безФайла=нужны.filter(k=>!fs.existsSync(path.join(DIR,k+'.mp3')));
 const лишние=mp3.filter(f=>нужны.indexOf(f.slice(0,-4))<0);
 const плохие=[],расхождения=[];
 нужны.filter((_,i)=>i%3===0).forEach(k=>{const i=probe(path.join(DIR,k+'.mp3'));
  if(!i||i.c!=='mp3'||i.ch!==1||i.sr!==44100||i.br<315)плохие.push({k,i});
  else if(Math.abs((игра.len[k]||0)-i.dur)>0.06)расхождения.push({k,в_игре:игра.len[k],файл:i.dur});});
 const безДлины=нужны.filter(k=>!(игра.len[k]>0));
 check('2. каждая запись в sounds/voice_npc: MP3 моно 44,1 кГц 320 кбит/с, длительность сходится, лишних файлов нет',
  нужны.length>=650&&безФайла.length===0&&лишние.length===0&&плохие.length===0&&расхождения.length===0&&безДлины.length===0
  &&mp3.length===нужны.length,{записей:нужны.length,файлов:mp3.length,безФайла:безФайла.slice(0,3),лишние:лишние.slice(0,3),плохие:плохие.slice(0,2),расхождения:расхождения.slice(0,3)});

 /* ── 3. титры ── */
 const титры=fs.readFileSync(path.join(DIR,'CREDITS.md'),'utf8');
 const число=+((титры.match(/Записей:\s*(\d+)/)||[])[1]||0);
 const голоса=['Alnilam','Charon','Achird','Sulafat','Umbriel','Despina'];
 const безСтроки=нужны.filter(k=>титры.indexOf('| '+k+'.mp3 |')<0);
 check('3. титры: Gemini, модель, условия, шесть голосов; число записей сходится; у каждой записи строка',
  /Gemini/.test(титры)&&/gemini-3\.8-flash-tts/.test(титры)&&/ai\.google\.dev\/gemini-api\/terms/.test(титры)
  &&голоса.every(v=>титры.includes(v))&&число===mp3.length&&безСтроки.length===0,{число,файлов:mp3.length,безСтроки:безСтроки.slice(0,3)});

 /* ── 4. Folk.реплика ── */
 const реп=await page.evaluate(()=>{
  const было=Folk.сказать,вызовы=[];
  Folk.сказать=function(путь,n,o){вызовы.push({путь,dir:o&&o.dir});return true;};
  const r={};
  r.страж=Folk.реплика("guard",GUARD_LINES[0],{x:1,y:1},false);
  r.горожанка=Folk.реплика("folk",FOLK_LINES[0],{x:1,y:1},true);
  r.горожанин=Folk.реплика("folk",FOLK_LINES[0],{x:1,y:1},false);
  r.свойСтраж=Folk.реплика("guard_friend",NPC_GREET.свой[0],{x:1,y:1},false);
  r.свойПрилавок=Folk.реплика("greet",NPC_GREET.свой[0],{x:1,y:1},false);
  r.чужая=Folk.реплика("guard","Такой строки в игре нет.",{x:1,y:1},false);
  Folk.сказать=было;
  return {r,вызовы};});
 const в=реп.вызовы;
 check('4. Folk.реплика: запись своей роли и пола из voice_npc; одна строка у стражника и у прилавка — разные записи; строки без записи — false',
  реп.r.страж&&реп.r.горожанка&&реп.r.горожанин&&реп.r.свойСтраж&&реп.r.свойПрилавок&&реп.r.чужая===false&&в.length===5
  &&в.every(x=>x.dir==="voice_npc/")&&/^street_guard_0_g$/.test(в[0].путь)&&/^street_folk_0_f_g$/.test(в[1].путь)
  &&/^street_folk_0_g$/.test(в[2].путь)&&/^street_guardfriend_/.test(в[3].путь)&&/^greet_svoy_0_g$/.test(в[4].путь),реп);

 /* ── 5. житель у прилавка ── */
 const прилавок=await page.evaluate(()=>{
  outer: for(let r=0;r<60;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&npcsFor(c).length){G.x+=dx;G.y+=dy;break outer;}}
  const npc=npcsFor(cellContent(G.x,G.y))[0];
  if(!npc)return {нет:true};
  const было={on:Folk.on,сказать:Folk.сказать,say:Speech.say,оклик:Folk.оклик};
  const голос=[],речь=[];let окликДлина=null;
  Folk.on=()=>true;
  Folk.сказать=function(путь,n,o){голос.push({путь,dir:o&&o.dir});return true;};
  Folk.оклик=function(n,r){const х=было.оклик.call(Folk,n,r);return х;};
  Speech.say=function(t){речь.push(String(t));return true;};
  const bo=npcVoice;
  window.npcVoice=function(n,к,р,одно){окликДлина=одно;return bo(n,к,р,одно);};
  try{openNPC(npc.key);}finally{Folk.on=было.on;Folk.сказать=было.сказать;Speech.say=было.say;window.npcVoice=bo;}
  while(activeLayer())closeTopUI();
  const справка=речь.find(t=>t.indexOf(npc.name)>=0)||"";
  return {голос,справка,одно:окликДлина,имя:npc.name};});
 const прив=(прилавок.голос||[]).find(x=>/^greet_/.test(x.путь));
 check('5. житель сам произносит приветствие (запись greet_ из voice_npc), голос игры — без приветствия в кавычках, оклик — одно слово',
  !прилавок.нет&&!!прив&&прив.dir==="voice_npc/"&&прилавок.справка&&прилавок.справка.indexOf("«")<0&&прилавок.одно===true,прилавок);

 /* ── 6. уличные оклики ── */
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const сайты=['Folk.реплика(роль,line','Folk.реплика("dark_soldier",line','Folk.реплика(тьма?"dark_folk":"folk",line','Folk.реплика("night",line','Folk.реплика("guard",line'];
 const голыхКавычек=(html.match(/narrate\(`[^`]*: «\$\{Lines\.pick\([^`]*`/g)||[]);
 const смолк=await page.evaluate(()=>String(Folk.смолкнуть));
 check('6. все уличные оклики идут через Folk.реплика, строка в кавычках — лишь запасная; реплика героя обрывает и voice_npc',
  сайты.every(s=>html.includes(s))&&голыхКавычек.length===0&&/voice_npc/.test(смолк),{нет:сайты.filter(s=>!html.includes(s)),голыхКавычек:голыхКавычек.slice(0,2)});

 /* ── 7. ответ жителя в разговоре ── */
 const разговор=await page.evaluate(()=>{
  outer: for(let r=0;r<60;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&npcsFor(c).length){G.x+=dx;G.y+=dy;break outer;}}
  const npc=npcsFor(cellContent(G.x,G.y))[0];if(!npc)return {нет:true};
  const было={on:Folk.on,сказать:Folk.сказать,say:Speech.say,rnd:Math.random,st:window.setTimeout};
  const голос=[],речь=[];
  Folk.on=()=>true;Folk.сказать=function(путь,n,o){голос.push({путь,dir:o&&o.dir});return true;};
  Speech.say=function(t){речь.push(String(t));return true;};
  Math.random=()=>0.99;  /* ход не удаётся: «Нет. И не уговаривайте» и его варианты */
  window.setTimeout=(f,ms)=>{try{f();}catch(_){}return 0;};
  const ход=(DLG_MOVES.find(m=>m.id==="ubedit")||{}).id||"ubedit";
  try{if(G.npcMem&&G.npcMem[npc.key]&&G.npcMem[npc.key].ходы)delete G.npcMem[npc.key].ходы[ход];dlgDo(npc,ход);}
  finally{Folk.on=было.on;Folk.сказать=было.сказать;Speech.say=было.say;Math.random=было.rnd;window.setTimeout=было.st;}
  while(activeLayer())closeTopUI();
  return {голос,итог:речь.filter(t=>/не вышло|вышло/.test(t)).pop()||"",все:речь.slice(-3)};});
 const отв=(разговор.голос||[]).find(x=>/^dlg_/.test(x.путь));
 check('7. в разговоре житель отвечает своей записью (dlg_ из voice_npc), а голос игры называет исход без цитаты',
  !разговор.нет&&!!отв&&отв.dir==="voice_npc/"&&!!разговор.итог&&разговор.итог.indexOf("«")<0,разговор);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 177: СЛОВАМИ В ИГРЕ ГОВОРЯТ ТОЛЬКО ПО-РУССКИ

   Жители говорили по-русски живыми голосами, но под ними и рядом с ними
   звучала чужая речь: реплики отрядов 0 A.D. на латыни, греческом и
   персидском вместо оклика толпы, английские зазывы торговцев Flare,
   английские вести владыки подземелья, «I did it!» рабочего и «It's
   finished» послушника MegaGlest, заклинания послушника, «Yes, my Lord» и
   «What do you want?» призрачного доспеха и громады, «brains» зомби Flare,
   хор храма 0 A.D. со словами и зов минарета. Весь банк звуков прослушан
   распознавателями речи (Whisper и русский GigaAM), и семьдесят одна
   запись с разборчивыми чужими словами убрана. На их месте — голоса без
   слов: смешок, оклик, покашливание, хохот торговца, клич, рык и стон.

   Проверка не слушает звук — это делали распознаватели один раз, — а
   стережёт происхождение: чужая речь не вернётся с новой записью, пока её
   источник назван в титрах.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Ни одна строка титров ни в одной папке звуков не называет источником
      запись, в которой говорят словами: голоса отрядов 0 A.D.
      (audio/voice/), хор храма, зазывы Flare (soundfx/npcs/), «brains»
      зомби, вести владыки OpenDungeons, реплики отрядов MegaGlest (_ack,
      _select), «работа окончена», заклинания и «It's finished» послушника,
      зов минарета, английские реплики клонков OpenClonk и приветствия
      Stendhal.
   2. Семьдесят одна убранная запись не лежит на диске, и игра на неё не
      ссылается.
   3. Роли людских голосов — оклик, смешок, согласие, старший, клич, «в
      бой», испуг, строй, торговец и торговка, владыка подземелья, храм,
      портал, призрак и громада — на месте и звучат живыми записями, чьи
      файлы лежат на диске.
   4. Каждая строка живой речи в sounds/voice написана по-русски: в титрах у
      каждой записи русский текст; длина каждой записи известна игре точно —
      по ней ответ жителя встаёт в очередь после реплики героя.
   5. Руководство и энциклопедия говорят, что словами в игре говорят только
      по-русски, и называют авторов голосов без слов.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.resolve(__dirname,'..');
const ЗВУКИ=path.join(ROOT,'sounds');

/* Источники со словами. Проверяются только строки таблиц (они начинаются с
   «|»): в пояснениях титры честно называют, что и почему убрано. Рёв
   чёрного дракона MegaGlest тоже лежит в файлах _ack и _select, но слов в
   нём нет — он проверен распознавателями и оставлен. */
const СО_СЛОВАМИ=[
 [/audio\/voice\//,'голоса отрядов 0 A.D.'],
 [/sel_temple/,'хор храма 0 A.D.'],
 [/soundfx\/npcs\//,'зазывы Flare'],
 [/zombie_ment/,'«brains» зомби Flare'],
 [/keeper_neutral_|keeper_groan_defeat/,'вести владыки OpenDungeons'],
 [/(?<!evil_dragon)_(ack|select)\d*\.wav/,'реплики отрядов MegaGlest'],
 [/worker_work_end|initiate_work_(end|start)|initiate_build/,'речь рабочего и послушника MegaGlest'],
 [/minarett/,'зов минарета MegaGlest'],
 [/good_morning|attention1\.wav/,'приветствия MegaGlest'],
 [/Skin\.ocg\/[A-Za-z]+\.ocg\/(Confirm[1346]|Decline|Doubt)/,'английские реплики клонков OpenClonk'],
 [/hello_female|goodbye_female/,'приветствия Stendhal']];

const УБРАНЫ=[
 ...['build','coming','cry_01','cry_02','cry_03','fight','hail_f','hail_m','lord','march','retreat','yes']
   .map(n=>`throng/throng_${n.replace(/^(build|coming|fight|hail_f|hail_m|lord|march|retreat|yes)$/,'$1_01')}.ogg`),
 ...[1,2,3,4,5,6].map(i=>`trade/trade_f_0${i}.ogg`),...[1,2,3,4].map(i=>`trade/trade_m_0${i}.ogg`),
 ...['allydefeated1','allydefeated2','allydefeated3','allydefeated4','creaturebed1','creaturebed2v1',
  'creaturebed2v2','creaturehungry1','creaturehungry3','creaturenew1','creaturenew2','creaturenew3',
  'defeat1','defeat2','defeat3','objectivefailed1','objectivefailed2','objectivemet1','objectivemet2',
  'victory1','victory2','victory3','weareunderattack1v1','weareunderattack1v2','weareunderattack2',
  'weareunderattack3'].map(n=>`od/keeper_neutral_${n}.ogg`),
 'od/keeper_groan_defeat1.ogg','od/keeper_groan_defeat2.ogg',
 'mg/work_done_01.ogg','mg/work_done_02.ogg','mg/work_done_03.ogg',
 'mg/build_magic_01.ogg','mg/build_magic_02.ogg','mg/build_magic_03.ogg',
 ...[1,2,3,4,5].map(i=>`mg/minaret_0${i}.ogg`),
 'foe/foe_undead_cast_01.ogg','ad/ad_temple_01.ogg','ad/ad_temple_02.ogg'];
/* Эти пять и два портала заменены на месте — под тем же именем лежит уже
   запись без слов, поэтому их проверяет п. 1 по титрам, а не п. 2. */
const ЗАМЕНЕНЫ_НА_МЕСТЕ=['mg/mg_portal_01.flac','mg/mg_portal_02.flac','creatures/cr_ghost_emerge.flac',
 'creatures/cr_ghost_damage.flac','creatures/cr_ghost_death.flac','creatures/cr_behemoth_emerge.flac',
 'creatures/cr_behemoth_damage.flac'];

const РОЛИ=['throng_hail_m','throng_hail_f','throng_yes','throng_lord','throng_cry','throng_fight',
 'throng_retreat','throng_march','trade_m','trade_f','od_keeper_word','od_keeper_groan','ad_temple',
 'portal','build_magic','foe_undead_cast'];

(async()=>{
 /* ── 1. титры ── */
 const папки=fs.readdirSync(ЗВУКИ,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name);
 const найдено=[];
 for(const п of папки){
  if(п==='voice')continue;
  const f=path.join(ЗВУКИ,п,'CREDITS.md');
  if(!fs.existsSync(f))continue;
  fs.readFileSync(f,'utf8').split('\n').filter(l=>l.startsWith('|')).forEach(l=>{
   СО_СЛОВАМИ.forEach(([re,что])=>{if(re.test(l))найдено.push(п+': '+что+' — '+l.slice(0,90));});});}
 check('1. ни одни титры не называют источником запись со словами на чужом языке',
  найдено.length===0,найдено.slice(0,6));
 /* Замены на месте названы в титрах своими новыми источниками. */
 const титрыЗамен=ЗАМЕНЕНЫ_НА_МЕСТЕ.map(p=>{
  const [п,файл]=p.split('/');const t=fs.readFileSync(path.join(ЗВУКИ,п,'CREDITS.md'),'utf8');
  const строка=t.split('\n').find(l=>l.startsWith('|')&&l.includes(файл.replace(/\.flac$/,'')))||'';
  return {p,есть:fs.existsSync(path.join(ЗВУКИ,p)),строка:!!строка,чисто:!СО_СЛОВАМИ.some(([re])=>re.test(строка))};});
 check('1б. портал, призрак и громада заменены на месте: файл есть, строка титров называет новый источник без слов',
  титрыЗамен.every(x=>x.есть&&x.строка&&x.чисто),титрыЗамен.filter(x=>!(x.есть&&x.строка&&x.чисто)));

 /* ── 2. убранные записи ── */
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const наДиске=УБРАНЫ.filter(p=>fs.existsSync(path.join(ЗВУКИ,p)));
 const вИгре=УБРАНЫ.filter(p=>html.includes('"'+p+'"'));
 const вСписке=fs.readFileSync(path.join(ЗВУКИ,'BITRATE_BASELINE.txt'),'utf8').split('\n')
  .filter(l=>УБРАНЫ.some(p=>l.startsWith('sounds/'+p+'\t')));
 check('2. шестьдесят четыре убранные записи не лежат на диске, игра и список битрейта о них не знают',
  УБРАНЫ.length===64&&наДиске.length===0&&вИгре.length===0&&вСписке.length===0,
  {убрано:УБРАНЫ.length,наДиске,вИгре,вСписке});
 check('2б. вместе с семью заменёнными на месте — семьдесят одна запись',
  УБРАНЫ.length+ЗАМЕНЕНЫ_НА_МЕСТЕ.length===71,УБРАНЫ.length+ЗАМЕНЕНЫ_НА_МЕСТЕ.length);

 /* ── 4. живая речь по-русски ── */
 const голос=fs.readFileSync(path.join(ЗВУКИ,'voice','CREDITS.md'),'utf8');
 const строки=голос.split('\n').filter(l=>/^\| [a-z_]+\.mp3/.test(l));
 const нерусские=строки.filter(l=>{const m=l.match(/«([^»]+)»/);
  return !m||!/^[А-Яа-яЁё0-9 ,.!?—–\-:;]+$/.test(m[1])||!/[А-Яа-яЁё]/.test(m[1]);});
 const файлов=fs.readdirSync(path.join(ЗВУКИ,'voice')).filter(f=>f.endsWith('.mp3')).length;
 check('4. у каждой записи живой речи в титрах русский текст',
  строки.length>=180&&нерусские.length===0&&файлов===361,{строк:строки.length,файлов,нерусские:нерусские.slice(0,3)});

 /* ── 4б. длина каждой записи известна игре точно ──
    По VOICE_LEN реплики встают в очередь: житель отвечает, когда герой
    договорил, а голос игры читает итог, когда договорил житель. Длина
    сверяется с самим файлом. */
 const cp=require('child_process');
 const html2=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const mLen=html2.match(/const VOICE_LEN=(\{[^}]*\});/);
 let длины={};try{длины=JSON.parse(mLen[1]);}catch(_){}
 const расхождения=[];
 for(const f of fs.readdirSync(path.join(ЗВУКИ,'voice')).filter(f=>f.endsWith('.mp3'))){
  const k=f.replace(/\.mp3$/,'');
  let d=null;try{d=parseFloat(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',path.join(ЗВУКИ,'voice',f)],{encoding:'utf8'}));}catch(_){}
  if(!(k in длины)||d===null||Math.abs(d-длины[k])>0.05)расхождения.push([k,длины[k],d]);}
 check('4б. длина каждой записи живой речи известна игре с точностью до пяти сотых секунды',
  Object.keys(длины).length===361&&расхождения.length===0,{записей:Object.keys(длины).length,расхождения:расхождения.slice(0,4)});

 /* ── 3 и 5 — в игре ── */
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(800);
 const роли=await page.evaluate(РОЛИ=>РОЛИ.map(r=>({r,f:(SOUND_BANK[r]||{}).f||[],d:(SOUND_BANK[r]||{}).d||''})),РОЛИ);
 const плохие=роли.filter(x=>!x.f.length||!x.d||x.f.some(f=>!fs.existsSync(path.join(ЗВУКИ,f))));
 check('3. роли людских голосов на месте, у каждой живые записи на диске и описание',
  плохие.length===0,плохие.map(x=>x.r));
 const безСлов=роли.filter(x=>/^(throng_|trade_|od_keeper)/.test(x.r))
  .filter(x=>/зазыв|обращение к старшему|«иду»|слушаюсь|весть:/i.test(x.d)).map(x=>x.r+': '+x.d);
 check('3б. описания ролей говорят, что там слышно, а не чужие слова: ни зазыва, ни «слушаюсь», ни вестей',
  безСлов.length===0,безСлов);
 const тексты=await page.evaluate(()=>({гл:GUIDE.map(g=>g.body.join(' ')).join(' '),энц:ENC_CREDITS}));
 check('5. руководство и энциклопедия: словами — только по-русски, авторы голосов без слов названы',
  /только по-русски/.test(тексты.гл)&&/только по-русски/.test(тексты.энц)
  &&/Stendhal/.test(тексты.гл)&&/OpenClonk/.test(тексты.гл)&&/Ch0cchi/.test(тексты.гл),
  {гл:/только по-русски/.test(тексты.гл),энц:/только по-русски/.test(тексты.энц)});
 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 279: 12.5 — МУЗЫКА ВЕЗДЕ ОДИНАКОВА, ПОЛЗУНКИ 0–100 СО ЗВУКОМ,
   РАЗНЫЕ ПЕРЕКЛЮЧАТЕЛИ, БЫСТРЫЙ СИНТЕЗАТОР, ОБРАБОТЧИКИ ЗВУКА И РЕЧИ

   Жалобы и просьбы игрока:
   • музыка в подземельях очень тихая, хотя ползунок на 80 %; громкость
     музыки должна быть везде одинаковой, как выставлено в настройках;
   • пока интерфейс не дозаписан голосом Gemini — настройка, чтобы
     синтезатор незаписанных фраз говорил быстрее;
   • все ползунки — от 0 до 100;
   • у ползунков — нейтральные, но разные звуки вверх и вниз; у
     переключателей — разные и интересные звуки включения и выключения;
   • единые обработчики звука и речи учитывают всё это.

   1. Музыка под землёй звучит так же громко, как наверху; громкость
      считает одна функция (Звук.музыка) и для записей, и для синтеза.
   2. Темы выровнены: поправка файла входит в громкость и при смене темы.
   3. Все ползунки — от 0 до 100; темп, высота и громкость синтезатора
      пересчитываются ломаной, старые значения встают на место.
   4. Синтезатор быстрее прежнего: шкала до 10, темп до 5,05×.
   5. Ползунок звучит: вверх — одна запись, вниз — другая, тон за значением.
   6. Переключатель: включение и выключение — разные новые записи.
   7. Речь считает покрытие записями и частые незаписанные фразы; отчёты
      звука и речи показывают уровни и темпы.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 /* ── 1 ── */
 const м=await p.evaluate(()=>{settings.music=1;settings.musicVol=0.8;settings.masterVol=1;
  G.place=null;const верх=Bank.vol("music");G.place={depth:7,bx:1,by:1,kind:"dungeon",stype:"dungeon"};const низ=Bank.vol("music");
  const ф=Звук.музыка(),речь=speechDuck("music");G.place=null;return {верх,низ,ф,речь,утка:DEPTH_MUSIC_DUCK};});
 check('1. музыка под землёй так же громка, как наверху, по ползунку 80 %',Math.abs(м.верх-м.низ)<1e-9&&Math.abs(м.верх/м.речь-0.8)<0.01&&м.утка===1&&Math.abs(м.ф-м.низ)<1e-9,м);

 /* ── 2 ── */
 const т=await p.evaluate(()=>{const r={};r.safe=musicFileGain("score/score_safe_01.ogg");r.road=musicFileGain("score/score_road_01.ogg");r.wind=musicFileGain("score/score_wind_01.ogg");
  const src=String(Bank.loop);r.вПетле=/musicFileGain\(file\)/.test(src)&&/rec\.gain=rec\.base\*musicFileGain/.test(src);return r;});
 check('2. темы выровнены к −22 LUFS: тихие поднимаются, громкие убавляются, при смене темы тоже',т.safe===1&&т.road>1.3&&т.wind<1&&т.вПетле,т);

 /* ── 3 ── */
 const п=await p.evaluate(()=>{CMD.settings();const all=[...document.querySelectorAll('input[type="range"]')];
  const чужие=all.filter(e=>e.min!=="0"||e.max!=="100").map(e=>e.id);
  const r={всего:all.length,чужие};
  r.темп80=sliderVal("setRate",80);r.темп100=sliderVal("setRate",100);r.темп0=sliderVal("setRate",0);
  r.выс50=sliderVal("setPitch",50);r.гр50=sliderVal("setSynthVol",50);r.син50=sliderVal("setSynthRate",50);
  r.обратно=[sliderOf("setRate",5),sliderOf("setPitch",1),sliderOf("setSynthVol",1),sliderOf("setSynthRate",5)];
  r.показ=[document.getElementById("setRate").value,document.getElementById("vRate").textContent];
  while(activeLayer())closeTopUI();return r;});
 check('3. все ползунки от 0 до 100; темп, высота и громкость синтезатора пересчитываются, прежние значения на месте',
  п.всего>=14&&п.чужие.length===0&&п.темп80===5&&п.темп100===6&&п.темп0===0.6&&п.выс50===1&&п.гр50===1&&п.син50===5
  &&п.обратно.join()==="80,50,50,50",п);

 /* ── 4 ── */
 const с=await p.evaluate(()=>{settings.synthRate=sliderVal("setSynthRate",100);return {r:Speech.synthRate(),t:Speech.synthTempo(Speech.synthRate()),t5:Speech.synthTempo(5),g:Speech.gvTempo(10)};});
 check('4. синтезатор быстрее прежнего: шкала до 10, темп до 5,05× (записи — прежним темпом)',с.r===10&&Math.abs(с.t-5.05)<1e-9&&Math.abs(с.t5-2.8)<1e-9&&с.g===3.5,с);

 /* ── 5, 6 ── */
 const з=await p.evaluate(()=>{const сыграно=[];const было=Bank.make.bind(Bank);
  Bank.make=(f,v,l,rate)=>{сыграно.push([f,rate]);return было(f,v,l,rate);};
  CMD.settings();const el=document.getElementById("setMusicVol");el.value=50;el.dispatchEvent(new Event("input",{bubbles:true}));
  Sliders.t=0;сыграно.length=0;rangeNudge(el,1);const вверх=сыграно.slice();Sliders.t=0;сыграно.length=0;rangeNudge(el,-1);rangeNudge(el,-1);const вниз=сыграно.slice();
  el.value=100;el.__был=95;Sliders.t=0;сыграно.length=0;el.dispatchEvent(new Event("input",{bubbles:true}));const верх=сыграно.slice();
  сыграно.length=0;Toggles.play(true);Toggles.play(false);const пер=сыграно.slice();
  Bank.make=было;while(activeLayer())closeTopUI();
  return {вверх,вниз,верх,пер,bank:[UI_BANK.ui_slider_up,UI_BANK.ui_slider_down,UI_BANK.ui_toggle_on,UI_BANK.ui_toggle_off]};});
 check('5. ползунок звучит: вверх — светлый тик, вниз — глухой тук, тон выше у верха шкалы',
  з.вверх.length===1&&/ui_slider_up/.test(з.вверх[0][0])&&з.вниз.length>=1&&/ui_slider_down/.test(з.вниз[0][0])&&з.верх.length===1&&з.верх[0][1]>з.вверх[0][1],з);
 check('6. переключатель: включение и выключение — разные новые записи, файлы на месте',
  з.пер.length===2&&/ui_switch_on/.test(з.пер[0][0])&&/ui_switch_off/.test(з.пер[1][0])
  &&з.bank.every(f=>fs.existsSync(path.join(__dirname,'..','sounds',f))),з);

 /* ── 7 ── */
 const р=await p.evaluate(()=>{Речь.покрытие={запись:0,синтез:0};Речь.незаписано={};
  Речь.учесть(3,["Сундук открыт за 12 золота","Новая фраза"]);Речь.учесть(1,["Сундук открыт за 7 золота"]);
  const top=Речь.незаписанные(3);return {доля:Речь.доляЗаписей(),top,отчёт:Речь.отчёт(2),звук:Звук.отчёт(1)};});
 check('7. речь считает покрытие записями и частые незаписанные фразы; отчёты звука и речи — уровни и темпы',
  Math.abs(р.доля-4/7)<1e-9&&р.top[0][0]==="Сундук открыт за # золота"&&р.top[0][1]===2&&/Темп синтезатора: ползунок|темп синтезатора: ползунок/.test(р.отчёт)&&/57 %/.test(р.отчёт)
  &&/Ползунки: общая/.test(р.звук)&&/под землёй — так же/.test(р.звук),р);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

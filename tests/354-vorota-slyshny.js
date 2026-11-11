/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 354: ВОРОТА СЛЫШНЫ И ЗВУЧАТ ВСЯКИЙ РАЗ

   Слова игрока (11 ноября 2026): «Найди качественный звук открытия и закрытия
   ворот, аутентичный — ворота в деревню, в город и так далее»; после проб:
   «Вводи в игру и проверь, чтобы они были слышны и использовались. Потому
   что далеко не всегда слышно открытие и закрытие. Или вообще не слышно».

   1. Записи: восемь ролей (деревня, город, замок — открыть и закрыть; решётка
      — вверх и вниз), четырнадцать записей на диске, без потерь, названы в
      титрах, тексты лицензий рядом.
   2. Каждая запись слышна: громкая часть не тише −24 дБ, в полосе динамика
      телефона (выше 300 Гц) — не тише −28 дБ; пик не выше −1 дБ.
   3. Чьи ворота: деревня — деревенские; порт, посад и именной город —
      городские; замок, крепость, цитадель — замковые; дом — не ворота.
   4. Стража пропустила — отворяются ворота этого поселения, на 0,9 громкости,
      событием (теснота их почти не убавляет); прежняя глухая запись «ворота
      поставлены» больше не звучит; дверь дома при входе не звучит.
   5. Вход без стражи — ворота один раз. Вошли следом за стражей — не дважды.
   6. Выход из поселения — ворота закрываются; так в деревне, в городе и в замке.
   7. Герой сам отворяет ворота на улице — створки слышны со стороны ворот.
   8. Связка «ворота» играет створки поселения, вне поселения — городские;
      «решётка» — цепь и железо; запертая решётка — по-прежнему.
   9. Дверь дома внутри поселения — дверь, не ворота; дверь тоже событие.
  10. В тесноте (много звуков разом) ворота и дверь убавляются не больше чем на
      пятую часть, а обычный звук мира — вдвое.
  11. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));

function замер(rel){
 const buf=cp.execFileSync('ffmpeg',['-v','error','-i',path.join(ROOT,'sounds',rel),'-ac','1','-ar','48000','-f','f32le','-'],{maxBuffer:64*1024*1024});
 const x=new Float32Array(buf.buffer,buf.byteOffset,Math.floor(buf.length/4));
 const фвч=(s,f)=>{const w=2*Math.PI*f/48000,c=Math.cos(w),al=Math.sin(w)/(2*Math.SQRT1_2),a0=1+al;
  const b0=(1+c)/2/a0,b1=-(1+c)/a0,b2=(1+c)/2/a0,a1=-2*c/a0,a2=(1-al)/a0;const y=new Float64Array(s.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<s.length;i++){const v=b0*s[i]+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=s[i];y2=y1;y1=v;y[i]=v;}return y;};
 /* громкая часть: окна по 20 мс, среднее по самой громкой пятой части */
 const гр=s=>{const w=960,e=[];for(let i=0;i+w<=s.length;i+=w){let t=0;for(let j=0;j<w;j++)t+=s[i+j]*s[i+j];e.push(t/w);}
  e.sort((a,b)=>b-a);const n=Math.max(1,Math.floor(e.length/5));return 10*Math.log10(e.slice(0,n).reduce((a,b)=>a+b,0)/n||1e-12);};
 let пик=0;for(let i=0;i<x.length;i++)пик=Math.max(пик,Math.abs(x[i]));
 return {с:+(x.length/48000).toFixed(2),пик:+(20*Math.log10(пик||1e-9)).toFixed(1),гр:+гр(x).toFixed(1),тел:+гр(фвч(фвч(x,300),300)).toFixed(1)};}

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. записи ── */
 const РОЛИ=["vr_village_open","vr_village_close","vr_city_open","vr_city_close","vr_castle_open","vr_castle_close","vr_grate_up","vr_grate_down"];
 const банк=await page.evaluate(R=>R.map(r=>({r,есть:Bank.has(r),f:(SOUND_BANK[r]||{f:[]}).f,d:(SOUND_BANK[r]||{}).d||""})),РОЛИ);
 const файлы=[].concat(...банк.map(b=>b.f));
 const папка=path.join(ROOT,'sounds','vorota');const титры=fs.readFileSync(path.join(папка,'CREDITS.md'),'utf8');
 const плохие=файлы.filter(f=>!/^vorota\/vr_[a-z_]+_0\d\.flac$/.test(f)||!fs.existsSync(path.join(ROOT,'sounds',f))||fs.readFileSync(path.join(ROOT,'sounds',f)).slice(0,4).toString('latin1')!=='fLaC');
 const безТитров=файлы.filter(f=>титры.indexOf(path.basename(f,'.flac'))<0);
 const наДиске=fs.readdirSync(папка).filter(f=>f.endsWith('.flac')).map(f=>'vorota/'+f).sort();
 check('1. восемь ролей ворот, четырнадцать записей: все на диске, без потерь, названы в титрах; лишних записей в папке нет; лицензии и авторы названы, тексты лицензий рядом',
  банк.every(b=>b.есть&&b.f.length>=1&&b.d.length>20)&&файлы.length===14&&!плохие.length&&!безТитров.length&&наДиске.join()===файлы.slice().sort().join()&&
  /CC0/.test(титры)&&/CC BY-SA 3\.0/.test(титры)&&/Wildfire Games/.test(титры)&&/Joseph Sardin/.test(титры)&&/creativecommons\.org/.test(титры)&&
  fs.existsSync(path.join(папка,'LICENSE-CC0.txt'))&&fs.existsSync(path.join(папка,'LICENSE-CC-BY-SA-3.0.txt')),{ролей:банк.length,файлов:файлы.length,плохие,безТитров});

 /* ── 2. слышно ── */
 const з=файлы.map(f=>Object.assign({f:path.basename(f,'.flac')},замер(f)));
 check('2. каждая запись слышна: громкая часть не тише −24 дБ, в полосе динамика телефона — не тише −28 дБ, пик не выше −1 дБ, длина от двух до семи секунд',
  з.every(r=>r.гр>=-24&&r.тел>=-28&&r.пик<=-0.9&&r.с>=2&&r.с<=7),з.map(r=>[r.f.replace('vr_',''),r.гр,r.тел,r.пик,r.с]));
 const старая=замер('hall/hall_gate_01.ogg');
 check('2а. прежняя запись входа («ворота поставлены») почти вся ниже 300 Гц: в полосе телефона каждая новая запись громче её не меньше чем на 4 дБ, двенадцать из четырнадцати — на 7 дБ и больше',
  з.every(r=>r.тел-старая.тел>=4)&&з.filter(r=>r.тел-старая.тел>=7).length>=12,{прежняя:старая,новыеТише:Math.min(...з.map(r=>r.тел))});

 /* ── 3. чьи ворота ── */
 const род=await page.evaluate(()=>{const гор=(typeof NAMED_CITY_MAP!=="undefined"&&NAMED_CITY_MAP.size)?[...NAMED_CITY_MAP.keys()][0].split(",").map(Number):null;
  return {деревня:Ворота180.род("village",1,1),порт:Ворота180.род("port",1,1),посад:Ворота180.род("burg",1,1),крепость:Ворота180.род("fortress",1,1),цитадель:Ворота180.род("citadel",1,1),
   замок:Ворота180.род("castle",-5,-5),именной:гор?Ворота180.род("castle",гор[0],гор[1]):"нет городов",таверна:Ворота180.род("tavern",1,1),храм:Ворота180.род("temple",1,1),руины:Ворота180.род("ruins",1,1)};});
 check('3. деревня — деревенские ворота; порт, посад и именной город — городские; замок, крепость, цитадель — замковые; таверна, храм, руины — не ворота',
  род.деревня==="village"&&род.порт==="city"&&род.посад==="city"&&род.именной==="city"&&род.замок==="castle"&&род.крепость==="castle"&&род.цитадель==="castle"&&род.таверна===null&&род.храм===null&&род.руины===null,род);

 /* ── перехват: что и как громко сыграно ── */
 await page.evaluate(()=>{window.ИГРАЛО=[];
  /* «нет» — игра сама отказалась играть роль (вернула пусто): так снят прежний глухой слой порога */
  const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{const e={r:String(r),g:o&&o.gain,prio:o&&o.prio,sec:o&&o.maxSec,t:Date.now(),кл:(typeof Гул155!=="undefined"&&Гул155.кл)||null};ИГРАЛО.push(e);
   const el=p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));e.нет=el==null;return el;};
  const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{ИГРАЛО.push({r:String(r),g:o&&o.gain,prio:o&&o.prio,sec:o&&o.maxSec,dx,dy,t:Date.now(),кл:(typeof Гул155!=="undefined"&&Гул155.кл)||null});return sr(r,dx,dy,Object.assign({},o||{},{gain:0.01,maxSec:0.3}));};
  window.w=ms=>new Promise(z=>setTimeout(z,ms));
  window.закрытьВсё=()=>{for(let i=0;i<6&&activeLayer();i++)closeTopUI();};
  /* ближайшее строение нужного вида: клетка мира */
  window.найти=(типы,именной)=>{for(let q=1;q<160;q++)for(let dx=-q;dx<=q;dx++)for(let dy=-q;dy<=q;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==q)continue;
    const x=G.x+dx,y=G.y+dy;const c=safeFn(()=>cellContent(x,y),null);if(!c||!c.structure||!типы.includes(c.structure.type))continue;
    const им=!!safeFn(()=>cityAt(x,y),null);if(именной!=null&&им!==именной)continue;return {x,y,тип:c.structure.type};}return null;};
  window.ворот=()=>ИГРАЛО.filter(e=>/^vr_/.test(e.r));/* звуки двери и прежних ворот; «ворота поставлены» со стороны — это маяк прохода, а не створки: его не считаем */
  window.дверей=()=>ИГРАЛО.filter(e=>/^(oc_door|oc_hinge|deep_door|mtg_steel_door|mtg_gate|oc_gate|hall_gate)/.test(e.r)&&!(e.r==="hall_gate"&&(e.dx!==undefined||e.нет)));
  /* сам звук порога поселения по-прежнему просится, но игра его не играет */
  window.порогСнят=()=>ИГРАЛО.some(e=>e.r==="hall_gate"&&e.dx===undefined&&e.нет);});

 /* ── 4–6. вход через стражу, вход без стражи, выход: деревня, город, замок ── */
 const ходки=await page.evaluate(async()=>{const out={};
  const виды={деревня:[["village"],null,"village"],город:[["port","burg"],null,"city"],замок:[["fortress","citadel","castle"],false,"castle"]};
  for(const [имя,[типы,именной,род]] of Object.entries(виды)){const r={род};out[имя]=r;
   let м=найти(типы,именной);
   /* замок без имени поблизости может не найтись: тогда — столица ближайшей державы, если её ворота замковые */
   if(!м&&имя==="замок"){const e=EMPIRES.map(x=>x.cap).find(c=>Ворота180.род("castle",c.x,c.y)==="castle");if(e)м={x:e.x,y:e.y,тип:"castle"};}
   if(!м){r.нет=true;continue;}r.тип=м.тип;
   G.place=null;G.x=м.x;G.y=м.y;const c=cellContent(G.x,G.y);r.родМеста=Ворота180.род(c.structure.type,c.x,c.y);
   /* а) стража пропускает (пропуск на сегодня) */
   G.gate147={[G.x+","+G.y]:Number(G.day)||0};Ворота180._играло=null;await w(300);ИГРАЛО.length=0;
   Стража147.встреча(c,null);await w(1500);закрытьВсё();
   r.вошли=!!G.place&&G.place.kind==="city";r.стража=ворот().map(e=>[e.r,e.g,e.prio,e.sec,e.кл]);r.страваДвери=дверей().map(e=>e.r);r.порогСнят=порогСнят();
   /* б) выход */
   await w(300);ИГРАЛО.length=0;leavePlace();await w(500);закрытьВсё();r.вышли=!G.place;r.выход=ворот().map(e=>[e.r,e.g,e.prio]);r.выходДвери=дверей().map(e=>e.r);
   /* в) вход без стражи */
   await w(3200);Ворота180._играло=null;ИГРАЛО.length=0;enterPlace(cellContent(G.x,G.y));await w(700);закрытьВсё();
   r.вошлиСами=!!G.place;r.сами=ворот().map(e=>[e.r,e.g]);r.самиДвери=дверей().map(e=>e.r);
   /* г) ворота на улице: найти закрытые и отворить */
   const lvl=curLevel();let в=null;for(let y=0;y<lvl.h&&!в;y++)for(let x=0;x<lvl.w&&!в;x++){if(lvl.g[y][x]!=="G")continue;
    for(const [dir,v] of Object.entries(DIRV)){const sx=x-v[0],sy=y-v[1];const t=tileAt(lvl,sx,sy);if(t==="."||t==="="){в={x,y,dir,sx,sy};break;}}}
   if(в){G.place.x=в.sx;G.place.y=в.sy;setPlaceMark(в.x,в.y,"closed");const d={x:в.x,y:в.y,dir:в.dir,вид:"ворота"};
    await w(300);ИГРАЛО.length=0;window.__сказано=[];const n0=narrate;const ок=Двери147.действие(d);await w(300);
    r.улица=ворот().map(e=>[e.r,e.g,e.dx,e.dy]);r.отворены=placeMark(в.x,в.y)==="open";r.ок=ок;r.ждали=[в.x-в.sx,в.y-в.sy];}
   else r.безВоротНаУлице=true;
   /* д) дверь дома внутри поселения — дверь */
   let дв=null;for(let y=1;y<lvl.h-1&&!дв;y++)for(let x=1;x<lvl.w-1&&!дв;x++){if(tileAt(lvl,x,y)!=="+")continue;
    for(const dir of ["N","E","S","W"]){const px=x-DIRV[dir][0],py=y-DIRV[dir][1];if(tileAt(lvl,px,py)==="."){дв={x,y,dir,px,py};break;}}}
   if(дв){G.place.x=дв.px;G.place.y=дв.py;await w(700);ИГРАЛО.length=0;Двери147.распахнуть({x:дв.x,y:дв.y,dir:дв.dir,вид:"дверь"},false);await w(350);
    const дв2=ИГРАЛО.filter(e=>/door|hinge|steel|metal/.test(e.r));
    r.дом={род:doorKindHere("+"),ворот:ворот().length,роли:дв2.map(e=>e.r),событие:дв2.map(e=>e.prio==="high"||e.кл==="событие")};}
   await w(200);leavePlace();await w(300);закрытьВсё();G.place=null;}
  return out;});
 for(const [имя,r] of Object.entries(ходки)){
  if(r.нет){check('4–9. '+имя+': поселение найдено',false,r);continue;}
  const о="vr_"+r.род+"_open",з2="vr_"+r.род+"_close";
  check(`4. ${имя} (${r.тип}): стража пропустила — отворяются ворота «${r.род}», один раз, на 0,9 громкости, до семи секунд, событием; ни глухой записи «ворота поставлены», ни двери дома при входе`,
   r.родМеста===r.род&&r.вошли&&r.стража.length===1&&r.стража[0][0]===о&&r.стража[0][1]===0.9&&r.стража[0][2]==="high"&&r.стража[0][3]===7&&r.стража[0][4]==="событие"&&r.страваДвери.length===0&&r.порогСнят,r);
  check(`6. ${имя}: выход из поселения — ворота закрываются (${з2}), на 0,9, событием; дверь дома не звучит`,
   r.вышли&&r.выход.length===1&&r.выход[0][0]===з2&&r.выход[0][1]===0.9&&r.выход[0][2]==="high"&&r.выходДвери.length===0,{выход:r.выход,двери:r.выходДвери});
  check(`5. ${имя}: вход без стражи — ворота отворяются ровно один раз`,r.вошлиСами&&r.сами.length===1&&r.сами[0][0]===о&&r.сами[0][1]===0.9&&r.самиДвери.length===0,{сами:r.сами,двери:r.самиДвери});
  if(!r.безВоротНаУлице)check(`7. ${имя}: герой сам отворяет ворота на улице — створки этого поселения слышны со стороны ворот`,
   r.ок===true&&r.отворены&&r.улица.length===1&&r.улица[0][0]===о&&r.улица[0][1]===0.9&&r.улица[0][2]===r.ждали[0]&&r.улица[0][3]===r.ждали[1],{улица:r.улица,ждали:r.ждали});
  if(r.дом)check(`9. ${имя}: дверь дома внутри поселения — дверь, не ворота; и она — событие`,r.дом.ворот===0&&r.дом.род!=="gate"&&r.дом.роли.length>=2&&r.дом.событие.every(Boolean),r.дом);}

 /* ── 8. связки ── */
 const св=await page.evaluate(async()=>{const r={};G.place=null;await w(400);
  const первый=async(kind,state,o)=>{ИГРАЛО.length=0;const ок=doorSound(kind,state,o);await w(40);return {ок,и:ИГРАЛО.slice(0,2).map(e=>[e.r,e.g,e.sec,e.prio])};};
  r.воротаВне=await первый("gate","open",{gain:0.5});r.воротаЗакр=await первый("gate","close");
  r.решёткаВверх=await первый("grate","open",{gain:0.5});r.решёткаВниз=await первый("grate","close");await w(500);
  ИГРАЛО.length=0;doorSound("grate","locked");await w(450);r.заперта=ИГРАЛО.map(e=>e.r);
  r.таблица={gate:[DOOR_SOUND.gate.open,DOOR_SOUND.gate.close],grate:[DOOR_SOUND.grate.open,DOOR_SOUND.grate.close]};return r;});
 check('8. связка «ворота» вне поселения — городские створки; «решётка» — цепь и железо вверх и вниз; всё на 0,9, до семи секунд, событием',
  св.воротаВне.ок===true&&св.воротаВне.и[0][0]==="vr_city_open"&&св.воротаВне.и[0][1]===0.9&&св.воротаЗакр.и[0][0]==="vr_city_close"&&
  св.решёткаВверх.и[0][0]==="vr_grate_up"&&св.решёткаВверх.и[0][1]===0.9&&св.решёткаВверх.и[0][2]===7&&св.решёткаВверх.и[0][3]==="high"&&св.решёткаВниз.и[0][0]==="vr_grate_down",св);
 check('8а. запертая решётка лязгает и звенит цепью, как прежде',св.заперта.includes("oc_metal_dull")&&св.заперта.includes("oc_chain"),св.заперта);

 /* ── 10. теснота ── */
 const т=await page.evaluate(()=>{if(typeof Гул155==="undefined")return {нет:true};
  const т0=Гул155.теснота;Гул155.теснота=()=>({L:6,n:8});
  const r={ворота:Гул155.множ(Гул155.класс("vr_city_open","fx",{prio:"high"})),дверь:Гул155.множ(Гул155.класс("oc_door_open","fx",{prio:"high"})),мир:Гул155.множ(Гул155.класс("oc_door_open","fx",{})),
   класс:Гул155.класс("vr_city_open","fx",{prio:"high"})};Гул155.теснота=т0;return r;});
 check('10. в тесноте ворота и дверь убавляются не больше чем на пятую часть, а обычный звук мира — вдвое',
  !т.нет&&т.класс==="событие"&&т.ворота>=0.8&&т.дверь>=0.8&&т.мир<=0.55,т);

 check('нет ошибок страницы',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

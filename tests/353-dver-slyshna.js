/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 353: ДВЕРЬ СЛЫШНА — ПРЕЖНИЙ ЗВУК, ЯРЧЕ И ГРОМЧЕ

   Слово игрока (11 ноября 2026): «Оставь прежний звук двери. Просто сделай
   его ярче, потому что сейчас его в игре практически не слышно».

   1. Роли двери (открыть, закрыть, отпереть, удар в косяк) играют копии
      прежних записей; копии лежат на диске, без потерь, названы в титрах.
   2. Копии громче исходников там, где исходник был почти не слышен
      («закрыть» и «отпереть» — не меньше чем на 9 дБ), и пик не выше −1 дБ.
   3. Копии ярче: доля верха (выше 2,5 кГц) у копии больше, чем у исходника.
   4. Связка деревянной, тяжёлой и скрипучей двери играет громче прежнего
      (открыть, закрыть, запереть, отпереть, толкнуть запертую), не выше
      полной громкости; взлом и пролом, железо и чары — по-прежнему; ворота
      звучат своими створками (их стережёт набор 354).
   5. Дверь дома открывается руками героя — звучит копия, а не тихий исходник.
   6. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));

/* запись → моно 48 кГц; средняя мощность самой громкой части, пик и доля верха */
function замер(rel){
 const buf=cp.execFileSync('ffmpeg',['-v','error','-i',path.join(ROOT,'sounds',rel),'-ac','1','-ar','48000','-f','f32le','-'],{maxBuffer:64*1024*1024});
 const x=new Float32Array(buf.buffer,buf.byteOffset,Math.floor(buf.length/4));
 let пик=0;for(let i=0;i<x.length;i++)пик=Math.max(пик,Math.abs(x[i]));
 /* громкая часть: окна по 20 мс, среднее по самой громкой пятой части */
 const w=960,e=[];for(let i=0;i+w<=x.length;i+=w){let s=0;for(let j=0;j<w;j++)s+=x[i+j]*x[i+j];e.push(s/w);}
 e.sort((a,b)=>b-a);const n=Math.max(1,Math.floor(e.length/5));const гр=e.slice(0,n).reduce((a,b)=>a+b,0)/n;
 /* доля верха: энергия выше 2,5 кГц (фильтр верхних частот четвёртого порядка) к энергии выше 150 Гц */
 const фвч=(s,f)=>{const w=2*Math.PI*f/48000,c=Math.cos(w),al=Math.sin(w)/(2*Math.SQRT1_2),a0=1+al;
  const b0=(1+c)/2/a0,b1=-(1+c)/a0,b2=(1+c)/2/a0,a1=-2*c/a0,a2=(1-al)/a0;const y=new Float64Array(s.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<s.length;i++){const v=b0*s[i]+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=s[i];y2=y1;y1=v;y[i]=v;}return y;};
 const эн=s=>{let t=0;for(let i=0;i<s.length;i++)t+=s[i]*s[i];return t;};
 const верх=эн(фвч(фвч(x,2500),2500))/(эн(фвч(фвч(x,150),150))||1e-12);
 return {пик:20*Math.log10(пик||1e-9),гр:10*Math.log10(гр||1e-12),верх};}

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. роли и копии ── */
 const роли=await page.evaluate(()=>({open:SOUND_BANK.oc_door_open.f,close:SOUND_BANK.oc_door_close.f,unlock:SOUND_BANK.oc_door_unlock.f,thud:SOUND_BANK.deep_door.f,
  есть:["oc_door_open","oc_door_close","oc_door_unlock","deep_door"].every(r=>Bank.has(r)),
  связка:{wood:DOOR_SOUND.wood,heavy:DOOR_SOUND.heavy}}));
 const все=[].concat(роли.open,роли.close,роли.unlock,роли.thud);
 const нетНаДиске=все.filter(f=>!fs.existsSync(path.join(ROOT,'sounds',f)));
 const неFlac=все.filter(f=>!/_y\.flac$/.test(f)||fs.readFileSync(path.join(ROOT,'sounds',f)).slice(0,4).toString('latin1')!=='fLaC');
 const титры={oc:fs.readFileSync(path.join(ROOT,'sounds/oc/CREDITS.md'),'utf8'),deep:fs.readFileSync(path.join(ROOT,'sounds/deep/CREDITS.md'),'utf8')};
 const безТитров=все.filter(f=>{const [d,n]=f.split('/');return титры[d].indexOf(n.replace('.flac',''))<0;});
 check('1. роли двери играют копии прежних записей: по две на «открыть» и «закрыть», по одной на «отпереть» и удар в косяк; копии на диске, без потерь, названы в титрах',
  роли.есть&&роли.open.length===2&&роли.close.length===2&&роли.unlock.length===1&&роли.thud.length===1&&!нетНаДиске.length&&!неFlac.length&&!безТитров.length,
  {все,нетНаДиске,неFlac,безТитров});
 check('1а. связка двери прежняя: деревянная открывается створкой и петлями, закрывается створкой в косяк',
  роли.связка.wood.open.join()==="oc_door_open,oc_hinge"&&роли.связка.wood.close.join()==="oc_door_close"&&роли.связка.heavy.open.includes("oc_door_open"),роли.связка.wood);

 /* ── 2–3. громче и ярче ── */
 const пары=[["oc/oc_door_open_01.ogg","oc/oc_door_open_01_y.flac",-0.5],["oc/oc_door_open_02.ogg","oc/oc_door_open_02_y.flac",-0.5],
  ["oc/oc_door_close_01.ogg","oc/oc_door_close_01_y.flac",9],["oc/oc_door_close_02.ogg","oc/oc_door_close_02_y.flac",9],
  ["oc/oc_door_unlock_01.ogg","oc/oc_door_unlock_01_y.flac",6],["deep/deep_door_01.ogg","deep/deep_door_01_y.flac",3]];
 const з=пары.map(([a,b,на])=>{const x=замер(a),y=замер(b);return {b,на,прирост:+(y.гр-x.гр).toFixed(1),пик:+y.пик.toFixed(1),верхБыло:+x.верх.toFixed(3),верхСтало:+y.верх.toFixed(3)};});
 check('2. копии громче там, где исходник терялся («закрыть» — не меньше чем на 9 дБ, «отпереть» — на 6, удар в косяк — на 3), «открыть» не тише; пик не выше −1 дБ',
  з.every(r=>r.прирост>=r.на&&r.пик<=-0.9),з.map(r=>[r.b.split('/')[1],r.прирост,r.пик]));
 check('3. копии ярче: доля верха (выше 2,5 кГц) у каждой больше, чем у исходника, не меньше чем на четверть',з.every(r=>r.верхСтало>r.верхБыло*1.25),з.map(r=>[r.b.split('/')[1],r.верхБыло,r.верхСтало]));

 /* ── 4. громкость связки ── */
 const гр=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  window.ИГРАЛО=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{ИГРАЛО.push([String(r),o&&o.gain]);return p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{ИГРАЛО.push([String(r),o&&o.gain]);return sr(r,dx,dy,Object.assign({},o||{},{gain:0.01,maxSec:0.3}));};
  const первый=async(kind,state,o)=>{ИГРАЛО.length=0;doorSound(kind,state,o);await w(30);return ИГРАЛО.length?ИГРАЛО[0][1]:null;};
  const r={};
  r.деревоОткр=await первый("wood","open");r.деревоЗакр=await первый("wood","close",{gain:0.5});r.деревоЗапертая=await первый("wood","locked",{gain:0.5});
  r.тяжёлаяОткр=await первый("heavy","open");r.скрипОтпер=await первый("creaky","unlock");r.потолок=await первый("wood","open",{gain:0.9});
  r.взлом=await первый("wood","pick");r.пролом=await первый("wood","break");r.железо=await первый("iron","open");r.чары=await первый("magic","open");r.ворота=await первый("gate","open",{gain:0.5});
  r.неизвестный=await первый("нет-такого","open");r.нетСостояния=doorSound("wood","такого-нет");
  await w(700);ИГРАЛО.length=0;doorSound("wood","open");await w(260);r.слои=ИГРАЛО.filter(x=>DOOR_SOUND.wood.open.includes(x[0])).map(x=>[x[0],+(x[1]).toFixed(2)]);
  r.множитель=Дверь180.ярче;return r;});
 const б=(a,b)=>Math.abs(a-b)<0.005;
 check('4. деревянная, тяжёлая и скрипучая дверь играют громче прежнего: открыть 0,55 → 0,88, вход и выход 0,5 → 0,8; выше полной громкости связка не уходит',
  гр.множитель>=1.4&&б(гр.деревоОткр,0.88)&&б(гр.деревоЗакр,0.8)&&б(гр.деревоЗапертая,0.8)&&б(гр.тяжёлаяОткр,0.88)&&б(гр.скрипОтпер,0.88)&&гр.потолок===1&&б(гр.неизвестный,0.88),гр);
 check('4а. петли идут вторым слоем на три четверти громкости створки',гр.слои.length===2&&гр.слои[0][0]==="oc_door_open"&&гр.слои[1][0]==="oc_hinge"&&б(гр.слои[1][1],0.66),гр.слои);
 check('4б. взлом и пролом, железная и магическая дверь — по-прежнему; ворота — своими створками на 0,9 (набор 354); неизвестное состояние — «нет»',
  б(гр.взлом,0.55)&&б(гр.пролом,0.55)&&б(гр.железо,0.55)&&б(гр.чары,0.55)&&б(гр.ворота,0.9)&&гр.нетСостояния===false,гр);

 /* ── 5. дверь дома в игре ── */
 const дом=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const r={};
  window.ФАЙЛЫ=[];const m=Bank.make.bind(Bank);Bank.make=function(file,volume,loop,rate){ФАЙЛЫ.push(String(file));return m(file,volume,loop,rate);};
  /* деревня: встать у двери дома и открыть её самому */
  let bx=0,by=0,lvl=null;outer:for(bx=2;bx<60;bx++)for(by=2;by<60;by++){const l=safeFn(()=>genLevel(bx,by,0,"village"),null);if(l&&l.дома180&&l.дома180.length){lvl=l;break outer;}}
  if(!lvl)return {нет:"деревни"};
  G.place={kind:"city",bx,by,stype:"village",name:"Проверка",depth:0,x:lvl.entry.x,y:lvl.entry.y};const L=curLevel();
  let дв=null;for(let y=1;y<L.h-1&&!дв;y++)for(let x=1;x<L.w-1&&!дв;x++){if(tileAt(L,x,y)!=="+")continue;
   for(const d of ["N","E","S","W"]){const px=x-DIRV[d][0],py=y-DIRV[d][1];if(tileAt(L,px,py)==="."){дв={x,y,d,px,py};break;}}}
  if(!дв)return {нет:"двери"};
  G.place.x=дв.px;G.place.y=дв.py;G.marks={};r.род=doorKindHere("+");
  await w(700);ИГРАЛО.length=0;ФАЙЛЫ.length=0;Двери147.распахнуть({x:дв.x,y:дв.y,dir:дв.d,вид:"дверь"},false);await w(400);
  const свои=ИГРАЛО.filter(x=>["oc_door_open","oc_hinge","deep_door"].includes(x[0]));
  r.роли=свои.map(x=>x[0]);r.громк=свои.map(x=>+(Number(x[1])||0).toFixed(2));r.файлы=ФАЙЛЫ.filter(f=>/door/.test(f));r.открыта=placeMark(дв.x,дв.y)==="open";
  /* какую запись даёт банк роли створки: всегда копию */
  r.створка=[0,1,2,3,4,5].map(()=>Vary.file("oc_door_open"));return r;});
 check('5. дверь дома в деревне открывается руками: створка, петли и удар в косяк — яркими копиями, створка на 0,88',
  !дом.нет&&дом.род==="wood"&&дом.открыта&&дом.роли.includes("oc_door_open")&&дом.роли.includes("oc_hinge")&&дом.роли.includes("deep_door")&&дом.громк[0]===0.88&&
  дом.створка.every(f=>/oc_door_open_0[12]_y\.flac$/.test(f))&&дом.файлы.some(f=>/deep_door_01_y\.flac$/.test(f))&&!дом.файлы.some(f=>/\.ogg$/.test(f)),дом);

 check('нет ошибок страницы',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

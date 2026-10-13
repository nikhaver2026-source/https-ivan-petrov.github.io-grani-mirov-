// Книга открыта, пока звучит другая речь: когда адаптер начинает говорить «Книга раскрыта».
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1500);
 const r=await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};window.meetCaravan=()=>false;
  settings.effects=1;settings.music=1;settings.scape=1;settings.ttsEngine="gemini";safeFn(()=>Speech.gvLoad());ESpeak.load();
  {const t1=performance.now();while(!(typeof GVOICE_ON!=="undefined"&&GVOICE_ON&&ESpeak.ready())&&performance.now()-t1<40000)await new Promise(q=>setTimeout(q,200));}
  await new Promise(q=>setTimeout(q,1500));const A=Speech._adapter();const sp0=A.speak.bind(A);window.__говор=[];
  A.speak=function(text,o){window.__говор.push({t:performance.now(),text:String(text).slice(0,60)});return sp0(text,o);};
  const sleep=ms=>new Promise(q=>setTimeout(q,ms));const L=knowLayout();const out=[];
  const фоны=[["narrate","Рядом: на севере Грозовой ястреб, два шага; на северо-востоке стая волков, четыре шага; на западе путник с поклажей, шесть шагов; дорога уходит к реке, за рекой слышен колокол деревни."],
   ["say0","Ветер меняется, с запада тянет дымом: где-то жгут костры, и запах смолы мешается с запахом мокрой травы и конского пота."],
   ["sayHi","Внимание: ваш питомец ранен и просит помощи, здоровье его на исходе; дайте ему зелье или уведите с поля боя, пока не поздно."]];
  for(let k=0;k<12;k++){while(activeLayer())closeTopUI();safeFn(()=>Speech.stop());await sleep(600);
   const [вид,текст]=фоны[k%3];
   if(вид==="narrate")narrate(текст);else if(вид==="say0")Speech.say(текст,{interrupt:false});else Speech.say(текст,{interrupt:true,pri:2});
   await sleep(300+(k%4)*250);window.__говор=[];const t0=performance.now();const n=(k*977+13)%L.total;openReading(n,true);
   let кн=null;while(performance.now()-t0<12000){const x=window.__говор.find(g=>/^Книга раскрыта/.test(g.text));if(x){кн=Math.round(x.t-t0);break;}await sleep(10);}
   out.push({вид,пауза:300+(k%4)*250,книгаЧерез:кн,перед:window.__говор.filter(g=>кн==null||g.t-t0<кн).map(g=>g.text.slice(0,30))});safeFn(()=>Speech.stop());}
  return out;});
 for(const o of r)console.log(JSON.stringify(o));console.log('ошибок страницы',errors.length);
 await browser.close();
})().catch(e=>{console.error('СБОЙ',e);process.exit(1);});

/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 302: МУЖСКОЙ ГОЛОС ОТДЕЛЬНО, ЖЕНСКИЙ ОТДЕЛЬНО (15.0)

   Просьба игрока: «интерфейс записан и мужским голосом, и женским; мужской
   отдельно, женский отдельно — совместно они работать не должны».
   1. Выбран женский голос Gemini — фраза, записанная только мужским,
      записью не звучит (и наоборот): другой голос не вступает никогда.
   2. Незаписанное договаривает голос устройства того же пола.
   3. У устройства нет голоса того же пола (или пол по имени не виден) —
      встроенный eSpeak NG того же пола, а не голос другого пола.
   4. Голоса Google на Android: x-dfc, x-ruc — женские, x-rud, x-ruf — мужские.
   5. Голос устройства, выбранный игроком вручную, главнее.
   6. eSpeak: женский вариант звучит выше мужского (другой голос, не тот же).
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 /* обе описи — в память */
 await p.evaluate(()=>{Speech._gvLoad1(Speech.GVOICES.m);Speech._gvLoad1(Speech.GVOICES.f);});
 await p.waitForFunction(()=>Speech.GVOICES.m.state!=="loading"&&Speech.GVOICES.f.state!=="loading",null,{timeout:60000});
 const r=await p.evaluate(()=>{const r={};const M=Speech.GVOICES.m,F=Speech.GVOICES.f;
  r.описи=[M.state,F.state];
  const есть=(g,k)=>!!((g.map&&g.map[k])||(g.pack&&g.pack.map&&g.pack.map[k]));
  const толькоМ=Object.keys(M.map||{}).find(k=>!есть(F,k)),толькоЖ=Object.keys(F.map||{}).find(k=>!есть(M,k));
  r.толькоМ=толькоМ;r.толькоЖ=толькоЖ;
  const v0=settings.gvVoice,s0=settings.voice;
  try{
   settings.gvVoice="f";r.главныйЖ=Speech.gvMain()===F;r.жМужскаяФраза=Speech.gvClip(толькоМ);r.жСвоя=Speech.gvClip(толькоЖ);
   settings.gvVoice="m";r.главныйМ=Speech.gvMain()===M;r.мЖенскаяФраза=Speech.gvClip(толькоЖ);r.мСвоя=Speech.gvClip(толькоМ);
   /* голоса устройства — подставные */
   const a0=Speech.allVoices;const голос=(name,uri)=>({name,lang:"ru-RU",localService:true,voiceURI:uri||name});
   const с=(vs,g)=>{Speech.allVoices=()=>vs;settings.gvVoice=g;settings.voice="";const v=Speech._fallbackVoice();return v?(v.espeak?"eSpeak:"+v.пол:v.name):null;};
   try{
    const оба=[голос("Milena"),голос("Pavel")],жен=[голос("Milena")],муж=[голос("Pavel")],немой=[голос("Google русский","ru-ru-language")];
    r.обаЖ=с(оба,"f");r.обаМ=с(оба,"m");r.женПриМ=с(жен,"m");r.мужПриЖ=с(муж,"f");r.безПолаЖ=с(немой,"f");r.безПолаМ=с(немой,"m");
    r.гуглЖ=с([голос("ru-ru-x-dfc-local"),голос("ru-ru-x-rud-local")],"f");r.гуглМ=с([голос("ru-ru-x-dfc-local"),голос("ru-ru-x-rud-local")],"m");
    r.гуглRuc=Speech.voiceGender(голос("ru-ru-x-ruc-network"));r.гуглRuf=Speech.voiceGender(голос("ru-ru-x-ruf-local"));
    /* 5. выбор игрока главнее */
    Speech.allVoices=()=>жен;settings.gvVoice="m";settings.voice=Speech.voiceKey(жен[0]);const vv=Speech._fallbackVoice();r.выборИгрока=vv&&vv.name;
    /* адаптер для eSpeak нужного пола */
    const ad=Speech._voiceAdapter({espeak:true,пол:"f",voiceURI:"espeak:f",name:"eSpeak NG"});r.адаптер=ad&&ad.name;
   }finally{Speech.allVoices=a0;}
  }finally{settings.gvVoice=v0;settings.voice=s0;}
  return r;});
 /* 6. eSpeak: женский вариант выше мужского */
 await p.evaluate(()=>ESpeak.load());
 await p.waitForFunction(()=>ESpeak.st!=="loading",null,{timeout:90000});
 const e=await p.evaluate(async()=>{
  const r={st:ESpeak.st};if(!ESpeak.ready())return r;
  const высота=async blob=>{const buf=new Uint8Array(await blob.arrayBuffer());const dv=new DataView(buf.buffer);
   const sr=dv.getUint32(24,true),n=(buf.length-44)>>1,x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=dv.getInt16(44+2*i,true)/32768;
   /* высота по автокорреляции окон 40 мс в громкой части */
   const W=Math.round(0.04*sr),fs=[];
   for(let s=0;s+W<=n;s+=W){let e=0;for(let i=s;i<s+W;i++)e+=x[i]*x[i];if(e/W<1e-3)continue;
    let best=0,lag=0;for(let L=Math.round(sr/400);L<=Math.round(sr/70);L++){let c=0,a=0,b=0;for(let i=s;i+L<s+W;i++){c+=x[i]*x[i+L];a+=x[i]*x[i];b+=x[i+L]*x[i+L];}
     const v=c/Math.sqrt(a*b+1e-12);if(v>best){best=v;lag=L;}}
    if(best>0.5)fs.push(sr/lag);}
   fs.sort((a,b)=>a-b);return fs.length?fs[fs.length>>1]:0;};
  const t="Здоровье полное. Вы в безопасности, рядом никого нет.";
  const м=ESpeak.wav(t,5,1,"m"),ж=ESpeak.wav(t,5,1,"f"),м2=ESpeak.wav(t,5,1);
  r.пол=ESpeak.пол;r.муж=м&&await высота(м);r.жен=ж&&await высота(ж);r.поУмолчанию=м2&&await высота(м2);return r;});
 check('1. выбранный голос один: фраза другого голоса записью не звучит',
  r.описи.join()==="ready,ready"&&r.толькоМ&&r.толькоЖ&&r.главныйЖ&&r.главныйМ&&r.жМужскаяФраза===null&&r.мЖенскаяФраза===null&&/gvoice_f\//.test(r.жСвоя||"")&&/gvoice\//.test(r.мСвоя||""),r);
 check('2. незаписанное — голос устройства того же пола',r.обаЖ==="Milena"&&r.обаМ==="Pavel",{ж:r.обаЖ,м:r.обаМ});
 check('3. нет голоса того же пола — eSpeak того же пола',
  r.женПриМ==="eSpeak:m"&&r.мужПриЖ==="eSpeak:f"&&r.безПолаЖ==="eSpeak:f"&&r.безПолаМ==="eSpeak:m"&&r.адаптер==="espeak",
  {женПриМ:r.женПриМ,мужПриЖ:r.мужПриЖ,безПолаЖ:r.безПолаЖ,безПолаМ:r.безПолаМ,адаптер:r.адаптер});
 check('4. голоса Google: x-dfc/x-ruc женские, x-rud/x-ruf мужские',
  r.гуглЖ==="ru-ru-x-dfc-local"&&r.гуглМ==="ru-ru-x-rud-local"&&r.гуглRuc==="f"&&r.гуглRuf==="m",{ж:r.гуглЖ,м:r.гуглМ,ruc:r.гуглRuc,ruf:r.гуглRuf});
 check('5. голос устройства, выбранный игроком, главнее',r.выборИгрока==="Milena",r.выборИгрока);
 check('6. eSpeak: женский вариант заметно выше мужского, без пола — мужской',
  e.st==="ready"&&e.муж>0&&e.жен>e.муж*1.3&&Math.abs(e.поУмолчанию-e.муж)<e.муж*0.1&&e.пол==="m",e);
 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

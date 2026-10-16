// Проверка речи в приложении для компьютера: выбор синтезатора и голоса,
// установленные в Windows. Для каждого синтезатора игры (голос Gemini,
// синтезатор устройства) и для каждого голоса компьютера,
// который игра показывает в списке, фраза произносится так, как её говорит
// игра, и ждётся конец фразы. Запуск: electron voicecheck.js.
const { app, BrowserWindow } = require('electron');
// Журнал моста голосов (что ушло мосту и что он ответил) — печатается, если
// проверка не прошла: видно, какая команда сняла фразу.
const { Proc } = require('./sapi.js');
const t0 = Date.now(), журнал = [];
const пиши = s => { журнал.push(((Date.now() - t0) / 1000).toFixed(2) + ' ' + s); if (журнал.length > 300) журнал.shift(); };
const send0 = Proc.prototype.send, line0 = Proc.prototype.line;
Proc.prototype.send = function (...a) { if (a[0] !== 'srcheck') пиши(this.bits + ' бит ← ' + a.map(x => String(x).slice(0, 48)).join(' ')); return send0.apply(this, a); };
Proc.prototype.line = function (l, d) { if (/^(done|cancel|error|ready|fatal)/.test(l)) пиши(this.bits + ' бит → ' + l.slice(0, 80)); return line0.call(this, l, d); };
require('./main.js');
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const w = BrowserWindow.getAllWindows()[0];
  const js = s => w.webContents.executeJavaScript(s);
  for (let i = 0; i < 40 && !(await js('typeof Speech==="object"&&typeof enterGame==="function"').catch(() => false)); i++) await wait(500);
  await js(`(()=>{try{enterGame();}catch(e){}while(activeLayer())closeTopUI();return 1;})()`);
  await wait(1500);
  // Одна фраза тем адаптером, который игра выбрала сейчас; ждём конец.
  // Фраза идёт мимо очереди речи игры, поэтому своя речь игры (подсказка
  // «Если вы здесь впервые…», объявление синтезатора, голоса, поднявшиеся
  // позже) пока звучит проверка, адаптер не трогает: иначе она снимала
  // фразу проверки, и та «не кончалась» — проверка падала то на одном, то
  // на другом синтезаторе. Своя речь игры в это время считается сказанной.
  const скажи = (text) => (пиши('— проверка: ' + text), js(`new Promise(res=>{const t0=Date.now();let a=null;
    try{Speech.stop&&Speech.stop();a=Speech._adapter();}catch(e){return res({ok:false,why:String(e)});}
    if(!a)return res({ok:false,why:"нет синтезатора"});
    const sp=a.speak,cn=a.cancel;let свои=0,итог=false;
    a.speak=function(t,o){свои++;if(o&&o.onend)setTimeout(()=>{try{o.onend();}catch(_){}},0);return true;};a.cancel=function(){};
    const готово=(ok,why)=>{if(итог)return;итог=true;a.speak=sp;a.cancel=cn;res({ok,why,адаптер:a.name,мс:Date.now()-t0,своейРечиИгры:свои});};
    setTimeout(()=>готово(false,"нет конца фразы за 20 с"),20000);
    const r=sp.call(a,${JSON.stringify(text)},{rate:1.5,volume:1,onend:()=>готово(true,""),onerror:()=>готово(false,"ошибка синтезатора")});
    if(r===false)готово(false,"не принял фразу");})`));
  const out = { мост: await js('!!(window.GraniTTS&&GraniTTS.speak)'), синтезаторы: {}, голоса: [] };
  out.причина = await js('window.graniDesktop&&graniDesktop.ttsDiag?graniDesktop.ttsDiag():""');
  out.список = await js(`Speech.allVoices().map(v=>({ключ:Speech.voiceKey(v),имя:v.name,язык:v.lang,мост:!!v.native,движок:v.engine||""}))`);
  out.показано = await js(`(Speech.fillVoices(),[...document.querySelectorAll("#setVoice option")].map(o=>o.textContent))`);
  for (const e of ['gemini', 'device']) {
    await js(`(()=>{const t=document.getElementById("setTtsEngine");t.value=${JSON.stringify(e)};t.dispatchEvent(new Event("change"));return 1;})()`);
    await wait(1500);
    out.синтезаторы[e] = Object.assign({ настройка: await js('settings.ttsEngine') },
      await скажи(e === 'gemini' ? 'Добро пожаловать в Грань Миров.' : 'Проверка синтезатора игры.'));
  }
  // Каждый голос компьютера: выбрать в настройках речи и произнести фразу.
  await js(`(()=>{const t=document.getElementById("setTtsEngine");t.value="device";t.dispatchEvent(new Event("change"));return 1;})()`);
  for (const v of out.список.slice(0, 12)) {
    const выбран = await js(`Speech.pickVoice(${JSON.stringify(v.ключ)},{say:false})`);
    const r = await скажи(/^ru/i.test(v.язык) ? 'Здравствуй, путник. Это голос ' + v.имя + '.' : 'Hello, traveller. This is ' + v.имя + '.');
    out.голоса.push(Object.assign({ имя: v.имя, язык: v.язык, мост: v.мост, выбран }, r));
  }
  // Мост голосов Windows напрямую — каждым его голосом, в том числе теми,
  // что в списке игры не повторяются, потому что их уже показал Chromium.
  out.мостом = out.мост ? await js(`(async()=>{const vs=JSON.parse(GraniTTS.getVoices()||"[]");const r=[];
    const d0=window.GraniTTSDone,e0=window.GraniTTSError;
    for(const v of vs){const id="vc"+r.length;
      const res=await new Promise(z=>{const t=setTimeout(()=>z("нет ответа"),15000);
        window.GraniTTSDone=x=>{if(x===id){clearTimeout(t);z("конец");}};window.GraniTTSError=x=>{if(x===id){clearTimeout(t);z("ошибка");}};
        GraniTTS.setVoice(v.id);GraniTTS.speak(/^ru/i.test(v.lang)?"Проверка голоса.":"Voice check.",1.5,1,id);});
      r.push({имя:v.name,движок:v.engine,итог:res});}
    window.GraniTTSDone=d0;window.GraniTTSError=e0;return r;})()`) : [];
  console.log('VOICECHECK ' + JSON.stringify(out));
  const синтОк = Object.values(out.синтезаторы).filter(x => x.ok).length;
  const голосОк = out.голоса.filter(x => x.ok).length;
  const мостОк = out.мостом.filter(x => x.итог === 'конец').length;
  console.log(`VOICECHECK итог: синтезаторов говорят ${synthLine(out)}; голосов в списке игры говорят ${голосОк} из ${out.голоса.length}; мостом Windows говорят ${мостОк} из ${out.мостом.length}`);
  const прошла = синтОк === 2 && (out.голоса.length === 0 || голосОк > 0);
  if (!прошла) console.log('VOICECHECK мост:\n' + журнал.join('\n'));
  app.exit(прошла ? 0 : 1);
}, 3000));
function synthLine(out) { return Object.entries(out.синтезаторы).map(([k, v]) => k + (v.ok ? '✓' : '✗(' + v.why + ')')).join(', '); }

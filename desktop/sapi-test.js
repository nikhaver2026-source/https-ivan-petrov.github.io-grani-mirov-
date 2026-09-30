// Проверка моста голосов Windows на сервере сборки: список голосов (SAPI 5 и
// голоса Windows 10/11), запись фразы каждым голосом в файл и живая фраза с
// сообщением о конце — так, как её говорит игра.
const { Sapi } = require('./sapi.js');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const s = new Sapi();
  const ok = await s.start(30000);
  console.log('SAPI поднят:', ok, 'голосов:', s.voices.length);
  let good = 0;
  for (const v of s.voices) {
    const f = path.join(os.tmpdir(), 'grani-sapi-' + good + '-' + Date.now() + '.wav');
    // Голос читает только свой язык: английскому голосу — английская фраза.
    const w = await s.wav(f, /^ru/i.test(v.lang) ? 'Проверка голоса для Грани Миров.' : 'Voice check for Grani Mirov.', v.name);
    const size = fs.existsSync(f) ? fs.statSync(f).size : 0;
    if (w === true && size > 1000) good++;
    console.log('  голос:', v.name, '|', v.lang, '|', v.gender, '|', v.kind, v.default ? '| по умолчанию' : '', '| запись:', w === true ? size + ' байт' : w);
  }
  const l0 = s.line.bind(s); s.line = (l, d) => { if (/^(error|done|cancel)/.test(l)) console.log('  мост:', l); return l0(l, d); };
  const ru = s.voices.find(v => /^ru/i.test(v.lang));
  const конец = await new Promise(r => {
    s.onDone = (kind, id) => { if (id === '7') r(kind); };
    s.speak(ru ? 'Проверка живой речи.' : 'Live speech check.', 1.5, 1, '7');
    setTimeout(() => r('нет ответа'), 15000);
  });
  console.log('живая фраза:', конец);
  console.log('голосов с записью:', good, 'из', s.voices.length);
  s.quit();
  process.exit(ok && good > 0 ? 0 : 1);
})();

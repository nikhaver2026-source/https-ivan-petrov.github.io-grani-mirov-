// Проверка единого обработчика речи Windows (desktop/sapi.js) без Windows:
// процессы моста заменены поддельными, проверяется то, что решает сам
// обработчик, — какой голос говорит, куда уходит фраза, что делается, когда
// NVDA или JAWS запустили или закрыли посреди игры, и что вопрос игры о
// голосах не читает файлы с диска.
//   node desktop/sapi-logic.test.js
'use strict';
const fs = require('fs');
const { Sapi, Proc, SR_NAMES } = require('./sapi.js');

let fails = 0;
function ok(cond, msg) { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails++; }
function fake(bits, native, voices) {
  return { bits, native, ready: true, voices: voices.map(v => Object.assign({ gender: '', default: false, vendor: '' }, v)), sent: [], sr: 'lib down', send(...a) { this.sent.push(a.map(String)); }, quit() { } };
}
const last = p => p.sent[p.sent.length - 1] || [];
const RH = 'Aleksandr — RHVoice', ES = 'eSpeak NG — ru', OLD = 'Старый голос SAPI 32';

const s = new Sapi();
const p64 = fake(64, true, [{ name: RH, lang: 'ru-RU', kind: 'rhvoice' }, { name: ES, lang: 'ru-RU', kind: 'espeak' }]);
const p32 = fake(32, false, [{ name: OLD, lang: 'ru-RU', kind: 'sapi32', vendor: 'Acme' }]);
s.procs = [p64, p32];
for (const p of s.procs) { p.onDone = (k, id) => s.end(k, id); p.onSr = (nv, jw) => s.srState(p, nv, jw); }
const ends = []; s.onDone = (k, id) => ends.push(k + ' ' + id);
let changes = 0; s.onChange = () => changes++;

console.log('Голос и список голосов');
s.merge();
ok(s.cur === RH && s.auto === RH, 'голос выбирается сам: русский RHVoice (' + s.cur + ')');
ok(last(p64)[0] === 'voice' && last(p64)[1] === RH, 'процессу моста — «voice» с этим голосом');
const rf = fs.readFileSync, ex = fs.existsSync, rd = fs.readdirSync; let reads = 0;
fs.readFileSync = function () { reads++; return rf.apply(this, arguments); };
fs.existsSync = function () { reads++; return ex.apply(this, arguments); };
fs.readdirSync = function () { reads++; return rd.apply(this, arguments); };
let list; for (let i = 0; i < 200; i++) list = s.list();
fs.readFileSync = rf; fs.existsSync = ex; fs.readdirSync = rd;
ok(reads === 0 && list.length === 3 && list.some(v => v.auto && v.id === RH), 'вопрос игры о голосах (200 раз) не читает файлов с диска (чтений: ' + reads + ')');

console.log('Фраза и очередь');
s.speak('Дверь открыта.', 1, 1, 'u1', { queue: true });
ok(last(p64)[0] === 'speakq' && last(p64)[1] === 'u1' && last(p64)[4] === 'Дверь открыта.', 'фраза следом — «speakq» процессу голоса');
ok(last(p32)[0] === 'stop', 'другому процессу — «stop»');
s.speak('Тревога!', 1, 0.5, 'u2');
ok(last(p64)[0] === 'speak' && last(p64)[3] === '50', 'фраза без очереди — «speak» (как у «Грани Миров»), громкость 50');
// 32-битный мост ответил позже срока, голоса перечитаны — фраза 64-битного
// звучит дальше: тот же голос заново не шлётся (прежде «voice» посреди фразы
// SAPI снимал её конец, и игра ждала его в тишине).
const n0 = p64.sent.length; s.merge(); s.merge();
ok(p64.sent.length === n0, 'мост, ответивший позже, не шлёт «voice» посреди фразы');
s.stop();
ok(last(p64)[0] === 'stop' && last(p32)[0] === 'stop' && s.speaking.size === 0, '«stop» — обоим процессам, мост молчит');

console.log('NVDA запустили и закрыли посреди игры');
changes = 0;
p64.onSr(true, false);
ok(s.voices.some(v => v.name === SR_NAMES.nvda && v.kind === 'sr'), 'голос NVDA появился сам');
ok(s.cur === SR_NAMES.nvda && changes === 1, 'и сразу говорит: игрок голос не выбирал (' + s.cur + ')');
const plat = Object.getOwnPropertyDescriptor(process, 'platform');
Object.defineProperty(process, 'platform', { value: 'win32' }); const dg = s.diag(); Object.defineProperty(process, 'platform', plat);
ok(/up$/.test(p64.sr) && /голос NVDA: доступен/.test(dg), 'в отчёте: голос NVDA доступен');
s.speak('Осмотреться.', 1, 1, 'u3', { queue: true });
ok(last(p64)[0] === 'speakq' && last(p64)[1] === 'u3', 'фраза — в очередь NVDA');
// мост: NVDA не принял фразу — «srstate 0 0», потом «error u3»
p64.onSr(false, false); s.end('error', 'u3');
ok(!s.voices.some(v => v.name === SR_NAMES.nvda) && s.cur === RH, 'NVDA закрыт: его голоса нет, говорит RHVoice');
ok(last(p64)[0] === 'speakq' && last(p64)[1] === 'u3' && last(p64)[4] === 'Осмотреться.', 'та же фраза сразу ушла RHVoice');
ok(!ends.includes('error u3'), 'игра сбоя не заметила');
s.end('done', 'u3');
ok(ends.includes('done u3') && s.speaking.size === 0, 'конец фразы — в игру');
// чтец отказал, а сообщения «srstate» не было: обработчик сам убирает его голос
p64.onSr(true, false); s.speak('Шаг.', 1, 1, 'u4', { queue: true }); s.end('error', 'u4');
ok(s.cur === RH && last(p64)[1] === 'u4' && !ends.includes('error u4'), 'отказ NVDA без «srstate» — фраза тоже ушла RHVoice');
// повторный отказ той же фразы игре сообщается (дальше решает игра)
s.end('error', 'u4');
ok(ends.includes('error u4'), 'второй отказ той же фразы — игре');

console.log('Выбор игрока помнится');
s.setVoice(SR_NAMES.jaws);
ok(s.want === SR_NAMES.jaws && s.cur === RH, 'выбран JAWS, он не запущен — пока говорит RHVoice');
p64.onSr(false, true);
ok(s.cur === SR_NAMES.jaws, 'JAWS запустили — говорит он');
p64.onSr(false, false);
ok(s.cur === RH, 'JAWS закрыли — снова RHVoice');
p64.onSr(true, true);
ok(s.cur === SR_NAMES.jaws, 'запустили оба — говорит выбранный JAWS, а не NVDA');
s.setVoice('');
ok(s.want === '' && s.cur === SR_NAMES.nvda, '«выбирать самому» — снова голос NVDA (' + s.cur + ')');
s.setVoice(OLD);
s.speak('Проверка.', 1, 1, 'u5', { queue: true });
ok(s.cur === OLD && last(p32)[0] === 'speakq' && last(p64)[0] === 'stop', '32-битный голос — фраза его процессу, 64-битному — «stop»');

console.log('Мост поднят заново');
s.setVoice(RH);
const p64b = fake(64, true, p64.voices.filter(v => v.kind !== 'sr'));
for (const p of [p64b]) { p.onDone = (k, id) => s.end(k, id); p.onSr = (nv, jw) => s.srState(p, nv, jw); }
s.procs = [p64b, p32]; s.merge();
ok(s.cur === RH && last(p64b)[0] === 'voice' && last(p64b)[1] === RH, 'новый процесс моста получает «voice» с тем же голосом');

console.log('Строки моста');
const pr = new Proc('x', 64, true); const got = [];
pr.onSr = (nv, jw) => got.push('sr ' + nv + ' ' + jw); pr.onDone = (k, id) => got.push(k + ' ' + id);
['srstate 1 0', 'srstate 0 1', 'srstate x', 'cancel u7', 'done u8', 'error u9 NVDA не отвечает (1722)', 'sr lib up'].forEach(l => pr.line(l));
ok(got.join('|') === 'sr true false|sr false true|cancel u7|done u8|error u9' && pr.sr === 'lib up', 'srstate, cancel, done, error и sr разобраны: ' + got.join('|'));

s.quit();
console.log(fails ? 'ОШИБОК: ' + fails : 'ВСЁ ХОРОШО');
process.exit(fails ? 1 : 0);

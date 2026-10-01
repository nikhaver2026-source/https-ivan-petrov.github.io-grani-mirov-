// Готовый мост голосов Windows — при сборке приложения, а не у игрока.
// Прежде мост (код C# в sapi.js) собирался на компьютере игрока при первом
// запуске: от пяти до тридцати секунд, а антивирус или кириллица в имени
// пользователя (папка TEMP) могли сборку сорвать — и игра оставалась только с
// голосами, которые видит Chromium (Ирина, Павел и английские), без RHVoice,
// Acapela, Vocalizer и прочих. Теперь библиотека собирается здесь, на сервере
// сборки (Windows), и лежит в приложении: desktop/sapi/grani-sapi-<отпечаток>.dll.
// Библиотека AnyCPU: её поднимают и 64-, и 32-битный PowerShell.
//   node sapi-build.js
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const { CS_SOURCE, TAG } = require('./sapi.js');
if (process.platform !== 'win32') { console.log('мост собирается только на Windows'); process.exit(0); }
const dir = path.join(__dirname, 'sapi');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const src = path.join(dir, 'grani-sapi.cs'), out = path.join(dir, 'grani-sapi-' + TAG + '.dll');
fs.writeFileSync(src, '\uFEFF' + CS_SOURCE, 'utf8');
const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
execFileSync(ps, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
  `$ErrorActionPreference='Stop'; Add-Type -ReferencedAssemblies System.Core, Microsoft.CSharp -TypeDefinition ([IO.File]::ReadAllText('${src}', [Text.Encoding]::UTF8)) -OutputAssembly '${out}' -OutputType Library`],
  { stdio: 'inherit' });
fs.rmSync(src, { force: true });
const size = fs.statSync(out).size;
console.log('мост собран:', path.basename(out), size, 'байт');
if (size < 4000) process.exit(1);

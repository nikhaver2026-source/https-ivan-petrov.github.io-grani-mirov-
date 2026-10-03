# sounds/espeak — eSpeak NG внутри игры (9.5.1)

Встроенный синтезатор речи **eSpeak NG** (https://github.com/espeak-ng/espeak-ng),
собранный в WebAssembly проектом Echogarden — пакет
`@echogarden/espeak-ng-emscripten` 0.3.5 (https://github.com/echogarden-project/espeak-ng).

- `espeak-ng.js` — движок; ES-модуль переделан в обычный скрипт
  (`window.GraniESpeakModule`), WebAssembly внутри файла.
- `espeak-ru-data.js` — данные eSpeak NG: русский словарь `ru_dict`, фонемы,
  интонации, описания голосов; словари прочих языков вырезаны.

Лицензия — GNU GPL 3.0 или новее, текст — `COPYING`.

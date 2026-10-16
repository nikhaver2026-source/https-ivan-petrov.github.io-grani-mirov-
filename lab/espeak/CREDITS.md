# lab/espeak — встроенный голос eSpeak NG

Запасной синтезатор речи «Подземной лаборатории»: говорит, когда на
устройстве нет русского голоса (и озвучивает роботов, если это включено).

Движок **eSpeak NG** (https://github.com/espeak-ng/espeak-ng), собранный в
WebAssembly проектом Echogarden — пакет `@echogarden/espeak-ng-emscripten`
0.3.5 (https://github.com/echogarden-project/espeak-ng). Взят из
`sounds/espeak` «Грани Миров» без изменений по сути:

- `espeak-ng.js` — движок; синтаксис переведён на уровень Chrome 69
  (esbuild, `--target=chrome69`), чтобы работать в WebView Android 9;
  ветка загрузки для Node (`await import("module")`) заменена заглушкой.
- `espeak-ru-data.js` — данные eSpeak NG: русский словарь, фонемы, голоса.

Лицензия — GNU GPL 3.0 или новее, текст — `COPYING`.

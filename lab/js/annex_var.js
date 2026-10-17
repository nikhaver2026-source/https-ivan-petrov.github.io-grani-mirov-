/* «Подземная лаборатория» — варианты помещений у коридоров: свои название, описание и обстановка (1.3).
   Файл собран из lab/tools/texts_src сборщиком lab/tools/build_texts.js — правьте исходники. */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
/* новые типы — в общую таблицу помещений (до annex.js) */
var NEW = {};
LAB.ANNEX_ROOMS = LAB.ANNEX_ROOMS || {};
for (var k in NEW) if (!LAB.ANNEX_ROOMS[k]) LAB.ANNEX_ROOMS[k] = NEW[k];
LAB.ANNEX_V = {};
})();

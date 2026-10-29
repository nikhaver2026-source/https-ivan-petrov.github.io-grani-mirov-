/* «Подземная лаборатория» — записанные реплики ОКО (js/okovoice.js).
   Собирает lab/tools/okovoice/manifest.py по папкам sounds/oko/m и sounds/oko/f:
   отпечатки текстов реплик (FNV-1a), у каждого — запись <отпечаток>.mp3; w — шёпот для эха.
   Руками не править. */
window.LAB = window.LAB || {};
LAB.OKO_VOICED = {
  /* мужской голос: 5 реплик */
  m: "15716212 3526ed88 6bb4dcc7 8a72ff45 aa3d378b",
  /* женский голос: 5 реплик */
  f: "15716212 3526ed88 6bb4dcc7 8a72ff45 aa3d378b",
  w: { m: "dveri nositel posle zabyvat", f: "dveri nositel posle zabyvat" },
  /* записаны ли все реплики обоими голосами: нет — голос ОКО в игре и в сборках не участвует */
  ready: false
};

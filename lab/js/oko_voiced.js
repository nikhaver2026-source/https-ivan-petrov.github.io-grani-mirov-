/* «Подземная лаборатория» — записанные реплики ОКО (js/okovoice.js).
   Собирает lab/tools/okovoice/manifest.py по папкам sounds/oko/m и sounds/oko/f:
   отпечатки текстов реплик (FNV-1a), у каждого — запись <отпечаток>.mp3; w — шёпот для эха.
   Руками не править. */
window.LAB = window.LAB || {};
LAB.OKO_VOICED = {
  /* мужской голос: 52 реплик */
  m: "051b9a1a 07c464ca 087c33c9 09743d10 0a18472c 0a489447 0c5002ba 15716212 21ff779d 3526ed88 360a7dbc 391735cf " +
    "3a02ba06 42c2f1cb 448defcf 4de522aa 505105fd 5a117ec2 6bb4dcc7 6be3593a 782a393e 7ceee105 7e8658e3 7f1be57d " +
    "883649f3 8a72ff45 9097dc92 99ffdaf1 9cd93c8b a096e447 a1f94fb7 aa3d378b af7eb77d b39fcaf0 b7a08874 b853eeb8 " +
    "b882cb9e baa84672 be5a7820 cc30c7d8 d1b42299 d59d9d4a d7848628 eb11c147 ecdabafb f3baacda f4924acb f57ff15b " +
    "f73f5f7f fd09756b fe355f9e fe7f5c46",
  /* женский голос: 53 реплик */
  f: "0102e35a 08202595 1139e515 1269c431 13438576 15122a95 15716212 236ce02c 2aa7324f 2edcded7 337b5090 34f2d5c2 " +
    "3526ed88 35430f85 3aa6de89 3fbea044 4685e832 49355966 5310f0ee 5a8eb74e 5b371999 5dee5df3 6bb4caa6 6bb4dcc7 " +
    "6ca30f21 72fddda9 82fe8502 8464e402 88a94a62 8a72ff45 8b272902 8b83cc6e 8c93031e 902b10e6 a02b0658 a91a54bf " +
    "aa3d378b ad3732e5 b3fc42d6 c0015cf7 c559caf5 d299417b d2b2dbd3 d606c840 d965b8a4 dfb8409d e57693df e6c42dfc " +
    "eedb2897 f14dcac0 fa97c249 fd72e17e ff5f0779",
  w: { m: "dveri nositel posle zabyvat", f: "dveri nositel posle zabyvat" },
  /* записаны ли все реплики обоими голосами: нет — голос ОКО в игре и в сборках не участвует */
  ready: false
};

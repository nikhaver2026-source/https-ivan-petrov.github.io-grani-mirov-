/* «Подземная лаборатория» — записанные реплики ОКО (js/okovoice.js).
   Собирает lab/tools/okovoice/manifest.py по папкам sounds/oko/m и sounds/oko/f:
   отпечатки текстов реплик (FNV-1a), у каждого — запись <отпечаток>.mp3; w — шёпот для эха.
   Руками не править. */
window.LAB = window.LAB || {};
LAB.OKO_VOICED = {
  /* мужской голос: 177 реплик */
  m: "051b9a1a 05a9f44f 06458a37 0749bf6e 077c2406 07c464ca 087c33c9 08a5299b 09743d10 0a18472c 0a489447 0c5002ba " +
    "0c5ed4da 0c8a94b7 0dcca023 0edd2df5 11bc5178 134f3e7c 14b04cf8 15190e75 15716212 1a71be8c 21d36fe2 21ff779d " +
    "25a080b2 25b39916 2d326874 2ef6cc86 3526ed88 360a7dbc 36232db9 391735cf 3a02ba06 3a80308f 3ceca169 3ed1de75 " +
    "3f888bb9 400ebacb 42c2f1cb 448defcf 4973a1e7 4de522aa 4e0dfb71 4efb9b99 505105fd 522e862b 52786141 533adfca " +
    "542e3ff5 5879bb5a 5a117ec2 5ad50c39 5cd85992 5d4b16e4 5de87852 5e473449 5ed1a6ae 646b34b8 64bf5424 657052ce " +
    "657284d9 65c3ca0a 68970627 6a177c85 6bb4dcc7 6be3593a 6c5f3cb4 717979f1 717b888c 744bb5ec 7531cfb1 76955658 " +
    "782a393e 78bc1648 7ceee105 7e8658e3 7f1be57d 82293c5d 822cccc7 83ade4d9 84f04c8f 8536b8df 87463c18 883649f3 " +
    "8a72ff45 8c9a550d 908c1154 9097dc92 91c50205 92e34938 94984a7f 94ab5ad9 954c433f 97b0b54d 98d6a332 995958d4 " +
    "99ffdaf1 9ac7338f 9cd93c8b 9dc1e3e4 a096e447 a1222525 a1f94fb7 a272ae3f a740ec4e a7d02a2f a8173c1a a8887e52 " +
    "aa3d378b ad915317 ae05f8c1 af7eb77d b0692c96 b39fcaf0 b4549c64 b7a08874 b853eeb8 b882cb9e b9b6f586 baa84672 " +
    "baf1923c bbc6eeca bbec198e bc174dbb bd51d370 be5a7820 c464a4ea c62cf695 c6d228e0 c6eff64d c9beea64 cc30c7d8 " +
    "cc55de45 cef8d054 d08626e7 d1b42299 d260b5c9 d59d9d4a d7848628 d8ec20b9 da2a588e dc6337c5 de32adc7 df5e074c " +
    "df79280b e1b05a31 e3022b9c e324b46f e3c96e9f e458d93f e769f113 e7e2c05f e939855d ea19c513 eb11c147 ecdabafb " +
    "ed6cba1f ee4c7794 f02a3bb7 f1eea7a5 f2bd8cc0 f2efdcca f33bb177 f3baacda f4924acb f4a3f1fa f4dbc858 f553b9fc " +
    "f57ff15b f6e088a3 f7312fec f73f5f7f f9182000 fcd5f1eb fd09756b fe355f9e fe7f5c46",
  /* женский голос: 165 реплик */
  f: "0102e35a 051b9a1a 0749bf6e 077c2406 07c464ca 08202595 087c33c9 09743d10 0a18472c 0a489447 0c5002ba 0c5ed4da " +
    "0edd2df5 1139e515 1269c431 13438576 134f3e7c 14b04cf8 15122a95 15190e75 15716212 21ff779d 236ce02c 25b39916 " +
    "2aa7324f 2dadde53 2edcded7 337b5090 34f2d5c2 3526ed88 35430f85 360a7dbc 391735cf 3a02ba06 3a80308f 3aa6de89 " +
    "3ceca169 3f888bb9 3fbea044 400ebacb 42c2f1cb 448defcf 4685e832 49355966 4973a1e7 4de522aa 4e0dfb71 4eb56305 " +
    "505105fd 522e862b 5310f0ee 533adfca 5a117ec2 5a8eb74e 5b371999 5d4b16e4 5de87852 5dee5df3 5e473449 5ed1a6ae " +
    "646b34b8 657284d9 68970627 6bb4caa6 6bb4dcc7 6be3593a 6c5f3cb4 6ca30f21 717979f1 72fddda9 76955658 782a393e " +
    "78bc1648 7ceee105 7e8658e3 7f1be57d 82293c5d 82fe8502 83ade4d9 8464e402 84f04c8f 87463c18 88a94a62 8a72ff45 " +
    "8b272902 8b83cc6e 8c93031e 8c9a550d 902b10e6 908c1154 9097dc92 92e34938 97b0b54d 98d6a332 99ffdaf1 9ac7338f " +
    "9cd93c8b 9dc1e3e4 a02b0658 a096e447 a1222525 a1f94fb7 a272ae3f a3412a84 a8887e52 a91a54bf aa3d378b ad3732e5 " +
    "ae05f8c1 af7eb77d b0692c96 b39fcaf0 b3fc42d6 b4549c64 b7a08874 b853eeb8 baf1923c bbec198e bd51d370 c0015cf7 " +
    "c464a4ea c559caf5 c6d228e0 c9beea64 cc30c7d8 cef8d054 d08626e7 d299417b d2b2dbd3 d606c840 d7848628 d965b8a4 " +
    "da2a588e dc6337c5 de32adc7 dfb8409d e1b05a31 e458d93f e57693df e6c42dfc e769f113 ea19c513 eb11c147 ecdabafb " +
    "ed6cba1f ee4c7794 eedb2897 ef4a5f09 f14dcac0 f1eea7a5 f2bd8cc0 f2efdcca f33bb177 f4924acb f4a3f1fa f57ff15b " +
    "f6e088a3 f73f5f7f fa97c249 fcd5f1eb fd09756b fd72e17e fe355f9e fe7f5c46 ff5f0779",
  w: { m: "dveri nositel posle zabyvat", f: "dveri nositel posle zabyvat" },
  /* записаны ли все реплики обоими голосами: нет — голос ОКО в игре и в сборках не участвует */
  ready: false
};

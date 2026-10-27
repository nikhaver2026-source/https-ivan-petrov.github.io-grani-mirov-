#!/bin/bash
# PHASE=3 — только материки; 4 — с престолами; 5 — магия Грани; 6 — живые города; 7 — сюжеты; 8 — звук; 9 (по умолчанию) — всё, с проверкой Режиссёра.
cd "$(dirname "$0")"
P=${PHASE:-9}
PHASE=$P python3 rebuild.py && python3 patch_guide_mater.py || exit 1
if [ "$P" -ge 4 ]; then python3 patch_guide_thr.py || exit 1; fi
if [ "$P" -ge 5 ]; then python3 patch_guide_mag.py || exit 1; fi
if [ "$P" -ge 6 ]; then python3 patch_guide_lc.py || exit 1; fi
if [ "$P" -ge 7 ]; then python3 patch_guide_tales.py || exit 1; fi
if [ "$P" -ge 8 ]; then python3 patch_guide_snd.py || exit 1; fi
if [ "$P" -ge 9 ]; then python3 patch_guide_dir.py && python3 patch_guide_zv.py && python3 patch_guide_v150.py && python3 patch_guide_q150.py && python3 patch_guide_door147.py && python3 patch_guide_nem150.py && python3 patch_guide_z150.py && python3 patch_guide_nem155.py && python3 patch_guide_zv155.py && python3 patch_guide_svod155.py && python3 patch_guide_torg160.py && python3 patch_guide_put165.py && python3 patch_guide_r170.py && python3 patch_guide_p170.py && python3 patch_guide_e175.py && python3 patch_guide_k180.py || exit 1; fi
cp /home/user/https-ivan-petrov.github.io-grani-mirov-/index.html index_mater_wip.html

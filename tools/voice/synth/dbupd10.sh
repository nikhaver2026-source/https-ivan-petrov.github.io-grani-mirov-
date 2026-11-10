#!/bin/bash
# dbupd10.sh — записи 9 и 10 ноября в базу склейки (мужской); прежняя база — в *.before10; пересчёт мерок: звучание записей,
# хрип и срывы голоса, высота краёв
cd /root/S/us2
for f in db_m.jsonl occ_m_map.json phidx_m.npz creak_m.json pbreak_m.json edgef0_m.json voice_scan_m.json rq_m.json; do [ -f $f ] && cp $f ${f%.*}.before10.${f##*.}; done
python3.13 db_build.py m add
python3.13 align_new.py m /root/S/us2/db_m.jsonl
rm -f /root/S/us2/feat_m.npz
python3.13 -c "import sys; sys.path.insert(0,'/root/S/us2'); import engine as E; V=E.Голос('m'); print('записей', len(V.recs), 'вхождений', len(V.occ))"
python3.13 occ_check.py m inc
python3.13 phone_index.py m
python3.13 rec_quality.py m
python3.13 creak.py m
python3.13 edgef0.py m
python3.13 voice_scan.py
echo ГОТОВО

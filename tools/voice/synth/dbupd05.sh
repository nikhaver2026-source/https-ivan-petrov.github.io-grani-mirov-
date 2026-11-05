#!/bin/bash
# dbupd05.sh — новые записи 5 ноября в базу склейки (мужской): дополнение базы, разметка звуков, признаки, чистота новых вхождений
cd /root/S/us2
python3.13 db_build.py m add
python3.13 align_new.py m /root/S/us2/db_m.jsonl /root/S/us2/db_m_corpus.jsonl
rm -f /root/S/us2/feat_m.npz
python3.13 -c "import sys; sys.path.insert(0,'/root/S/us2'); import engine as E; V=E.Голос('m'); print('записей', len(V.recs), 'вхождений', len(V.occ))"
python3.13 occ_check.py m inc
echo ГОТОВО

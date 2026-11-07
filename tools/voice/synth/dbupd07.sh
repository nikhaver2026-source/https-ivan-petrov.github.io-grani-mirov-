#!/bin/bash
# dbupd07.sh — записи 7 ноября в базу склейки (мужской): интерфейс + корпус слов (corpus_oov); прежняя база — в *.before07
cd /root/S/us2
for f in db_m.jsonl db_m_corpus.jsonl occ_m_map.json phidx_m.npz; do [ -f $f ] && cp $f ${f%.*}.before07.${f##*.}; done
python3.13 db_build.py m add
CORPUS_DIR=/root/S/us2/corpus_oov python3.13 db_build.py m corpus add
python3.13 align_new.py m /root/S/us2/db_m.jsonl
python3.13 align_new.py m /root/S/us2/db_m_corpus.jsonl
rm -f /root/S/us2/feat_m.npz
python3.13 -c "import sys; sys.path.insert(0,'/root/S/us2'); import engine as E; V=E.Голос('m'); print('записей', len(V.recs), 'вхождений', len(V.occ))"
python3.13 occ_check.py m inc
python3.13 phone_index.py m
python3.13 rec_quality.py m
echo ГОТОВО

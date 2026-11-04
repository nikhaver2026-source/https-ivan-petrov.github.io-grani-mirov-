#!/bin/bash
# apply.sh ЧИСЛО — встроить нарезанное РОВНО ОДИН РАЗ, собрать игру конвейером, сверить, обновить копию конвейера,
# убрать raw/ и cut/ дня в архив d<ЧИСЛО>/.
set -e; D=${1:?число}; R=/home/user/https-ivan-petrov.github.io-grani-mirov-
python3 /root/S/gvrec/gvapply.py
(cd /root/S/hron && PHASE=9 bash build_all.sh > /root/S/gvrec/build_$D.log 2>&1)
cd $R && python3 /root/S/gvrec/ci2.py && bash tools/pipeline/sync.sh > /dev/null 2>&1
mkdir -p /root/S/gvrec/d$D && mv /root/S/gvrec/raw /root/S/gvrec/cut /root/S/gvrec/d$D/
echo "встроено; архив дня — /root/S/gvrec/d$D"

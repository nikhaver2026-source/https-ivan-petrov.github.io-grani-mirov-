#!/bin/bash
# дособрать фразы с наборов, упавших при первом сборе (перехватчик звал сам себя)
L=$(cat /root/S/gvrec/cap_fail.txt); a=();b=();c=();i=0
for n in $L; do case $((i%3)) in 0) a+=($n);; 1) b+=($n);; 2) c+=($n);; esac; i=$((i+1)); done
CORE=1 bash /root/S/runlist_c.sh /root/S/cap04b_1.txt ${a[@]} & CORE=2 bash /root/S/runlist_c.sh /root/S/cap04b_2.txt ${b[@]} & CORE=3 bash /root/S/runlist_c.sh /root/S/cap04b_3.txt ${c[@]} &
wait; echo "== дособрано $(date -u +%T)" >> /root/S/cap04b_1.txt

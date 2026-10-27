"""releaseA10a.py — Альфа 1.0: чистка основы от мёртвого (полная проверка 27 октября 2026, tools/pipeline/audit).

Что снято и почему:
* старые объявления magicSlotSwipe, safeOpenMagicPanel и buyCountButtons: поздние модули (fix146, torg160) заменяли
  их целиком, прежнее тело ни разу не вызывалось; теперь единственное определение — в модуле;
* команды без единой кнопки, жеста и вызова: diplosay, attrssay, grimsay, carriersay, carpot, gestpick, tavernevt,
  buywater, buyflask;
* прежние shoptab и shopcat (их целиком заменяет zv146_late.js) и zvride (zver155_late.js); shopitem и shopback
  остаются — zv146 их только оборачивает.
И формулы роста ремёсел и зверей — прямо в основе, а не перезаписью из модуля rost180.
Тексты снятого — в releaseA10a_old.json. Повторный запуск ничего не меняет."""
import json,os
B="/root/S/hron/index_before_mater.html"
OLD=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"releaseA10a_old.json"),encoding="utf-8"))
s=open(B,encoding="utf-8").read();n=0
ГДЕ={"magicSlotSwipe":"fix146_late.js","safeOpenMagicPanel":"fix146_late.js","buyCountButtons":"torg160_late.js"}
for k,t in OLD["fn"].items():
    c=s.count(t)
    if c==0:continue
    assert c==1,(k,c);s=s.replace(t,f"/* (Альфа 1.0) {k} — единственное определение в {ГДЕ[k]} */");n+=1
for k,(t,) in OLD["props"].items():
    c=s.count(t)
    if c==0:continue
    assert c==1,(k,c);s=s.replace(t,"");n+=1
for a,b in [("function mastNeed(ур){return 20+ур*ур*22;}","function mastNeed(ур){return 40+45*ур*ур;}   /* (18.0) прежде 20 + 22·ур² */"),
            (" need(a){return 20+15*(Number(a.lvl)||1);},"," need(a){const l=Number(a&&a.lvl)||1;return 40+30*l+l*l;},   /* (18.0) прежде 20 + 15·L */")]:
    c=s.count(a)
    if c==0:assert b in s,a;continue
    assert c==1,(a,c);s=s.replace(a,b);n+=1
open(B,"w",encoding="utf-8").write(s)
print("основа: правок",n)

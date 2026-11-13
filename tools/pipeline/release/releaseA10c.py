"""releaseA10c.py — правка основы 13 ноября 2026: имена жителей в подписях карточки — в падеже.

Было: «Поговорить с Ирор», «Учиться у Веленншар: Старейшина» — имя в именительном падеже. Теперь имяВ(n, падеж)
склоняет имя (правила — имя180 из модуля поселений, пол — из души жителя: женские имена на согласную не склоняются):
«Поговорить с Ирором», «Учиться у Веленншара». То же в модуле молвы: «Спросить у Селога».
Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read();n=0
ПРАВКИ=[
 ("""function npcSoul(n){
 try{
  if(!n||!n.key)return null;""",
  """/* (13 ноября 2026) имя жителя в падеже для подписей: «Поговорить с Селогом», «Учиться у Миры». Склонение — имя180
   из модуля поселений, пол — из души жителя; модуль не загружен — имя как есть. */
function имяВ(n,к){try{return typeof имя180==="function"?имя180(n.name,(npcSoul(n)||{}).пол||null,к):n.name;}catch(_){return (n&&n.name)||"";}}
function npcSoul(n){
 try{
  if(!n||!n.key)return null;"""),
 ("""data-speak="Поговорить с ${n.name}.">Поговорить</button>`""","""data-speak="Поговорить с ${имяВ(n,"тв")}.">Поговорить</button>`"""),
 ("""data-speak="Учиться у ${n.name}, ${n.prof}.">Учиться у ${n.name} — ${n.prof}</div>`""","""data-speak="Учиться у ${имяВ(n,"род")}, ${n.prof}.">Учиться у ${имяВ(n,"род")} — ${n.prof}</div>`"""),
 ("""data-speak="Учиться у ${n.name}: ${n.prof}.">Учиться</button>`""","""data-speak="Учиться у ${имяВ(n,"род")}: ${n.prof}.">Учиться</button>`"""),
]
for a,b in ПРАВКИ:
    if a.startswith("function npcSoul(n){") and "function имяВ(" in s: continue   # помощник уже вставлен
    c=s.count(a)
    if c==0:assert b in s,a[:80];continue
    assert c==1,(a[:80],c);s=s.replace(a,b);n+=1
open(B,"w",encoding="utf-8").write(s)
M="/root/S/hron/molva170_late.js"
m=open(M,encoding="utf-8").read();a="Спросить у ${n.name}.`";b="Спросить у ${имяВ(n,\"род\")}.`"
if a in m:
    assert m.count(a)==1;m=m.replace(a,b);open(M,"w",encoding="utf-8").write(m);n+=1
else:assert b in m
print("правок",n)

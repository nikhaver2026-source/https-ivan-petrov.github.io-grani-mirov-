"""soak_an.py ЖУРНАЛ — сводка долгого прогона: задержка главного потока, память (после сборки мусора), узлы DOM и
слушатели, интервалы, каналы, плееры и узлы движка в минуту, речь; сравнение первой и последней трети."""
import sys,json,statistics as st
rows=[];итог=None
for line in open(sys.argv[1],encoding="utf-8"):
    line=line.strip()
    if not line:continue
    o=json.loads(line)
    if o.get("итог"):итог=o
    elif "лагМакс" in o:rows.append(o)
r=[x for x in rows if x["t"]>=30]
if not r:print("нет строк");sys.exit()
def треть(k):
    n=len(r);a=r[:max(1,n//3)];b=r[-max(1,n//3):];f=lambda x:x if not callable(k) else None
    va=[k(x) for x in a if k(x) is not None];vb=[k(x) for x in b if k(x) is not None]
    return (round(st.mean(va),1) if va else None,round(st.mean(vb),1) if vb else None)
print("строк",len(rows),"; длительность",rows[-1]["t"],"с")
лаг=[x["лагМакс"] for x in r];print("задержка главного потока: макс",max(лаг),"мс; медиана макс. за окно",st.median(лаг),"мс; окон с задержкой >200 мс:",sum(1 for x in r if x.get("лаг200",0)>0),
      "; >1 с:",sum(1 for x in r if x.get("лаг1000",0)>0))
print("средняя задержка (первая треть → последняя):",треть(lambda x:x["лагСред"]))
gc=[(x["t"],x["heapGC"]) for x in rows if x.get("heapGC")];print("куча после сборки мусора, МБ:",gc)
dom=[(x["t"],x["dom"]["nodes"],x["dom"]["jsEventListeners"]) for x in r if x.get("dom")]
if dom:print("узлы DOM (первая треть → последняя):",треть(lambda x:x["dom"]["nodes"] if x.get("dom") else None),"; слушатели:",треть(lambda x:x["dom"]["jsEventListeners"] if x.get("dom") else None),
             "; макс узлов",max(d[1] for d in dom),"; макс слушателей",max(d[2] for d in dom))
print("интервалы (первая → последняя треть):",треть(lambda x:x["интервалов"]),"; макс",max(x["интервалов"] for x in r))
print("каналы среды заняты:",треть(lambda x:x["среда"]),"; макс",max(x["среда"] for x in r),"; объёмных live макс",max(x["live"] for x in r),"; играют макс",max(x["играют"] for x in r))
dt=rows[-1]["t"]-r[0]["t"] or 1
print("узлов движка создано в минуту:",round((rows[-1]["узлов"]-r[0]["узлов"])/dt*60,1),"; плееров Audio в минуту:",round((rows[-1]["аудио"]-r[0]["аудио"])/dt*60,1))
print("петли банка:",треть(lambda x:x["петель"]),"; разовые выстрелы:",треть(lambda x:x["выстрелов"]))
ре=rows[-1]["речь"];print("речь в конце: сказано",ре["сказано"],"оборвано",ре["оборвано"],"сброшено",ре["сброшено"],"спасено сторожем",ре["спасено"],"повторов",ре["повтор"])
print("очередь речи: макс",max(x["речь"]["очередь"] for x in r),"; медиана",st.median(x["речь"]["очередь"] for x in r))
дв=set(x.get("движок") for x in r if x.get("движок"));print("состояния движка звука:",дв)
if итог:print("ИТОГ:",json.dumps(итог,ensure_ascii=False)[:1500])

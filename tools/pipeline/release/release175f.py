"""release175f.py — З5: флажок «Динамик телефона» в разделе «Громкость» настроек (сам режим — в edin175_late.js).
Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read()
def rep(a,b,name):
    global s
    if b in s: return
    assert s.count(a)==1,("нет: "+name)
    s=s.replace(a,b);print(name)
rep(''' <label class="opt">Приглушение музыки при речи <input type="range" id="setDuck" min="0" max="100" value="50"><span id="vDuck">50%</span></label>
''',''' <label class="opt">Приглушение музыки при речи <input type="range" id="setDuck" min="0" max="100" value="50"><span id="vDuck">50%</span></label>
 <label class="opt"><input type="checkbox" id="setPhoneSpk"><span><b>Динамик телефона</b><small>Тихие звуки мира — шаги, дальние твари, капель — подняты, громкие чуть сжаты: на маленьком динамике слышно всё. Речь, музыка и фон не меняются. На телефоне включено само; в наушниках можно выключить.</small></span></label>
''',"флажок в настройках")
rep(''' chk("setCbDmgMe","cbDmgMe",''',''' chk("setPhoneSpk","phoneSpeaker","Динамик телефона: тихие звуки мира подняты.","Динамик телефона выключен: звуки мира как записаны.");
 chk("setCbDmgMe","cbDmgMe",''',"привязка флажка")
open(B,"w",encoding="utf-8").write(s)

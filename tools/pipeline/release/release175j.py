"""release175j.py — просьба игрока: убрать фразу «Сначала завершите бой» (и её варианты «сначала закончите бой»).
Из боя выходят по-разному — сбежать, убежать от твари, «Покров тени», — и фраза, будто бой надо непременно
довести до конца, вводила в заблуждение. Действие посреди боя по-прежнему не выполняется, но без этих слов.
Повторный запуск ничего не меняет."""
H="/root/S/hron/"
def patch(f,pairs):
    s=open(H+f,encoding="utf-8").read();n=0
    for a,b in pairs:
        if a not in s: continue
        assert s.count(a)==1,(f,a);s=s.replace(a,b);n+=1
    open(H+f,"w",encoding="utf-8").write(s);print(f,"убрано:",n)
patch("index_before_mater.html",[
 ('if(G.inCombat){narrate("Сначала завершите бой: в лаз с тварью за спиной не лезут.");return false;}','if(G.inCombat)return false;'),
 (' if(!DIRV[dir])return false;\n if(G.inCombat){narrate("Сначала завершите бой!",{cat:"result"});return false;}',' if(!DIRV[dir])return false;\n if(G.inCombat)return false;'),
 (' if(G.place)return moveInside(dir);\n if(G.inCombat){narrate("Сначала завершите бой!",{cat:"result"});return;}',' if(G.place)return moveInside(dir);\n if(G.inCombat)return;'),
 ('stairStart(e){if(G.inCombat)return "Сначала завершите бой.";','stairStart(e){if(G.inCombat)return "";'),
 ('if(G.inCombat){narrate("Не время: сначала закончите бой.");return false;}','if(G.inCombat)return false;'),
 ('  if(G.inCombat){narrate("Сначала закончите бой.");return false;}','  if(G.inCombat)return false;'),
])
patch("lift150_late.js",[('if(G.inCombat){narrate("Сначала завершите бой!",{cat:"result"});return false;}','if(G.inCombat)return false;')])
patch("taina150_late.js",[('  if(G.inCombat){narrate("Сначала завершите бой: в лаз с тварью за спиной не лезут.");return false;}','  if(G.inCombat)return false;')])

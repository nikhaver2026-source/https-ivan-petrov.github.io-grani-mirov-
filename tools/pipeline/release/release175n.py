"""release175n.py — второй вариант строки «Ты уже взялся за моё дело…» снова в игре (23 октября).

С 14.7 вариант _v1 строки quest_have_2 был выключен (маска 5): женская запись говорила «взялась» (копия для героини),
мужская (верная) лежала в uni/hold/fix_pending. Перезапись женской пришла 22 октября (Leda, «взялся», 2,63 с;
uniapply положил её длину в VOICE_NPC_LEN). Теперь, по записке uni/hold/fix_pending/README.txt: мужская запись
возвращается (длина 2,77), маска строки — снова 7 (все три варианта).
Повторный запуск ничего не меняет."""
B = "/root/S/hron/index_before_mater.html"
s = open(B, encoding="utf-8").read()
n0 = len(s)


def sub(a, b, n=1, mark=None):
    """заменить a на b ровно n раз; если b уже стоит (метка mark или сам b) — ничего не делать"""
    global s
    if (mark or b) in s:
        return
    assert s.count(a) == n, (s.count(a), a[:80])
    s = s.replace(a, b)


sub('"Ты уже взялся за моё дело. Сперва закончи его.":["quest_have_2",1,5]',
    '"Ты уже взялся за моё дело. Сперва закончи его.":["quest_have_2",1,7]')
sub('"quest_have_2_f_g":2.8,"quest_have_3_g"', '"quest_have_2_f_g":2.8,"quest_have_2_v1_g":2.77,"quest_have_3_g"',
    mark='"quest_have_2_v1_g":2.77')

open(B, "w", encoding="utf-8").write(s)
print("основа: quest_have_2 _v1 —", "без изменений" if len(s) == n0 else f"правки внесены ({len(s)-n0:+d} знаков)")

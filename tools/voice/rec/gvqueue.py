#!/usr/bin/env python3
"""gvqueue.py — очередь записи из собранной речи (collect.txt сервера srv8907).
Каждый текст режется, как в игре (Speech.gvParts): целиком → предложения (склейки до четырёх соседних) →
части по «:» и «;» → по тире. Незаписанный кусок (нет ни в описи голоса, ни в голосовом пакете) идёт в очередь,
если он без цифр, без латиницы и служебного мусора, от 2 до 90 знаков. Порядок — по частоте, затем короче вперёд.
Итог: queue_m.json и queue_f.json — [{"t": фраза, "n": сколько раз}]."""
import json, re, glob, os
from collections import Counter
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
ТУТ = "/root/S/gvrec"


def ключ(t): return re.sub(r"[^а-яa-z0-9]+", " ", str(t).lower().replace("ё", "е")).strip()


def опись(f):
    t = open(f, encoding="utf-8").read(); return json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]


def банк(голос):
    папка, имя = {"m": ("gvoice", "bank_"), "f": ("gvoice_f", "bank_f")}[голос]
    о = sorted(glob.glob(f"{R}/sounds/{папка}/{имя}[0-9]*.js"), key=lambda f: int(re.search(r"(\d+)\.js$", f).group(1)))[-1]
    p = dict(опись(о)); p.update(опись(f"{R}/sounds/gvoice_pack/{голос}/bank.js")); return p


МУСОР = re.compile(r"undefined|null|NaN|\[object|function|=>|\{|\}|<|>|_", re.I)
# фразы-заглушки из наборов проверок (нарочно незаписанный текст: проверка, что его говорит синтезатор) — не записывать
ЗАГЛУШКИ = re.compile(r"зюйдвест|кракозяб|квазимодо|лопочет|проверочн|абракадабр", re.I)


def годна(s):
    s = s.strip()
    k = ключ(s)
    return (2 <= len(s) <= 90 and len(k) >= 2 and not re.search(r"\d", s) and not re.search(r"[A-Za-z]", s)
            and not МУСОР.search(s) and not ЗАГЛУШКИ.search(s) and re.search(r"[а-яА-ЯёЁ]", s))


def куски(текст, есть):
    """Незаписанные куски текста, как их ищет игра."""
    if ключ(текст) in есть: return []
    сс = [x.strip() for x in re.findall(r"[^.!?…]+[.!?…]*", текст) or [текст] if x.strip()]
    out, i = [], 0
    while i < len(сс):
        j = min(len(сс), i + 4); нашлось = False
        while j > i + 1:
            if ключ(" ".join(сс[i:j])) in есть: нашлось = True; break
            j -= 1
        if нашлось: i = j; continue
        s = сс[i]; i += 1
        if ключ(s) in есть: continue
        if годна(s): out.append(s); continue
        for c in re.split(r"(?<=[:;])\s+", s):
            if ключ(c) in есть: continue
            if годна(c): out.append(c); continue
            for d in re.split(r"(?<=—)\s+", c):
                if ключ(d) not in есть and годна(d): out.append(d)
    return out


def main():
    тексты = set()
    for l in open(f"{ТУТ}/collect.txt", encoding="utf-8"):
        try: тексты.update(json.loads(l))
        except Exception: pass
    не_просить = set()
    if os.path.exists(f"{ТУТ}/не_просить.json"): не_просить = set(json.load(open(f"{ТУТ}/не_просить.json", encoding="utf-8")))
    for голос in "mf":
        есть = банк(голос); счёт = Counter(); образ = {}
        for т in тексты:
            for к in куски(т, есть):
                k = ключ(к)
                if k in не_просить: continue
                счёт[k] += 1; образ.setdefault(k, к)
        q = [{"t": образ[k], "n": n} for k, n in sorted(счёт.items(), key=lambda x: (-x[1], len(x[0])))]
        # (4 ноября) сперва — фразы со словами, которых нет в базе синтезатора-склейки (us2/db_m*.jsonl): жадно, чтобы
        # каждое следующее покрывало больше недостающих; запись одна — польза и игре, и синтезатору
        нет_слов = set()
        if голос == "m" and os.path.exists("/root/S/us2/corpus/oov_words.json"):
            нет_слов = set(json.load(open("/root/S/us2/corpus/oov_words.json", encoding="utf-8")))
        if нет_слов:
            покрыто = set(); впереди = []; ост = []
            for x in q:
                нов = {w for w in re.findall(r"[а-я]+", ключ(x["t"])) if w in нет_слов and len(w) > 2} - покрыто
                if нов: впереди.append(x); покрыто |= нов
                else: ост.append(x)
            q = впереди + ост
            print(f"{голос}: впереди {len(впереди)} фраз с {len(покрыто)} словами, которых нет у синтезатора")
        json.dump(q, open(f"{ТУТ}/queue_{голос}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(f"{голос}: текстов {len(тексты)}, в очереди {len(q)}, из них встречались не раз {sum(1 for x in q if x['n'] > 1)}")


if __name__ == "__main__":
    main()

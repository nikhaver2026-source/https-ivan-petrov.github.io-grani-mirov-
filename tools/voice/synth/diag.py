#!/usr/bin/env python3.13
"""diag.py ГОЛОС a:b МЕТКА [веса JSON] — разбор ошибок по словам: где распознаватель слышит лишние буквы
(между словами и на краях слова), где окончание проглочено, где искажено начало; связь с видом единицы
(цепочка из одной записи, отдельное слово, сборка из частей), с соседом в источнике и с местом в отрезке.
Итог: out/diag_<МЕТКА>.json и сводка."""
import sys, os, json, re, time
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=4)
ГОЛОС = sys.argv[1]; a_, b_ = map(int, sys.argv[2].split(":")); МЕТКА = sys.argv[3]
веса = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None


def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def узнать(y):
    a16 = np.interp(np.arange(0, len(y), E.SR / 16000), np.arange(len(y)), y).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return s.result.text


def выровнять_буквы(a, b):
    """Посимвольное выравнивание (с пробелами). → список пар (символ_цели|None, символ_услышанного|None)."""
    n, m = len(a), len(b); D = np.zeros((n + 1, m + 1), dtype=np.int32); D[:, 0] = range(n + 1); D[0, :] = range(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = min(D[i - 1, j] + 1, D[i, j - 1] + 1, D[i - 1, j - 1] + (0 if a[i - 1] == b[j - 1] else 1 if (a[i - 1] != " " and b[j - 1] != " ") else 2))
    i, j, путь = n, m, []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and D[i, j] == D[i - 1, j - 1] + (0 if a[i - 1] == b[j - 1] else 1 if (a[i - 1] != " " and b[j - 1] != " ") else 2):
            путь.append((a[i - 1], b[j - 1])); i -= 1; j -= 1
        elif i > 0 and D[i, j] == D[i - 1, j] + 1: путь.append((a[i - 1], None)); i -= 1
        else: путь.append((None, b[j - 1])); j -= 1
    return путь[::-1]


def разбор_слов(цель, слышно):
    """Для каждого слова цели: что услышано на его месте и вид ошибки."""
    путь = выровнять_буквы(цель, слышно)
    слова = цель.split(); out = [{"w": w, "h": "", "ош": []} for w in слова]
    k = 0; поз = 0   # k — номер слова, поз — номер буквы в слове
    вставки_между = [""] * (len(слова) + 1)
    for ca, cb in путь:
        if ca == " ":
            if cb not in (None, " "): вставки_между[k + 1] += cb   # буква вместо пробела — слипание с буквой
            k += 1; поз = 0; continue
        if ca is None:
            if cb == " ": continue
            # вставка: в начале слова (поз==0) — относим к стыку перед словом; иначе внутрь/в конец слова
            if поз == 0: вставки_между[k] += cb
            elif поз >= len(слова[k]): out[k]["ош"].append(("вставка_конец", cb))
            else: out[k]["ош"].append(("вставка_внутри", cb))
            out[k]["h"] += cb; continue
        w = слова[k]
        if cb is None: out[k]["ош"].append(("пропуск", поз, len(w)))
        elif cb == " ": out[k]["ош"].append(("пропуск", поз, len(w))); out[k]["разрыв"] = True
        elif cb != ca: out[k]["ош"].append(("замена", поз, len(w), ca, cb))
        if cb not in (None, " "): out[k]["h"] += cb
        поз += 1
    for i, x in enumerate(out):
        x["вставка_до"] = вставки_между[i]; x["вставка_после"] = вставки_между[i + 1] if i + 1 < len(out) else ""
        вид = set()
        for e in x["ош"]:
            if e[0] == "пропуск": вид.add("пропуск_конца" if e[1] >= e[2] - 2 else "пропуск_начала" if e[1] <= 0 else "пропуск_внутри")
            elif e[0] == "замена": вид.add("замена_конца" if e[1] >= e[2] - 2 else "замена_начала" if e[1] <= 0 else "замена_внутри")
            else: вид.add(e[0])
        if x["вставка_до"] and i > 0: вид.add("вставка_на_стыке")
        x["вид"] = sorted(вид)
    return out


def main():
    S = E.Синтезатор(ГОЛОС, веса); V = S.V
    фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[a_:b_]
    записи = []; t0 = time.time()
    стар = S.отрезок; журнал = []
    def отрезок(слова, end):
        x, res, кс = стар(слова, end); журнал.append((слова, end, res, кс)); return x, res, кс
    S.отрезок = отрезок
    for ф in фразы:
        журнал.clear()
        y, отчёт = S.сказать(ф, (веса or {}).get("скорость", 1.0))
        цель = норм(" ".join(" ".join(o["w"]) for o in E.текст_в_отрезки(ф))); слышно = норм(узнать(y))
        слова = разбор_слов(цель, слышно)
        # сведения о единице каждого слова
        k = 0
        for (сл, end, res, кс) in журнал:
            for i, u in enumerate(res):
                if k >= len(слова): break
                x = слова[k]; k += 1
                x["последнее"] = i == len(сл) - 1; x["первое"] = i == 0; x["знак"] = end if i == len(сл) - 1 else ""
                if u[0] == "часть":
                    x["ед"] = "части"; x["частей"] = len(u[1]); continue
                o = u[1]; ri, j = V.occ[o]
                пр = i > 0 and res[i - 1][0] == "o" and V.occ[res[i - 1][1]] == (ri, j - 1)
                сл_ = i + 1 < len(res) and res[i + 1][0] == "o" and V.occ[res[i + 1][1]] == (ri, j + 1)
                x["ед"] = "цепь" if (пр or сл_) else "слово"
                x["цепь_л"] = bool(пр); x["цепь_п"] = bool(сл_)
                x["ист"] = V.recs[ri]["k"]; x["j"] = j
                x["ист_л"] = V.сосед(o, -1); x["ист_п"] = V.сосед(o, 1)
                x["чист"] = float(V.чистота[o]) if V.чистота is not None else None
                x["конец_ист"] = V.конец_фразы(o); x["пауза_после_ист"] = V.w(o)[4]; x["пауза_до_ист"] = V.w(o)[3]
        записи.append({"t": ф, "цель": цель, "слышно": слышно, "слова": слова})
    json.dump(записи, open(f"/root/S/us2/out/diag_{МЕТКА}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # сводка
    все = [x for z in записи for x in z["слова"]]
    from collections import Counter
    print(f"слов {len(все)}, с ошибкой {sum(bool(x['вид']) for x in все)} ({time.time() - t0:.0f} с)")
    вс = Counter(v for x in все for v in x["вид"]); print("виды:", dict(вс.most_common()))
    for ед in ("цепь", "слово", "части"):
        г = [x for x in все if x.get("ед") == ед]
        if not г: continue
        c = Counter(v for x in г for v in x["вид"])
        print(f"{ед}: слов {len(г)}, с ошибкой {sum(bool(x['вид']) for x in г) / len(г):.1%}; " + ", ".join(f"{k} {v / len(г):.1%}" for k, v in c.most_common(6)))
    # окончания: последнее слово отрезка против середины; сосед справа в цели — гласная/согласная
    for имя, f in (("последнее в отрезке", lambda x: x.get("последнее")), ("в середине", lambda x: not x.get("последнее"))):
        г = [x for x in все if f(x)]
        if г: print(f"{имя}: слов {len(г)}, пропуск/замена конца {sum(('пропуск_конца' in x['вид']) or ('замена_конца' in x['вид']) for x in г) / len(г):.1%}, вставки на стыке после {sum(bool(x['вставка_после']) for x in г) / len(г):.1%}")


if __name__ == "__main__":
    main()

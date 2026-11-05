#!/usr/bin/env python3.13
"""eval.py ГОЛОС [N] [метка] — проверка синтезатора на настоящих незаписанных фразах игры (очередь записи).
Синтез → распознавание GigaAM → доля ошибочных букв (CER) по каждой фразе; куски на слово; скачки высоты на стыках.
Пробы: /root/S/us2/out/<метка>_<голос>.flac (первые 12 фраз подряд, между ними секунда тишины) и .txt с текстами.
Итог одной строкой в /root/S/us2/eval.log."""
import sys, os, json, re, time, random
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E

ГОЛОС = sys.argv[1]; _N = sys.argv[2] if len(sys.argv) > 2 else "60"
N0, N = (int(_N.split(":")[0]), int(_N.split(":")[1])) if ":" in _N else (0, int(_N)); МЕТКА = sys.argv[3] if len(sys.argv) > 3 else "проба"
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
import sherpa_onnx
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=3)


def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def узнать(y):
    a16 = np.interp(np.arange(0, len(y), E.SR / 16000), np.arange(len(y)), y).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return s.result.text


def шов(y, p, L=int(E.SR * 0.02)):
    """Скачок на стыке: расстояние спектров (MFCC без c0) и разница громкости (дБ) окон 20 мс до и после точки p."""
    if p - L < 0 or p + L > len(y): return None
    a, b = y[p - L:p], y[p:p + L]
    if E._db(a) < -50 or E._db(b) < -50: return None
    return float(np.linalg.norm(E._mfcc(a)[1:] - E._mfcc(b)[1:])), abs(E._db(a) - E._db(b))


_ЕСТ = None
def естественный_шов(V):
    """Тот же скачок на настоящих границах слов (без паузы) в записях диктора — мерка «как в живой речи»."""
    global _ЕСТ
    if _ЕСТ is None:
        rnd = random.Random(3); xs = []
        while len(xs) < 600:
            ri = rnd.randrange(len(V.recs)); r = V.recs[ri]
            if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
            j = rnd.randrange(len(r["w"]) - 1)
            if r["w"][j][4] > 0.005: continue
            y = V.звук(ri); m = шов(y, int(r["w"][j][2] * E.SR))
            if m: xs.append(m)
        _ЕСТ = (float(np.mean([x[0] for x in xs])), float(np.mean([x[1] for x in xs])))
    return _ЕСТ


def живой_уровень(V):
    """Скачок уровня высоты между соседними словами в живой речи диктора (медианы высоты слов, без паузы между ними)."""
    import math
    xs = []
    for o in range(len(V.occ) - 1):
        if V.occ[o][0] == V.occ[o + 1][0] and V.occ[o][0] not in V.искл_ri and V.f0m[o] > 0 and V.f0m[o + 1] > 0 and V.w(o)[4] < 0.05:
            xs.append(abs(12 * math.log2(V.f0m[o + 1] / V.f0m[o])))
    return float(np.mean(xs)) if xs else 0.0


def тестовые(n):
    """Постоянный набор: фразы очереди (их нет записью) длиной 3–12 слов, разнообразные; одинаковые для обоих голосов."""
    p = os.environ.get("EVAL_SET", "/root/S/us2/test_set.json")
    if os.path.exists(p): return json.load(open(p, encoding="utf-8"))[:n]
    q = json.load(open("/root/S/gvrec/queue_m.json", encoding="utf-8"))
    random.seed(4)
    кандидаты = [x["t"] for x in q if 3 <= len(норм(x["t"]).split()) <= 12 and not re.search(r"[A-Za-z]", x["t"])]
    random.shuffle(кандидаты)
    t = кандидаты[:150]
    # плюс связные предложения посложнее — длинные, с запятыми и вопросом
    t = ["Вы стоите у ворот старой крепости, а за спиной шумит лес.", "Хотите купить ещё два зелья здоровья?",
         "Тролль бьёт вас дубиной: минус двенадцать здоровья.", "Осталось золота: 2168.",
         "Ночью у стен ходит стража, и фонари горят до самого рассвета."] + t
    json.dump(t, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    return t[:n]


def main():
    веса = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None
    S = E.Синтезатор(ГОЛОС, веса)
    фразы = тестовые(N)[N0:]; итог = []; пробы = []; t0 = time.time(); швы = []
    for ф in фразы:
        y, отчёт = S.сказать(ф, (веса or {}).get("скорость", 1.0))
        for p in getattr(S, "стыки", []):
            m = шов(y, p)
            if m: швы.append(m)
        цель = норм(" ".join(" ".join(o["w"]) for o in E.текст_в_отрезки(ф)))
        слышно = норм(узнать(y))
        c = lev(цель.replace(" ", ""), слышно.replace(" ", "")) / max(1, len(цель.replace(" ", "")))
        wer = lev(цель.split(), слышно.split()) / max(1, len(цель.split()))
        слов = sum(len(o["слова"]) for o in отчёт); кусков = sum(o["кусков"] for o in отчёт)
        вне = sum(len(o["вне базы"]) for o in отчёт)
        итог.append({"t": ф, "cer": round(c, 3), "wer": round(wer, 3), "слышно": слышно, "слов": слов, "кусков": кусков, "вне": вне})
        if len(пробы) < 24:
            пробы += [y, np.zeros(E.SR, dtype=np.float32)]
            os.makedirs(f"/root/S/us2/out/{МЕТКА}_phrases", exist_ok=True)
            sf.write(f"/root/S/us2/out/{МЕТКА}_phrases/{len(пробы) // 2:02d}.flac", y, E.SR, subtype="PCM_16")
    os.makedirs("/root/S/us2/out", exist_ok=True)
    sf.write(f"/root/S/us2/out/{МЕТКА}_{ГОЛОС}.flac", np.concatenate(пробы), E.SR, subtype="PCM_16")
    open(f"/root/S/us2/out/{МЕТКА}_{ГОЛОС}.txt", "w", encoding="utf-8").write("\n".join(f"{i+1}. {x['t']}" for i, x in enumerate(итог[:12])) + "\n")
    json.dump(итог, open(f"/root/S/us2/out/{МЕТКА}_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    cer = float(np.mean([x["cer"] for x in итог])); кс = sum(x["кусков"] for x in итог) / max(1, sum(x["слов"] for x in итог))
    вне = sum(x["вне"] for x in итог)
    строка = f"{time.strftime('%d.%m %H:%M')} {МЕТКА} {ГОЛОС}: фраз {len(итог)}, CER {cer:.4f}, WER {np.mean([x['wer'] for x in итог]):.3f}, медиана {np.median([x['cer'] for x in итог]):.3f}, кусков на слово {кс:.2f}, слов вне базы {вне}, скачок высоты на стыке {np.mean(S.скачки) if S.скачки else 0:.2f} пт, уровень кусков {np.mean(S.скачки_уровня) if S.скачки_уровня else 0:.2f} пт (живая речь {живой_уровень(S.V):.2f}), шов: спектр {np.mean([x[0] for x in швы]) if швы else 0:.1f} (живая речь {естественный_шов(S.V)[0]:.1f}), громкость {np.mean([x[1] for x in швы]) if швы else 0:.1f} дБ ({естественный_шов(S.V)[1]:.1f}), {time.time() - t0:.0f} с"
    print(строка); open("/root/S/us2/eval.log", "a", encoding="utf-8").write(строка + "\n")
    for x in sorted(итог, key=lambda x: -x["cer"])[:6]: print(f"  {x['cer']:.2f} | {x['t'][:60]} | {x['слышно'][:60]}")


if __name__ == "__main__":
    main()

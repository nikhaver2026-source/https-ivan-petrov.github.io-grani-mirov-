#!/usr/bin/env python3.13
"""oov_tune.py N — обучение сборки незнакомых слов на знакомых: слово «прячется» (его записи не используются),
собирается дифонами из частей других слов, синтезируется отдельно и распознаётся; мерка — доля ошибочных ЗВУКОВ
(произношение fon услышанного против нужного; имена и безударные окончания не наказываются за написание).
Поиск по ценам сборки (д_край, д_сосед, д_класс, д_смычка, д_плохие, д_длина) — по очереди, на обучающих словах;
итог проверяется на отложенных. Итог: oov_<голос>.json (лучшие цены) и строки в журнал."""
import sys, os, json, re, random, time, math
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E, fon
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=4)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 300


def норм(t): return re.sub(r"[^а-я]+", "", t.lower().replace("ё", "е"))


def тр(w):
    try: return "".join({"э": "и", "о": "а"}.get(z, z).lower() for z, _ in fon.слово(w))
    except Exception: return w


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def узнать(y):
    y = np.concatenate([np.zeros(2400, np.float32), y, np.zeros(2400, np.float32)])
    a16 = np.interp(np.arange(0, len(y), 1.5), np.arange(len(y)), y).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return норм(s.result.text)


S = E.Синтезатор("m"); V = S.V
слова = sorted(w for w, os_ in V.по_слову.items() if 5 <= len(w) <= 12 and re.fullmatch(r"[а-я]+", w) and 2 <= len(os_) <= 60)
random.seed(21); random.shuffle(слова)
обуч, пров = слова[:N], слова[N:2 * N]


def мерка(набор, веса):
    S.в.update(веса); per = []
    for w in набор:
        S._искл_слово = w; запас = V.по_слову.pop(w)
        try:
            y, _ = S.сказать(w)
            h = узнать(y); t = тр(w); per.append(min(1.0, lev(t, тр(h) if h else "") / max(1, len(t))))
        finally:
            V.по_слову[w] = запас; S._искл_слово = None
    return float(np.mean(per)), float(np.mean(np.array(per) == 0))


if len(sys.argv) > 2 and sys.argv[2] == "сравнить":   # дифоны внутри слов против сборки из всего потока речи
    for имя, w in json.loads(os.environ["OOV_CMP"]):
        набор = обуч if os.environ.get("OOV_SET") == "обуч" else пров
        m = мерка(набор, w); print(f"{имя}: {'обучающие' if набор is обуч else 'отложенные'} {len(набор)} слов — ошибочных звуков {m[0]:.4f}, без ошибки {m[1]:.1%}", flush=True)
    sys.exit(0)
ИМЕНА = ["д_край", "д_сосед", "д_класс", "д_смычка", "д_плохие", "д_длина"]
лучшие = {k: S.в[k] for k in ИМЕНА}
t0 = time.time(); база = мерка(обуч, лучшие)
print(f"начало: ошибочных звуков {база[0]:.4f}, без ошибки {база[1]:.1%} ({time.time() - t0:.0f} с)", flush=True)
лучш = база[0]
for круг in range(2):
    for k in ИМЕНА:
        v0 = лучшие[k]
        for v in sorted({round(v0 * 0.5, 3), round(v0 * 1.6 + (0.1 if v0 == 0 else 0), 3), round(v0 + 0.3, 3)} - {v0}):
            m = мерка(обуч, {**лучшие, k: v})
            if m[0] < лучш - 0.002: лучш = m[0]; лучшие[k] = v; print(f"  {k} = {v}: {m[0]:.4f} — лучше", flush=True)
        S.в.update(лучшие)
    print(f"круг {круг + 1}: {лучш:.4f}, цены {лучшие} ({time.time() - t0:.0f} с)", flush=True)
старые = мерка(пров, {"д_край": 0.6, "д_сосед": 0.3, "д_класс": 0.2, "д_смычка": 0.1, "д_плохие": 0.3, "д_длина": 0.0})
новые = мерка(пров, лучшие)
строка = f"{time.strftime('%d.%m %H:%M')} сборка незнакомых слов, отложенные {len(пров)} слов: было {старые[0]:.4f} ({старые[1]:.1%} без ошибки), стало {новые[0]:.4f} ({новые[1]:.1%}); цены {лучшие}"
print(строка); open("/root/S/us2/eval.log", "a", encoding="utf-8").write(строка + "\n")
json.dump(лучшие, open("/root/S/us2/oov_m.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

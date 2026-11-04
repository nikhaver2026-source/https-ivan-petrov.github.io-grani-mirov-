#!/usr/bin/env python3.13
"""tune.py — подбор весов движка по координатам: цель = CER + 0.5·WER на фразах 0..59 (подбор); итог проверяется на
фразах 60..154 (в подборе не участвовали). База грузится один раз. Журнал — tune.log, лучшие веса — best_weights.json."""
import sys, json, re, time
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=4)


def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def оценка(S, фразы):
    cs, ws = [], []
    for ф in фразы:
        y, _ = S.сказать(ф)
        a16 = np.interp(np.arange(0, len(y), E.SR / 16000), np.arange(len(y)), y).astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s)
        цель = норм(" ".join(" ".join(o["w"]) for o in E.текст_в_отрезки(ф))); h = норм(s.result.text)
        cs.append(lev(цель.replace(" ", ""), h.replace(" ", "")) / max(1, len(цель.replace(" ", ""))))
        ws.append(lev(цель.split(), h.split()) / max(1, len(цель.split())))
    return float(np.mean(cs)), float(np.mean(ws))


def main():
    все = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))
    подбор, проверка = все[:60], все[60:155]
    S = E.Синтезатор("m")
    сетка = {"чистота": [1.5, 6.0], "стык": [0.5, 2.0], "знак": [0.6, 2.4], "мелодия": [0.05, 0.3], "звук": [0.15, 0.6],
             "сосед": [0.2, 0.7], "длина": [0.5, 2.0], "f0": [0.06, 0.25], "спектр": [0.01, 0.05], "K": [40, 120]}
    лучшие = dict(S.в)
    def цель(в):
        S.в = dict(в); c, w = оценка(S, подбор); return c + 0.5 * w, c, w
    база = цель(лучшие); лог = open("/root/S/us2/tune.log", "a", encoding="utf-8")
    print(f"начало: цель {база[0]:.4f} (CER {база[1]:.4f}, WER {база[2]:.3f})", flush=True); лог.write(f"{time.strftime('%H:%M')} начало {база}\n")
    for проход in range(2):
        for k, значения in сетка.items():
            for v in значения:
                в = dict(лучшие); в[k] = v; r = цель(в)
                отм = ""
                if r[0] < база[0] - 0.001: база, лучшие, отм = r, в, "  ← лучше"
                print(f"  {k}={v}: {r[0]:.4f} (CER {r[1]:.4f}, WER {r[2]:.3f}){отм}", flush=True); лог.write(f"{k}={v} {r}{отм}\n")
            # следующий шаг сетки — вокруг лучшего значения
            лв = лучшие[k]; сетка[k] = [round(лв * 0.7, 4), round(лв * 1.4, 4)] if k != "K" else [max(20, int(лв * 0.7)), int(лв * 1.4)]
        print(f"проход {проход + 1}: цель {база[0]:.4f}", flush=True)
    S.в = dict(лучшие); json.dump({k: лучшие[k] for k in сетка}, open("/root/S/us2/best_weights.json", "w"), ensure_ascii=False, indent=1)
    S.в = {**S.в, **{k: E.Синтезатор("m").в[k] for k in []}}
    c0, w0 = оценка(E.Синтезатор("m"), проверка); c1, w1 = оценка(S, проверка)
    итог = f"проверка на 95 новых фразах: прежние веса CER {c0:.4f} WER {w0:.3f} → подобранные CER {c1:.4f} WER {w1:.3f}"
    print(итог); лог.write(итог + "\n"); print(json.dumps({k: лучшие[k] for k in сетка}, ensure_ascii=False))


if __name__ == "__main__":
    main()

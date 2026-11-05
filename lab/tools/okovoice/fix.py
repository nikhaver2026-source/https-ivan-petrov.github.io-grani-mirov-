#!/usr/bin/env python3
"""Голос ОКО: проверить записанные реплики Whisper'ом и дорезать сохранённые записи по словам.

    python3 lab/tools/okovoice/fix.py [--work ПАПКА] [--audit-only]

Квота Gemini не тратится: Whisper (faster-whisper) слушает на этой машине.
  1. Каждая записанная реплика (sounds/oko/<голос>/<отпечаток>.mp3) — Whisper без подсказки:
     что слышно против текста. Брак (seg.flawed) — чужая реплика или длина не та: лишняя фраза
     соседа, потерянное начало. Итог — <work>/audit.json (переслушивается только изменённое).
  2. Сохранённые записи пакетов (<work>/*.wav) режутся по словам (seg.split_words), от новых
     к старым; реплика без файла или с браком получает новый отрезок, если тот прошёл
     проверку (seg.same и fits). Хорошие файлы не трогаются.
  3. Брак, которому замены не нашлось, удаляется — реплику запишут заново; у реплик без
     записи счётчик неудач обнуляется (прежние неудачи — от прежней нарезки).
  4. manifest.py.
"""
import argparse, json, os, re, subprocess, sys, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import proc, run, seg  # noqa: E402

OKO = os.path.join(HERE, "..", "..", "sounds", "oko")


def mp3_16k(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def stamp(path):
    st = os.stat(path)
    return [st.st_size, int(st.st_mtime)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=os.environ.get("OKOVOICE_WORK", "/tmp/okovoice_work"))
    ap.add_argument("--audit-only", action="store_true", help="только проверить записанное")
    a = ap.parse_args()
    if not seg.have_whisper():
        sys.exit("нужен faster-whisper: pip install --user faster-whisper")
    run.LOG = open(os.path.join(a.work, "run.log"), "a", encoding="utf-8")
    lines = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    fem = run.fem_map()
    want = {}
    for x in lines:
        for v in "mf":
            say = fem.get(x["text"], x["text"]) if v == "f" and x["kind"] != "pupil" else x["text"]
            want[(v, run.key(say))] = say

    # 1. проверка записанного
    ap_ = os.path.join(a.work, "audit.json")
    audit = json.load(open(ap_, encoding="utf-8")) if os.path.exists(ap_) else {}
    have = [(v, f[:8]) for v in "mf" for f in sorted(os.listdir(os.path.join(OKO, v)))
            if re.fullmatch(r"[0-9a-f]{8}\.mp3", f) and (v, f[:8]) in want]
    todo = [(v, k) for v, k in have if audit.get(v + k, {}).get("st") != stamp(os.path.join(OKO, v, k + ".mp3"))]
    run.log(f"── проверка записанного Whisper'ом: файлов {len(have)}, слушать {len(todo)}")
    t0 = time.time()
    for n, (v, k) in enumerate(todo, 1):
        p = os.path.join(OKO, v, k + ".mp3")
        h = seg.listen(mp3_16k(p), 16000)
        audit[v + k] = {"st": stamp(p), "h": h, "sim": round(seg.ratio(seg.norm(h), seg.norm(want[(v, k)])), 3),
                        "bad": seg.flawed(h, want[(v, k)])}
        if n % 50 == 0 or n == len(todo):
            json.dump(audit, open(ap_, "w", encoding="utf-8"), ensure_ascii=False)
        if n % 250 == 0:
            run.log(f"   прослушано {n} из {len(todo)} за {time.time() - t0:.0f} с, брак пока "
                    f"{sum(1 for v_, k_ in have if audit.get(v_ + k_, {}).get('bad'))}")
    for v, k in have:      # брак — по услышанному и нынешним правилам (seg.flawed), не по прошлой отметке
        e = audit.get(v + k)
        if e:
            e["bad"] = seg.flawed(e["h"], want[(v, k)])
    bad = {(v, k) for v, k in have if audit.get(v + k, {}).get("bad")}
    run.log(f"   брак: {len(bad)} из {len(have)} (м {sum(v == 'm' for v, _ in bad)}, ж {sum(v == 'f' for v, _ in bad)})")
    if a.audit_only:
        return

    # 2. дорезка по словам: реплики без файла и с браком
    need = {vk for vk in want if not os.path.exists(os.path.join(OKO, vk[0], vk[1] + ".mp3"))} | bad
    fixed = added = 0
    for raw, d in reversed(run.sidecars(a.work)):
        v, rows = d["voice"], d["items"]
        idx = {i for i, r in enumerate(rows) if (v, r["k"]) in need and want.get((v, r["k"])) == r["say"]}
        if not idx:
            continue
        sr, x = run.read(raw)
        wp = raw[:-4] + ".words.json"
        ws = json.load(open(wp, encoding="utf-8")) if os.path.exists(wp) else None
        if ws is None:
            ws = seg.words(x, sr)
            json.dump(ws, open(wp, "w", encoding="utf-8"), ensure_ascii=False)
        res = seg.split_words(x, sr, [r["say"] for r in rows], ws, only=idx) or []
        got = 0
        for i in sorted(idx):
            if i >= len(res):
                break
            sx, h, s = res[i]
            r = rows[i]; dur = len(sx) / sr if sx is not None else 0.0
            if sx is None or not (seg.same(h, r["say"]) and run.fits(r["say"], dur)):
                continue
            mp3 = os.path.join(OKO, v, r["k"] + ".mp3")
            was = os.path.exists(mp3)
            tmp = os.path.join(a.work, f"{v}_{r['k']}.wav")
            proc.write(tmp, sr, sx)
            proc.process(tmp, mp3)
            os.remove(tmp)
            audit[v + r["k"]] = {"st": stamp(mp3), "h": h, "sim": round(s, 3), "bad": False}
            r.update(heard=h, sim=round(s, 3), dur=round(dur, 2), how="w", ok=True)
            need.discard((v, r["k"])); bad.discard((v, r["k"]))
            fixed += was; added += not was; got += 1
        if got:
            json.dump({"voice": v, "items": rows}, open(raw[:-4] + ".json", "w", encoding="utf-8"), ensure_ascii=False)
            json.dump(audit, open(ap_, "w", encoding="utf-8"), ensure_ascii=False)
        run.log(f"── по словам {os.path.basename(raw)}: нужных {len(idx)}, принято {got}")

    # 3. брак без замены — прочь; счётчики неудач у реплик без записи — с нуля
    for v, k in sorted(bad):
        os.remove(os.path.join(OKO, v, k + ".mp3"))
        audit.pop(v + k, None)
    json.dump(audit, open(ap_, "w", encoding="utf-8"), ensure_ascii=False)
    sp = os.path.join(a.work, "state.json")
    state = json.load(open(sp)) if os.path.exists(sp) else {}
    for v, k in want:
        if not os.path.exists(os.path.join(OKO, v, k + ".mp3")):
            state.pop(v + k, None)
    json.dump(state, open(sp, "w"))
    subprocess.run([sys.executable, os.path.join(HERE, "manifest.py")], check=True)
    run.log(f"итог проверки: брак заменён {fixed}, новых {added}, брак удалён {len(bad)} (запишется заново)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Голос ОКО: озвучка реплик пакетами — сколько позволяет квота Gemini за день.

    GEMINI_API_KEYS=… python3 lab/tools/okovoice/run.py [--voice m|f|both] [--requests N]
                                                       [--chars 2600] [--work ПАПКА] [--dry]

Голоса (одобрены автором 29.10): m — Alnilam (мужской), f — Achernar (женский).
Ключи — только из переменной окружения GEMINI_API_KEYS (через запятую) или
GEMINI_API_KEY; ни в журнал, ни в файлы они не попадают.

Круг для каждого пакета:
  1. реплики без записи (список — lines.json, его собирает extract.js; для женского
     голоса — в женском роде из js/oko_fem.js) — пакет одной интонации, до --chars
     знаков; интонация — по виду реплики и глубине (STYLE ниже);
  2. запрос к Gemini TTS (gemini-3.8-flash-tts): каждая реплика — свой кусок со своей
     интонацией; ответ — одна запись WAV 24 кГц;
  3. разметка на слух (Gemini, oko_align.py): где какая реплика и что в ней слышно;
     граница — самая длинная пауза у стыка; реплика, услышанная не так (сходство
     текста меньше 0,8) или слишком короткая или длинная для своих слов, — не
     принимается и пойдёт в следующий пакет (после трёх неудач — остаётся синтезатору);
  4. обработка proc.py (механика, второй голос, эхо, −18 LUFS) → sounds/oko/<голос>/<отпечаток>.mp3;
  5. в конце — manifest.py (js/oko_voiced.js).
Сырые записи и журнал — в --work (по умолчанию /tmp/okovoice_work), не в репозитории.
Квота кончилась у всех ключей (429) — круг останавливается: продолжить можно завтра.
"""
import argparse, base64, difflib, json, os, re, subprocess, sys, time, urllib.request, urllib.error, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import proc  # noqa: E402

TTS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
TTS_MODEL = "gemini-3.8-flash-tts"
ASR_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash"]
VOICE = {"m": "Alnilam", "f": "Achernar"}

# Интонации: коротко (документация Gemini советует так), с «natural pace» — иначе речь тянется.
FLAT = "flat mechanical announcement, no emotion, natural pace"
COLD = "cold and precise, quietly watchful, natural pace"
SMILE = "cold and intimate, with a faint unsettling smile, natural pace"
GARDEN = "gentle and soft, eerily calm, natural pace"
FAR = "distant and detached, natural pace"
CITY = "weary and quiet, almost kind, natural pace"
WHISPER = "soft close whisper, tired, natural pace"
PUPIL = "eager and mocking, slightly fast"
DEAL = "dry and businesslike, natural pace"
URGENT = set("""alarm complex local sealed robots boss strike_go backup post squad grinder mines_order oko_trap key_revoked
turret_hack cam_loop_found cam_flash_found iso_bypass turret_cut""".split())
WATCH = set("""suspect check lost normal door isolate cam_loop cam_cut cam_flash cam_fixed rubble wait strike_recall
grinder_more correct""".split())


def style(x):
    k, b = x["kind"], x.get("block", 0)
    if k == "pupil":
        return PUPIL
    if k.startswith("deal"):
        return DEAL
    if k in URGENT:
        return FLAT
    if b == 2:
        return GARDEN
    if b == 3:
        return FAR
    if b == 4:
        return CITY
    if b == 5:
        return WHISPER
    return COLD if k in WATCH else SMILE


def norm(t):
    return re.sub(r"\s+", " ", str(t)).strip()


def key(t):
    h = 0x811c9dc5
    for ch in norm(t):
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return "%08x" % h


def fem_map():
    s = open(os.path.join(ROOT, "js", "oko_fem.js"), encoding="utf-8").read()
    return json.loads(s[s.index("LAB.OKO_FEM = ") + len("LAB.OKO_FEM = "):s.rindex(";")])


def keys_env():
    s = os.environ.get("GEMINI_API_KEYS", "") or os.environ.get("GEMINI_API_KEY", "")
    return [k.strip() for k in s.split(",") if k.strip()]


def clean(msg, ks):
    for k in ks:
        msg = msg.replace(k, "***")
    return msg


class Quota(Exception):
    pass


def post(url, body, ks, start, timeout):
    """Запрос с перебором ключей: 429/403/5xx — следующий ключ; у всех 429 — Quota."""
    last429 = 0
    for i in range(len(ks)):
        n = (start + i) % len(ks)
        req = urllib.request.Request(url, data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                                     headers={"x-goog-api-key": ks[n], "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8")), n
        except urllib.error.HTTPError as e:
            msg = clean(e.read().decode("utf-8", "replace")[:160], ks)
            if e.code == 429:
                last429 += 1
            log(f"   ключ №{n + 1}: {e.code} {msg.splitlines()[0] if msg else ''}")
            if e.code in (403, 404, 429, 500, 503):
                continue
            raise
        except Exception as e:
            log(f"   ключ №{n + 1}: {type(e).__name__}")
    if last429 == len(ks):
        raise Quota()
    return None, start


LOG = None


def log(s):
    print(s, flush=True)
    if LOG:
        LOG.write(s + "\n"); LOG.flush()


def tts(batch, voice, ks, start):
    content = [{"type": "text", "text": x["say"], "annotations": [{"type": "speech_metadata", "style": x["style"]}]} for x in batch]
    body = {"model": TTS_MODEL, "input": [{"type": "user_input", "content": content}],
            "response_format": {"type": "audio", "mime_type": "audio/wav"},
            "generation_config": {"speech_config": [{"voice": VOICE[voice]}]}}
    d, n = post(TTS_URL, body, ks, start, 900)
    if not d:
        return None, n
    for st in d.get("steps", []):
        if st.get("type") == "model_output":
            for c in st.get("content", []):
                if c.get("type") == "audio" and c.get("data"):
                    return base64.b64decode(c["data"]), n
    return None, n


def align(wav16, texts, ks):
    lines = "\n".join(f"{i + 1}) {t}" for i, t in enumerate(texts))
    prompt = ("В записи один голос по порядку произносит эти реплики:\n" + lines + "\n\n"
              "Для каждой реплики укажи, на какой секунде записи она начинается и на какой кончается "
              "(с точностью до сотых), и запиши, что именно слышно в этом отрезке. Смех, вздохи и паузы "
              "внутри реплики считай её частью. Ответ — только JSON-массив объектов "
              '{"n": номер, "start": секунды, "end": секунды, "heard": "текст"}.')
    data = base64.b64encode(open(wav16, "rb").read()).decode()
    for model in ASR_MODELS:
        body = {"contents": [{"parts": [{"inline_data": {"mime_type": "audio/wav", "data": data}}, {"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}
        if model.startswith("gemini-2.5"):
            body["generationConfig"]["thinkingConfig"] = {"thinkingBudget": 0}
        try:
            d, _ = post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", body, ks, 0, 300)
        except Quota:
            continue
        if not d:
            continue
        try:
            return sorted(json.loads(d["candidates"][0]["content"]["parts"][0]["text"]), key=lambda r: r["n"])
        except Exception:
            continue
    return None


def read(path):
    with wave.open(path, "rb") as w:
        sr, n = w.getframerate(), w.getnframes()
        return sr, np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0


def cut(x, sr, marks, n):
    """Границы реплик — по самой длинной паузе у стыка соседних (не дальше середин кусков)."""
    fr = int(sr * 0.01); m = len(x) // fr
    db = 20 * np.log10(np.sqrt(np.mean(x[:m * fr].reshape(m, fr) ** 2, axis=1)) + 1e-12)
    quiet = db < max(-48.0, db.max() - 38.0)
    gaps, i = [], 0
    while i < m:
        if quiet[i]:
            j = i
            while j < m and quiet[j]:
                j += 1
            if j - i >= 8 and i > 0 and j < m:
                gaps.append((j - i, i, j))
            i = j
        else:
            i += 1
    cuts = [0]
    for a, b in zip(marks[:-1], marks[1:]):
        ea, sb = a["end"], b["start"]
        lo = max(min(ea, sb) - 0.35, (a["start"] + ea) / 2)
        hi = min(max(ea, sb) + 0.35, (sb + b["end"]) / 2)
        near = [g for g in gaps if g[2] / 100 > lo and g[1] / 100 < hi]
        c = (max(near)[1] + max(near)[2]) // 2 if near else int((ea + sb) * 50)
        cuts.append(max(c, cuts[-1] + 10))
    cuts.append(m)
    return [x[a * fr:b * fr] for a, b in zip(cuts[:-1], cuts[1:])]


def sim(a, b):
    f = lambda t: re.sub(r"[^а-яё ]", "", t.lower().replace("ё", "е"))
    return difflib.SequenceMatcher(None, f(a), f(b)).ratio()


def todo(voice, lines, fem, state):
    have = set(f[:8] for f in os.listdir(os.path.join(ROOT, "sounds", "oko", voice))) if os.path.isdir(os.path.join(ROOT, "sounds", "oko", voice)) else set()
    out = []
    for x in lines:
        say = fem.get(x["text"], x["text"]) if voice == "f" and x["kind"] != "pupil" else x["text"]
        k = key(say)
        if k in have or state.get(voice + k, 0) >= 3:
            continue
        out.append(dict(x, say=say, k=k, style=style(x)))
    return out


def batches(items, chars):
    by = {}
    for x in items:
        by.setdefault(x["style"], []).append(x)
    for st, arr in by.items():
        cur, n = [], 0
        for x in arr:
            if cur and n + len(x["say"]) > chars:
                yield cur; cur, n = [], 0
            cur.append(x); n += len(x["say"])
        if cur:
            yield cur


def main():
    global LOG
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="both", choices=["m", "f", "both"])
    ap.add_argument("--requests", type=int, default=60, help="не больше стольких запросов записи за запуск")
    ap.add_argument("--chars", type=int, default=2600, help="знаков в пакете")
    ap.add_argument("--work", default=os.environ.get("OKOVOICE_WORK", "/tmp/okovoice_work"))
    ap.add_argument("--dry", action="store_true", help="только показать, сколько осталось и какие пакеты")
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    LOG = open(os.path.join(a.work, "run.log"), "a", encoding="utf-8")
    subprocess.run(["node", os.path.join(HERE, "extract.js"), os.path.join(HERE, "lines.json")], check=True, capture_output=True)
    lines = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    fem = fem_map()
    sp = os.path.join(a.work, "state.json")
    state = json.load(open(sp)) if os.path.exists(sp) else {}
    voices = ["m", "f"] if a.voice == "both" else [a.voice]
    plan = []
    for v in voices:
        t = todo(v, lines, fem, state)
        log(f"голос {v} ({VOICE[v]}): без записи {len(t)} реплик")
        plan += [(v, b) for b in batches(t, a.chars)]
    # голоса — по очереди пакетами, чтобы оба росли вместе
    inter = []
    pm = [p for p in plan if p[0] == "m"]; pf = [p for p in plan if p[0] == "f"]
    while pm or pf:
        if pm: inter.append(pm.pop(0))
        if pf: inter.append(pf.pop(0))
    log(f"пакетов: {len(inter)}; за этот запуск — не больше {a.requests}")
    if a.dry:
        return
    ks = keys_env()
    if not ks:
        sys.exit("нет ключей Gemini в окружении (GEMINI_API_KEYS)")
    start, made, req = 0, 0, 0
    for v, b in inter:
        if req >= a.requests:
            break
        tag = time.strftime("%m%d_%H%M%S")
        log(f"── пакет {v}: {len(b)} реплик, «{b[0]['style'][:40]}»")
        try:
            wav, start = tts(b, v, ks, start)
        except Quota:
            log("квота записи кончилась у всех ключей — продолжу в другой день"); break
        req += 1
        if not wav:
            log("   запись не вышла"); continue
        start = (start + 1) % len(ks)
        raw = os.path.join(a.work, f"{tag}_{v}.wav"); open(raw, "wb").write(wav)
        w16 = raw[:-4] + "_16k.wav"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-ar", "16000", "-ac", "1", w16], check=True)
        marks = align(w16, [x["say"] for x in b], ks)
        if not marks or len(marks) != len(b):
            log(f"   разметка не сошлась ({len(marks) if marks else 0} из {len(b)}) — пакет пойдёт снова")
            for x in b: state[v + x["k"]] = state.get(v + x["k"], 0) + 1
            json.dump(state, open(sp, "w")); continue
        sr, x = read(raw)
        segs = cut(x, sr, marks, len(b))
        ok = 0
        for it, seg, mk in zip(b, segs, marks):
            d = len(seg) / sr
            s = sim(it["say"], mk.get("heard", ""))
            if s < 0.8 or not (0.035 * len(it["say"]) <= d <= 0.25 * len(it["say"]) + 1.5):
                state[v + it["k"]] = state.get(v + it["k"], 0) + 1
                log(f"   ✗ {it['k']} (сходство {s:.2f}, {d:.1f} с): {it['say'][:60]}")
                continue
            tmp = os.path.join(a.work, f"{v}_{it['k']}.wav")
            proc.write(tmp, sr, seg)
            proc.process(tmp, os.path.join(ROOT, "sounds", "oko", v, it["k"] + ".mp3"))
            ok += 1
        made += ok
        log(f"   принято {ok} из {len(b)}")
        json.dump(state, open(sp, "w"))
    subprocess.run([sys.executable, os.path.join(HERE, "manifest.py")], check=True)
    log(f"итог запуска: запросов записи {req}, новых реплик {made}")


if __name__ == "__main__":
    main()

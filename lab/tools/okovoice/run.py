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
  3. нарезка (seg.py): запись делится на куски по паузам, Gemini записывает, что
     слышно в каждом куске, куски по порядку раскладываются по репликам; реплика,
     услышанная не так (сходство текста меньше 0,8 — бывает, Gemini переиначивает
     реплику) или слишком короткая или длинная для своих слов, — не принимается и
     пойдёт в следующий пакет (после трёх неудач — остаётся синтезатору);
  4. обработка proc.py (механика, второй голос, эхо, −18 LUFS) → sounds/oko/<голос>/<отпечаток>.mp3;
  5. в конце — manifest.py (js/oko_voiced.js).
Сырые записи (рядом — <запись>.json: состав пакета и что принято) и журнал — в --work
(по умолчанию /tmp/okovoice_work), не в репозитории; recut.py нарезает их заново.
Квота кончилась у всех ключей (429) — круг останавливается: продолжить можно завтра.
"""
import argparse, base64, json, os, re, subprocess, sys, time, urllib.request, urllib.error, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import proc, seg  # noqa: E402

TTS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
TTS_MODEL = "gemini-3.8-flash-tts"
# «что слышно» в кусках записи: облегчённые модели (flash-lite) сбиваются в номерах кусков,
# gemini-3.7-flash отвечает минутами
ASR_MODELS = os.environ.get("OKOVOICE_ASR", "gemini-3.5-flash").split(",")
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


REST = {}  # (модель, ключ) → до какого времени ключ отдыхает после 429


def post(url, body, ks, start, timeout):
    """Запрос с перебором ключей: 429/403/5xx — следующий ключ; у всех 429 — Quota.
    Ключ, получивший 429, десять минут не трогается для этой модели."""
    last429 = 0
    model = url.rsplit("/", 1)[-1].split(":")[0]
    for i in range(len(ks)):
        n = (start + i) % len(ks)
        if REST.get((model, n), 0) > time.time():
            last429 += 1
            continue
        req = urllib.request.Request(url, data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                                     headers={"x-goog-api-key": ks[n], "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8")), n
        except urllib.error.HTTPError as e:
            raw = clean(e.read().decode("utf-8", "replace"), ks)
            m = re.search(r'"message":\s*"([^"]{0,140})', raw)
            msg = m.group(1) if m else raw[:140].splitlines()[0] if raw else ""
            if e.code == 429:
                last429 += 1
                REST[(model, n)] = time.time() + 600
            log(f"   ключ №{n + 1}: {e.code} {msg}")
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


# (30.10) между репликами — отдельный кусок «…» в полной тишине: длинная пауза на стыке
# (seg.split_dp режет по ней); проба: две секунды тишины в интонации самой реплики пауз не дают
SEP = {"type": "text", "text": "…", "annotations": [{"type": "speech_metadata", "style": "complete silence for two seconds, no sound at all"}]}


def tts(batch, voice, ks, start):
    content = []
    for i, x in enumerate(batch):
        if i:
            content.append(SEP)
        content.append({"type": "text", "text": x["say"], "annotations": [{"type": "speech_metadata", "style": x["style"]}]})
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


def asr(chunks, ks, lines=None):
    """Что слышно в каждом куске записи (seg.body) — список строк или None.
    Модель занята (503 у всех ключей) — ещё две попытки через 30 и 90 с."""
    for wait in (0, 30, 90):
        time.sleep(wait)
        quota = 0
        for model in ASR_MODELS:
            try:
                d, _ = post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                            seg.body(chunks, lines), ks, 0, 300)
            except Quota:
                quota += 1
                continue
            if not d:
                continue
            try:
                return seg.parse(d["candidates"][0]["content"]["parts"][0]["text"], len(chunks))
            except Exception:
                continue
        if quota == len(ASR_MODELS):
            break
    return None


def read(path):
    with wave.open(path, "rb") as w:
        sr, n = w.getframerate(), w.getnframes()
        return sr, np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0


def fits(say, d):
    """Длина отрезка правдоподобна для слов реплики."""
    return 0.035 * len(say) <= d <= 0.25 * len(say) + 1.5


def cut_batch(raw, items, voice, ks, state):
    """Нарезать запись пакета, принятые реплики — в игру; итог — в <запись>.json рядом.
    Нет ответа на «что слышно» (квота, перегрузка) — -1: запись ждёт, её нарежет recut()."""
    side = raw[:-4] + ".json"
    rows = [{"k": it["k"], "say": it["say"], "style": it["style"], "kind": it["kind"]} for it in items]
    json.dump({"voice": voice, "items": rows}, open(side, "w", encoding="utf-8"), ensure_ascii=False)
    sr, x = read(raw)
    res = seg.split_dp(x, sr, [it["say"] for it in items], lambda c, lines=None: asr(c, ks, lines))
    if res is None:
        log("   «что слышно» не ответило — запись сохранена, нарежется позже")
        return -1
    ok = 0
    for it, row, (sx, heard, s) in zip(items, rows, res):
        d = len(sx) / sr if sx is not None else 0.0
        row.update(heard=heard, sim=round(s, 3), dur=round(d, 2), ok=bool(sx is not None and s >= 0.8 and fits(it["say"], d)))
        if not row["ok"]:
            state[voice + it["k"]] = state.get(voice + it["k"], 0) + 1
            log(f"   ✗ {it['k']} (сходство {s:.2f}, {d:.1f} с): {it['say'][:60]}")
            continue
        tmp = os.path.join(os.path.dirname(raw), f"{voice}_{it['k']}.wav")
        proc.write(tmp, sr, sx)
        proc.process(tmp, os.path.join(ROOT, "sounds", "oko", voice, it["k"] + ".mp3"))
        os.remove(tmp)
        ok += 1
    json.dump({"voice": voice, "items": rows}, open(side, "w", encoding="utf-8"), ensure_ascii=False)
    return ok


def sidecars(work):
    """Сохранённые записи пакетов: [(запись.wav, состав и итог)] по времени."""
    out = []
    for f in sorted(os.listdir(work)):
        if re.fullmatch(r"\d{4}_\d{6}_[mf]\.json", f) and os.path.exists(os.path.join(work, f[:-5] + ".wav")):
            out.append((os.path.join(work, f[:-5] + ".wav"), json.load(open(os.path.join(work, f), encoding="utf-8"))))
    return out


def recut(work, ks, every=False):
    """Нарезать сохранённые записи: ещё не нарезанные (и с непринятыми репликами; every — все).
    Принятая реплика заменяет прежний файл; не принятая — удаляется, если звучала из этой же
    записи (её запишут снова). Нет ответа на «что слышно» — дальше не идём. → (принято, всего)."""
    owner = {}
    for raw, d in sidecars(work):
        for r in d["items"]:
            if r.get("ok"):
                owner[d["voice"] + r["k"]] = raw
    got = total = 0
    for raw, d in sidecars(work):
        rows = d["items"]
        done = bool(rows) and all("sim" in r for r in rows)
        if done and (not every or all(r.get("ok") for r in rows)):
            continue
        v = d["voice"]
        log(f"── нарезка {os.path.basename(raw)}: {len(rows)} реплик")
        ok = cut_batch(raw, rows, v, ks, {})
        if ok < 0:
            break
        for r in json.load(open(raw[:-4] + ".json", encoding="utf-8"))["items"]:
            mp3 = os.path.join(ROOT, "sounds", "oko", v, r["k"] + ".mp3")
            if r.get("ok"):
                owner[v + r["k"]] = raw
            elif owner.get(v + r["k"], raw) == raw:
                owner.pop(v + r["k"], None)
                if os.path.exists(mp3):
                    os.remove(mp3)
        log(f"   принято {ok} из {len(rows)}")
        got += ok; total += len(rows)
    return got, total


def todo(voice, lines, fem, state, wait=()):
    """Реплики без записи; wait — те, чья запись уже есть и ждёт нарезки."""
    have = set(f[:8] for f in os.listdir(os.path.join(ROOT, "sounds", "oko", voice))) if os.path.isdir(os.path.join(ROOT, "sounds", "oko", voice)) else set()
    out = []
    for x in lines:
        say = fem.get(x["text"], x["text"]) if voice == "f" and x["kind"] != "pupil" else x["text"]
        k = key(say)
        if k in have or voice + k in wait or state.get(voice + k, 0) >= 3:
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
    ap.add_argument("--chars", type=int, default=2000, help="знаков в пакете (с паузами между репликами запись длиннее)")
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
    ks = keys_env()
    if not ks and not a.dry:
        sys.exit("нет ключей Gemini в окружении (GEMINI_API_KEYS)")
    if not a.dry:  # сначала — записи, что ждут нарезки с прошлых запусков
        got, total = recut(a.work, ks)
        if total:
            log(f"дорезано: принято {got} из {total}")
    wait = set(d["voice"] + r["k"] for _, d in sidecars(a.work) for r in d["items"] if "sim" not in r)
    voices = ["m", "f"] if a.voice == "both" else [a.voice]
    plan = []
    for v in voices:
        t = todo(v, lines, fem, state, wait)
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
        ok = cut_batch(raw, b, v, ks, state)
        if ok >= 0:
            made += ok
            log(f"   принято {ok} из {len(b)}")
        json.dump(state, open(sp, "w"))
    subprocess.run([sys.executable, os.path.join(HERE, "manifest.py")], check=True)
    log(f"итог запуска: запросов записи {req}, новых реплик {made}")


if __name__ == "__main__":
    main()

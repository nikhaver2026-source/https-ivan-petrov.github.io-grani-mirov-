#!/usr/bin/env python3
"""corpus_rec.py ГОЛОС N ОЧЕРЕДЬ — как gvrec2.py, но в корпус синтезатора (us2/corpus/raw), не в игру.
gvrec2.py ГОЛОС N [ОЧЕРЕДЬ] — сырой пакет из N фраз, ещё не записанных этим голосом (m — Iapetus → gvoice, f — Callirrhoe → gvoice_f).
Ключи — из /root/S/keys/.gemini_key* по очереди (исчерпанный — следующий). Ключи не печатает. Пакет: raw/<голос>/packNNN.wav + .json."""
import sys, os, json, re, glob, base64, urllib.request, urllib.error
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
sys.path.insert(0, R + "/tools/voice"); import gvoice
голос, N = sys.argv[1], int(sys.argv[2])
папка, имя_голоса, опись = {"m": ("gvoice", "Iapetus", "bank_39.js"), "f": ("gvoice_f", "Callirrhoe", "bank_f39.js")}[голос]
def ключ(t): return re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е")).strip()
опись = sorted(glob.glob(f"{R}/sounds/{папка}/{опись.split('3')[0]}[0-9]*.js"), key=lambda f: int(re.search(r"(\d+)\.js$", f).group(1)))[-1]
t = open(опись, encoding="utf-8").read(); есть = dict(json.loads(t[t.index("{"):t.rindex("}") + 1])["p"])
# фразы голосового пакета (sounds/gvoice_pack/<голос>/bank.js) уже записаны — их не просить
tp = open(f"{R}/sounds/gvoice_pack/{голос}/bank.js", encoding="utf-8").read(); есть.update(json.loads(tp[tp.index("{"):tp.rindex("}") + 1])["p"])
out = f"{os.environ.get('CORPUS_DIR', '/root/S/us2/corpus')}/raw/{голос}"; os.makedirs(out, exist_ok=True)
уже = set()
for j in glob.glob(out + "/pack*.json"):
    for f in json.load(open(j, encoding="utf-8")): уже.add(ключ(f["t"]))
# третий довод — файл очереди (queue_m.json / queue_f.json от gvqueue.py); без него — старый список интерфейса
все = json.load(open(sys.argv[3] if len(sys.argv) > 3 else f"{R}/tools/voice/gvoice_phrases.json", encoding="utf-8"))
нет = [f for f in все if ключ(f["t"]) not in есть and ключ(f["t"]) not in уже][:N]
if not нет: print("нечего записывать"); sys.exit(0)
gvoice.ГОЛОС = имя_голоса
тело = json.dumps(gvoice.тело(нет), ensure_ascii=False).encode("utf-8")
import datetime
сост = "/root/S/gvrec/keys_state.json"; st = json.load(open(сост)) if os.path.exists(сост) else {}
# квота обновляется в 07:00 UTC: сутки ключа — от 07:00 до 07:00
сутки = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=7)).strftime("%Y-%m-%d")
if st.get("сутки") != сутки: st = {"сутки": сутки}
ключи = sorted(glob.glob("/root/S/keys/.gemini_key*"))
for kf in ключи:
    n = os.path.basename(kf)
    if st.get(n) == "исчерпан": continue
    req = urllib.request.Request(gvoice.URL, data=тело, headers={"x-goog-api-key": open(kf).read().strip(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=900) as r: d = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        тело_ош = e.read().decode("utf-8", "replace")
        if e.code == 429: st[n] = "исчерпан"; json.dump(st, open(сост, "w")); print(f"{n}: квота исчерпана, следующий"); continue
        чисто = re.sub(r"AIza[0-9A-Za-z_-]+|AQ[.][0-9A-Za-z_.-]+", "[ключ]", тело_ош)[:300]
        print(f"{n}: ответ {e.code}: {чисто}"); continue
    except Exception as e:
        print(f"{n}: сбой {type(e).__name__}"); continue
    звук = next((base64.b64decode(c["data"]) for s in d.get("steps", []) if s.get("type") == "model_output"
                 for c in s.get("content", []) if c.get("type") == "audio" and c.get("data")), None)
    if not звук: print(f"{n}: в ответе нет звука"); continue
    k = len(glob.glob(out + "/pack*.wav")) + 1
    open(f"{out}/pack{k:03d}.wav", "wb").write(звук); json.dump(нет, open(f"{out}/pack{k:03d}.json", "w", encoding="utf-8"), ensure_ascii=False)
    st[n + ":запросов"] = st.get(n + ":запросов", 0) + 1; json.dump(st, open(сост, "w"))
    print(f"{голос} pack{k:03d}: {len(нет)} фраз, {len(звук)//48000} с ({n})"); sys.exit(0)
print("все ключи исчерпаны или не ответили"); sys.exit(2)

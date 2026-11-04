#!/usr/bin/env python3
"""judge.py МЕТКА [МОДЕЛЬ] — судья-слушатель: Gemini слушает пробы (out/<МЕТКА>_m.json + звук фраз) и оценивает.
По каждой фразе: естественность 1–10, разборчивость 1–10, проблемные слова с видом беды (слиплось, непонятно,
оборвано, интонация, щелчок, скорость). Звук фраз — out/<МЕТКА>_phrases/NN.flac (пишет eval.py). Ключи — из
/root/S/keys, не печатаются. Итог: out/<МЕТКА>_judge.json и строка в judge.log."""
import sys, os, json, base64, glob, re, urllib.request, urllib.error, time
МЕТКА = sys.argv[1]; МОДЕЛЬ = sys.argv[2] if len(sys.argv) > 2 else "gemini-3.8-flash"
OUT = "/root/S/us2/out"
фразы = json.load(open(f"{OUT}/{МЕТКА}_m.json", encoding="utf-8"))[:12]
файлы = sorted(glob.glob(f"{OUT}/{МЕТКА}_phrases/*.flac"))[:len(фразы)]
ПРОСЬБА = """Ты — опытный незрячий слушатель синтезаторов речи и диктор. Тебе дают синтезированные фразы на русском языке
(голос склеен из кусков записей) и текст, который должен прозвучать. Оцени строго и честно каждую фразу:
- "естественность": 1–10 (10 — как живой диктор, без слышимых стыков);
- "разборчивость": 1–10 (10 — каждое слово понятно с первого раза);
- "беды": список {"слово": слово из текста, "вид": одно из "слиплось", "непонятно", "оборвано", "интонация", "щелчок", "скорость", "лишний звук"};
- "коротко": одна фраза, что мешает больше всего.
Ответ — только JSON: {"фразы": [{"n": номер, "естественность": .., "разборчивость": .., "беды": [...], "коротко": ".."}]}"""


def запрос(ключ):
    parts = [{"text": ПРОСЬБА}]
    for i, (ф, f) in enumerate(zip(фразы, файлы), 1):
        parts.append({"text": f"Фраза {i}. Текст: {ф['t']}"})
        parts.append({"inline_data": {"mime_type": "audio/flac", "data": base64.b64encode(open(f, "rb").read()).decode()}})
    body = {"contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{МОДЕЛЬ}:generateContent",
                                 data=json.dumps(body, ensure_ascii=False).encode(), headers={"x-goog-api-key": ключ, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r: d = json.loads(r.read().decode())
    t = d["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(t[t.index("{"):t.rindex("}") + 1])


for kf in sorted(glob.glob("/root/S/keys/.gemini_key*"), reverse=True):
    try: res = запрос(open(kf).read().strip()); break
    except urllib.error.HTTPError as e:
        print(f"{os.path.basename(kf)}: {e.code}"); continue
    except Exception as e:
        print(f"{os.path.basename(kf)}: {type(e).__name__}"); continue
else: sys.exit("судья не ответил")
json.dump(res, open(f"{OUT}/{МЕТКА}_judge.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
ф = res.get("фразы", [])
ест = sum(x.get("естественность", 0) for x in ф) / max(1, len(ф)); раз = sum(x.get("разборчивость", 0) for x in ф) / max(1, len(ф))
виды = {}
for x in ф:
    for b in x.get("беды", []): виды[b.get("вид")] = виды.get(b.get("вид"), 0) + 1
строка = f"{time.strftime('%d.%m %H:%M')} {МЕТКА} ({МОДЕЛЬ}): естественность {ест:.1f}, разборчивость {раз:.1f}, беды {виды}"
print(строка); open("/root/S/us2/judge.log", "a", encoding="utf-8").write(строка + "\n")
for x in ф: print(f"  {x.get('n')}: {x.get('естественность')}/{x.get('разборчивость')} — {x.get('коротко', '')[:110]}")

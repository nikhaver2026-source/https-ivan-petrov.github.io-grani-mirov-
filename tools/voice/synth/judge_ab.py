#!/usr/bin/env python3
"""judge_ab.py МЕТКА_А МЕТКА_Б [МОДЕЛЬ] [повторов] — парное сравнение: по каждой фразе судья слушает две записи
(в случайном порядке, без меток версий) и выбирает, какая естественнее и какая разборчивее. Итог: доля побед Б."""
import sys, os, json, base64, glob, random, urllib.request, urllib.error, time
A, B = sys.argv[1], sys.argv[2]; МОДЕЛЬ = sys.argv[3] if len(sys.argv) > 3 else "gemini-3.6-flash"
ПОВТ = int(sys.argv[4]) if len(sys.argv) > 4 else 1
OUT = "/root/S/us2/out"
тексты = [x["t"] for x in json.load(open(f"{OUT}/{A}_m.json", encoding="utf-8"))[:12]]
fa = sorted(glob.glob(f"{OUT}/{A}_phrases/*.flac"))[:12]; fb = sorted(glob.glob(f"{OUT}/{B}_phrases/*.flac"))[:12]
ПРОСЬБА = """Ты — опытный незрячий слушатель синтезаторов речи. Для каждой фразы на русском даны две записи: «первая» и «вторая»
(синтез склейкой из кусков записей одного голоса). Сравни их и выбери, какая звучит естественнее (слитно, без рваных пауз,
щелчков, лишних звуков и скачков интонации) и какая разборчивее. Если почти одинаково — всё равно выбери.
Ответ — только JSON: {"фразы": [{"n": номер, "естественнее": "первая"|"вторая", "разборчивее": "первая"|"вторая", "почему": "кратко"}]}"""


def запрос(ключ, порядок):
    parts = [{"text": ПРОСЬБА}]
    for i, (т, a, b) in enumerate(zip(тексты, fa, fb), 1):
        p1, p2 = (a, b) if порядок[i - 1] == 0 else (b, a)
        parts += [{"text": f"Фраза {i}. Текст: {т}. Первая запись:"}, {"inline_data": {"mime_type": "audio/flac", "data": base64.b64encode(open(p1, "rb").read()).decode()}},
                  {"text": "Вторая запись:"}, {"inline_data": {"mime_type": "audio/flac", "data": base64.b64encode(open(p2, "rb").read()).decode()}}]
    body = {"contents": [{"role": "user", "parts": parts}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{МОДЕЛЬ}:generateContent",
                                 data=json.dumps(body, ensure_ascii=False).encode(), headers={"x-goog-api-key": ключ, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=400) as r: d = json.loads(r.read().decode())
    t = d["candidates"][0]["content"]["parts"][0]["text"]; return json.loads(t[t.index("{"):t.rindex("}") + 1])


побед_ест = побед_раз = всего = 0
ключи = sorted(glob.glob("/root/S/keys/.gemini_key*"), reverse=True)
for повтор in range(ПОВТ):
    порядок = [random.randint(0, 1) for _ in тексты]; res = None
    for kf in ключи:
        try: res = запрос(open(kf).read().strip(), порядок); break
        except urllib.error.HTTPError as e: print(f"{os.path.basename(kf)}: {e.code}"); continue
        except Exception as e: print(f"{os.path.basename(kf)}: {type(e).__name__}"); continue
    if not res: continue
    for x in res.get("фразы", []):
        n = int(x.get("n", 0)) - 1
        if not 0 <= n < len(порядок): continue
        б = "вторая" if порядок[n] == 0 else "первая"   # где стояла Б
        побед_ест += x.get("естественнее") == б; побед_раз += x.get("разборчивее") == б; всего += 1
строка = f"{time.strftime('%d.%m %H:%M')} {A} против {B} ({МОДЕЛЬ}, сравнений {всего}): {B} естественнее в {побед_ест}, разборчивее в {побед_раз}"
print(строка); open("/root/S/us2/judge.log", "a", encoding="utf-8").write(строка + "\n")

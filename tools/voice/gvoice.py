#!/usr/bin/env python3
"""Голос Gemini для постоянных фраз игры (с версии 3.9).

    python3 tools/voice/gvoice.py --left              # сколько фраз ещё без записи
    GEMINI_API_KEY=… python3 tools/voice/gvoice.py --batch 150   # следующий пакет → gvoice_out/

Ключ берётся ТОЛЬКО из переменной окружения GEMINI_API_KEY и никуда не
записывается. Список фраз по частоте — gvoice_phrases.json рядом (собран
прогоном всех наборов проверок и обходом окон игры: каждое предложение,
отданное речи, до пятидесяти знаков без чисел; пункты настроек, меню действий
и инвентаря — впереди, до ста шестидесяти знаков).

Пакет — один запрос: голос Iapetus, два «говорящих» с одним голосом по
очереди (speech_config.speakers): смена очереди даёт паузу между фразами.
Ответ — одна запись WAV 24 кГц на весь пакет.

Что дальше (как в README.md рядом, раздел о Gemini): разрезать запись по
паузам, склеить куски во фразы по распознанному тексту (GigaAM), каждой
фразе — не больше 15 % ошибочных букв; годные — FLAC 24 кГц моно 16 бит,
края тишины срезаны, −18 LUFS, пик не выше −1 дБ; имя — gvNNNN.flac; опись —
sounds/gvoice/bank_1.js (нормализованная фраза → имя): нижний регистр, «ё» →
«е», всё, кроме русских и латинских букв и цифр, — пробел. Та же нормализация
в игре — Speech.gvKey.
"""
import argparse, base64, json, os, re, sys, urllib.request, urllib.error

ТУТ = os.path.dirname(os.path.abspath(__file__))
КОРЕНЬ = os.path.dirname(os.path.dirname(ТУТ))
URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
МОДЕЛЬ = "gemini-3.8-flash-tts"
ГОЛОС = "Iapetus"
ИНТОНАЦИЯ = "clear, natural and brisk, like a skilled narrator of an audio game interface; quick pace"


def ключ_фразы(t):
    return re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е")).strip()


def записано():
    p = os.path.join(КОРЕНЬ, "sounds", "gvoice", "bank_1.js")
    if not os.path.exists(p): return {}
    t = open(p, encoding="utf-8").read()
    return json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]


def тело(фразы):
    content = [{"type": "text", "text": f["t"], "annotations": [
        {"type": "speech_metadata", "speaker": "A" if i % 2 == 0 else "B", "style": ИНТОНАЦИЯ}]}
        for i, f in enumerate(фразы)]
    return {"model": МОДЕЛЬ, "input": [{"type": "user_input", "content": content}],
            "response_format": {"type": "audio", "mime_type": "audio/wav"},
            "generation_config": {"speech_config": {"speakers": [
                {"speaker": "A", "voice": ГОЛОС}, {"speaker": "B", "voice": ГОЛОС}]}}}


def main():
    ap = argparse.ArgumentParser(description="Голос Gemini для постоянных фраз игры")
    ap.add_argument("--left", action="store_true", help="сколько фраз ещё без записи")
    ap.add_argument("--batch", type=int, help="запросить следующий пакет из N фраз")
    ap.add_argument("--out", default="gvoice_out")
    a = ap.parse_args()
    все = json.load(open(os.path.join(ТУТ, "gvoice_phrases.json"), encoding="utf-8"))
    есть = записано()
    нет = [f for f in все if ключ_фразы(f["t"]) not in есть]
    if a.left or not a.batch:
        print(f"фраз в списке {len(все)}, записано {len(есть)}, без записи {len(нет)}"); return
    ключ = os.environ.get("GEMINI_API_KEY", "").strip()
    if not ключ: raise SystemExit("нет GEMINI_API_KEY в окружении")
    пакет = нет[:a.batch]
    req = urllib.request.Request(URL, data=json.dumps(тело(пакет), ensure_ascii=False).encode("utf-8"),
                                 headers={"x-goog-api-key": ключ, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=900) as r:
            d = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Gemini ответил {e.code}: {e.read().decode('utf-8', 'replace')[:400]}")
    звук = next((base64.b64decode(c["data"]) for s in d.get("steps", []) if s.get("type") == "model_output"
                 for c in s.get("content", []) if c.get("type") == "audio" and c.get("data")), None)
    if not звук: raise SystemExit("в ответе нет звука")
    os.makedirs(a.out, exist_ok=True)
    n = len([f for f in os.listdir(a.out) if f.endswith(".wav")]) + 1
    open(os.path.join(a.out, f"pack{n:03d}.wav"), "wb").write(звук)
    json.dump(пакет, open(os.path.join(a.out, f"pack{n:03d}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"pack{n:03d}.wav: {len(пакет)} фраз")


if __name__ == "__main__":
    main()

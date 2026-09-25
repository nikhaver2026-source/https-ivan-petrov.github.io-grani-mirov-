#!/usr/bin/env python3
"""Голоса народов нейроголосами Gemini (с версии 3.7).

    GEMINI_API_KEY=… python3 tools/voice/gemini.py --list          # пакеты
    GEMINI_API_KEY=… python3 tools/voice/gemini.py g3              # пакет целиком
    GEMINI_API_KEY=… python3 tools/voice/gemini.py --keys race_gnomy_g,say_bol_f_g

Ключ берётся ТОЛЬКО из переменной окружения GEMINI_API_KEY и никуда не
записывается. Раздача голосов, интонации и пакеты — в cast.json рядом:
в одном запросе два голоса (speech_config.speakers) и у каждой реплики своя
короткая интонация (speech_metadata.style). Ответ — одна запись WAV 24 кГц на
весь пакет; она кладётся в --out (по умолчанию ./gemini_out).

Что дальше (подробно — README.md рядом): разрезать запись пакета на реплики
и проверить каждую распознавателем (GigaAM) и по темпу, громкость привести к
−18 LUFS замером EBU R128 и линейным усилением с ограничителем пиков, MP3
320 кбит/с, имя — ключ из cast.json (оканчивается на «_g», VOICE_GEN).
"""
import argparse, base64, json, os, sys, urllib.request, urllib.error

ТУТ = os.path.dirname(os.path.abspath(__file__))
URL = "https://generativelanguage.googleapis.com/v1beta/interactions"


def тело(cast, ключи, голоса):
    """Два голоса — режим двух говорящих, у каждой реплики свой говорящий;
    один голос — обычный режим. Интонация у каждой реплики своя."""
    два = len(голоса) == 2
    content = []
    for k in ключи:
        m = cast["lines"][k]
        мета = {"type": "speech_metadata", "style": m["style"]}
        if два: мета["speaker"] = m["voice"]
        # Метку паузы в текст не ставим: однажды она прозвучала словом «пауза».
        content.append({"type": "text", "text": m["text"].rstrip(".") + ".", "annotations": [мета]})
    sc = {"speakers": [{"speaker": v, "voice": v} for v in голоса]} if два else [{"voice": голоса[0]}]
    return {"model": cast["model"], "input": [{"type": "user_input", "content": content}],
            "response_format": {"type": "audio", "mime_type": "audio/wav"},
            "generation_config": {"speech_config": sc}}


def запрос(body, ключ):
    req = urllib.request.Request(URL, data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                                 headers={"x-goog-api-key": ключ, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=900) as r:
            d = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Gemini ответил {e.code}: {e.read().decode('utf-8', 'replace')[:400]}")
    for st in d.get("steps", []):
        if st.get("type") == "model_output":
            for c in st.get("content", []):
                if c.get("type") == "audio" and c.get("data"):
                    return base64.b64decode(c["data"])
    raise SystemExit("в ответе нет звука: " + json.dumps(d, ensure_ascii=False)[:300])


def main():
    ap = argparse.ArgumentParser(description="Голоса народов нейроголосами Gemini")
    ap.add_argument("пакет", nargs="?", help="имя пакета из cast.json (g1…g7)")
    ap.add_argument("--keys", help="через запятую: переозвучить только эти реплики")
    ap.add_argument("--list", action="store_true", help="показать пакеты")
    ap.add_argument("--out", default="gemini_out", help="куда класть записи пакетов")
    ap.add_argument("--dry", action="store_true", help="только показать запрос, без сети")
    a = ap.parse_args()
    cast = json.load(open(os.path.join(ТУТ, "cast.json"), encoding="utf-8"))
    if a.list:
        for b in cast["batches"]:
            print(b["id"], "+".join(b["speakers"]), len(b["lines"]), "реплик")
        return
    if a.keys:
        ключи = [k.strip() for k in a.keys.split(",") if k.strip()]
        нет = [k for k in ключи if k not in cast["lines"]]
        if нет: raise SystemExit("нет в cast.json: " + ", ".join(нет))
        голоса = list(dict.fromkeys(cast["lines"][k]["voice"] for k in ключи))
        if len(голоса) > 2: raise SystemExit("в одном запросе не больше двух голосов: " + ", ".join(голоса))
        имя = "retake"
    elif a.пакет:
        b = next((b for b in cast["batches"] if b["id"] == a.пакет), None)
        if not b: raise SystemExit("нет пакета " + a.пакет)
        ключи, голоса, имя = b["lines"], b["speakers"], b["id"]
    else:
        ap.print_help(); return
    if a.dry:
        print(json.dumps(тело(cast, ключи, голоса), ensure_ascii=False)[:600]); return
    ключ = os.environ.get("GEMINI_API_KEY", "").strip()
    if not ключ: raise SystemExit("нет GEMINI_API_KEY в окружении")
    os.makedirs(a.out, exist_ok=True)
    wav = запрос(тело(cast, ключи, голоса), ключ)
    путь = os.path.join(a.out, имя + ".wav")
    open(путь, "wb").write(wav)
    json.dump(ключи, open(os.path.join(a.out, имя + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{путь}: {len(ключи)} реплик, {len(wav) // 48000} с звука (24 кГц)")


if __name__ == "__main__":
    main()

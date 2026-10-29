#!/usr/bin/env python3
"""Голос ОКО: нарезка записи пакета на реплики — по паузам и по услышанным словам.

Gemini в длинной записи (полсотни реплик, четыре минуты) путает время: отрезки
по его отметкам выходят по 0,1 с или на ползаписи. Поэтому время у него не
спрашиваем:
  1. запись делится на куски по паузам (тише порога не короче 0,25 с; щелчки
     короче 0,1 с — не куски);
  2. каждый кусок — отдельным звуком в запросе к Gemini (до 40 кусков за раз,
     у каждого свой номер): что в нём слышно;
  3. куски раскладываются по репликам по порядку (динамическое программирование):
     каждой реплике — подряд идущие куски, чьи слова лучше всего совпадают с её
     текстом; лишний кусок можно пропустить, выпавшую реплику — оставить пустой;
     граница реплики — середина паузы у её крайних кусков;
  4. проверка: каждый получившийся отрезок снова отдельным звуком — что в нём
     слышно. Модель иногда переносит слова в соседний кусок, и на стыке реплик
     граница могла бы сдвинуться; поэтому сходство считается по тому, что
     слышно в самом отрезке, — run.py принимает реплику при сходстве не ниже 0,8.
"""
import base64, difflib, io, json, re, wave
import numpy as np

GAP = 0.25        # пауза между кусками, с
PER_CALL = 40     # кусков в одном запросе
MAX_PIECES = 8    # кусков в одной реплике
CLICK = 0.1       # короче — щелчок, не кусок


def frames_db(x, sr):
    fr = int(sr * 0.01); m = len(x) // fr
    db = 20 * np.log10(np.sqrt(np.mean(x[:m * fr].reshape(m, fr) ** 2, axis=1)) + 1e-12)
    return fr, db


def pieces(x, sr, gap=GAP):
    """Куски речи между паузами: [(начало, конец)] в отсчётах; паузы по краям записи — не куски."""
    fr, db = frames_db(x, sr)
    quiet = db < max(-48.0, db.max() - 38.0)
    m, need = len(db), int(round(gap * 100))
    out, i, start = [], 0, None
    while i < m:
        if quiet[i]:
            j = i
            while j < m and quiet[j]:
                j += 1
            if start is not None and (j - i >= need or j == m):
                out.append((start * fr, i * fr))
                start = None
            i = j
        else:
            if start is None:
                start = i
            i += 1
    if start is not None:
        out.append((start * fr, m * fr))
    return [p for p in out if p[1] - p[0] >= CLICK * sr]


def wav_bytes(x, sr, rate=16000):
    if sr != rate:
        n = int(len(x) * rate / sr)
        x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return b.getvalue()


PROMPT = ("Выше — {n} кусков одной русской записи, по порядку, у каждого свой номер. "
          "Для каждого куска запиши дословно, что в нём слышно, — только его слова, без догадок о соседних кусках; "
          "если разборчивых слов нет — пустая строка. Ответ — только JSON-объект "
          '{{"1": "текст", "2": "текст", …}} со всеми номерами от 1 до {n}.')


HINT = ("Выше — {n} кусков одной русской записи, по порядку, у каждого свой номер. Голос читает по порядку "
        "реплики из этого списка (какую-то может пропустить или сказать иначе):\n{lines}\n\n"
        "Куски идут подряд: следующий начинается там, где кончился предыдущий. Для каждого куска запиши "
        "дословно, что слышно именно в нём, и номер реплики, к которой он относится (0 — разборчивых слов нет). "
        'Ответ — только JSON-объект {{"1": {{"line": номер, "text": "текст"}}, …}} со всеми номерами от 1 до {n}.')


def body(chunks, lines=None):
    """Тело запроса generateContent: куски по номерам и просьба записать услышанное;
    lines — тексты реплик пакета: с ними модель меньше сбивается в номерах кусков."""
    parts = []
    for i, b in enumerate(chunks):
        parts.append({"text": f"Кусок {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "audio/wav", "data": base64.b64encode(b).decode()}})
    if lines:
        parts.append({"text": HINT.format(n=len(chunks), lines="\n".join(f"{j + 1}) {t}" for j, t in enumerate(lines)))})
    else:
        parts.append({"text": PROMPT.format(n=len(chunks))})
    return {"contents": [{"parts": parts}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}


def parse(text, n):
    d = json.loads(text)
    if isinstance(d, list):
        d = {str(i + 1): t for i, t in enumerate(d)}
    out = []
    for i in range(n):
        t = d.get(str(i + 1), "")
        if isinstance(t, dict):
            t = t.get("text", "")
        out.append(t if isinstance(t, str) else "")
    return out


def norm(t):
    return re.sub(r"\s+", " ", re.sub(r"[^а-яё ]", " ", t.lower().replace("ё", "е"))).strip()


def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() if (a or b) else 1.0


def group(heard, texts, kmax=MAX_PIECES, skip=0.05):
    """Куски по репликам: [(первый, последний)] или None для выпавшей реплики.
    Сумма сходств по репликам — наибольшая; пропуск куска со словами стоит skip."""
    P = [norm(h) for h in heard]
    L = [norm(t) for t in texts]
    n, m = len(L), len(P)
    NEG = -1e9
    best = [[NEG] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    best[0][0] = 0.0
    for j in range(n + 1):
        for i in range(m + 1):
            cur = best[j][i]
            if cur == NEG:
                continue
            if i < m:  # кусок никому: пустой — даром, со словами — за skip
                v = cur - (skip if P[i] else 0.0)
                if v > best[j][i + 1]:
                    best[j][i + 1], back[j][i + 1] = v, (j, i, "skip")
            if j < n:
                v = cur  # реплика выпала из записи
                if v > best[j + 1][i]:
                    best[j + 1][i], back[j + 1][i] = v, (j, i, "none")
                s = ""
                for k in range(i, min(m, i + kmax)):
                    s = (s + " " + P[k]).strip()
                    v = cur + ratio(s, L[j])
                    if v > best[j + 1][k + 1]:
                        best[j + 1][k + 1], back[j + 1][k + 1] = v, (j, i, "take")
    out, j, i = [None] * n, n, m
    while j or i:
        pj, pi, how = back[j][i]
        if how == "take":
            out[pj] = (pi, i - 1)
        j, i = pj, pi
    return out


def hear(x, sr, spans, asr, lines=None):
    """Что слышно в каждом отрезке [(начало, конец)] — по PER_CALL за запрос; None — нет ответа."""
    out = []
    for c in range(0, len(spans), PER_CALL):
        part = spans[c:c + PER_CALL]
        got = asr([wav_bytes(x[a:b], sr) for a, b in part], lines)
        if got is None or len(got) != len(part):
            return None
        out += got
    return out


def split(x, sr, texts, asr, gap=GAP, debug=None):
    """Запись пакета → по реплике: (отрезок, услышано, сходство); выпавшей — (None, "", 0).
    asr(список WAV-байт) → список услышанного или None (нет ответа)."""
    ps = pieces(x, sr, gap)
    if len(ps) < len(texts) // 2:
        return None
    heard = hear(x, sr, ps, asr, texts)
    if heard is None:
        return None
    g = group(heard, texts)
    spans = []
    for r in g:
        if r is None:
            spans.append(None); continue
        a, b = r
        lo = (ps[a - 1][1] + ps[a][0]) // 2 if a > 0 else max(0, ps[a][0] - int(sr * 0.2))
        hi = (ps[b][1] + ps[b + 1][0]) // 2 if b + 1 < len(ps) else min(len(x), ps[b][1] + int(sr * 0.4))
        spans.append((lo, hi))
    have = [sp for sp in spans if sp]
    check = hear(x, sr, have, asr) if have else []
    if check is None:
        return None
    if debug is not None:
        debug.update(pieces=[(round(a / sr, 2), round(b / sr, 2)) for a, b in ps], heard=heard, group=g, check=check)
    it, out = iter(check), []
    for t, sp in zip(texts, spans):
        if sp is None:
            out.append((None, "", 0.0)); continue
        h = next(it).strip()
        out.append((x[sp[0]:sp[1]], h, ratio(norm(h), norm(t))))
    return out

#!/usr/bin/env python3
"""Скачивает записи BigSoundBank (Joseph Sardin, CC0) тем же путём, что и
посетитель сайта: открыть страницу звука (сессия и ключ CSRF), затем
отправить форму «Download» (POST download.php, формат wav). Если сайт
ответил страницей, а не звуком, печатает поля формы — чтобы поправить запрос.

Использование: bsb.py список папка
Строка списка: имя номер [заметка]   (номер — как в адресе sNNNN.html)
"""
import http.cookiejar
import os
import re
import sys
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")


def opener():
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-US,en;q=0.9")]
    return op


def fetch(op, url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with op.open(req, timeout=180) as r:
        return r.geturl(), r.headers, r.read()


def one(name, num, root):
    op = opener()
    page_url = f"https://bigsoundbank.com/s{int(num):04d}.html"
    final, _, raw = fetch(op, page_url)
    page = raw.decode("utf-8", "replace")
    token = re.search(r'<meta name="csrf-token" content="([^"]+)"', page)
    token = token.group(1) if token else ""
    form = re.search(r'<form[^>]+action="https://bigsoundbank\.com/download\.php"[^>]*>(.*?)</form>', page, re.S)
    hidden = dict(re.findall(r'<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"', form.group(1))) if form else {}
    variants = [
        {**hidden, "format": "wav", "button": "Download"},
        {**hidden, "format": "wav", "button": "Download", "csrf_token": token},
        {**hidden, "format": "wav", "button": "Download", "id": str(int(num)), "csrf_token": token},
    ]
    os.makedirs(os.path.join(root, name), exist_ok=True)
    for i, fields in enumerate(variants):
        body = urllib.parse.urlencode(fields).encode()
        hdr = {"Referer": final, "Origin": "https://bigsoundbank.com",
               "Content-Type": "application/x-www-form-urlencoded"}
        if token:
            hdr["X-CSRF-Token"] = token
        try:
            url, h, data = fetch(op, "https://bigsoundbank.com/download.php", body, hdr)
        except Exception as e:  # noqa: BLE001
            print(f"!! {name} #{num} вариант {i}: {e}", flush=True)
            continue
        ctype = h.get("Content-Type", "")
        if ctype.startswith("text/html") or len(data) < 2000:
            print(f"   {name} #{num} вариант {i}: пришла страница ({ctype}, {len(data)} байт)", flush=True)
            # Ответ сохраняется для разбора (страница ожидания, ссылка на файл).
            dbg = os.path.join(root, "bsb_debug")
            os.makedirs(dbg, exist_ok=True)
            open(os.path.join(dbg, f"{int(num):04d}_v{i}.html"), "wb").write(data)
            links = sorted(set(re.findall(r'(?:href|src|action|url)\s*[=:]\s*["\']?([^"\' >]+)', data.decode("utf-8", "replace"))))
            for l in links:
                if any(k in l.lower() for k in ("download", "upload", ".wav", "token", "get", "file")):
                    print(f"      ссылка: {l[:200]}", flush=True)
            continue
        cd = h.get("Content-Disposition") or ""
        m = re.search(r'filename="?([^";]+)"?', cd)
        fn = m.group(1) if m else f"bsb_{int(num):04d}.wav"
        fn = re.sub(r"[^\w.\- ]+", "_", fn)[:100]
        path = os.path.join(root, name, fn)
        open(path, "wb").write(data)
        print(f"   файл {fn} {len(data)} байт ({ctype})", flush=True)
        return True
    print(f"!! {name} #{num}: не скачалось; скрытые поля формы: {hidden}; ключ CSRF: {'есть' if token else 'нет'}", flush=True)
    if form:
        print("   форма:", re.sub(r"\s+", " ", form.group(0))[:600], flush=True)
    return False


def main(lst, root):
    for line in open(lst, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        name, num = parts[0], parts[1]
        print(f"== bsb {name} #{num}", flush=True)
        try:
            one(name, num, root)
        except Exception as e:  # noqa: BLE001
            print(f"!! {name}: {e}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

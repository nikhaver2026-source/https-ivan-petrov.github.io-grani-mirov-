"""release175a.py — единые обработчики (З1): странице разрешено читать собственные файлы — connect-src 'self' вместо
'none'. Записи коротких звуков раскодируются в память и звучат без медиаплеера. Внешняя сеть по-прежнему закрыта:
'self' — только файлы самой игры (в приложении Android — appassets, в Windows — app://). Правится только мета-тег
политики безопасности основы; повторный запуск ничего не меняет."""
import re
B = "/root/S/hron/index_before_mater.html"
s = open(B, encoding="utf-8").read()
m = re.search(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">', s)
if not m: raise SystemExit("нет мета-тега политики")
tag = m.group(0)
if "connect-src 'self'" in tag: print("уже применено")
else:
    assert "connect-src 'none'" in tag, tag
    s = s[:m.start()] + tag.replace("connect-src 'none'", "connect-src 'self'") + s[m.end():]
    open(B, "w", encoding="utf-8").write(s); print("политика: connect-src 'self'")

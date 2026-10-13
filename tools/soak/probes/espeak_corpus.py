"""espeak_corpus.py — все строки игры с русскими словами из index.html (литералы скриптов и текст разметки)
в /root/S/dev155/espeak_corpus.json: на них espeak_probe4.js проверяет синтезатор."""
import re, json, html
s=open('/home/user/https-ivan-petrov.github.io-grani-mirov-/index.html',encoding='utf-8').read()
scripts=re.findall(r'<script[^>]*>(.*?)</script>', s, re.S)
lits=set()
pat=re.compile(r'"((?:[^"\\\n]|\\.){3,500})"|\'((?:[^\'\\\n]|\\.){3,500})\'|`((?:[^`\\]|\\.){3,800})`')
cyr=re.compile('[А-Яа-яЁё]{3}')
for sc in scripts:
    for m in pat.finditer(sc):
        x=m.group(1) or m.group(2) or m.group(3)
        if x and cyr.search(x): lits.add(x)
body=re.sub(r'<script[^>]*>.*?</script>','',s,flags=re.S)
body=re.sub(r'<style[^>]*>.*?</style>','',body,flags=re.S)
for line in re.split(r'<[^>]+>',body):
    line=html.unescape(line).strip()
    if cyr.search(line): lits.add(line)
out=set()
for x in lits:
    y=x.replace('\\n','\n').replace('\\"','"').replace("\\'","'").replace('\\`','`').replace('\\\\','\\')
    y=re.sub(r'\$\{[^{}]*(\{[^{}]*\}[^{}]*)*\}','5',y)
    y=re.sub(r'<[^>]+>',' ',y)
    y=html.unescape(y)
    y=re.sub(r'[ \t]{2,}',' ',y).strip()
    if cyr.search(y) and len(y)<=600: out.add(y)
json.dump(sorted(out),open('/root/S/dev155/espeak_corpus.json','w',encoding='utf-8'),ensure_ascii=False)
print(len(out))

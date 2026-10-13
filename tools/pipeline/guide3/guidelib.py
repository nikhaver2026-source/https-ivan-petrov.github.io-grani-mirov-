# Разбор и сборка GUIDE_SRC в index.html: абзац — одна строка JS.
import json, re

P = '/home/user/https-ivan-petrov.github.io-grani-mirov-/index.html'


class Guide:
    def __init__(self, path=P):
        self.path = path
        self.src = open(path, encoding='utf-8').read()
        a = self.src.index('const GUIDE_SRC=[\n')
        end_marker = '"]}];\n'
        e = self.src.index(end_marker, a) + len(end_marker)
        p = self.src.index('const GUIDE_PLAN=[')
        assert e < p, 'конец GUIDE_SRC должен стоять до GUIDE_PLAN'
        self.a, self.e = a, e
        lines = self.src[a:e].split('\n')
        assert lines[0] == 'const GUIDE_SRC=[' and lines[-1] == ''
        self.chapters = []
        cur = None
        for ln in lines[1:-1]:
            m = re.match(r'^\{title:"(Глава (\d+)\. [^"]*)",body:\[$', ln)
            if m:
                cur = {'num': int(m.group(2)), 'title': m.group(1), 'paras': []}
                self.chapters.append(cur)
                continue
            assert ln.startswith(' '), ln[:60]
            expr = ln[1:]
            for tail in (']}];', ']},', ','):
                if expr.endswith(tail):
                    expr = expr[:-len(tail)]
                    break
            else:
                raise ValueError('странный конец строки: ' + ln[-30:])
            text = None
            if expr.startswith('"') and expr.endswith('"') and not re.search(r'"\s*\+|\+\s*"', expr):
                try:
                    text = json.loads(expr)
                except Exception:
                    text = None
            cur['paras'].append({'raw': expr, 'text': text, 'changed': False})
        self.by = {c['num']: c for c in self.chapters}

    # ── поиск ──
    def idx(self, n, start):
        c = self.by[n]
        hits = [i for i, p in enumerate(c['paras']) if p['text'] is not None and p['text'].startswith(start)]
        assert len(hits) == 1, f'[{n}] «{start[:50]}»: найдено {len(hits)}'
        return hits[0]

    def para(self, n, start):
        return self.by[n]['paras'][self.idx(n, start)]

    # ── правки ──
    def sub(self, n, start, old, new, count=1):
        p = self.para(n, start)
        k = p['text'].count(old)
        assert k == count, f'[{n}] «{start[:40]}»: «{old[:60]}» встречается {k} раз(а), ждали {count}'
        p['text'] = p['text'].replace(old, new)
        p['changed'] = True

    def setp(self, n, start, text):
        p = self.para(n, start)
        p['text'] = text
        p['changed'] = True

    def cut(self, n, start):
        c = self.by[n]
        i = self.idx(n, start)
        return c['paras'].pop(i)

    def put(self, n, para):
        self.by[n]['paras'].append(para)

    def new_para(self, text):
        return {'raw': None, 'text': text, 'changed': True}

    def new_chapter(self, n, title, texts):
        assert n not in self.by
        c = {'num': n, 'title': f'Глава {n}. {title}', 'paras': [self.new_para(t) for t in texts]}
        self.chapters.append(c)
        self.by[n] = c
        return c

    # ── сборка ──
    def expr(self, p):
        if p['changed'] or p['raw'] is None:
            t = p['text']
            assert '\n' not in t
            return json.dumps(t, ensure_ascii=False)
        return p['raw']

    def render(self):
        out = ['const GUIDE_SRC=[']
        for ci, c in enumerate(self.chapters):
            out.append('{title:%s,body:[' % json.dumps(c['title'], ensure_ascii=False))
            last_ch = ci == len(self.chapters) - 1
            for pi, p in enumerate(c['paras']):
                last = pi == len(c['paras']) - 1
                tail = (']}];' if last_ch else ']},') if last else ','
                out.append(' ' + self.expr(p) + tail)
        return '\n'.join(out) + '\n'

    def select(self, n, sel):
        """Номера абзацев по префиксам (или числам) — уже после правок."""
        c = self.by[n]
        res = []
        for s in sel:
            if isinstance(s, int):
                assert 0 <= s < len(c['paras'])
                res.append(s)
            else:
                res.append(self.idx(n, s))
        assert len(set(res)) == len(res), f'[{n}] повтор абзаца в выборке'
        return res

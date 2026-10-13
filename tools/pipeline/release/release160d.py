"""release160d.py — (после 16.0) инструмент в деле: топор, серп и кирка дают лишнюю горсть при сборе
на поверхности (gatherCurrent), кирка — при добыче из жилы (mineVein). Сам инструмент — torg160_late.js
(ToolKit). Правит основу. Повторный запуск ничего не меняет."""
B="/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/index_before_mater.html"
def sub(s,a,b):
    if b in s:return s,0
    if s.count(a)!=1:raise SystemExit(f"основа: «{a[:90]}» встречается {s.count(a)} раз, ждали 1")
    return s.replace(a,b),1
s=open(B,encoding="utf-8").read();n=0
s,k=sub(s,'''  if(зелёное&&hasAbility("greenhand")){bounty+=1;навык+=" Зелёная рука: ещё одна.";}\n''',
 '''  if(зелёное&&hasAbility("greenhand")){bounty+=1;навык+=" Зелёная рука: ещё одна.";}\n  /* (после 16.0) Инструмент в деле: топор — дерево, серп — трава, ягоды и грибы, кирка — камень, руда и кристалл. */\n  safeFn(()=>{const т=ToolKit.gather(c.res.name);if(т){bounty+=т.n;навык+=т.t;}});\n''');n+=k
s,k=sub(s,''' G.inv[res]=(Number(G.inv[res])||0)+1;\n safeFn(()=>{beacon(RESBEACON[res]||"res_ore",0,0);UI.pickup();});\n narrate(`Добыто: ${res}. В жиле осталось: ${Math.max(0,left)}.`);''',
 ''' G.inv[res]=(Number(G.inv[res])||0)+1;\n /* (после 16.0) С киркой жила отдаёт ещё одну. */\n const кирка=safeFn(()=>ToolKit.vein(res),null);if(кирка)G.inv[res]+=кирка.n;\n safeFn(()=>{beacon(RESBEACON[res]||"res_ore",0,0);UI.pickup();});\n narrate(`Добыто: ${res}${кирка?` ×${1+кирка.n}`:""}.${кирка?кирка.t:""} В жиле осталось: ${Math.max(0,left)}.`);''');n+=k
open(B,"w",encoding="utf-8").write(s);print("правок:",n)

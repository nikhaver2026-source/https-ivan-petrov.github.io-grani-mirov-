"""releaseA15a.py — правки основы по полной проверке 3 ноября 2026 (просьба игрока: «при быстром пролистывании меню,
настроек и так далее голоса не замолкали — прерываться могут, но не замолкать»).

1. Речь: пункт, на котором стоит игрок (листание меню, ответ на действие), синтезатор иногда роняет — части движков
   Android и браузера мало прежней подачи «ещё один раз через 120 мс»: повтор шёл сразу за остановкой и терялся так же,
   пункт так и не звучал. Теперь такой пункт подаётся снова до трёх раз, с паузой 300, 550 и 800 мс (без лишней
   остановки родного синтезатора: новая фраза сама снимает прежнюю), а потеря замечается через 0,7 с, а не через 1,5 с
   сторожа. Прочие фразы — по-прежнему один повтор.
Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read();n=0
ПРАВКИ=[
 ("""  const ещё=()=>{if(закрыт||повтор||начат||!a||(a.name!=="web"&&a.name!=="native")||!(this._startSeen&&this._startSeen[a.name]))return false;закрыт=true;this._stopWatch();
   if(gen!==this.gen||this.current!==m)return true;
   this.stats.retried=(this.stats.retried||0)+1;safeFn(()=>Речь.записать("игра","синтезатор потерял кусок — подан снова ("+a.name+")",m.parts[i]));
   try{a.cancel();}catch(_){}
   setTimeout(()=>{if(gen===this.gen&&this.current===m)this._part(m,i,true);},120);return true;};""",
  """  /* (3 ноября 2026) Пункт, на котором стоит игрок, — до трёх повторов с нарастающей паузой; прочее — один, как прежде. */
  const важный=!!(m.nav||m.user),раз=Number(повтор)||0,можно=важный?3:1;let ранний=0;
  const ещё=()=>{if(закрыт||раз>=можно||начат||!a||(a.name!=="web"&&a.name!=="native")||!(this._startSeen&&this._startSeen[a.name]))return false;закрыт=true;this._stopWatch();clearTimeout(ранний);
   if(gen!==this.gen||this.current!==m)return true;
   this.stats.retried=(this.stats.retried||0)+1;safeFn(()=>Речь.записать("игра","синтезатор потерял кусок — подан снова ("+a.name+")",m.parts[i]));
   /* родной синтезатор останавливать не нужно: новая фраза сама снимает прежнюю, а остановка перед ней и роняла пункт */
   if(!(важный&&a.name==="native"))try{a.cancel();}catch(_){}
   setTimeout(()=>{if(gen===this.gen&&this.current===m)this._part(m,i,раз+1);},важный?300+250*раз:120);return true;};"""),
 ("""  if(!ok){if(ещё())return;this._finish(m,"FAILED");return;}
  this._watch(m,a,m.parts[i],дальше,()=>ещё());},""",
  """  if(!ok){if(ещё())return;this._finish(m,"FAILED");return;}
  /* пункт игрока: синтезатор, который сообщает о начале, а начала нет за 0,7 с — фраза потеряна, подать снова сразу, не ждать сторожа */
  if(важный&&a&&(a.name==="web"||a.name==="native")&&this._startSeen&&this._startSeen[a.name])ранний=setTimeout(()=>{if(!начат&&!закрыт)ещё();},700);
  this._watch(m,a,m.parts[i],дальше,()=>ещё());},"""),
]
for a,b in ПРАВКИ:
    c=s.count(a)
    if c==0:assert b in s,a[:80];continue
    assert c==1,(a[:80],c);s=s.replace(a,b);n+=1
open(B,"w",encoding="utf-8").write(s)
print("основа: правок",n)

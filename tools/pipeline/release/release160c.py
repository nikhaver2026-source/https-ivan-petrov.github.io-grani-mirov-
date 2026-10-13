"""release160c.py — (16.0) обоз на дороге: встреча помнится у каждого обоза своя (найдено долгой игрой 13 октября:
у деревни, где рядом идут два обоза, окно обоза всплывало на каждом шаге). Правит основу. Запускать ПОСЛЕ release160b.
Повторный запуск ничего не меняет."""
B="/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/index_before_mater.html"
OLD=''' /* Встреча с обозом на дороге: он идёт своим ходом и сам попадается навстречу. */
 safeFn(()=>{const car=caravanHere();
  if(car&&!activeLayer()&&!G.inCombat){
   const key=car.rt.id+":"+G.day+":"+Math.floor(G.hour/6);
   if(G.metCaravan!==key){G.metCaravan=key;stopRun();meetCaravan(car);}}});'''
NEW=''' /* Встреча с обозом на дороге: он идёт своим ходом и сам попадается навстречу.
    (16.0) Встреча помнится у каждого обоза своя (раз в шесть часов). Прежде помнилась одна последняя, и у деревни,
    где рядом идут два обоза, ближним становился то один, то другой — окно обоза всплывало на каждом шаге. */
 safeFn(()=>{const car=caravanHere();
  if(car&&!activeLayer()&&!G.inCombat){
   const key=car.rt.id+":"+G.day+":"+Math.floor(G.hour/6);
   if(!G.metCaravans||typeof G.metCaravans!=="object")G.metCaravans={};
   const met=G.metCaravans;
   if(G.metCaravan!==key&&met[car.rt.id]!==key){G.metCaravan=key;met[car.rt.id]=key;
    for(const k of Object.keys(met))if(+String(met[k]).split(":").slice(-2)[0]<G.day-1)delete met[k];
    stopRun();meetCaravan(car);}}});'''
s=open(B,encoding="utf-8").read()
if NEW in s:print("правок: 0")
else:
    if s.count(OLD)!=1:raise SystemExit(f"основа: кусок встречи с обозом встречается {s.count(OLD)} раз, ждали 1")
    open(B,"w",encoding="utf-8").write(s.replace(OLD,NEW));print("правок: 1")

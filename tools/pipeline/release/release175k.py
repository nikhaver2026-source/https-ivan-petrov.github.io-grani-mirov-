"""release175k.py — приложение Android: служебный работник не нужен.

В приложении страница и все записи лежат внутри APK (адрес appassets.androidplatform.net). Служебный работник там
ничего не ускоряет, а каждую сыгранную запись положил бы второй копией в данные приложения — гигабайты, которых
потом не хватает, когда новая версия ставится поверх прежней, — и отдавал бы старые записи после обновления.
Работник в приложении больше не ставится; прежний, если успел встать, снимается, а его кэш удаляется.
На сайте (GitHub Pages) всё как прежде. Повторный запуск ничего не меняет."""
B = "/root/S/hron/index_before_mater.html"
s = open(B, encoding="utf-8").read()
A0 = """ if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
 }"""
A1 = """ /* (17.0) В приложении Android страница и записи лежат внутри APK: работнику нечего кэшировать, а каждая
    сыгранная запись легла бы второй копией в данные приложения. Там он не ставится, прежний снимается,
    его кэш удаляется. */
 const вAPK=location.hostname==="appassets.androidplatform.net";
 if("serviceWorker" in navigator && location.protocol.startsWith("http") && !вAPK){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
 }
 if(вAPK){
  try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)
   navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>{try{r.unregister();}catch(_){}})).catch(()=>{});}catch(_){}
  try{if(window.caches&&caches.keys)caches.keys().then(ks=>ks.forEach(k=>caches.delete(k).catch(()=>{}))).catch(()=>{});}catch(_){}
 }"""
if A1 not in s:
    assert s.count(A0) == 1, "нет регистрации работника"
    s = s.replace(A0, A1); print("работник: в приложении Android не ставится")
open(B, "w", encoding="utf-8").write(s)

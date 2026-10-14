/* ════════════════════════════════════════════════════════════════════════
   НАБОР 337: ХРОНИКИ ПРИКЛЮЧЕНИЙ — БИБЛИОТЕКА МЕСТ, ЖИВЫЕ ПРИКЛЮЧЕНИЯ РЕЖИССЁРА, ЗВУКИ (17.0)

   Мастер-промпт «Грань миров — хроники приключений, тайны древних мастеров и путь ста тысяч ступеней»:
   приключения с паспортом, многоэтапные цепи, загадки с шестью подсказками, кодовые и рунные замки,
   тайники, ловушки, спасение и сопровождение, стражи и боссы с фазами, развязки, уникальные награды,
   память мира; Режиссёр рождает новые приключения сам; ко всему новому — качественные звуки.

   1. Библиотека: десять мест с паспортом (комнаты, выходы, замки, у каждого замка шесть подсказок), у
      каждого шаблона — заказчики, речь, шаги, награда, развязка у заказчика; житель нужного ремесла
      всегда предлагает одно из приключений в «Больших делах».
   2. Каждое из десяти приключений проходится от взятия дела у жителя до награды; у каждого — своя
      развязка; стражи с фазами проходят все фазы (Болотная матерь — четыре).
   3. Загадка: ошибка стоит своё (шум, время, сдвиг), после трёх — механизм можно вернуть к началу;
      подсказки по ступеням — шесть, последняя называет ответ; рычаги считают путь до цели сами.
   4. Разговор: кнопка «Поговорить» в комнате открывает собеседника; закрытая тема говорит, чего не
      хватает; улика открывает тему, а тема даёт улику.
   5. Срок места: «Тихий Лог» показывает, сколько осталось; вышло время — «Лог пал»; выводят по одному,
      каждый выведенный засчитан.
   6. Уникальная награда — одна на мир: взятую вещь второй раз не предложат; свойства вещи работают:
      чутьё к делу растёт, род тварей из «вреда» бьёт сильнее.
   7. Живые приключения: шесть видов (схрон, логово, часовня, склеп, застава, башня) рождаются и
      проходятся; место из семени строится то же самое; молва — кнопкой в списке заданий, метка — в
      Ctrl+G, через три дня молва остывает.
   8. Режиссёр: у второго поколения рука «приключения», у нейросети — «adventure»; обе рождают молву
      текстом; взятое приключение — награда Режиссёру.
   9. Звуки: двадцать семь новых ролей sounds/adv лежат на диске, у каждой записи строка в титрах и
      лицензия CC0; роли приключений и мастерства указывают на записи банка.
  10. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const page=await (await browser.newContext()).newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1000);
 const R=await page.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const O={};
 const закрыть=()=>{let k=0;while(activeLayer()&&k++<30)closeTopUI();};
 window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
 window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
 const играно=[];const bp0=Bank.play.bind(Bank);Bank.play=function(r){играно.push(r);return bp0.apply(this,arguments);};
 const кнопки=()=>[...document.querySelectorAll('#eventBody button')];
 const нажать=re=>{const b=кнопки().find(x=>re.test(x.textContent));if(b){b.click();return b.textContent;}return null;};
 try{enterGame();}catch(_){}закрыть();G.level=12;G.gold=5000;G.hp=G.hpMax=500;window.maybeEvent=()=>{};
 const P=Приключения170;P.ранг=()=>60;
 Object.assign(G.inv,{"трава":9,"Факел":5,"Верёвка":3,"Плотницкий молоток":1,"Кирка":1,"кость":5,"Еда в дорогу":5,"камень":5});if(!Array.isArray(G.items))G.items=[];G.items.push("Свежевальный нож");
 const путь=(S,от,до)=>{const пред={[от]:null};const q=[от];while(q.length){const r=q.shift();if(r===до)break;const R=S.комнаты.find(x=>x.id===r);for(const e of R.выходы||[])if(!(e.к in пред)){пред[e.к]=[r,e];q.push(e.к);}}
  const out=[];let z=до;while(пред[z]){out.unshift(пред[z][1]);z=пред[z][0];}return out;};
 const идтиК=(sid,куда)=>{const s=P.место(sid);const S=P.шаблон(s);for(const e of путь(S,s.комната,куда)){const st=e.через&&s.об[e.через];if(e.через&&!(st&&st.открыт))return false;P.идти(sid,e);закрыть();}return s.комната===куда;};
 const РЕШ=async(sid,лог)=>{const s=P.место(sid);const S=P.шаблон(s);const все=[];S.комнаты.forEach(r=>(r.объекты||[]).forEach(o=>все.push([r,o])));
  const порядок=["предмет","улика","надпись","разговор","действие","замок","тайник","ловушка","страж","пленник","босс","итог"];
  for(let pass=0;pass<4;pass++)for(const вид of порядок)for(const [r,o] of все.filter(x=>x[1].вид===вид)){const st=s.об[o.id]||(s.об[o.id]={});s.комната=r.id;
   try{
    if(вид==="предмет"&&!st.взят){P.окноВещи(sid,o.id);нажать(/^Взять/);await w(40);закрыть();}
    else if(вид==="улика"||вид==="надпись"){P.окноВещи(sid,o.id);закрыть();}
    else if(вид==="разговор"){for(const т of o.темы||[]){if((st.темы||{})[т.id])continue;P.окноРазговора(sid,o.id);const l=нажать(new RegExp("^"+т.l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));await w(40);закрыть();}}
    else if(вид==="замок"&&!P.сост(s,o).открыт){const D=o.данные||{};const сс=P.сост(s,o);
     if(o.тип==="кольца"){сс.в=D.цель.slice();P.попытка(sid,o);}else if(["код","руны","мелодия"].includes(o.тип)){сс.в=D.ответ.slice();P.попытка(sid,o);}
     else if(o.тип==="рычаги"){(P.рычагиПуть(D,сс.в)||[]).forEach(i=>P.рычагНажать(D,сс.в,i));if(P.решено(s,o))P.открыть(sid,o,"ок");}
     else if(o.тип==="плиты"){const n=D.камни.length;for(let m=1;m<(1<<n);m++){const v=D.камни.map((_,i)=>m>>i&1);if(D.камни.reduce((a,x,i)=>a+(v[i]?x:0),0)===D.цель){сс.в=v;break;}}P.попытка(sid,o);}
     else if(o.тип==="работа"){P.окноЗамка(sid,o.id);нажать(new RegExp("^"+(D.действие||"Взяться")));await w(40);закрыть();}
     P.окноЗамка(sid,o.id);закрыть();}
    else if(вид==="тайник"&&!st.открыт){st.найден=1;P.окноТайника(sid,o.id);нажать(new RegExp("^"+((o.открыть||{}).кнопка||"Открыть")));await w(40);закрыть();}
    else if(вид==="ловушка"&&!st.снята&&!st.обойдена){P.окноЛовушки(sid,o.id);нажать(/^Обойти/)||нажать(/^Обезвредить/);await w(30);закрыть();st.найден=1;}
    else if(вид==="действие"){for(let k=0;k<3;k++){P.открытьОб(sid,o.id);const bs=кнопки().filter(x=>!/^Назад|нужно|Подумать/.test(x.textContent));if(!bs.length){закрыть();break;}const b=bs[bs.length-1];const l=b.textContent;b.click();await w(40);закрыть();if(k===0)лог.push(`${o.id}: «${l.slice(0,40)}»`);}}
    else if(вид==="страж"&&!st.побеждён&&!st.уговорён&&!st.ушёл){P.окноСтража(sid,o.id);закрыть();const m=P.тварь(s,o);P.победа(m);}
    else if(вид==="пленник"&&!st.свободен){P.окноПленника(sid,o.id);const l=нажать(/^(Открыть|Разрезать|Вскрыть|Помочь|Освободить|Назвать|Позвать|Разорвать|Уговорить)/);await w(40);закрыть();
     if(st.свободен){P.окноПленника(sid,o.id);нажать(/^Расспросить/);await w(30);закрыть();}}
    else if(вид==="босс"&&!st.побеждён&&!st.выключен){P.окноБосса(sid,o.id);const l=нажать(/^(Выключить|Упокоить|Назвать|Отогнать|Показать)/);await w(30);закрыть();
     if(!st.выключен&&pass>=1){const m=P.тварь(s,o);m.прикл.фаза=0;m.прикл.база=m.dmg;const cb={m,hp:m.hp,arena:null};for(const k of [0.7,0.45,0.3,0.15,0.05]){cb.hp=Math.round(m.hp*k);P.фаза(cb);}P.победа(m);лог.push(`${o.n}: фаз ${m.прикл.фаза}`);}}
    else if(вид==="итог"&&!st.решено&&pass>=2){P.окноИтога(sid,o.id);const l=нажать(/^(?!Подумать)/);await w(40);закрыть();лог.push(`развязка: ${l}`);}
   }catch(e){лог.push(`ОШИБКА ${o.id}: ${e.message}`);}
   /* спасённых — к выходу */
   if(s.спутник&&!s.спутник.нет&&!s.спутник.дома){s.спутник.где=s.комната;идтиК(sid,S.выход);}
   Цепи170.проверить();закрыть();}
  /* комнаты с целью — дойти до них ногами */
  for(const r of S.комнаты)if(r.цель&&!s.цели[r.цель]){s.комната=S.старт;идтиК(sid,r.id);}Цепи170.проверить();закрыть();
  /* окна всех комнат */
  for(const r of S.комнаты){s.комната=r.id;P.окноКомнаты(sid);закрыть();P.слушать(sid);закрыть();}};
 const ПРОЙТИ=async(c,лог)=>{for(let k=0;k<40&&!c.done;k++){const p=Цепи170.текущий(c);if(!p)break;
   if(p.вид==="место"){const sid=c.id+":"+p.сайт;G.x=p.tx;G.y=p.ty;G.place=null;if(!P.место(sid)){P.войти(c,p);}закрыть();await РЕШ(sid,лог);Цепи170.проверить();закрыть();
    const s=P.место(sid);if(Цепи170.текущий(c)===p){лог.push(`застряли на «${p.текст}»: цели ${Object.keys(s.цели).join(",")}`);break;}}
   else if(p.вид==="идти"){G.x=p.tx;G.y=p.ty;Цепи170.проверить();await w(30);закрыть();if(Цепи170.текущий(c)===p){Цепи170.сделать(c.id,0);закрыть();}}
   else if(p.вид==="говорить"){G.x=p.tx;G.y=p.ty;Цепи170.сделать(c.id,Цепи170.номер(c,p));await w(60);for(let i=0;i<4;i++){if(!нажать(/./))break;await w(40);}закрыть();}
   else{лог.push("шаг "+p.вид);break;}}};

 /* 1. библиотека */
 const фикс=ПРИКЛ170.filter(t=>t.прк&&!t.прк.ген);O.шаблонов=фикс.length;O.паспорт=[];
 for(const t of фикс){const S=ПРК170_МЕСТА[t.прк.место];const ids=new Set();const плохо=[];S.комнаты.forEach(r=>(r.объекты||[]).forEach(o=>ids.add(o.id)));
  const rooms=new Set(S.комнаты.map(r=>r.id));S.комнаты.forEach(r=>(r.выходы||[]).forEach(e=>{if(!rooms.has(e.к))плохо.push("выход "+e.к);if(e.через&&!ids.has(e.через))плохо.push("через "+e.через);if(e.тайный&&!ids.has(e.тайный))плохо.push("тайный "+e.тайный);}));
  S.комнаты.forEach(r=>(r.объекты||[]).forEach(o=>{if(o.вид==="замок"&&o.тип!=="работа"&&((o.подсказки||[]).length!==6||(o.подсказки||[]).some(x=>!x)))плохо.push("подсказки "+o.id);}));
  if(S.комнаты.length<3)плохо.push("комнат мало");if(!t.профы.length||!t.речь||!t.шаги||!t.награда||!t.эпилог)плохо.push("шаблон");
  const n=getNPC(31000+O.паспорт.length*30,31000,0,t.профы[0]);const пред=Цепи170.предложения(n).some(x=>x.прк&&!x.прк.ген);
  O.паспорт.push({id:t.id,плохо,пред});}
 /* 6. уникальная награда и её свойства */
 {const g=Приключения170.ст();delete g.уник.bogheart;const S=ПРК170_МЕСТА.topi;const итог=S.комнаты.find(r=>r.id==="сердце").объекты.find(o=>o.id==="сердце_топи");const v=итог.варианты.find(v=>v.id==="себе");
  const s={цели:{матерь:1},улики:{},об:{}};O.вещьДоступна=v.условие(s,P);v.мир(s,P);O.вещьПовторно=v.условие(s,P);O.вещьЕсть=(G.items||[]).includes("Сердце топи");
  const ч0=Мастерство170.чутьё("herbs");O.чутьё=ч0;закрыть();G.inCombat=false;G.combat=null;const m={id:"troll",n:"Болотный тролль",dmg:5,hp:30,lvl:3};O.диаг={inC:G.inCombat,place:!!G.place,dead:!!G.dead,слой:String(activeLayer()&&activeLayer().id),св:JSON.stringify(Приключения170.вещиСвойства().map(x=>[x.n,x.вредРод]))};try{startCombat({x:G.x,y:G.y,monster:m});}catch(e){O.диаг.err=e.message;}O.диаг.cm=G.combat&&G.combat.m&&G.combat.m.dmg;O.вред=m.dmg;try{G.inCombat=false;G.combat=null;}catch(_){}закрыть();}
 /* 2. проход всех десяти */
 O.проход=[];for(const [i,t] of фикс.entries()){const лог=[];try{const n=getNPC(30200+i*40,30300,0,t.профы[0]);G.x=n.x;G.y=n.y;G.place=null;Цепи170.начать(t,n);закрыть();
   const c=Цепи170.активные().find(x=>x.tid===t.id);if(!c){O.проход.push({id:t.id,нет:1});continue;}await ПРОЙТИ(c,лог);const s=P.место(c.id+":"+t.прк.место);
   O.проход.push({id:t.id,готово:!!c.done,развязка:s&&(s.развязка||s.итог||(s.цели["лог_спасён"]?"лог_спасён":null)),фаз:лог.filter(x=>/фаз/.test(x)),застряли:лог.filter(x=>/застряли|ОШИБКА/.test(x))});}catch(e){O.проход.push({id:t.id,ошибка:e.message});}}
 /* 3. загадка: ошибки, сброс, подсказки */
 {const n=getNPC(32000,32000,0,"Магистр");G.x=n.x;G.y=n.y;Приключения170.ст().сделано["прк_obs"]=0;const t=ЦЕПИ170.find(x=>x.id==="прк_obs");Цепи170.начать(t,n);закрыть();
  const c=Цепи170.активные().find(x=>x.tid==="прк_obs");const sid=c.id+":obs";P.создать(sid,"obs",0,0,c.id);const s=P.место(sid);s.вошёл=1;const o=P.объект(s,"кольца").o;const st=P.сост(s,o);
  const до=JSON.stringify(st.в);st.в=[5,5,5,5];P.попытка(sid,o);st.в=[5,5,5,5];P.попытка(sid,o);st.в=[5,5,5,5];P.попытка(sid,o);закрыть();O.ошибок=st.ошиб;
  P.окноЗамка(sid,"кольца");O.сброс=[...document.querySelectorAll('#eventBody button')].some(b=>/Вернуть механизм к началу/.test(b.textContent));закрыть();
  P.улика(s,"порядок","Надпись над дверью: порядок восхода.");st.подр=1;const подск=[];for(let k=0;k<6;k++){P.подсказка(sid,o);подск.push((document.querySelector("#eventBody .list-line")||{}).textContent||"");закрыть();}O.подсказки=подск.length;O.последняя=подск[5].slice(0,200);
  const рч=P.объект(s,"рычаги").o;const рс=P.сост(s,рч);O.путьРычагов=(P.рычагиПуть(рч.данные,рс.в)||[]).length;}
 /* 4. разговор */
 {const n=getNPC(32100,32000,0,"Торговец");G.x=n.x;G.y=n.y;const t=ЦЕПИ170.find(x=>x.id==="прк_oboz");Приключения170.ст().сделано["прк_oboz"]=0;Цепи170.начать(t,n);закрыть();
  const c=Цепи170.активные().filter(x=>x.tid==="прк_oboz").slice(-1)[0];const sid=c.id+":oboz";P.создать(sid,"oboz",0,0,c.id);const s=P.место(sid);s.вошёл=1;s.комната="хижина";
  P.ранг=d=>0;P.окноКомнаты(sid);const кн=[...document.querySelectorAll('#eventBody button')].find(b=>/^Поговорить: отшельник/.test(b.textContent));O.кнопкаРазговора=!!кн;if(кн)кн.click();await w(60);
  O.окноРазговора=(document.getElementById("eventTitle")||{}).textContent;O.закрытаТема=[...document.querySelectorAll('#eventBody button')].map(b=>b.textContent).find(t=>/обозника/.test(t))||"";закрыть();
  P.улика(s,"сукно","клок сукна");P.окноРазговора(sid,"ярим");const b=[...document.querySelectorAll('#eventBody button')].find(b=>/^Спросить про старшего обозника/.test(b.textContent));if(b)b.click();await w(60);закрыть();O.темаУлика=!!s.улики["сонный"];P.ранг=()=>60;}
 /* 5. срок места */
 {const n=getNPC(32200,32000,0,"Комендант");G.x=n.x;G.y=n.y;const t=ЦЕПИ170.find(x=>x.id==="прк_evac");Приключения170.ст().сделано["прк_evac"]=0;Цепи170.начать(t,n);закрыть();
  const c=Цепи170.активные().filter(x=>x.tid==="прк_evac").slice(-1)[0];const p=c.шаги[1];const sid=c.id+":evac";P.войти(c,p);O.срокТекст=((document.querySelector("#eventBody .list-line")||{}).textContent||"").slice(0,160);закрыть();
  const s=P.место(sid);s.срокС=P.час()-4;P.окноКомнаты(sid);закрыть();O.логПал=!!s.цели["лог_пал"];O.пульс=играно.includes("adv_heart");}
 /* 7. живые приключения */
 O.ген=[];const ар0=P.выбратьАрх;for(const арх of Object.keys(ПРК170_АРХ)){const лог=[];try{P.выбратьАрх=()=>арх;G.x=30000;G.y=30000;G.place=null;P.ген().предложено=[];
   P.породить();const o=P.ген().предложено.slice(-1)[0];renderQuests();const кнопка=!!document.querySelector('#questList .prk170g');
   P.взятьГен(o.id);const c=Цепи170.активные().find(x=>x.данные&&x.данные.сайт===o.id);await ПРОЙТИ(c,лог);O.ген.push({арх,n:o.n,кнопка,готово:!!c.done,застряли:лог.filter(x=>/застряли|ОШИБКА/.test(x))});}catch(e){O.ген.push({арх,ошибка:e.message});}}P.выбратьАрх=ар0;
 {const z=P.ген();const id=Object.keys(z.места)[0];const вид=x=>JSON.stringify(x.комнаты.map(r=>(r.объекты||[]).map(o=>[o.id,o.данные||null])));const старое=вид(ПРК170_МЕСТА[id]);delete ПРК170_МЕСТА[id];P.собрать(id);O.семя=старое===вид(ПРК170_МЕСТА[id]);
  O.метка=safeFn(()=>Карта165.метки().some(m=>/^Молва:/.test(m.n)),false);z.предложено=[{id:"g_x",n:"x",x:1,y:1,до:(Number(G.day)||1)-1}];renderQuests();O.остыла=!document.querySelector('#questList .prk170g');}
 /* 8. Режиссёр */
 {const s=Director.st2();const до=Number(s.qBonus)||0;G.x=30500;G.y=30500;P.ген().предложено=[];const тд=Director.ev_adv();const o=P.ген().предложено.slice(-1)[0];if(o)P.взятьГен(o.id);
  O.реж={руки:DIR2_ARMS.includes("adv")&&NEURO_ARMS.includes("adventure"),сеть:Neuro.st().arms.includes("adventure")&&Neuro.st().arms.includes("d2:adv"),ev:String(тд).slice(0,120),forge:String(Neuro.forge("adventure")).slice(0,120),награда:(Number(s.qBonus)||0)>до,pick:DIR2_ARMS.includes(Director.pick())};}
 /* 9. звуки */
 O.звуки=Object.keys(SOUND_BANK).filter(k=>/^adv_/.test(k)).map(k=>[k,SOUND_BANK[k].f]);
 O.ролиПрк=Object.values(ПРК170_ЗВУК).concat(Object.values(ПРК170_ЗВУКИ_ЗАМКА)).filter(r=>!SOUND_BANK[r]);
 O.ролиМст=Object.values(МСТ170_ЗВУК).filter(r=>!SOUND_BANK[r]);
 O.раздел=roleSection("adv_lock")+"/"+roleSection("adv_rubble")+"/"+roleSection("adv_gong");
 return O;});
 const пасп=R.паспорт.filter(x=>x.плохо.length||!x.пред);
 check('1. библиотека: десять мест с паспортом, выходы и замки целы, у каждого замка шесть подсказок; житель ремесла предлагает приключение',R.шаблонов===10&&пасп.length===0,{шаблонов:R.шаблонов,пасп});
 const непройдено=R.проход.filter(x=>!x.готово||x.застряли&&x.застряли.length||x.ошибка);const развязки=R.проход.filter(x=>x.развязка).length;
 const матерь=(R.проход.find(x=>x.id==="прк_topi")||{}).фаз||[];
 check('2. все десять приключений проходятся до награды, у каждого развязка; Болотная матерь — четыре фазы',непройдено.length===0&&развязки===10&&матерь.some(x=>/фаз 4/.test(x)),{непройдено,развязки,матерь,проход:R.проход.map(x=>x.id+":"+x.развязка)});
 check('3. загадка: три ошибки — можно вернуть механизм; шесть подсказок, последняя называет ответ; рычаги знают путь',R.ошибок>=3&&R.сброс&&R.подсказки===6&&/Око/.test(R.последняя)&&R.путьРычагов>=1,{ош:R.ошибок,сброс:R.сброс,посл:R.последняя,путь:R.путьРычагов});
 check('4. разговор: кнопка в комнате открывает собеседника; закрытая тема говорит, чего не хватает; улика открывает тему и даёт новую',R.кнопкаРазговора&&/отшельник/i.test(R.окноРазговора||"")&&/нужен довод/.test(R.закрытаТема)&&R.темаУлика,{кн:R.кнопкаРазговора,окно:R.окноРазговора,тема:R.закрытаТема,ул:R.темаУлика});
 check('5. срок места: в окне — сколько осталось; вышло время — «Лог пал», и бьётся сердце',/До рассвета/.test(R.срокТекст)&&R.логПал&&R.пульс,{т:R.срокТекст,пал:R.логПал,пульс:R.пульс});
 check('6. уникальная вещь одна на мир; чутьё травника растёт, болотная тварь бьёт сильнее',R.вещьДоступна===true&&R.вещьПовторно===false&&R.вещьЕсть&&R.чутьё>=2&&R.вред===6,{д:R.вещьДоступна,п:R.вещьПовторно,есть:R.вещьЕсть,ч:R.чутьё,вред:R.вред,диаг:R.диаг});
 const генПлохо=R.ген.filter(x=>!x.готово||!x.кнопка||x.ошибка||x.застряли&&x.застряли.length);
 check('7. живые приключения: шесть видов рождаются и проходятся; из семени — то же место; метка в Ctrl+G; молва остывает',R.ген.length===6&&генПлохо.length===0&&R.семя&&R.метка&&R.остыла,{ген:R.ген.map(x=>x.арх+":"+x.готово),генПлохо,семя:R.семя,метка:R.метка,остыла:R.остыла});
 check('8. Режиссёр: руки «приключения» у второго поколения и нейросети; молва текстом; взятое — награда Режиссёру',R.реж.руки&&R.реж.сеть&&/молва/.test(R.реж.ev)&&/молва/.test(R.реж.forge)&&R.реж.награда&&R.реж.pick,R.реж);
 const ЗВ=path.join(__dirname,'..','sounds');const нет=[];R.звуки.forEach(([k,f])=>f.forEach(x=>{if(!fs.existsSync(path.join(ЗВ,x)))нет.push(x);}));
 const титры=fs.existsSync(path.join(ЗВ,'adv','CREDITS.md'))?fs.readFileSync(path.join(ЗВ,'adv','CREDITS.md'),'utf8'):'';
 const безТитров=fs.readdirSync(path.join(ЗВ,'adv')).filter(f=>/\.flac$/.test(f)&&!титры.includes('`'+f+'`'));
 check('9. звуки: двадцать семь ролей sounds/adv на диске, у каждой записи строка в титрах, лицензия CC0; роли приключений и мастерства указывают на банк',
  R.звуки.length===27&&нет.length===0&&безТитров.length===0&&fs.existsSync(path.join(ЗВ,'adv','LICENSE-CC0.txt'))&&R.ролиПрк.length===0&&R.ролиМст.length===0&&R.раздел==="mech/traps/events",{n:R.звуки.length,нет,безТитров,прк:R.ролиПрк,мст:R.ролиМст,раздел:R.раздел});
 check('10. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();

/* ════════════════════════════════════════════════════════════════════════
   НАБОР 334: КНИГА РЕМЕСЛЕННЫХ ДЕЛ, РЕПУТАЦИЯ ПО СТУПЕНЯМ, МОЛВА, ДЕРЖАВНЫЕ ЦЕПИ (17.0)

   Просьба игрока: «кучу различных социальных квестов… расширенную систему квестов репутационных, социальных,
   городских, значимых, государственных, политических… чтобы игрок изучал мир по этим квестам»; мастер-промпт
   «Грань миров»: библиотека дел по ремёслам, многоуровневая репутация с потолками, слухи с надёжностью
   источника, долгие державные цепи с последствиями, что приходят позже.

   1. Книга дел: 113 малых дел — кузнецы 15, кожевенные мастера 12, стража 15, трактирщики 15, жители деревень
      20, торговый люд 20, прочие 16; имена дел не повторяются; каждое берётся у жителя своего ремесла и
      строит шаги в настоящем мире.
   2. У жителя в «Заданиях» — одно большое дело и два малых, малые подписаны «Дело».
   3. Виды дел проходятся до конца: принести; отнести (груз выдают при взятии); весть с решением; привезти;
      засада с добычей; сбор; починить. Слава ремесла и отношение заказчика растут.
   4. Срок: не успели — дело провалено целиком, заказчик помнит, слава ремесла падает.
   5. Отложенные последствия: решение отзывается через несколько дней — запись «Отголосок дела».
   6. Репутация: пятнадцать ступеней; окно «Репутация» в списке заданий; у жителя — что он о вас думает;
      слава ремесла меняет цену у людей этого ремесла; на «доверии» мастер делится секретом — ступень
      мастерства, один раз.
   7. Хозяйство: убывающая отдача за день и потолок семьдесят; дальше — только делом.
   8. Молва: у трактирщика — «Что слышно о делах?»: слухи о настоящих делах в настоящих деревнях с
      координатами; запомнить — метка; правдивый слух — дело у названного жителя; пустой — «враки», счёт
      надёжности источника.
   9. «Дорога трёх земель»: подорожная, три земли, пошлина или мост, перевал, война соседей, договор; через
      дни — отголосок, дорога в памяти мира, «Печать трёх земель».
   10. «Великая засуха» и «Мятежный наместник» проходятся до конца.
   11. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const page=await (await browser.newContext()).newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1000);
 const войти=async()=>{await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};
  window.__окно=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.getElementById("eventBody")||{}).textContent||"",пункты:(curEvent&&curEvent.choices||[]).map(c=>String(c.l))}:null;};
  window.__пункт=re=>{const i=curEvent&&curEvent.choices?curEvent.choices.findIndex(c=>re.test(String(c.l))):-1;if(i>=0){resolveEvent(i);return true;}return false;};
  /* бои — без окна боя: записываем, кто вышел, победу даём сами */
  window.__бои=[];window.startCombat=(c)=>{__бои.push(c&&c.monster);return true;};
  window.__победа=async()=>{const m=__бои.shift();if(m){questMonsterProgress(m);}await new Promise(z=>setTimeout(z,50));return !!m;};
  window.__ц=()=>Цепи170.активные().find(c=>c.tid==="rabotka");
  window.__на=(x,y)=>{__закрыть();G.place=null;G.inCombat=false;G.x=x;G.y=y;Цепи170.проверить();};
  /* проход шага: что бы ни требовал шаг — сделать это, как сделал бы игрок */
  window.__w=ms=>new Promise(z=>setTimeout(z,ms));
  window.__дай=что=>{for(const k in что)G.inv[k]=Math.max(Number(G.inv[k])||0,что[k]);};
  window.__засада=async(c,p)=>{__на(p.tx,p.ty);let i=0;while(!p.done&&i<40){i++;if(!__бои.length){Цепи170.проверить();await __w(1800);}if(__бои.length){await __победа();await __w(80);}}__бои.length=0;__закрыть();};
  window.__сделать=async(c,p,выбор)=>{const idx=Цепи170.номер(c,p);if(!Array.isArray(G.items))G.items=[];
   switch(p.вид){
    case "идти":case "найти":__на(p.tx,p.ty);await __w(60);break;
    case "говорить":if(p.дикая){__на(p.tx,p.ty);await __w(80);if(!__окно())Цепи170.здесь(c.id,idx);await __w(40);}else{if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);}__пункт(/./);await __w(80);__закрыть();break;
    case "принести":__дай(p.что);if(p.дикая){__на(p.tx,p.ty);await __w(80);if(!__окно()||!__пункт(/Отдать/)){__закрыть();Цепи170.здесь(c.id,idx);await __w(40);}__пункт(/Отдать/);await __w(80);__пункт(/Дальше/);await __w(80);}
     else{if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);__пункт(/Дальше/);await __w(80);}__закрыть();break;
    case "починить":(p.инстр||[]).forEach(t=>{if(!G.items.includes(t))G.items.push(t);});__дай(p.мат||{});if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(60);__закрыть();break;
    case "заплатить":G.gold=Math.max(Number(G.gold)||0,p.n+10);if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);__пункт(/Дальше/);await __w(80);__закрыть();break;
    case "засада":await __засада(c,p);break;
    case "убить":{const o=p.около;if(o){G.place=null;G.x=o.x;G.y=o.y;}for(let i=(p.есть||0);i<p.n&&!p.done;i++){questMonsterProgress({id:"wolf",n:"Волк",lvl:2});await __w(20);}__закрыть();break;}
    case "ждать":p.до=Цепи170.сейчас();Цепи170.проверить();await __w(60);break;
    case "выбор":Цепи170.решить(c.id);await __w(40);if(!__пункт(выбор||/./))__пункт(/./);await __w(150);__закрыть();break;
    case "отношение":addStand("vill",p.ключ||p.куда,100);Цепи170.проверить();await __w(60);break;}};
  window.__пройти=async(c,стоп,выбор)=>{let n=0;while(!c.done&&n<90){n++;const ш=Цепи170.текущий(c);if(!ш)break;if(стоп&&стоп(ш,c))return true;
    if(ш.вид==="дела"){const p=ш.под.find(p=>!p.done&&p.вес!==0)||ш.под.find(p=>!p.done);await __сделать(c,p,выбор);}else await __сделать(c,ш,выбор);await __w(40);}
   return c.done;};});};
 await войти();
 /* ── 1. Книга дел ── */
 const к=await page.evaluate(async()=>{const м=ЦЕПИ170.filter(t=>t.малое);const ids=м.map(t=>t.id);const o={всего:м.length,уник:new Set(ЦЕПИ170.map(t=>t.id)).size===ЦЕПИ170.length};
  const гр=p=>м.filter(t=>t.профы.some(x=>p.includes(x))).length;
  o.кузнецы=гр(["Кузнец"]);o.кожевники=гр(["Кожевенный мастер"]);o.стража=гр(["Стражник"]);o.трактир=гр(["Трактирщик"]);o.жители=гр(["Фермер","Старейшина","Целительница"]);
  o.торговцы=гр(["Торговец"]);o.прочие=м.filter(t=>t.профы.some(x=>["Жрец","Служка","Обрядчик","Лекарь","Магистр","Ученик","Маг-отшельник","Странник","Советник","Правитель","Глава клана","Воин клана"].includes(x))).length;
  const нет=[];G.level=6;G.gold=99999;
  for(const t of м){const n=getNPC(40000+(t.id.length*13)%400,41000,0,t.профы[0]);G.x=n.x;G.y=n.y;G.place=null;
   const ok=Цепи170.начать(t,n);__закрыть();const c=Цепи170.активные().find(x=>x.tid===t.id);if(!ok||!c){нет.push(t.id);continue;}
   if(!c.шаги.every(p=>p&&p.вид))нет.push(t.id+":шаги");c.провал=true;const q=(G.quests||[]).find(q=>q.цепь170===c.id);if(q)q.done=true;}
  o.нет=нет;await __w(300);__закрыть();return o;});
 check('1. книга дел: 113 малых (кузнецы 15, кожевенные 12, стража 15, трактирщики 15, жители 20, торговцы 20, прочие 16), имена не повторяются, каждое строится в мире',
  к.всего===113&&к.уник&&к.кузнецы===15&&к.кожевники===12&&к.стража===15&&к.трактир===15&&к.жители===20&&к.торговцы===20&&к.прочие===16&&к.нет.length===0,к);

 /* ── 2. Предложения ── */
 const п=await page.evaluate(async()=>{const n=getNPC(40210,41000,0,"Трактирщик");G.x=n.x;G.y=n.y;const пр=Цепи170.предложения(n);
  npcQuestsView(n.key);const кн=[...document.querySelectorAll('#npcBody [data-cmd^="c170:offer~"]')].map(b=>b.textContent);__закрыть();
  return {больших:пр.filter(t=>!t.малое).length,малых:пр.filter(t=>t.малое).length,кн};});
 check('2. у жителя в «Заданиях» — одно большое дело и два малых; малые подписаны «Дело»',п.больших===1&&п.малых===2&&п.кн.filter(t=>/^Дело: «/.test(t)).length===2&&п.кн.some(t=>/^Большое дело/.test(t)),п);

 /* ── 7. Хозяйство: потолок и убывающая отдача ── */
 const х=await page.evaluate(async()=>{const o={};let V=null;for(let i=0;i<4000&&!V;i++){const x=39000+i*7,y=40500+(i%13)*11;if(settlementSeed(x,y)==="village"){const c=cellContent(x,y);if(c&&c.structure&&c.structure.type==="village")V={x,y,c};}}
  if(!V)return {нет:true};G.place=null;G.x=V.x;G.y=V.y;const имя=Хозяйство170.имяДеревни(V.c);if(!G.standing)G.standing={};G.standing["vill:"+имя]=0;G.standing["city:"+имя]=0;
  G.items=(G.items||[]).concat(["Мотыга","Топор лесоруба","Ведро"]);Хозяйство170.ст();for(const k in G.хоз170)delete G.хоз170[k];Слава170.ст().день={};
  const a0=Хозяйство170.отношение(имя);o.д0=JSON.stringify(Слава170.ст().день);Хозяйство170.сделать("ogorod");const a1=Хозяйство170.отношение(имя);o.a01=[a0,a1];o.с1=__said.slice(-1)[0];Хозяйство170.сделать("drova");const a2=Хозяйство170.отношение(имя);Хозяйство170.сделать("voda");const a3=Хозяйство170.отношение(имя);
  o.первая=a1-a0;o.вторая=a2-a1;o.третья=a3-a2;o.плюсы=[Хозяйство170.РАБОТЫ.find(r=>r.id==="ogorod").плюс,Хозяйство170.РАБОТЫ.find(r=>r.id==="drova").плюс,Хозяйство170.РАБОТЫ.find(r=>r.id==="voda").плюс];
  G.standing["vill:"+имя]=70;G.standing["city:"+имя]=70;for(const k in G.хоз170)delete G.хоз170[k];o.у70=Хозяйство170.сделать("ogorod");o.речь=__said.slice(-1)[0];
  G.standing["vill:"+имя]=68;G.standing["city:"+имя]=68;Слава170.ст().день={};for(const k in G.хоз170)delete G.хоз170[k];Хозяйство170.сделать("ogorod");o.у68=Хозяйство170.отношение(имя);return o;});
 check('7. хозяйство: вторая и третья работа за день дают меньше (убывающая отдача); на семидесяти — отказ «дальше только делом»; с 68 — не выше 70',
  х.первая===х.плюсы[0]&&х.вторая<х.плюсы[1]&&х.третья<х.плюсы[2]&&х.у70===false&&/выше 70/.test(х.речь||"")&&х.у68===70,х);

 /* ── 3–5. Виды дел, срок, отголоски ── */
 const в=await page.evaluate(async()=>{const o={};const пуск=async(id,x,y,выбор)=>{const t=ЦЕПИ170.find(t=>t.id===id);const n=getNPC(x,y,0,t.профы[0]);G.x=n.x;G.y=n.y;G.place=null;
   const inv0=JSON.stringify(G.inv);Цепи170.начать(t,n);await __w(60);__закрыть();const c=Цепи170.активные().find(c=>c.tid===id);if(!c)return {нет:true};
   const r={выдано:c.выдано||null,шагов:c.шаги.length,виды:c.шаги.map(p=>p.вид)};r.done=await __пройти(c,null,выбор);r.done=!!c.done;__закрыть();return r;};
  const кузн0=standOf("guild","Кузнец");
  o.принести=await пуск("d_k_ugol",40300,41000);
  const пд0=Number(G.inv["подковы"])||0;o.отнести=await пуск("d_k_podkovy",40310,41000);
  o.весть=await пуск("d_k_uchenik",40320,41000,/Живи/);
  o.привезти=await пуск("d_f_semena",40330,41000);
  o.засада=await пуск("d_f_kaban",40340,41000);o.шкура=Number(G.inv["кабанья шкура"])||0;
  o.сбор=await пуск("d_k_shahta",40350,41000);
  o.починить=await пуск("d_k_tochilo",40360,41000);
  o.кузнецПрирост=standOf("guild","Кузнец")-кузн0;
  /* срок */
  const t=ЦЕПИ170.find(t=>t.id==="d_k_srochno");const n=getNPC(40370,41000,0,"Кузнец");G.x=n.x;G.y=n.y;const к1=standOf("guild","Кузнец"),л1=standOf("npc",n.key);
  Цепи170.начать(t,n);await __w(60);__закрыть();const c=Цепи170.активные().find(c=>c.tid==="d_k_srochno");o.срокТекст=(G.quests.find(q=>q.цепь170===c.id)||{}).text||"";
  c.срокДо=Цепи170.сейчас()-1;Цепи170.проверить();await __w(80);__закрыть();o.провал=!!c.провал;o.состояние=(G.quests.find(q=>q.цепь170===c.id)||{}).состояние;
  o.кузнецСрок=standOf("guild","Кузнец")-к1;o.личноСрок=standOf("npc",n.key)-л1;o.помнит=((G.npcMem||{})[n.key]||{д:[]}).д.some(z=>z.т==="нарушил");
  /* отголосок: через три дня */
  const ж0=(G.journal||[]).length;G.day=(Number(G.day)||1)+4;Цепи170.проверить();await __w(80);__закрыть();
  o.отголосок=(G.journal||[]).map(j=>String(j.t||j.text||j)).filter(t=>/Отголосок дела «Сбежавший ученик»/.test(t)).length;
  o.выданоПодков=(o.отнести.выдано||{})["подковы"]||0;return o;});
 check('3. виды дел проходятся до конца: принести, отнести (груз выдан при взятии), весть с решением, привезти, засада с добычей, сбор, починить; слава кузнецов растёт',
  в.принести.done&&в.отнести.done&&в.выданоПодков===6&&в.весть.done&&в.весть.виды.includes("выбор")&&в.привезти.done&&в.засада.done&&в.засада.виды.length===3&&в.сбор.done&&в.починить.done&&в.кузнецПрирост>=16,в);
 check('4. срок: в задании «Срок — ещё N ч»; не успели — дело провалено целиком, заказчик помнит («нарушил»), слава кузнецов падает',
  /Срок — ещё \d+ ч/.test(в.срокТекст)&&в.провал&&в.состояние==="провалено"&&в.кузнецСрок<0&&в.личноСрок<0&&в.помнит,в);
 check('5. отложенные последствия: через дни — «Отголосок дела» в дневнике',в.отголосок>=1,в.отголосок);

 /* ── 6. Репутация ── */
 const р=await page.evaluate(async()=>{const o={};o.ступеней=Слава170.СТУПЕНИ.length;o.мин=Слава170.ступень(-100).номер;o.макс=Слава170.ступень(100).номер;o.ноль=Слава170.ступень(0).n;
  renderQuests();o.кнопка=!!document.querySelector('#questList [data-cmd="rep170"]');CMD.rep170();await __w(40);const ок=__окно();o.окно=ок?{з:ок.заголовок,п:ок.пункты.slice(0,3)}:null;__закрыть();
  const n=getNPC(40400,41000,0,"Кузнец");G.x=n.x;G.y=n.y;openNPC(n.key,true);const л=document.querySelector("#npcBody .slava170");o.строка=л?л.textContent:"";__закрыть();
  if(!G.standing)G.standing={};G.standing["guild:Кузнец"]=0;const m0=buyModifier(n);G.standing["guild:Кузнец"]=50;const m1=buyModifier(n);o.дешевле=m1<m0;o.m0=m0;o.m1=m1;
  G.standing["guild:Кузнец"]=55;G.mast=G.mast||{};G.mast.smith={ур:1,оп:0,дел:0};Слава170.ст().секреты={};
  Слава170.поднятьРемесло("Кузнец",10);o.ур1=mastOf("smith").ур;G.standing["guild:Кузнец"]=55;Слава170.поднятьРемесло("Кузнец",10);o.ур2=mastOf("smith").ур;return o;});
 check('6. репутация: 15 ступеней (1 — «кровный враг», 15 — «легенда»), окно «Репутация» в списке заданий, у жителя — его отношение; слава ремесла снижает цену; секрет мастера — один раз',
  р.ступеней===15&&р.мин===1&&р.макс===15&&р.кнопка&&р.окно&&р.окно.з==="Репутация"&&/ремесла «Кузнец»|к вам/.test(р.строка)&&р.дешевле&&р.ур1===2&&р.ур2===2,р);

 /* ── 8. Молва ── */
 const м=await page.evaluate(async()=>{const o={};const n=getNPC(40500,41000,0,"Трактирщик");G.x=n.x;G.y=n.y;G.place=null;openNPC(n.key,true);
  const b=document.querySelector('#npcBody [data-cmd^="molva170:"]');o.кнопка=b?b.textContent:"";__закрыть();
  const сл=Молва170.слухиУ(n);o.слухов=сл.length;o.текст=сл.map(r=>r.текст);o.деревни=сл.filter(r=>r.prof).every(r=>{const c=cellContent(r.x,r.y);return c&&c.structure&&["village","castle"].includes(c.structure.type);});
  CMD.molva170(n.key);await __w(40);const ок=__окно();o.окно=ок?ок.пункты.slice(0,2):[];__пункт(/Запомнить/);await __w(60);__закрыть();
  const g=Молва170.ст();o.запомнено=g.слухи.length;const мк=(G.metki165||[]).some(m=>/^Слух:/.test(m.n));o.метка=мк;
  /* правдивый и пустой слух */
  const r1=Object.assign({},сл.find(r=>r.prof)||сл[0]);const кто=(r)=>{for(let i=0;i<9;i++){const x=getNPC(r.x,r.y,i);if(x.prof===r.prof)return x;}return getNPC(r.x,r.y,0,r.prof);};
  g.слухи=[Object.assign({},r1,{id:"т1",правда:true,проверен:false})];const жит=кто(r1);G.x=жит.x;G.y=жит.y;openNPC(жит.key,true);o.правдивый=(document.querySelector("#npcBody .list-line")||{}).textContent||"";__закрыть();
  o.вПредложениях=Цепи170.предложения(жит).some(t=>t.id===r1.tid);
  g.слухи.push(Object.assign({},r1,{id:"т2",правда:false,проверен:false,подтверждён:false}));g.слухи[0].взят=true;openNPC(жит.key,true);o.пустой=(document.querySelector("#npcBody .list-line")||{}).textContent||"";__закрыть();
  o.счёт=g.счёт["Трактирщик"];return o;});
 check('8. молва: у трактирщика «Что слышно о делах?»; слухи о делах в настоящих деревнях с координатами; запомнить — метка; правдивый — дело у названного жителя; пустой — «враки», счёт надёжности',
  /Что слышно о делах/.test(м.кнопка)&&м.слухов>=1&&м.текст.every(t=>/X \d+, Y \d+/.test(t))&&м.деревни&&м.запомнено>=1&&м.метка&&/правдив/.test(м.правдивый)&&м.вПредложениях&&/Враки/.test(м.пустой)&&м.счёт&&м.счёт.в===1&&м.счёт.л===1,м);

 /* ── 9–10. Державные цепи ── */
 const д=await page.evaluate(async()=>{const o={};const пуск=async(id,x,y,выбор)=>{const t=ЦЕПИ170.find(t=>t.id===id);const n=getNPC(x,y,0,t.профы[0]);G.x=n.x;G.y=n.y;G.place=null;
   Цепи170.начать(t,n);await __w(60);__закрыть();const c=Цепи170.активные().find(c=>c.tid===id);if(!c)return {нет:true};const r={шагов:c.шаги.length,земли:[c.данные.ea,c.данные.eb,c.данные.ec]};
   await __пройти(c,null,выбор);r.done=!!c.done;__закрыть();return r;};
  o.дорога=await пуск("tri_zemli",40600,41000,/Починить мост|посредником|открыта для всех|./);o.печать=(G.items||[]).includes("Печать трёх земель");
  const ж0=(G.journal||[]).length;G.day=(Number(G.day)||1)+6;Цепи170.проверить();await __w(80);__закрыть();
  o.отголоски=(G.journal||[]).map(j=>String(j.t||j.text||j)).filter(t=>/Отголосок дела «Дорога трёх земель»/.test(t)).length;o.мир=!!(Цепи170.ст().мир||{}).дорога170;
  o.засуха=await пуск("zasuha",40700,41000,/колодец|обряд|./);o.наместник=await пуск("namestnik",40800,41000,/Арестовать|./);return o;});
 check('9. «Дорога трёх земель»: долгая цепь проходится до конца, «Печать трёх земель»; через дни — отголоски, дорога в памяти мира',
  д.дорога.done&&д.дорога.шагов>=12&&д.печать&&д.отголоски>=1&&д.мир,д.дорога&&{шагов:д.дорога.шагов,земли:д.дорога.земли,done:д.дорога.done,печать:д.печать,отголоски:д.отголоски,мир:д.мир});
 check('10. «Великая засуха» и «Мятежный наместник» проходятся до конца',д.засуха.done&&д.наместник.done,{засуха:д.засуха,наместник:д.наместник});
 check('11. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();

/* ════════════════════════════════════════════════════════════════════
   ПРЕСТОЛЫ (14.5, ФАЗА IV «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   У каждой из девяноста девяти держав — правящий род, правитель с
   возрастом и нравом, наследники (законные, побочные, приёмные; при
   дворе, в изгнании, в плену), закон наследования, знатные дома с гербом,
   девизом, обычаем и старой враждой, храм со своим влиянием и нравом.
   Правители стареют и умирают — от старости, болезни, раны, яда
   заговорщиков; наследник бывает малолетним — тогда правит регент;
   незаконным, отсутствующим, оспариваемым — тогда начинается спор о
   престоле: дома делятся и изменяют, соседи вмешиваются, а победивший дом
   основывает новую династию. Браки родов сближают державы, вмешательство
   ссорит — через общую дипломатию мира, от которой зависит и война.

   ВЫВОДИТСЯ, А НЕ ХРАНИТСЯ. Повседневная жизнь двора — верность и сила
   домов, устойчивость, казна, войско, люди, влияние храма — считается из
   номера дня и основы рода, как вся политика мира. В сохранение (G.thr)
   попадает только случившееся: новый правитель, спор, мятеж, заговор,
   брак, след поступков героя и его вольный удел. Двор, где ничего не
   случилось, хранить незачем: он одинаков при любой перезагрузке.
   ════════════════════════════════════════════════════════════════════ */
const THR_YEAR=360;
const THR_NAMES={
 муж:["Аларик","Бранд","Велимир","Гордей","Доран","Ерослав","Звенимир","Ивар","Корвин","Лютобор","Мирон","Нарвин","Остромир","Передраг","Ратибор","Святогор","Тарвен","Ульрик","Феодор","Хальвар","Цедрик","Ярополк","Эдмар","Борислав","Вадим","Гарольд","Даромир","Ингвар","Казимир","Любомир","Мстислав","Роланд"],
 жен:["Агния","Беляна","Вилена","Горислава","Дарина","Елена","Злата","Ирина","Кассия","Любава","Милена","Нимия","Ольга","Предслава","Ростислава","Светлана","Тамара","Ульяна","Фрида","Хельга","Цветана","Ярослава","Эвелина","Божена","Велеслава","Гудрун","Доброслава","Инга","Купава","Лада","Мирослава","Раймунда"],
 /* правящие роды дальних держав — «Дом …» и «Род …»; знатные дома — свой список,
    чтобы правящий род одной державы не путался со знатью другой */
 дом:["Вересов","Тальмаров","Гранных","Ольховых","Сокольских","Медвежьих","Ясных","Каменных","Солнцевых","Терновых","Стужевых","Перовых","Красногоров","Белозёров","Ворониных","Златоустов","Морских","Седых","Рудных","Дубравных","Ветровых","Лунных","Пепельных","Хрустальных",
  "Орловых","Курганных","Снежных","Янтарных","Полуночных","Багряных","Туманных","Ковыльных","Железных","Серебряных","Грозовых","Рябиновых","Яровых","Буревых","Липовых","Сумрачных","Звёздных","Осиновых","Бронзовых","Ледовых","Зоревых","Тисовых","Кремнёвых","Вьюжных","Дымовых","Полынных","Мглистых","Огнёвых"],
 род:["Ярославичей","Мстиславичей","Изяславичей","Всеславичей","Ростиславичей","Святославичей","Бориславичей","Брячиславичей","Вячеславичей","Мирославичей","Велимировичей","Ратиборовичей","Лютоборовичей","Остромировичей","Добрыничей","Гордеевичей","Даромировичей","Звенимировичей","Любомировичей","Казимировичей","Вадимовичей","Ингваровичей",
  "Ольговичей","Игоревичей","Глебовичей","Всеволодовичей","Давыдовичей","Романовичей","Олеговичей","Ратмировичей","Судиславичей","Твердиславичей","Годиновичей","Хотимировичей","Жирославичей","Воиславичей","Милорадовичей","Радимичей","Златомировичей","Светозаровичей","Драгомировичей","Велеборовичей","Сбыславичей","Яромировичей"],
 знать:["Черноельных","Бродовых","Тиховодных","Ясеневых","Горностаевых","Лебяжьих","Совиных","Рысьих","Барсучьих","Журавлиных","Ястребиных","Кабаньих","Лисьих","Бобровых","Туровых","Вепревых","Оленьих","Волчьих","Вороновых","Змеиных","Дроздовых","Камышовых","Ракитовых","Сычёвых",
  "Крутоярских","Белоярских","Чернореченских","Тихоборских","Златогорских","Красноборских","Синеморских","Высокогорских","Ясноборских","Старогорских","Новоградских","Кремнеградских","Белокаменных","Чернокаменных","Серебробродских","Медноярских"],
 цвет:["серебряный","золотой","червлёный","лазоревый","зелёный","чёрный","пурпурный","белый"],
 фигура:["волк","сокол","медведь","олень","дуб","башня","меч","ключ","звезда","ворон","змей","корона","якорь","лилия","колос","молот"],
 поле:["на лазоревом поле","на червлёном поле","на золотом поле","на зелёном поле","на чёрном поле","на серебряном поле","на рассечённом поле","на поле в шахматную клетку"],
 девиз:["Корни глубже бури","Слово крепче стали","Мы помним","Не гнёмся","Свет не просят","Кто ждёт, тот берёт","Верность дороже золота","Пепел помнит огонь",
  "Ни шагу назад","Тишина — оружие","Волна возвращается","Дом прежде всего","Честь не продаётся","Первыми в бой","Мы держим ключ","Звёзды видят",
  "Кровь не вода","Терпение точит камень","Щедрость — щит","Земля нас кормит","Ветер наш союзник","Где мы, там порядок","Не спим","Долг выше трона",
  "Камень не торгуется","Огонь бережёт своих","Ночь длиннее дня","Мы пришли первыми","Слушай реку","Острое слово, тупой меч","Ворота открыты гостю","Зима всё помнит"],
 обычай:["берут жён из-за моря","сыновей отдают в храм на год","ключи от города носят на шее","не едят хлеба в день траура","клянутся на мече предка","старшую дочь учат счёту казны",
  "хоронят на холмах у дороги","перед войной молчат три дня","гостя кормят прежде, чем спросить имя","наследника венчают на рассвете","поют родословную на каждом пиру","долги прощают в день зимнего солнцестояния",
  "детей учат ходить по канату над рекой","не входят в дом с оружием","раз в год меняются щитами с соседом","держат при дворе слепого летописца"],
 храм:["Орден Зари","Церковь Горна","Сестры Двух Лун","Братство Бурь","Обитель Глубин","Круг Корней","Пепельный Собор","Тихий Совет Тени","Хранители Нити","Дорожное Братство"]};
/* Нрав правителя: что он меняет при дворе и как держава ведёт себя вовне. */
const THR_TRAITS=[
 {id:"храбрый",n:"храбрый",о:"идёт в бой первым",войско:6,смерть:0.00008,вовне:"ищет славы в поле и держит соседей в страхе"},
 {id:"осторожный",n:"осторожный",о:"не рискует ни людьми, ни казной",стаб:4,вовне:"держит мир и выжидает"},
 {id:"щедрый",n:"щедрый",о:"раздаёт земли и золото",верность:5,казна:-4,вовне:"покупает дружбу соседей дарами"},
 {id:"скупой",n:"скупой",о:"копит казну, а дома ропщут",казна:6,верность:-4,вовне:"торгуется за каждую пошлину"},
 {id:"набожный",n:"набожный",о:"слушает храм больше совета",храм:8,вовне:"дружит с единоверцами и сторонится иноверцев"},
 {id:"жестокий",n:"жестокий",о:"держит дома страхом",стаб:3,верность:-6,вовне:"грозит соседям и казнит послов"},
 {id:"мудрый",n:"мудрый",о:"мирит дома и судит честно",стаб:6,верность:3,вовне:"мирит соседей и сам зовётся в посредники"},
 {id:"болезненный",n:"болезненный",о:"часто болеет, и всё решает совет",смерть:0.00035,вовне:"не загадывает дальше весны"},
 {id:"честолюбивый",n:"честолюбивый",о:"ищет новых земель",войско:4,стаб:-3,вовне:"спорит о рубежах и тянется к чужим землям"},
 {id:"мягкий",n:"мягкий",о:"уступает домам и храму",верность:4,стаб:-4,вовне:"уступает соседям"}];
const THR_LAWS={
 старшинство:{n:"по старшинству",о:"престол переходит к старшему законному наследнику; малолетнему — с регентом"},
 выборы:{n:"выборы домов",о:"главы знатных домов выбирают правителя из своих глав и наследников рода"},
 знамение:{n:"по знамению",о:"храм толкует волю богов и называет правителя"},
 сила:{n:"по силе",о:"престол берёт сильнейший из рода; спор решают дружины"}};
const THR_DEATH=["от старости","от лихорадки","от раны на охоте","от удара","во сне","от морового поветрия","от раны в бою","утонув на переправе"];
const THR_FEUD=["спор о межевом камне","кровь на свадебном пиру","долг за выкуп пленных","место по правую руку от престола","похищенная невеста","сожжённая мельница","рудная жила на меже","клятва, нарушенная в бою","убитый на поединке наследник","право первой охоты"];
const THR_WANTS=["снять пошлины с хлеба","вернуть домам право суда","урезать храмовую десятину","созвать совет домов","мира с соседями любой ценой","войны за спорные земли","открыть рудники для всех домов","отменить рекрутский набор","изгнать чужих купцов","вернуть изгнанного наследника","ограничить власть регента","разделить казну между домами"];
const THR_SPY=["Тихие перья","Ночные писари","Серые голуби","Слуховые окна","Мышиный совет","Шёпот колоколен","Безымянные гонцы","Вороньи глаза","Ключники","Немые слуги","Пыльные плащи","Тени у колодцев","Счётчики шагов","Дорожные слухачи","Соляные уши","Зеркальщики"];
const THR_FACTION=["за войско","за храм","за гильдии","за старые дома","за народ","за купцов"];
/* Знамения: одни шатают престол, другие называют любимца богов. */
const THR_SIGN=[
 {к:"трон",t:"комета над престольным городом: храм говорит, что трон шатается"},
 {к:"трон",t:"в полдень потемнело солнце, и в столице заперли лавки"},
 {к:"трон",t:"треснул колокол главного храма — к перемене власти, шепчут люди"},
 {к:"наследник",t:"в храме сам собой зажёгся старый светильник: боги — за {h}"},
 {к:"наследник",t:"белый олень вышел к воротам, когда мимо проезжал {h}: знак любимца богов"},
 {к:"наследник",t:"старая пророчица назвала имя будущего правителя — {h}"}];
/* Пол правителей двенадцати держав Средоточия — по их записям. */
const THR_CORE_FEM=[5,7,10];
const Throne={
 st(){if(!G.thr||typeof G.thr!=="object")G.thr={};const s=G.thr;
  if(!s.r||typeof s.r!=="object")s.r={};if(!Array.isArray(s.ev))s.ev=[];if(!s.infl||typeof s.infl!=="object")s.infl={};
  if(!s.md||typeof s.md!=="object")s.md={};if(!Array.isArray(s.бр))s.бр=[];
  if(!Number.isFinite(Number(s.day)))s.day=0;return s;},
 day(){return this._d||Number(G.day)||1;},
 q(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));},
 btn(cmd,label,speak){return `<button type="button" class="item" data-cmd="th:${cmd}" data-speak="${this.q(speak||label)}">${this.q(label)}</button>`;},
 h(i,k,s){return hashName(i*131+7,k,9960+(s||0));},
 pick(arr,i,k){return arr[Math.floor(this.h(i,k)*arr.length)%arr.length];},
 cl(v,a,b){return Math.max(a,Math.min(b,Math.round(v)));},
 dg(n){return String(n).replace(/^Дом /,"дома ");},
 /* ── ОСНОВА РОДА ── */
 law(e){const t=((e.gov||"")+" "+(e.name||"")).toLowerCase();
  if(/вече|сход|выбира|республик|лиг|конфедерац|совет капитан|союз/.test(t))return "выборы";
  if(/жриц|теократ|храм|священ|орден|ковен|обител/.test(t))return "знамение";
  if(/вожд|орд|клан|хан|каган|дружин/.test(t))return "сила";
  return "старшинство";},
 title(e,жен){const t=((e.gov||"")+" "+(e.name||"")).toLowerCase();
  const T=[[/царств|царь/,"царь","царица"],[/королев/,"король","королева"],[/княж|князь/,"князь","княгиня"],[/герцог/,"великий герцог","великая герцогиня"],
   [/ханств|хан(?![а-яё])/,"хан","ханша"],[/каган/,"каган","каганша"],[/халиф/,"халиф","халифа"],[/теократ|жриц|храм/,"первосвященник","верховная жрица"],
   [/республик|вече/,"посадник","посадница"],[/лиг/,"глава лиги","глава лиги"],[/конфедерац|союз/,"верховный старейшина","верховная старейшина"],[/импери/,"император","императрица"]];
  for(const [re,m,f] of T)if(re.test(t))return жен?f:m;return жен?"правительница":"правитель";},
 /* Имена правящих родов — один раз на все державы и без повторов: двенадцать
    Средоточия — из их записей, прочие — из списков «Дом …» и «Род …». */
 _dyn:null,
 dynNames(){if(this._dyn)return this._dyn;const used=new Set(EMPIRE_EXTRA.map(x=>x.династия));
  safeFn(()=>Object.values(DARK_EMPIRE_EXTRA).forEach(x=>used.add(x.династия)));
  const pool=THR_NAMES.дом.map(x=>"Дом "+x).concat(THR_NAMES.род.map(x=>"Род "+x)),out=[];
  for(let i=0;i<EMPIRES.length;i++){if(i<EMPIRE_EXTRA.length){out.push(EMPIRE_EXTRA[i].династия);continue;}
   const k0=Math.floor(this.h(i,1)*pool.length);let n=null;
   for(let t=0;t<pool.length&&!n;t++){const c=pool[(k0+t)%pool.length];if(!used.has(c))n=c;}
   n=n||`Младший дом державы «${EMPIRES[i].short}»`;used.add(n);out.push(n);}
  return this._dyn=out;},
 person(i,k,жен,born,l,г){const n=(жен?THR_NAMES.жен:THR_NAMES.муж)[Math.floor(this.h(i,k)*32)%32];
  return {n,ж:жен?1:0,b:born,l:l==null?1:l,г:г||0,t:Math.floor(this.h(i,k+1)*THR_TRAITS.length)%THR_TRAITS.length};},
 schools(i){const ids=SCHOOLS.map(s=>s.id),out=[];for(let k=0;out.length<3&&k<40;k++){const id=ids[Math.floor(this.h(i,180+k)*ids.length)%ids.length];if(!out.includes(id))out.push(id);}return out;},
 _base:{},
 base(i){if(this._base[i])return this._base[i];const e=EMPIRES[i];if(!e)return null;
  const ex=i<EMPIRE_EXTRA.length?EMPIRE_EXTRA[i]:null,род=this.dynNames()[i];
  /* знатные дома: герб, девиз, обычай, сила, верность, честолюбие и старая вражда */
  const дома=[];const nH=3+Math.floor(this.h(i,2)*3);
  for(let k=0;дома.length<nH&&k<24;k++){const hn="Дом "+THR_NAMES.знать[Math.floor(this.h(i,10+k)*THR_NAMES.знать.length)%THR_NAMES.знать.length];
   if(дома.some(x=>x.n===hn))continue;const j=дома.length;
   дома.push({n:hn,герб:`${this.pick(THR_NAMES.цвет,i,20+j)} ${this.pick(THR_NAMES.фигура,i,30+j)} ${this.pick(THR_NAMES.поле,i,40+j)}`,
    девиз:this.pick(THR_NAMES.девиз,i,50+j),обычай:this.pick(THR_NAMES.обычай,i,60+j),
    сила:Math.round(30+this.h(i,70+j)*55),верность:Math.round(35+this.h(i,80+j)*55),честолюбие:Math.round(this.h(i,90+j)*100)});}
  дома.forEach((x,k)=>{const j=Math.floor(this.h(i,95+k)*(дома.length+1))-1;x.вражда={с:(j===k||j<0)?-1:j,из:this.pick(THR_FEUD,i,97+k)};});
  const g=GOD_BY_ID[e.god]||null;
  const храм={n:`${this.pick(THR_NAMES.храм,i,3)}${g?` (${g.n})`:""}`,влияние:Math.round(25+this.h(i,4)*55),нрав:this.h(i,5)<0.25?"враждебен престолу":this.h(i,5)<0.6?"держится в стороне":"опора престола"};
  /* правитель и наследники — на первый день мира; дальше они стареют сами */
  const лет0=ex?ex.лет:Math.round(2+this.h(i,6)*28),жен=ex?THR_CORE_FEM.includes(i):this.h(i,101)<0.3;
  const age=Math.max(лет0+18,(ex?44:34)+Math.floor(this.h(i,100)*28));
  const п0=this.person(i,103,жен,1-age*THR_YEAR,1,0);п0.s=1-лет0*THR_YEAR;п0.и=ex?ex.правит:`${this.title(e,жен)} ${п0.n}`;
  const н0=[];
  if(ex)ex.наследники.forEach((t,k)=>{if(/^тот[ ,]/.test(t))return;const p=String(t).split(", "),имя=p[0],кто=p.length>2?p[1]:"",за=/^за /.test(p[p.length-1])?p[p.length-1]:"";
   const fem=/дочь|младшая|сестра|племянница/.test(кто)||(!кто&&/[ая]$/.test(имя.split(" ")[0]));
   const дальний=/брат|сестра|племянни|не родня|побратим|приёмн/.test(кто);
   const ha=Math.max(8,age-20-Math.floor(this.h(i,110+k)*14)+(дальний?10:0));
   н0.push({n:имя,ж:fem?1:0,b:1-ha*THR_YEAR,l:/приёмн|не родня|побратим/.test(кто)?0.7:1,г:0,t:Math.floor(this.h(i,141+k*3)*THR_TRAITS.length)%THR_TRAITS.length,р:кто||"родня",з:за});});
  const нужно=ex?Math.max(2,н0.length):2+Math.floor(this.h(i,104)*3);
  for(let k=н0.length;k<нужно;k++){const fem=this.h(i,150+k)<0.42,ha=Math.max(3,age-18-Math.floor(this.h(i,110+k)*22)+(k>1?6:0));
   const r=this.h(i,120+k),l=k===0?1:(r<0.15?0.5:r<0.25?0.7:1),г=this.h(i,130+k)<0.07?1:this.h(i,130+k)<0.11?2:0;
   const p=this.person(i,140+k*3,fem,1-ha*THR_YEAR,l,г);
   p.р=l===0.5?(fem?"побочная дочь":"побочный сын"):l===0.7?(fem?"приёмная дочь":"приёмный сын"):(k>=2&&this.h(i,160+k)<0.5?(fem?"племянница":"племянник"):(fem?"дочь":"сын"));
   if(н0.some(x=>x.n===p.n))p.n+=fem?" Младшая":" Младший";
   p.з=this.pick(THR_FACTION,i,170+k);н0.push(p);}
  return this._base[i]={род,закон:this.law(e),дома,храм,ex,п0,н0,
   стаб:Math.round(55+this.h(i,174)*25),казна:Math.round(40+this.h(i,171)*45),войско:Math.round(40+this.h(i,172)*45),люди:Math.round(55+this.h(i,173)*35),
   войско0:ex?ex.войско:{полки:3+Math.floor(this.h(i,7)*6),мораль:55+Math.round(this.h(i,8)*30),снабжение:55+Math.round(this.h(i,9)*35)},
   школы:ex?ex.школы:this.schools(i),ресурс:ex?ex.ресурс:((e.exports||[])[0]||"дерево"),
   звук:ex?ex.звук:(typeof EMPIRE_VOICE[i]==="string"?EMPIRE_VOICE[i]:"hall_center"),
   шпионы:ex?ex.шпионы.n:this.pick(THR_SPY,i,6),хочет:this.pick(THR_WANTS,i,7)};},
 /* ── ЛИЦА И ЖИВОЕ СОСТОЯНИЕ ── */
 R(i){return this.st().r[i]||null;},
 ruler(i){const R=this.R(i);return R?R.п:this.base(i).п0;},
 heirs(i){const R=this.R(i);return R?R.н:this.base(i).н0;},
 crisis(i){const R=this.R(i);return R?R.сп:null;},
 regent(i){const R=this.R(i);return R?R.рг:null;},
 dyn(i){const R=this.R(i);return (R&&R.дн)||this.base(i).род;},
 rname(i,p){return p.и||`${this.title(EMPIRES[i],p.ж)} ${p.n}`;},
 /* Престол пуст, пока идёт спор после смерти правителя. */
 vacant(i){const R=this.R(i);return !!(R&&R.п&&R.п.умер);},
 age(p,d){return Math.max(0,Math.floor(((d==null?this.day():d)-p.b)/THR_YEAR));},
 /* Двор, где что-то случилось, записывается в сохранение с этого дня. */
 touch(i){const s=this.st();let R=s.r[i];if(R)return R;const B=this.base(i);
  R=s.r[i]={п:Object.assign({},B.п0),н:B.н0.map(h=>Object.assign({},h)),рг:null,сп:null,дн:null,зг:null};return R;},
 /* Следы событий гаснут вполовину за шестьдесят дней; двор ради них не записывается. */
 mod(i,d,ключ){const L=this.st().md[i];if(!Array.isArray(L))return 0;let v=0;
  for(const m of L){if(m[0]!==ключ)continue;const age=d-m[2];if(age<0)continue;v+=m[1]*Math.pow(0.5,age/60);}return Math.round(v);},
 addMod(i,ключ,v,d){d=d==null?this.day():d;const s=this.st();
  const L=(s.md[i]||[]).filter(m=>Math.abs(m[1]*Math.pow(0.5,(d-m[2])/60))>=1);L.push([ключ,v,d]);if(L.length>8)L.shift();s.md[i]=L;},
 /* Погасшие следы стираются раз в месяц, чтобы сохранение не росло. */
 prune(d){const s=this.st();for(const k of Object.keys(s.md)){const L=(s.md[k]||[]).filter(m=>Math.abs(m[1]*Math.pow(0.5,(d-m[2])/60))>=1);if(L.length)s.md[k]=L;else delete s.md[k];}},
 /* ── ВЫВОДИМОЕ ── повседневная жизнь двора из дня и основы рода */
 wave(i,k,d,T){return Math.sin(d/T+i*0.73+k*1.91);},
 trait(i){return THR_TRAITS[this.ruler(i).t]||{};},
 war(i,d){return !!safeFn(()=>empireAtWar(i,d),false);},
 loyal(i,k,d){d=d==null?this.day():d;const h=this.base(i).дома[k];if(!h)return 0;
  return this.cl(h.верность+14*this.wave(i,k,d,41)+6*this.wave(i,k+3,d,13)+(this.trait(i).верность||0)*2+this.mod(i,d,"в"+k)-(this.crisis(i)?5:0),0,100);},
 power(i,k,d){d=d==null?this.day():d;const h=this.base(i).дома[k];if(!h)return 0;return this.cl(h.сила+8*this.wave(i,k+5,d,83)+this.mod(i,d,"с"+k),5,100);},
 stab(i,d){d=d==null?this.day():d;const B=this.base(i);
  return this.cl(B.стаб+(this.trait(i).стаб||0)+8*this.wave(i,0,d,53)+this.mod(i,d,"ст")-(this.crisis(i)?15:0)-(this.regent(i)?6:0)-(this.war(i,d)?5:0),0,100);},
 treasury(i,d){d=d==null?this.day():d;const B=this.base(i);
  return this.cl(B.казна+(this.trait(i).казна||0)*2+10*this.wave(i,1,d,67)+this.mod(i,d,"кз")-(this.war(i,d)?12:0)-(this.crisis(i)?10:0),0,100);},
 host(i,d){d=d==null?this.day():d;const B=this.base(i);
  return this.cl(B.войско+(this.trait(i).войско||0)*2+8*this.wave(i,2,d,71)+this.mod(i,d,"вс")-(this.war(i,d)?8:0)-(this.crisis(i)?8:0),5,100);},
 people(i,d){d=d==null?this.day():d;const B=this.base(i);
  return this.cl(B.люди+6*this.wave(i,3,d,97)+this.mod(i,d,"лд")-(this.war(i,d)?6:0)-(this.crisis(i)?5:0),10,100);},
 church(i,d){d=d==null?this.day():d;const B=this.base(i);
  return this.cl(B.храм.влияние+10*this.wave(i,4,d,59)+this.mod(i,d,"хр")+(this.trait(i).храм||0),0,100);},
 weakest(i,d){const B=this.base(i);let k0=0,v0=101;B.дома.forEach((x,k)=>{const v=this.loyal(i,k,d);if(v<v0){v0=v;k0=k;}});return k0;},
 strongestHouse(i,верный,d){const B=this.base(i);let best=0,bv=-1;B.дома.forEach((x,k)=>{const v=this.power(i,k,d)*(верный?this.loyal(i,k,d)/100:1);if(v>bv){bv=v;best=k;}});return best;},
 /* ── СОБЫТИЯ ── в вести престолов и в молву у престольного города */
 log(i,t,важно){const s=this.st(),d=this.day();s.ev.unshift({d,i,t});if(s.ev.length>30)s.ev.length=30;
  if(важно){const e=EMPIRES[i];safeFn(()=>rumorSeed("престол",`${e.short}: ${t}`,e.cap.x,e.cap.y,true));}},
 events(i,n){return this.st().ev.filter(x=>x.i===i).slice(0,n||6);},
 here(){return Math.max(0,safeFn(()=>empireIndexAt(G.x,G.y),0));},
 /* Звук события — только там, где стоит герой: смерть короля за морем не слышна. */
 snd(i,id){if(!G.dark&&!G.place&&this.here()===i)safeFn(()=>Bank.play(id,{gain:0.45,maxSec:5}));},
 diplo(i,j,delta,mult){safeFn(()=>{if(!G.diplo)G.diplo={};const k=diploKey(i,j);let v=Number(G.diplo[k])||0;if(mult!=null)v*=mult;G.diplo[k]=Math.max(-40,Math.min(40,Math.round(v+delta)));});},
 infl(i,n,v){const s=this.st(),k=i+":"+n;s.infl[k]=(s.infl[k]||0)+v;const ks=Object.keys(s.infl);if(ks.length>40)delete s.infl[ks[0]];},
 neighbour(i,d){const c=[];for(let j=0;j<EMPIRES.length;j++){if(j===i)continue;if(safeFn(()=>warNeighbours(i,j),false)&&safeFn(()=>relationAt(i,j,d),0)>-20)c.push(j);}
  return c.length?c[Math.floor(hashName(i,d,9979)*c.length)%c.length]:null;},
 /* ── ДЕНЬ ── сутки мира для всех дворов; пропущенные дни (до сорока пяти) догоняются */
 tick(){const s=this.st(),d=Number(G.day)||1;if(!s.day){s.day=d;return;}if(s.day>=d)return;
  const от=Math.max(s.day+1,d-45);
  try{for(let dd=от;dd<=d;dd++){this._d=dd;for(let i=0;i<EMPIRES.length;i++)safeFn(()=>this.step(i,dd));if(dd%30===0)this.prune(dd);}}finally{this._d=0;}
  s.day=d;},
 step(i,d){const B=this.base(i);if(!B)return;const R=this.R(i),r=R?R.п:B.п0,a=this.age(r,d),tr=THR_TRAITS[r.t]||{};
  /* смерть правителя: годы, нрав, смута — и яд заговорщиков в назначенный день */
  const яд=!!(R&&R.зг&&!R.зг.раскрыт&&d>=R.зг.день);
  const p=0.00008+Math.max(0,a-45)*0.00004+(tr.смерть||0)+(R&&R.сп?0.0002:0);
  if(!(R&&R.п.умер)&&(яд||hashName(i*977+3,d,9971)<p)){const Rt=this.touch(i),кто=яд?Rt.зг.дом:-1;
   const причина=яд?`от яда — заговор, ${B.дома[кто].n}`:THR_DEATH[Math.floor(hashName(i,d,9972)*THR_DEATH.length)%THR_DEATH.length];
   Rt.зг=null;this.succession(i,d,причина,кто);return;}
  if(R&&R.рг&&!R.п.умер&&a>=16){this.log(i,`${r.n} входит в года и правит сам; регент, ${R.рг.n}, уходит из совета`,true);R.рг=null;this.addMod(i,"ст",5,d);}
  if(R&&R.сп){this.crisisStep(i,d);return;}
  /* дома: обиженный честолюбивый дом готовит яд, обиженный сильный — мятеж */
  if(!(R&&R.зг))for(let k=0;k<B.дома.length;k++){const h=B.дома[k],v=this.loyal(i,k,d);
   if(v<25&&h.честолюбие>60&&hashName(i*37+k,d,9974)<0.004){const Rt=this.touch(i);Rt.зг={дом:k,день:d+20+Math.floor(hashName(i,d,9975)*40),раскрыт:false};this.log(i,`при дворе шепчутся: ${h.n} что-то замышляет`);break;}
   if(v<12&&this.power(i,k,d)>55&&hashName(i*41+k,d,9976)<0.003){this.revolt(i,d,k);return;}}
  /* храм против престола — раскол */
  if(B.храм.нрав==="враждебен престолу"&&this.church(i,d)>70&&hashName(i,d,9977)<0.002){this.addMod(i,"ст",-12,d);this.addMod(i,"хр",-15,d);
   this.log(i,`раскол: ${B.храм.n} отлучает двор, половина храмов служит без имени правителя`,true);}
  if(hashName(i*59+2,d,9969)<0.0003)this.sign(i,d);
  /* брак родов с соседом */
  if(hashName(i*53+1,d,9978)<0.0004){const j=this.neighbour(i,d);if(j!=null&&!this.married(i,j))this.marry(i,j,d,false);}},
 /* ── НАСЛЕДОВАНИЕ ── */
 succession(i,d,причина,отравитель){const R=this.touch(i),B=this.base(i),r=R.п;
  const text=`${r.ж?"умерла":"умер"} ${this.rname(i,r)} (${причина}).`;this.snd(i,"bell_big");r.умер=d;
  const infl=this.st().infl,live=R.н.filter(h=>this.age(h,d)>=0);
  const score=h=>h.l*(h.г?0.6:1)*(this.age(h,d)>=16?1:0.7)+(infl[i+":"+h.n]||0)/100+hashName(i,d+h.b,9980)*0.15;
  const cand=live.slice().sort((a,b)=>score(b)-score(a));
  /* мятеж не кончается со смертью правителя: мятежный дом спорит с наследником */
  const мятеж=R.сп&&R.сп.в==="мятеж"?R.сп.cl[1]:null;R.сп=null;
  if(мятеж&&cand.length){this.openCrisis(i,d,[cand[0],мятеж],"мятеж продолжается против наследника");
   this.log(i,text+` Мятежный ${B.дома[мятеж.м].n} не признаёт наследника: спорят ${cand[0].n} и ${мятеж.n}.`,true);return;}
  /* дом-отравитель тянется к престолу сам */
  if(отравитель>=0&&this.power(i,отравитель,d)>50&&cand.length){
   this.openCrisis(i,d,[cand[0],{n:`глава ${this.dg(B.дома[отравитель].n)}`,b:d-45*THR_YEAR,l:0.5,ж:0,г:3,м:отравитель}],`${B.дома[отравитель].n} тянется к престолу`);
   this.log(i,text+` ${B.дома[отравитель].n} не скрывает, чей это яд, и требует престола: спор.`,true);return;}
  if(!cand.length){this.newDynasty(i,d,this.strongestHouse(i,false,d),"род пресёкся",text+" Наследников не осталось.");return;}
  if(B.закон==="выборы"&&hashName(i,d,9981)<0.5){this.newDynasty(i,d,this.strongestHouse(i,false,d),"дома выбрали своего",text+" Дома собрались на выборы.");return;}
  if(B.закон==="знамение"&&this.church(i,d)<35&&cand.length>1){this.openCrisis(i,d,[cand[0],cand[1]],"храм слаб, знамение толкуют по-разному");
   this.log(i,text+` Храм не может назвать наследника: спорят ${cand[0].n} и ${cand[1].n}.`,true);return;}
  const законные=live.filter(h=>h.l>=1&&!h.г).sort((a,b)=>a.b-b.b);
  const heir=B.закон==="старшинство"&&законные.length?законные[0]:cand[0];
  const соперник=cand.find(h=>h!==heir);
  const спорно=!!соперник&&(score(соперник)>=score(heir)*0.85||heir.l<1||heir.г>0||B.закон==="сила");
  if(спорно&&hashName(i,d,9982)<0.55){
   this.openCrisis(i,d,[heir,соперник],heir.г===1?"наследник в изгнании":heir.г===2?"наследник в плену":heir.l<1?"наследник незаконный":"права почти равны");
   this.log(i,text+` Права оспорены: спорят ${heir.n} и ${соперник.n}.`,true);return;}
  this.crown(i,d,heir,text);},
 crown(i,d,heir,text){const R=this.touch(i);
  const p={n:heir.n,ж:heir.ж?1:0,b:heir.b,l:heir.l==null?1:heir.l,г:0,t:Number.isFinite(heir.t)?heir.t:Math.floor(hashName(i,d,9963)*THR_TRAITS.length)%THR_TRAITS.length,s:d};
  R.п=p;R.н=R.н.filter(h=>h.n!==heir.n);R.сп=null;R.рг=null;
  const a=this.age(p,d);
  /* у нового правителя свои наследники: дети, а у молодого — братья и сёстры */
  while(R.н.length<2){const k=R.н.length,дети=a>=34,fem=hashName(i,d+k,9984)<0.45;
   const ha=дети?Math.max(1,a-20-Math.floor(hashName(i,d+k,9983)*12)):Math.max(1,a-2-Math.floor(hashName(i,d+k,9983)*8));
   const q=this.person(i,200+(d%97)+k*5,fem,d-ha*THR_YEAR,1,0);q.р=дети?(fem?"дочь":"сын"):(fem?"сестра":"брат");q.з=THR_FACTION[(d+k)%THR_FACTION.length];
   if(R.н.some(x=>x.n===q.n)||q.n===p.n)q.n+=fem?" Младшая":" Младший";R.н.push(q);}
  if(a<16){const k=this.strongestHouse(i,true,d);R.рг={n:`глава ${this.dg(this.base(i).дома[k].n)}`,дом:k,с:d};}
  this.addMod(i,"ст",-6,d);this.snd(i,"ad_temple");
  this.log(i,`${text?text+" ":""}Престол принимает ${this.rname(i,p)}${a<16?` — ${a} ${plural(a,"год","года","лет")}, правит регент: ${R.рг.n}`:""}.`,true);},
 newDynasty(i,d,k,как,text){const R=this.touch(i),B=this.base(i),h=B.дома[k],выборы=B.закон==="выборы";
  R.дн=h.n;R.н=[];R.рг=null;R.сп=null;R.зг=null;
  const p=this.person(i,300+(d%89),hashName(i,d,9985)<0.3,d-(35+Math.floor(hashName(i,d,9986)*20))*THR_YEAR,1,0);
  this.crown(i,d,p,`${text?text+" ":""}${выборы?`Избран глава дома — ${h.n}`:`Новая династия — ${h.n}`} (${как}).`);
  this.addMod(i,"ст",выборы?-3:-10,d);this.addMod(i,"в"+k,40,d);},
 openCrisis(i,d,cl,почему){const R=this.touch(i),B=this.base(i);
  const C={в:"спор",поч:почему,нач:d,cl:cl.map((h,k)=>({n:h.n,b:h.b,l:h.l==null?1:h.l,ж:h.ж?1:0,г:h.г||0,t:h.t,д:k===0?55:45,дм:[],м:h.м})),вм:null};
  /* дома разбирают стороны; мятежный дом — за своего главу */
  B.дома.forEach((x,k)=>{const свой=C.cl.find(c=>c.м===k);if(свой){свой.дм.push(k);return;}const c=hashName(i*17+k,d,9987)<0.5?0:1;C.cl[c].дм.push(k);C.cl[c].д+=this.power(i,k,d)/20;});
  const t=C.cl[0].д+C.cl[1].д;C.cl[0].д=Math.round(C.cl[0].д*100/t);C.cl[1].д=100-C.cl[0].д;
  R.сп=C;this.snd(i,"throng_march");
  /* сосед может встать за одного из претендентов — и поссориться с державой */
  const j=this.neighbour(i,d);if(j!=null&&hashName(i,d,9988)<0.45){const c=hashName(j,d,9989)<0.5?0:1;C.вм={j,за:c};this.diplo(i,j,-30);
   this.log(i,`держава «${EMPIRES[j].short}» поддержала одного из претендентов — ${C.cl[c].n}: на границе войска`,true);}},
 crisisStep(i,d){const R=this.R(i),C=R&&R.сп;if(!C)return;const s=this.st(),B=this.base(i),[A,Q]=C.cl;
  /* измена: дом переходит на другую сторону */
  if(hashName(i*61+5,d,9968)<0.006){const side=hashName(i,d,9967)<0.5?0:1,от=C.cl[side],к=C.cl[1-side],k=от.дм.find(x=>x!==от.м);
   if(k!=null){от.дм=от.дм.filter(x=>x!==k);к.дм.push(k);const w=Math.round(this.power(i,k,d)/20);от.д=Math.max(1,от.д-w);к.д=Math.min(99,к.д+w);
    this.log(i,`измена: ${B.дома[k].n} уходит к другому претенденту — ${к.n}`,true);}}
  const шаг=(hashName(i,d,9990)-0.5)*4+((s.infl[i+":"+A.n]||0)-(s.infl[i+":"+Q.n]||0))*0.02+(C.вм?(C.вм.за===0?0.6:-0.6):0);
  A.д=Math.max(1,Math.min(99,A.д+шаг));Q.д=100-A.д;
  const дни=d-C.нач;if(A.д<80&&Q.д<80&&дни<90)return;
  const w=A.д>=Q.д?A:Q,l=w===A?Q:A,исход=hashName(i,d,9991)<0.5;R.сп=null;
  if(C.вм)this.diplo(i,C.вм.j,0,0.5);
  if(C.в==="мятеж"){
   if(w.м!=null)this.newDynasty(i,d,w.м,"мятеж победил",`Мятеж победил: ${l.n} ${исход?"бежит за море":"в заточении"}.`);
   else{this.addMod(i,"в"+l.м,-15,d);this.addMod(i,"с"+l.м,-25,d);this.log(i,`мятеж подавлен: ${B.дома[l.м].n} разбит, его глава ${исход?"казнён":"в изгнании"}`,true);}
   return;}
  if(w.м!=null){this.newDynasty(i,d,w.м,"взял престол в споре",`Спор о престоле решён силой: ${l.n} ${l.ж?"проиграла":"проиграл"}.`);return;}
  if(дни>=90&&Math.abs(A.д-Q.д)<10)this.crown(i,d,w,`Спор о престоле кончился миром: ${l.n} получает удел и место в совете.`);
  else this.crown(i,d,w,`Спор о престоле решён: ${w.n} ${w.ж?"победила":"победил"}, ${l.n} ${исход?"бежит за море":"в заточении"}.`);},
 revolt(i,d,k){const R=this.touch(i),B=this.base(i),h=B.дома[k],r=R.п;
  const C={в:"мятеж",поч:`${h.n} поднял мятеж`,нач:d,cl:[{n:this.rname(i,r),b:r.b,l:1,ж:r.ж,г:0,д:60,дм:[]},{n:`глава ${this.dg(h.n)}`,b:d-45*THR_YEAR,l:0.5,ж:0,г:3,д:40,дм:[k],м:k}],вм:null};
  B.дома.forEach((x,kk)=>{if(kk!==k)C.cl[this.loyal(i,kk,d)>=40?0:1].дм.push(kk);});
  R.сп=C;this.snd(i,"throng_march");this.log(i,`мятеж: ${h.n} (${h.герб}, «${h.девиз}») поднял знамя против престола`,true);},
 married(i,j){return this.st().бр.some(m=>(m[0]===i&&m[1]===j)||(m[0]===j&&m[1]===i));},
 kin(i){return this.st().бр.filter(m=>m[0]===i||m[1]===i).map(m=>m[0]===i?m[1]:m[0]);},
 /* Брак родов: жених и невеста — из наследников двух держав, разного пола. */
 pair(i,j){const A=this.heirs(i),Bh=this.heirs(j);for(const a of A){const b=Bh.find(x=>x.ж!==a.ж);if(b)return [a,b];}return null;},
 marry(i,j,d,герой){if(i===j||this.married(i,j))return false;const пара=this.pair(i,j);if(!пара)return false;const s=this.st();
  s.бр.push([i,j,d]);if(s.бр.length>40)s.бр.shift();
  this.diplo(i,j,25);const [a,b]=пара,rel=safeFn(()=>relationWord(relationAt(i,j,d)),"");
  this.log(i,`династический брак: ${a.n} и ${b.n} из державы «${EMPIRES[j].short}»${герой?" — сосватал герой":""}; ${rel==="союз"?"державы теперь в союзе":"отношения держав потеплели"}`,true);
  this.log(j,`династический брак с державой «${EMPIRES[i].short}»: ${b.n} и ${a.n}`);return true;},
 sign(i,d){const z=THR_SIGN[Math.floor(hashName(i,d,9966)*THR_SIGN.length)%THR_SIGN.length];
  if(z.к==="трон"){this.addMod(i,"ст",-6,d);this.log(i,`знамение: ${z.t}`);return;}
  const hs=this.heirs(i);if(!hs.length)return;const h=hs[Math.floor(hashName(i,d,9965)*hs.length)%hs.length];this.infl(i,h.n,15);
  this.log(i,`знамение: ${z.t.replace("{h}",h.n)}`);},
 /* ── ГЕРОЙ И ПРЕСТОЛЫ ── */
 atCapital(i){const c=EMPIRES[i].cap;return Math.abs(G.x-c.x)<=40&&Math.abs(G.y-c.y)<=40;},
 pay(n,что){if((Number(G.gold)||0)<n){narrate(`${что} стоит ${n} золота, а у вас ${Number(G.gold)||0}.`);return false;}G.gold-=n;return true;},
 support(i,k){const C=this.crisis(i);if(!C){narrate("Спора о престоле здесь нет.");return false;}
  const c=C.cl[Number(k)];if(!c)return false;if(!this.pay(150,"Поддержка претендента — гонцы, подкупы и наёмники —"))return false;
  this.infl(i,c.n,25);c.д=Math.min(99,c.д+8);C.cl[1-Number(k)].д=100-c.д;safeFn(()=>addStand("fact",EMPIRES[i].short,3));
  this.log(i,`герой встал на сторону претендента — ${c.n}`);narrate(`Вы на стороне претендента — ${c.n}: золото ушло на гонцов и наёмников. Доля в споре — ${Math.round(c.д)} из ста.`);return true;},
 mediate(i){const C=this.crisis(i);if(!C){narrate("Мирить некого: спора нет.");return false;}
  if(!this.atCapital(i)){narrate("Посредничают в престольном городе: идите к престолу державы.");return false;}
  const d=Number(G.day)||1,шанс=0.35+(Number(G.cha)||10)/100+(Number(G.level)||1)/200;
  if(hashName(i,d*24+(Number(G.hour)||0),9992)<шанс){const [A,Q]=C.cl,w=A.д>=Q.д?A:Q,l=w===A?Q:A;
   if(w.м!=null)this.newDynasty(i,d,w.м,"примирение при посредничестве героя",`Герой примирил стороны: ${l.n} получает место в совете.`);
   else this.crown(i,d,w,`Герой примирил стороны: ${l.n} получает удел и место в совете.`);
   this.addMod(i,"ст",8,d);safeFn(()=>nudgeDiplo(i,4));safeFn(()=>addStand("fact",EMPIRES[i].short,6));
   narrate(`Посредничество удалось: ${w.n} у власти, ${l.n} получает место в совете. Держава вам благодарна.`);return true;}
  narrate("Стороны не услышали друг друга. Попробуйте позже — или поддержите одного из претендентов.");return false;},
 expose(i){const R=this.R(i),B=this.base(i);
  if(!this.atCapital(i)){narrate("Заговоры ищут при дворе: идите к престолу державы.");return false;}
  if(!R||!R.зг||R.зг.раскрыт){narrate("Заговора при этом дворе вы не нашли: слуги молчат, письма чисты.");return false;}
  R.зг.раскрыт=true;const k=R.зг.дом,d=Number(G.day)||1;this.addMod(i,"в"+k,-20,d);this.addMod(i,"ст",6,d);
  safeFn(()=>nudgeDiplo(i,3));safeFn(()=>addStand("fact",EMPIRES[i].short,5));
  this.log(i,`герой раскрыл заговор: ${B.дома[k].n} готовил яд для правителя`,true);narrate(`Заговор раскрыт: ${B.дома[k].n} готовил яд. Правитель жив и помнит услугу.`);return true;},
 matchmake(i,j){j=Number(j);if(j===i||!EMPIRES[j]){narrate("Сватать не с кем.");return false;}
  if(this.married(i,j)){narrate("Эти роды уже породнились.");return false;}
  if(relationAt(i,j,Number(G.day)||1)<-40){narrate("Между этими державами слишком много крови: сватов не примут.");return false;}
  if(!this.pair(i,j)){narrate("Жениха и невесту не подобрать: у обоих дворов наследники одного пола.");return false;}
  if(!this.pay(250,"Сватовство — дары обоим дворам —"))return false;
  const ok=this.marry(i,j,Number(G.day)||1,true);if(ok){safeFn(()=>addStand("fact",EMPIRES[i].short,4));narrate(`Сваты приняты: роды держав «${EMPIRES[i].short}» и «${EMPIRES[j].short}» породнились.`);}return ok;},
 incite(i,k){k=Number(k);const B=this.base(i),x=B.дома[k];if(!x)return false;if(this.crisis(i)){narrate("Держава и так в смуте.");return false;}
  if(!this.pay(200,"Подстрекательство — подарки и обещания —"))return false;
  const d=Number(G.day)||1;this.addMod(i,"в"+k,-25,d);safeFn(()=>nudgeDiplo(i,-4));safeFn(()=>addStand("fact",EMPIRES[i].short,-5));
  const v=this.loyal(i,k,d);
  if(v<15&&this.power(i,k,d)>40){this.revolt(i,d,k);narrate(`${x.n} поднял мятеж. Держава в смуте — и догадывается, чьё это золото.`);}
  else narrate(`${x.n} обижен на престол: верность ${v} из ста. Ещё немного — и он восстанет.`);return true;},
 /* ── ВОЛЬНЫЙ УДЕЛ ── своё владение героя на свободной земле материков: на
    земле одной из держав, но под своим именем; растёт, платит подать, терпит
    набеги и живёт в ладу или в ссоре с державой, на чьей земле стоит. */
 own(){return this.st().own||null;},
 canFound(x,y){if(!inNewLands(x,y)||!safeFn(()=>Mater.contAt(x,y),null))return "Удел основывают на свободной земле за Внешним морем — на одном из материков.";
  if(G.place||G.ship||G.dark)return "Удел ставят под открытым небом, на твёрдой земле.";
  const b=safeFn(()=>biomeAt(x,y),null)||{};if(["sea","coast","lake","river"].includes(b.база)||["lake","river","stream","waterfall"].includes(b.id))return "Нужна твёрдая земля, а не вода.";
  for(const e of EMPIRES)if(Math.hypot(e.cap.x-x,e.cap.y-y)<150000)return `Слишком близко к престолу «${e.short}»: свободная земля — дальше ста пятидесяти тысяч шагов от чужих столиц.`;
  if((Number(G.level)||1)<8)return "Удел держат только опытные: нужен восьмой уровень.";
  if((Number(G.gold)||0)<1500)return "На первые избы, частокол и семена нужно полторы тысячи золота.";
  return null;},
 found(){const s=this.st();if(s.own){narrate(`У вас уже есть удел: ${s.own.n}.`);return false;}
  const why=this.canFound(G.x,G.y);if(why){narrate(why);return false;}
  G.gold-=1500;const d=Number(G.day)||1,хоз=Math.max(0,EMPIRES.indexOf(empireAt(G.x,G.y)));
  const имя=G.name?`Вольный удел «${G.name}»`:"Вольный удел Странника";
  s.own={n:имя,x:G.x,y:G.y,r:12000,нач:d,день:d,люди:30,казна:10,войско:5,стаб:70,хоз,отн:0,подать:0};
  safeFn(()=>Bank.play("ad_hoe",{gain:0.6}));safeFn(()=>journal(`Основан ${имя} на земле державы «${EMPIRES[хоз].short}».`));
  this.log(хоз,`на её земле основан ${имя}`,true);
  narrate(`Вы основали ${имя} на земле державы «${EMPIRES[хоз].short}». Удел растёт каждый день: переселенцы, поля, первые дружинники. Держава присмотрится к соседу.`);
  safeFn(()=>refresh());safeFn(()=>saveGame(true));return true;},
 ownTick(){const o=this.own();if(!o)return;const d=Number(G.day)||1;if(o.день>=d)return;const n=Math.min(30,d-(Number(o.день)||d));o.день=d;const ev=this.st().ev;
  for(let k=n-1;k>=0;k--){const dd=d-k;
   o.люди=Math.min(100,o.люди+0.4*(o.стаб/70));o.казна=Math.min(100,o.казна+0.3+o.люди/400);o.войско=Math.min(100,o.войско+0.1);o.r=Math.min(80000,Math.round(o.r+150));
   /* отношение державы-хозяйки: тянется к нулю, крепнет при её устойчивости и слабеет в её смуту */
   o.отн=Math.max(-100,Math.min(100,o.отн*0.99+(this.stab(o.хоз,dd)>60?0.1:-0.1)));
   /* набег — тем вероятнее, чем меньше дружина; с державой в ссоре — ещё и её люди */
   if(hashName(o.x,dd,9993)<0.012*(1-o.войско/120)+(o.отн<-30?0.01:0)){const урон=Math.max(1,Math.round(8-o.войско/15));o.стаб=Math.max(20,o.стаб-урон);o.казна=Math.max(0,o.казна-урон);o.люди=Math.max(10,o.люди-1);
    ev.unshift({d:dd,i:o.хоз,t:`набег на ${o.n}: ${o.войско>40?"дружина отбилась, но амбар сгорел":"сгорел хлебный амбар, угнан скот"}`});}
   if(o.отн<-40&&hashName(o.x+1,dd,9994)<0.02){o.казна=Math.max(0,o.казна-10);ev.unshift({d:dd,i:o.хоз,t:`сборщики державы «${EMPIRES[o.хоз].short}» взяли с удела дань силой`});}}
  if(ev.length>30)ev.length=30;},
 inOwn(x,y){const o=this.own();return !!o&&Math.hypot(x-o.x,y-o.y)<o.r;},
 ownAct(what){const o=this.own();if(!o){narrate("Удела у вас нет.");return false;}const d=Number(G.day)||1;
  if(what==="tax"){const ждать=10-(d-(o.подать||0));if(ждать>0){narrate(`Подать собирают раз в десять дней: следующая — через ${ждать} ${plural(ждать,"день","дня","дней")}.`);return false;}
   const v=Math.round(o.люди*(10+o.казна)/12);G.gold=(Number(G.gold)||0)+v;o.подать=d;o.стаб=Math.max(20,o.стаб-3);o.казна=Math.max(0,o.казна-5);
   narrate(`Подать собрана: ${v} золота. Люди ворчат, но платят.`);return true;}
  if(what==="hire"){if(!this.pay(100,"Наём дружинников"))return false;o.войско=Math.min(100,o.войско+8);narrate(`Наняли дружинников: дружина удела — ${Math.round(o.войско)} из ста. Набеги станут реже.`);return true;}
  if(what==="feast"){if(!this.pay(80,"Праздник для поселенцев"))return false;o.стаб=Math.min(100,o.стаб+10);narrate(`Праздник удался: устойчивость удела — ${Math.round(o.стаб)} из ста.`);return true;}
  if(what==="gift"){if(!this.pay(150,"Дары державе-хозяйке"))return false;o.отн=Math.min(100,o.отн+15);safeFn(()=>addStand("fact",EMPIRES[o.хоз].short,2));
   narrate(`Дары приняты при дворе «${EMPIRES[o.хоз].short}»: отношение к уделу — ${Math.round(o.отн)}.`);return true;}
  narrate("Так уделом не правят.");return false;},
 ownText(){const o=this.own();if(!o)return "";const d=Number(G.day)||1;
  return `${o.n} на земле державы «${EMPIRES[o.хоз].short}», основан в день ${o.нач}: люди ${Math.round(o.люди)}, казна ${Math.round(o.казна)}, дружина ${Math.round(o.войско)}, устойчивость ${Math.round(o.стаб)} из ста; земли на ${Mater.dist(o.r)} вокруг частокола; отношение державы-хозяйки — ${Math.round(o.отн)}. Подать ${d-(o.подать||0)>=10?"можно собрать":"собрана недавно"}.`;},
 /* ── СВЕДЕНИЯ ДЛЯ ДОСЬЕ ── живая запись державы в том же виде, что у двенадцати держав Средоточия */
 heirLine(i,h,d){const a=this.age(h,d);return `${h.n}, ${a} ${plural(a,"год","года","лет")}, ${h.р||(h.ж?"дочь":"сын")}${h.г===1?", в изгнании":h.г===2?", в плену":""}${h.з?`, ${h.з}`:""}`;},
 spyWhere(i){const out=[];for(let j=0;j<EMPIRES.length&&out.length<2;j++)if(j!==i&&safeFn(()=>warNeighbours(i,j),false))out.push(EMPIRES[j].short);return out.length?out.join(" и "):"у соседей";},
 feud(i){const B=this.base(i),h=B.дома[0];if(!h)return "дома живут мирно";const с=h.вражда.с;return `${h.n} против ${с<0?"престола":"дома "+B.дома[с].n.replace(/^Дом /,"")}: ${h.вражда.из}`;},
 extra(i){const B=this.base(i);if(!B)return null;const d=this.day(),r=this.ruler(i),ex=B.ex,R=this.R(i);
  const наследники=ex&&!R?ex.наследники:this.heirs(i).slice(0,3).map(h=>this.heirLine(i,h,d));
  const пуст=this.vacant(i);
  return {династия:this.dyn(i),правит:пуст?"совет домов, пока идёт спор о престоле,":this.rname(i,r),лет:Math.max(1,Math.floor((d-(пуст?r.умер:r.s))/THR_YEAR)),
   наследники:наследники.length?наследники:["наследника нет: дома ждут"],
   оппозиция:ex?ex.оппозиция:{n:B.дома[this.weakest(i,d)].n,хочет:B.хочет},
   шпионы:{n:B.шпионы,где:ex?ex.шпионы.где:this.spyWhere(i)},
   конфликт:ex?ex.конфликт:this.feud(i),школы:B.школы,
   войско:{полки:Math.max(1,B.войско0.полки+Math.round((this.host(i,d)-B.войско)/15)),мораль:this.cl(B.войско0.мораль+(this.stab(i,d)-B.стаб)/4,10,100),снабжение:this.cl(B.войско0.снабжение+(this.treasury(i,d)-B.казна)/4,10,100)},
   ресурс:B.ресурс,звук:B.звук};},
 crisisText(i){const C=this.crisis(i);if(!C)return "";
  return `${C.в==="мятеж"?"Мятеж":"Спор о престоле"} в державе «${EMPIRES[i].short}»: ${C.поч}; ${C.cl.map(c=>`${c.n} — ${Math.round(c.д)} из ста`).join(", ")}${C.вм?`; держава «${EMPIRES[C.вм.j].short}» поддерживает претендента — ${C.cl[C.вм.за].n}`:""}.`;},
 moreText(i){const B=this.base(i);if(!B)return "";const d=this.day(),r=this.ruler(i),tr=THR_TRAITS[r.t],a=this.age(r,d);
  let t=` Закон наследования — ${THR_LAWS[B.закон].n}.`+(this.vacant(i)?" Престол пуст.":` Правителю ${a} ${plural(a,"год","года","лет")}${tr?`, нрав — ${tr.n}: ${tr.о}; вовне ${tr.вовне}`:""}.`);
  if(this.regent(i))t+=` Правит регент: ${this.regent(i).n}.`;
  if(this.crisis(i))t+=" "+this.crisisText(i);
  t+=` Знатные дома: ${B.дома.map((h,k)=>`${h.n} (верность ${this.loyal(i,k,d)})`).join(", ")}. Храм — ${B.храм.n}, ${B.храм.нрав}. Устойчивость ${this.stab(i,d)} из ста.`;
  return t;},
 ruleText(i){const B=this.base(i),e=EMPIRES[i],r=this.ruler(i),d=this.day(),tr=THR_TRAITS[r.t],a=this.age(r,d),лет=Math.max(0,Math.floor((d-r.s)/THR_YEAR));
  let t=this.vacant(i)?`${e.name}. Престол пуст: ${this.rname(i,r)} ${r.ж?"умерла":"умер"} в день ${r.умер}, род — ${this.dyn(i)}.`
   :`${e.name}. Правит ${this.rname(i,r)} (${this.dyn(i)}), ${a} ${plural(a,"год","года","лет")}, на престоле ${лет} ${plural(лет,"год","года","лет")}${tr?`; нрав — ${tr.n}: ${tr.о}; вовне ${tr.вовне}`:""}.`;
  if(this.regent(i))t+=` Правит регент: ${this.regent(i).n}.`;
  t+=` Закон наследования — ${THR_LAWS[B.закон].n}: ${THR_LAWS[B.закон].о}.`;
  t+=` Наследники: ${this.heirs(i).map(h=>this.heirLine(i,h,d)).join("; ")||"нет"}.`;
  if(this.crisis(i))t+=" "+this.crisisText(i);
  const бр=this.kin(i).filter(j=>EMPIRES[j]).map(j=>EMPIRES[j].short);if(бр.length)t+=` В родстве с державами: ${бр.join(", ")}.`;
  t+=` Устойчивость ${this.stab(i,d)}, казна ${this.treasury(i,d)}, войско ${this.host(i,d)}, люди ${this.people(i,d)} из ста. Храм — ${B.храм.n}, влияние ${this.church(i,d)}, ${B.храм.нрав}.`;
  return t;},
 housesText(i){const B=this.base(i),d=this.day(),дн=this.dyn(i);
  return B.дома.map((h,k)=>`${h.n}${h.n===дн?" (правящий)":""}: ${h.герб}, девиз «${h.девиз}»; обычай — ${h.обычай}; вражда ${h.вражда.с<0?"с престолом":"с домом "+B.дома[h.вражда.с].n.replace(/^Дом /,"")}: ${h.вражда.из}; сила ${this.power(i,k,d)}, верность ${this.loyal(i,k,d)}`).join(". ")+".";},
 /* ── ОКНО ── двор державы, где стоит герой, или любой другой; вести престолов; удел */
 groups:[["core","Средоточие",e=>!e.дальний],["dk","Дальний Круг",e=>e.дальний&&!e.заморье&&!e.сплетение&&!e.перекрой&&!e.материк],["zam","Заморье",e=>!!e.заморье],
  ["spl","Сплетение",e=>!!e.сплетение],["prk","Перекрой",e=>!!e.перекрой],["mat","Великие Материки",e=>!!e.материк]],
 modal(){let m=document.getElementById("modal-thrones");
  if(!m){m=document.createElement("div");m.id="modal-thrones";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Престолы и наследники");
   m.innerHTML=`<div class="modal-box"><h2>Престолы и наследники</h2><div id="thrBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  return m;},
 home(i,вид){if(G.dark){narrate("За Гранью нет престолов светлого мира.");return false;}
  i=i==null?this.here():Number(i);if(!EMPIRES[i])i=0;this._i=i;const m=this.modal(),box=m.querySelector("#thrBody"),B=this.base(i);
  let h="";
  if(вид&&вид.grp){const g=this.groups.find(x=>x[0]===вид.grp);
   h+=`<h3>${this.q(g?g[1]:"Дворы")}</h3>`+EMPIRES.map((e,j)=>g&&g[2](e)?this.btn(`see:${j}`,`${e.short} — ${this.dyn(j)}${this.crisis(j)?", смута":""}`):"").join("");
   h+=this.btn("back","Назад, к двору, где вы стоите");}
  else{
   h+=`<p tabindex="0">${this.q(this.ruleText(i))}</p><h3>Знатные дома</h3><p tabindex="0">${this.q(this.housesText(i))}</p>`;
   const C=this.crisis(i);if(C){C.cl.forEach((c,k)=>{h+=this.btn(`sup:${i}:${k}`,`Поддержать: ${c.n} (150 золота)`);});h+=this.btn(`med:${i}`,"Посредничать (в престольном городе)");}
   h+=this.btn(`exp:${i}`,"Искать заговор при дворе (в престольном городе)");
   B.дома.forEach((x,k)=>{h+=this.btn(`inc:${i}:${k}`,`Подстрекать к мятежу: ${x.n} (200 золота)`);});
   const соседи=[];for(let j=0;j<EMPIRES.length&&соседи.length<4;j++)if(j!==i&&safeFn(()=>warNeighbours(i,j),false)&&!this.married(i,j))соседи.push(j);
   соседи.forEach(j=>{h+=this.btn(`mat:${i}:${j}`,`Сосватать с родом державы «${EMPIRES[j].short}» (250 золота)`);});
   const ev=this.events(i,6);if(ev.length)h+=`<h3>Летопись двора</h3>`+ev.map(x=>`<p tabindex="0">${this.q(`День ${x.d}: ${x.t}`)}</p>`).join("");
   h+=`<h3>Другие дворы</h3>`+this.groups.map(g=>this.btn(`grp:${g[0]}`,`${g[1]}: ${EMPIRES.filter(g[2]).length}`)).join("");}
  const o=this.own();h+=`<h3>Вольный удел</h3>`+(o?`<p tabindex="0">${this.q(this.ownText())}</p>`+this.btn("own:tax","Собрать подать")+this.btn("own:hire","Нанять дружинников (100 золота)")+this.btn("own:feast","Устроить праздник (80 золота)")+this.btn("own:gift","Отправить дары державе-хозяйке (150 золота)")
   :`<p tabindex="0">${this.q("Удел основывают на свободной земле материков, дальше ста пятидесяти тысяч шагов от чужих столиц; нужен восьмой уровень и полторы тысячи золота.")}</p>`+this.btn("found","Основать вольный удел здесь (1500 золота)"));
  const все=this.st().ev.slice(0,8);if(все.length)h+=`<h3>Вести престолов</h3>`+все.map(x=>`<p tabindex="0">${this.q(`День ${x.d}, ${EMPIRES[x.i]?EMPIRES[x.i].short:""}: ${x.t}`)}</p>`).join("");
  box.innerHTML=h;if(m.hidden)openModal("modal-thrones");return true;},
 cmd(a){const p=String(a||"").split(":"),k=p[0],i=Number(p[1]),x=p[2];let ok=false,вид=null;
  if(k==="sup")ok=this.support(i,x);else if(k==="med")ok=this.mediate(i);else if(k==="exp")ok=this.expose(i);else if(k==="inc")ok=this.incite(i,x);
  else if(k==="mat")ok=this.matchmake(i,x);else if(k==="found")ok=this.found();else if(k==="own")ok=this.ownAct(p[1]);
  else if(k==="grp")вид={grp:p[1]};else if(k==="see")this._i=i;else if(k==="back")this._i=this.here();
  else{narrate("Такого дела при дворе нет: откройте «Престолы и наследники» в разделе «Державы».");return false;}
  if(ok)safeFn(()=>saveGame(true));
  const m=document.getElementById("modal-thrones");if(m&&!m.hidden)this.home(this._i,вид);return ok;}};
/* ── МОЛВА ── весть о престоле расходится от престольного города и обрастает в пересказе */
RUMOR_LADDER.престол=["вести от двора: {что}","{что} — и, говорят, не своей смертью","при дворе режут друг друга за трон","трон пуст, и дома делят страну","держава распадается, и война вот-вот докатится и сюда"];
/* ── ВСТРАИВАНИЕ ── */
{const wd6=Director.worldDay;Director.worldDay=matKeep(wd6,function(){const r=wd6.apply(this,arguments);safeFn(()=>Throne.tick());safeFn(()=>Throne.ownTick());return r;});}
/* Записи о династиях — живые для всех девяноста девяти держав (прежде дальние
   державы читали запись двенадцатой державы Средоточия). */
{const ex6=Empires.extra.bind(Empires);Empires.extra=matKeep(ex6,function(i){return safeFn(()=>Throne.extra(Math.max(0,Number(i)||0)),null)||ex6(i);});}
{const et6=Empires.text.bind(Empires);Empires.text=matKeep(et6,function(i){const t=et6(i);return t?t+safeFn(()=>Throne.moreText(Math.max(0,Number(i)||0)),""):t;});}
{const en6=Empires.news.bind(Empires);Empires.news=matKeep(en6,function(day){const a=en6(day)||[];const d=Number(day)||Number(G.day)||1;
 const ev=safeFn(()=>Throne.st().ev.filter(x=>d>=x.d&&d-x.d<=3).slice(0,2).map(x=>`Престолы, ${EMPIRES[x.i]?EMPIRES[x.i].short:""}: ${x.t}.`),[])||[];return ev.concat(a);});}
{const ea6=Empires.army.bind(Empires);Empires.army=matKeep(ea6,function(i,day){const a=ea6(i,day);
 safeFn(()=>{if(Throne.crisis(i)){a.мораль=Math.max(10,a.мораль-12);a.снабжение=Math.max(10,a.снабжение-10);}if(Throne.regent(i))a.мораль=Math.max(10,a.мораль-5);});return a;});}
/* Смута дорожит всё: в державе со спором о престоле цены выше, при мятеже — ещё выше. */
{const mp6=marketPrice;marketPrice=matKeep(mp6,function(res,idx,day){const v=mp6.apply(this,arguments);const C=safeFn(()=>Throne.crisis(Number(idx)),null);
 return C&&Number.isFinite(v)?Math.round(v*(C.в==="мятеж"?1.2:1.12)):v;});}
/* Смута держит обозы в городах: в державе со спором или мятежом половина торговых путей стоит. */
{const cr6=caravanRoutes;caravanRoutes=matKeep(cr6,function(cx,cy,day){const out=cr6.apply(this,arguments);
 if(!Object.keys(Throne.st().r).length)return out;
 return out.filter(rt=>{const i=safeFn(()=>empireIndexAt(rt.a.x,rt.a.y),-1);if(i<0||!Throne.crisis(i))return true;return H(rt.a.x+rt.b.y,rt.a.y+rt.b.x,404)<0.5;});});}
/* Осмотреться: в державе смута — слышно сразу; на земле своего удела — его состояние. */
{const lk6=look;look=matKeep(lk6,function(){const r=lk6.apply(this,arguments);
 safeFn(()=>{if(G.dark||G.place)return;const i=Throne.here();if(Throne.crisis(i))narrate(Throne.crisisText(i),{interrupt:false});
  if(Throne.inOwn(G.x,G.y))narrate(`Земля вашего удела. ${Throne.ownText()}`,{interrupt:false});});return r;});}
Object.assign(CMD,{thrones(){Throne.home();},th(a){if(!a)return Throne.home();Throne.cmd(a);}});
{const av6=amAvailable;amAvailable=matKeep(av6,function(cmd){if(cmd==="thrones")return !G.dark;return av6.apply(this,arguments);});}
safeFn(()=>AM_GROUPS.find(x=>x[0]==="Державы")[1].push(["thrones","Престолы и наследники"]));

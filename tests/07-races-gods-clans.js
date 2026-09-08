const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());
 await page.waitForTimeout(200);

 const d=await page.evaluate(()=>({
  races:RACES_DB.length,
  gods:PANTHEON.length,
  clans:CLAN_DB.length,
  byRank:RANKS.map((r,i)=>RACES_DB.filter(x=>x.rank===i).length),
  names:Object.keys(RACE_BY_NAME).length,
  branches:Object.keys(RACE_BRANCH).length,
  common:RACES.length,uniq:URACES.length,
  godsUsed:[...new Set(RACES_DB.map(r=>r.god))].length,
  missingGod:RACES_DB.filter(r=>!GOD_BY_ID[r.god]).map(r=>r.n),
  missingClan:RACES_DB.filter(r=>!CLAN_BY_NAME[r.clan]).map(r=>r.n),
  dupIds:RACES_DB.map(r=>r.id).filter((v,i,a)=>a.indexOf(v)!==i),
  dupNames:RACES_DB.map(r=>r.n).filter((v,i,a)=>a.indexOf(v)!==i),
  emptyField:RACES_DB.filter(r=>!r.hist||!r.econ||!r.pol||!r.war||!r.myth||!r.tr||!(r.res||[]).length||!(r.sell||[]).length).map(r=>r.n),
  monsterLore:MONSTERS.filter(m=>!MONSTER_LORE[m.id]).map(m=>m.id),
  empFields:EMPIRES.filter(e=>!e.gov||!e.econ||!e.god||!(e.exports||[]).length||!(e.imports||[]).length).map(e=>e.short)
 }));
 check('45 народов в каталоге',d.races===45,d.races);
 check('12 богов в пантеоне',d.gods===12,d.gods);
 check('12 кланов — по одному на бога',d.clans===12,d.clans);
 check('народы есть в каждом ранге от Обычного до Божественного',d.byRank.every(x=>x>0),d.byRank);
 check('все 12 богов имеют народы',d.godsUsed===12,d.godsUsed);
 check('у каждого народа существующий бог',d.missingGod.length===0,d.missingGod);
 check('у каждого народа существующий клан',d.missingClan.length===0,d.missingClan);
 check('нет повторяющихся id и имён народов',!d.dupIds.length&&!d.dupNames.length,[d.dupIds,d.dupNames]);
 check('у всех народов заполнены история, хозяйство, политика, войны, миф, ресурсы, торговля',d.emptyField.length===0,d.emptyField);
 check('у всех 18 чудовищ есть мифология',d.monsterLore.length===0,d.monsterLore);
 check('у всех держав есть строй, хозяйство, бог и торговля',d.empFields.length===0,d.empFields);

 // прежние имена рас не потеряны
 const old=["Люди","Эльфы","Гномы","Орки","Полурослики","Гоблины","Тролли","Кобольды","Зверолюды","Минотавры","Сатиры","Наги","Русалки","Кентавры","Гарпии","Лесовики","Сильфы","Ундины","Саламандры","Големы","Аракокры","Тифлинги","Аасимары","Джинны","Огры","Циклопы","Фавны","Дриады","Лепреконы","Феи","Вервольфы","Ящеролюды","Мотыльковые","Каменнорождённые","Дракониды","Фениксы","Лунные эльфы","Тенеходцы","Кристаллиды","Пустотники","Хроносцы","Светлорождённые","Пепельные великаны","Рунные карлы","Эфирные странники","Кровавые феи","Морозные вейры","Песчаные джинны","Древние энты","Штормовые вирмы","Звёздные ткачи","Глубинные левиафаны","Костяные шаманы","Стеклянные сильфиды"];
 const lost=await page.evaluate(o=>o.filter(n=>!RACE_BY_NAME[n]),old);
 check('ни одно прежнее имя расы не потеряно',lost.length===0,lost);
 const npcRaces=await page.evaluate(()=>{const set=new Set();for(let i=0;i<400;i++){const n=getNPC(1000+i,1000+(i%37),i%3);set.add(n.race);}return [...set].filter(r=>!RACE_BY_NAME[r]);});
 check('расы генерируемых НИПИ всегда находят своё досье',npcRaces.length===0,npcRaces);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();

/* ══════════════════════════════════════════════════════════════════
   255 — У КАЖДОГО ОБЪЕКТА СВОЙ ГОЛОС (9.5.2, просьба игрока)
   «Рабочий стол звучит тем же стуком дерева, что и сундук, верстак — тоже».
   Вещи обстановки стояли на одной клетке «X» с маяком сундука, книги — тоже;
   у лавки и торговца, логова и поста стражи, ворот и двери сокровищницы,
   двери и лаза, лестниц вверх и вниз был один звук на двоих. Проверяется:
   1. Каждая из вещей обстановки получает свой маяк prop_<вещь>, его роль
      есть в банке, и все её записи лежат на диске.
   2. Ни у каких двух разных объектов (клетки, вещи, жители) нет общей
      записи: на слух их не спутать. Исключение — одно и то же по сути
      (трон в зале и трон-постройка, путник и житель-путник).
   3. Подход к вещи (клетка под ногами, «что рядом», осмотр, карта) берёт
      маяк самой вещи: точило — точилом, стол — столом, сундук — сундуком.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 const д=await p.evaluate(()=>{
  const files=id=>{const r=BEACON_ROLE[id];if(r)return (SOUND_BANK[r]&&SOUND_BANK[r].f)||["?"+r];
   const s=BEACON_SAMPLE[id];return s?[s]:[];};
  const props=PROPS.map(x=>({id:x.id,b:x.b,роль:BEACON_ROLE[x.b],f:files(x.b),инфо:!!PROP_INFO[x.b]}));
  const ids=new Set();
  for(const t in TILE){const b=TILE[t].b;if(b&&b!=="wall")ids.add(b);}
  PROPS.forEach(x=>ids.add(x.b));
  Object.keys(BEACON_ROLE).filter(k=>/^npc_/.test(k)).forEach(k=>ids.add(k));
  const same=[["throne","prop_throne"],["traveler","npc_traveler"]];
  const по={};for(const id of ids)for(const f of files(id))(по[f]=по[f]||new Set()).add(id);
  const общие=Object.entries(по).filter(([f,s])=>s.size>1).map(([f,s])=>[f,[...s]])
   .filter(([f,s])=>!(s.length===2&&same.some(([a,b])=>s.includes(a)&&s.includes(b))));
  const все=[...new Set([].concat(...[...ids].map(files)))];
  /* подход к вещи */
  const был=window.propAt;const out={};
  for(const v of ["whetstone","table","bench","barrels","anvil","bookcase"]){window.propAt=()=>PROP_BY_ID[v];out[v]=cellBeacon("X",1,1);}
  window.propAt=был;
  out.chest=cellBeacon("C",1,1);out.books=cellBeacon("K",1,1);
  return {props,общие,все,подход:out,безФайла:[...ids].filter(id=>!files(id).length)};});

 const нетРоли=д.props.filter(x=>!x.b||x.b!=="prop_"+x.id||!x.роль||x.f.some(f=>f.startsWith("?"))||!x.инфо);
 const нетНаДиске=д.все.filter(f=>!f.startsWith("?")&&!fs.existsSync(path.join(R,'sounds',f)));
 check(`1. все ${д.props.length} вещей обстановки — свой маяк prop_*, роль в банке и подпись`,нетРоли.length===0&&д.props.length>=50,нетРоли.slice(0,5));
 check('1б. все записи маяков объектов лежат на диске',нетНаДиске.length===0&&д.безФайла.length===0,{нетНаДиске:нетНаДиске.slice(0,5),безФайла:д.безФайла});
 check('2. у разных объектов нет общей записи: не звучат одинаково',д.общие.length===0,д.общие.slice(0,6));
 const п=д.подход;
 check('3. подход: точило, стол, верстак, бочки, наковальня, шкаф и сундук звучат каждый своим',
  п.whetstone==="prop_whetstone"&&п.table==="prop_table"&&п.bench==="prop_bench"&&п.chest==="chest"&&п.books==="books"
  &&new Set(Object.values(п)).size===Object.keys(п).length,п);
 const src=fs.readFileSync(path.join(R,'index.html'),'utf8');
 check('4. «что рядом», осмотр, клетка под ногами и карта берут маяк вещи (cellBeacon)',
  /маяк:safeFn\(\(\)=>cellBeacon\(t,x,y\),null\)/.test(src)&&/bid:cellBeacon\(t,x,y\)/.test(src)
  &&/beacon\(cellBeacon\(cur,p\.x,p\.y\),0,0\)/.test(src)&&/const bid=cellBeacon\(t,x,y\);/.test(src));
 const титры=fs.readFileSync(path.join(R,'sounds/prop/CREDITS.md'),'utf8');
 const безТитра=fs.readdirSync(path.join(R,'sounds/prop')).filter(f=>f.endsWith('.flac')&&!титры.includes('`'+f+'`'));
 check('5. у каждой новой записи есть строка в титрах sounds/prop/CREDITS.md',безТитра.length===0,безТитра);
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

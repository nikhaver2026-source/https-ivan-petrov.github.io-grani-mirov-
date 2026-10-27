/* probe_mag.js — проверка магии канона в собранной игре: школы, формы, специализации, чары, гримуар, сотворение. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker|fetching the script/i.test(m.text()))errs.push('console: '+m.text());});
 await p.goto(process.argv[2]||'http://localhost:8903/index.html');await p.waitForTimeout(800);
 await p.evaluate(()=>enterGame());await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{const o={};
  o.школ=SCHOOLS.length;o.форм=SPELL_FORMS.length;o.спец=SPELL_SPECS.length;o.чарШкол=SCHOOL_SPELLS.length;
  o.поТри=SCHOOLS.every(sc=>SchoolSpells.ofSchool(sc.id).length===3);
  o.плохиеЧары=SCHOOL_SPELLS.filter(s=>{const sc=MSCHOOL_BY_ID[s.school],f=FORM_BY_ID[s.форма];
   return !(sc&&f&&f.сем.indexOf(sc.сем)>=0&&s.о&&s.cost>0&&s.ранг>=1&&s.ранг<=3&&SOUND_BANK[sc.звук]&&SOUND_BANK[sc.голос]&&SPELL_LAYERS.every(l=>SOUND_BANK[(SCHOOL_AUDIO[sc.id]||{})[l]]))}).map(s=>s.n);
  o.несовм=Object.values(КАНОН_ЧАРЫ).map(s=>[s.n,spellIncompat(s.school,s.форма,"none",s.ядро,s.стихия)]).filter(x=>x[1]);
  o.вСписке=Object.values(КАНОН_ЧАРЫ).filter(s=>!SPELLS.some(x=>x.n===s.n)).length;
  o.грим=grimCount();
  /* прежние номера гримуара те же: первые записи совпадают с перечнем без канона */
  o.грим0=grimAt(0)&&grimAt(0).n;o.грим1000=grimAt(1000)&&grimAt(1000).n;
  o.новыйГрим=grimFind("strings").length;
  o.факультет=SchoolSpells.факультет("bell")&&SchoolSpells.факультет("bell").n;
  o.звуки=["kn_str_pluck","kn_str_chord","kn_salt"].map(r=>!!(SOUND_BANK[r]&&Bank.has(r)));
  return o;});
 /* сотворить по одной чаре каждой новой формы в бою */
 r.творение=await p.evaluate(async()=>{const out={};G.level=20;G.mana=999;G.manaMax=999;
  const forms=["echoform","thread","ring","trail","knot","loop","whisper","vow"];
  for(const fm of forms){const sp=Object.values(КАНОН_ЧАРЫ).find(s=>s.форма===fm);if(!sp){out[fm]="нет чары";continue;}
   try{const m={id:"wolf",n:"Волк",lvl:3,hp:400,dmg:3,xp:1,gold:1};startCombat({x:G.x,y:G.y,monster:m},{});
    const t=castCustomEffect(sp);out[fm]=sp.n+": "+String(t).slice(0,160);
    await new Promise(r=>setTimeout(r,2200));if(G.inCombat)endCombat();}catch(e){out[fm]="ошибка "+e;}}
  return out;});
 console.log(JSON.stringify(r,null,1));console.log("ошибок страницы",errs.length,errs.slice(0,5));await b.close();})();

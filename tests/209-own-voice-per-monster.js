/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 209: У КАЖДОЙ ТВАРИ СВОЙ ГОЛОС

   Жалоба игрока (4.3): у некоторых монстров звуки одинаковые — стоят и
   рычат одним голосом.

   Причины: голос в покое и боевой клич брались по роду, а пятьдесят с
   лишним тёмных и глубинных тварей род не узнавали и все были «зверем».

   1. Тёмные твари неба, твари Грани и глубинные твари знают свой род:
      крыло — птица, стон — дух, пасть углей — бес; «зверей» не больше шести.
   2. У каждого вида свой голос — запись, её вариант и высота; двух видов с
      одним голосом нет; в каждом роду звучат разные записи его голосов.
   3. Крупные твари (рух, исполин, владыка) звучат не выше обычного, мелочь
      (мышь, сойка, рой) — не ниже.
   4. В покое вид звучит своим вариантом на своей высоте, и два вида одного
      рода рычат по-разному; боевой клич — другая запись того же горла.
   5. Вне боя (звуковая картина вокруг, за дверью) слышен тот же голос вида.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{
  window.AT=[];const sa=Spatial.at.bind(Spatial);Spatial.at=function(f,dx,dy,o){AT.push({f:String(f),rate:o&&o.rate});return sa(f,dx,dy,o);};
  window.maybeEvent=()=>{};settings.effects=1;settings.hrtf=1;G.inCombat=false;G.combat=null;AE.ensure();Spatial.ensure();});

 /* ── 1–3. раскладка ── */
 const р=await page.evaluate(()=>{
  const r={};
  const все=FoeVoices.lists();const ids=[...new Set(все.map(m=>m.id))];
  r.видов=ids.length;
  r.звери=все.filter(m=>foeFamily(m)==="beast").map(m=>m.id);
  r.род={df_bloodbat:foeFamily({id:"df_bloodbat"}),df_wailer:foeFamily({id:"df_wailer"}),df_emberlord:foeFamily({id:"df_emberlord"}),
   deep_root:foeFamily({id:"deep_root"}),deep_warden:foeFamily({id:"deep_warden"}),d_brood:foeFamily({id:"d_brood"})};
  const M=FoeVoices.build();
  const подпись=id=>{const v=M[id];return v?v.idle+"#"+v.v+"@"+v.rate:null;};
  r.безГолоса=ids.filter(id=>!M[id]||!SOUND_BANK[M[id].idle]);
  const счёт={};ids.forEach(id=>{const s=подпись(id);счёт[s]=(счёт[s]||[]).concat(id);});
  r.совпали=Object.entries(счёт).filter(([s,l])=>l.length>1);
  /* в каждом роду перебраны все записи его голосов (если видов хватает) */
  r.роды={};
  const по={};ids.forEach(id=>{const v=M[id];(по[v.family]=по[v.family]||[]).push(v.idle);});
  for(const f in по){const pool=FoeVoices.pool(f);const было=new Set(по[f]);
   r.роды[f]={видов:по[f].length,записей:было.size,в_роду:pool.length,
    /* голос, занятый видом чужого рода, этому роду уже не достаётся */
    ок:было.size>=Math.min(3,pool.length,по[f].length)};}
  r.крупные=все.filter(m=>FoeVoices.size(m)<0).map(m=>[m.id,M[m.id].rate]);
  r.мелкие=все.filter(m=>FoeVoices.size(m)>0).map(m=>[m.id,M[m.id].rate]);
  return r;});
 check('1. тёмные, глубинные твари и твари Грани знают свой род; «зверей» не больше шести',
  р.звери.length<=6&&р.род.df_bloodbat==="bird"&&р.род.df_wailer==="spirit"&&р.род.df_emberlord==="fiend"&&р.род.deep_root==="giant"
  &&р.род.deep_warden==="construct"&&р.род.d_brood==="crawler",{звери:р.звери,род:р.род});
 check('2. у каждого из видов свой голос (запись, вариант, высота), совпадений нет, в каждом роду звучат разные записи',
  р.видов>=90&&р.безГолоса.length===0&&р.совпали.length===0&&Object.values(р.роды).every(x=>x.ок),{видов:р.видов,без:р.безГолоса,совпали:р.совпали.slice(0,5),роды:р.роды});
 check('3. крупные твари — не выше обычного, мелкие — не ниже',
  р.крупные.length>=3&&р.крупные.every(x=>x[1]<=1)&&р.мелкие.length>=3&&р.мелкие.every(x=>x[1]>=1),{крупные:р.крупные,мелкие:р.мелкие});

 /* ── 4. в покое и в ярости ── */
 const бой=await page.evaluate(()=>{
  const r={};
  const find=id=>DARK_MONSTERS.find(m=>m.id===id)||MONSTERS.find(m=>m.id===id)||DEEP_MONSTERS.find(m=>m.id===id);
  const звук=(m,cue)=>{G.inCombat=true;G.combat={m,key:"",alt:0,hp:m.hp};AT.length=0;const ok=foeProfileCue(m,cue,{gain:0.5});const c=G.lastFoeCue||{};return {ok,role:c.role,own:!!c.own,f:AT[0]&&AT[0].f,rate:AT[0]&&AT[0].rate};};
  const тролль=find("troll"),огр=find("ogre"),энт=find("treant");
  r.тролль=звук(тролль,"idle");r.огр=звук(огр,"idle");r.энт=звук(энт,"idle");
  r.тролль2=звук(тролль,"idle");
  r.клич=звук(тролль,"warcry");
  const a=find("df_rotmoth"),b=find("df_wailer");r.мотыльница=звук(a,"idle");r.плакальщица=звук(b,"idle");
  /* одинаковой записи и высоты у разных видов нет */
  const пара=(x,y)=>x.f!==y.f||Math.abs((x.rate||1)-(y.rate||1))>0.04;
  r.разные=пара(r.тролль,r.огр)&&пара(r.огр,r.энт)&&пара(r.тролль,r.энт)&&пара(r.мотыльница,r.плакальщица);
  /* тот же вид — тот же голос */
  r.тотЖе=r.тролль.f===r.тролль2.f&&Math.abs(r.тролль.rate-r.тролль2.rate)<0.06;
  G.inCombat=false;G.combat=null;
  ["тролль","огр","энт","тролль2","клич","мотыльница","плакальщица"].forEach(k=>{r[k].ok=!!r[k].ok;});
  return r;});
 check('4. в покое вид звучит своей записью и высотой, соседи по роду рычат по-разному; клич — другая запись того же горла',
  бой.тролль.ok&&бой.тролль.own&&бой.разные&&бой.тотЖе&&бой.клич.ok&&бой.клич.role!==бой.тролль.role
  &&Math.abs(бой.клич.rate-бой.тролль.rate)<0.06,бой);

 /* ── 5. вне боя ── */
 const мир=await page.evaluate(()=>{
  const r={};
  const troll=MONSTERS.find(m=>m.id==="troll"),ogre=MONSTERS.find(m=>m.id==="ogre");
  const V=FoeVoices.of(troll);
  r.роль=bankFoeRole(troll);r.рольОгра=bankFoeRole(ogre);
  const o=foeVoiceOpts(troll,{gain:0.4});r.опции={fixed:o.fixed,seed:o.seed,rate:o.rate};
  r.совпадает=r.роль===V.idle&&o.fixed===true&&o.seed===V.v&&o.rate===V.rate;
  AT.length=0;Spatial.role(r.роль,2,0,o);r.файл=AT[0]&&AT[0].f;r.нужный=Bank.pick(V.idle,V.v);
  return r;});
 check('5. вне боя (за дверью, в картине вокруг) звучит тот же голос вида: своя запись, вариант и высота',
  мир.совпадает&&мир.файл===мир.нужный&&мир.роль!==мир.рольОгра,мир);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();

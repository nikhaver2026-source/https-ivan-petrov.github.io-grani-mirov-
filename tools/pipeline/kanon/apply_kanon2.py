# apply_kanon2.py — канон II (Альфа 1.5) в модуль kanon180_late.js: §13 «Предания краёв» (места природы, подводье)
# и точки входа в уже существующих обработчиках канона (без новых обёрток над общими функциями):
#   • КанонКрай.открыть → наполнить (народы, боги, ресурсы, поселения, звери; то, что уже есть, не повторяется)
#     и места природы вокруг земли; старые сохранения дополняются раз (КанонГео.доразместить в КанонКрай.день);
#   • шаг по месту Режиссёра (та же обёртка, что у поселений) → КанонГео.шаг;
#   • «Действие здесь» (та же обёртка) → окно места природы, где нет ни постройки, ни ресурса, ни чертога;
#   • окно поселения → кварталы города и народы края II.
# Повторный запуск ничего не меняет.
import sys, os
P = os.environ.get("K180", "/root/S/hron/kanon180_late.js")
src = open(P, encoding="utf-8").read()
if "/* ── 13. Предания краёв" in src:
    print("kanon2: уже встроено"); sys.exit(0)

def rep(old, new):
    global src
    assert src.count(old) == 1, old[:120]
    src = src.replace(old, new)

# 1. открыть → наполнить + места природы
rep(''' открыть(k,R){if(!k)return "";R=R||Math.random;const g=Neuro.gen();if(!Array.isArray(g.places))g.places=[];if(!Array.isArray(g.gods))g.gods=[];if(!Array.isArray(g.pets))g.pets=[];
  const ang=R()*Math.PI*2,d=30+Math.round(R()*50);const x=Math.round((Number(G.x)||0)+Math.cos(ang)*d),y=Math.round((Number(G.y)||0)+Math.sin(ang)*d);
  const land={id:"gl_"+(g.n++),n:k.имя,terr:k.terr,x,y,r:10,fam:k.fam,опасность:k.опасность,день:Number(G.day)||1,res:null,кн:k.id};g.lands.push(land);
  const people=[];for(const p of k.народы){const rec={id:"gn_"+(g.n++),kind:"people",n:p.имя,ethos:safeFn(()=>NEURO_ETHOS_IDS[0],"trade"),тяга:[],вождь:"",земля:land.id,род:null,держава:null,реп:0,день:Number(G.day)||1,кн:p.id};
   safeFn(()=>{rec.тяга=NEURO_ETHOS[rec.ethos].тяга.slice();});g.peoples.push(rec);people.push(rec);}
  for(const b of k.боги){g.gods.push({id:"gg_"+(g.n++),n:b.имя,дар:MIX_BUFF_WORD[b.дар]?b.дар:"удача",нрав:"древний",культ:people[0]?people[0].id:null,вера:0,день:Number(G.day)||1,кн:b.id});}
  for(const r of k.ресурсы){if(g.res.some(x=>x.n===r.имя))continue;const rec={id:"gr_"+(g.n++),n:r.имя,ниши:r.ниши.slice(),цена:r.цена,земля:land.id,кто:k.имя,где:"в землях «"+k.имя+"»",x,y,день:Number(G.day)||1,кн:r.id};
   g.res.push(rec);safeFn(()=>Neuro.regRes(rec));if(!land.res)land.res=r.имя;}
  k.поселения.forEach((p,i)=>{const a=ang+Math.PI*(0.3+0.9*i),dd=3+Math.round(R()*5);
   g.places.push({id:"gc_"+(g.n++),kind:NEURO_PLACE[p.kind]?p.kind:"деревня",n:p.имя,x:x+Math.round(Math.cos(a)*dd),y:y+Math.round(Math.sin(a)*dd),r:2,народ:people[i%Math.max(1,people.length)]?people[i%people.length].id:null,день:Number(G.day)||1,кн:p.id,кнКрай:k.id});});
  for(const z of k.звери){const b=ZV_BREED_BY_ID[z.fam+"_wild"];if(!b)continue;g.pets.push({id:"gz_"+(g.n++),n:`${z.имя} — ${b.n.toLowerCase()}`,имя:z.имя,breed:b.id,mount:!!ZV_FAMILY_BY_ID[z.fam].ездовой,
   lvl:1+Math.floor((Number(G.level)||1)/4),цена:(ZV_FAMILY_BY_ID[z.fam].ездовой?160:80)+Math.round(R()*60),кто:k.поселения[0]?k.поселения[0].имя:k.имя,p:people[0]?people[0].id:null,x,y,где:"в землях «"+k.имя+"»",день:Number(G.day)||1,кн:z.id});}
  const s=this.ст();''', ''' открыть(k,R){if(!k)return "";R=R||Math.random;const g=Neuro.gen();
  const ang=R()*Math.PI*2,d=30+Math.round(R()*50);const x=Math.round((Number(G.x)||0)+Math.cos(ang)*d),y=Math.round((Number(G.y)||0)+Math.sin(ang)*d);
  const land={id:"gl_"+(g.n++),n:k.имя,terr:k.terr,x,y,r:10,fam:k.fam,опасность:k.опасность,день:Number(G.day)||1,res:null,кн:k.id};g.lands.push(land);
  const people=this.наполнить(k,land,R,ang);const гео=safeFn(()=>КанонГео.разместить(k,land,R),[])||[];
  const s=this.ст();''')
rep('''${k.боги.length?`; молятся ${k.боги.map(b=>b.имя).join(" и ")}`:""}.`;},''',
    '''${k.боги.length?`; молятся ${k.боги.map(b=>b.имя).join(" и ")}`:""}.${гео.length?` Вокруг — ${гео.map(f=>f.имя).join(", ")}.`:""}`;},
 /* народы, боги, ресурсы, поселения и звери края; что уже есть в мире — не повторяется (так дополняются и старые сохранения) */
 наполнить(k,land,R,ang){const g=Neuro.gen();R=R||Math.random;ang=Number(ang)||0;const x=land.x,y=land.y;
  for(const a of ["places","gods","pets","peoples","res"])if(!Array.isArray(g[a]))g[a]=[];
  const people=[];for(const p of k.народы){let rec=g.peoples.find(q=>q.кн===p.id);
   if(!rec){rec={id:"gn_"+(g.n++),kind:"people",n:p.имя,ethos:safeFn(()=>NEURO_ETHOS_IDS[0],"trade"),тяга:[],вождь:"",земля:land.id,род:null,держава:null,реп:0,день:Number(G.day)||1,кн:p.id};
    safeFn(()=>{rec.тяга=NEURO_ETHOS[rec.ethos].тяга.slice();});g.peoples.push(rec);}people.push(rec);}
  for(const b of k.боги){if(g.gods.some(q=>q.кн===b.id))continue;g.gods.push({id:"gg_"+(g.n++),n:b.имя,дар:MIX_BUFF_WORD[b.дар]?b.дар:"удача",нрав:"древний",культ:people[0]?people[0].id:null,вера:0,день:Number(G.day)||1,кн:b.id});}
  for(const r of k.ресурсы){if(g.res.some(q=>q.n===r.имя))continue;const rec={id:"gr_"+(g.n++),n:r.имя,ниши:r.ниши.slice(),цена:r.цена,земля:land.id,кто:k.имя,где:"в землях «"+k.имя+"»",x,y,день:Number(G.day)||1,кн:r.id};
   g.res.push(rec);safeFn(()=>Neuro.regRes(rec));if(!land.res)land.res=r.имя;}
  k.поселения.forEach((p,i)=>{if(g.places.some(q=>q.кн===p.id))return;const a=ang+Math.PI*(0.3+0.9*i),dd=3+Math.round(R()*5);
   g.places.push({id:"gc_"+(g.n++),kind:NEURO_PLACE[p.kind]?p.kind:"деревня",n:p.имя,x:x+Math.round(Math.cos(a)*dd),y:y+Math.round(Math.sin(a)*dd),r:2,народ:people[i%Math.max(1,people.length)]?people[i%people.length].id:null,день:Number(G.day)||1,кн:p.id,кнКрай:k.id});});
  for(const z of k.звери){if(g.pets.some(q=>q.кн===z.id))continue;const b=ZV_BREED_BY_ID[z.fam+"_wild"];if(!b)continue;g.pets.push({id:"gz_"+(g.n++),n:`${z.имя} — ${b.n.toLowerCase()}`,имя:z.имя,breed:b.id,mount:!!ZV_FAMILY_BY_ID[z.fam].ездовой,
   lvl:1+Math.floor((Number(G.level)||1)/4),цена:(ZV_FAMILY_BY_ID[z.fam].ездовой?160:80)+Math.round(R()*60),кто:k.поселения[0]?k.поселения[0].имя:k.имя,p:people[0]?people[0].id:null,x,y,где:"в землях «"+k.имя+"»",день:Number(G.day)||1,кн:z.id});}
  return people;},''')
# 2. старые сохранения — раз за загрузку, в часах краёв
rep(''' день(){if(G.inCombat)return;const s=this.ст();''', ''' день(){if(G.inCombat)return;safeFn(()=>КанонГео.доразместить());const s=this.ст();''')
# 3. шаг: места природы
rep('''«Действие здесь» — войти.`,{interrupt:false})),900);}}catch(_){}
 return r;};});''', '''«Действие здесь» — войти.`,{interrupt:false})),900);}}catch(_){}
 safeFn(()=>КанонГео.шаг());return r;};});''')
# 4. «Действие здесь»: место природы — там, где больше делать нечего
rep('''useHere=function(){const м=!G.inCombat&&!G.place&&!G.ship?КанонКрай.место():null;if(м){КанонМесто.окно(м);return true;}return u0.apply(this,arguments);};});''',
    '''useHere=function(){const м=!G.inCombat&&!G.place&&!G.ship?КанонКрай.место():null;if(м){КанонМесто.окно(м);return true;}
 const гео=!G.inCombat&&!G.place&&!G.ship&&КанонГео.свободно()?КанонГео.здесь():null;if(гео){КанонГео.окно(гео);return true;}return u0.apply(this,arguments);};});''')
# 5. окно поселения: кварталы и народы края II
rep('''  for(const b of k.боги){const g=(Neuro.gen().gods||[]).find(x=>x.кн===b.id);if(g)ч.push({l:`Помолиться: ${b.имя}`,run:()=>{const t=safeFn(()=>Neuro.offer(g.id),"");narrate(`${b.о}. ${t}`,{interrupt:true});}});}
  ч.push({l:"Уйти",run:()=>{}});
  выбор147(s.имя,`${s.о}. Край — ${k.имя}. ${s.товар?`Здесь в ходу: ${s.товар}; нужда — ${s.нужда}.`:""}`,ч);},''',
    '''  for(const b of k.боги){const g=(Neuro.gen().gods||[]).find(x=>x.кн===b.id);if(g)ч.push({l:`Помолиться: ${b.имя}`,run:()=>{const t=safeFn(()=>Neuro.offer(g.id),"");narrate(`${b.о}.${b.запрет?` Завет: не ${b.запрет}.`:""} ${t}`,{interrupt:true});}});}
  for(const q of (s.кварталы||[]))ч.push({l:`Квартал: ${q.имя} — ${q.о}`,run:()=>this.помощь(q,"квартал")});
  if(s.кварталы)for(const p of k.народы.filter(p=>p.канон2))ч.push({l:`${p.раса?"Раса":"Народ"}: ${p.имя}`,run:()=>this.народ(p,k)});
  ч.push({l:"Уйти",run:()=>{}});
  выбор147(s.имя,`${s.о}. Край — ${k.имя}.${s.правитель?` Правит ${s.правитель}.`:""} ${s.товар?`Здесь в ходу: ${s.товар}${s.нужда?`; нужда — ${s.нужда}`:""}.`:""}`,ч);},
 /* народ или раса края II: слово о них, знакомство — знание; раз в сутки их дар */
 народ(p,k){const s=Канон.ст();if(!s.народы2||typeof s.народы2!=="object")s.народы2={};const перв=!s.народы2[p.id];s.народы2[p.id]=Number(G.day)||1;
  if(перв)safeFn(()=>p.раса?Lore.add("tongue",`kn2:${p.id}`,`${p.язык||"говор"} — ${p.имя}`,k.имя):Lore.add("rite",`kn2:${p.id}`,`обычаи: ${p.имя}`,k.имя));
  const t=[`${p.имя}: ${p.о.charAt(0).toLowerCase()+p.о.slice(1)}.`];if(p.облик)t.push(`Облик: ${p.облик}.`);if(p.язык)t.push(`Говорят: ${p.язык}.`);if(p.дар)t.push(`Их дар: ${p.дар}.`);
  if(p.эф&&КанонМесто.ЭФ[p.эф]){const ключ="нд_"+p.id+":"+G.day;if(!s.помощь||typeof s.помощь!=="object")s.помощь={};if(!s.помощь[ключ]){s.помощь[ключ]=1;t.push(КанонМесто.ЭФ[p.эф]());}}
  Канон.звук(p.звукО||"hall_market",{kind:"world",gain:0.4,maxSec:3});narrate(t.join(" "),{interrupt:true});},''')
# 6. §13 — перед обёртками КанонЦепи
SEC = open("/root/S/kanon/sec13_geo.js", encoding="utf-8").read()
SEC = SEC.replace(" счёт(){return Object.keys(this.ст().был).length;},", ''' счёт(){return Object.keys(this.ст().был).length;},
 /* «Действие здесь» уходит месту природы, только где нет ни постройки, ни ресурса, ни чертога, ни добычи */
 свободно(){if(G.loot&&Array.isArray(G.loot)&&G.loot.length)return false;if(G.chStair||safeFn(()=>inFlight(),false))return false;
  const c=safeFn(()=>cellContent(G.x,G.y),null);if(!c||c.structure||c.res)return false;return !safeFn(()=>Chertog.here(),null);},''')
SEC = SEC.replace(''' доразместить(){const g=G.gen;if(!g||!Array.isArray(g.lands))return;const st=this.ст();''',
                  ''' доразместить(){const g=G.gen;if(!g||!Array.isArray(g.lands))return;const st=this.ст();if(st.сверено===g.lands.length)return;st.сверено=g.lands.length;''')
rep('''
/* ── КанонЦепь: обёртки — по одной на функцию ── */''', SEC + '''
/* ── КанонЦепь: обёртки — по одной на функцию ── */''')
open(P, "w", encoding="utf-8").write(src)
print("kanon2: встроено,", len(src), "знаков")

# 7. познание мира: места природы краёв — в грани «земли» (rost180_late.js)
PR = os.environ.get("ROST", "/root/S/hron/rost180_late.js")
r = open(PR, encoding="utf-8").read()
a = '''+2*safeFn(()=>(typeof КанонКрай!=="undefined"?КанонКрай.ст().открыто.length:0),0);}},'''
b = '''+2*safeFn(()=>(typeof КанонКрай!=="undefined"?КанонКрай.ст().открыто.length:0),0)
    +safeFn(()=>(typeof КанонГео!=="undefined"?КанонГео.счёт():0),0);}},'''
if b not in r:
    assert r.count(a) == 1
    r = r.replace(a, b).replace('о:"области, леса, державы, края преданий, где вы побывали"', 'о:"области, леса, державы, края преданий и их места природы, где вы побывали"')
    open(PR, "w", encoding="utf-8").write(r)
    print("rost180: места природы — в грани «земли»")

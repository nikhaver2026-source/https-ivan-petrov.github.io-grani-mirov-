/* audit.js — статическая проверка страницы: мёртвые и дважды объявленные функции, полные перезаписи
   (без вызова прежней), повторные регистрации модулей, команды CMD, слушатели и таймеры.
   node audit.js index.html > отчёт.json */
const fs=require('fs');const acorn=require('acorn');const walk=require('acorn-walk');
const html=fs.readFileSync(process.argv[2],'utf8');
const scripts=[];const re=/<script([^>]*)>([\s\S]*?)<\/script>/g;let m;
while((m=re.exec(html))){if(/\bsrc=/.test(m[1]))continue;const line=html.slice(0,m.index).split('\n').length;scripts.push({line,code:m[2],off:m.index+m[0].indexOf('>')+1});}
const lineOf=(sc,pos)=>sc.line+sc.code.slice(0,pos).split('\n').length-1;
const src=(sc,n)=>sc.code.slice(n.start,n.end);
const out={dupFn:[],deadTop:[],overrides:[],modules:{},cmd:{},listeners:{},intervals:[],deadMethods:[]};
const topDecl={};const fnDecl={};const assigns={};
/* текст без самих объявлений — для подсчёта упоминаний */
const wordRe=n=>new RegExp('(?<![\\p{L}\\p{N}_$])'+n.replace(/[$]/g,'\\$')+'(?![\\p{L}\\p{N}_$])','gu');
const asts=[];
for(const sc of scripts){
 let ast;try{ast=acorn.parse(sc.code,{ecmaVersion:'latest',sourceType:'script',allowHashBang:true});}catch(e){console.error('разбор',sc.line,e.message);continue;}
 asts.push([sc,ast]);
 for(const st of ast.body){
  if(st.type==='FunctionDeclaration'){const n=st.id.name;(fnDecl[n]=fnDecl[n]||[]).push(lineOf(sc,st.start));(topDecl[n]=topDecl[n]||[]).push({kind:'function',line:lineOf(sc,st.start)});}
  else if(st.type==='VariableDeclaration'){for(const d of st.declarations){if(d.id.type==='Identifier')(topDecl[d.id.name]=topDecl[d.id.name]||[]).push({kind:st.kind,line:lineOf(sc,d.start),fn:!!(d.init&&/Function|Arrow/.test(d.init.type))});}}
  else if(st.type==='ClassDeclaration'){(topDecl[st.id.name]=topDecl[st.id.name]||[]).push({kind:'class',line:lineOf(sc,st.start)});}}
 /* присваивания функций: X=function / X.y=function / X.y=(..)=> */
 walk.ancestor(ast,{
  AssignmentExpression(n,anc){if(n.operator!=='=')return;const r=n.right;if(!r||!/FunctionExpression|ArrowFunctionExpression/.test(r.type))return;
   let t=null;if(n.left.type==='Identifier')t=n.left.name;else if(n.left.type==='MemberExpression'&&!n.left.computed)t=src(sc,n.left);
   if(!t||/^(this|[a-zа-яё_$][\wа-яё$]*)\.(on\w+)$/i.test(t)&&!/^window\./.test(t)&&false)return;
   if(!t||t.length>80)return;
   /* окружение: блок/функция, внутри которой стоит присваивание */
   let encl=null;for(let i=anc.length-2;i>=0;i--){if(/Function|Program/.test(anc[i].type)){encl=anc[i];break;}}
   const fnText=src(sc,r);
   (assigns[t]=assigns[t]||[]).push({line:lineOf(sc,n.start),encl:encl?[encl.start,encl.end]:null,sc,pos:n.start,fnText:fnText.slice(0,0),len:fnText.length});},
  CallExpression(n){const c=n.callee;
   if(c.type==='MemberExpression'&&!c.computed&&c.property.name==='register'&&c.object.type==='Identifier'&&c.object.name==='Modules'&&n.arguments[0]&&n.arguments[0].type==='Literal'){
    const k=n.arguments[0].value;(out.modules[k]=out.modules[k]||[]).push(lineOf(sc,n.start));}
   if(c.type==='MemberExpression'&&!c.computed&&c.property.name==='addEventListener'&&n.arguments[0]&&n.arguments[0].type==='Literal'){
    const tgt=src(sc,c.object).slice(0,40);const k=tgt+' :: '+n.arguments[0].value;(out.listeners[k]=out.listeners[k]||[]).push(lineOf(sc,n.start));}
   if((c.type==='Identifier'&&c.name==='setInterval')||(c.type==='MemberExpression'&&!c.computed&&/^(setInterval|каждые)$/.test(c.property.name))){
    out.intervals.push({line:lineOf(sc,n.start),txt:src(sc,n).slice(0,140).replace(/\s+/g,' ')});}
   if(c.type==='MemberExpression'&&!c.computed&&c.property.name==='assign'&&c.object.name==='Object'&&n.arguments[0]&&n.arguments[0].type==='Identifier'&&n.arguments[0].name==='CMD'&&n.arguments[1]&&n.arguments[1].type==='ObjectExpression'){
    for(const p of n.arguments[1].properties){if(p.key){const k=p.key.name||p.key.value;(out.cmd[k]=out.cmd[k]||[]).push(lineOf(sc,p.start));}}}},
  AssignmentExpression_cmd:null});
 walk.simple(ast,{AssignmentExpression(n){if(n.left.type==='MemberExpression'&&n.left.object.type==='Identifier'&&n.left.object.name==='CMD'&&!n.left.computed){const k=n.left.property.name;(out.cmd[k]=out.cmd[k]||[]).push(lineOf(sc,n.start));}},
  VariableDeclarator(n){if(n.id.type==='Identifier'&&n.id.name==='CMD'&&n.init&&n.init.type==='ObjectExpression'){for(const p of n.init.properties){if(p.key){const k=p.key.name||p.key.value;(out.cmd[k]=out.cmd[k]||[]).push(lineOf(sc,p.start));}}}}});
}
/* 1. дважды объявленные функции */
for(const [n,ls] of Object.entries(fnDecl))if(ls.length>1)out.dupFn.push({n,ls});
/* 2. мёртвые верхние объявления: имя встречается в странице ровно один раз (само объявление) */
const всего={};
for(const n of Object.keys(topDecl)){const c=(html.match(wordRe(n))||[]).length;всего[n]=c;if(c<=1)out.deadTop.push({n,decl:topDecl[n]});}
/* 3. перезаписи: цель присвоена функцией ≥2 раз (или объявлена и присвоена); для каждой поздней —
   берёт ли она прежнюю (в её окружении до присваивания встречается чтение цели) */
for(const [t,list] of Object.entries(assigns)){
 const base=t.indexOf('.')<0&&fnDecl[t]?1:0;if(list.length+base<2)continue;
 if(/^(el|b|btn|o|x|a|e|r|s|w|u|ws|img|au|rec|req|tr|v|ov|div|inp|row|li|p|it|q|c|node|win|ctx|aud|src|m|g|osc|ui|box)\./.test(t))continue;
 if(/\.(on[a-z]+)$/.test(t))continue;
 const res=[];
 list.forEach((a,i)=>{if(i===0&&!base){res.push({line:a.line,берёт:'первое'});return;}
  const code=a.sc.code;const [s0]=a.encl||[0];const before=code.slice(Math.max(s0,a.pos-4000),a.pos);
  const rhsT=t.replace(/[.$]/g,'\\$&');const reRead=new RegExp('(=|\\(|,|\\s)'+rhsT+'(\\.bind\\(|;|,|\\)|\\s*\\|\\|)','u');
  const берёт=reRead.test(before);res.push({line:a.line,берёт:берёт?'да':'НЕТ'});});
 if(res.some(r=>r.берёт==='НЕТ'))out.overrides.push({t,decl:fnDecl[t]||null,defs:res});}
/* 4. повторы */
out.modules=Object.fromEntries(Object.entries(out.modules).filter(([,v])=>v.length>1));
out.cmd=Object.fromEntries(Object.entries(out.cmd).filter(([,v])=>v.length>1).map(([k,v])=>{
 /* обёртка или замена: перед поздним присваиванием читается прежняя команда (const c0=CMD.k) — обёртка */
 const re=new RegExp('CMD\\.'+k+'=(function|\\(|[a-zа-яё_$]+=>)','gu');let m2,вид=[];
 while((m2=re.exec(html))){const до=html.slice(Math.max(0,m2.index-300),m2.index);
  вид.push(new RegExp('=\\s*CMD\\.'+k+'\\s*[;,)]').test(до)?'обёртка':'ЗАМЕНА');}
 return [k,{строки:v,поздние:вид}];}));
out.listenersAll=Object.fromEntries(Object.entries(out.listeners).map(([k,v])=>[k,v.length]));
out.listeners=Object.fromEntries(Object.entries(out.listeners).filter(([k,v])=>v.length>1&&/^(document|window|doc|w|document\.body)\b/.test(k)));
/* 5. методы объектов-модулей, имя которых встречается в странице один раз */
for(const [sc,ast] of asts){
 for(const st of ast.body){if(st.type!=='VariableDeclaration')continue;
  for(const d of st.declarations){let init=d.init;if(!init)continue;
   if(init.type==='CallExpression'&&init.callee.type==='MemberExpression'&&init.callee.property&&init.callee.property.name==='register'&&init.arguments[1])init=init.arguments[1];
   if(init.type!=='ObjectExpression')continue;
   for(const p of init.properties){if(!p.key||p.type!=='Property')continue;const k=p.key.name||p.key.value;if(typeof k!=='string'||k.length<3)continue;
    const isFn=p.method||(p.value&&/Function|Arrow/.test(p.value.type));if(!isFn)continue;
    const c=(html.match(wordRe(k))||[]).length;if(c<=1)out.deadMethods.push({obj:d.id.name,m:k,line:lineOf(sc,p.start)});}}}}
out.сводка={скриптов:scripts.length,верхних:Object.keys(topDecl).length,дваждыФункций:out.dupFn.length,мёртвыхВерхних:out.deadTop.length,
 перезаписейБезВызова:out.overrides.length,модулейДважды:Object.keys(out.modules).length,командДважды:Object.keys(out.cmd).length,
 слушателейПовторных:Object.keys(out.listeners).length,таймеров:out.intervals.length,мёртвыхМетодов:out.deadMethods.length};
console.log(JSON.stringify(out,null,1));

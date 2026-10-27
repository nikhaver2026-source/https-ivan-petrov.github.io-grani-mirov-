/* kcep.js — модуль канона: повторные обёртки одной функции → шаги КанонЦепь и одна обёртка на функцию. */
const fs=require('fs');const acorn=require('acorn');
const F='/root/S/hron/kanon180_late.js';const code=fs.readFileSync(F,'utf8');
const ast=acorn.parse(code,{ecmaVersion:'latest'});
const T={"Undead.onStrike":"onStrike","Undead.onHit":"onHit","Undead.onStart":"onStart","Power.spellK":"spellK","beastAt":"beastAt","victory":"victory"};
const src=n=>code.slice(n.start,n.end);
const edits=[];const счёт={};
for(const st of ast.body){
 if(st.type!=='ExpressionStatement')continue;const call=st.expression;
 if(call.type!=='CallExpression'||call.callee.name!=='safeFn'||!call.arguments[0])continue;
 const arrow=call.arguments[0];if(arrow.type!=='ArrowFunctionExpression'||arrow.body.type!=='BlockStatement')continue;
 const b=arrow.body.body;if(b.length!==2)continue;
 const [decl,asg]=b;if(decl.type!=='VariableDeclaration'||asg.type!=='ExpressionStatement'||asg.expression.type!=='AssignmentExpression')continue;
 const tgt=src(asg.expression.left);if(!T[tgt])continue;const key=T[tgt];
 const fn=asg.expression.right;if(fn.type!=='FunctionExpression')continue;
 const init=decl.declarations[0].init;const prevName=decl.declarations[0].id.name;
 const initTxt=src(init);if(!(initTxt===tgt||initTxt.startsWith(tgt+'.bind(')))continue;
 const params=fn.params.map(src);const body=fn.body.body;
 /* найти оператор с вызовом прежней функции */
 let idx=-1;for(let i=0;i<body.length;i++){if(src(body[i]).includes(prevName+'(')||src(body[i]).includes(prevName+'.apply('))
  {idx=i;break;}}
 if(idx<0)throw new Error('нет вызова прежней: '+tgt);
 const callSt=body[idx];if(callSt.type!=='VariableDeclaration')throw new Error('вызов не объявление: '+tgt+' '+src(callSt).slice(0,80));
 const resName=callSt.declarations[0].id.name;
 const pre=body.slice(0,idx);const restTxt=code.slice(callSt.end,fn.body.end-1);
 let out;
 if(key==='victory'){
  /* до вызова: cb и m даёт обёртка; иное (например, «было») — шаг «до» */
  let доTxt=null,доName=null;
  for(const p of pre){if(p.type!=='VariableDeclaration')throw new Error('victory: до вызова не объявление');
   for(const d of p.declarations){const nm=d.id.name;if(nm==='cb'||nm==='m')continue;if(доName)throw new Error('два «до»');доName=nm;доTxt=src(d.init);}}
  if(resName!=='r')throw new Error('victory: результат не r');
  out=доName?`КанонЦепь.шаг("victory",{до:function(m,cb){return ${доTxt};},после:function(m,cb,r,${доName}){${restTxt}}});`
            :`КанонЦепь.шаг("victory",function(m,cb,r){${restTxt}});`;
 }else{
  if(pre.length)throw new Error('операторы до вызова: '+tgt);
  const ps=key==='beastAt'?[resName,...params]:[params[0],resName,...params.slice(1)];
  out=`КанонЦепь.шаг("${key}",function(${ps.join(',')}){${restTxt}});`;}
 if(/\bthis\b/.test(restTxt))console.error('ВНИМАНИЕ this в шаге',tgt,code.slice(0,st.start).split('\n').length);
 edits.push([st.start,st.end,out]);счёт[key]=(счёт[key]||0)+1;}
let s=code;for(const [a,b,t] of edits.sort((x,y)=>y[0]-x[0]))s=s.slice(0,a)+t+s.slice(b);
const HEAD=`/* ── КанонЦепь: одна обёртка на каждую общую функцию (Альфа 1.0) ──
   Части канона (магия, твари, звери, вещи, умения) прежде оборачивали одни и те же функции заново, до пяти раз
   подряд: удар твари и героя, начало боя, силу чар, встречу в мире и победу. Теперь каждая часть кладёт свой шаг
   сюда, а обёртка у функции одна (в конце модуля). Шаги идут в прежнем порядке: что раньше вкладывалось глубже,
   то и выполняется раньше. Сбой одного шага не роняет остальные. */
const КанонЦепь={шаги:{onStrike:[],onHit:[],onStart:[],spellK:[],beastAt:[],victory:[]},шаг(где,f){this.шаги[где].push(f);}};
`;
const TAIL=`
/* ── КанонЦепь: обёртки — по одной на функцию ── */
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
 for(const f of КанонЦепь.шаги.onStrike){try{d=f(m,d,mdmg);}catch(_){}}return d;};});
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 for(const f of КанонЦепь.шаги.onHit){try{d=f(m,d,dmg);}catch(_){}}return d;};});
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){let r=s0(m);
 for(const f of КанонЦепь.шаги.onStart){try{r=f(m,r);}catch(_){}}return r;};});
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){let k=k0(sp);
 for(const f of КанонЦепь.шаги.spellK){try{k=f(sp,k);}catch(_){}}return k;};});
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){let m=b0.apply(this,arguments);
 for(const f of КанонЦепь.шаги.beastAt){try{m=f(m,x,y,c,доля);}catch(_){}}return m;};});
safeFn(()=>{const v0=victory;victory=function(){const cb=G.combat;const m=cb&&cb.m;const Ш=КанонЦепь.шаги.victory;
 const до=Ш.map(h=>{try{return h.до?h.до(m,cb):undefined;}catch(_){return undefined;}});
 const r=v0.apply(this,arguments);
 Ш.forEach((h,i)=>{try{(h.после||h)(m,cb,r,до[i]);}catch(_){}});return r;};});
`;
/* голова — перед первым шагом; хвост — в конец модуля */
const first=s.indexOf('КанонЦепь.шаг(');
const lineStart=s.lastIndexOf('\n/*',first)>=0?s.lastIndexOf('\n',s.lastIndexOf('\n/*',first)-1)+1:0;
/* надёжнее: голова перед началом верхнего оператора, где первый шаг */
let ins=first;while(ins>0&&s[ins-1]!=='\n')ins--;
s=s.slice(0,ins)+HEAD+s.slice(ins)+TAIL;
fs.writeFileSync(F,s);console.log('шагов',JSON.stringify(счёт));

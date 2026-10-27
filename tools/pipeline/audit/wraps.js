const fs=require('fs');const acorn=require('acorn');const walk=require('acorn-walk');
const html=fs.readFileSync(process.argv[2],'utf8');const m=/<script>([\s\S]*?)<\/script>/.exec(html);const code=m[1];
const ast=acorn.parse(code,{ecmaVersion:'latest'});const line=p=>code.slice(0,p).split('\n').length+810;
const W={};
walk.simple(ast,{AssignmentExpression(n){if(n.operator!=='='||!/Function/.test(n.right.type))return;
 const t=n.left.type==='Identifier'?n.left.name:(n.left.type==='MemberExpression'&&!n.left.computed?code.slice(n.left.start,n.left.end):null);if(!t)return;
 (W[t]=W[t]||[]).push(line(n.start));}});
const top=Object.entries(W).filter(([k,v])=>v.length>=4).sort((a,b)=>b[1].length-a[1].length).slice(0,30);
for(const [k,v] of top)console.log(v.length,k);

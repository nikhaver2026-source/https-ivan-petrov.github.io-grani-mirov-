// Проверка клавиш в приложении для компьютера настоящими нажатиями:
// каждое сочетание по умолчанию из таблицы KB_ACTIONS отправляется в окно
// как событие клавиатуры системы, и смотрится, что сработало нужное действие.
// Запуск: electron keycheck.js (на сервере сборки — под xvfb-run).
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
require('./main.js');
const src = fs.readFileSync(path.join(__dirname, '..', 'tests', '216-all-default-keys.js'), 'utf8');
const ПОДГОТОВКА = eval(src.match(/const ПОДГОТОВКА=(`[\s\S]*?`);/)[1]);
const ЖДЁМ = eval(src.match(/const ЖДЁМ=(`[\s\S]*?`);/)[1]);
const KEYCODE = c => {
  if (/^Key[A-Z]$/.test(c)) return c.slice(3);
  if (/^Digit\d$/.test(c)) return c.slice(5);
  return ({ ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Space: 'Space', Minus: '-', Equal: '=',
    Slash: '/', Enter: 'Enter', Escape: 'Escape', Backspace: 'Backspace', Tab: 'Tab' })[c] || c;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const w = BrowserWindow.getAllWindows()[0];
  const js = s => w.webContents.executeJavaScript(s);
  w.focus(); w.webContents.focus();
  await js(`(()=>{try{enterGame();}catch(e){}while(activeLayer())closeTopUI();return 1;})()`);
  await js(ПОДГОТОВКА);
  const list = await js(`KB_ACTIONS.map(a=>({id:a.id,ctx:a.ctx,dir:a.dir,combos:keyCombosOf(a.id)}))`);
  const bad = []; let n = 0;
  for (const a of list) for (const combo of a.combos) {
    const parts = combo.split('+'); const code = parts.pop();
    const modifiers = parts.map(p => p === 'Ctrl' ? 'control' : p.toLowerCase());
    await js(`(()=>{while(activeLayer())closeTopUI();__rec.length=0;window.__steps=[];
      if(!window.__mv){window.__mv=window.move;window.move=function(d){__steps.push(d);return true;};}
      ${a.ctx === 'combat' ? 'G.inCombat=true;G.combat={m:{n:"волк",hp:10},hp:10};' : 'G.inCombat=false;G.combat=null;'}
      G.weaponDrawn=false;G.items=(G.items||[]).filter(x=>!/зель/i.test(x));${a.id === 'potion' ? 'G.items.push("Зелье здоровья");' : ''}return 1;})()`);
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: KEYCODE(code), modifiers });
    if (code.length === 1 || /^Key|^Digit|Space|Minus|Equal|Slash/.test(code)) w.webContents.sendInputEvent({ type: 'char', keyCode: KEYCODE(code), modifiers });
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: KEYCODE(code), modifiers });
    await wait(250);
    const r = await js(`((id,ctx,dir)=>{const ЖДЁМ=${ЖДЁМ};let ok=true,why="";
      if(ctx==="move"){ok=__steps[0]===dir;why=ok?"":"шаг "+JSON.stringify(__steps);}
      else{const ж=ЖДЁМ(id);
       if(ж.g&&!__rec.includes(ж.g)){ok=false;why="нет "+ж.g;}
       if(ж.r&&!__rec.includes(ж.r)){ok=false;why="нет "+ж.r;}
       if(ж.окно){const el=document.getElementById(ж.окно);if(!el||el.hidden){ok=false;why+=" окно "+ж.окно;}}}
      const rec=__rec.slice();G.inCombat=false;G.combat=null;while(activeLayer())closeTopUI();return {ok,why,rec};})(${JSON.stringify(a.id)},${JSON.stringify(a.ctx)},${JSON.stringify(a.dir || '')})`);
    n++;
    if (!r.ok) bad.push({ id: a.id, combo, why: r.why, rec: r.rec });
  }
  console.log('KEYCHECK', JSON.stringify({ нажатий: n, плохих: bad.length, bad: bad.slice(0, 20) }));
  app.exit(bad.length ? 1 : 0);
}, 5000));

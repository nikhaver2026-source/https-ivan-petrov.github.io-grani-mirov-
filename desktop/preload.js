// Мост приложения для компьютера: игра узнаёт, что запущена не в браузере,
// и объявляет окно чтецу экрана приложением (клавиши идут в игру).
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('graniDesktop', {
  version: '12.5', platform: process.platform,
  // «Выход» в меню действий: игра уже сохранилась — закрываем приложение.
  quit: () => ipcRenderer.send('grani-quit'),
  // Голосовой пакет Gemini: выбрать скачанный файл и поставить.
  installVoicePack: () => ipcRenderer.invoke('grani-voicepack-install'),
  voicePackInfo: () => { try { return ipcRenderer.sendSync('grani-voicepack-info'); } catch (_) { return { installed: false }; } },
  // Голоса Windows: почему не подключились и повторная попытка.
  ttsDiag: () => { try { return String(ipcRenderer.sendSync('tts-diag') || ''); } catch (_) { return ''; } },
  ttsRestart: () => ipcRenderer.invoke('tts-restart')
});
// Голоса, установленные в Windows: тот же мост GraniTTS, что в приложении
// для Android. Если мост поднялся к открытию игры — он есть с первой строки;
// если позже — появляется на лету, и игра перечитывает голоса
// (событие grani-tts-ready), без перезапуска приложения.
const api = {
  speak: (text, rate, volume, id) => ipcRenderer.send('tts-speak', String(text), Number(rate), Number(volume), String(id)),
  stop: () => ipcRenderer.send('tts-stop'),
  isSpeaking: () => !!ipcRenderer.sendSync('tts-speaking'),
  getVoices: () => ipcRenderer.sendSync('tts-voices'),
  setVoice: name => ipcRenderer.send('tts-voice', String(name))
};
let exposed = false;
function expose() {
  if (exposed) return true;
  try { contextBridge.exposeInMainWorld('GraniTTS', api); exposed = true; return true; }
  catch (_) { return false; }
}
let tts = { ready: false };
try { tts = ipcRenderer.sendSync('tts-info') || tts; } catch (_) { }
if (tts.ready) expose();
ipcRenderer.on('tts-ready', () => {
  const was = exposed;
  if (!expose()) { ipcRenderer.send('tts-late-fail'); return; }
  const fire = () => { try { window.dispatchEvent(new CustomEvent('grani-tts-ready', { detail: { late: !was } })); } catch (_) { } };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', fire, { once: true }); else fire();
});

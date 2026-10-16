// Мост приложения для компьютера. Игра узнаёт, что запущена на компьютере
// (window.LabDesktop): подсказки и руководство говорят о клавишах, а не о
// жестах. Голоса компьютера приходят тем же мостом LabTTS, что в приложении
// для Android: speak, stop, status, getVoices, setVoice, isSpeaking.
const { contextBridge, ipcRenderer } = require('electron');

function info() {
  try { return ipcRenderer.sendSync('lab-tts-info') || { state: 'failed', voices: [] }; }
  catch (_) { return { state: 'failed', voices: [] }; }
}
const log = m => ipcRenderer.send('lab-log', String(m));
const quit = () => ipcRenderer.send('lab-quit');

contextBridge.exposeInMainWorld('LabDesktop', {
  version: 'Альфа 1.5', platform: process.platform,
  exit: quit, log: log,
  // Голоса компьютера: почему не видно голосов и повторная попытка.
  ttsDiag: () => { try { return String(ipcRenderer.sendSync('lab-tts-diag') || ''); } catch (_) { return ''; } },
  ttsRestart: () => ipcRenderer.invoke('lab-tts-restart')
});

contextBridge.exposeInMainWorld('LabTTS', {
  speak: (text, rate, volume, id) => ipcRenderer.send('lab-tts-speak', String(text), Number(rate), Number(volume), String(id)),
  stop: () => ipcRenderer.send('lab-tts-stop'),
  status: () => info().state,
  isSpeaking: () => { try { return !!ipcRenderer.sendSync('lab-tts-speaking'); } catch (_) { return false; } },
  hasRussian: () => info().voices.some(v => /^ru/i.test(String(v.lang || ''))),
  getVoices: () => JSON.stringify(info().voices),
  setVoice: name => ipcRenderer.send('lab-tts-voice', String(name || '')),
  vibrate: () => { },
  log: log,
  exitApp: quit
});

// Мост голосов поднялся позже или голоса перечитаны — игра берёт их на лету.
ipcRenderer.on('lab-tts-ready', () => {
  const fire = () => { try { window.dispatchEvent(new Event('lab-tts-ready')); } catch (_) { } };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', fire, { once: true }); else fire();
});

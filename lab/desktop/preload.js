// Мост приложения для компьютера. Игра узнаёт, что запущена на компьютере
// (window.LabDesktop): подсказки и руководство говорят о клавишах, а не о
// жестах. Голоса компьютера приходят тем же мостом LabTTS, что в приложении
// для Android: speak, stop, status, getVoices, setVoice, isSpeaking.
//
// Окно игры ничего не ждёт от главного процесса: состояние голосов (готовы
// ли, какие, почему нет) и то, говорит ли мост сейчас, хранятся здесь и
// обновляются сами — главный процесс присылает их, как только они меняются.
// Синхронный вопрос — один, при открытии окна. Прежде каждый такой вопрос
// останавливал игру, пока главный процесс не ответит, а он в это время мог
// читать настройки NVDA и JAWS с диска: при быстрых действиях игра подвисала.
const { contextBridge, ipcRenderer } = require('electron');

let tts = { state: 'init', voices: [], diag: '' };
try { tts = ipcRenderer.sendSync('lab-tts-info') || tts; } catch (_) { tts = { state: 'failed', voices: [], diag: '' }; }
let speakingId = null; // фраза, которую мост говорит сейчас (её конец придёт сам)

const log = m => ipcRenderer.send('lab-log', String(m));
const quit = () => ipcRenderer.send('lab-quit');

contextBridge.exposeInMainWorld('LabDesktop', {
  version: 'Альфа 2.1', platform: process.platform,
  exit: quit, log: log,
  // Голоса компьютера: почему не видно голосов и повторная попытка.
  ttsDiag: () => String(tts.diag || ''),
  ttsRestart: () => ipcRenderer.invoke('lab-tts-restart')
});

contextBridge.exposeInMainWorld('LabTTS', {
  speak: (text, rate, volume, id) => { speakingId = String(id); ipcRenderer.send('lab-tts-speak', String(text), Number(rate), Number(volume), String(id)); },
  stop: () => { speakingId = null; ipcRenderer.send('lab-tts-stop'); },
  status: () => String(tts.state || 'failed'),
  isSpeaking: () => speakingId !== null,
  hasRussian: () => (tts.voices || []).some(v => /^ru/i.test(String(v.lang || ''))),
  getVoices: () => JSON.stringify(tts.voices || []),
  setVoice: name => ipcRenderer.send('lab-tts-voice', String(name || '')),
  vibrate: () => { },
  log: log,
  exitApp: quit
});

// Конец фразы (сказана, снята, сбой) — мост больше не говорит её.
ipcRenderer.on('lab-tts-end', (e, kind, id) => { if (String(id) === speakingId) speakingId = null; });
// Голоса поднялись, появились или пропали (запустили или закрыли NVDA, JAWS,
// «Перечитать голоса») — игра берёт их на лету.
ipcRenderer.on('lab-tts-state', (e, s) => {
  if (s && typeof s === 'object') tts = s;
  const fire = () => { try { window.dispatchEvent(new Event('lab-tts-ready')); } catch (_) { } };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', fire, { once: true }); else fire();
});

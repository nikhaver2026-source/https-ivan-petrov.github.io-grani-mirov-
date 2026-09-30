// Мост приложения для компьютера: игра узнаёт, что запущена не в браузере,
// и объявляет окно чтецу экрана приложением (клавиши идут в игру).
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('graniDesktop', {
  version: '4.8', platform: process.platform,
  // «Выход» в меню действий: игра уже сохранилась — закрываем приложение.
  quit: () => ipcRenderer.send('grani-quit'),
  // Голосовой пакет Gemini: выбрать скачанный файл и поставить.
  installVoicePack: () => ipcRenderer.invoke('grani-voicepack-install'),
  voicePackInfo: () => { try { return ipcRenderer.sendSync('grani-voicepack-info'); } catch (_) { return { installed: false }; } }
});
// Голоса, установленные в Windows: тот же мост GraniTTS, что в приложении
// для Android. Мост есть, только если голоса Windows ответили при запуске;
// иначе игра говорит голосами, которые видит сам Chromium.
let tts = { ready: false };
try { tts = ipcRenderer.sendSync('tts-info') || tts; } catch (_) { }
if (tts.ready) {
  contextBridge.exposeInMainWorld('GraniTTS', {
    speak: (text, rate, volume, id) => ipcRenderer.send('tts-speak', String(text), Number(rate), Number(volume), String(id)),
    stop: () => ipcRenderer.send('tts-stop'),
    isSpeaking: () => !!ipcRenderer.sendSync('tts-speaking'),
    getVoices: () => ipcRenderer.sendSync('tts-voices'),
    setVoice: name => ipcRenderer.send('tts-voice', String(name))
  });
}

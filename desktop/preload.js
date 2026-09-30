// Мост приложения для компьютера: игра узнаёт, что запущена не в браузере,
// и объявляет окно чтецу экрана приложением (клавиши идут в игру).
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('graniDesktop', { version: '4.7', platform: process.platform });

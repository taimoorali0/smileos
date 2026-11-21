const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('smileosDesktop', {
  version: '1.0.0',
  launch: (program, args) => ipcRenderer.invoke('bridge:launch', program, args),
  saveServer: (url) => ipcRenderer.invoke('setup:save', url),
});

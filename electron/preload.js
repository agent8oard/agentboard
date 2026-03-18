const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  getVersion: () => ipcRenderer.invoke('get-version'),

  // Desktop mode
  openDesktopMode: () => ipcRenderer.send('open-desktop-mode'),
  closeWindow: () => ipcRenderer.send('close-window'),
})

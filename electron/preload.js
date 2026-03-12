'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API to the renderer process.
// contextIsolation keeps Node.js APIs out of the webpage's global scope.
contextBridge.exposeInMainWorld('electronAPI', {
  /** True when running inside Electron — lets React code branch accordingly. */
  isElectron: true,

  /** Retrieve the persisted JWT token from the main-process store. */
  getToken: () => ipcRenderer.invoke('get-token'),

  /** Persist a JWT token so the next launch skips the login screen. */
  setToken: (token) => ipcRenderer.send('set-token', token),

  /** Clear the persisted token (called on sign-out). */
  clearToken: () => ipcRenderer.send('clear-token'),
})

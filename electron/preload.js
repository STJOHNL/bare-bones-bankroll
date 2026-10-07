'use strict'

const { contextBridge } = require('electron')

// Expose a minimal, safe API to the renderer process.
// contextIsolation keeps Node.js APIs out of the webpage's global scope.
// Auth is handled entirely by the httpOnly cookie, so no token bridge is exposed.
contextBridge.exposeInMainWorld('electronAPI', {
  /** True when running inside Electron — lets React code branch accordingly. */
  isElectron: true,
})

'use strict'

const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs = require('fs')

const PORT = 5000

// ─── Token storage ────────────────────────────────────────────────────────────
// Simple JSON file in the OS user-data folder — no extra dependencies.

function tokenFilePath() {
  return path.join(app.getPath('userData'), 'session.json')
}

function readToken() {
  try {
    const raw = fs.readFileSync(tokenFilePath(), 'utf8')
    return JSON.parse(raw).token || null
  } catch {
    return null
  }
}

function writeToken(token) {
  fs.writeFileSync(tokenFilePath(), JSON.stringify({ token }), 'utf8')
}

function clearToken() {
  try { fs.unlinkSync(tokenFilePath()) } catch {}
}

// ─── IPC handlers (called from preload bridge) ────────────────────────────────

ipcMain.handle('get-token', () => readToken())
ipcMain.on('set-token', (_, token) => writeToken(token))
ipcMain.on('clear-token', () => clearToken())

// ─── Express server startup ───────────────────────────────────────────────────

async function startServer() {
  // Resolve the server directory whether running from source or packaged.
  const serverDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app', 'server')
    : path.join(__dirname, '../server')

  // Change CWD so dotenv('./config/.env') and static-file paths resolve correctly.
  process.chdir(serverDir)

  // Tell server.js to skip its own app.listen() so we control the port here.
  process.env.ELECTRON = 'true'
  process.env.PORT = String(PORT)
  process.env.NODE_ENV = process.env.NODE_ENV || 'production'

  // Dynamic import works across the CJS/ESM boundary.
  const { app: expressApp } = await import('../server/server.js')

  return new Promise((resolve, reject) => {
    expressApp.listen(PORT, resolve).on('error', reject)
  })
}

// ─── Window creation ──────────────────────────────────────────────────────────

let mainWindow

async function createWindow() {
  const token = readToken()

  // Pre-seed the auth cookie so the Express `protect` middleware accepts API
  // requests immediately — before React has mounted and called setToken via IPC.
  if (token) {
    await session.defaultSession.cookies.set({
      url: `http://localhost:${PORT}`,
      name: 'token',
      value: token,
      httpOnly: true,
      secure: false, // Electron serves over plain http://localhost
      sameSite: 'strict',
    })
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  const startPath = token ? '/dashboard' : '/'
  mainWindow.loadURL(`http://localhost:${PORT}${startPath}`)
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await startServer()
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

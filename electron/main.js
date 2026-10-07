'use strict'

const { app, BrowserWindow, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { autoUpdater } = require('electron-updater')

const PORT = 5000
const HOST = '127.0.0.1'
const ORIGIN = `http://${HOST}:${PORT}`

// ─── Configuration ────────────────────────────────────────────────────────────
// Packaged builds never ship server secrets. The server's environment file is
// read from the user-data folder instead (e.g. %APPDATA%\Bare Bones Bankroll\config.env).
// In development the server falls back to server/config/.env as usual.

function configFilePath() {
  return path.join(app.getPath('userData'), 'config.env')
}

function ensureConfig() {
  if (!app.isPackaged) return true

  const configPath = configFilePath()
  if (fs.existsSync(configPath)) {
    process.env.BBB_ENV_PATH = configPath
    return true
  }

  dialog.showErrorBox(
    'Configuration required',
    `Bare Bones Bankroll needs a configuration file before it can start.\n\n` +
      `Create this file:\n${configPath}\n\n` +
      `with the same keys as server/config/.env (MONGO_URL, JWT_SECRET, SENDGRID_API_KEY, FROM_EMAIL, ADMIN_EMAIL, CLIENT_URL), then reopen the app.`
  )
  return false
}

// Earlier versions stored the JWT in plain text in session.json. Auth now lives
// only in the httpOnly cookie (persisted by Electron's cookie store), so remove it.
function removeLegacyTokenFile() {
  try {
    fs.unlinkSync(path.join(app.getPath('userData'), 'session.json'))
  } catch {}
}

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
  const { app: expressApp, dbReady } = await import('../server/server.js')
  await dbReady

  // Bind to loopback only so the API is never reachable from the local network.
  return new Promise((resolve, reject) => {
    expressApp.listen(PORT, HOST, resolve).on('error', reject)
  })
}

// ─── Window creation ──────────────────────────────────────────────────────────

let mainWindow

function isAppUrl(url) {
  try {
    return new URL(url).origin === ORIGIN
  } catch {
    return false
  }
}

function openExternally(url) {
  try {
    const { protocol } = new URL(url)
    if (protocol === 'https:' || protocol === 'http:') shell.openExternal(url)
  } catch {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Links to other sites (e.g. GitHub releases) open in the system browser,
  // never in an app window that could reach the local API.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return
    event.preventDefault()
    openExternally(url)
  })

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  // The client redirects to sign-in when there is no valid auth cookie.
  mainWindow.loadURL(`${ORIGIN}/dashboard`)
}

// ─── Auto-updater ─────────────────────────────────────────────────────────────

function initAutoUpdater() {
  if (!app.isPackaged) return

  autoUpdater.on('error', error => {
    console.error('Auto-update failed:', error)
  })

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of Bare Bones Bankroll is downloading in the background.',
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The app will restart to apply the update.',
        buttons: ['Restart Now', 'Later'],
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  // Listeners are attached first; our own dialogs replace the default notification.
  autoUpdater.checkForUpdates().catch(error => {
    console.error('Update check failed:', error)
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  removeLegacyTokenFile()

  if (!ensureConfig()) {
    app.quit()
    return
  }

  try {
    await startServer()
  } catch (error) {
    dialog.showErrorBox(
      'Unable to start',
      `Bare Bones Bankroll could not start its local server.\n\n${error?.message || error}`
    )
    app.quit()
    return
  }

  createWindow()
  initAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

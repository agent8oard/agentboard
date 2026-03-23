const { app, BrowserWindow, shell, Menu, nativeTheme, ipcMain, globalShortcut, dialog } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const log = require('electron-log')

nativeTheme.themeSource = 'dark'

// ─── Auto-updater ─────────────────────────────────────────────────────────────

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
autoUpdater.autoDownload = false

function setupAutoUpdater() {
  if (!app.isPackaged) return

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Crackdealer2001',
    repo: 'agentboard',
    private: false
  })

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    const { dialog } = require('electron')
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available`,
      detail: 'Would you like to download and install it now?',
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available. Current version:', info.version)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.setProgressBar(progressObj.percent / 100)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.setProgressBar(-1)
    const { dialog } = require('electron')
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} downloaded`,
      detail: 'Restart now to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true)
      }
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Auto update error:', err)
  })

  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 3000)
}

const isDev = !app.isPackaged
const PORT = process.env.PORT || 3000

const PROD_URL = 'https://agentboard-five.vercel.app'
function getURL(path = '') {
  if (isDev) return `http://localhost:${PORT}${path}`
  return `${PROD_URL}${path}`
}

let mainWindow = null
let desktopModeWindow = null

// ─── Main window ────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'AgentBoard',
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    show: false,
    icon: path.join(__dirname, '../public/icons/icon.png'),
  })

  // Strip headers that block iframe embedding so the Browser panel can load any site
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']
    delete headers['content-security-policy']
    delete headers['Content-Security-Policy']
    delete headers['content-security-policy-report-only']
    delete headers['Content-Security-Policy-Report-Only']
    delete headers['X-Content-Type-Options']
    callback({ responseHeaders: headers })
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.loadURL(getURL()).catch(() => {
    setTimeout(() => mainWindow?.loadURL(getURL()), 1000)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    // Close desktop mode window if main window closes
    if (desktopModeWindow && !desktopModeWindow.isDestroyed()) {
      desktopModeWindow.close()
    }
  })
}

// ─── Desktop mode window ─────────────────────────────────────────────────────

function createDesktopModeWindow() {
  // Only one desktop mode window at a time
  if (desktopModeWindow && !desktopModeWindow.isDestroyed()) {
    desktopModeWindow.focus()
    return
  }

  desktopModeWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    title: 'AgentBoard — Desktop Mode',
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    show: false,
    icon: path.join(__dirname, '../public/icons/icon.png'),
  })

  // Strip headers that block iframe embedding so the Browser panel can load any site
  desktopModeWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']
    delete headers['content-security-policy']
    delete headers['Content-Security-Policy']
    delete headers['content-security-policy-report-only']
    delete headers['Content-Security-Policy-Report-Only']
    delete headers['X-Content-Type-Options']
    callback({ responseHeaders: headers })
  })

  desktopModeWindow.maximize()

  desktopModeWindow.once('ready-to-show', () => {
    desktopModeWindow.show()
  })

  desktopModeWindow.loadURL(getURL('/desktop-mode'))

  desktopModeWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  desktopModeWindow.on('closed', () => {
    desktopModeWindow = null
  })
}

function toggleDesktopMode() {
  if (desktopModeWindow && !desktopModeWindow.isDestroyed()) {
    desktopModeWindow.close()
  } else {
    createDesktopModeWindow()
  }
}

// ─── IPC handlers ─────────────────────────────────────────────────────────

ipcMain.on('open-desktop-mode', () => {
  createDesktopModeWindow()
})

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

ipcMain.handle('get-version', () => app.getVersion())

ipcMain.handle('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.maximize()
})

// ─── Application menu ─────────────────────────────────────────────────────

function buildMenu() {
  const desktopModeItem = {
    label: 'Desktop Mode',
    accelerator: 'CmdOrCtrl+Shift+M',
    click: toggleDesktopMode,
  }

  const fileMenu = {
    label: 'File',
    submenu: [
      {
        label: 'Dashboard',
        accelerator: 'CmdOrCtrl+D',
        click: () => mainWindow?.loadURL(getURL('/dashboard')),
      },
      {
        label: 'New Agent',
        accelerator: 'CmdOrCtrl+N',
        click: () => mainWindow?.loadURL(getURL('/builder')),
      },
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close' } : { role: 'quit', label: 'Exit AgentBoard' },
    ],
  }

  const viewMenu = {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      desktopModeItem,
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  }

  const helpMenu = {
    label: 'Help',
    submenu: [
      {
        label: 'About AgentBoard',
        click: () => {
          const { dialog } = require('electron')
          dialog.showMessageBox({
            type: 'info',
            title: 'AgentBoard',
            message: 'AgentBoard',
            detail: `Version ${app.getVersion()}\nAI-powered business automation platform.\n\n© 2025 AgentBoard`,
            buttons: ['OK'],
          })
        },
      },
      {
        label: 'Keyboard Shortcuts',
        click: () => {
          const { dialog } = require('electron')
          dialog.showMessageBox({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'Keyboard Shortcuts',
            detail: [
              'Ctrl+Shift+M — Toggle Desktop Mode',
              'Ctrl+D       — Go to Dashboard',
              'Ctrl+N       — New Agent',
              'Ctrl+R       — Reload',
              'F11          — Toggle Fullscreen',
            ].join('\n'),
            buttons: ['OK'],
          })
        },
      },
    ],
  }

  let template

  if (process.platform === 'darwin') {
    template = [
      {
        label: app.name,
        submenu: [
          { label: 'About AgentBoard', role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      fileMenu,
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' }, { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        ],
      },
      viewMenu,
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' }, { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
        ],
      },
      helpMenu,
    ]
  } else {
    // Windows / Linux — show a minimal menu with the important items
    template = [fileMenu, viewMenu, helpMenu]
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  setupAutoUpdater()

  // Register global shortcut as backup (works even when menu is hidden)
  globalShortcut.register('CmdOrCtrl+Shift+M', toggleDesktopMode)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const prodHostname = new URL(PROD_URL).hostname

app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    const allowed =
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      parsedUrl.hostname === prodHostname
    if (!allowed) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
})

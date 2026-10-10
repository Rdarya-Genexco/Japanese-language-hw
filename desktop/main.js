// Doc Translate desktop app (Electron). Shows the live site in its own window; Google sign-in
// happens in the system browser (Google blocks it in embedded windows) and comes back via doctranslate://.
const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron')
const path = require('path')
const crypto = require('crypto')

// DOC_TRANSLATE_URL lets you test against a local dev server (e.g. http://localhost:5173)
const APP_URL = process.env.DOC_TRANSLATE_URL || 'https://doc-translate.netlify.app'
const APP_ORIGIN = new URL(APP_URL).origin
const PROTOCOL = 'doctranslate'

// Exact origin match: a prefix check would also accept look-alikes like https://doc-translate.netlify.app.evil.com
function isAppUrl(url) {
  try { return new URL(url).origin === APP_ORIGIN } catch { return false }
}

let win = null
let pendingState = null // one-time value for the sign-in in progress

// One window only; a second launch (e.g. from a doctranslate:// link) is forwarded to this one
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const link = argv.find(a => a.startsWith(`${PROTOCOL}://`))
    if (link) handleDeepLink(link)
    if (win) { if (win.isMinimized()) win.restore(); win.focus() }
  })
}

// Register doctranslate:// with Windows (in dev, point it at this script)
if (process.defaultApp) {
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

function handleDeepLink(link) {
  let url
  try { url = new URL(link) } catch { return }
  if (url.hostname !== 'auth') return
  const state = url.searchParams.get('state')
  const idToken = url.searchParams.get('id_token')
  // Only accept the token for the sign-in this app started
  if (!pendingState || !idToken || state !== pendingState) return
  pendingState = null
  win?.webContents.send('google-id-token', idToken)
}

ipcMain.handle('start-google-sign-in', (event, hl) => {
  if (!isAppUrl(event.senderFrame?.url)) return
  pendingState = crypto.randomBytes(24).toString('base64url')
  const lang = typeof hl === 'string' && /^[A-Za-z-]{2,10}$/.test(hl) ? hl : ''
  shell.openExternal(`${APP_URL}/desktop-auth?state=${pendingState}${lang ? `&hl=${lang}` : ''}`)
})

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    title: 'Doc Translate',
    backgroundColor: '#0e0e13',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Links to other sites (privacy links, mailto, Google pages) open in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Firebase's own auth helper frames/popups stay inside; everything else goes outside
    if (isAppUrl(url) || url === 'about:blank') return { action: 'allow' }
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) { event.preventDefault(); shell.openExternal(url) }
  })

  win.loadURL(APP_URL)
  win.on('closed', () => { win = null })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  // App launched by a doctranslate:// link while closed
  const link = process.argv.find(a => a.startsWith(`${PROTOCOL}://`))
  if (link) handleDeepLink(link)
})

app.on('window-all-closed', () => app.quit())

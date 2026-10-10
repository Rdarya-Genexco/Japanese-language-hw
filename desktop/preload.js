// Minimal bridge for the web app: start browser sign-in, receive the Google ID token back.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('docTranslateDesktop', {
  startGoogleSignIn: (hl) => ipcRenderer.invoke('start-google-sign-in', hl),
  onGoogleIdToken: (callback) => {
    const listener = (_event, idToken) => callback(idToken)
    ipcRenderer.on('google-id-token', listener)
    return () => ipcRenderer.removeListener('google-id-token', listener)
  },
})

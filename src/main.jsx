import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase/config'

/**
 * Console helper: test()
 * Signs in anonymously so you can use the app without a Google account.
 * All data (worksheets, folders) is kept in memory only — nothing is saved
 * to Firestore and it disappears on page reload.
 *
 * Usage (browser console):
 *   await test()
 */
window.test = async function () {
  await signInAnonymously(auth)
  console.log('%c✅ Test mode active — signed in anonymously. Data will NOT be saved.', 'color:#6366f1;font-weight:bold')
}

// When a new deploy lands, old cached JS chunk URLs become invalid.
// Netlify's SPA redirect returns HTML for missing /assets/*.js → browser throws
// "Failed to fetch dynamically imported module". Catch it and force a reload so
// the user gets the fresh bundle automatically.
// Only chunk-load errors — a bare "Failed to fetch" is any network failure and would reload-loop offline.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed/i
function reloadOnChunkError(msg) {
  if (!CHUNK_ERROR.test(msg)) return
  const last = Number(sessionStorage.getItem('chunkReloadAt') || 0)
  if (Date.now() - last < 10000) return
  sessionStorage.setItem('chunkReloadAt', String(Date.now()))
  window.location.reload()
}
window.addEventListener('error', (e) => reloadOnChunkError(e?.message || ''))
window.addEventListener('unhandledrejection', (e) => reloadOnChunkError(String(e?.reason?.message || e?.reason || '')))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// When a new deploy lands, old cached JS chunk URLs become invalid.
// Netlify's SPA redirect returns HTML for missing /assets/*.js → browser throws
// "Failed to fetch dynamically imported module". Catch it and force a reload so
// the user gets the fresh bundle automatically.
window.addEventListener('error', (e) => {
  const msg = e?.message || ''
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch')) {
    window.location.reload()
  }
})
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e?.reason?.message || e?.reason || '')
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch')) {
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

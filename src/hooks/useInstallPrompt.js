import { useState, useEffect, useCallback } from 'react'

// Doc Translate is an installable web app (PWA): on Android, Chrome installs it from the page.
// main.jsx keeps the browser's one-time install offer in window.__docTranslateInstallPrompt.

export const isAndroid = () => /Android/i.test(navigator.userAgent)

/** Already running as the installed app (opened from the home-screen icon). */
export const runningInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

/** Whether an Android install option makes sense here at all. */
export const canOfferAndroidInstall = () => !runningInstalled() && !window.docTranslateDesktop

/**
 * install(): shows the browser's own install prompt when it offered one, otherwise reveals the
 * manual steps (showHelp). A prompt can only be shown once, so it falls back to the steps after.
 */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(() => window.__docTranslateInstallPrompt || null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const ready = () => setPrompt(window.__docTranslateInstallPrompt || null)
    const installed = () => { window.__docTranslateInstallPrompt = null; setPrompt(null) }
    window.addEventListener('doc-translate-install-ready', ready)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('doc-translate-install-ready', ready)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const install = useCallback(async () => {
    if (!prompt) { setShowHelp(v => !v); return }
    prompt.prompt()
    const { outcome } = await prompt.userChoice.catch(() => ({}))
    window.__docTranslateInstallPrompt = null
    setPrompt(null)
    if (outcome !== 'accepted') setShowHelp(true)
  }, [prompt])

  return { install, showHelp }
}

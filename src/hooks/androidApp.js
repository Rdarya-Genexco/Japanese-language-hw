// Android: the native app (android/, a Trusted Web Activity) is published as DocTranslate.apk on the
// GitHub Release by .github/workflows/desktop.yml, so /releases/latest/download/ always has the newest.
export const ANDROID_APK_URL = 'https://github.com/Rdarya-Genexco/Japanese-language-hw/releases/latest/download/DocTranslate.apk'

export const isAndroid = () => /Android/i.test(navigator.userAgent)

/** Already running as the installed app (the Android app or a home-screen web app). */
export const runningInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

/** Whether an Android download makes sense here at all (not inside the Android or desktop app). */
export const canOfferAndroidInstall = () => !runningInstalled() && !window.docTranslateDesktop

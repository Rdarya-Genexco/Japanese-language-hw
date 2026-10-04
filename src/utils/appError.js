/** An error whose message is a translation key, so the UI can show it in the chosen language. */
export function appError(i18nKey, cause) {
  const err = new Error(i18nKey)
  err.i18nKey = i18nKey
  if (cause) err.cause = cause
  return err
}

// Firestore REST error codes (see firestoreREST.js) that have a translated message
const CODE_KEYS = {
  'permission-denied': 'errPermission',
  'unauthenticated': 'signInExpired',
  'unavailable': 'errNetwork',
}

/** Text to show for any error: translated when we know what it means, otherwise its own message. */
export function errorText(err, t) {
  if (err?.i18nKey) return t(err.i18nKey)
  if (CODE_KEYS[err?.code]) return t(CODE_KEYS[err.code])
  if (err?.name === 'TypeError' && /fetch|network/i.test(err.message)) return t('errNetwork')
  return err?.message || t('somethingWentWrong')
}

/**
 * Storage service proxy.
 *
 * Routes every call to the in-memory service when the current user is
 * anonymous (test mode), or to Firestore otherwise.
 *
 * Import from here instead of firestoreService directly so that test mode
 * works transparently without touching any call sites.
 */
import { auth } from '../firebase/config'
import * as firestore from './firestoreService'
import * as memory    from './memoryService'

function svc() {
  return auth.currentUser?.isAnonymous ? memory : firestore
}

export const testFirestoreConnection = (...a) => svc().testFirestoreConnection(...a)
export const saveGeminiApiKey        = (...a) => svc().saveGeminiApiKey(...a)
export const getGeminiApiKey         = (...a) => svc().getGeminiApiKey(...a)

export const createFolder   = (...a) => svc().createFolder(...a)
export const getFolders     = (...a) => svc().getFolders(...a)
export const getAllFolders   = (...a) => svc().getAllFolders(...a)
export const getFolder      = (...a) => svc().getFolder(...a)
export const renameFolder   = (...a) => svc().renameFolder(...a)
export const deleteFolder   = (...a) => svc().deleteFolder(...a)

export const saveWorksheet  = (...a) => svc().saveWorksheet(...a)
export const getWorksheets  = (...a) => svc().getWorksheets(...a)
export const getWorksheet   = (...a) => svc().getWorksheet(...a)
export const deleteWorksheet= (...a) => svc().deleteWorksheet(...a)
export const moveWorksheet  = (...a) => svc().moveWorksheet(...a)
export const buildBreadcrumb= (...a) => svc().buildBreadcrumb(...a)

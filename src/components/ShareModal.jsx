import { useState, useEffect } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'
import { createShareToken } from '../utils/firestoreService'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'

export default function ShareModal({ worksheetId, worksheetHtml, name, onClose }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [token, setToken] = useState(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  const shareUrl = token ? `${window.location.origin}/s/${token}` : null

  useEffect(() => {
    if (!user) return
    setCreating(true)
    createShareToken(user.uid, worksheetId, worksheetHtml, name)
      .then(setToken)
      .catch(err => console.error('Share token error:', err))
      .finally(() => setCreating(false))
  }, [])

  useEffect(() => {
    if (!shareUrl) return
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(shareUrl, { width: 200, margin: 2, color: { dark: '#1e1b4b', light: '#fff' } })
        .then(url => setQrDataUrl(url))
        .catch(() => {})
    })
  }, [shareUrl])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">{t('shareWorksheet')}</h2>
            <p className="text-white/70 text-xs mt-0.5">{t('generatePublicLink')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-5">
          {creating ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="text-violet-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('creatingShareLink')}</p>
            </div>
          ) : (
            <>
              {qrDataUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrDataUrl} alt={t('qrCode')} className="w-36 h-36 rounded-xl shadow-md" />
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('shareUrl')}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl || ''}
                  className="input flex-1 text-xs"
                  onFocus={e => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                {t('anyoneWithLink')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

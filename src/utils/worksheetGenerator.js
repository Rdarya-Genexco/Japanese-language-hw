import { getLang } from './languages'
import DOMPurify from 'dompurify'
import { appError } from './appError'

/**
 * Generates a print-ready bilingual HTML string from worksheet JSON.
 * Target language is primary; English shown below in small italic gray.
 * Font and RTL direction are driven by worksheetData.language.
 */
export function generatePrintableHTML(worksheetData) {
  const { title, titleEn, subject, subjectEn, grade, instructions, instructionsEn, sections = [], totalPoints } = worksheetData
  const lang = getLang(worksheetData.language)
  const ui = lang.ui

  const sectionsHTML = sections.map((section, si) => {
    const questionsHTML = renderQuestions(section, ui)
    return `
      <div class="section">
        <div class="section-header">
          <span class="section-num">${si + 1}</span>
          <div class="section-title-wrap">
            <h2>${escHtml(section.sectionTitle || section.type)}</h2>
            ${section.sectionTitleEn ? `<span class="en-sub">${escHtml(section.sectionTitleEn)}</span>` : ''}
          </div>
          ${section.points ? `<span class="points">${section.points} ${ui.pts}</span>` : ''}
        </div>
        ${section.instructions ? `
          <div class="section-instr">
            ${escHtml(section.instructions)}
            ${section.instructionsEn ? `<br/><span class="en-sub">${escHtml(section.instructionsEn)}</span>` : ''}
          </div>` : ''}
        <div class="questions">
          ${questionsHTML}
        </div>
      </div>`
  }).join('')

  const isRTL = lang.dir === 'rtl'
  const rtlAttr = isRTL ? ' dir="rtl"' : ''
  const rtlCSS = isRTL ? `
    .page{direction:rtl;text-align:right}
    .section-header{flex-direction:row-reverse}
    .question{flex-direction:row-reverse}
    .q-num{text-align:left}
    .name-line{flex-direction:row-reverse}
    .overall-instr{border-left:none;border-right:4px solid #3b82f6}` : ''

  return `<!DOCTYPE html>
<html lang="${lang.code}"${rtlAttr}>
<head>
<meta charset="UTF-8"/>
<title>${escHtml(title || 'Worksheet')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=${lang.fontQuery}&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${lang.font},sans-serif;font-size:11pt;color:#1a1a1a;background:#fff}
  .page{max-width:210mm;margin:0 auto;padding:20mm;min-height:297mm}

  /* Header */
  .header{border-bottom:2px solid #1d4ed8;padding-bottom:10px;margin-bottom:16px}
  .header h1{font-size:17pt;font-weight:700;color:#1d4ed8;line-height:1.3}
  .title-en{font-size:10pt;font-weight:400;color:#6b7280;display:block;margin-top:3px;font-style:italic}
  .header-meta{display:flex;flex-wrap:wrap;gap:16px;font-size:9pt;color:#555;margin-top:8px}
  .overall-instr{background:#eff6ff;border-left:4px solid #3b82f6;padding:8px 12px;border-radius:0 4px 4px 0;margin-bottom:20px;font-size:10pt;color:#1e3a8a;line-height:1.5}

  /* Name fields */
  .name-line{display:flex;gap:24px;margin-bottom:14px}
  .name-field{flex:1;border-bottom:1px solid #666;padding-bottom:4px;font-size:9pt;color:#555}

  /* Sections */
  .section{margin-bottom:28px;break-inside:avoid-page}
  .section-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px}
  .section-num{background:#1d4ed8;color:#fff;font-weight:700;font-size:10pt;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .section-title-wrap{flex:1}
  .section-title-wrap h2{font-size:13pt;font-weight:600;color:#1d4ed8;line-height:1.3}
  .points{background:#dbeafe;color:#1d4ed8;font-size:9pt;padding:2px 8px;border-radius:12px;font-weight:600;flex-shrink:0;white-space:nowrap}
  .section-instr{font-size:9pt;color:#555;margin-bottom:10px;padding-left:32px;line-height:1.5}

  /* Questions */
  .questions{padding-left:4px}
  .question{margin-bottom:14px;display:flex;gap:8px;align-items:flex-start}
  .q-num{font-weight:700;color:#374151;min-width:26px;font-size:10pt;padding-top:2px}
  .q-text{flex:1;line-height:1.7}
  .q-main{display:block}

  /* English subtitle — shown below every primary-language line */
  .en-sub{font-size:8.5pt;color:#9ca3af;font-style:italic;display:block;margin-top:2px;line-height:1.4}

  /* Fill-blank */
  .blank{display:inline-block;border-bottom:1.5px solid #374151;min-width:64px;height:1.3em;vertical-align:bottom;margin:0 3px}

  /* Multiple choice */
  .options{margin-top:8px;padding-left:4px}
  .option-item{font-size:10pt;padding:3px 6px;line-height:1.6;margin-bottom:4px}

  /* True/false */
  .tf-choice{display:inline-flex;gap:16px;margin-top:6px}
  .tf-opt{border:1px solid #9ca3af;border-radius:4px;padding:3px 14px;font-size:10pt}

  /* Matching table */
  .matching-table{border-collapse:collapse;width:100%;margin-top:6px;font-size:10pt}
  .matching-table th{background:#1d4ed8;color:#fff;padding:6px 10px;text-align:left;font-weight:600;font-size:9.5pt}
  .matching-table td{border:1px solid #d1d5db;padding:6px 10px;vertical-align:top;line-height:1.5}
  .matching-table tr:nth-child(even) td{background:#f8fafc}
  .matching-table td:first-child{width:72%;font-weight:500}
  .matching-table td:last-child{width:28%;text-align:center}
  .answer-blank{display:inline-block;border-bottom:1.5px solid #374151;min-width:48px;height:1.2em;vertical-align:bottom}

  /* Word bank */
  .word-bank{margin-top:14px;border:1.5px solid #d1d5db;border-radius:6px;padding:10px 14px;background:#f9fafb}
  .word-bank-title{font-weight:700;font-size:9.5pt;color:#1d4ed8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em}
  .word-bank-grid{display:flex;flex-wrap:wrap;gap:6px 24px}
  .word-bank-item{font-size:10pt;line-height:1.5;min-width:160px}

  /* Answer lines */
  .answer-lines{margin-top:6px}
  .answer-line{border-bottom:1px solid #bbb;margin-bottom:10px;height:22px}

  /* Ordering */
  .ordering-item{border:1px solid #d1d5db;border-radius:4px;padding:5px 10px;margin:3px 0;display:flex;align-items:flex-start;gap:8px}
  .ordering-num{background:#e2e8f0;border-radius:3px;width:20px;height:20px;min-width:20px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;margin-top:1px}

  ${rtlCSS}
  @media print{
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .no-print{display:none!important}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>
      ${escHtml(title || 'Worksheet')}
      ${titleEn ? `<span class="title-en">${escHtml(titleEn)}</span>` : ''}
    </h1>
    <div class="header-meta">
      ${subject ? `<span>📚 ${escHtml(subject)}${subjectEn ? ` <em style="color:#9ca3af;font-style:italic;font-size:8.5pt">/ ${escHtml(subjectEn)}</em>` : ''}</span>` : ''}
      ${grade ? `<span>🎓 ${escHtml(grade)}</span>` : ''}
      ${totalPoints ? `<span>📊 ${ui.totalPts}: ${totalPoints}${ui.pts}</span>` : ''}
    </div>
  </div>
  <div class="name-line">
    <div class="name-field">${ui.name}：<span style="display:inline-block;min-width:120px"></span></div>
    <div class="name-field">${ui.cls}：<span style="display:inline-block;min-width:80px"></span></div>
    <div class="name-field">${ui.num}：<span style="display:inline-block;min-width:60px"></span></div>
  </div>
  ${instructions ? `<div class="overall-instr">📋 ${escHtml(instructions)}${instructionsEn ? `<span class="en-sub">${escHtml(instructionsEn)}</span>` : ''}</div>` : ''}
  ${sectionsHTML}
</div>
<div class="no-print" style="position:fixed;bottom:16px;right:16px;display:flex;gap:8px">
  <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ Print / PDF</button>
  <button onclick="window.close()" style="background:#fff;color:#374151;border:1px solid #d1d5db;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">✕ Close</button>
</div>
</body>
</html>`
}

// ── Section renderer ──────────────────────────────────────────────────────────

function renderQuestions(section, ui) {
  const qs = section.questions || []
  if (!qs.length) return `<p style="color:#9ca3af;font-size:10pt;padding-left:32px">${ui.noQ}</p>`

  switch (section.type) {
    case 'matching': {
      // Term column + blank answer column; word bank below (shuffled definitions)
      const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const n = qs.length
      // Rotate definitions so they don't align 1→A, 2→B etc.
      const shift = Math.floor(n / 2) + 1
      const wordBank = qs.map((_, j) => ({
        label: LABELS[j % 26],
        q: qs[(j + shift) % n],
      }))

      const rows = qs.map((q, i) => `<tr>
        <td>${i + 1}. <strong>${escHtml(q.left || '')}</strong>${q.leftEn ? `<br/><span class="en-sub">${escHtml(q.leftEn)}</span>` : ''}</td>
        <td><span class="answer-blank"></span></td>
      </tr>`).join('')

      const wbItems = wordBank.map(({ label, q }) => `
        <div class="word-bank-item">
          <strong>${label}.</strong> ${escHtml(q.right || '')}
          ${q.rightEn ? `<span class="en-sub">${escHtml(q.rightEn)}</span>` : ''}
        </div>`).join('')

      return `<table class="matching-table">
        <tr>
          <th>${ui.term}</th>
          <th>${ui.answer || 'Answer'}</th>
        </tr>
        ${rows}
      </table>
      <div class="word-bank">
        <div class="word-bank-title">📝 ${ui.wordBank || 'Word Bank'}</div>
        <div class="word-bank-grid">${wbItems}</div>
      </div>`
    }

    case 'ordering': {
      return qs.map((q, i) => `
        <div class="question">
          <span class="q-num">${i + 1}.</span>
          <div class="q-text">
            ${q.text ? `<span class="q-main">${escHtml(q.text)}</span>` : ''}
            ${q.textEn ? `<span class="en-sub">${escHtml(q.textEn)}</span>` : ''}
            <div style="margin-top:6px">
              ${(q.items || []).map((item, j) => `<div class="ordering-item">
                <span class="ordering-num">${j + 1}</span>
                <span>${escHtml(item)}${q.itemsEn?.[j] ? `<span class="en-sub">${escHtml(q.itemsEn[j])}</span>` : ''}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>`).join('')
    }

    default:
      return qs.map((q, i) => renderQuestion(q, i, section.type, ui)).join('')
  }
}

function renderQuestion(q, i, type, ui) {
  const num = q.id ?? i + 1
  let content = ''

  switch (type) {
    case 'fill_blank': {
      let text = escHtml(q.text || '').replace(/_{2,}/g, '<span class="blank"></span>')
      let textEn = q.textEn ? escHtml(q.textEn).replace(/_{2,}/g, '<span class="blank"></span>') : ''
      content = `<div class="q-text">
        <span class="q-main">${text}</span>
        ${textEn ? `<span class="en-sub">${textEn}</span>` : ''}
      </div>`
      break
    }

    case 'multiple_choice': {
      const opts = (q.options || []).map((o, oi) => `
        <div class="option-item">
          ${escHtml(o)}
          ${q.optionsEn?.[oi] ? `<span class="en-sub" style="padding-left:14px">${escHtml(q.optionsEn[oi])}</span>` : ''}
        </div>`).join('')
      content = `<div class="q-text">
        <span class="q-main">${escHtml(q.text || '')}</span>
        ${q.textEn ? `<span class="en-sub">${escHtml(q.textEn)}</span>` : ''}
        <div class="options">${opts}</div>
      </div>`
      break
    }

    case 'true_false': {
      content = `<div class="q-text">
        <span class="q-main">${escHtml(q.text || '')}</span>
        ${q.textEn ? `<span class="en-sub">${escHtml(q.textEn)}</span>` : ''}
        <div class="tf-choice">
          <span class="tf-opt">${ui.trueLabel}</span>
          <span class="tf-opt">${ui.falseLabel}</span>
        </div>
      </div>`
      break
    }

    case 'short_answer': {
      const lines = Array.from({ length: q.lines || 3 }, () => '<div class="answer-line"></div>').join('')
      // Use pre-wrap so multi-part sub-questions with \n are displayed correctly
      content = `<div class="q-text">
        <span class="q-main" style="white-space:pre-wrap">${escHtml(q.text || '')}</span>
        ${q.textEn ? `<span class="en-sub" style="white-space:pre-wrap">${escHtml(q.textEn)}</span>` : ''}
        <div class="answer-lines">${lines}</div>
      </div>`
      break
    }

    case 'essay': {
      const lines = Array.from({ length: q.lines || 8 }, () => '<div class="answer-line"></div>').join('')
      content = `<div class="q-text">
        <span class="q-main" style="white-space:pre-wrap">${escHtml(q.text || '')}</span>
        ${q.textEn ? `<span class="en-sub" style="white-space:pre-wrap">${escHtml(q.textEn)}</span>` : ''}
        <div class="answer-lines">${lines}</div>
      </div>`
      break
    }

    default: {
      content = `<div class="q-text">
        <span class="q-main">${escHtml(q.text || JSON.stringify(q))}</span>
      </div>`
    }
  }

  return `<div class="question"><span class="q-num">${num}.</span>${content}</div>`
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Print view ────────────────────────────────────────────────────────────────

/** Replace the [WORKSHEET_IMAGE] placeholder with the stored image URI, or drop it if there is none. */
export function hydrateWorksheetHtml(html, imageUri) {
  if (!html || !html.includes('[WORKSHEET_IMAGE]')) return html
  if (imageUri) return html.replace(/\[WORKSHEET_IMAGE\]/g, imageUri)
  return html
    .replace(/<img\b[^>]*\[WORKSHEET_IMAGE\][^>]*>/gi, '')
    .replace(/\[WORKSHEET_IMAGE\]/g, '')
}

/**
 * Worksheet HTML can come from other users (shared links, student submissions), so strip scripts,
 * event handlers and javascript: URLs before it touches a same-origin window or the app's DOM.
 */
export function sanitizeWorksheetHtml(html, { wholeDocument = true } = {}) {
  return DOMPurify.sanitize(html || '', {
    WHOLE_DOCUMENT: wholeDocument,
    ADD_TAGS: ['link', 'meta', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form'],
  })
}

/** Print worksheet HTML from a popup; window.open('') shares the app's origin, hence the sanitizing. */
export function printWorksheetHtml(html) {
  const win = window.open('', '_blank')
  if (!win) throw appError('allowPopups')
  win.document.write('<!DOCTYPE html>' + sanitizeWorksheetHtml(html))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 800)
}

export function openPrintView(worksheetData) {
  const html = generatePrintableHTML(worksheetData)
  const win = window.open('', '_blank')
  if (!win) throw appError('allowPopups')
  win.document.write(html)
  win.document.close()
}

// ── Downloads (loaded on demand) ─────────────────────────────────────────────
const exporter = () => import('./worksheetExport.js')

export async function downloadAsPdfFromHtml(html, filename) {
  return (await exporter()).downloadAsPdfFromHtml(html, filename)
}
export async function downloadAsDocxFromHtml(html, filename) {
  return (await exporter()).downloadAsDocxFromHtml(html, filename)
}
export async function downloadAsPdf(worksheetData) {
  return (await exporter()).downloadAsPdf(worksheetData)
}
export async function downloadAsDocx(worksheetData) {
  return (await exporter()).downloadAsDocx(worksheetData)
}

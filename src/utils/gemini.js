import { getLang } from './languages'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert an ArrayBuffer to a base64 string (chunked to avoid stack overflow). */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemInstruction(lang) {
  const isEnglish = lang.code === 'en'
  const targetDesc = isEnglish
    ? 'English (the target is English — the source worksheet may be in any language)'
    : lang.name

  return `You are a professional bilingual worksheet translator producing print-ready HTML.

TARGET LANGUAGE: ${targetDesc}

YOUR ONLY JOB: translate the document into ${targetDesc} and output a COMPLETE, SELF-CONTAINED HTML DOCUMENT — nothing else. Reproduce every element of the source exactly: if it is a syllabus, translate the syllabus; if it is a worksheet with questions, translate those questions. Never add, remove, or generate content.

WHAT YOU MUST NEVER DO:
• Never output JSON, markdown, plain text, or explanations — HTML ONLY
• Never add \`\`\`html fences — output raw HTML starting with <!DOCTYPE html>
• Never reorder, merge, split, add, or remove any question or section
• Never split a multi-part question (a) b) c)) into separate items
• Never combine separate numbered questions into one
• CRITICAL: Never generate, invent, or create questions, exercises, or tasks that do not already exist in the source document. If the input is a syllabus, course outline, notes, or any document with no questions — translate it exactly as-is into a clean HTML layout. Do not turn it into a question paper.

HTML REQUIREMENTS:
• Complete document: <!DOCTYPE html><html lang="${lang.code}">…</html>
• All CSS inside one <style> tag — NO external stylesheets, NO CDN links, NO JavaScript
• Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, 'Hiragino Sans', 'Meiryo', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', sans-serif
• Body: background #fff; color #111; max-width 860px; margin 0 auto; padding 28px 36px; line-height: 1.5
• Paragraphs and all text blocks: margin-top: 0; margin-bottom: 8pt; line-height: 1.5  (matches Word: Before 0pt / After 8pt / 1.5 lines)
• p, li, td, th, span { margin-top: 0; margin-bottom: 8pt; line-height: 1.5 }
• h1, h2, h3, h4 { margin-top: 0; margin-bottom: 8pt; line-height: 1.5 }
• Wrap EVERY question (stem + all its options/lines) in <div class="q-block"> with margin-bottom: 16pt and padding-bottom: 4pt so there is always whitespace between questions — this prevents questions from being sliced across page breaks when the PDF is generated
• Sections: padding 14px 16px; margin-bottom: 16pt
• @media print { body { margin: 1.27cm; padding: 0; } .no-print { display:none; } }

BILINGUAL SUBTITLE RULE (MANDATORY):
${isEnglish
  ? '• The target IS English — do NOT add any subtitle below questions. Output only the English translation, nothing else beneath each question.'
  : `• EVERY question stem MUST be immediately followed by the original English text as a subtitle — on its own line, inside the same q-block div, styled as: <div class="en-sub">original English text here</div>
• Add this CSS to your <style> tag: .en-sub { font-size: 0.82em; color: #777; font-style: italic; margin-top: 2pt; margin-bottom: 4pt; }
• Example structure for a non-English question:
  <div class="q-block">
    <p>1. フランスの首都はどこですか？</p>
    <div class="en-sub">1. What is the capital of France?</div>
    <div class="options">…</div>
  </div>
• If the source text IS already English, copy it as the subtitle unchanged. Never skip the subtitle on any question.`}

LAYOUT STRUCTURE:
• Header block: translated title (large bold), original-language title below in gray italic, subject / grade / total points as small pills
• Global instructions box (if any): light blue background, left border
• Sections: numbered circle badge + section title (bold) + section instructions (small italic)
• Questions: inside q-block — translated question first (dark, readable), then .en-sub subtitle${isEnglish ? ' (omitted for English target)' : ' (English source, always present)'}
• Answer spaces: horizontal ruled lines for short_answer/essay; leave blank table cells for matching right column; underlines for fill-in-the-blank

QUESTION TYPE FORMATTING:
• fill_blank: inline underline spans ___ where student writes; include translated text + answer key context
• multiple_choice: A B C D options listed below question, each on its own line with a leading circle ○
• true_false: question text + ○ True  ×/✗ False choice boxes on same line
• matching: two-column table — left: term (translated) with original below; right: blank box for student to write answer; add a shuffled word bank below the table
• ordering: numbered blank lines for student to write the sequence
• short_answer: 3 ruled lines below question
• essay: 6–8 ruled lines below question

TRANSLATION RULES:
• Translate with complete accuracy and natural ${targetDesc} fluency
• Preserve all numbers, symbols, units, formulas, equations exactly
• Keep question labels exactly: "a)", "b)", "1.", "(i)", etc.
• A question with sub-parts a) b) c) is ONE question — keep all sub-parts in one block

IMAGE EMBEDDING RULE (applies when the source is a photo or image file):
• Wherever the source image/photo belongs in the layout, output this EXACT tag — nothing else, no gray box, no bracket description: <img src="[WORKSHEET_IMAGE]" class="ws-photo" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto 12pt;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
• The placeholder [WORKSHEET_IMAGE] will be replaced with the real image automatically — do NOT write a data URI yourself
• Do NOT wrap it in a gray div or write [Photo A: …] alt-text descriptions in brackets

OUTPUT: Start immediately with <!DOCTYPE html> — no preamble, no explanation.`
}

function buildHtmlPrompt(lang) {
  return `Translate the document below into ${lang.name}.
Reproduce every element exactly as it appears — sections, headings, bullet points, questions, tables, notes. Do not add, remove, or rearrange anything.
Output a single complete self-contained HTML document — nothing else.

--- DOCUMENT CONTENT BELOW ---
`
}

// ── Gemini API ────────────────────────────────────────────────────────────────

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Models in priority order — first available wins
const MODEL_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro',
]

const TIMEOUT_MS = 180_000 // 3 min — PDF+HTML is heavier than JSON

async function callGemini(model, body, apiKey) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new Error('AI processing timed out. Please try again.')
    throw err
  }
  clearTimeout(timer)
  return response
}

/**
 * Translate a worksheet with Gemini and return a complete HTML document string.
 *
 * @param {ArrayBuffer|string} fileData  Raw PDF bytes (ArrayBuffer) or extracted text (string)
 * @param {string} mimeType             'application/pdf' or 'text/plain'
 * @param {string|null} apiKey          Gemini API key (falls back to env var)
 * @param {string} langCode             Target language code, e.g. 'ja', 'en', 'fr'
 * @returns {Promise<string>}           Self-contained HTML document
 */
export async function processWorksheetWithGemini(fileData, mimeType, apiKey, langCode = 'ja') {
  if (!apiKey) apiKey = DEFAULT_API_KEY

  const lang = getLang(langCode)
  const systemInstruction = buildSystemInstruction(lang)
  const prompt = buildHtmlPrompt(lang)

  // Build content parts: prompt text + file data
  const contentParts = []
  contentParts.push({ text: prompt })

  const BINARY_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ]

  if (BINARY_MIME_TYPES.includes(mimeType) && fileData instanceof ArrayBuffer) {
    // Send raw bytes inline — Gemini reads PDF, images and PPTX natively
    const b64 = arrayBufferToBase64(fileData)
    contentParts.push({ inline_data: { mime_type: mimeType, data: b64 } })
  } else if (mimeType === 'text/html') {
    // DOCX converted to HTML by mammoth — tell Gemini it's HTML markup so it
    // reads tables, headings, bold/italic properly instead of treating it as prose
    contentParts.push({ text: 'The worksheet content below is HTML extracted from a Word document. Read all structural elements (tables, headings, lists, bold text) as part of the worksheet layout:\n\n' + String(fileData) })
  } else {
    // Plain text fallback
    contentParts.push({ text: String(fileData) })
  }

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: contentParts }],
    generationConfig: {
      temperature: 0.1,
      // No responseMimeType restriction — we want HTML text back
    },
  }

  let lastErr = 'unknown error'

  for (const model of MODEL_CHAIN) {
    let response
    try {
      response = await callGemini(model, body, apiKey)
    } catch (err) {
      if (err.message === 'AI processing timed out. Please try again.') throw err
      throw new Error(`Network error: ${err.message}`)
    }

    // Overloaded / rate-limited → try next model
    if (response.status === 503 || response.status === 429) {
      const errBody = await response.json().catch(() => ({}))
      lastErr = errBody?.error?.message || `HTTP ${response.status}`
      console.warn(`[Gemini] ${model} unavailable (${response.status}), trying next…`)
      continue
    }

    // Model doesn't exist → try next
    if (response.status === 404 || response.status === 400) {
      const errBody = await response.json().catch(() => ({}))
      lastErr = errBody?.error?.message || `HTTP ${response.status}`
      console.warn(`[Gemini] ${model} not available (${response.status}), trying next…`)
      continue
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = err?.error?.message || `API error (${response.status})`
      throw new Error(`Gemini: ${msg}`)
    }

    const data = await response.json()
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) throw new Error('No response from AI. Please try again.')

    // Strip markdown fences if model wrapped output
    rawText = rawText.trim()
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    }

    // Validate it looks like HTML
    if (!rawText.includes('<html') && !rawText.includes('<!DOCTYPE')) {
      // Wrap bare content in a minimal document
      rawText = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:24px 32px;color:#111}p{white-space:pre-wrap}</style></head><body>${rawText}</body></html>`
    }

    // For image uploads: inject the actual photo into the HTML output
    const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg']
    if (IMAGE_MIME_TYPES.includes(mimeType) && fileData instanceof ArrayBuffer) {
      const b64     = arrayBufferToBase64(fileData)
      const dataUri = `data:${mimeType};base64,${b64}`
      const imgTag  = `<img src="${dataUri}" class="ws-photo" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto 12pt;box-shadow:0 2px 8px rgba(0,0,0,0.12);">`

      if (rawText.includes('[WORKSHEET_IMAGE]')) {
        // Gemini used the placeholder — swap it in
        rawText = rawText.replace(/\[WORKSHEET_IMAGE\]/g, dataUri)
      } else {
        // Fallback: prepend the image at the very top of <body>
        rawText = rawText.replace(/<body([^>]*)>/, `<body$1>\n<div style="text-align:center;margin-bottom:16pt">${imgTag}</div>`)
      }
    }

    return rawText  // HTML string
  }

  throw new Error(`All Gemini models are busy. Please try again in a moment. (${lastErr})`)
}

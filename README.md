# Doc Translate

Translate worksheets into any of 10 languages with AI, keep them in a personal drive, and run classes with assignments.

## Features

- **Translate worksheets**: upload a PDF, DOCX, PPTX, PNG or JPG; Gemini returns a translated, printable worksheet.
- **Drive**: folders, drag-and-drop, print, PDF and Word export, share links with QR codes.
- **Classes (teachers)**: class codes, student roster (remove students, delete classes), assignments with due dates, viewing student submissions and feedback, Late/Overdue labels.
- **Students**: join a class from Settings, submit once per assignment (with optional feedback and worksheet), unsubmit; submissions stay open 10 days past the due date, then close.
- **10 languages** for the UI and translations: English, 简体中文, 日本語, Français, Deutsch, Italiano, Português, Español, 한국어, Русский.

## How it fits together

- **App**: React + Vite + Tailwind, installable as a PWA. Hosted on Netlify (deploys `main`).
- **Data**: Cloud Firestore database named **`lang`**, accessed over the REST API. Access is enforced by `firestore.rules`.
- **AI**: the browser calls `/api/gemini`, a Netlify Edge Function (`netlify/edge-functions/gemini.js`). It checks the user's Firebase sign-in, allows only the app's Gemini models, and adds the API key on the server, so the key never reaches the browser.
- **Sign-in**: Firebase Authentication with Google.

## Setup

1. **Firebase**: create a project with Google sign-in and a Firestore database named `lang`.
2. **Firestore rules**: paste `firestore.rules` into Firebase Console → Firestore → `lang` → Rules, and publish. Re-publish whenever that file changes.
3. **Netlify environment variables**:

   | Variable | Scope | Notes |
   | --- | --- | --- |
   | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Builds, Functions | Firebase web config (public by design) |
   | `GEMINI_API_KEY` | Functions | Server-only. Never prefix it with `VITE_`: those are built into the public app. |

   After changing variables, redeploy.

## Development

```bash
npm install
cp .env.example .env.local   # fill in the Firebase values
npm run dev                  # app + /api/gemini (set GEMINI_API_KEY in .env or .env.local)
npx netlify dev              # same, through Netlify's own dev server
```

Scripts:

- `npm run build`: production build into `dist/`
- `npm run lint`: lint with oxlint
- `npm run test:proxy`: tests for the Gemini Edge Function's sign-in and model checks

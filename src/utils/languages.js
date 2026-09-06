/**
 * Supported target languages for worksheet translation.
 * 10 languages: English, Chinese, Japanese, French, German, Italian, Portuguese, Spanish, Korean, Russian
 */

export const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    native: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Name', cls: 'Class', num: 'No.', date: 'Date',
      totalPts: 'Total', pts: 'pts', noQ: 'No questions',
      term: 'Term', desc: 'Definition', answer: 'Answer', wordBank: 'Word Bank',
      trueLabel: '✓ True', falseLabel: '✗ False',
    },
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    native: '简体中文',
    flag: '🇨🇳',
    dir: 'ltr',
    font: "'Noto Sans SC'",
    fontQuery: 'Noto+Sans+SC:wght@400;500;700',
    ui: {
      name: '姓名', cls: '班级', num: '学号', date: '日期',
      totalPts: '总分', pts: '分', noQ: '无题目',
      term: '术语', desc: '解释', answer: '答案', wordBank: '词库',
      trueLabel: '✓ 正确', falseLabel: '✗ 错误',
    },
  },
  {
    code: 'ja',
    name: 'Japanese',
    native: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    font: "'Noto Sans JP'",
    fontQuery: 'Noto+Sans+JP:wght@400;500;700',
    ui: {
      name: '名前', cls: 'クラス', num: '番号', date: '日付',
      totalPts: '合計', pts: '点', noQ: '問題なし',
      term: '用語', desc: '説明', answer: '答え', wordBank: '語彙リスト',
      trueLabel: '○ 正しい', falseLabel: '× 誤り',
    },
  },
  {
    code: 'fr',
    name: 'French',
    native: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Nom', cls: 'Classe', num: 'N°', date: 'Date',
      totalPts: 'Total', pts: 'pts', noQ: 'Aucune question',
      term: 'Terme', desc: 'Définition', answer: 'Réponse', wordBank: 'Liste de mots',
      trueLabel: '✓ Vrai', falseLabel: '✗ Faux',
    },
  },
  {
    code: 'de',
    name: 'German',
    native: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Name', cls: 'Klasse', num: 'Nr.', date: 'Datum',
      totalPts: 'Gesamt', pts: 'Pkt', noQ: 'Keine Fragen',
      term: 'Begriff', desc: 'Definition', answer: 'Antwort', wordBank: 'Wortliste',
      trueLabel: '✓ Wahr', falseLabel: '✗ Falsch',
    },
  },
  {
    code: 'it',
    name: 'Italian',
    native: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Nome', cls: 'Classe', num: 'N°', date: 'Data',
      totalPts: 'Totale', pts: 'pt', noQ: 'Nessuna domanda',
      term: 'Termine', desc: 'Definizione', answer: 'Risposta', wordBank: 'Lista parole',
      trueLabel: '✓ Vero', falseLabel: '✗ Falso',
    },
  },
  {
    code: 'pt',
    name: 'Portuguese',
    native: 'Português',
    flag: '🇵🇹',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Nome', cls: 'Turma', num: 'N°', date: 'Data',
      totalPts: 'Total', pts: 'pts', noQ: 'Sem perguntas',
      term: 'Termo', desc: 'Definição', answer: 'Resposta', wordBank: 'Banco de palavras',
      trueLabel: '✓ Verdadeiro', falseLabel: '✗ Falso',
    },
  },
  {
    code: 'es',
    name: 'Spanish',
    native: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Nombre', cls: 'Clase', num: 'N°', date: 'Fecha',
      totalPts: 'Total', pts: 'pts', noQ: 'Sin preguntas',
      term: 'Término', desc: 'Definición', answer: 'Respuesta', wordBank: 'Banco de palabras',
      trueLabel: '✓ Verdadero', falseLabel: '✗ Falso',
    },
  },
  {
    code: 'ko',
    name: 'Korean',
    native: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    font: "'Noto Sans KR'",
    fontQuery: 'Noto+Sans+KR:wght@400;500;700',
    ui: {
      name: '이름', cls: '학반', num: '번호', date: '날짜',
      totalPts: '합계', pts: '점', noQ: '문제 없음',
      term: '용어', desc: '정의', answer: '답', wordBank: '단어 목록',
      trueLabel: '○ 맞음', falseLabel: '× 틀림',
    },
  },
  {
    code: 'ru',
    name: 'Russian',
    native: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
    font: "'Noto Sans'",
    fontQuery: 'Noto+Sans:wght@400;500;700',
    ui: {
      name: 'Имя', cls: 'Класс', num: '№', date: 'Дата',
      totalPts: 'Итого', pts: 'б', noQ: 'Нет вопросов',
      term: 'Термин', desc: 'Определение', answer: 'Ответ', wordBank: 'Словарный банк',
      trueLabel: '✓ Верно', falseLabel: '✗ Неверно',
    },
  },
]

/** Look up a language by code; falls back to Japanese. */
export function getLang(code) {
  return LANGUAGES.find(l => l.code === code) ?? LANGUAGES[2] // default: Japanese (index 2 after English)
}

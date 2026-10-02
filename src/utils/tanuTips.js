/**
 * Tanu's tips, shown in the selected language: the general tips plus that language's own tips.
 */

export const TANU_UI = {
  'en':    { ask: 'Ask Tanu for a tip!',            dismiss: 'Dismiss Tanu' },
  'zh-CN': { ask: '问问 Tanu 有什么小贴士！',          dismiss: '关闭 Tanu' },
  'ja':    { ask: 'Tanuにヒントを聞いてみよう！',      dismiss: 'Tanuを閉じる' },
  'fr':    { ask: 'Demande une astuce à Tanu !',     dismiss: 'Fermer Tanu' },
  'de':    { ask: 'Frag Tanu nach einem Tipp!',      dismiss: 'Tanu schließen' },
  'it':    { ask: 'Chiedi un consiglio a Tanu!',     dismiss: 'Chiudi Tanu' },
  'pt':    { ask: 'Peça uma dica ao Tanu!',          dismiss: 'Fechar o Tanu' },
  'es':    { ask: '¡Pídele un consejo a Tanu!',      dismiss: 'Cerrar a Tanu' },
  'ko':    { ask: 'Tanu에게 팁을 물어보세요!',          dismiss: 'Tanu 닫기' },
  'ru':    { ask: 'Попроси у Тану совет!',           dismiss: 'Закрыть Тану' },
}

export const GENERAL_TIPS = [
  {
    emoji: '🧠',
    text: {
      'en': 'Review vocabulary right before sleep — your brain locks in memories overnight!',
      'zh-CN': '睡前复习单词——大脑会在夜里把记忆牢牢锁住！',
      'ja': '寝る前に単語を復習しよう。脳は夜のあいだに記憶をしっかり固めてくれるよ！',
      'fr': 'Révise ton vocabulaire juste avant de dormir : ton cerveau grave les souvenirs pendant la nuit !',
      'de': 'Wiederhole Vokabeln kurz vor dem Schlafen – dein Gehirn speichert Erinnerungen über Nacht!',
      'it': 'Ripassa il vocabolario subito prima di dormire: il tuo cervello fissa i ricordi durante la notte!',
      'pt': 'Revise o vocabulário logo antes de dormir — seu cérebro fixa as memórias durante a noite!',
      'es': 'Repasa el vocabulario justo antes de dormir: ¡tu cerebro fija los recuerdos durante la noche!',
      'ko': '자기 전에 단어를 복습해요. 뇌는 밤사이에 기억을 단단히 저장해요!',
      'ru': 'Повторяй слова прямо перед сном — за ночь мозг надёжно закрепляет воспоминания!',
    },
  },
  {
    emoji: '⭐',
    text: {
      'en': '3 new words per day = 1,000+ words in a year. Tiny steps, huge results!',
      'zh-CN': '每天学3个新词，一年就是1000多个词。小步积累，大大收获！',
      'ja': '1日3つの新しい単語で、1年で1,000語以上！小さな一歩が大きな成果になるよ！',
      'fr': '3 nouveaux mots par jour = plus de 1 000 mots en un an. Petits pas, grands résultats !',
      'de': '3 neue Wörter pro Tag = über 1.000 Wörter im Jahr. Kleine Schritte, große Wirkung!',
      'it': '3 parole nuove al giorno = più di 1.000 parole in un anno. Piccoli passi, grandi risultati!',
      'pt': '3 palavras novas por dia = mais de 1.000 palavras em um ano. Pequenos passos, grandes resultados!',
      'es': '3 palabras nuevas al día = más de 1.000 palabras en un año. ¡Pasos pequeños, grandes resultados!',
      'ko': '하루에 새 단어 3개면 1년에 1,000개 이상! 작은 걸음이 큰 결과를 만들어요!',
      'ru': '3 новых слова в день = больше 1000 слов за год. Маленькие шаги — большие результаты!',
    },
  },
  {
    emoji: '📖',
    text: {
      'en': 'After you get a translation, read the original worksheet out loud too. Your ears learn as well as your eyes!',
      'zh-CN': '拿到翻译后，也把原来的练习单大声读一遍。耳朵和眼睛一起学习！',
      'ja': '翻訳をもらったら、元のワークシートも声に出して読んでみよう。目だけでなく耳でも覚えられるよ！',
      'fr': 'Après avoir reçu une traduction, lis aussi la fiche originale à voix haute. Tes oreilles apprennent autant que tes yeux !',
      'de': 'Lies nach der Übersetzung auch das Original-Arbeitsblatt laut vor. Deine Ohren lernen genauso mit wie deine Augen!',
      'it': 'Dopo aver ricevuto una traduzione, leggi ad alta voce anche la scheda originale. Le orecchie imparano quanto gli occhi!',
      'pt': 'Depois de receber uma tradução, leia também a folha original em voz alta. Seus ouvidos aprendem tanto quanto seus olhos!',
      'es': 'Después de recibir una traducción, lee también la ficha original en voz alta. ¡Tus oídos aprenden tanto como tus ojos!',
      'ko': '번역을 받은 뒤에는 원래 학습지도 소리 내어 읽어 보세요. 눈뿐만 아니라 귀로도 배울 수 있어요!',
      'ru': 'Получив перевод, прочитай вслух и исходный рабочий лист. Уши учатся не хуже глаз!',
    },
  },
  {
    emoji: '🗣️',
    text: {
      'en': 'Say new words out loud. Speaking them makes them stick much faster than just reading.',
      'zh-CN': '把新词大声说出来。开口说比只看记得快得多。',
      'ja': '新しい単語は声に出して言おう。読むだけよりずっと早く覚えられるよ。',
      'fr': 'Dis les nouveaux mots à voix haute. Les prononcer aide à les retenir bien plus vite que de simplement les lire.',
      'de': 'Sprich neue Wörter laut aus. So bleiben sie viel schneller hängen als beim bloßen Lesen.',
      'it': 'Pronuncia ad alta voce le parole nuove. Dirle aiuta a ricordarle molto più in fretta che leggerle soltanto.',
      'pt': 'Diga as palavras novas em voz alta. Falar ajuda a guardá-las muito mais rápido do que só ler.',
      'es': 'Di las palabras nuevas en voz alta. Pronunciarlas hace que se te queden mucho más rápido que solo leerlas.',
      'ko': '새 단어는 소리 내어 말해 보세요. 읽기만 할 때보다 훨씬 빨리 기억에 남아요.',
      'ru': 'Произноси новые слова вслух. Так они запоминаются гораздо быстрее, чем при простом чтении.',
    },
  },
  {
    emoji: '📝',
    text: {
      'en': 'Writing words by hand beats typing for memory. Try just 5 minutes a day!',
      'zh-CN': '手写单词比打字更容易记住。每天试试写5分钟！',
      'ja': '手で書くと、タイピングよりよく覚えられるよ。1日5分だけでも試してみて！',
      'fr': 'Écrire les mots à la main aide plus la mémoire que de les taper. Essaie juste 5 minutes par jour !',
      'de': 'Wörter mit der Hand zu schreiben hilft dem Gedächtnis mehr als Tippen. Probier es nur 5 Minuten am Tag!',
      'it': 'Scrivere le parole a mano aiuta la memoria più che digitarle. Prova solo 5 minuti al giorno!',
      'pt': 'Escrever as palavras à mão ajuda mais a memória do que digitar. Experimente só 5 minutos por dia!',
      'es': 'Escribir las palabras a mano ayuda más a la memoria que teclearlas. ¡Prueba solo 5 minutos al día!',
      'ko': '손으로 단어를 쓰면 타자를 칠 때보다 더 잘 기억돼요. 하루 5분만 해 보세요!',
      'ru': 'Писать слова от руки полезнее для памяти, чем печатать. Попробуй всего 5 минут в день!',
    },
  },
  {
    emoji: '🎬',
    text: {
      'en': "Watch shows with subtitles in the language you're learning — fun AND practice!",
      'zh-CN': '看节目时打开你正在学的语言的字幕——既好玩又能练习！',
      'ja': '学んでいる言語の字幕で番組を見よう。楽しくて練習にもなるよ！',
      'fr': 'Regarde des séries avec des sous-titres dans la langue que tu apprends : amusant ET utile !',
      'de': 'Schau Serien mit Untertiteln in der Sprache, die du lernst – Spaß UND Übung!',
      'it': 'Guarda serie con i sottotitoli nella lingua che stai imparando: divertimento E pratica!',
      'pt': 'Assista a séries com legendas no idioma que você está aprendendo — diversão E prática!',
      'es': 'Mira series con subtítulos en el idioma que estás aprendiendo: ¡diversión Y práctica!',
      'ko': '배우고 있는 언어의 자막으로 영상을 보세요. 재미도 있고 연습도 돼요!',
      'ru': 'Смотри сериалы с субтитрами на языке, который учишь, — и весело, и полезно!',
    },
  },
  {
    emoji: '🃏',
    text: {
      'en': 'Put a picture on your flashcards. Linking words to images beats memorising lists.',
      'zh-CN': '在单词卡上画一张图。把词和图片联系起来，比死记单词表有效得多。',
      'ja': '単語カードに絵をかこう。言葉と絵を結びつけると、リストを丸暗記するより覚えやすいよ。',
      'fr': 'Ajoute une image sur tes cartes mémoire. Associer les mots à des images marche mieux que d\'apprendre des listes.',
      'de': 'Mal ein Bild auf deine Karteikarten. Wörter mit Bildern zu verknüpfen wirkt besser, als Listen auswendig zu lernen.',
      'it': 'Metti un disegno sulle tue flashcard. Collegare le parole alle immagini funziona meglio che memorizzare elenchi.',
      'pt': 'Coloque um desenho nos seus cartões de estudo. Ligar palavras a imagens funciona melhor do que decorar listas.',
      'es': 'Pon un dibujo en tus tarjetas de estudio. Relacionar palabras con imágenes funciona mejor que memorizar listas.',
      'ko': '단어 카드에 그림을 그려 넣으세요. 단어를 그림과 연결하면 목록을 외우는 것보다 효과적이에요.',
      'ru': 'Добавь рисунок на свои карточки. Связывать слова с картинками лучше, чем зубрить списки.',
    },
  },
  {
    emoji: '🔁',
    text: {
      'en': 'Mistakes are progress! Each one shows you exactly what to practise next.',
      'zh-CN': '犯错就是进步！每个错误都会告诉你下一步该练什么。',
      'ja': 'まちがいは成長のしるし！次に何を練習すればいいか教えてくれるよ。',
      'fr': 'Les erreurs, c\'est du progrès ! Chacune te montre exactement ce qu\'il faut travailler ensuite.',
      'de': 'Fehler sind Fortschritt! Jeder zeigt dir genau, was du als Nächstes üben solltest.',
      'it': 'Gli errori sono progressi! Ognuno ti mostra esattamente cosa esercitare dopo.',
      'pt': 'Errar é progredir! Cada erro mostra exatamente o que praticar em seguida.',
      'es': '¡Los errores son progreso! Cada uno te muestra exactamente qué practicar después.',
      'ko': '실수는 발전이에요! 실수 하나하나가 다음에 무엇을 연습할지 알려 줘요.',
      'ru': 'Ошибки — это прогресс! Каждая показывает, что именно стоит потренировать дальше.',
    },
  },
  {
    emoji: '🦝',
    text: {
      'en': "You're doing amazing! Every worksheet you complete is one step closer to fluency!",
      'zh-CN': '你做得太棒了！每完成一张练习单，就离流利更近一步！',
      'ja': 'すごくがんばってるね！ワークシートを1枚終えるたびに、上達に一歩近づいているよ！',
      'fr': 'Tu te débrouilles super bien ! Chaque fiche terminée te rapproche un peu plus de l\'aisance !',
      'de': 'Du machst das großartig! Jedes fertige Arbeitsblatt bringt dich dem fließenden Sprechen einen Schritt näher!',
      'it': 'Stai andando alla grande! Ogni scheda che completi ti avvicina di un passo alla padronanza della lingua!',
      'pt': 'Você está indo muito bem! Cada folha que você completa é mais um passo rumo à fluência!',
      'es': '¡Lo estás haciendo genial! ¡Cada ficha que completas es un paso más hacia la fluidez!',
      'ko': '정말 잘하고 있어요! 학습지를 하나 끝낼 때마다 유창함에 한 걸음 더 가까워져요!',
      'ru': 'У тебя отлично получается! Каждый выполненный рабочий лист — ещё один шаг к свободному владению языком!',
    },
  },
]

// Each language's own tips, written in that language.
export const LANGUAGE_TIPS = {
  'en': [
    { emoji: '📏', text: 'English spelling is tricky: "though", "through" and "tough" all sound different!' },
    { emoji: '⏳', text: 'Most past tenses add -ed (walk → walked), but common verbs are irregular: go → went.' },
    { emoji: '🔤', text: 'Adjectives come before nouns in English: "a red car", not "a car red".' },
    { emoji: '🧩', text: 'Phrasal verbs change meaning with one small word: "look up", "look after", "look out".' },
  ],
  'zh-CN': [
    { emoji: '🎶', text: '普通话有4个声调。mā（妈）和 mǎ（马）只差一个声调——大声读出来试试！' },
    { emoji: '🧩', text: '汉字是由部件组成的：好 = 女 + 子。' },
    { emoji: '⏰', text: '中文动词不随过去或将来变化，靠“了”和“明天”这样的词来表示时间。' },
    { emoji: '🔤', text: '拼音是你的好帮手：它用拉丁字母标出每个汉字的读音。' },
  ],
  'ja': [
    { emoji: '🌸', text: 'まずはひらがな！46文字をマスターすれば、日本語がぐんと分かるようになるよ。' },
    { emoji: '🎯', text: '「は」は話題、「を」は目的語、「に」は方向を表すよ。この3つをマスターしよう！' },
    { emoji: '💬', text: '日本語では動詞が文の最後にくるよ：「りんごを食べる」。' },
    { emoji: '🌍', text: 'カタカナは外来語に使うよ：テレビ、パン。まわりで探してみよう！' },
  ],
  'fr': [
    { emoji: '🌹', text: 'Chaque nom français est masculin ou féminin. Apprends le/la avec le mot : la table, le livre.' },
    { emoji: '🤫', text: 'Beaucoup de lettres finales sont muettes : dans « petit », on n\'entend pas le t.' },
    { emoji: '🔗', text: 'La liaison : dans « les amis », le s se prononce [z] et se lie à la voyelle suivante.' },
    { emoji: '👋', text: 'Dis « vous » aux enseignants et aux adultes, et « tu » à tes amis.' },
  ],
  'de': [
    { emoji: '🏗️', text: 'Im Deutschen werden Wörter zusammengesetzt: Hand + Schuh = Handschuh!' },
    { emoji: '🔠', text: 'Jedes deutsche Nomen beginnt mit einem Großbuchstaben: der Hund, die Katze, das Buch.' },
    { emoji: '🎯', text: 'Im Hauptsatz steht das Verb an zweiter Stelle: „Heute spiele ich Fußball.“' },
    { emoji: '🎨', text: 'Lerne der/die/das mit jedem Nomen – der Artikel zeigt dir das Geschlecht.' },
  ],
  'it': [
    { emoji: '🎵', text: 'L\'italiano si legge come si scrive: impara i suoni e potrai leggere ad alta voce quasi tutto.' },
    { emoji: '🍕', text: 'I nomi in -o di solito sono maschili, quelli in -a femminili: il libro, la pizza.' },
    { emoji: '✌️', text: 'Al plurale cambia l\'ultima vocale: libro → libri, pizza → pizze.' },
    { emoji: '👀', text: 'Attenzione alle doppie: «pala» e «palla» sono parole diverse — tieni il suono più a lungo!' },
  ],
  'pt': [
    { emoji: '👃', text: 'O português tem vogais nasais, muitas vezes marcadas com ~: "pão", "mãe".' },
    { emoji: '🔀', text: 'Ser ou estar? Use ser para o que é permanente e estar para o que é temporário.' },
    { emoji: '🌎', text: 'O português do Brasil e o de Portugal soam diferentes, mas os dois estão certos!' },
    { emoji: '🍫', text: 'Muitas palavras em -ção correspondem ao inglês "-tion": informação = information.' },
  ],
  'es': [
    { emoji: '🔀', text: '¿Ser o estar? Usa ser para lo que algo es y estar para cómo o dónde está.' },
    { emoji: '🔤', text: 'El español es muy fonético: si conoces los sonidos, puedes leer en voz alta casi cualquier palabra.' },
    { emoji: '❓', text: 'Las preguntas empiezan con un signo al revés: ¿Cómo estás?' },
    { emoji: '🌐', text: 'Muchas palabras inglesas en "-tion" terminan en "-ción" en español: nación, información.' },
  ],
  'ko': [
    { emoji: '🧱', text: '한글의 기본 글자는 24개뿐이고, 모아서 음절을 만들어요: ㅎ + ㅏ + ㄴ = 한.' },
    { emoji: '🎯', text: '한국어는 동사가 문장 끝에 와요: "저는 사과를 먹어요".' },
    { emoji: '🙇', text: '문장 끝에 "요"를 붙이면 공손한 말이 돼요. 선생님께 말할 때 딱 좋아요.' },
    { emoji: '🏷️', text: '조사는 단어의 역할을 알려 줘요: 은/는은 주제, 을/를은 목적어를 나타내요.' },
  ],
  'ru': [
    { emoji: '🔡', text: 'В русском алфавите 33 буквы. Некоторые похожи на латинские, но звучат иначе: Р, Н, С.' },
    { emoji: '🧩', text: 'Существительные меняют окончание в зависимости от роли в предложении: книга → «Я читаю книгу».' },
    { emoji: '🎯', text: 'Ударение может падать на любой слог и меняет звучание — отмечай его, когда учишь слово.' },
    { emoji: '✨', text: 'В русском нет артиклей, как английские «the» и «a», — одной заботой меньше!' },
  ],
}

export function getTanuTips(langCode) {
  const general = GENERAL_TIPS.map(t => ({ emoji: t.emoji, text: t.text[langCode] || t.text.en }))
  return [...general, ...(LANGUAGE_TIPS[langCode] || [])]
}

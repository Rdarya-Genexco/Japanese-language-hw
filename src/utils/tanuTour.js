// Tanu's first-run tour, per role, in every app language. Generated text; keep the 10 languages in step.

/** Fired (e.g. from Settings) to start the tour again. */
export const TOUR_REPLAY_EVENT = 'tanu-tour-replay'

export const TOUR_STEPS = {
  welcomeS: { emoji: "👋", text: {
    "en": ["Hi, I'm Tanu!", "Let me show you around Doc Translate. It only takes a minute."],
    "zh-CN": ["你好，我是 Tanu！", "让我带你熟悉一下 Doc Translate，只需一分钟。"],
    "ja": ["こんにちは、Tanuだよ！", "Doc Translateの使い方を案内するね。1分で終わるよ。"],
    "fr": ["Salut, je suis Tanu !", "Je te fais visiter Doc Translate. Ça ne prend qu’une minute."],
    "de": ["Hallo, ich bin Tanu!", "Ich zeige dir kurz Doc Translate. Das dauert nur eine Minute."],
    "it": ["Ciao, sono Tanu!", "Ti mostro come funziona Doc Translate. Ci vuole solo un minuto."],
    "pt": ["Oi, eu sou o Tanu!", "Vou te mostrar o Doc Translate. Leva só um minuto."],
    "es": ["¡Hola, soy Tanu!", "Te enseño Doc Translate. Solo tardamos un minuto."],
    "ko": ["안녕, 나는 Tanu야!", "Doc Translate 사용법을 알려 줄게. 1분이면 돼."],
    "ru": ["Привет, я Тану!", "Давай я покажу тебе Doc Translate. Это займёт всего минуту."],
  } },
  welcomeT: { emoji: "👋", text: {
    "en": ["Hi, I'm Tanu!", "Here's a quick tour of Doc Translate before I leave you to it."],
    "zh-CN": ["你好，我是 Tanu！", "先带你快速了解一下 Doc Translate，然后就不打扰你了。"],
    "ja": ["こんにちは、Tanuです！", "Doc Translateを簡単にご案内します。そのあとはお邪魔しません。"],
    "fr": ["Bonjour, je suis Tanu !", "Voici une courte visite de Doc Translate, puis je vous laisse travailler."],
    "de": ["Hallo, ich bin Tanu!", "Hier ist eine kurze Tour durch Doc Translate – danach lasse ich Sie in Ruhe."],
    "it": ["Salve, sono Tanu!", "Ecco un breve tour di Doc Translate, poi la lascio lavorare."],
    "pt": ["Olá, eu sou o Tanu!", "Aqui vai um tour rápido pelo Doc Translate, depois deixo você trabalhar."],
    "es": ["¡Hola, soy Tanu!", "Aquí tiene un recorrido rápido por Doc Translate; luego le dejo trabajar."],
    "ko": ["안녕하세요, Tanu입니다!", "Doc Translate를 간단히 소개해 드린 뒤 물러날게요."],
    "ru": ["Здравствуйте, я Тану!", "Небольшая экскурсия по Doc Translate — а потом не буду мешать."],
  } },
  translate: { emoji: "📄", text: {
    "en": ["Translate a worksheet", "Tap Upload and choose a PDF, Word file, PowerPoint or photo. It becomes a worksheet in your language."],
    "zh-CN": ["翻译练习单", "点击“上传”，选择 PDF、Word、PowerPoint 或照片，它就会变成你所选语言的练习单。"],
    "ja": ["ワークシートを翻訳", "「アップロード」をタップして、PDF・Word・PowerPoint・写真を選んでね。選んだ言語のワークシートになるよ。"],
    "fr": ["Traduire une fiche", "Touche « Télécharger » et choisis un PDF, un fichier Word, un PowerPoint ou une photo. Il devient une fiche dans ta langue."],
    "de": ["Arbeitsblatt übersetzen", "Tippe auf „Hochladen“ und wähle ein PDF, eine Word-Datei, ein PowerPoint oder ein Foto. Daraus wird ein Arbeitsblatt in deiner Sprache."],
    "it": ["Tradurre una scheda", "Tocca “Carica” e scegli un PDF, un file Word, un PowerPoint o una foto. Diventa una scheda nella tua lingua."],
    "pt": ["Traduzir uma folha", "Toque em “Enviar” e escolha um PDF, arquivo do Word, PowerPoint ou foto. Ele vira uma folha no seu idioma."],
    "es": ["Traducir una ficha", "Toca «Subir» y elige un PDF, un archivo de Word, un PowerPoint o una foto. Se convierte en una ficha en tu idioma."],
    "ko": ["학습지 번역하기", "‘업로드’를 누르고 PDF, Word, PowerPoint 파일이나 사진을 고르세요. 선택한 언어의 학습지로 바뀌어요."],
    "ru": ["Перевести рабочий лист", "Нажми «Загрузить» и выбери PDF, файл Word, PowerPoint или фото. Получится рабочий лист на твоём языке."],
  } },
  language: { emoji: "🌐", text: {
    "en": ["Pick your language", "Use the flag button at the top, or Settings. The whole app switches to that language."],
    "zh-CN": ["选择你的语言", "使用顶部的国旗按钮或在“设置”中选择，整个应用都会切换到该语言。"],
    "ja": ["言語を選ぶ", "上の国旗ボタンか「設定」で選べるよ。アプリ全体がその言語になるよ。"],
    "fr": ["Choisis ta langue", "Utilise le bouton drapeau en haut ou les Paramètres. Toute l’application passe dans cette langue."],
    "de": ["Sprache wählen", "Nutze den Flaggen-Button oben oder die Einstellungen. Die ganze App wechselt in diese Sprache."],
    "it": ["Scegli la tua lingua", "Usa il pulsante con la bandiera in alto o le Impostazioni. Tutta l’app passa a quella lingua."],
    "pt": ["Escolha seu idioma", "Use o botão da bandeira no topo ou as Configurações. O app inteiro muda para esse idioma."],
    "es": ["Elige tu idioma", "Usa el botón de la bandera arriba o los Ajustes. Toda la app cambia a ese idioma."],
    "ko": ["언어 선택", "위쪽 국기 버튼이나 ‘설정’에서 고르세요. 앱 전체가 그 언어로 바뀌어요."],
    "ru": ["Выбери язык", "Нажми кнопку с флагом вверху или открой Настройки. Всё приложение переключится на этот язык."],
  } },
  joinClass: { emoji: "🏫", text: {
    "en": ["Join your class", "Go to Settings → Classroom, type the code your teacher gave you and tap Join."],
    "zh-CN": ["加入你的班级", "进入“设置”→“班级”，输入老师给你的代码，然后点击“加入”。"],
    "ja": ["クラスに参加", "「設定」→「クラス」で先生からもらったコードを入力して「参加」をタップしてね。"],
    "fr": ["Rejoins ta classe", "Va dans Paramètres → Classe, saisis le code donné par ton professeur et touche « Rejoindre »."],
    "de": ["Tritt deiner Klasse bei", "Gehe zu Einstellungen → Klasse, gib den Code deiner Lehrkraft ein und tippe auf „Beitreten“."],
    "it": ["Unisciti alla tua classe", "Vai su Impostazioni → Classe, inserisci il codice dell’insegnante e tocca “Unisciti”."],
    "pt": ["Entre na sua turma", "Vá em Configurações → Turma, digite o código que o professor te deu e toque em “Entrar”."],
    "es": ["Únete a tu clase", "Ve a Ajustes → Clase, escribe el código que te dio tu profesor y toca «Unirse»."],
    "ko": ["반에 참여하기", "‘설정’ → ‘반’에서 선생님이 준 코드를 입력하고 ‘참여’를 누르세요."],
    "ru": ["Вступи в свой класс", "Открой Настройки → Класс, введи код от учителя и нажми «Присоединиться»."],
  } },
  submit: { emoji: "📤", text: {
    "en": ["Submit your work", "Open a worksheet and tap Submit, or tap Submit on an assignment on your home page. Add feedback if you like — you can Unsubmit to change it."],
    "zh-CN": ["提交作业", "打开练习单点击“提交”，或在首页的作业上点击“提交”。可以附上反馈；需要修改时可以“取消提交”。"],
    "ja": ["課題を提出", "ワークシートを開いて「提出」、またはホームの課題で「提出」をタップ。感想も書けるよ。直したいときは「提出を取り消す」でOK。"],
    "fr": ["Rendre ton travail", "Ouvre une fiche et touche « Envoyer », ou touche « Envoyer » sur un devoir de ta page d’accueil. Tu peux ajouter un commentaire et annuler l’envoi pour modifier."],
    "de": ["Arbeit abgeben", "Öffne ein Arbeitsblatt und tippe auf „Abgeben“ oder tippe bei einer Aufgabe auf der Startseite auf „Abgeben“. Du kannst Feedback hinzufügen und die Abgabe zurückziehen, um etwas zu ändern."],
    "it": ["Consegnare il lavoro", "Apri una scheda e tocca “Consegna”, oppure tocca “Consegna” su un compito nella home. Puoi aggiungere un commento e annullare la consegna per modificarla."],
    "pt": ["Entregar o trabalho", "Abra uma folha e toque em “Enviar”, ou toque em “Enviar” numa tarefa da página inicial. Você pode adicionar um comentário e cancelar o envio para mudar."],
    "es": ["Entregar tu trabajo", "Abre una ficha y toca «Entregar», o toca «Entregar» en una tarea de tu página de inicio. Puedes añadir un comentario y anular la entrega para cambiarla."],
    "ko": ["과제 제출하기", "학습지를 열고 ‘제출’을 누르거나, 홈 화면의 과제에서 ‘제출’을 누르세요. 의견도 남길 수 있고, 고치고 싶으면 ‘제출 취소’를 누르면 돼요."],
    "ru": ["Сдай работу", "Открой рабочий лист и нажми «Отправить» или нажми «Отправить» у задания на главной. Можно добавить отзыв, а чтобы что-то изменить — отменить отправку."],
  } },
  classCode: { emoji: "🏫", text: {
    "en": ["Class codes", "Go to Classes → New class to get a class code. Tap Copy and give the code to your students so they can join."],
    "zh-CN": ["班级代码", "进入“班级”→“新建班级”获取班级代码。点击“复制”，把代码发给学生，他们就能加入。"],
    "ja": ["クラスコード", "「クラス」→「新しいクラス」でクラスコードを作成できます。「コピー」して生徒に伝えると参加できます。"],
    "fr": ["Codes de classe", "Allez dans Classes → Nouvelle classe pour obtenir un code. Touchez « Copier » et donnez-le à vos élèves pour qu’ils rejoignent la classe."],
    "de": ["Klassencodes", "Unter Klassen → Neue Klasse erhalten Sie einen Klassencode. Tippen Sie auf „Kopieren“ und geben Sie ihn Ihren Schülern zum Beitreten."],
    "it": ["Codici classe", "Vada su Classi → Nuova classe per ottenere un codice. Tocchi “Copia” e lo dia agli studenti per farli entrare."],
    "pt": ["Códigos de turma", "Vá em Turmas → Nova turma para obter um código. Toque em “Copiar” e passe o código aos alunos para eles entrarem."],
    "es": ["Códigos de clase", "Vaya a Clases → Nueva clase para obtener un código. Toque «Copiar» y déselo a sus alumnos para que se unan."],
    "ko": ["반 코드", "‘반’ → ‘새 반’에서 반 코드를 받으세요. ‘복사’를 눌러 학생들에게 알려 주면 참여할 수 있어요."],
    "ru": ["Коды классов", "Откройте Классы → Новый класс, чтобы получить код. Нажмите «Копировать» и передайте его ученикам, чтобы они вступили."],
  } },
  assignment: { emoji: "📝", text: {
    "en": ["Assignments & due dates", "Open a class and tap New under Assignments. Add a title, pick a due date and attach a worksheet if you like. Late work is accepted for 10 days after the due date."],
    "zh-CN": ["作业与截止日期", "打开班级，在“作业”下点击“新建”。填写标题、选择截止日期，也可以附上练习单。截止后 10 天内仍可提交（标记为迟交）。"],
    "ja": ["課題と締め切り", "クラスを開き「課題」の「新規」をタップ。タイトルを入力し、締め切り日を選び、必要ならワークシートを添付します。締め切り後10日間は遅れて提出できます。"],
    "fr": ["Devoirs et dates limites", "Ouvrez une classe et touchez « Nouveau » sous Devoirs. Ajoutez un titre, choisissez une date limite et joignez une fiche si vous le souhaitez. Les retards sont acceptés pendant 10 jours."],
    "de": ["Aufgaben & Fristen", "Öffnen Sie eine Klasse und tippen Sie unter Aufgaben auf „Neu“. Titel eingeben, Abgabedatum wählen und bei Bedarf ein Arbeitsblatt anhängen. Verspätete Abgaben sind noch 10 Tage möglich."],
    "it": ["Compiti e scadenze", "Apra una classe e tocchi “Nuovo” sotto Compiti. Inserisca un titolo, scelga una scadenza e alleghi una scheda se vuole. Le consegne in ritardo sono accettate per 10 giorni."],
    "pt": ["Tarefas e prazos", "Abra uma turma e toque em “Nova” em Tarefas. Dê um título, escolha o prazo e anexe uma folha se quiser. Entregas atrasadas são aceitas por 10 dias."],
    "es": ["Tareas y fechas de entrega", "Abra una clase y toque «Nueva» en Tareas. Ponga un título, elija la fecha de entrega y adjunte una ficha si quiere. Se aceptan entregas tardías durante 10 días."],
    "ko": ["과제와 마감일", "반을 열고 ‘과제’ 아래 ‘새로 만들기’를 누르세요. 제목을 쓰고 마감일을 고른 뒤 필요하면 학습지를 첨부하세요. 마감 후 10일까지는 늦은 제출을 받을 수 있어요."],
    "ru": ["Задания и сроки", "Откройте класс и нажмите «Новое» в разделе Задания. Укажите название, выберите срок и при желании прикрепите рабочий лист. Опоздавшие работы принимаются ещё 10 дней."],
  } },
  shareLink: { emoji: "🔗", text: {
    "en": ["Share links", "Open a worksheet and tap Share to get a link and QR code. Anyone with the link can view the worksheet."],
    "zh-CN": ["分享链接", "打开练习单并点击“分享”，即可获得链接和二维码。任何拿到链接的人都可以查看。"],
    "ja": ["共有リンク", "ワークシートを開いて「共有」をタップすると、リンクとQRコードが作れます。リンクを知っている人は誰でも閲覧できます。"],
    "fr": ["Liens de partage", "Ouvrez une fiche et touchez « Partager » pour obtenir un lien et un code QR. Toute personne ayant le lien peut voir la fiche."],
    "de": ["Freigabelinks", "Öffnen Sie ein Arbeitsblatt und tippen Sie auf „Teilen“, um Link und QR-Code zu erhalten. Jeder mit dem Link kann es ansehen."],
    "it": ["Link di condivisione", "Apra una scheda e tocchi “Condividi” per ottenere un link e un codice QR. Chiunque abbia il link può vederla."],
    "pt": ["Links de compartilhamento", "Abra uma folha e toque em “Compartilhar” para obter um link e um QR code. Qualquer pessoa com o link pode ver."],
    "es": ["Enlaces para compartir", "Abra una ficha y toque «Compartir» para obtener un enlace y un código QR. Cualquiera con el enlace puede verla."],
    "ko": ["공유 링크", "학습지를 열고 ‘공유’를 누르면 링크와 QR 코드가 생겨요. 링크가 있는 사람은 누구나 볼 수 있어요."],
    "ru": ["Ссылки для доступа", "Откройте рабочий лист и нажмите «Поделиться» — появятся ссылка и QR-код. Посмотреть может любой, у кого есть ссылка."],
  } },
  download: { emoji: "⬇️", text: {
    "en": ["Download & print", "In a worksheet, tap PDF or Word to download it, or Print to print it."],
    "zh-CN": ["下载和打印", "在练习单中点击 PDF 或 Word 下载，或点击“打印”。"],
    "ja": ["ダウンロードと印刷", "ワークシートで「PDF」か「Word」をタップするとダウンロード、「印刷」で印刷できます。"],
    "fr": ["Télécharger et imprimer", "Dans une fiche, touchez PDF ou Word pour la télécharger, ou Imprimer."],
    "de": ["Herunterladen & drucken", "Tippen Sie im Arbeitsblatt auf PDF oder Word zum Herunterladen oder auf Drucken."],
    "it": ["Scaricare e stampare", "In una scheda tocchi PDF o Word per scaricarla, oppure Stampa."],
    "pt": ["Baixar e imprimir", "Na folha, toque em PDF ou Word para baixar, ou em Imprimir."],
    "es": ["Descargar e imprimir", "En una ficha, toque PDF o Word para descargarla, o Imprimir."],
    "ko": ["다운로드와 인쇄", "학습지에서 PDF나 Word를 누르면 내려받고, ‘인쇄’를 누르면 인쇄돼요."],
    "ru": ["Скачать и распечатать", "В рабочем листе нажмите PDF или Word, чтобы скачать, или «Печать»."],
  } },
  settingsS: { emoji: "⚙️", text: {
    "en": ["Settings", "Settings is where you change your language, your role and your class."],
    "zh-CN": ["设置", "在“设置”中可以更改语言、身份和班级。"],
    "ja": ["設定", "「設定」では言語・役割・クラスを変更できるよ。"],
    "fr": ["Paramètres", "Dans les Paramètres, tu changes ta langue, ton rôle et ta classe."],
    "de": ["Einstellungen", "In den Einstellungen änderst du Sprache, Rolle und Klasse."],
    "it": ["Impostazioni", "Nelle Impostazioni cambi lingua, ruolo e classe."],
    "pt": ["Configurações", "Nas Configurações você muda idioma, função e turma."],
    "es": ["Ajustes", "En Ajustes cambias tu idioma, tu rol y tu clase."],
    "ko": ["설정", "‘설정’에서 언어, 역할, 반을 바꿀 수 있어요."],
    "ru": ["Настройки", "В Настройках можно сменить язык, роль и класс."],
  } },
  settingsT: { emoji: "⚙️", text: {
    "en": ["Settings", "Settings is where you change your language and role, and replay this tour."],
    "zh-CN": ["设置", "在“设置”中可以更改语言和身份，也可以重新观看本导览。"],
    "ja": ["設定", "「設定」では言語と役割の変更や、このツアーの再生ができます。"],
    "fr": ["Paramètres", "Dans les Paramètres, vous changez la langue et le rôle, et pouvez revoir cette visite."],
    "de": ["Einstellungen", "In den Einstellungen ändern Sie Sprache und Rolle und können diese Tour erneut ansehen."],
    "it": ["Impostazioni", "Nelle Impostazioni cambia lingua e ruolo e può rivedere questo tour."],
    "pt": ["Configurações", "Nas Configurações você muda idioma e função e pode rever este tour."],
    "es": ["Ajustes", "En Ajustes cambia el idioma y el rol, y puede volver a ver este recorrido."],
    "ko": ["설정", "‘설정’에서 언어와 역할을 바꾸고 이 안내를 다시 볼 수 있어요."],
    "ru": ["Настройки", "В Настройках можно сменить язык и роль, а также посмотреть эту экскурсию снова."],
  } },
  logout: { emoji: "🚪", text: {
    "en": ["Log out", "Tap Sign out in Settings, or the door icon at the top of the screen."],
    "zh-CN": ["退出登录", "在“设置”中点击“退出登录”，或点击屏幕顶部的门形图标。"],
    "ja": ["ログアウト", "「設定」の「ログアウト」か、画面上のドアのアイコンをタップします。"],
    "fr": ["Se déconnecter", "Touchez « Se déconnecter » dans les Paramètres, ou l’icône de porte en haut de l’écran."],
    "de": ["Abmelden", "Tippen Sie in den Einstellungen auf „Abmelden“ oder oben auf das Tür-Symbol."],
    "it": ["Uscire", "Tocchi “Esci” nelle Impostazioni, o l’icona della porta in alto."],
    "pt": ["Sair", "Toque em “Sair” nas Configurações ou no ícone de porta no topo da tela."],
    "es": ["Cerrar sesión", "Toque «Cerrar sesión» en Ajustes o el icono de la puerta arriba."],
    "ko": ["로그아웃", "‘설정’에서 ‘로그아웃’을 누르거나 화면 위쪽의 문 아이콘을 누르세요."],
    "ru": ["Выйти", "Нажмите «Выйти» в Настройках или значок двери вверху экрана."],
  } },
  dismissTanu: { emoji: "🍃", text: {
    "en": ["I'll stay with you!", "I'll pop up with study tips. Tap × or tap me to hide a tip, and tap me again any time for a new one."],
    "zh-CN": ["我会陪着你！", "我会不时跳出来给你学习小贴士。点 × 或点我就能关闭，想看新贴士时再点我一下。"],
    "ja": ["ずっとそばにいるよ！", "ときどき勉強のヒントを出すね。×か私をタップすると閉じられて、もう一度タップすると新しいヒントが見られるよ。"],
    "fr": ["Je reste avec toi !", "J’apparais avec des astuces. Touche × ou touche-moi pour masquer une astuce, et touche-moi quand tu veux pour une nouvelle."],
    "de": ["Ich bleibe bei dir!", "Ich zeige dir ab und zu Lerntipps. Tippe auf × oder auf mich, um einen Tipp auszublenden – und tippe mich jederzeit an für einen neuen."],
    "it": ["Resto con te!", "Ogni tanto ti darò consigli. Tocca × o toccami per nascondere un consiglio, e toccami quando vuoi per uno nuovo."],
    "pt": ["Vou ficar com você!", "Vou aparecer com dicas de estudo. Toque no × ou em mim para esconder uma dica, e toque em mim quando quiser outra."],
    "es": ["¡Me quedo contigo!", "Apareceré con consejos de estudio. Toca × o tócame para ocultar un consejo, y tócame cuando quieras otro."],
    "ko": ["내가 곁에 있을게!", "가끔 공부 팁을 알려 줄게. ×나 나를 누르면 팁이 닫히고, 언제든 다시 누르면 새 팁이 나와."],
    "ru": ["Я буду рядом!", "Я буду показывать советы для учёбы. Нажми × или на меня, чтобы скрыть совет, и нажми на меня снова, когда захочешь новый."],
  } },
  byeT: { emoji: "👋", text: {
    "en": ["That's it!", "I'll get out of your way now. You can replay this tour any time in Settings."],
    "zh-CN": ["就这些！", "我先不打扰你啦。随时可以在“设置”中重新观看本导览。"],
    "ja": ["以上です！", "これで失礼します。このツアーは「設定」からいつでも見直せます。"],
    "fr": ["C’est tout !", "Je vous laisse maintenant. Vous pouvez revoir cette visite à tout moment dans les Paramètres."],
    "de": ["Das war’s!", "Ich lasse Sie jetzt in Ruhe. Die Tour können Sie jederzeit in den Einstellungen erneut ansehen."],
    "it": ["È tutto!", "Ora la lascio lavorare. Può rivedere il tour quando vuole nelle Impostazioni."],
    "pt": ["É isso!", "Agora deixo você em paz. Você pode rever este tour a qualquer momento nas Configurações."],
    "es": ["¡Eso es todo!", "Ya no le molesto. Puede volver a ver este recorrido cuando quiera en Ajustes."],
    "ko": ["끝이에요!", "이제 물러날게요. 이 안내는 ‘설정’에서 언제든 다시 볼 수 있어요."],
    "ru": ["Вот и всё!", "Больше не буду мешать. Экскурсию можно посмотреть снова в Настройках."],
  } },
}

export const TOUR_ORDER = {
  'student': [
    'welcomeS',
    'translate',
    'language',
    'joinClass',
    'submit',
    'settingsS',
    'logout',
    'dismissTanu'
  ],
  'teacher': [
    'welcomeT',
    'translate',
    'language',
    'classCode',
    'assignment',
    'shareLink',
    'download',
    'settingsT',
    'logout',
    'byeT'
  ]
}

export const TOUR_UI = {
  tourNext: { "en": "Next", "zh-CN": "下一步", "ja": "次へ", "fr": "Suivant", "de": "Weiter", "it": "Avanti", "pt": "Próximo", "es": "Siguiente", "ko": "다음", "ru": "Далее" },
  tourBack: { "en": "Back", "zh-CN": "上一步", "ja": "戻る", "fr": "Retour", "de": "Zurück", "it": "Indietro", "pt": "Voltar", "es": "Atrás", "ko": "이전", "ru": "Назад" },
  tourSkip: { "en": "Skip tour", "zh-CN": "跳过导览", "ja": "ツアーをスキップ", "fr": "Passer la visite", "de": "Tour überspringen", "it": "Salta il tour", "pt": "Pular tour", "es": "Saltar recorrido", "ko": "안내 건너뛰기", "ru": "Пропустить" },
  tourDone: { "en": "Got it!", "zh-CN": "知道了！", "ja": "わかった！", "fr": "Compris !", "de": "Verstanden!", "it": "Capito!", "pt": "Entendi!", "es": "¡Entendido!", "ko": "알겠어요!", "ru": "Понятно!" },
  replayTour: { "en": "Replay Tanu’s tour", "zh-CN": "重新观看 Tanu 的导览", "ja": "Tanuのツアーをもう一度見る", "fr": "Revoir la visite de Tanu", "de": "Tanus Tour erneut ansehen", "it": "Rivedi il tour di Tanu", "pt": "Rever o tour do Tanu", "es": "Ver de nuevo el recorrido de Tanu", "ko": "Tanu의 안내 다시 보기", "ru": "Посмотреть экскурсию Тану снова" },
}

/** The tour for a role in the given language: [{ emoji, title, text }]. Falls back to English. */
export function getTourSteps(role, langCode) {
  return (TOUR_ORDER[role] || []).map(key => {
    const step = TOUR_STEPS[key]
    const [title, text] = step.text[langCode] || step.text.en
    return { key, emoji: step.emoji, title, text }
  })
}

export function tourText(key, langCode) {
  return TOUR_UI[key][langCode] || TOUR_UI[key].en
}

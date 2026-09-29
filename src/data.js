export const PORTFOLIO_INFO = {
  author: "Дмитрий Бургер",
  role: "Product-Oriented Frontend Engineer & UI/UX Lead",
  status: "Открыт к проектам и предложениям",
  location: "Москва / Remote",
  telegram: "https://t.me/aimovl",
  github: "https://github.com/228burger228",
  youtube: "https://www.youtube.com/@burgerdom6",
  studioBot: "https://t.me/dmitryB_studio_bot",
  portfolioUrl: "https://228burger228.github.io/burgerportfolio2.0/",
  avatar: "./assets/mefoto.jpg",
  tagline: "Собираю хаос требований в работающую систему · Lighthouse 95+ · 15+ проектов в проде"
};

export const HELIPADS = [
  {
    id: "hq",
    number: "01",
    name: "Штаб · Главная",
    shortTitle: "Штаб (Обо мне)",
    themeType: "hq",
    category: "Product Frontend & UI/UX Lead",
    badge: "Открыт к проектам",
    color: "#3b82f6",
    accentGlow: 0x3b82f6,
    position: { x: 0, y: 0.5, z: 0 },
    emoji: "🚁",
    title: "Дмитрий Бургер — Product-Oriented Frontend Engineer & UI/UX Lead",
    subtitle: "Собираю хаос требований в работающую систему. Устраняю разрыв между дизайном и разработкой.",
    description: "Помогаю бизнесу и стартапам переводить сложные задачи в понятные, стабильные веб-продукты. Проектирую интерфейсы в Figma и реализую их на чистом фронтенд-стеке и Vue 3 с фокусом на конверсию, скорость (Lighthouse 95+) и надежность.",
    caseFlow: {
      was: "Разрыв между дизайном и версткой, затянутый Time-to-Market и медленные сайты, теряющие мобильный трафик.",
      result: "Экономия до 40% времени на доработках, запуск MVP за 2–4 недели, загрузка до 1 секунды (Lighthouse 95+).",
      became: "Единый цикл: UX/UI Архитектура в Figma + Frontend Инженерия (HTML5/CSS3/JS/Vue 3) + Product Delivery."
    },
    tags: [
      "UX/UI Архитектура", "Frontend Engineering", "Product Delivery",
      "Vue 3 & Vite", "Figma & Design Systems", "Semantic HTML5 / CSS3",
      "Cloudflare Workers", "Gemini API", "Supabase", "Lighthouse 95+"
    ],
    stats: [
      { label: "В production", value: "15+ проектов" },
      { label: "Скорость Lighthouse", value: "95+" },
      { label: "Аудитория проектов", value: "10 000+ / мес" },
      { label: "Соблюдение сроков", value: "100%" }
    ],
    linkText: "Обсудить проект в Telegram",
    link: "https://t.me/aimovl",
    secondaryLinkText: "Профиль GitHub",
    secondaryLink: "https://github.com/228burger228",
    image: "./assets/mefoto.jpg",
    gallery: [
      { src: "./assets/mefoto.jpg", caption: "Дмитрий Бургер — Product-Oriented Frontend Engineer & UI/UX Lead" },
      { src: "./assets/mefoto2.jpg", caption: "Работа над архитектурой цифровых продуктов" },
      { src: "./assets/hgstroyblag.png", caption: "Официальное благодарственное письмо от ООО «Хаус Гард»" }
    ]
  },
  {
    id: "hgstroy",
    number: "02",
    name: "HgStroy · B2B Портал",
    shortTitle: "HgStroy B2B",
    themeType: "construction",
    category: "Featured · Frontend & Design System",
    badge: "Team Lead · B2B",
    color: "#f97316",
    accentGlow: 0xf97316,
    position: { x: -36, y: 0.5, z: -28 },
    emoji: "🏗️",
    title: "HgStroy — Корпоративный B2B-портал строительной компании",
    subtitle: "Редизайн и фронтенд-архитектура для компании «Хаус Гард» (2025)",
    description: "Руководил связкой дизайна и верстки в команде из 2 человек. Спроектировал модульную дизайн-систему, адаптивные компоненты, формы захвата заявок и провел интеграцию с корпоративным сервером заказчика. Получено официальное благодарственное письмо от руководства компании.",
    caseFlow: {
      was: "Устаревший сайт без адаптива, потеря мобильного трафика и заявок.",
      result: "Загрузка в 2.4 раза быстрее (Lighthouse 95+), сайт летает на смартфонах, благодарность руководства.",
      became: "Модульная B2B-система, чистый код и конверсионная воронка лидов."
    },
    tags: ["Team Coordination", "UI/UX Design System", "Bootstrap 5", "Figma", "Lighthouse 95+", "B2B Portal"],
    stats: [
      { label: "Роль", value: "Lead Frontend & Designer" },
      { label: "Ускорение", value: "в 2.4 раза" },
      { label: "Награда", value: "Благодарность ООО «Хаус Гард»" }
    ],
    linkText: "Открыть сайт HgStroy ↗",
    link: "https://smr.hgstroy.ru/index.html",
    image: "./assets/hgstroy.png",
    gallery: [
      { src: "./assets/hgstroy.png", caption: "HgStroy — Главный экран корпоративного портала" },
      { src: "./assets/hgsmr.png", caption: "Модульная сетка и подразделы строительной компании" },
      { src: "./assets/hgstroyblag.png", caption: "Официальное благодарственное письмо от ООО «Хаус Гард»" }
    ]
  },
  {
    id: "warpath",
    number: "03",
    name: "Warpath Wiki",
    shortTitle: "Warpath Wiki",
    themeType: "military",
    category: "Featured · High-Load Vue 3 SPA",
    badge: "⭐ 10 000+ MAU",
    color: "#ef4444",
    accentGlow: 0xef4444,
    position: { x: 36, y: 0.5, z: -28 },
    emoji: "⚔️",
    title: "Warpath: Ace Shooter Wiki — Справочник сообщества",
    subtitle: "Официальный ресурс-партнёр игры · Product & Frontend Developer (2024 — сейчас)",
    description: "Высоконагруженный веб-справочник русскоязычного комьюнити мобильной стратегии. Разработал архитектуру на Vue 3, Vite и Supabase, реализовал мгновенный поиск, фильтрацию и SEO-оптимизацию.",
    caseFlow: {
      was: "Данные разбросаны по чатам и таблицам, высокий барьер входа для новичков.",
      result: "10 000+ активных игроков в месяц, официальное партнёрство с игрой, топ-1 в Яндексе и Google.",
      became: "Быстрый SPA-справочник с фильтрацией, базой юнитов, офицеров и базой данных."
    },
    tags: ["Vue 3", "Vite", "Supabase", "SEO & a11y", "High-Load", "10 000+ MAU"],
    stats: [
      { label: "Трафик", value: "10 000+ чел/мес" },
      { label: "Стек", value: "Vue 3 + Supabase" },
      { label: "Статус", value: "Офиц. партнёр" }
    ],
    linkText: "Открыть Warpath Wiki ↗",
    link: "https://228burger228.github.io/WarpathYTwiki/index.html",
    secondaryLinkText: "WP Commander ↗",
    secondaryLink: "https://wpcommander.netlify.app",
    image: "./assets/warpathwikiscrin.png"
  },
  {
    id: "youtube",
    number: "04",
    name: "YouTube @burgerdom6 & Hub",
    shortTitle: "YouTube & Hub",
    themeType: "youtube",
    category: "Media · Community · Product QA",
    badge: "📺 48 500+ просмотров",
    color: "#ff0033",
    accentGlow: 0xff0033,
    position: { x: 58, y: 0.5, z: -2 },
    emoji: "📺",
    title: "YouTube @burgerdom6, WarpathHub & WP Commander",
    subtitle: "Канал с 2019 г. · Объединение ютуберов · Продуктовый консалтинг и тестирование WP Commander",
    description: "Авторский YouTube-канал @burgerdom6 (139 видео, 48 506 просмотров, 478 подписчиков) и экосистема сообщества Warpath: Ace Shooter. Вместе с другими профильными ютуберами развиваем объединённое комьюнити в Telegram (t.me/WarpathHub), помогаем игрокам и общаемся. Параллельно участвую в разработке, QA-тестировании и проектировании огромной структуры международного портала WP Commander совместно с разработчиком Rogério Mattos.",
    youtubeInfo: {
      handle: "@burgerdom6",
      channelUrl: "https://www.youtube.com/@burgerdom6",
      registered: "20 янв. 2019 г.",
      subscribers: "478",
      videos: "139 видео",
      views: "48 506 просмотров",
      latestVideoUrl: "https://youtu.be/yGm-8Lvq5jE?si=7lnqdm2eheAKcITx",
      latestVideoId: "yGm-8Lvq5jE",
      avatar: "./assets/youtube-avatar.png",
      communityUrl: "https://t.me/WarpathHub",
      wpCommanderUrl: "https://wpcommander.netlify.app",
      wpDeveloper: "Rogério Mattos"
    },
    caseFlow: {
      was: "Разрозненное комьюнити игроков и нехватка структурированных гайдов, тестов механик и аналитических платформ.",
      result: "48 506+ просмотров и 139 видео на YouTube, живое объединение ютуберов t.me/WarpathHub и релиз глобальной базы WP Commander.",
      became: "Мощная связка: авторский YouTube-канал + комьюнити-хаб + продуктовый консалтинг и QA международного сайта."
    },
    tags: [
      "YouTube @burgerdom6", "48 506 просмотров", "139 видео",
      "t.me/WarpathHub", "WP Commander QA & Product", "Collab w/ Rogério Mattos", "Warpath: Ace Shooter"
    ],
    stats: [
      { label: "Подписчиков", value: "478" },
      { label: "Видео на канале", value: "139 роликов" },
      { label: "Просмотров", value: "48 506+" },
      { label: "Основан", value: "20 янв. 2019" }
    ],
    linkText: "Канал YouTube @burgerdom6 ↗",
    link: "https://www.youtube.com/@burgerdom6",
    secondaryLinkText: "Смотреть последнее видео ▶",
    secondaryLink: "https://youtu.be/yGm-8Lvq5jE?si=7lnqdm2eheAKcITx",
    extraLinks: [
      { text: "💬 TG-комьюнити t.me/WarpathHub", url: "https://t.me/WarpathHub" },
      { text: "🌐 WP Commander (Dev: Rogério Mattos)", url: "https://wpcommander.netlify.app" }
    ],
    image: "./assets/youtube-avatar.png",
    gallery: [
      { src: "./assets/youtube-avatar.png", caption: "Фирменная аватарка канала @burgerdom6 (Warpath: Ace Shooter)" },
      { src: "./assets/warpathwikiscrin.png", caption: "Экосистема проектов по Warpath: Wiki, YouTube и WP Commander" }
    ]
  },
  {
    id: "studyup",
    number: "05",
    name: "Study Up & EdTech",
    shortTitle: "Study Up & EdTech",
    themeType: "edtech",
    category: "Featured · EdTech & MVP Platforms",
    badge: "👥 Team Lead · MVP",
    color: "#6366f1",
    accentGlow: 0x6366f1,
    position: { x: -42, y: 0.5, z: 22 },
    emoji: "🎓",
    title: "Study Up, SkillForge & Город Мастеров — Образовательные платформы",
    subtitle: "Запуск EdTech-продуктов от UX-концепции до рабочего MVP на Vue 3 и JS",
    description: "Серия образовательных веб-платформ: продуктовое лидирование запуска онлайн-школы Study Up за 3 недели, разработка SPA-платформы SkillForge на Vue 3 с личным кабинетом и геймифицированная платформа «Город Мастеров» для Департамента образования Москвы.",
    caseFlow: {
      was: "Идеи образовательных платформ без единого UX-дизайна и синхронизации между макетами и кодом.",
      result: "Запуск Study Up за 3 недели (приём первого потока), интерактивный кабинет SkillForge на Vue 3 и внедрение «Города Мастеров».",
      became: "Готовая UX-архитектура, согласованный роадмап, система трекинга прогресса и геймификация."
    },
    tags: ["Product Lead", "Vue 3 & Vite", "UX/UI Design", "Team Coordination", "MVP Launch", "EdTech"],
    stats: [
      { label: "Study Up", value: "Релиз за 3 недели" },
      { label: "SkillForge", value: "SPA на Vue 3" },
      { label: "Город Мастеров", value: "Гос. заказ Москвы" }
    ],
    linkText: "Открыть Study Up ↗",
    link: "https://228burger228.github.io/StudyUp/index.html",
    secondaryLinkText: "Открыть SkillForge ↗",
    secondaryLink: "https://228burger228.github.io/SkillForge/",
    image: "./assets/Stydy-upLog.jpg",
    gallery: [
      { src: "./assets/Stydy-upLog.jpg", caption: "Study Up — Цифровая платформа онлайн-школы (Team Lead)" },
      { src: "./assets/skillforge.png", caption: "SkillForge — Образовательный SPA-сервис на Vue 3" },
      { src: "./assets/midquest.png", caption: "Город Мастеров — Образовательная платформа (Гос. заказ)" }
    ]
  },
  {
    id: "vertical",
    number: "06",
    name: "vertical.team",
    shortTitle: "vertical.team",
    themeType: "media",
    category: "Featured · High-Conversion Landing",
    badge: "🚀 High Conversion",
    color: "#ec4899",
    accentGlow: 0xec4899,
    position: { x: 42, y: 0.5, z: 28 },
    emoji: "🎬",
    title: "vertical.team — Платформа AI-креаторов и вертикальных видео",
    subtitle: "Frontend Developer & Designer (2026) · Чистый стек без тяжёлых библиотек",
    description: "Разработка конверсионного 8-секционного лендинга с нуля без сторонних библиотек. Спроектировал UI-компоненты, реализовал кастомные touch/drag слайдеры, анимации появления контента, аккордеоны FAQ и строгую семантику от 320px до 2560px.",
    caseFlow: {
      was: "Тяжёлые конструкторы тормозили мобильный трафик и роняли конверсию заявок.",
      result: "Мгновенный запуск на смартфонах, плавная работа 60fps без зависаний и рост входящих заявок.",
      became: "Лёгкий нативный интерфейс, кастомные touch-слайдеры, безупречный адаптив и доступность WCAG."
    },
    tags: ["HTML5", "CSS3", "Vanilla JS", "Motion UI", "Touch Sliders", "WCAG Responsive"],
    stats: [
      { label: "Архитектура", value: "8 секций (Zero-deps)" },
      { label: "Адаптив", value: "320px — 2560px" },
      { label: "Фокус", value: "Мобильный трафик" }
    ],
    linkText: "Открыть vertical.team ↗",
    link: "https://228burger228.github.io/aNdreyTT/",
    image: "./assets/verticalteam.png"
  },
  {
    id: "dmitryos",
    number: "07",
    name: "Dmitry OS · AI Agent",
    shortTitle: "Dmitry OS (AI)",
    themeType: "ai",
    category: "Featured · Serverless AI & Automation",
    badge: "🤖 AI Automation",
    color: "#06b6d4",
    accentGlow: 0x06b6d4,
    position: { x: 0, y: 0.5, z: -52 },
    emoji: "🤖",
    title: "Dmitry OS Agent v6.0 — Интеллектуальный AI-ассистент в Telegram",
    subtitle: "Backend Developer & AI Architect · Cloudflare Workers + Gemini API + Google API",
    description: "Serverless AI-агент автоматизации задач и рабочих процессов. Заменяет связку из календаря, заметочника и трекера задач через один Telegram-чат: распознаёт голосовые сообщения в Google Docs, анализирует дизайн через Gemini Vision, управляет расписанием Google Calendar и шлёт умные пуш-сводки.",
    caseFlow: {
      was: "Потери времени на ручную сортировку задач, переключение между 5 приложениями и ручную запись голосовых.",
      result: "Отклик ассистента 300–800ms (нулевой cold start), экономия часов рутины в неделю и $0/мес на серверы.",
      became: "Автономный edge-ассистент на Cloudflare Workers + 2 проекта Google Apps Script + кэш в Cloudflare KV."
    },
    tags: ["Cloudflare Workers", "Gemini API", "Google Apps Script", "Telegram Bot API", "Calendar & Docs API", "Serverless"],
    stats: [
      { label: "Отклик (Latency)", value: "300–800 ms" },
      { label: "Инфраструктура", value: "$0 / месяц" },
      { label: "Uptime", value: "99.9% Edge" }
    ],
    linkText: "Связаться по AI-ботам ↗",
    link: "https://t.me/aimovl",
    secondaryLinkText: "Студийный бот @dmitryB_studio_bot",
    secondaryLink: "https://t.me/dmitryB_studio_bot",
    image: "./assets/portfelDD.png"
  },
  {
    id: "foodice",
    number: "08",
    name: "foodiCE & Garden",
    shortTitle: "foodiCE & Garden",
    themeType: "product",
    category: "Featured · Web Products & E-Commerce",
    badge: "🍦 Lighthouse 95+",
    color: "#10b981",
    accentGlow: 0x10b981,
    position: { x: -32, y: 0.5, z: 54 },
    emoji: "🍦",
    title: "foodiCE, Digital Garden & Dimutri Studio — Веб-сервисы и Промо",
    subtitle: "Высокоскоростные веб-продукты с оценкой Lighthouse 95+ и FCP < 1s",
    description: "Подборка быстрых веб-продуктов на чистом стеке: промо-лендинг крафтового мороженого foodiCE с формой предзаказа, персональный архив исследований Digital Garden с мгновенным real-time поиском и парная визитка студии Dimutri & Burger с интеграцией Telegram-бота.",
    caseFlow: {
      was: "Медленные шаблонные решения и отсутствие удобной конверсионной витрины или мгновенного поиска.",
      result: "Оценка скорости Lighthouse 95+, FCP менее 1 секунды, мгновенная фильтрация и заказ в 2 клика.",
      became: "Семантические веб-приложения со светлой/тёмной темой, валидацией форм и соблюдением стандарта WCAG AA."
    },
    tags: ["HTML5 / CSS3", "Vanilla JS", "Lighthouse 95+", "FCP < 1s", "WCAG AA", "Conversion UI"],
    stats: [
      { label: "foodiCE", value: "E-Commerce Промо" },
      { label: "Digital Garden", value: "Real-Time Поиск" },
      { label: "Dimutri & Burger", value: "Studio + TG Bot" }
    ],
    linkText: "Открыть foodiCE ↗",
    link: "https://228burger228.github.io/foodiCE/",
    secondaryLinkText: "Открыть Digital Garden ↗",
    secondaryLink: "https://228burger228.github.io/digital-garden",
    image: "./assets/foodiCE.png",
    gallery: [
      { src: "./assets/foodiCE.png", caption: "foodiCE — Промо-лендинг крафтового мороженого" },
      { src: "./assets/Garden1.png", caption: "Digital Garden — Скоростной веб-архив исследований" },
      { src: "./assets/portfelDD.png", caption: "Портфолио Dimutri & Burger — Парная визитка студии" }
    ]
  },
  {
    id: "design",
    number: "09",
    name: "UI/UX, Мерч & 3D",
    shortTitle: "UI/UX, Мерч & 3D",
    themeType: "creative",
    category: "UI/UX · Branding · BIM & 3D",
    badge: "🎨 Мультидисциплинарность",
    color: "#a855f7",
    accentGlow: 0xa855f7,
    position: { x: 32, y: 0.5, z: 54 },
    emoji: "🎨",
    title: "Корпоративный VPN, Точка Ритма, Мерч BOYS 100% и BIM 3D",
    subtitle: "От сложных B2B дизайн-систем в Figma до полиграфии, мерча и 3D-реконструкции",
    description: "Широкий спектр визуальной и инженерной экспертизы: UX/UI архитектура корпоративной VPN-платформы (80+ экранов), стриминг-сервис «Точка ритма» (Яндекс Практикум), фирменный мерч и стикерпак мото-сообщества BOYS 100%, серия плакатов и BIM/3D реконструкция Римского дворика РГБ в Revit и Blender.",
    caseFlow: {
      was: "Сложные технические системы без понятного UI и потребность в выверенной визуальной айдентике.",
      result: "Сокращение времени онбординга в VPN-кабинете в 2 раза, высокая оценка в Яндекс Практикуме, готовые тиражи в печати.",
      became: "Комплексные дизайн-системы, векторные макеты под шелкографию и точные 3D-модели."
    },
    tags: ["Figma Design Systems", "B2B SaaS VPN", "Яндекс Практикум", "Мерч BOYS 100%", "Revit & Blender 3D", "Полиграфия"],
    stats: [
      { label: "B2B VPN UI", value: "80+ экранов" },
      { label: "Образование", value: "МГКЭИТ + Практикум" },
      { label: "3D & BIM", value: "Revit + Blender" }
    ],
    linkText: "Смотреть портфолио 2.0 ↗",
    link: "https://228burger228.github.io/burgerportfolio2.0/",
    image: "./assets/tochkaritma.png",
    gallery: [
      { src: "./assets/tochkaritma.png", caption: "Точка ритма — Интерфейс музыкального стриминг-сервиса (Яндекс Практикум)" },
      { src: "./assets/100_BOYS.png", caption: "BOYS 100% — Фирменный мерч и стикерпак мото-сообщества" },
      { src: "./assets/sitikol1.png", caption: "Графический дизайн — Промо-кампании и постеры" },
      { src: "./assets/poster_ppd.png", caption: "Социальный постер — Безопасность и велодвижение" },
      { src: "./assets/posterr1.jpg", caption: "Серия графических плакатов #1" },
      { src: "./assets/rimdvor1.jpg", caption: "Римский дворик РГБ — BIM-моделирование в Revit и 3D в Blender" }
    ]
  },
  {
    id: "contacts",
    number: "10",
    name: "Калькулятор MVP & Связь",
    shortTitle: "MVP & Контакты",
    themeType: "contact",
    category: "Конфигуратор & Контакты",
    badge: "⚡ Ответ за 1–2 часа",
    color: "#eab308",
    accentGlow: 0xeab308,
    position: { x: 0, y: 0.5, z: 68 },
    emoji: "📬",
    title: "Калькулятор запуска MVP и прямая связь",
    subtitle: "Соберите контур вашей задачи и напишите мне в Telegram — отвечу в течение 1–2 часов",
    description: "Открыт к продуктовым командам и стартапам (Full-time / Part-time / Project-based), комплексному запуску MVP под ключ и UI/UX аудиту с ускорением фронтенда до зелёной зоны Lighthouse 95+.",
    hasCalculator: true,
    tags: ["Telegram @aimovl", "YouTube @burgerdom6", "GitHub 228burger228", "Full-time / Project", "MVP за 2–4 недели"],
    stats: [
      { label: "Telegram", value: "@aimovl" },
      { label: "Время ответа", value: "1–2 часа" },
      { label: "Формат", value: "Москва / Remote" }
    ],
    linkText: "Написать в Telegram (@aimovl) ↗",
    link: "https://t.me/aimovl",
    secondaryLinkText: "Открыть GitHub ↗",
    secondaryLink: "https://github.com/228burger228",
    extraLinks: [
      { text: "📺 YouTube @burgerdom6", url: "https://www.youtube.com/@burgerdom6" },
      { text: "💬 WarpathHub TG", url: "https://t.me/WarpathHub" }
    ],
    image: "./assets/mefoto3.jpg"
  }
];

export const COLLECTIBLE_STARS = [
  { id: 1, x: -18, y: 2.5, z: -14 },
  { id: 2, x: 18, y: 2.5, z: -14 },
  { id: 3, x: 0, y: 3.2, z: -28 },
  { id: 4, x: -22, y: 2.5, z: 10 },
  { id: 5, x: 22, y: 2.5, z: 10 },
  { id: 6, x: 47, y: 2.8, z: -15 },
  { id: 7, x: 50, y: 2.8, z: 13 },
  { id: 8, x: -16, y: 2.8, z: 60 },
  { id: 9, x: 16, y: 2.8, z: 60 },
  { id: 10, x: 0, y: 3.5, z: 34 }
];

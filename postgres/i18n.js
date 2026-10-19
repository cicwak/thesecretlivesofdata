export const messages = {
  en: {
    app: 'Postgres', chapters: '70 interactive chapters', home: 'Visualizations',
    description: 'Follow an application into Postgres through 70 illustrated chapters: storage, transactions, queries, indexes and replication.',
    contents: 'Contents', close: 'Close', language: 'Language', version: 'Postgres',
    stepSources: 'Evidence for this step', documentation: 'Official documentation', implementation: 'Pinned implementation', audit: 'Full technical audit',
    auditNote: 'Each explanation links to its official manual section and, where applicable, the relevant book pages. Timing and capacities illustrate the mechanism.',
    groups: ['Saving data', 'Surviving a crash', 'Concurrent transactions', 'Waiting for others', 'Reclaiming space', 'Understanding a query', 'Joining tables', 'Specialized indexes', 'Shared write rules', 'More than one server'],
    next: 'Continue', replay: 'Replay step', about: 'About this step', sources: 'Go to the source',
    skip: 'Skip to the explanation',
    command: 'Command / response', diagram: 'Interactive explanation',
    client: 'Client', execution: 'Execution', memory: 'Memory',
    complete: 'You have reached the end. Revisit any chapter.',
    safeStorage: 'Your language preference could not be saved. The link still includes your language.',
  },
  ru: {
    app: 'Postgres', chapters: '70 интерактивных глав', home: 'Визуализации',
    description: 'От задачи приложения к устройству Postgres: 70 глав о хранении, транзакциях, запросах, индексах и репликации.',
    contents: 'Оглавление', close: 'Закрыть', language: 'Язык', version: 'Postgres',
    stepSources: 'Подтверждение текущего шага', documentation: 'Официальная документация', implementation: 'Зафиксированный исходный код', audit: 'Полный технический аудит',
    auditNote: 'У каждого объяснения есть раздел официального руководства и, где применимо, страницы книги. Время и размеры схем помогают увидеть механизм.',
    groups: ['Приложение сохраняет данные', 'Данные переживают сбой', 'Несколько приложений', 'Ожидания и блокировки', 'Освобождение места', 'Почему запрос медленный', 'Данные из нескольких таблиц', 'Индексы для разных задач', 'Общие правила записи', 'Одного сервера недостаточно'],
    next: 'Продолжить', replay: 'Повторить шаг', about: 'Об этом шаге', sources: 'Первоисточники',
    skip: 'Перейти к объяснению',
    command: 'Команда / ответ', diagram: 'Интерактивное объяснение',
    client: 'Клиент', execution: 'Исполнение', memory: 'Память',
    complete: 'Вы дошли до конца. Вернитесь к нужной главе.',
    safeStorage: 'Не удалось сохранить язык. Он по-прежнему указан в ссылке.',
  },
};

export function localize(value, lang) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value?.[lang] ?? '';
}

export function chooseLanguage({search = '', stored = '', languages = []} = {}) {
  const explicit = new URLSearchParams(search).get('lang');
  if (explicit === 'ru' || explicit === 'en') return explicit;
  if (stored === 'ru' || stored === 'en') return stored;
  return String(languages[0] || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function chapterUrl(id, lang, pathname = '/postgres/') {
  return `${pathname}?lang=${lang === 'ru' ? 'ru' : 'en'}#${encodeURIComponent(id)}`;
}

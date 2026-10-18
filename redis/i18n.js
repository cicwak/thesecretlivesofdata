export const messages = {
  en: {
    app: 'Redis Internals', chapters: '21 interactive chapters', home: 'The Secret Lives of Data',
    description: 'Explore Redis internals through 21 interactive chapters: commands, memory, atomicity, persistence and replication.',
    contents: 'Contents', close: 'Close', language: 'Language', version: 'Redis Open Source 8.0.0',
    stepSources: 'Evidence for this step', documentation: 'Official documentation', implementation: 'Pinned implementation', audit: 'Full technical audit',
    auditNote: 'Checked against Redis 8.0.0 source on 2026-10-18. Current documentation may cover newer versions; the pinned source defines this lesson’s baseline. Diagrams simplify capacity and timing.',
    groups: ['One server', 'Working together', 'Memory & time', 'Keeping data', 'Multiple servers', 'Messages & workers', 'Beyond the core'],
    previous: 'Previous', next: 'Continue', nextChapter: 'Next chapter', finish: 'Back to the beginning',
    replay: 'Replay step', play: 'Play this step', pause: 'Pause animation', speed: 'Animation speed',
    step: 'Step', of: 'of', chapter: 'Chapter', under: 'Under the hood', sources: 'Go to the source',
    skip: 'Skip to the explanation', keyboard: '← / → steps · Space pause / play',
    command: 'Command / response', diagram: 'Interactive explanation',
    client: 'Client', execution: 'Execution', memory: 'Memory',
    zoom: 'Enlarge diagram', pan: 'Scroll horizontally to explore the full-size diagram.',
    complete: 'You have reached the end. Revisit any chapter.',
    reduced: 'Reduced motion is enabled. Changes are shown without animation.',
    safeStorage: 'Your language preference could not be saved. The link still includes your language.',
  },
  ru: {
    app: 'Redis изнутри', chapters: '21 интерактивная глава', home: 'The Secret Lives of Data',
    description: 'Изучите внутреннее устройство Redis в 21 интерактивной главе: команды, память, атомарность, сохранение и репликация.',
    contents: 'Оглавление', close: 'Закрыть', language: 'Язык', version: 'Redis Open Source 8.0.0',
    stepSources: 'Подтверждение текущего шага', documentation: 'Официальная документация', implementation: 'Зафиксированный исходный код', audit: 'Полный технический аудит',
    auditNote: 'Сверено с исходниками Redis 8.0.0 18.10.2026. Текущая документация может описывать более новые версии; основу урока задаёт код по неизменяемой ссылке. Ёмкость и время на схемах упрощены.',
    groups: ['Один сервер', 'Несколько клиентов', 'Память и время', 'Сохранение данных', 'Несколько серверов', 'Сообщения и обработчики', 'За пределами ядра'],
    previous: 'Назад', next: 'Продолжить', nextChapter: 'Следующая глава', finish: 'Вернуться к началу',
    replay: 'Повторить шаг', play: 'Воспроизвести шаг', pause: 'Пауза анимации', speed: 'Скорость анимации',
    step: 'Шаг', of: 'из', chapter: 'Глава', under: 'Глубже', sources: 'Первоисточники',
    skip: 'Перейти к объяснению', keyboard: '← / → шаги · Пробел — пауза / воспроизведение',
    command: 'Команда / ответ', diagram: 'Интерактивное объяснение',
    client: 'Клиент', execution: 'Исполнение', memory: 'Память',
    zoom: 'Увеличить схему', pan: 'Прокручивайте по горизонтали, чтобы рассмотреть схему в полном размере.',
    complete: 'Вы дошли до конца. Вернитесь к нужной главе.',
    reduced: 'Включено уменьшение движения. Изменения показаны без анимации.',
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

export function chapterUrl(id, lang, pathname = '/redis/') {
  return `${pathname}?lang=${lang === 'ru' ? 'ru' : 'en'}#${encodeURIComponent(id)}`;
}

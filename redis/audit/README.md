# Redis: технический аудит / Technical audit

Дата проверки / Reviewed: **2026-10-18**. Проверено **21 глава, 126 шагов**, обе локализации, команды и ответы, подробности, схемы, порядок анимаций и учебные эксперименты.

Зафиксированная основа — **Redis Open Source 8.0.0**, commit [`e91a340e241cf0abe3c6a0c254214fbe4aa1d95f`](https://github.com/redis/redis/tree/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f). Официальная документация `latest` прочитана при аудите; поскольку она обновляется и уже содержит более новые команды, версию реализации определяют неизменяемые ссылки на исходники. Для JSON/Search/TimeSeries/Bloom проверены версии, выбранные Makefile именно этого релиза, и их исходники; SHA перечислены в отчёте глав 19–21 и `evidence.js`.

The audit covers every authored step and its implementation, not every Redis feature. The fixed baseline is Redis 8.0.0 at the commit above. Current documentation can include later features; immutable source links determine the lesson's version. Module versions match this release's build manifest. This is a documented technical review, not a formal proof that no error is possible.

## Проверка по каждому шагу / Per-step findings

| Главы / Chapters | Отчёт / Report | Машиночитаемые источники / Source map |
| --- | --- | --- |
| 1–5: ключ, запрос, потоки, словарь, упаковки | [30 шагов / steps](01-05.md) | [01-05.js](01-05.js) |
| 6–13: атомарность, транзакции, скрипты, ожидание, lock, TTL, память, задержки | [48 шагов / steps](06-13.md) | [06-13.js](06-13.js) |
| 14–18: RDB, AOF, репликация, Sentinel, Cluster | [30 шагов / steps](14-18.md) | [14-18.js](14-18.js) |
| 19–21: Pub/Sub, Streams, специализированные структуры | [18 шагов / steps](19-21.md) | [19-21.js](19-21.js) |

В отчётах зафиксированы **исходные** ошибки и необходимые исправления. Все описанные исправления интегрированы в рабочую ветку; формулировки «FIX» и «предложено» в таблицах описывают состояние до этого изменения. В интерфейсе «Глубже» теперь выводит документацию и исходник именно текущего шага. Всего карта содержит 180 ссылок на документацию и 229 ссылок на исходники (включая повторные ссылки для разных шагов). Файлы и диапазоны строк всех 229 ссылок проверены по локальным checkout соответствующих SHA.

All listed corrections have been integrated. Tables retain the original findings as review history. Under the hood displays the current step's own documentation and pinned implementation links. The map contains 180 documentation references and 229 implementation references, including references reused across steps. Every implementation file and line range was checked against its pinned checkout.

## Существенные исправления / Material corrections

- `WATCH` показывает регистрацию наблюдателя и dirty-флаг попытки вместо вымышленных версий ключа; повторный WATCH не стирает конфликт.
- SHA1 возвращает `SCRIPT LOAD`, а `EVAL`/`EVALSHA` возвращают результат скрипта. После порога долгий скрипт может приводить к `BUSY`; автоматически он не прерывается.
- `UNLINK` передаёт в фон дорогие объекты при нужном refcount; дешёвые объекты освобождаются синхронно. Поведение `DEL` зависит от lazyfree-конфигурации.
- Уточнены Hash `listpackex`, условия перехода List в quicklist, `SET` против `APPEND`, вероятностный LRU/LFU и временное превышение maxmemory.
- Восстановление RDB возвращает Alice; завершённый дочерний процесс исчезает. AOF-сбой теряет новую несинхронизированную Carol, сохраняя ранее синхронизированного Bob.
- `PSYNC` идёт от реплики и запрашивает первый отсутствующий байт. Для `WAITAOF` отдельно показан fsync offset/FACK; `WAIT` не превращён в консенсус.
- Исправлены `ASKING`, различие Sentinel quorum/majority, локальные исключения cross-slot Lua и ответ отказа lock нужному клиенту.
- Согласованы число подписчиков и ответ PUBLISH, альтернативный исход до XACK, форма ответа XAUTOCLAIM, JSON-путь и результат, AVG и временная основа retention TimeSeries.

## Проверки / Validation

`npm run test:redis` проверяет учебные модели, локализацию, SVG, анимационный проигрыватель и полноту карты доказательств. Это проверка сайта, а не замена сверке с Redis.

Воспроизводимая дополнительная проверка настоящего Redis 8.0.0 без сторонних Python-пакетов:

```sh
python3 redis/tests/native_redis8.py --redis-server /path/to/redis-8.0.0/src/redis-server
```

В этом аудите **15 интеграционных тестов прошли** на бинарнике `v=8.0.0 sha=e91a340e:0 malloc=libc`. Он собран с `BUILD_WITH_MODULES=no MALLOC=libc`. Тесты создают одноразовые директории и приватные Unix sockets, проверяют RESP, rollback, WATCH expiry, Lua/SHA/BUSY, BLPOP, TTL, Pub/Sub, Streams/NOACK/trimming, Bitmap/GEO/HLL, RDB recovery, WAIT и условный lazyfree. Все временные процессы останавливаются.

Дополнительные native-проверки подтвердили упаковки и TTL полей Hash, функции Lua, а также 10 assertions на изолированном одноузловом Cluster: ASKING, CROSSSLOT, legacy/shebang/allow-cross-slot Lua и WAITAOF без AOF. Это не тест полноценного распределённого failover или всех сетевых разделений; их объяснения проверены по коду Sentinel/Cluster и официальной документации.

Module algorithms were reviewed in their pinned source and documentation, not executed. No real power-cut/storage-controller experiment, full distributed failure matrix, performance benchmark or proof of external fencing is claimed. Timing, capacities, sample hashes, exact eviction choices, memory pages, Stream IDs and shortened experiment replies remain explicitly marked teaching abstractions. Successful fsync still relies on the operating system and storage contract. The external resource must implement fencing itself.

После исправлений проверены 504 варианта SVG: clipping, text overlap, container overflow, missing motion roles и duplicate keys — 0. Отдельно проверены 20 анимационных вариантов RDB/AOF/WAIT/WAITAOF: значения и ответы появляются после соответствующих событий, навигация открывается после завершения.

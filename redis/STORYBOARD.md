# Redis изнутри / Redis Internals — storyboard

Учебная база / Teaching baseline: **Redis Open Source 8.0**.

Первые три главы — общий покадровый сценарий двух языковых версий. Как в Raft, одна остановка рассказывает одну мысль и даёт увидеть её на схеме. Под верхней панелью остаются только белое поле со схемой, подпись, «Повторить» и «Продолжить». Название главы доступно в меню и экранным читателям; счётчиков и нижних настроек нет. Полное объяснение текущего шага хранится в `step.detail` и открывается через «Об этом шаге» в меню вместе с источниками. «Продолжить» и «Повторить» доступны после завершения всей анимации; язык переключается без изменения шага и пройденного времени сцены.

The first three chapters share one step-by-step script across both languages. As in Raft, each stop introduces one idea and lets the diagram demonstrate it. Below the top bar, the page contains only the diagram on a white canvas, its caption, Replay and Continue. The chapter title remains available in the menu and to screen readers; counters and lower utility controls are removed. The complete explanation is preserved in `step.detail` and opens through “About this step” in the chapter menu alongside the sources. Continue and Replay unlock once the entire animation finishes; changing language preserves the step and elapsed scene time.

Ключевой объект сначала появляется в центре внимания. Когда добавляется новый участник, он плавно вырастает рядом с текущим объектом, а существующие объекты сдвигаются всей композицией. Места для ещё не появившихся объектов не резервируются. Движение объектов и движение сообщения — разные события: сначала меняется композиция, затем запрос доходит до получателя, меняется значение и возвращается ответ. Длительность показывает причинный порядок, а не производительность Redis.

The key object appears first at the center of attention. A new participant grows from the object being explained while existing objects move as a composition. Empty slots are not reserved for objects that have not appeared. Object movement and message delivery are separate events: the composition settles, a request reaches its recipient, the value changes, and the reply returns. Durations illustrate causality rather than Redis performance.

## Первый ключ / Your first key

Проследим SET и GET: от приложения до байтов в памяти.

Follow SET and GET from your application to bytes in memory.

| Шаг / Step | Русский | English | Схема / Diagram | Команда / Command |
| --- | --- | --- | --- | --- |
| 1 | **Приложение просит сохранить**<br>Приложение отправляет SET: сохранить Alice под именем user:1. Это имя называется ключом. | **The application asks to store**<br>An application sends SET: store Alice under the name user:1. That name is the key. | Клиент появляется в центре; видна команда SET.<br>The client appears at the center with its SET command. | <code>SET user:1 Alice</code> |
| 2 | **Сервер ищет место**<br>Сначала Redis ищет user:1. Ключа ещё нет — добавим новую запись. | **The server finds the key**<br>First, Redis looks for user:1. The key is missing, so we need a new entry. | Появляется Redis, клиент плавно уступает ему место; SET доходит до сервера, который ищет ключ.<br>Redis appears and the client moves aside; SET reaches the server, which looks up the key. | <code>SET user:1 Alice</code> |
| 3 | **Значение появляется в RAM**<br>Теперь в оперативной памяти хранится связь user:1 → Alice. Это и есть наша первая запись. | **The value enters RAM**<br>Memory now holds user:1 → Alice. We have our first entry. | В RAM появляется связь user:1 → Alice.<br>RAM gains the association user:1 → Alice. | <code>TYPE user:1<br>string</code> |
| 4 | **Возвращается OK**<br>SET выполнен — клиенту уходит OK. Сохранение на диск и передача репликам — отдельные шаги. | **OK travels back**<br>SET has executed, so OK goes back to the client. Reaching disk or a replica takes separate work. | Ответ OK возвращается клиенту; память остаётся видимой.<br>OK returns to the client while memory remains visible. | <code>SET user:1 Alice<br>OK</code> |
| 5 | **Читаем тем же ключом**<br>Попросим Alice командой GET. Redis находит тот же ключ и читает значение прямо из памяти. | **Read using the same key**<br>Let’s ask for Alice with GET. Redis finds the same key and reads its value directly from memory. | GET проходит к той же записи; Alice возвращается клиенту.<br>GET reaches the same entry and Alice returns to the client. | <code>GET user:1<br>"Alice"</code> |
| 6 | **Заменяем значение**<br>Повторный SET по тому же имени заменяет Alice на Bob. Ключ остаётся прежним. | **Replace the value**<br>Another SET using the same name replaces Alice with Bob. The key stays the same. | SET доходит до Redis; Alice заменяется на Bob, затем возвращается OK.<br>SET reaches Redis; Alice changes to Bob before OK returns. | <code>SET user:1 Bob<br>OK</code> |
| 7 | **Удаляем ключ**<br>DEL удаляет user:1. Следующий GET уже не находит ключ: это отсутствие значения, а не пустая строка. | **Delete the key**<br>DEL removes user:1. The next GET finds no key: a missing value is different from an empty string. | DEL удаляет запись; ответ подтверждает удаление, а последующее чтение не находит ключ.<br>DEL removes the entry; the reply confirms deletion, and the following read finds no key. | <code>DEL user:1<br>(integer) 1<br>GET user:1<br>(nil)</code> |

### Подробности через меню / Details in the chapter menu

- **RU:** Ключи и строки Redis двоично безопасны: они могут содержать произвольные байты. Redis не знает, является ли строка JSON, текстом UTF-8 или изображением. Интерпретацию выбирает приложение.
- **EN:** Redis keys and strings are binary-safe: they can contain arbitrary bytes. Redis does not know whether a string is JSON, UTF-8 text, or an image. The application supplies that interpretation.

- **RU:** Здесь и далее показана учебная модель Redis Open Source 8.0. Подписи RAM и Disk разделены намеренно: быстрое изменение памяти само по себе не определяет поведение при сбое. Позже добавим TTL, сохранение и реплики.
- **EN:** Throughout this story, the teaching baseline is Redis Open Source 8.0. RAM and Disk are separate on purpose: changing memory quickly does not by itself specify crash behavior. Later chapters add expiration, persistence, and replicas.

### Источники / Sources

- [SET](https://redis.io/docs/latest/commands/set/)
- [GET](https://redis.io/docs/latest/commands/get/)
- [Keys and values](https://redis.io/docs/latest/develop/using-commands/keyspace/)

## Путешествие запроса / A request’s journey

TCP переносит байты, RESP обозначает границы, Redis исполняет команду.

TCP carries bytes, RESP defines their boundaries, and Redis executes the command.

| Шаг / Step | Русский | English | Схема / Diagram | Команда / Command |
| --- | --- | --- | --- | --- |
| 1 | **Соединение уже открыто**<br>Начнём с соединения: по нему приложение будет отправлять команды и получать ответы. | **A connection is open**<br>We start with a connection. The application will send commands and receive replies through it. | Соединение клиента; выделены буферы на стороне сервера.<br>The client connection and server-side buffers. | <code>127.0.0.1:6379</code> |
| 2 | **Команда становится RESP**<br>Библиотека записывает команду в формате RESP. Перед каждым аргументом указано, сколько в нём байтов. | **The command becomes RESP**<br>The client library encodes the command using RESP. Each argument is preceded by its byte length. | Команда разбивается на три аргумента RESP с длинами в байтах.<br>The command becomes three RESP arguments with byte lengths. | <code>*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAlice\r\n</code> |
| 3 | **Пришла только часть**<br>Пока пришло только Ali. Redis сохраняет эти байты в буфере и ждёт остаток команды. | **Only a fragment arrives**<br>Only Ali has arrived so far. Redis keeps these bytes in a buffer and waits for the rest of the command. | Фрагмент заканчивается на Ali; разбор ждёт продолжения.<br>A fragment ends at Ali; parsing waits for the remainder. | <code>*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAli</code> |
| 4 | **Теперь команда полная**<br>Пришли ce и конец аргумента. Теперь Redis может разобрать всю команду: SET, user:1, Alice. | **The command is complete**<br>Now ce and the argument terminator arrive. Redis can parse the full command: SET, user:1, Alice. | Добавляются ce и CRLF; команда отмечена как полная.<br>ce and CRLF complete the command. | <code>ce\r\n</code> |
| 5 | **Проверки перед изменением**<br>Перед исполнением Redis проверяет команду, аргументы и права доступа (ACL). Ошибка возвращается клиенту. | **Checks before mutation**<br>Before execution, Redis checks the command, arguments, and access permissions (ACL). Failed checks return an error. | Видны шлюзы проверки: команда, аргументы, ACL, ограничения.<br>Checkpoints show command lookup, arguments, ACL, and server restrictions. | <code>SET user:1<br>(error) ERR wrong number of arguments for 'set' command</code> |
| 6 | **Ответ тоже буферизуется**<br>Ответ +OK сначала попадает в выходной буфер. Затем соединение доставляет его клиенту. | **The reply is buffered too**<br>The +OK reply first enters an output buffer. The connection then carries it back to the client. | Выходной буфер содержит +OK; сокет доставляет ответ.<br>The output buffer contains +OK and the socket delivers it. | <code>+OK\r\n</code> |

### Подробности через меню / Details in the chapter menu

- **RU:** RESP2 и RESP3 по-разному представляют некоторые ответы. В примерах используется знакомое отображение redis-cli; (nil) — отображение отсутствующего значения, а не буквальные байты протокола. Длины RESP всегда считаются в байтах, поэтому русская буква может занимать больше одного байта.
- **EN:** RESP2 and RESP3 represent some replies differently. Examples use the familiar redis-cli display; (nil) displays a missing value rather than literal protocol bytes. RESP lengths always count bytes, so a Cyrillic letter can occupy more than one byte.

- **RU:** AUTH/HELLO и ACL определяют, от какого пользователя выполняется команда и что ему разрешено. TLS, если настроен, защищает транспорт; он не меняет семантику SET. Схема показывает логические этапы, а не обещает отдельный поток или сетевой пакет на каждый этап.
- **EN:** AUTH/HELLO and ACL determine the executing user and allowed operations. Configured TLS protects the transport without changing SET semantics. The diagram shows logical stages; it does not assign a separate thread or network packet to each stage.

### Источники / Sources

- [RESP specification](https://redis.io/docs/latest/develop/reference/protocol-spec/)
- [ACL](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)
- [Client handling](https://redis.io/docs/latest/develop/reference/clients/)

## Кто выполняет команды / Who executes commands

Много соединений обслуживаются циклом событий, а обычные команды выполняются последовательно.

An event loop serves many connections while ordinary commands execute sequentially.

| Шаг / Step | Русский | English | Схема / Diagram | Команда / Command |
| --- | --- | --- | --- | --- |
| 1 | **Три клиента, один сервер**<br>Подключим A, B и C. Цикл событий (event loop) позволяет Redis обслуживать их соединения по мере готовности. | **Three clients, one server**<br>Let’s connect A, B, and C. An event loop lets Redis service their connections as they become ready. | Три клиента A/B/C подключены к одному Redis.<br>Three clients A/B/C connect to one Redis. | <code>A: SET user:1 Alice<br>B: GET user:1<br>C: PING</code> |
| 2 | **Просыпаются готовые соединения**<br>Операционная система сообщает, какие соединения готовы. В нашей сцене Redis сначала займётся A. | **Ready connections wake up**<br>The operating system reports which connections are ready. In our scene, Redis handles A first. | Цикл событий выбирает готовые сокеты и таймеры.<br>The event loop selects ready sockets and timers. | <code>A → readable<br>B → readable<br>C → readable</code> |
| 3 | **A меняет значение**<br>A выполняет SET. Пока эта обычная команда меняет данные, другая команда не вклинивается в её работу. | **A changes a value**<br>A runs SET. While this ordinary command changes the data, another command cannot interrupt its work. | Основной исполнитель занят SET клиента A.<br>The main executor handles A’s SET. | <code>A: SET user:1 Alice<br>OK</code> |
| 4 | **B видит результат**<br>Теперь очередь B: GET читает Alice. Результат зависит от порядка исполнения — здесь SET успел раньше. | **B sees the result**<br>Now B runs GET and reads Alice. The result depends on execution order: here, SET happened first. | Исполнитель переходит к GET клиента B; виден результат SET.<br>The executor handles B’s GET, which sees the SET result. | <code>B: GET user:1<br>"Alice"</code> |
| 5 | **У сервера есть помощники**<br>Если включить I/O threads, они помогают с сетью. Обычные команды над ключами по-прежнему идут последовательно. | **The server has helpers**<br>When enabled, I/O threads help with networking. Ordinary key commands still execute sequentially. | Основной исполнитель, I/O threads и фоновые задачи разделены.<br>Command execution, I/O threads, and background tasks are separated. | <code>io-threads 4</code> |
| 6 | **Длинная команда задерживает C**<br>Пока исполнитель занят, PING клиента C тоже ждёт. Здесь скрипт завершится до порога ответа BUSY. | **A long command delays C**<br>While execution is busy, C’s PING waits too. Here, the script finishes before the BUSY threshold. | Длинная команда занимает исполнителя; PING клиента C ожидает.<br>A long command occupies execution while C’s PING waits. | <code>A: EVAL "local n=0; for i=1,10000000 do n=n+i end; return n" 0<br>C: PING</code> |

### Подробности через меню / Details in the chapter menu

- **RU:** Фраза «Redis однопоточный» описывает лишь часть системы. В этой модели один основной исполнитель упорядочивает обычные команды над ключами; сеть, фоновые потоки, дочерний процесс RDB и специализированные подсистемы имеют другие роли. Это не обещание одного потока во всём процессе.
- **EN:** “Redis is single-threaded” describes only part of the system. In this model, one main executor orders ordinary key commands; networking, background threads, an RDB child process, and specialized subsystems have other roles. The entire process is not limited to one thread.

- **RU:** Рисунок намеренно выбирает один возможный порядок клиентов. Приложение должно синхронизироваться ответами, атомарными командами или специальными механизмами, а не предположением «A отправил на миллисекунду раньше B». Команды одного соединения обрабатываются в его порядке.
- **EN:** The scene deliberately picks one possible client schedule. Applications should coordinate using replies, atomic commands, or explicit mechanisms rather than assuming “A sent one millisecond before B.” Commands on one connection are processed in that connection’s order.

### Источники / Sources

- [Redis 8 architecture changes](https://redis.io/blog/redis-8-ga/)
- [Redis 8 networking source](https://github.com/redis/redis/blob/8.0/src/networking.c)
- [Redis 8 event loop](https://github.com/redis/redis/blob/8.0/src/ae.c)

## Правило подачи для всех 21 глав / Presentation rule for all 21 chapters

- У каждой остановки есть короткая подпись на двух языках: одна мысль, привязанная к видимому действию. Количество остановок определяется материалом главы: первый ключ раскрывается за семь шагов, словарь — за пять. / Every stop has a short bilingual caption tied to one visible idea. Each chapter uses the number of stops its material needs: the first key takes seven steps, the dictionary takes five.
- Сначала наблюдаем конкретный пример, затем называем механизм. Новые термины раскрываются по ходу рассказа. / Show a concrete example first, then name the mechanism. Introduce terms as the story needs them.
- Подробности и ограничения не удалены: исходные полные объяснения сохранены в `step.detail`, дополнительные пояснения главы — в `chapter.deeper`. / Details and limitations are retained: complete original explanations are in `step.detail`, with chapter notes in `chapter.deeper`.
- У каждой главы сохраняется стабильный ID. Разделённые или объединённые остановки используют общий `beats.js`, чтобы текст, схема, анимация и источники объясняли один и тот же механизм. / Each chapter retains a stable ID. Split and combined stops share `beats.js`, keeping narration, diagrams, animation and evidence aligned.

## Проверка / Acceptance checks

- Основная подпись в каждом языке — не более 160 символов; полное пояснение доступно через «Об этом шаге» в меню. / Every main caption stays within 160 characters per language; its complete explanation is available through “About this step” in the menu.

- Под схемой видны только подпись, «Повторить» и «Продолжить». Обе кнопки разблокируются после последнего кадра, включая плавное появление управления. / Below the diagram, only the caption, Replay and Continue remain. Both buttons unlock after the last animation, including the controls reveal.
- При появлении участника существующие объекты плавно занимают новую композицию; значения не меняются до прибытия соответствующего запроса. / Introducing a participant moves existing objects into the new composition; values do not change before the corresponding request arrives.

- Обе версии показывают одинаковый механизм и одинаковый порядок шагов. / Both languages show the same mechanism and step sequence.
- SET не считается завершённым, пока команда не получена целиком и не прошла проверки. / SET does not execute before complete input and successful checks.
- OK не изображается как безусловная запись на диск или подтверждение реплики. / OK does not imply unconditional disk durability or replica acknowledgment.
- Между клиентами не обещается глобальная FIFO-очередь. / No global FIFO ordering is promised across clients.
- Сеть, основной исполнитель и фоновые работы имеют различимые роли. / Networking, command execution, and background work have distinct roles.
- На узком экране схема и оба языка не требуют горизонтальной прокрутки страницы; русский и английский переключаются в интерфейсе, а эта таблица служит авторским документом. / The live interface fits narrow screens in either language; this side-by-side table is an authoring document.

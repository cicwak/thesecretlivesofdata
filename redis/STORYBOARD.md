# Redis изнутри / Redis Internals — storyboard

Учебная база / Teaching baseline: **Redis Open Source 8.0**.

Первые три главы — общий покадровый сценарий двух языковых версий. Одна строка — одна остановка рассказа: короткий текст, изменение схемы, команда. Next/Back меняют шаг; Repeat повторяет текущую сцену; язык переключается без изменения шага или состояния эксперимента.

The first three chapters share one step-by-step script across both languages. Each row is one narrative stop: a short explanation, a diagram change, and a command. Next/Back change the step; Repeat replays the current scene; language changes preserve both the step and experiment state.

## Первый ключ / Your first key

Проследим SET и GET: от приложения до байтов в памяти.

Follow SET and GET from your application to bytes in memory.

| Шаг / Step | Русский | English | Схема / Diagram | Команда / Command |
| --- | --- | --- | --- | --- |
| 1 | **Приложение просит сохранить**<br>Клиент отправляет SET с именем user:1 и значением Alice. Ключ — адрес, по которому приложение затем попросит данные. Двоеточие здесь просто удобная часть имени. | **The application asks to store**<br>The client sends SET with the name user:1 and the value Alice. The key is the address the application will use to request the data. The colon is simply a naming convention. | Клиент и пустая память; команда отправляется к серверу.<br>A client and empty memory; the command travels to the server. | <code>SET user:1 Alice</code> |
| 2 | **Сервер ищет место**<br>Redis проверяет, существует ли user:1 в выбранной базе. В этой сцене база пустая: нужно добавить новую запись в словарь ключей. Ни папок, ни таблицы users не создаётся. | **The server finds the key**<br>Redis checks whether user:1 exists in the selected database. Our database is empty, so it needs a new keyspace entry. No folders or users table are created. | Выделяется адрес user:1 в пространстве ключей.<br>The user:1 entry is located in the keyspace. | <code>EXISTS user:1<br>(integer) 0</code> |
| 3 | **Значение появляется в RAM**<br>В оперативной памяти появляется связь user:1 → Alice. Redis хранит не только буквы: нужны имя ключа, объект значения и служебные данные. У этого ключа пока нет срока жизни. | **The value enters RAM**<br>Memory now contains the association user:1 → Alice. Redis needs more than the letters: it also stores the key, a value object, and bookkeeping data. This key has no expiration yet. | В RAM появляется связь user:1 → Alice.<br>RAM gains the association user:1 → Alice. | <code>TYPE user:1<br>string</code> |
| 4 | **Возвращается OK**<br>После исполнения сервер формирует ответ OK. Он подтверждает выполнение SET на этом сервере. Было ли изменение записано на диск или получено репликой, зависит от отдельных механизмов и настроек. | **OK travels back**<br>After execution, the server produces OK. It confirms that this server executed SET. Whether the change reached disk or a replica depends on separate mechanisms and configuration. | Ответ OK возвращается клиенту; память остаётся видимой.<br>OK returns to the client while memory remains visible. | <code>SET user:1 Alice<br>OK</code> |
| 5 | **Читаем тем же ключом**<br>GET снова находит user:1 и читает строку из памяти. Клиент получает Alice. Для обычного чтения Redis не ищет значение в RDB или AOF на диске. | **Read using the same key**<br>GET looks up user:1 again and reads its string from memory. The client receives Alice. An ordinary read does not look up the value in an RDB or AOF file on disk. | GET проходит к той же записи; Alice возвращается клиенту.<br>GET reaches the same entry and Alice returns to the client. | <code>GET user:1<br>"Alice"</code> |
| 6 | **Перезаписываем и удаляем**<br>SET user:1 Bob заменяет прежнее значение. DEL убирает ключ: следующий GET вернёт отсутствие значения, а не пустую строку. Изменяется запись по одному имени, а не создаётся история версий. | **Replace and delete**<br>SET user:1 Bob replaces the old value. DEL removes the key: a subsequent GET returns a missing value, not an empty string. These operations update one named entry rather than create a version history. | Alice заменяется на Bob; затем запись удаляется и GET не находит ключ.<br>Alice is replaced by Bob; deletion removes the entry and GET finds no key. | <code>SET user:1 Bob<br>OK<br>DEL user:1<br>(integer) 1<br>GET user:1<br>(nil)</code> |

### Глубже / Deeper

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
| 1 | **Соединение уже открыто**<br>Клиент устанавливает соединение с Redis, обычно по TCP. Одно соединение можно использовать для многих команд. На сервере у клиента есть своё состояние, входной буфер и место для ответов. | **A connection is open**<br>The client connects to Redis, usually over TCP. One connection can carry many commands. The server maintains per-client state, an input buffer, and space for pending replies. | Соединение клиента; выделены буферы на стороне сервера.<br>The client connection and server-side buffers. | <code>127.0.0.1:6379</code> |
| 2 | **Команда становится RESP**<br>Библиотека кодирует SET user:1 Alice как массив из трёх строк. Числа после $ — длины в байтах. Поэтому пробелы и переводы строк внутри значения не путают границы аргументов. | **The command becomes RESP**<br>The library encodes SET user:1 Alice as an array of three strings. The numbers after $ are byte lengths. Spaces and line breaks inside a value therefore do not confuse argument boundaries. | Команда разбивается на три аргумента RESP с длинами в байтах.<br>The command becomes three RESP arguments with byte lengths. | <code>*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAlice\r\n</code> |
| 3 | **Пришла только часть**<br>TCP — поток байтов, а не доставка готовых команд. Первая порция заканчивается на Ali. Redis сохраняет полученные данные; оставшиеся байты значения ещё нужны, поэтому этот SET пока не исполняется. | **Only a fragment arrives**<br>TCP is a byte stream rather than a command delivery service. The first fragment ends at Ali. Redis retains the input; it still needs the remaining value bytes, so this SET does not execute yet. | Фрагмент заканчивается на Ali; разбор ждёт продолжения.<br>A fragment ends at Ali; parsing waits for the remainder. | <code>*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAli</code> |
| 4 | **Теперь команда полная**<br>Приходят ce и завершающие байты. Разборщик протокола получает три полных аргумента. В той же порции сети могла оказаться и следующая команда: границы задаёт RESP, а не размер пакета. | **The command is complete**<br>The remaining ce and terminator arrive. The protocol parser now has three complete arguments. The same network read could contain another command as well: RESP, rather than packet size, defines the boundaries. | Добавляются ce и CRLF; команда отмечена как полная.<br>ce and CRLF complete the command. | <code>ce\r\n</code> |
| 5 | **Проверки перед изменением**<br>Redis находит обработчик команды и проверяет число аргументов, доступ ACL и ограничения сервера. Обработчик проверяет подходящий тип данных там, где он нужен. При ошибке клиент получит ответ об ошибке. | **Checks before mutation**<br>Redis finds the command handler and checks argument count, ACL permissions, and server restrictions. The handler checks data types where relevant. A failed check produces an error reply for the client. | Видны шлюзы проверки: команда, аргументы, ACL, ограничения.<br>Checkpoints show command lookup, arguments, ACL, and server restrictions. | <code>SET user:1<br>(error) ERR wrong number of arguments for 'set' command</code> |
| 6 | **Ответ тоже буферизуется**<br>После исполнения ответ попадает в выходной буфер клиента и уходит, когда соединение готово к записи. Библиотека разбирает +OK. Медленный получатель может задерживать отправку уже подготовленных ответов. | **The reply is buffered too**<br>After execution, the reply enters the client’s output buffer and is sent when the connection can accept writes. The library parses +OK. A slow reader can delay replies that the server has already prepared. | Выходной буфер содержит +OK; сокет доставляет ответ.<br>The output buffer contains +OK and the socket delivers it. | <code>+OK\r\n</code> |

### Глубже / Deeper

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
| 1 | **Три клиента, один сервер**<br>Клиенты A, B и C держат отдельные соединения. Ожидание сети одного клиента не требует остановить остальные. Redis следит за готовностью соединений через цикл событий (event loop). | **Three clients, one server**<br>Clients A, B, and C each have a connection. Waiting for one client’s network does not require stopping the others. Redis watches connection readiness through an event loop. | Три клиента A/B/C подключены к одному Redis.<br>Three clients A/B/C connect to one Redis. | <code>A: SET user:1 Alice<br>B: GET user:1<br>C: PING</code> |
| 2 | **Просыпаются готовые соединения**<br>Операционная система сообщает, какие сокеты готовы к чтению или записи. Redis обрабатывает готовую работу и таймеры. Это не обязательная общая FIFO-очередь всех клиентов: сетевое прибытие не задаёт универсальный порядок. | **Ready connections wake up**<br>The operating system reports which sockets can be read or written. Redis handles ready work and timers. This is not a mandatory global FIFO queue: network arrival does not define a universal order across clients. | Цикл событий выбирает готовые сокеты и таймеры.<br>The event loop selects ready sockets and timers. | <code>A → readable<br>B → readable<br>C → readable</code> |
| 3 | **A меняет значение**<br>В нашем выбранном порядке сначала выполняется SET клиента A. Пока обычная команда меняет данные, другая обычная команда не вклинивается в её середину. После завершения Redis может перейти к следующей работе. | **A changes a value**<br>In our chosen schedule, client A’s SET executes first. Another ordinary command does not interleave with this command’s data mutation. Once it finishes, Redis can move on to other work. | Основной исполнитель занят SET клиента A.<br>The main executor handles A’s SET. | <code>A: SET user:1 Alice<br>OK</code> |
| 4 | **B видит результат**<br>Теперь выполняется GET клиента B и видит Alice. Если бы GET был исполнен до SET, результат был бы другим. Последовательное исполнение команд не означает, что приложение заранее знает порядок между соединениями. | **B sees the result**<br>Client B’s GET now executes and sees Alice. Executing GET before SET would produce a different result. Sequential command execution does not mean an application can predict ordering across connections. | Исполнитель переходит к GET клиента B; виден результат SET.<br>The executor handles B’s GET, which sees the SET result. | <code>B: GET user:1<br>"Alice"</code> |
| 5 | **У сервера есть помощники**<br>В Redis 8 сетевые I/O threads могут помогать с вводом, выводом и разбором. Отдельно работают фоновые задачи: например, освобождение памяти или fsync. Обычные команды этого рассказа всё равно изменяют основной набор данных последовательно. | **The server has helpers**<br>Redis 8 can use I/O threads for network reads, writes, and parsing. Background work includes memory reclamation and fsync. The ordinary commands in this story still mutate the main dataset sequentially. | Основной исполнитель, I/O threads и фоновые задачи разделены.<br>Command execution, I/O threads, and background tasks are separated. | <code>io-threads 4</code> |
| 6 | **Длинная команда задерживает C**<br>Если исполнитель занят дорогой командой или долгим Lua-скриптом, короткий PING тоже ждёт своей возможности выполниться. Быстрая сеть и свободные I/O threads не сокращают работу внутри долгой команды. | **A long command delays C**<br>When command execution is occupied by an expensive command or a long Lua script, a short PING also waits for its turn to execute. Fast networking and available I/O threads cannot shorten that command’s work. | Длинная команда занимает исполнителя; PING клиента C ожидает.<br>A long command occupies execution while C’s PING waits. | <code>A: EVAL "local n=0; for i=1,10000000 do n=n+i end; return n" 0<br>C: PING</code> |

### Глубже / Deeper

- **RU:** Фраза «Redis однопоточный» описывает лишь часть системы. В этой модели один основной исполнитель упорядочивает обычные команды над ключами; сеть, фоновые потоки, дочерний процесс RDB и специализированные подсистемы имеют другие роли. Это не обещание одного потока во всём процессе.
- **EN:** “Redis is single-threaded” describes only part of the system. In this model, one main executor orders ordinary key commands; networking, background threads, an RDB child process, and specialized subsystems have other roles. The entire process is not limited to one thread.

- **RU:** Рисунок намеренно выбирает один возможный порядок клиентов. Приложение должно синхронизироваться ответами, атомарными командами или специальными механизмами, а не предположением «A отправил на миллисекунду раньше B». Команды одного соединения обрабатываются в его порядке.
- **EN:** The scene deliberately picks one possible client schedule. Applications should coordinate using replies, atomic commands, or explicit mechanisms rather than assuming “A sent one millisecond before B.” Commands on one connection are processed in that connection’s order.

### Источники / Sources

- [Redis 8 architecture changes](https://redis.io/blog/redis-8-ga/)
- [Redis 8 networking source](https://github.com/redis/redis/blob/8.0/src/networking.c)
- [Redis 8 event loop](https://github.com/redis/redis/blob/8.0/src/ae.c)

## Проверка / Acceptance checks

- Обе версии показывают одинаковый механизм и одинаковый порядок шагов. / Both languages show the same mechanism and step sequence.
- SET не считается завершённым, пока команда не получена целиком и не прошла проверки. / SET does not execute before complete input and successful checks.
- OK не изображается как безусловная запись на диск или подтверждение реплики. / OK does not imply unconditional disk durability or replica acknowledgment.
- Между клиентами не обещается глобальная FIFO-очередь. / No global FIFO ordering is promised across clients.
- Сеть, основной исполнитель и фоновые работы имеют различимые роли. / Networking, command execution, and background work have distinct roles.
- На узком экране схема и оба языка не требуют горизонтальной прокрутки страницы; русский и английский переключаются в интерфейсе, а эта таблица служит авторским документом. / The live interface fits narrow screens in either language; this side-by-side table is an authoring document.

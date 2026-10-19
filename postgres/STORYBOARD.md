# Postgres: editorial storyboard

One question opens each chapter. Each stop couples its caption to an explicit diagram state, SQL and sources in chapters/. Details are in both languages.

## 01. Сохранить первый заказ / Save the first order

Приложение приняло заказ. Как сохранить его и прочитать обратно?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Покупатель оформил заказ №17. Пока он существует только в приложении. | A customer placed order 17. For now, it exists only in the app. | client |
| 2 | Приложение отправляет INSERT по соединению с сервером. | The app sends INSERT over its connection to the server. | client → server |
| 3 | Сервер добавляет строку в неявной транзакции. Ответ об успехе ещё не отправлен. | The server inserts the row in an implicit transaction. It has not replied with success yet. | client → server → table |
| 4 | Неявная транзакция фиксируется, и только затем приложение получает успешный ответ. | The implicit transaction commits before the app receives a successful reply. | client → server → table |
| 5 | Следующий запрос просит вернуть сохранённый заказ. | The next query asks for the saved order. | client → server → table |
| 6 | Приложение получает ровно те значения, которые сохранило: 17, Book, 1. | The app receives exactly the saved values: 17, Book, 1. | client → server → table |

**Дальше:** Заказ вернулся. Почему данные организованы в строки и столбцы?

## 02. Строки, типы и ограничения / Rows, types, and constraints

Как хранить много заказов так, чтобы их смысл не терялся?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | У каждого заказа повторяются одни и те же поля. | Every order repeats the same fields. | table |
| 2 | Схема объявляет, какие значения допустимы в каждом столбце. | The schema declares which values each column accepts. | table |
| 3 | Количество «many» нельзя представить как integer: строка не добавляется. | The value “many” is not an integer, so the row is not inserted. | client → server → table |
| 4 | Ограничения отсекают повторный номер и неположительное количество. | Constraints reject a duplicate ID and a nonpositive quantity. | status → table |
| 5 | Теперь новый заказ проходит все проверки и становится обычной строкой. | A valid new order passes all checks and becomes another row. | client → table → server |

**Дальше:** Один заказ сохранён. А если одно действие должно изменить сразу две строки?

## 03. Одно действие — несколько изменений / One action, several changes

Как перевести 30 так, чтобы деньги не исчезли между двумя UPDATE?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | На счетах 100 и 50. Перевод 30 должен сохранить общую сумму 150. | The balances are 100 and 50. A transfer of 30 must preserve their total of 150. | table |
| 2 | BEGIN открывает группу изменений; первое UPDATE списывает 30 со счёта A. | BEGIN opens the change group; the first UPDATE debits 30 from A. | client → server → table |
| 3 | Второе UPDATE зачисляет те же 30 на счёт B. | The second UPDATE credits the same 30 to B. | server → table |
| 4 | COMMIT фиксирует оба изменения как один завершённый перевод. | COMMIT commits both changes as one completed transfer. | client → server → table |
| 5 | В альтернативном запуске после списания приложение обнаруживает ошибку. | In an alternative run, the app detects a problem after the debit. | client → server → table |
| 6 | ROLLBACK отменяет результат группы: для новых чтений снова 100 и 50. | ROLLBACK cancels the group’s result: new reads again see 100 and 50. | server → table → client |

**Дальше:** Изменения объединены. Как быстро найти нужный заказ среди многих?

## 04. Найти заказы покупателя / Find a customer’s orders

Почему поиск customer_id=42 начинает делать слишком много работы?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Запросу нужны заказы покупателя 42, а не все заказы магазина. | The query needs customer 42’s orders, not every order in the store. | table |
| 2 | Таблица выросла до 100 000 строк. Полный просмотр всё ещё проверяет каждую. | The table grows to 100,000 rows. A full scan still checks every row. | timeline → status |
| 3 | B-tree связывает упорядоченный ключ customer_id с адресами строк. | A B-tree maps ordered customer_id keys to row locations. | tree |
| 4 | Поиск ключа 42 ведёт к двум адресам вместо проверки всех строк. | Looking up key 42 leads to two locations instead of testing every row. | tree → table |
| 5 | Подходящий индекс добавляет короткий путь; планировщик решает, выгоден ли он. | A suitable index adds a shortcut; the planner decides whether it is worthwhile. | status → table |

**Дальше:** Индекс нашёл адрес. Что именно находится по этому адресу?

## 05. Адрес внутри страницы / A location inside a page

Что означает адрес версии (4,2), полученный из индекса?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Файл таблицы состоит из страниц фиксированного размера. | A table file consists of fixed-size pages. | timeline |
| 2 | Первая часть адреса выбирает страницу 4. | The first part of the location selects page 4. | timeline → page |
| 3 | Вторая часть выбирает указатель 2, а он указывает на байты версии заказа 17. | The second part selects item identifier 2, which points to order 17’s tuple bytes. | page → status |
| 4 | Указатели растут от начала страницы, версии — от конца; между ними свободное место. | Item identifiers grow from the front, tuples from the back; free space lies between. | page |
| 5 | Версия содержит служебный заголовок и значения столбцов. | A tuple contains a system header and column values. | table |
| 6 | Адрес версии полезен серверу, а приложению нужен устойчивый ключ id=17. | The server uses tuple locations; the app needs the stable key id=17. | status → timeline |

**Дальше:** Страницу нашли в файле. Откуда её читает работающий запрос?

## 06. Страницы в памяти / Pages in memory

Нужно ли читать страницу с диска при каждом запросе?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Запросу нужна страница 4; обслуживающий процесс ищет её в shared buffers. | A query needs page 4; its backend looks in shared buffers. | server → buckets |
| 2 | Страницы нет в кеше: сервер выделяет буфер и загружает её. | The page is absent: the server chooses a buffer and loads it. | page → buckets |
| 3 | Пока процесс работает со страницей, pin защищает буфер от замены. | While a backend uses the page, a pin protects its buffer from replacement. | server → page |
| 4 | Следующее чтение находит страницу в кеше и получает значения без нового чтения файла. | The next read finds the page in cache without another file read. | server → page → client |
| 5 | UPDATE меняет страницу в памяти и делает буфер грязным. | UPDATE changes the page in memory and marks the buffer dirty. | server → page → page |
| 6 | Грязную страницу можно записать позже, когда сохранён соответствующий WAL. | The dirty page can be written later, once its corresponding WAL is durable. | page → page → status |

**Дальше:** Страница имеет конечный размер. Как поместить в неё длинное значение?

## 07. Значение больше страницы / A value larger than a page

Что делать с описанием товара длиной 20 000 символов?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Описание на 20 000 символов нельзя просто растянуть через границы heap-страницы. | A 20,000-character description cannot simply stretch across heap-page boundaries. | box → page |
| 2 | Сначала подходящее значение можно сжать и оставить прямо в строке. | An eligible value may first be compressed and kept inside the tuple. | box → page |
| 3 | Если строка всё ещё велика, значение делится на части во внешней TOAST-таблице. | If the tuple is still too large, the value is split into chunks in a TOAST table. | page → table |
| 4 | Запрос только номера заказа может обойтись без сборки длинного описания. | A query for only the order ID can avoid reconstructing the long description. | server → page → table |
| 5 | Когда нужен note, сервер находит части и возвращает одно логическое значение. | When note is needed, the server locates its chunks and returns one logical value. | table → server → client |

**Дальше:** Значения разместились. Как сервер сохраняет их при внезапном сбое?

## 08. Сначала журнал / The log comes first

Как защитить изменение, если страница таблицы ещё в памяти?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | В памяти уже qty=2, а в файле таблицы ещё qty=1. | Memory already contains qty=2, while the table file still contains qty=1. | page → page |
| 2 | Для изменения создаётся WAL-запись, достаточная для повторения работы. | The change generates a WAL record sufficient to redo the work. | page → wal |
| 3 | WAL buffers пока тоже находятся в памяти. Это ещё не надёжное сохранение. | WAL buffers are also in memory. This is not yet durable storage. | wal → status → page |
| 4 | Write переносит WAL в файловую систему, где его ещё может держать кеш ОС. | Write sends WAL to the filesystem, where the OS cache may still hold it. | wal → box → status |
| 5 | Flush обеспечивает сохранение WAL до позиции 0/140 на устойчивом хранении. | Flush makes WAL through 0/140 durable. | box → wal |
| 6 | Теперь страницу с LSN 0/140 разрешено записать в файл таблицы. | The page with LSN 0/140 can now be written to the table file. | wal → page → page |
| 7 | Один последовательный журнал защищает изменения многих страниц. | One sequential log protects changes to many pages. | buckets → wal |

**Дальше:** Журнал сохранён. В какой момент можно подтвердить всю транзакцию?

## 09. Когда ответить «сохранено» / When to reply “saved”

Изменения попали в WAL. Что ещё отделяет их от успешного COMMIT?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Приложение ждёт: транзакция T500 изменила заказ, но ещё не завершилась. | The app waits: transaction T500 changed the order but has not finished. | client → server → wal |
| 2 | COMMIT добавляет запись о завершении T500 в общий журнал. | COMMIT adds T500’s completion record to the shared log. | server → wal |
| 3 | Один flush может сохранить COMMIT сразу T500 и T501. | One flush can make both T500 and T501 commits durable. | wal → status |
| 4 | После фиксации сервер отправляет успех; страницы таблицы ещё могут оставаться грязными. | After commit, the server sends success; table pages may still be dirty. | server → client → page |
| 5 | Новый читатель после COMMIT получает qty=2. | A new reader after COMMIT obtains qty=2. | client → table → server |
| 6 | Если COMMIT сохранился, а ответ потерялся, результат для клиента неизвестен. | If COMMIT is durable but its reply is lost, the client does not know the outcome. | wal → server → client |

**Дальше:** Журнал растёт. Как ограничить работу при восстановлении?

## 10. Откуда начинать восстановление / Where recovery can begin

Нужно ли после сбоя повторять WAL с начала жизни сервера?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Чем больше изменений накопилось только в WAL, тем больше потенциальная работа REDO. | More changes preserved only in WAL can mean more REDO work. | wal → page |
| 2 | В начале checkpoint фиксируется REDO-позиция и набор нужных грязных буферов. | Checkpoint start establishes a REDO position and the dirty buffers that must be saved. | wal → buckets |
| 3 | Checkpointer записывает отмеченные страницы постепенно, соблюдая правило WAL. | The checkpointer gradually writes the marked pages while respecting the WAL rule. | buckets → buckets |
| 4 | Параллельные запросы продолжаются: уже записанная страница может снова стать грязной. | Queries continue: a page already written can become dirty again. | buckets → wal |
| 5 | После успешного завершения pg_control указывает на новую контрольную точку. | After successful completion, pg_control points to the new checkpoint. | wal → status |
| 6 | Теперь REDO начинается с 0/200; старые сегменты можно убрать, если они больше никому не нужны. | REDO can now start at 0/200; older segments can go only when no other consumer needs them. | wal → status |

**Дальше:** Контрольная точка завершена. Как Postgres применит журнал после сбоя?

## 11. Вернуться после сбоя / Recover after a crash

В памяти были изменения, а питание исчезло. Как собрать согласованное состояние?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | После сбоя память потеряна; остались страницы файлов и устойчивый WAL. | After the crash, memory is gone; data files and durable WAL remain. | page → wal |
| 2 | Startup читает pg_control и находит REDO последнего завершённого checkpoint. | Startup reads pg_control and finds REDO for the last completed checkpoint. | status → wal |
| 3 | REDO повторяет нужное изменение: страница снова получает qty=2. | REDO replays the required change, restoring qty=2 on the page. | wal → page |
| 4 | Изменение T501 может восстановиться физически, но без COMMIT не станет видимым результатом. | T501’s change may be physically replayed, yet without COMMIT it does not become visible data. | wal → page |
| 5 | После восстановления новый SELECT видит зафиксированный заказ 17 с qty=2. | After recovery, a new SELECT sees committed order 17 with qty=2. | server → table → client |
| 6 | Восстановленное состояние сохраняется; сервер снова принимает обычные запросы. | The recovered state is saved, and the server accepts normal queries again. | page → wal → client → server |

**Дальше:** Что меняется, если отвечать клиенту раньше надёжного flush?

## 12. Цена раннего подтверждения / The cost of an early reply

Можно ли уменьшить задержку COMMIT и какую гарантию это меняет?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | В обычном режиме ответ ждёт локального устойчивого WAL. | Normally, the reply waits for local durable WAL. | timeline |
| 2 | При synchronous_commit=off успех может уйти до flush commit-записи. | With synchronous_commit=off, success may precede the commit record’s flush. | timeline |
| 3 | Если WAL writer успевает выполнить flush, раннее подтверждение тоже переживает последующий сбой. | If the WAL writer flushes in time, the early-acknowledged commit survives a later crash. | wal → status → client |
| 4 | Если сбой случился раньше flush, недавно подтверждённая транзакция может исчезнуть. | If a crash happens before flush, a recently acknowledged transaction may disappear. | timeline → table |
| 5 | synchronous_commit=off и fsync=off — разные решения с разными последствиями. | synchronous_commit=off and fsync=off are different choices with different consequences. | table |

**Дальше:** WAL переживает сбой процесса. А если потерян весь диск?

## 13. Копия и восстановление во времени / A backup and recovery through time

Как восстановиться после потери диска или ошибочного удаления?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Файлы таблиц и WAL на одном потерянном диске исчезают вместе. | Table files and WAL disappear together if their shared disk is lost. | box → status |
| 2 | Логическая копия сохраняет определения и данные для последующего создания объектов. | A logical dump saves definitions and data for rebuilding objects. | table → box |
| 3 | Физическая базовая копия сохраняет файлы кластера и необходимые сведения для восстановления. | A physical base backup saves cluster files and the metadata needed for recovery. | server → box |
| 4 | Непрерывный архив WAL дополняет базовую копию последующими изменениями. | A continuous WAL archive extends the base backup with later changes. | box → wal |
| 5 | Цель 10:05 останавливает воспроизведение до ошибочного DELETE в 10:06. | A 10:05 target stops replay before the accidental DELETE at 10:06. | wal → table |
| 6 | Результат восстановления нужно проверить чтением нужных данных. | The recovery result must be checked by reading the required data. | table → client → server |

**Дальше:** Данные защищены. Почему одновременно работающим читателям нужны разные версии?

## 14. Почему UPDATE оставляет две версии / Why UPDATE leaves two versions

Как изменить заказ, не сломав уже начавшееся чтение?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Читатель начал запрос, когда заказ 17 имел qty=1. | A reader starts its query while order 17 has qty=1. | client → page → server |
| 2 | T500 создаёт новую версию qty=2, а старую помечает своим номером. | T500 creates a new qty=2 version and marks the old one with its ID. | client → page |
| 3 | До COMMIT чужой читатель видит qty=1, а не незавершённое qty=2. | Before COMMIT, another reader sees qty=1, not the unfinished qty=2. | client → page → status → server |
| 4 | После COMMIT новый снимок видит qty=2, а прежний снимок может продолжать видеть qty=1. | After COMMIT, a fresh snapshot sees qty=2, while the older snapshot may still see qty=1. | page → client → client → server |
| 5 | DELETE T501 помечает текущую версию, а не обязан немедленно стирать её байты. | DELETE T501 marks the current version rather than immediately erasing its bytes. | client → page |
| 6 | Логически заказа уже нет, физически его версии ещё могут лежать на странице. | The order is logically gone, yet its physical versions may remain on the page. | table → page |

**Дальше:** Версии помечены номерами транзакций. Откуда берутся эти номера?

## 15. Номер транзакции появляется не сразу / A transaction ID is assigned later

Получает ли каждый BEGIN следующий глобальный номер?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Два сеанса открыли транзакции и пока только читают. У них есть vxid, но XID может ещё не быть. | Two sessions begin transactions and only read. They have vxids, but may not yet have XIDs. | client → client |
| 2 | B первым начинает запись и получает 600; A записывает позже и получает 601. | B writes first and receives 600; A writes later and receives 601. | client → client → status |
| 3 | Транзакция 601 может зафиксироваться раньше, пока 600 всё ещё работает. | Transaction 601 may commit first while 600 is still running. | timeline → table |
| 4 | В заголовке версии — 32-битный XID; полный xid8 дополнительно учитывает эпоху. | A tuple header has a 32-bit XID; full xid8 also includes an epoch. | table → status |
| 5 | 32-битное пространство циклично; специальные номера пропускаются при выдаче обычных XID. | The 32-bit ID space is circular; reserved IDs are skipped during ordinary allocation. | ring |
| 6 | Даже запрос номера может выделить XID; вариант if_assigned этого не делает. | Even asking for an ID can allocate one; the if_assigned variant avoids doing so. | table → page |

**Дальше:** Номер записан в версии. Где узнать, завершилась ли эта транзакция?

## 16. Где хранится исход транзакции / Where a transaction’s outcome lives

У версии xmin=600. Как читатель выяснит, что сделала транзакция 600?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Одного числа xmin=600 недостаточно: транзакция могла работать, завершиться или отмениться. | The number xmin=600 is insufficient: its transaction might be active, committed, or aborted. | page → status |
| 2 | ProcArray в общей памяти описывает активные сеансы и их транзакции. | ProcArray in shared memory describes active sessions and their transactions. | page → table |
| 3 | pg_xact хранит компактные статусы по XID; доступ идёт через отдельный SLRU-кеш. | pg_xact stores compact statuses by XID, accessed through a separate SLRU cache. | table → status |
| 4 | COMMIT меняет статус 600; ему не нужно обходить каждую созданную версию. | COMMIT changes status 600 without visiting every tuple it created. | table → page |
| 5 | Позднейшее чтение может записать в заголовок hint bit «xmin committed». | A later read may set an “xmin committed” hint bit in the tuple header. | table → page |
| 6 | Статусы, родители вложенных транзакций и группы блокировок хранят разные сведения. | Statuses, subtransaction parents, and lock groups store different information. | table |

**Дальше:** Одна транзакция может отменить только часть работы. Как это устроено?

## 17. Отменить часть работы / Roll back part of the work

Как сохранить первый INSERT, если следующий фрагмент работы нужно отменить?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Верхняя транзакция 700 добавила заказ 20, но пока не фиксируется. | Top-level transaction 700 inserted order 20 but has not committed. | server → page |
| 2 | После SAVEPOINT новая запись получает subxid 701 с родителем 700. | After SAVEPOINT, a new write receives subxid 701 with parent 700. | page → tree |
| 3 | ROLLBACK TO отменяет заказ 21, сохраняя более ранний заказ 20. | ROLLBACK TO cancels order 21 while preserving the earlier order 20. | page → status |
| 4 | Новая ветка 702 добавляет заказ 22. RELEASE не делает её независимо надёжной. | A new branch, 702, inserts order 22. RELEASE does not make it independently durable. | page → tree |
| 5 | COMMIT родителя фиксирует 20 и 22; отменённый 21 не возвращается. | The parent COMMIT commits 20 and 22; aborted order 21 does not return. | table → table |

**Дальше:** Статусы известны. Как запомнить, что было видно в момент начала чтения?

## 18. Снимок — несколько чисел / A snapshot is a few numbers

Как сохранить прежний взгляд на данные, когда транзакции продолжают завершаться?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | 809 вставила Alice и ещё работает; 810 вставила Bob и уже зафиксировалась. | 809 inserted Alice and is still active; 810 inserted Bob and has committed. | table |
| 2 | Снимок сохраняет xmin=809, xmax=811 и активный список {809}. | The snapshot records xmin=809, xmax=811, and active list {809}. | status → timeline |
| 3 | 809 теперь делает COMMIT, но сохранённый список {809} не меняется. | 809 now commits, but the saved list {809} does not change. | status → table |
| 4 | 811 после снимка меняет Bob со 100 на 200 и фиксируется. | After snapshot capture, 811 changes Bob from 100 to 200 and commits. | page → status |
| 5 | Старый снимок возвращает Bob=100 и не возвращает Alice. | The older snapshot returns Bob=100 and does not return Alice. | status → table |
| 6 | Новый снимок после обеих фиксаций уже может вернуть Alice=1000 и Bob=200. | A fresh snapshot after both commits can return Alice=1000 and Bob=200. | status → table |

**Дальше:** Снимок 809:811:809 получен. Как он выбирает конкретную версию?

## 19. Проверка видимости по шагам / Check visibility step by step

Какая версия проходит проверки снимка 809:811:809?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | У снимка и у версии есть поля xmin/xmax, но они означают разные вещи. | Snapshots and tuples both have xmin/xmax fields, with different meanings. | status → page |
| 2 | Alice имеет xmin=809: этот XID был активен в снимке, поэтому вставка не видна. | Alice has xmin=809: that XID was active in the snapshot, so the insertion is invisible. | status → page → status |
| 3 | Создатель Bob v1 — 810: он ниже xmax, отсутствует в xip и зафиксирован. | Bob v1’s creator, 810, is below xmax, absent from xip, and committed. | status → page → status |
| 4 | Удаляющий XID 811 не виден снимку, поэтому Bob v1 ещё не считается удалённой. | Deleting XID 811 is invisible to the snapshot, so Bob v1 is not yet considered deleted. | status → page → status |
| 5 | Создатель Bob v2 — 811: он на верхней границе, поэтому новая версия исключается. | Bob v2’s creator is 811, at the upper bound, so the new tuple is excluded. | status → page → status |
| 6 | Даже XID 808 ниже xmin не помогает версии, если 808 была отменена. | Even XID 808 below xmin cannot make a tuple visible if 808 aborted. | status → page → status |
| 7 | Для своих изменений дополнительно важен номер команды: старый курсор не видит последующие вставки. | Own changes also need command IDs: an older cursor does not see later insertions. | timeline → table |

**Дальше:** Если снимок меняется между командами, что увидит приложение?

## 20. Новый снимок для новой команды / A new snapshot for each statement

Почему два SELECT внутри одного BEGIN могут вернуть разные значения?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | При Read Committed первый SELECT берёт снимок S1 и видит баланс 100. | At Read Committed, the first SELECT takes snapshot S1 and sees balance 100. | client → table → server |
| 2 | Параллельная T811 готовит баланс 120, пока первая команда читателя ещё использует S1. | Concurrent T811 prepares balance 120 while the reader’s first statement still uses S1. | client → page → client |
| 3 | Даже если W уже зафиксировалась, продолжающийся SELECT по S1 возвращает 100. | Even after W commits, the still-running SELECT on S1 returns 100. | client → client → page → server |
| 4 | Следующий SELECT того же R создаёт S2 и уже возвращает 120. | R’s next SELECT takes S2 and now returns 120. | client → table → server |
| 5 | R добавляет 5 и видит собственное незафиксированное значение 125. | R adds 5 and sees its own uncommitted value 125. | client → table |
| 6 | После COMMIT результат R — 125. Но свежий снимок сам по себе не защищает расчёт в приложении. | After COMMIT, R’s result is 125. A fresh snapshot alone does not protect app-side arithmetic. | table → client |

**Дальше:** Читатели получают свежие данные. Как не потерять изменения двух писателей?

## 21. Два списания с одного счёта / Two debits from one account

Почему чтение 100 и последующая запись константы могут потерять чужое списание?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A и B прочитали 100. A хочет списать 20, B — 30. | A and B both read 100. A wants to debit 20, B wants to debit 30. | table → client → client → server |
| 2 | A записывает константу 80 и фиксируется. | A writes the constant 80 and commits. | client → table → client |
| 3 | B записывает 70. Списание A потерялось: итог 70 вместо 50. | B writes 70. A’s debit is lost: the result is 70 instead of 50. | client → table |
| 4 | Повторим от 100: теперь A выполняет balance−20, а B — balance−30 прямо в SQL. | Restart from 100: A now uses balance−20 and B balance−30 directly in SQL. | client → table → client |
| 5 | После COMMIT A команда B использует обновлённые 80 и получает 50. | After A commits, B uses the updated 80 and computes 50. | client → client → table |
| 6 | Оба списания сохранились: 100−20−30=50. Это координация записей одной строки. | Both debits survive: 100−20−30=50. This coordinates writes to one row. | table → status |

**Дальше:** Арифметическое UPDATE ждёт другого писателя. Что именно его удерживает?

## 22. Кто удерживает строку / Who holds the row

Как один писатель заставляет другого дождаться завершения?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A блокирует заказ 17 через SELECT FOR UPDATE, не меняя qty=2. | A locks order 17 with SELECT FOR UPDATE without changing qty=2. | client → page |
| 2 | B хочет изменить ту же строку и ждёт окончания T900. | B wants to change the same row and waits for T900 to end. | client → client → page |
| 3 | Обычный SELECT C продолжает читать qty=2: row lock не блокирует такое чтение. | C’s ordinary SELECT still reads qty=2: the row lock does not block this read. | client → page → client → server |
| 4 | У блокировок строк четыре режима с разной совместимостью. | Row locks have four modes with different compatibility. | table |
| 5 | A фиксируется; B получает доступ, создаёт qty=3 и завершает свою команду. | A commits; B gains access, creates qty=3, and finishes its statement. | client → client → page |
| 6 | NOWAIT позволяет получить ошибку сразу, если строка уже занята. | NOWAIT returns an error immediately if the row is already locked. | client → client → server |

**Дальше:** Ожидание защищает запись. А как удержать один снимок для нескольких чтений?

## 23. Один снимок на транзакцию / One snapshot for the transaction

Как повторно читать тот же баланс, пока другой сеанс его меняет?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Repeatable Read берёт снимок S при первом обычном операторе, а не просто на BEGIN. | Repeatable Read takes snapshot S at the first ordinary statement, not merely at BEGIN. | client → table → server |
| 2 | W меняет 100 на 120 и фиксируется, пока R остаётся открытой. | W changes 100 to 120 and commits while R stays open. | client → page → client |
| 3 | Второй SELECT R снова возвращает 100. Фантомные чтения тоже исключены. | R’s second SELECT again returns 100. Phantom reads are prevented as well. | client → table → server |
| 4 | Попытка R обновить изменённую W строку завершается serialization failure. | R’s attempt to update the row changed by W fails with a serialization error. | client → page → status → server |
| 5 | После ROLLBACK новая транзакция получает новый снимок и видит 120. | After ROLLBACK, a new transaction takes a new snapshot and sees 120. | client → table → server |
| 6 | Теперь R успешно добавляет 5 к 120 и фиксирует 125. | R can now add 5 to 120 and commit 125. | client → table |

**Дальше:** Стабильный снимок — уже защита любого бизнес-условия?

## 24. Снимок плюс контроль зависимостей / A snapshot plus dependency checks

Как сохранить условие «хотя бы один дежурный», если меняются разные строки?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Alice и Bob дежурят. Правило приложения: хотя бы один должен остаться. | Alice and Bob are on call. The app requires at least one to remain. | table → status |
| 2 | Две транзакции одновременно читают count=2 и решают, что могут снять своё дежурство. | Two concurrent transactions each read count=2 and decide they can go off call. | table → client → client → server |
| 3 | Они меняют разные строки, поэтому обычного конфликта записи одной строки нет. | They update different rows, so there is no ordinary same-row write conflict. | client → client → table |
| 4 | При Repeatable Read обе фиксации возможны: получается ноль дежурных. | At Repeatable Read, both may commit, leaving nobody on call. | table → status |
| 5 | При Serializable SSI обнаруживает опасные зависимости и прерывает одну транзакцию. | At Serializable, SSI detects dangerous dependencies and aborts one transaction. | plan → status |
| 6 | Bob повторяет всю транзакцию, видит одного дежурного и сохраняет своё дежурство. | Bob retries the whole transaction, sees one person on call, and stays on call. | client → table → server |

**Дальше:** Одни прерывания вызваны зависимостями, другие — циклом ожиданий. Как их различить?

## 25. Кто мешает изменить таблицу / Who blocks a table change

Чтение не запирает строки. Почему ALTER TABLE ждёт?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A читает заказы и оставляет транзакцию открытой. | A reads orders and leaves its transaction open. | client |
| 2 | B тоже читает orders: две блокировки ACCESS SHARE совместимы. | B also reads orders: two ACCESS SHARE locks are compatible. | client → status → client |
| 3 | C хочет добавить столбец. Его ACCESS EXCLUSIVE ждёт завершения чтения. | C wants to add a column. Its ACCESS EXCLUSIVE waits for the readers. | client → status → client |
| 4 | A завершает транзакцию. Теперь C может изменить определение таблицы. | A ends its transaction. C can now change the table definition. | client → status → client |
| 5 | ROW EXCLUSIVE — тоже блокировка таблицы. Её название не означает одну строку. | ROW EXCLUSIVE is also a table lock. Its name does not mean a single row. | table |

**Дальше:** Несколько транзакций могут вместе защищать одну строку. Как это записать?

## 26. Одна строка, несколько владельцев / One row, several lockers

Как одна строка помнит нескольких совместимых владельцев?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A защищает ключ заказа от удаления, но не меняет его данные. | A protects an order key from deletion without changing its data. | client |
| 2 | B тоже берёт KEY SHARE. Обоим разрешено держать эту строку. | B also takes KEY SHARE. Both may hold this row. | client → page → client |
| 3 | В xmax теперь указан MultiXact: его участники хранятся отдельно. | xmax now identifies a MultiXact; its members are stored separately. | page → table |
| 4 | C пытается удалить строку и ждёт, пока уйдут оба несовместимых владельца. | C tries to delete the row and waits for both conflicting lockers to leave. | table → page → client |
| 5 | A и B завершились. C продолжает удаление, а старые MultiXact требуют обслуживания. | A and B finish. C can delete; old MultiXacts still need maintenance. | table → page → client |

**Дальше:** А если каждый ждёт строку, занятую другим?

## 27. Ожидание замкнулось в круг / Waiting forms a cycle

Почему два корректных UPDATE могут остановить друг друга?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A меняет счёт 1. B уже меняет счёт 2. Каждый удерживает свою строку. | A changes account 1. B already changes account 2. Each holds a different row. | client → table → client |
| 2 | A просит счёт 2 и ждёт B. Удерживаемый A счёт 1 остаётся занят. | A requests account 2 and waits for B. A still holds account 1. | client → table → client |
| 3 | B теперь просит счёт 1. A ждёт B, а B ждёт A: продолжить не может никто. | B now requests account 1. A waits for B and B waits for A; neither can continue. | client → client |
| 4 | Сервер прерывает одну транзакцию. В нашем примере это B; A освобождается. | The server aborts one transaction. In this example it is B, letting A proceed. | client → client → table |
| 5 | Оба приложения берут счета в порядке 1, затем 2. Теперь есть очередь, но нет круга. | Both applications acquire accounts in order 1, then 2. There is a queue, but no cycle. | timeline |

**Дальше:** Всегда ли приложению нужно ждать блокировку?

## 28. Подождать, отказаться или пропустить / Wait, fail or skip

Занятая задача должна останавливать всех работников?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Работник A обрабатывает задачу 1 и пока держит её строку. | Worker A is processing job 1 and still holds its row. | client → table |
| 2 | Обычный FOR UPDATE у B ждёт задачу 1, хотя рядом есть свободная задача 2. | Ordinary FOR UPDATE makes B wait for job 1 despite job 2 being available. | client → table → client |
| 3 | NOWAIT возвращает ошибку сразу: B может выбрать другое действие. | NOWAIT returns an error immediately, letting B choose another action. | table → client |
| 4 | SKIP LOCKED пропускает строку 1. B получает задачу 2 и блокирует её. | SKIP LOCKED skips row 1. B obtains job 2 and locks it. | client → table → client |
| 5 | B меняет статус задачи и завершает транзакцию. Один SELECT ещё не обработал её. | B updates the job status and commits. Selecting a job alone did not process it. | table → client |
| 6 | lock_timeout ограничивает ожидание блокировки; это не общий таймер всего запроса. | lock_timeout bounds a lock wait; it is not a timer for the whole query. | timeline |

**Дальше:** Почему короткое ожидание бывает даже без конфликта строк?

## 29. Защита общих структур в памяти / Protecting shared memory

Клиенты не спорят за строку. Что ещё может заставить процесс ждать?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A и B читают одну страницу через общий буферный кеш. | A and B read the same page through the shared buffer cache. | client → page → client |
| 2 | LWLock ненадолго защищает общую структуру, пока процесс меняет её. | An LWLock briefly protects a shared structure while a process changes it. | client → status → client |
| 3 | Pin не даёт вытеснить используемый буфер. Это не монопольное владение его данными. | A pin keeps an in-use buffer from eviction. It is not exclusive ownership of its data. | client → page → status |
| 4 | Событие ожидания отличает Lock, LWLock и BufferPin. Причину нужно искать на своём уровне. | Wait events distinguish Lock, LWLock and BufferPin. Diagnose the appropriate level. | table |

**Дальше:** Кто решает, что старую версию уже безопасно удалить?

## 30. Кто ещё видит старую версию / Who still sees the old version

UPDATE завершён. Почему старая версия всё ещё нужна?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | A начинает REPEATABLE READ и видит баланс счёта A, равный 10. | A starts REPEATABLE READ and sees account A with a balance of 10. | client |
| 2 | B меняет баланс на 20 и фиксирует его. На странице остаются v1 и v2. | B changes the balance to 20 and commits. Both v1 and v2 remain on the page. | status → page → client |
| 3 | Повторное чтение A возвращает 10. Удаление v1 нарушило бы обещание снимка. | A reads again and gets 10. Removing v1 would break its snapshot guarantee. | status → page |
| 4 | VACUUM приходит раньше завершения A и оставляет нужную ему v1 на месте. | VACUUM arrives before A finishes and leaves the v1 that A still needs. | status → page → status |
| 5 | A завершает транзакцию. Когда других удерживающих причин нет, v1 можно освободить. | A finishes. If no other retention remains, v1 can be reclaimed. | client → page → status |

**Дальше:** Как уменьшить цену обновлений, не отменяя версии?

## 31. Обновление без новых записей индекса / Updating without new index entries

Нужно ли каждому новому варианту строки заново попадать во все индексы?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Индекс по id ведёт к Alice на странице 7. Меняем только её имя. | An index on id points to Alice on page 7. We change only her name. | tree → page |
| 2 | Новая версия Alicia помещается рядом. Старая версия связывается с ней. | The new Alicia version fits alongside. The old version links to it. | tree → page |
| 3 | Чтение идёт по прежнему TID, затем выбирает видимую версию цепочки. | A read follows the original TID, then chooses the visible version in its chain. | client → tree → page |
| 4 | Когда Alice никому не нужна, pruning оставляет перенаправление к живой версии. | When nobody needs Alice, pruning leaves a redirect to the live version. | tree → page |
| 5 | Изменили индексируемый id или не хватило места? Это обновление уже не HOT. | Changed an indexed id or ran out of page space? This update is no longer HOT. | table |

**Дальше:** Где найти свободное место и как узнать видимость страницы?

## 32. Две карты рядом с таблицей / Two maps beside a table

Нужно ли просматривать все страницы ради свободного места или видимости?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Новой строке нужно место. У страниц 0, 1 и 2 его разное количество. | A new row needs space. Pages 0, 1 and 2 have different amounts available. | table |
| 2 | Free Space Map подсказывает страницу 1. Перед вставкой место проверяют на самой странице. | The Free Space Map suggests page 1. Its space is checked again before insertion. | status → tree → page |
| 3 | Visibility Map отвечает на другой вопрос: все ли строки страницы видимы всем? | The Visibility Map asks a different question: are all page rows visible to everyone? | table |
| 4 | Index-only scan на странице 0 проверяет all-visible и может не читать heap. | An index-only scan for page 0 checks all-visible and may avoid reading the heap. | tree → table → client |
| 5 | Изменение страницы сбрасывает обещание VM. VACUUM сможет установить его заново после проверки. | Changing a page clears its VM promise. VACUUM can set it again after checking. | page → table → status |

**Дальше:** Кто убирает ненужные версии и обновляет эти сведения?

## 33. Освободить место безопасно / Reclaim space safely

Снимок отпущен. Как убрать версии, не оставив индекс указывать в пустоту?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Версия Bob уже не нужна ни одному снимку, но её место и запись индекса пока заняты. | No snapshot needs Bob anymore, but its space and index entry remain. | page → table |
| 2 | VACUUM сканирует heap, проверяет горизонт и собирает адреса мёртвых версий. | VACUUM scans the heap, checks the horizon and collects dead-version addresses. | page → queue → status |
| 3 | Сначала удаляются записи индекса, ведущие к собранным мёртвым адресам. | Index entries pointing to the collected dead addresses are removed first. | queue → table → page |
| 4 | Затем VACUUM возвращается в heap и освобождает эти слоты для повторного использования. | VACUUM then revisits the heap and frees those slots for reuse. | table → page → status |
| 5 | Карты и счётчики обновляются. Пустой хвост файла иногда можно обрезать. | Maps and counters are updated. An empty file tail can sometimes be truncated. | page → table → timeline |
| 6 | Новая строка использует свободное место. Для статистики распределения данных отдельно нужен ANALYZE. | A new row reuses the space. Data-distribution statistics separately require ANALYZE. | page → status |

**Дальше:** Кто запускает эту работу без ручного расписания?

## 34. Уборка приходит сама / Cleanup starts automatically

Таблицы меняются постоянно. Кто замечает, что пора убирать?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | В orders накапливаются старые версии. Ручной VACUUM ещё никто не запускал. | Old versions accumulate in orders. Nobody has run manual VACUUM yet. | table |
| 2 | Для выбранных настроек порог равен 50 + 0,2 × 1000 = 250. Пока 240 меньше порога. | With our settings the threshold is 50 + 0.2 × 1000 = 250. So far 240 is below it. | table → status |
| 3 | Число старых версий выросло до 260. Таблица стала кандидатом на autovacuum. | The obsolete count reaches 260. The table becomes an autovacuum candidate. | table → status → status |
| 4 | Worker выполняет обычный VACUUM. Параллельные чтения и записи могут продолжаться. | The worker performs ordinary VACUUM. Concurrent reads and writes may continue. | status → table → client |
| 5 | Отдельные правила запускают ANALYZE, уборку вставок и защитную заморозку. | Separate rules trigger ANALYZE, insert-driven vacuum and protective freezing. | table |

**Дальше:** Зачем обслуживать даже таблицу почти без изменений?

## 35. Старые строки и кольцо номеров / Old rows and the ID ring

Если строка живёт годами, её номер транзакции тоже остаётся безопасным?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Строка Alice остаётся живой, а сервер выполняет всё новые транзакции. | Alice remains live while the server executes ever more transactions. | page |
| 2 | 32-битные XID идут по кругу. Сравнивать их как бесконечно растущие числа нельзя. | 32-bit XIDs wrap around. They cannot be compared as endlessly growing integers. | ring → page |
| 3 | VACUUM проверяет старую подтверждённую вставку и помечает её замороженной. | VACUUM checks the old committed insertion and marks it frozen. | status → page |
| 4 | Когда заморожены все версии страницы, VM может поставить бит all-frozen. | When every tuple on a page is frozen, VM can set its all-frozen bit. | page → table |
| 5 | Замораживают и живые строки. Защитный VACUUM нельзя заменять только удалением мусора. | Live rows also need freezing. Protective VACUUM is more than garbage removal. | table |

**Дальше:** Заморозка защищает видимость. А почему файл всё ещё большой?

## 36. Место свободно, а файл не уменьшился / Free space, unchanged file size

После VACUUM строк мало. Почему таблица всё ещё занимает много страниц?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | После пика нагрузки живые строки остались на четырёх полупустых страницах. | After a workload peak, live rows remain spread across four partly empty pages. | table |
| 2 | Обычный VACUUM сделал промежутки пригодными для новых строк, но не пересобрал таблицу. | Ordinary VACUUM made gaps reusable without rewriting the table. | table → status |
| 3 | Новые строки заполняют промежутки. Для постоянной нагрузки это может быть полезным запасом. | New rows fill the gaps. A steady workload can use this space as useful headroom. | table |
| 4 | VACUUM FULL переписывает все шесть живых строк плотнее и требует ACCESS EXCLUSIVE. | VACUUM FULL rewrites all six live rows compactly and requires ACCESS EXCLUSIVE. | table → table → client |
| 5 | Таблица и индексы раздуваются отдельно. REINDEX перестраивает индекс, а не уплотняет heap. | Tables and indexes bloat separately. REINDEX rebuilds an index, not the heap. | table |

**Дальше:** Сколько лишних страниц читает запрос? Посмотрим его план.

## 37. Почему запрос читает так много / Why a query reads so much

Приложению нужна одна строка. Как увидеть выбранный способ поиска?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Приложение ищет заказ 17. Снаружи видно только запрос и ответ. | The application looks for order 17. From outside, we see only a query and reply. | client |
| 2 | EXPLAIN показывает план. В нашем учебном примере выбран последовательный просмотр. | EXPLAIN reveals the plan. Our illustrative case uses a sequential scan. | client → plan → status |
| 3 | Filter проверяет прочитанные строки. Оценка rows относится к выходу узла, а не ко всей прочитанной работе. | Filter checks fetched rows. Estimated rows describes node output, not all work scanned. | plan → table |
| 4 | cost — оценка работы. Начальное и полное значения не являются миллисекундами. | cost estimates work. Startup and total values are not milliseconds. | table |
| 5 | План объяснил способ поиска. Теперь откроем индекс и посмотрим, как он сокращает путь. | The plan explained the access path. Now open an index to see how it shortens the search. | plan → status |

**Дальше:** Как дерево индекса приводит прямо к нужной записи?

## 38. Найти ключ через B-tree / Finding a key through a B-tree

Как не проверять каждую строку ради id = 25?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Нужен id = 25. Построим индекс, в котором ключи ведут к адресам строк. | We need id = 25. Build an index whose keys lead to row addresses. | client |
| 2 | Корень разделяет диапазоны: 25 относится к ветви от 20 до 40. | The root separates ranges: 25 belongs to the branch from 20 to 40. | tree → client |
| 3 | На листе ключ 25 даёт TID. По нему читается версия Alice в heap. | At the leaf, key 25 gives a TID. It leads to Alice’s heap version. | tree → page → client |
| 4 | Диапазон 20…40 читается по соседним листовым записям: 20, 25, 31 и 40. | The range 20–40 follows neighboring leaf entries: 20, 25, 31 and 40. | tree → table |
| 5 | Лист переполнен: вставка 30 делит его, а родитель получает новый переход. | A leaf is full: inserting 30 splits it and adds a new parent downlink. | tree |
| 6 | ORDER BY id LIMIT 3 может остановиться после ключей 20, 25 и 30. | ORDER BY id LIMIT 3 can stop after keys 20, 25 and 30. | tree → table |

**Дальше:** Кто превращает SQL в такой путь и выбирает между путями?

## 39. Как SQL становится работой / How SQL becomes work

Клиент прислал текст. Откуда появились узлы плана?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Приложение просит имя пользователя 25. На входе это текст SQL. | The application asks for user 25’s name. The input is SQL text. | client |
| 2 | Синтаксический разбор превращает текст в дерево: что выбрать, откуда и по какому условию. | Parsing turns text into a tree: what to select, from where, and under which condition. | client → tree |
| 3 | Анализ связывает btree_demo, id и name с объектами каталога и определяет типы выражений. | Analysis binds btree_demo, id and name to catalog objects and determines expression types. | tree → status |
| 4 | Переписывание раскрывает обычное представление в запрос к его исходным таблицам. | Rewriting expands an ordinary view into a query on its source tables. | tree |
| 5 | Планировщик сравнивает пути и строит план с конкретными сканами, соединениями и сортировками. | The planner compares paths and builds a plan with concrete scans, joins and sorts. | status → plan |
| 6 | Исполнитель выполняет план и возвращает Alice. Подготовленный план иногда можно использовать повторно. | The executor runs the plan and returns Alice. A prepared plan can sometimes be reused. | plan → page → client |

**Дальше:** Откуда планировщик знает, сколько строк найдётся?

## 40. Угадать число подходящих строк / Estimating matching rows

Как выбрать путь до того, как строки действительно прочитаны?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Из 1000 заказов 100 открыты. Поиск open затронет примерно десятую часть таблицы. | Of 1000 orders, 100 are open. Searching for open touches roughly a tenth of the table. | table |
| 2 | ANALYZE собирает выборку и запоминает частые значения, доли NULL и другие оценки. | ANALYZE samples data and records common values, NULL fractions and other estimates. | table → table |
| 3 | Доля 0,10 даёт оценку около 100 выходных строк. Это влияет на цену скана и соединения. | A 0.10 fraction predicts about 100 output rows. This affects scan and join costs. | table → status |
| 4 | Теперь открыты 900 заказов, а статистика помнит 100. Повторный ANALYZE исправляет исходные сведения. | Now 900 orders are open, but statistics remembers 100. ANALYZE refreshes the inputs. | table → table |
| 5 | Город связан со страной. Расширенная статистика помогает не считать такие условия независимыми. | City depends on country. Extended statistics can avoid treating these conditions as independent. | table → status |

**Дальше:** План выбран. Как его узлы передают друг другу строки?

## 41. Строки поднимаются по плану / Rows move up the plan

Кто первым начинает работу: скан внизу или LIMIT наверху?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Нужны первые два счёта с балансом больше 10. LIMIT просит дочерний узел дать строку. | We need two accounts with balance above 10. LIMIT asks its child for a row. | plan |
| 2 | Скан проверяет счёт 1: баланс 5 не подходит. Он продолжает поиск для того же запроса LIMIT. | The scan checks account 1: balance 5 fails. It keeps searching for the same LIMIT request. | plan → table |
| 3 | Счёт 2 подходит. Скан возвращает его вверх, и LIMIT получает первый результат. | Account 2 qualifies. The scan returns it upward, giving LIMIT its first result. | plan → table → table |
| 4 | Следующий запрос даёт счёт 3. LIMIT набрал две строки и больше не просит; счёт 4 не нужен. | The next request yields account 3. LIMIT has two rows and stops asking; account 4 is unnecessary. | plan → table → status |
| 5 | Добавили ORDER BY balance DESC: Sort должен просмотреть вход, прежде чем отдать самый большой баланс. | Add ORDER BY balance DESC: Sort must inspect its input before returning the greatest balance. | plan → table |

**Дальше:** Как сравнить ожидаемую работу плана с выполненной?

## 42. План ожидал — запрос сделал / Expected plan, actual work

Оценка выглядит разумно. Совпала ли она с действительностью?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Обычный EXPLAIN описывает ожидаемые строки. Запрос при этом не выполняется. | Plain EXPLAIN describes expected rows without executing the query. | plan |
| 2 | EXPLAIN ANALYZE запускает запрос и добавляет фактические строки, время и loops. | EXPLAIN ANALYZE runs the query and adds actual rows, timing and loops. | plan → status |
| 3 | rows = 2, loops = 3 означает в среднем две строки за запуск: всего шесть. | rows = 2, loops = 3 means two rows per execution on average: six in total. | table |
| 4 | BUFFERS различает shared-блоки обычных таблиц, local-блоки временных таблиц и temp-файлы промежуточной работы. | BUFFERS distinguishes shared blocks of regular tables, local blocks of temporary tables, and temporary spill files. | table |
| 5 | С ANALYZE команда UPDATE действительно меняет строки и запускает триггеры. | With ANALYZE, UPDATE really changes rows and runs triggers. | table → timeline |
| 6 | ANALYZE orders — другая команда: она собирает статистику, а не измеряет SELECT. | ANALYZE orders is different: it gathers statistics rather than measuring a SELECT. | table |

**Дальше:** Почему Sort или Hash вдруг начали писать временные файлы?

## 43. Когда промежуточным данным тесно / When intermediate data outgrow memory

Данные прочитаны. Где хранятся строки сортировки и хеш-таблицы?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Sort должен упорядочить больше строк, чем помещается в его рабочей памяти. | Sort must order more rows than fit in its working memory. | plan → status |
| 2 | Sort записывает отсортированные порции во временные файлы, затем сливает их. | Sort writes sorted runs to temporary files and then merges them. | status → timeline |
| 3 | Hash может делить работу на batches. Его предел связан с work_mem и hash_mem_multiplier. | Hash may split work into batches. Its limit depends on work_mem and hash_mem_multiplier. | status → buckets |
| 4 | Две сортировки в одном плане могут получить собственные бюджеты. У соседнего запроса — свои. | Two sorts in one plan can each receive a budget. Another query has its own budgets. | table |
| 5 | Увеличение памяти может убрать spill. Но решение проверяют по плану и общей нагрузке. | More memory may remove a spill. Verify it against the plan and overall workload. | table |

**Дальше:** Теперь объединим строки двух таблиц и проследим их результат.

## 44. Собрать все совпадающие пары / Construct every matching pair

В двух таблицах есть одинаковый ключ. Сколько строк даст соединение?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | L1 и L2 — разные строки с одним ключом 1. Нельзя заранее слить их в одну. | L1 and L2 are separate rows sharing key 1. They must not be collapsed into one. | table |
| 2 | У L1 нашлась R1 с тем же ключом. Первая пара — L1 + R1. | L1 finds R1 with the same key. The first pair is L1 + R1. | table → table → table |
| 3 | R2 тоже подходит L1. Поэтому L1 участвует уже в двух выходных строках. | R2 also matches L1, so L1 participates in two output rows. | table → table → table |
| 4 | L2 тоже имеет ключ 1 и образует пары с R1 и R2. Две строки на две дают четыре пары. | L2 also has key 1 and pairs with R1 and R2. Two rows times two yields four pairs. | table → table → table |
| 5 | У L3 ключ 2, а у R3 — 3. Новых совпадающих пар нет; INNER JOIN возвращает четыре строки. | L3 has key 2 and R3 has key 3. Neither adds a match; INNER JOIN returns four rows. | table → table → table |
| 6 | CROSS JOIN не требует совпадения: каждая из трёх левых строк сочетается с каждой правой. Всего девять. | CROSS JOIN needs no match: each of three left rows pairs with each right row. Total: nine. | table → table → status |

**Дальше:** Что делать со строкой, у которой не нашлось пары?

## 45. Не потерять строку без пары / Keep an unmatched row

Нужны все клиенты, даже если у некоторых нет заказов.

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | L3 с ключом 2 исчезла из INNER JOIN. Теперь хотим сохранить каждую левую строку. | L3 with key 2 disappeared from INNER JOIN. Now preserve every left row. | table |
| 2 | Сначала строятся те же четыре совпадающие пары ключа 1. | First construct the same four matching pairs for key 1. | table → table → table |
| 3 | Для L3 совпадений нет. LEFT JOIN добавляет одну строку L3 + NULL: итог — пять. | L3 has no match. LEFT JOIN adds one L3 + NULL row, making five rows. | table → table → table |
| 4 | RIGHT JOIN сохраняет правую сторону: вместо L3 добавится NULL + R3. Тоже пять строк. | RIGHT JOIN preserves the right side: NULL + R3 replaces the extra L3 row. Again five rows. | table → table → table |
| 5 | FULL JOIN сохраняет обе стороны: четыре пары, L3 + NULL и NULL + R3. Всего шесть строк. | FULL JOIN preserves both sides: four pairs, L3 + NULL and NULL + R3. Six rows in total. | table → table → status |
| 6 | Поменяли стороны местами: join_r LEFT JOIN join_l сохраняет R3, как прежний RIGHT JOIN. | Swap the inputs: join_r LEFT JOIN join_l preserves R3, like the previous RIGHT JOIN. | table → table |

**Дальше:** NULL в исходных данных и NULL от отсутствующей пары — как они влияют на условие?

## 46. NULL не совпадает сам с собой / NULL does not equal itself

Две строки содержат NULL. Они образуют пару по знаку равенства?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Слева L1 с ключом 1 и L2 с NULL. Справа — R1 с 1 и R2 с NULL. | The left has L1 with key 1 and L2 with NULL. The right has R1 with 1 and R2 with NULL. | table → table |
| 2 | 1 = 1 даёт true. NULL = NULL даёт unknown, поэтому L2 и R2 не совпадают. | 1 = 1 is true. NULL = NULL is unknown, so L2 and R2 do not match. | table → table |
| 3 | LEFT JOIN сохраняет L2, но заполняет её правую часть NULL. Это не совпадение с R2. | LEFT JOIN preserves L2 and null-extends its right side. This is not a match with R2. | table → table |
| 4 | Условие r.k = 2 в ON оставит две левые строки с NULL. То же условие в WHERE удалит обе. | Putting r.k = 2 in ON keeps two null-extended left rows. Putting it in WHERE removes both. | table → table |
| 5 | IS NOT DISTINCT FROM явно выбирает NULL-безопасное сравнение: теперь L2 совпадает с R2. | IS NOT DISTINCT FROM explicitly chooses NULL-safe comparison: L2 now matches R2. | table → status |

**Дальше:** А если нужны только строки, у которых существует хотя бы одна пара?

## 47. Нужен факт существования, а не все пары / Existence rather than every pair

Как найти клиентов с заказами, не размножая каждого по числу заказов?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | L1 и L2 имеют ключ 1. Нам нужны сами эти строки, если справа есть хоть одно совпадение. | L1 and L2 have key 1. We need those rows themselves if any right-side match exists. | table |
| 2 | EXISTS включает L1 и L2 по одному разу каждую. Два правых совпадения не удваивают их снова. | EXISTS includes L1 and L2 once each. Two right matches do not multiply them again. | table → table → table |
| 3 | NOT EXISTS оставляет L3: у ключа 2 нет ни одной пары. | NOT EXISTS keeps L3: key 2 has no partner. | table → table → table |
| 4 | Добавили NULL справа. Теперь k NOT IN (...) не вернёт даже L3: для 2 ответ unknown. | Add a right-side NULL. Now k NOT IN (...) does not return L3 either: for 2 it is unknown. | table → table → table |
| 5 | Исключили NULL справа — для наших ненулевых левых ключей NOT IN снова возвращает L3. | Remove right-side NULLs: for our non-NULL left keys, NOT IN returns L3 again. | table → table |

**Дальше:** Теперь результат понятен. Каким алгоритмом получать пары?

## 48. Для каждой строки найти её пары / Find matches for each input row

Как исполнитель получает знакомый результат JOIN по одной паре?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Есть клиенты 1 и 2. Хотим связать их с заказами по customer_id. | We have customers 1 and 2. Join them to orders by customer_id. | table |
| 2 | Для клиента 1 внутренний просмотр проверяет три заказа. Подходят 10 и 11. | For customer 1, the inner scan checks three orders. Orders 10 and 11 match. | table → table → table |
| 3 | Для клиента 2 внутренний просмотр начинается заново. Совпадений нет: результат остаётся из двух строк. | For customer 2, the inner scan restarts. No matches: the result stays at two rows. | table → table → table → status |
| 4 | Внутренний узел имеет loops = 2. Materialize может сохранить его вход вместо повторного чтения таблицы. | The inner node has loops = 2. Materialize may retain its input rather than reread the table. | plan → status |
| 5 | С индексом по customer_id внутренний поиск может сразу взять заказы нужного клиента. | An index on customer_id can let the inner scan fetch only the current customer’s orders. | plan → tree → table |
| 6 | Повторим клиента 1 во входе: Memoize может вернуть его два заказа из кеша, сохранив обе пары ещё раз. | Repeat customer 1 in the input: Memoize can reuse its two orders while emitting both pairs again. | table → table → status |

**Дальше:** Можно ли подготовить правую сторону один раз вместо повторных поисков?

## 49. Подготовить хеш-таблицу и искать в ней / Build a hash table, then probe

Зачем заново искать пары, если ключи одной стороны можно подготовить заранее?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Справа R1 и R2 с ключом 1, R3 с ключом 3. Сделаем этот вход стороной построения. | The right input has R1 and R2 with key 1, and R3 with key 3. Use it as the build side. | table |
| 2 | В фазе build ключ 1 связывается с R1 и R2, а ключ 3 — с R3. Все дубликаты сохраняются. | During build, key 1 stores R1 and R2; key 3 stores R3. Every duplicate is retained. | table → buckets |
| 3 | Probe для L1 с ключом 1 находит две строки. Получаются L1 + R1 и L1 + R2. | Probing L1 with key 1 finds two rows: L1 + R1 and L1 + R2. | table → buckets → table |
| 4 | Для L3 с ключом 2 совпадения нет. INNER JOIN не добавляет строку. | L3 with key 2 has no match. INNER JOIN adds no row. | table → buckets → table |
| 5 | L2 тоже имеет ключ 1 и добавляет ещё две пары. Итог тот же: четыре, как у INNER JOIN раньше. | L2 also has key 1 and adds two more pairs. The total is the same four rows as before. | table → buckets → table |
| 6 | На большом входе хеш-таблица может не поместиться. Тогда работа делится на batches с временными файлами. | On a large input, the hash table may not fit. Work is then split into batches using temporary files. | buckets → timeline |

**Дальше:** А если оба входа уже упорядочены по ключу?

## 50. Свести два упорядоченных потока / Merge two ordered streams

Можно ли искать пары движением вперёд по двум отсортированным входам?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Поток слева приходит как 2, 1, 1. Для Merge Join сначала нужен порядок по ключу. | The left stream arrives as 2, 1, 1. Merge Join first needs join-key order. | table |
| 2 | Теперь оба входа упорядочены: слева 1, 1, 2; справа 1, 1, 3. Сравниваем первые ключи. | Both inputs are now ordered: 1, 1, 2 on the left and 1, 1, 3 on the right. Compare their first keys. | table → table → plan |
| 3 | Ключ L1 равен ключам R1 и R2. Первая левая строка даёт две пары. | L1 matches both R1 and R2, so the first left row yields two pairs. | table → table → table |
| 4 | Следующая L2 тоже имеет ключ 1. Повторяем правую группу и добавляем ещё две пары. | L2 also has key 1. Revisit the right run and add two more pairs. | table → table → table |
| 5 | Остались L3 с 2 и R3 с 3. Двигаем меньший ключ слева; левый вход заканчивается. | L3 has 2 and R3 has 3. Advance the smaller left key; the left input ends. | table → table → table |
| 6 | Получены те же четыре пары. Порядок входов нужен алгоритму, а порядок ответа задаётся ORDER BY. | The same four pairs result. Input ordering serves the algorithm; ORDER BY specifies result ordering. | table → status |

**Дальше:** Индексы умеют не только обычное равенство. Разберём остальные способы поиска.

## 51. Hash: адрес по хешу / Hash: locate a bucket

Как найти точное значение без спуска по дереву?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Нужно найти пользователя с именем amy. | We need the user named amy. | table |
| 2 | Hash-индекс хранит хеш значения и адрес строки. | A hash index stores a value hash and tuple address. | table → buckets |
| 3 | Хеш запроса указывает нужную корзину. | The query hash identifies the bucket. | client → buckets → table |
| 4 | Проверка в таблице отбрасывает коллизию zoe. | A heap recheck rejects the colliding value zoe. | buckets → table → client |
| 5 | Переполненная корзина получает цепочку дополнительных страниц. | A full bucket grows an overflow-page chain. | buckets → box |
| 6 | Hash подходит для равенства; порядок и уникальность он не обеспечивает. | Hash serves equality; it provides neither ordering nor uniqueness. | buckets → box |

**Дальше:** Как индекс ищет пересечение областей?

## 52. GiST: огибающие области / GiST: bounding regions

Как отсечь целые ветви пространственного поиска?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Найдём точки внутри прямоугольника. | Find the points inside a rectangle. | space |
| 2 | Внутренняя запись GiST описывает область целой ветви. | An internal GiST entry summarizes a branch region. | space → tree |
| 3 | Область запроса не пересекает дальнюю ветвь: её можно пропустить. | The query misses the distant branch, so that branch is pruned. | space → tree |
| 4 | Листья дают кандидатов; результат содержит A и B. | Leaf entries yield candidates; the result contains A and B. | tree → table → client |
| 5 | Новая точка расширяет огибающую выбранной ветви. | A new point expands the selected branch bound. | space → tree |
| 6 | Та же инфраструктура поддерживает и ближайших соседей. | The same infrastructure can support nearest-neighbor search. | space → tree → client |

**Дальше:** Что изменится, если области не перекрываются?

## 53. SP-GiST: деление пространства / SP-GiST: partition the space

Как искать по непересекающимся секторам?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Снова ищем близкие точки, но иначе организуем пространство. | Search the same points with a different spatial organization. | space |
| 2 | Quad-tree делит плоскость на четыре непересекающихся сектора. | A quad-tree divides the plane into four disjoint sectors. | space → tree |
| 3 | Запрос в нижнем левом секторе пропускает три другие ветви. | A query in the lower-left sector skips the other three branches. | space → tree |
| 4 | В выбранном секторе проверяем A и B и получаем две строки. | Check A and B within the chosen sector and return two rows. | tree → table |
| 5 | Для текстовых префиксов та же идея превращается в radix tree. | For text prefixes, the same idea becomes a radix tree. | tree → client |

**Дальше:** А если одна строка содержит много отдельных ключей?

## 54. GIN: от ключа к строкам / GIN: from a key to rows

Как найти строки, содержащие нужные элементы?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | В каждой заметке несколько тегов. | Each note contains several tags. | table |
| 2 | GIN извлекает ключи и связывает каждый со списком адресов. | GIN extracts keys and links each to a posting list. | table → buckets |
| 3 | Для двух обязательных тегов читаем два списка кандидатов. | For two required tags, read two candidate lists. | client → buckets |
| 4 | Пересечение списков оставляет только TID1. | Intersecting the lists leaves only TID1. | buckets → bitmap → table |
| 5 | Одна новая строка добавляет адрес сразу к нескольким ключам. | One inserted row adds an address under several keys. | table → queue |
| 6 | Очистка переносит накопленные записи в основную структуру. | Cleanup merges pending entries into the main structure. | queue → buckets |

**Дальше:** Можно ли индексировать лишь сводки групп страниц?

## 55. BRIN: сводки диапазонов страниц / BRIN: summarize page ranges

Как маленький индекс отбрасывает большие части таблицы?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | События почти упорядочены по времени поступления. | Events are nearly ordered by arrival time. | table |
| 2 | Для каждых 32 страниц minmax-класс хранит границы значений. | For each 32-page range, the minmax class stores value bounds. | table → table |
| 3 | Условие minute = 150 несовместимо с двумя сводками. | The condition minute = 150 rules out two summaries. | client → table |
| 4 | Читаем страницы 32–63 и перепроверяем каждую строку. | Read pages 32–63 and recheck their rows. | table → table → client |
| 5 | Выброс времени 999 расширяет сводку и ухудшает отсечение. | An outlier at 999 widens a summary and weakens pruning. | table → table |
| 6 | Новые диапазоны надо суммировать; меньший диапазон даёт более точные сводки. | New ranges need summaries; smaller ranges provide finer bounds. | table → box |

**Дальше:** Как несколько ключей упорядочиваются в одном индексе?

## 56. Составной индекс и skip scan / Multicolumn index and skip scan

Почему порядок столбцов меняет объём поиска?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Ключ (shop, day) сортируется сначала по shop, затем по day. | The key (shop, day) sorts by shop first, then day. | table |
| 2 | Равенство по shop сразу ограничивает одну группу ключей. | Equality on shop narrows the scan to one key group. | client → table |
| 3 | Условие day >= 20 сужает выбранную группу до D. | The condition day >= 20 narrows that group to D. | table → table |
| 4 | Если задан только day, совпадения лежат в разных группах. | With only day specified, matches span several groups. | table → client |
| 5 | Skip scan повторяет поиск day = 20 для разных shop. | Skip scan repeats the day = 20 search for different shops. | queue → table |
| 6 | Индекс (shop, day) также помогает получить порядок внутри магазина. | The index also provides day order within a shop. | table → client |

**Дальше:** Как объединить результаты отдельных индексов?

## 57. Bitmap: собрать адреса, затем читать / Bitmap: collect addresses before fetching

Как два отдельных индекса помогают одному условию?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Нужны оплаченные заказы из магазина 2. | Find paid orders from shop 2. | table |
| 2 | Первый индекс отмечает адреса заказов магазина 2. | The first index marks tuple addresses for shop 2. | box → bitmap |
| 3 | Второй индекс отмечает оплаченные строки; AND оставляет TID1. | The second index marks paid rows; AND leaves TID1. | bitmap → bitmap → bitmap |
| 4 | Heap Scan читает нужные страницы в физическом порядке. | The heap scan visits selected pages in physical order. | bitmap → table → client |
| 5 | При нехватке памяти bitmap может помнить страницу целиком. | Under memory pressure, the bitmap can mark a whole page. | bitmap → table |

**Дальше:** Можно ли вообще не читать таблицу после поиска в индексе?

## 58. Index Only Scan и INCLUDE / Index Only Scan and INCLUDE

Почему имя Index Only не гарантирует ноль чтений heap?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Запросу нужны id и email, а искать надо по id. | The query needs id and email but searches by id. | table |
| 2 | INCLUDE сохраняет email рядом с поисковым ключом id. | INCLUDE stores email beside the searchable id key. | table |
| 3 | Все нужные значения есть, но видимость ещё надо доказать. | All requested values are present, but visibility still needs proof. | table → bitmap |
| 4 | All-visible установлен: email возвращается прямо из индекса. | With all-visible set, return email directly from the index. | table → bitmap → client |
| 5 | Изменение страницы сбрасывает бит: придётся проверить heap. | A page change clears the bit, requiring a heap visibility check. | table → bitmap → table |
| 6 | VACUUM может снова отметить страницу как all-visible. | VACUUM can mark the page all-visible again. | table → bitmap → client |

**Дальше:** Чем свойства индекса отличаются от его метода доступа?

## 59. UNIQUE, выражение и частичный индекс / UNIQUE, expression and partial indexes

Это новые методы индекса или свойства привычного дерева?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | B-tree задаёт устройство, а UNIQUE — дополнительное правило. | B-tree is the structure; UNIQUE adds a rule. | table |
| 2 | Выражение lower(email) превращает регистр в одинаковый ключ. | The expression lower(email) maps case variants to the same key. | table → table |
| 3 | Частичный индекс включает только active = true. | A partial index includes only active = true rows. | table → table |
| 4 | Активация второго аккаунта нарушила бы уникальность ключа. | Activating the second account would violate key uniqueness. | table → box → status |
| 5 | Запрос должен доказывать предикат частичного индекса. | A query must imply the partial-index predicate. | client → table |
| 6 | NULL по умолчанию не равен другому NULL; это можно изменить. | NULLs are distinct by default; the uniqueness rule can change. | table |

**Дальше:** Как база выполняет действие автоматически при изменении строки?

## 60. Строковые BEFORE и AFTER / Row-level BEFORE and AFTER

На каком этапе триггер видит OLD и NEW?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Приложение вставляет товар с именем BOOK. | The application inserts a product named BOOK. | client |
| 2 | BEFORE INSERT получает NEW до записи версии в таблицу. | BEFORE INSERT receives NEW before the tuple is stored. | client → box → table |
| 3 | Возвращённый NEW содержит book; именно он попадает в таблицу. | Returned NEW contains book, which is the value stored. | box → table → client |
| 4 | AFTER UPDATE получает старую цену 100 и новую 120. | AFTER UPDATE receives the old price 100 and new price 120. | table → queue |
| 5 | AFTER-триггер записывает одну строку аудита. | The AFTER trigger inserts one audit row. | table → queue → table |
| 6 | ROLLBACK отменяет и цену 120, и строку аудита. | ROLLBACK removes both the price change and its audit row. | table → table → client |
| 7 | Несколько однотипных триггеров выполняются по имени. | Multiple triggers of the same kind run in name order. | queue → box |

**Дальше:** Что делать один раз для всей команды, а не каждой строки?

## 61. Команда целиком и transition tables / Statement triggers and transition tables

Как один триггер видит все изменённые строки?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Одна команда повышает цену двух товаров. | One statement raises the price of two products. | table |
| 2 | AFTER STATEMENT с NEW TABLE получает набор новых версий. | AFTER STATEMENT with NEW TABLE receives the changed row set. | table → table |
| 3 | Две строки изменены, а функция вызывается один раз. | Two rows change, but the function is called once. | table → box → table |
| 4 | Команда без совпадений всё равно вызывает STATEMENT-триггер. | A statement affecting no rows still fires its STATEMENT trigger. | table → box → table |
| 5 | OLD TABLE и NEW TABLE позволяют сравнить наборы до и после. | OLD TABLE and NEW TABLE allow set-wise before/after comparison. | table → table → box |
| 6 | TRUNCATE имеет только уровень STATEMENT. | TRUNCATE supports only STATEMENT triggers. | box → queue |

**Дальше:** Как изменить данные через представление?

## 62. INSTEAD OF: запись через view / INSTEAD OF: write through a view

Кто превращает изменение представления в запись базовых таблиц?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Представление показывает строку из двух базовых таблиц. | A view presents a row from two base tables. | table |
| 2 | INSTEAD OF INSERT получает новую строку представления. | INSTEAD OF INSERT receives the new view row. | client → table → box |
| 3 | Один INSERT во view создаёт по строке в обеих таблицах. | One view INSERT creates a row in each base table. | box → table → table |
| 4 | Повторное чтение view собирает строку из базовых таблиц. | Reading the view reconstructs the row from the base tables. | table → table → table |
| 5 | Для UPDATE и DELETE нужны собственные правила обработки. | UPDATE and DELETE need their own handling rules. | table → box |

**Дальше:** Можно ли проверить правило только в конце транзакции?

## 63. Отложенная проверка ограничения / Deferred constraint checking

Как разрешить временное нарушение внутри транзакции?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Сначала вставим ребёнка, затем родителя в той же транзакции. | Insert a child first, then its parent in the same transaction. | table → table |
| 2 | INSERT ребёнка ставит проверку в очередь, не отклоняя команду. | The child INSERT queues a check instead of rejecting the statement. | table → table → queue |
| 3 | Следующая команда создаёт родителя 1. | The next statement creates parent 1. | table → table → queue |
| 4 | COMMIT запускает очередь и успешно находит родителя. | COMMIT runs the queued check and finds the parent. | queue → table → client |
| 5 | Без родителя 2 ошибка возникает на COMMIT. | With parent 2 missing, the error occurs at COMMIT. | table → queue → status |
| 6 | Собственный constraint trigger тоже может ждать конца транзакции. | A custom constraint trigger can also wait until transaction end. | queue → box |

**Дальше:** Как WAL переносит эти изменения на другой сервер?

## 64. Физическая репликация по WAL / Physical replication through WAL

Как изменение одной страницы доходит до другого сервера?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Ведущий узел принимает записи, реплика восстанавливает его WAL. | The primary accepts writes; the standby replays its WAL. | server |
| 2 | UPDATE создаёт WAL изменений ещё до фиксации транзакции. | UPDATE generates change WAL before the transaction commits. | client → server → wal |
| 3 | WAL sender передаёт запись, WAL receiver принимает её. | The WAL sender transmits a record to the WAL receiver. | server → wal → server |
| 4 | COMMIT добавляет запись фиксации с позицией 0/140. | COMMIT adds its commit record at position 0/140. | server → wal → server |
| 5 | Реплика сохранила WAL, но пока не применила COMMIT. | The standby has flushed WAL but not replayed COMMIT yet. | server → table → client |
| 6 | После replay COMMIT новый снимок на реплике видит 80. | After COMMIT replay, a new standby snapshot sees 80. | server → table → client |
| 7 | Асинхронный ответ primary может опередить реплику. | An asynchronous primary acknowledgment can precede standby replay. | server → server → box |

**Дальше:** На каком этапе COMMIT должен отвечать приложению?

## 65. Синхронность: чего ждёт COMMIT / Synchronous replication: what COMMIT waits for

Получено, сохранено и применено — одинаковые гарантии?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Без выбранных синхронных реплик on ждёт только локальный flush. | Without selected synchronous standbys, on waits for local flush only. | client → server → server |
| 2 | Теперь COMMIT ждёт подтверждение выбранной реплики s1. | Now COMMIT waits for the selected standby s1. | server → server → queue |
| 3 | Тот же COMMIT в варианте remote_write ждёт записи WAL в файловую систему реплики. | The same COMMIT in the remote_write alternative waits for the standby filesystem write. | server → table → client |
| 4 | Тот же COMMIT в варианте on ждёт устойчивого сохранения WAL репликой. | The same COMMIT in the on alternative waits for durable standby WAL. | server → table → client |
| 5 | Тот же COMMIT в варианте remote_apply ждёт применения WAL репликой. | The same COMMIT in the remote_apply alternative waits for standby replay. | server → table → client |
| 6 | Чем дальше точка ожидания, тем больше задержка и зависимость от реплики. | A later acknowledgment point adds latency and standby dependency. | table → status |

**Дальше:** Куда приложению отправлять чтения и транзакции?

## 66. Куда приложению отправлять запрос / Where an application sends queries

Почему нельзя просто раздать все SELECT по репликам?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Приложение имеет отдельные пути к primary и реплике. | The application has separate paths to primary and standby. | client → server → server |
| 2 | Запись уже подтверждена, но немедленное чтение реплики даёт старые данные. | The write is acknowledged, but an immediate standby read returns old data. | client → server → server |
| 3 | Чтение, которому нужна свежая запись, направляем на primary. | Send a read requiring the recent write to the primary. | client → server → server |
| 4 | Все команды одной транзакции остаются на одном соединении. | Keep all statements of a transaction on one connection. | client → server → server |
| 5 | libpq может выбрать сервер нужной роли при подключении. | libpq can select a server with the required role at connection time. | client → server → server |
| 6 | Выбор сервера не повторяется перед каждым запросом. | Server selection is not repeated before every query. | client → server → box |

**Дальше:** Что удерживает WAL и старые версии для отставшей реплики?

## 67. Отставание, слоты и конфликт VACUUM / Lag, slots and VACUUM conflicts

Почему медленная реплика может увеличивать диск primary?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Отключённой реплике ещё нужен старый WAL. | A disconnected standby still needs old WAL. | server → wal → server |
| 2 | Replication slot удерживает нужную для потребителя историю. | A replication slot retains the history its consumer still needs. | server → wal → server |
| 3 | Пока реплика не продвигается, удержанный WAL занимает больше места. | While the standby stalls, retained WAL consumes more space. | wal → status → server |
| 4 | Долгий SELECT на standby может мешать применению очистки. | A long standby SELECT can conflict with replaying cleanup. | server → wal → server |
| 5 | Лимит ожидания защищает replay ценой отмены запроса. | The delay limit protects replay by canceling a conflicting query. | server → wal → status |
| 6 | hot_standby_feedback защищает старые версии, задерживая очистку primary. | hot_standby_feedback protects old versions by delaying primary cleanup. | server → server → table |

**Дальше:** Как безопасно сделать реплику ведущей?

## 68. Failover, fencing и новый primary / Failover, fencing and a new primary

Как избежать двух ведущих после сетевого сбоя?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Primary недоступен приложению; standby ещё отвечает. | The application cannot reach the primary, while the standby responds. | client → server → server |
| 2 | Решение о переключении принимает оператор или внешняя система. | An operator or external system decides whether to fail over. | server → server → box |
| 3 | Прежний primary изолируют от новых записей. | Fence the old primary off from new writes. | server → server → box |
| 4 | Выбранная standby завершает доступное восстановление и повышается. | The chosen standby finishes available recovery and is promoted. | server → wal → box |
| 5 | Приложение переподключается к новому ведущему узлу. | The application reconnects to the new primary. | client → server → server |
| 6 | Старый primary не возвращают в запись с прежней историей. | Do not return the old primary to writes with its divergent history. | server → server → wal |
| 7 | Новый primary снова получает standby; аварийную схему надо проверять заранее. | Rebuild standby protection for the new primary and test failover beforehand. | server → server → client |

**Дальше:** Как реплицировать выбранные таблицы вместо целого кластера?

## 69. Логическая публикация и подписка / Logical publication and subscription

Как переносить изменения выбранных таблиц?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Publisher и subscriber — две самостоятельные базы. | Publisher and subscriber are two independent databases. | server → server |
| 2 | Публикация выбирает таблицу, а подписка связывает базы. | A publication selects a table; a subscription connects the databases. | server → box → server |
| 3 | Первичная синхронизация копирует строки согласованного снимка. | Initial synchronization copies rows from a consistent snapshot. | server → queue → server |
| 4 | Логическое декодирование превращает WAL в изменения строк. | Logical decoding turns WAL into row changes. | server → wal → queue |
| 5 | Apply worker находит id 1 и применяет цену 120. | The apply worker finds id 1 and applies price 120. | queue → server → table |
| 6 | DDL и состояние sequence не входят в обычный поток подписки. | DDL and sequence state are outside the ordinary subscription stream. | server → server → box |

**Дальше:** Дают ли встречные подписки прозрачный multi-master?

## 70. Несколько писателей и конфликты / Multiple writers and conflicts

Что произойдёт, если одинаковый ключ записан на двух узлах?

| Stop | Русский | English | Actors |
| --- | --- | --- | --- |
| 1 | Две логические базы могут принимать локальные записи. | Two logically replicated databases can accept local writes. | server → server |
| 2 | Оба узла независимо создают строку с id 7. | Both nodes independently create a row with id 7. | table → table |
| 3 | Входящий INSERT с A конфликтует с первичным ключом на B. | The INSERT arriving from A conflicts with B’s primary key. | table → table → status |
| 4 | Нужны диагностика и явное решение о правильных данных. | Diagnose the conflict and explicitly decide the correct data. | status → box → queue |
| 5 | Разделение владения данными уменьшает риск встречных записей. | Separating data ownership reduces conflicting writes. | table → table → box |
| 6 | Базовая модель — один ведущий; multi-writer требует отдельного протокола. | The baseline is one primary; multi-writer requires an additional protocol. | box → box → client |

**Дальше:** Теперь можно проследить запрос от приложения до страниц, WAL и реплик.


/* The diagrams deliberately use a small, deterministic teaching model.
 * They illustrate the current story step; no Redis server is contacted. */
const C = { ink: '#293238', muted: '#687579', line: '#d9dfdf', red: '#5786ae', green: '#28765a', blue: '#4176a6', pale: '#f6f8f7', white: '#fff' };
const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = (lang, en, ru) => lang === 'ru' ? ru : en;
function text(x, y, lines, opt = {}) {
  const rows = Array.isArray(lines) ? lines : [lines];
  const size = opt.size || 17;
  return `<text x="${x}" y="${y}" text-anchor="${opt.anchor || 'start'}" fill="${opt.color || C.ink}" font-family="${opt.code ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : 'ui-monospace, SFMono-Regular, Consolas, monospace'}" font-size="${size}" font-weight="${opt.bold ? 650 : 400}" class="${opt.code ? 'scene-code' : 'scene-label'}">${rows.map((r, i) => `<tspan x="${x}" dy="${i ? opt.leading || size + 7 : 0}">${E(r)}</tspan>`).join('')}</text>`;
}
function box(x, y, w, h, title, body = [], opt = {}) {
  const size = opt.size || 16, max = Math.floor((w - 32) / (size * 0.61));
  const lines = [];
  for (const row of (Array.isArray(body) ? body : [body])) {
    let current = '';
    for (const word of String(row).split(' ')) { if ((current + ' ' + word).trim().length > max && current) { lines.push(current); current = word; } else current += (current ? ' ' : '') + word; }
    lines.push(current);
  }
  return `<g class="scene-node${opt.active ? ' scene-active' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opt.radius || 10}" fill="${opt.fill || C.white}" stroke="${opt.color || (opt.active ? C.red : C.line)}" stroke-width="${opt.active ? 2.4 : 1.5}"${opt.dashed ? ' stroke-dasharray="6 5"' : ''}/>${text(x + 16, y + 29, title, { size: opt.titleSize || 18, bold: true, color: opt.color })}${text(x + 16, y + 57, lines, { size, leading: size + 5, code: opt.code, color: opt.bodyColor })}</g>`;
}
function chip(x, y, w, label, opt = {}) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${opt.h || 34}" rx="6" fill="${opt.fill || C.pale}" stroke="${opt.color || C.line}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + 23, label, { code: opt.code !== false, size: opt.size || 15, anchor: 'middle', color: opt.color || C.ink, bold: opt.active })}</g>`;
}
function arrow(x1, y1, x2, y2, label = '', opt = {}) {
  const color = opt.color || C.red;
  return `<g class="flow"><path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${opt.width || 2}"${opt.dashed ? ' stroke-dasharray="6 5"' : ''} marker-end="url(#scene-arrow-${color.replace('#', '')})"/>${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 10}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="15" fill="${color}" stroke="white" stroke-width="5" paint-order="stroke">${E(label)}</text>` : ''}</g>`;
}
function note(label, opt = {}) {
  const words = String(label).split(' '), lines = [''];
  for (const word of words) { const last = lines.length - 1; if ((lines[last] + ' ' + word).trim().length > 100 && lines[last]) lines.push(word); else lines[last] += (lines[last] ? ' ' : '') + word; }
  return text(480, opt.y || (lines.length > 1 ? 277 : 290), lines, { size: opt.size || 14, leading: 19, anchor: 'middle', color: opt.color || C.muted });
}
function endpoint(x, y, label, detail, active = false, color = C.green) {
  const words = String(detail).split(' '), rows = [''];
  for (const word of words) { const i = rows.length - 1; if ((rows[i] + ' ' + word).trim().length > 24 && rows[i]) rows.push(word); else rows[i] += (rows[i] ? ' ' : '') + word; }
  const mark = /[ABCS][0-9]?$/.test(label) ? label.match(/[ABCS][0-9]?$/)[0] : 'C';
  return `<g class="scene-node${active ? ' scene-active' : ''}"><circle cx="${x + 90}" cy="${y + 29}" r="30" fill="${color}" stroke="${C.ink}" stroke-width="${active ? 3 : 1.5}"/>${text(x + 90, y + 35, mark, { size: 18, anchor: 'middle', color: C.white, bold: true })}${text(x + 90, y + 78, label, { size: 14, anchor: 'middle' })}${text(x + 90, y + 101, rows, { size: 14, leading: 18, anchor: 'middle', code: true })}</g>`;
}
function server(x, y, label, detail, active = false, failed = false) {
  return `<g class="scene-node${active ? ' scene-active' : ''}"><circle cx="${x}" cy="${y}" r="48" fill="${failed ? C.pale : C.red}" stroke="${C.ink}" stroke-width="${active ? 3 : 1.5}"/>${text(x, y + 6, label, { size: 17, anchor: 'middle', bold: true, color: failed ? C.muted : C.white })}${failed ? `<path d="M${x-25} ${y-25} L${x+25} ${y+25} M${x+25} ${y-25} L${x-25} ${y+25}" stroke="#c83835" stroke-width="3"/>` : ''}${text(x, y + 79, detail, { size: 15, anchor: 'middle' })}</g>`;
}
function dots(x, y, items, active = -1, w = 150) {
  return items.map((item, i) => chip(x + i * (w + 10), y, w, item, { active: i === active, color: i === active ? C.red : undefined })).join('');
}
const titles = {
  'first-key': ['A key in memory', 'Ключ в памяти'], request: ['A request travels through Redis', 'Путь запроса через Redis'],
  'event-loop': ['One command executor', 'Один исполнитель команд'], dictionary: ['Find a key in the hash table', 'Поиск ключа в хеш-таблице'],
  encodings: ['Values and their encodings', 'Значения и их представления'], atomicity: ['Two clients update a counter', 'Два клиента меняют счётчик'],
  transactions: ['Queue, execute, watch', 'Очередь, исполнение и WATCH'], scripting: ['Server-side execution', 'Исполнение внутри сервера'],
  blocking: ['One client waits', 'Один клиент ждёт'], locks: ['Ownership expires', 'Срок владения истекает'],
  expiry: ['Time and key expiration', 'Время и истечение ключей'], memory: ['Memory has a limit', 'У памяти есть предел'],
  latency: ['Where time is spent', 'Куда уходит время'], rdb: ['A point-in-time snapshot', 'Снимок на момент времени'],
  aof: ['Three layers of a write', 'Три слоя записи'], replication: ['A replica can lag', 'Реплика может отставать'],
  sentinel: ['Detect failure and promote', 'Обнаружить сбой и переключиться'], cluster: ['Route a key to its slot', 'Маршрут ключа к слоту'],
  pubsub: ['Live message delivery', 'Доставка сообщений онлайн'], streams: ['A log and pending work', 'Журнал и ожидающая работа'],
  specialized: ['Structures for specific jobs', 'Структуры для специальных задач']
};
function firstKey(s, lang) {
  const command = s === 4 ? 'GET user:1' : s === 5 ? 'SET user:1 Bob · DEL user:1' : 'SET user:1 Alice';
  const value = s < 2 ? '∅' : s === 5 ? 'user:1 → ∅' : 'user:1 → "Alice"';
  let out = `<circle cx="185" cy="126" r="43" fill="${C.green}" stroke="${C.ink}" stroke-width="1.5"/>`;
  out += text(185, 132, L(lang, 'Client', 'Клиент'), { anchor: 'middle', color: C.white, bold: true, size: 16 });
  out += `<circle cx="765" cy="126" r="55" fill="${C.red}" stroke="${C.ink}" stroke-width="${s === 2 ? 3 : 1.5}"/>`;
  out += text(765, 132, 'Redis', { anchor: 'middle', color: C.white, bold: true, size: 19 });
  out += arrow(250, 106, 690, 106, command, { color: s === 0 ? C.line : C.red, dashed: s === 0 });
  const reply = s === 4 ? '"Alice"' : s === 5 ? '+OK · :1' : '+OK';
  out += arrow(690, 158, 250, 158, s >= 3 ? reply : '', { color: s >= 3 ? C.green : C.line, dashed: s < 3 });
  out += text(765, 226, value, { size: 18, anchor: 'middle', code: true });
  out += text(765, 252, L(lang, 'memory', 'память'), { size: 14, anchor: 'middle', color: C.muted });
  if (s === 1) out += text(480, 214, L(lang, 'locate the key', 'найти ключ'), { anchor: 'middle', size: 16 });
  return out + note(L(lang, ['A command starts at the client.', 'The command reaches the server and locates its key.', 'The key points to a value in RAM.', 'The reply confirms the in-memory write.', 'GET follows the key to its value.', 'SET replaces a value; DEL removes the entry.'][s], ['Команда начинается у клиента.', 'Команда приходит на сервер и находит ключ.', 'Ключ указывает на значение в RAM.', 'Ответ подтверждает запись в памяти.', 'GET находит значение по ключу.', 'SET заменяет значение; DEL удаляет запись.'][s]));
}
function request(s, lang) {
  const labels = [L(lang, 'TCP socket', 'TCP-сокет'), L(lang, 'Input buffer', 'Входной буфер'), L(lang, 'RESP parser', 'Разбор RESP'), L(lang, 'Command checks', 'Проверки'), L(lang, 'Output buffer', 'Выходной буфер')];
  const bodies = [[L(lang, 'bytes', 'байты')], [s < 3 ? '*3 · $3 · SET …' : '*3 · SET · k · v'], [s < 3 ? L(lang, 'need more bytes', 'нужны ещё байты') : 'SET k v'], [L(lang, 'arity · ACL · type', 'аргументы · ACL · тип')], ['+OK\r\n']];
  const stage = [0, 1, 1, 2, 3, 4][s];
  let out = labels.map((v, i) => box(20 + i * 190, 89, 160, 110, v, bodies[i], { active: i === stage, size: 14, titleSize: 16 })).join('');
  for (let i = 0; i < 4; i++) out += arrow(183 + i * 190, 143, 202 + i * 190, 143, '', { color: i < stage ? C.red : C.line });
  out += chip(125, 226, 310, s === 2 ? '*3\r\n$3\r\nSE' : '*3\r\n$3\r\nSET\r\n…', { color: C.blue });
  out += text(465, 239, L(lang, s === 2 ? ['An incomplete frame stays', 'in the input buffer.'] : ['TCP chunks and RESP commands', 'have different boundaries.'], s === 2 ? ['Неполный кадр остаётся', 'во входном буфере.'] : ['Границы TCP-фрагментов и', 'RESP-команд различаются.']), { size: 15 });
  return out + note(L(lang, ['TCP delivers an ordered byte stream.', 'RESP encodes an array of command arguments.', 'A fragment is not yet a complete command.', 'The parser has enough bytes to create arguments.', 'The server validates the command before its mutation.', 'The reply is buffered, then written to the socket.'][s], ['TCP доставляет упорядоченный поток байтов.', 'RESP кодирует массив аргументов команды.', 'Фрагмент ещё не является полной командой.', 'Байт достаточно: парсер собирает аргументы.', 'Сервер проверяет команду до её изменения данных.', 'Ответ попадает в буфер и затем в сокет.'][s]));
}
function eventLoop(s, lang) {
  let out = '';
  ['A', 'B', 'C'].forEach((name, i) => {
    const y = 52 + i * 84;
    out += `<circle cx="65" cy="${y}" r="28" fill="${C.green}" stroke="${C.ink}" stroke-width="${s === i + 2 ? 3 : 1.5}"/>` + text(65, y + 6, name, { anchor: 'middle', bold: true, color: C.white });
    out += text(110, y + 6, ['SET k v', 'GET k', 'PING'][i], { size: 15, code: true });
    out += arrow(210, y, 285, y, s === 5 && i === 2 ? L(lang, 'wait', 'ждёт') : '', { color: s === 5 && i === 2 ? C.muted : s >= 1 ? C.green : C.line, dashed: s === 5 && i === 2 });
  });
  out += box(300, 33, 355, 224, L(lang, 'Main event loop', 'Основной event loop'), [L(lang, 'poll → read → execute → reply', 'poll → чтение → команда → ответ')], { active: true, size: 14 });
  out += box(325, 118, 305, 100, L(lang, 'Command executor', 'Исполнитель команд'), [s === 2 ? 'A: SET k v' : s === 3 ? 'B: GET k → "v"' : s === 5 ? L(lang, 'slow command · C waits', 'долгая команда · C ждёт') : L(lang, 'one command at a time', 'по одной команде')], { active: s === 2 || s === 3 || s === 5, fill: C.pale, size: 14 });
  out += box(750, 43, 190, 88, L(lang, 'I/O threads', 'Потоки I/O'), [L(lang, 'network work', 'работа с сетью')], { active: s === 4, color: C.blue, size: 14, titleSize: 16 });
  out += box(750, 171, 190, 86, L(lang, 'Background', 'Фоновая работа'), ['AOF · RDB · lazyfree'], { active: s === 4, size: 14, titleSize: 16 });
  return out + note(L(lang, s === 5 ? 'A long-running command delays the other commands.' : 'Networking and background jobs do not make ordinary commands execute in parallel.', s === 5 ? 'Долгая команда задерживает исполнение остальных.' : 'Сеть и фоновые задачи не делают обычные команды параллельными.'));
}
function dictionary(s, lang) {
  let out = chip(25, 20, 170, 'key = "user:1"', { color: C.green });
  out += arrow(208, 37, 278, 37, 'hash');
  out += chip(290, 20, 190, L(lang, 'hash → bucket 2', 'хеш → ячейка 2'), { active: s <= 1 });
  const oldRows = s >= 5 ? ['0   ∅', '1   ∅', '2   ∅', '3   c'] : ['0   ∅', '1   ∅', '2   user:2 → user:1', '3   c'];
  out += text(100, 91, L(lang, 'Table 0 · 4 buckets', 'Таблица 0 · 4 ячейки'), { bold: true });
  oldRows.forEach((v, i) => { out += chip(100, 106 + i * 34, 280, v, { h: 30, active: i === 2 && s >= 1 && s < 4, color: i === 2 && s >= 1 && s < 4 ? C.red : undefined }); });
  if (s < 4) {
    out += box(525, 108, 370, 122, L(lang, s >= 2 ? 'A collision is a chain' : 'Bucket index', s >= 2 ? 'Коллизия образует цепочку' : 'Индекс ячейки'), [s >= 2 ? L(lang, 'user:2 ≠ user:1 → next', 'user:2 ≠ user:1 → дальше') : 'hash & (size − 1)', s >= 3 ? L(lang, 'user:1 = user:1 → value', 'user:1 = user:1 → значение') : L(lang, 'compare the full key', 'сравнить весь ключ')], { active: s === 3, code: true, size: 16 });
  } else {
    out += text(590, 91, L(lang, 'Table 1 · 8 buckets', 'Таблица 1 · 8 ячеек'), { bold: true });
    ['0 ∅', '1 ∅', '2 user:2', '3 ∅', '4 ∅', '5 ∅', '6 user:1', '7 ∅'].forEach((v, i) => { out += chip(590 + (i >= 4 ? 155 : 0), 106 + i % 4 * 34, 145, s === 4 ? `${i}  ∅` : v, { h: 30, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
    out += arrow(395, 165, 570, 165, s === 5 ? L(lang, 'move a bucket', 'перенос ячейки') : L(lang, 'allocate', 'выделить'));
  }
  return out + note(L(lang, s < 4 ? 'The hash chooses a bucket; equality finds the actual key.' : 'Rehash moves entries gradually; lookups may inspect both tables.', s < 4 ? 'Хеш выбирает ячейку; сравнение находит нужный ключ.' : 'Rehash переносит записи постепенно; поиск может читать обе таблицы.'));
}
function encodings(s, lang) {
  const types = ['String', 'List', 'Set', 'Hash', 'Sorted Set', L(lang, 'Growth', 'Рост')];
  let out = dots(25, 18, types, s, 140);
  if (s === 0) {
    out += box(75, 88, 335, 137, 'String', ['"hello" → SDS', L(lang, '"42" → integer encoding', '"42" → целое число')], { active: true, code: true });
    out += box(555, 88, 330, 137, 'SDS', ['len: 5 · alloc: 5', 'h | e | l | l | o'], { code: true });
    out += arrow(425, 157, 540, 157);
  } else if (s === 1) {
    out += box(65, 91, 825, 143, 'List → quicklist', [], { active: true });
    for (let i = 0; i < 3; i++) { out += box(100 + i * 265, 145, 220, 62, 'listpack', [], { titleSize: 16, fill: C.pale }); out += text(111 + i * 265, 194, `${i * 3 + 1} | ${i * 3 + 2} | ${i * 3 + 3}`, { size: 15, code: true }); if (i < 2) out += arrow(327 + i * 265, 174, 350 + i * 265, 174, '', { color: C.muted }); }
  } else if (s === 2) {
    out += box(75, 88, 335, 137, 'Set → intset', ['[ 2, 5, 8, 13 ]', L(lang, 'other small sets: listpack', 'другие малые Set: listpack')], { active: true, code: true });
    out += box(555, 88, 330, 137, 'Set → hashtable', ['"apple" → ∅', '"orange" → ∅'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'expand', 'рост'));
  } else if (s === 3) {
    out += box(75, 88, 335, 137, 'Hash → listpack', ['name | Alice | age | 30', L(lang, 'fields beside their values', 'поля рядом со значениями')], { active: true, size: 15, code: true });
    out += box(555, 88, 330, 137, 'Hash → hashtable', ['name → "Alice"', 'age → "30"'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'growth', 'рост'));
  } else if (s === 4) {
    out += box(75, 88, 335, 137, 'Sorted Set', ['alice: 10 · bob: 20', 'listpack'], { active: true, code: true });
    out += box(555, 88, 330, 137, 'skiplist + hashtable', ['10 → 20 → 35', 'alice → score 10'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'growth', 'рост'));
  } else {
    out += box(75, 88, 335, 137, L(lang, 'Compact encoding', 'Компактная форма'), ['listpack / intset', L(lang, 'small values, low overhead', 'мало данных и накладных расходов')], { active: true, size: 15 });
    out += box(555, 88, 330, 137, L(lang, 'Expanded encoding', 'Развёрнутая форма'), ['hashtable / skiplist', L(lang, 'efficient operations at scale', 'удобные операции при росте')], { active: true, size: 15 });
    out += arrow(425, 157, 540, 157, L(lang, 'threshold crossed', 'превышен порог'));
  }
  return out + note(L(lang, 'A public data type can have more than one internal representation.', 'Один тип данных может иметь разные внутренние представления.'));
}
function atomicity(s, lang) {
  const incr = s >= 4;
  let out = text(125, 35, L(lang, 'Client A', 'Клиент A'), { bold: true, color: C.green });
  out += text(370, 35, L(lang, 'Client B', 'Клиент B'), { bold: true, color: C.blue });
  out += box(665, 68, 250, 155, 'Redis', [], { active: true });
  const count = s === 0 || s === 1 ? 0 : s === 5 ? 2 : 1;
  out += chip(702, 134, 175, `count = ${count}`, { color: C.red, active: true, size: 19, h: 40 });
  const rows = incr ? [['INCR count', ''], ['', 'INCR count']] : [['GET → 0', s >= 1 ? 'GET → 0' : ''], [s >= 2 ? 'SET count 1' : '', ''], ['', s >= 3 ? 'SET count 1' : '']];
  rows.forEach((r, i) => { if (r[0] && (i === 0 || s >= 2 || incr)) out += chip(65, 68 + i * 62, 210, r[0], { color: C.green }); if (r[1] && (!incr || s === 5)) out += chip(310, 68 + i * 62, 210, r[1], { color: C.blue }); });
  if (s >= 2) out += arrow(535, s === 5 ? 146 : 209, 650, s === 5 ? 146 : 209, incr ? L(lang, 'atomic', 'атомарно') : 'SET');
  out += text(65, 265, L(lang, incr ? 'Each INCR reads and writes inside one command.' : 'GET and SET are separate commands: another client can act between them.', incr ? 'INCR читает и записывает значение внутри одной команды.' : 'GET и SET — разные команды: между ними может действовать другой клиент.'), { size: 16 });
  return out + note(L(lang, s === 3 ? 'Two updates, but the result is 1: one update was lost.' : s === 5 ? 'Two INCR commands give 2.' : 'Time flows from the first row to the last.', s === 3 ? 'Два обновления, но результат 1: одно обновление потеряно.' : s === 5 ? 'Две команды INCR дают 2.' : 'Время идёт от первой строки к последней.'), { y: 298 });
}
function transactions(s, lang) {
  const watched = s === 2 || s === 3;
  let out = endpoint(15, 95, L(lang, 'Client A', 'Клиент A'), watched ? 'WATCH balance' : s === 0 ? 'MULTI' : 'EXEC');
  out += box(320, 45, 365, 202, watched ? L(lang, 'Watched key', 'Наблюдаемый ключ') : L(lang, 'Transaction queue', 'Очередь транзакции'), [], { active: true });
  if (watched) {
    out += chip(345, 112, 315, s === 2 ? L(lang, 'balance = 100 · version 1', 'balance = 100 · версия 1') : L(lang, 'balance = 200 · version 2', 'balance = 200 · версия 2'), { size: 14, active: true });
    out += chip(345, 178, 315, s === 3 ? 'EXEC → (nil)' : 'GET balance → "100"', { color: s === 3 ? '#b44c34' : C.green });
    out += endpoint(745, 85, L(lang, 'Client B', 'Клиент B'), 'SET balance 200', s === 3, C.blue);
    if (s === 3) out += arrow(730, 115, 700, 115, '', { color: C.blue });
  } else {
    out += chip(345, 97, 315, 'SET balance 100', { color: s === 1 || s === 4 ? C.green : undefined });
    out += chip(345, 140, 315, s === 5 ? 'SET only-key → ERR' : s === 4 ? 'LPUSH balance x → WRONGTYPE' : 'INCR balance', { size: 14, color: s >= 4 ? '#b44c34' : undefined });
    out += chip(345, 183, 315, s === 0 ? 'QUEUED' : s === 5 ? 'EXECABORT · no writes' : s === 4 ? 'balance = "100"' : 'balance = "101"', { size: 14, color: s === 5 ? '#b44c34' : C.green });
    out += arrow(216, 128, 305, 128, s === 0 ? 'QUEUED' : 'EXEC');
    out += text(730, 105, [L(lang, 'Other clients', 'Другие клиенты'), L(lang, s === 0 ? 'may act before EXEC' : 'wait during EXEC', s === 0 ? 'работают до EXEC' : 'ждут во время EXEC')], { size: 14, color: C.muted });
  }
  const notes = [L(lang, 'MULTI queues commands; it does not execute them yet.', 'MULTI накапливает команды, но пока их не исполняет.'), L(lang, 'EXEC runs the queued commands without another client between them.', 'EXEC исполняет очередь без команд других клиентов между её командами.'), L(lang, 'WATCH starts optimistic concurrency control before the read.', 'WATCH включает оптимистичный контроль изменений до чтения.'), L(lang, 'A changed watched key aborts EXEC before the queued commands run.', 'Изменённый ключ отменяет EXEC до исполнения очереди.'), L(lang, 'A run-time error does not roll back SET that already succeeded.', 'Ошибка исполнения не откатывает уже выполненный SET.'), L(lang, 'A queue-time syntax error makes EXECABORT cancel the whole transaction.', 'Ошибка синтаксиса при постановке в очередь вызывает EXECABORT без исполнения.')];
  return out + note(notes[s]);
}
function scripting(s, lang) {
  let out = endpoint(10, 86, L(lang, 'Client A', 'Клиент A'), s === 3 ? 'EVALSHA sha1' : s === 4 ? 'FCALL update' : 'EVAL …', s === 0 || s === 3 || s === 4);
  const title = s === 3 ? L(lang, 'Script cache', 'Кеш скриптов') : s === 4 ? L(lang, 'Function library', 'Библиотека Functions') : L(lang, 'Server-side execution', 'Исполнение на сервере');
  out += box(315, 32, 365, 227, title, [], { active: true });
  const lines = s === 3 ? ['EVAL → SHA1', 'EVALSHA → cached script', 'NOSCRIPT → load again'] : s === 4 ? ['FUNCTION LOAD', 'FCALL update 1 count', 'INCR + EXPIRE'] : ['INCR count', 'EXPIRE count 60', s === 2 ? 'error("oops")' : s === 5 ? 'long loop …' : 'return count'];
  lines.forEach((v, i) => { out += chip(340, 91 + i * 45, 315, v, { active: s === 2 || s === 5 ? i === 2 : i === 0, color: s === 2 && i === 2 ? '#b44c34' : undefined, size: 14 }); });
  out += endpoint(745, 86, L(lang, 'Client B', 'Клиент B'), 'GET count', false, C.blue);
  out += arrow(218, 123, 300, 123, s === 4 ? 'FCALL' : 'EVAL');
  out += arrow(730, 123, 695, 123, L(lang, 'wait', 'ждёт'), { color: C.muted, dashed: true });
  if (s === 2) out += chip(735, 220, 195, 'count = 1', { size: 14, color: '#b44c34' });
  const notes = [L(lang, 'INCR and EXPIRE can be composed into one atomic server-side operation.', 'INCR и EXPIRE можно объединить в атомарную операцию внутри сервера.'), L(lang, 'No other client command runs in the middle of this script.', 'Команда другого клиента не вклинивается внутрь скрипта.'), L(lang, 'A script error leaves earlier writes in place; there is no automatic rollback.', 'Ошибка скрипта оставляет ранние записи: автоматического отката нет.'), L(lang, 'EVALSHA reuses a cached script; clients must handle a missing cache entry.', 'EVALSHA использует кеш скриптов; клиент должен обработать отсутствие скрипта.'), L(lang, 'Functions are named server-side code managed as persistent libraries.', 'Functions — именованный код сервера, который хранится в библиотеках.'), L(lang, 'A long-running script delays every other command while it executes.', 'Долгое исполнение скрипта задерживает все остальные команды.')];
  return out + note(notes[s]);
}
function blocking(s, lang) {
  const wake = s === 2;
  let out = endpoint(10, 35, L(lang, 'Client A', 'Клиент A'), s === 3 ? 'BLPOP jobs 2' : 'BLPOP jobs 0', s === 0);
  out += box(315, 50, 360, 145, 'Redis · jobs', [s === 2 ? '[ "job:1" ] → A' : '[ ]', L(lang, s === 5 ? 'item removed before worker crash' : 'command executor remains available', s === 5 ? 'элемент удалён до сбоя обработчика' : 'исполнитель команд доступен')], { active: s >= 1, code: true, size: 14 });
  out += endpoint(745, 35, L(lang, 'Client B', 'Клиент B'), s === 2 ? 'RPUSH jobs job:1' : s === 4 ? 'BLPOP jobs 0' : 'GET other', s === 1 || s === 2, C.blue);
  out += box(65, 201, 315, 62, L(lang, wake ? 'A resumed' : s === 3 ? 'timeout → (nil)' : s === 5 ? 'A crashed after pop' : 'A waits for an item', wake ? 'A продолжает работу' : s === 3 ? 'таймаут → (nil)' : s === 5 ? 'A упал после pop' : 'A ожидает элемент'), [], { titleSize: 16, dashed: !wake, color: wake ? C.green : C.muted });
  if (s === 0 || s === 1) out += arrow(225, 140, 225, 186, '', { dashed: true, color: C.muted });
  if (s === 2) out += arrow(730, 85, 690, 85, '', { color: C.blue }) + arrow(495, 210, 395, 232, '"job:1"', { color: C.green });
  if (s === 4) out += chip(510, 226, 380, 'waiters: A → B', { color: C.blue });
  const notes = [L(lang, 'An empty list parks client A, not the command executor.', 'Пустой список оставляет клиента A ждать, но не занимает исполнитель.'), L(lang, 'While A waits, other clients continue to use Redis.', 'Пока A ждёт, остальные клиенты продолжают работать.'), L(lang, 'RPUSH adds an item and wakes a waiting consumer.', 'RPUSH добавляет элемент и будит ожидающего потребителя.'), L(lang, 'A finite timeout resumes the client even if no item arrived.', 'Конечный таймаут возвращает управление, даже если элемент не появился.'), L(lang, 'Clients waiting on the same list are served in arrival order.', 'Клиенты, ожидающие один список, обслуживаются по порядку ожидания.'), L(lang, 'After pop, the item is gone. A crashed worker needs a separate reliability design.', 'После pop элемент удалён. Для сбоя обработчика нужен отдельный механизм надёжности.')];
  return out + note(notes[s]);
}
function locks(s, lang) {
  const owner = s < 2 ? 'token-A' : 'token-B';
  let out = endpoint(10, 53, L(lang, 'Client A', 'Клиент A'), s >= 3 ? 'release(token-A)' : 'SET lock token-A NX PX 5000', s === 0);
  out += box(337, 53, 286, 132, L(lang, 'Lease in Redis', 'Аренда в Redis'), [`lock → ${owner}`, L(lang, s < 2 ? 'TTL: 5000 ms' : 'A expired · B owns', s < 2 ? 'TTL: 5000 ms' : 'срок A истёк · владеет B')], { active: true, code: true, size: 16 });
  out += endpoint(745, 53, L(lang, 'Client B', 'Клиент B'), s >= 2 ? 'SET … token-B NX PX 5000' : 'SET … NX → (nil)', s >= 1, C.blue);
  out += `<path d="M75 233 H885" stroke="${C.line}" stroke-width="3"/>`;
  [75, 475, 885].forEach((x, i) => { out += `<circle cx="${x}" cy="233" r="5" fill="${C.ink}"/>` + text(x, 260, ['0 s', '5 s', '6 s'][i], { size: 15, anchor: 'middle' }); });
  out += chip(105, 205, 280, 'token-A', { color: s < 2 ? C.green : C.muted });
  if (s >= 2) out += chip(545, 205, 280, 'token-B', { color: C.blue });
  if (s === 0 || s === 3 || s === 4) out += arrow(145, 89, 322, 89, '', { color: s >= 3 ? C.muted : C.green, dashed: s >= 3 });
  if (s === 1 || s === 2) out += arrow(790, 89, 638, 89, '', { color: s === 1 ? C.muted : C.blue, dashed: s === 1 });
  if (s === 4) out += text(480, 30, L(lang, 'token-A ≠ token-B → do not delete', 'token-A ≠ token-B → не удалять'), { anchor: 'middle', size: 17, color: '#b44c34' });
  if (s === 5) out += text(480, 30, L(lang, 'External resource rejects an older fencing number', 'Внешний ресурс отклоняет старый fencing-номер'), { anchor: 'middle', size: 16, color: C.blue });
  return out + note(L(lang, s >= 3 ? 'An expired owner can wake up; external writes need their own protection.' : 'NX grants ownership only if the key is absent; the TTL bounds the lease.', s >= 3 ? 'Старый владелец может проснуться; внешние записи требуют своей защиты.' : 'NX выдаёт владение только при отсутствии ключа; TTL ограничивает срок.'));
}
function expiry(s, lang) {
  const expired = s >= 1 && s <= 3, removed = s === 2 || s === 3 || s === 5;
  let out = box(55, 62, 270, 130, L(lang, 'Key dictionary', 'Словарь ключей'), [removed ? '∅' : 'session → "abc"', L(lang, removed ? 'entry removed' : 'entry in memory', removed ? 'запись удалена' : 'запись в памяти')], { active: s === 2, code: true, size: 15 });
  out += box(355, 62, 270, 130, L(lang, 'Expiry dictionary', 'Словарь сроков'), [removed || s === 4 ? '∅' : 'session → 10:00:05', L(lang, s === 4 ? 'SET cleared the TTL' : expired ? 'deadline has passed' : 'deadline in the future', s === 4 ? 'SET убрал TTL' : expired ? 'срок уже прошёл' : 'срок ещё не наступил')], { active: s === 1 || s === 4, code: true, size: 15 });
  out += box(655, 62, 250, 130, L(lang, 'Server clock', 'Часы сервера'), [s === 0 ? '10:00:02' : '10:00:06', expired || s === 5 ? 'GET → (nil)' : 'GET → "abc"'], { active: expired, code: true, size: 15 });
  out += chip(80, 226, 360, s === 5 ? L(lang, 'Primary → DEL → replica', 'Primary → DEL → реплика') : L(lang, 'Access path → delete expired key', 'При обращении → удалить ключ'), { color: s === 2 || s === 5 ? C.red : undefined, code: s === 5, size: 14 });
  out += chip(515, 226, 360, s === 4 ? 'SET session abc → TTL -1' : L(lang, 'Active expiry → sample and clean', 'Активная очистка → проверка ключей'), { color: s === 3 || s === 4 ? C.red : undefined, code: s === 4, size: 14 });
  return out + note(L(lang, s === 1 ? 'The key is logically expired even if its bytes are still allocated.' : s === 5 ? 'The primary propagates expiration as a deletion to its replicas.' : s === 4 ? 'A plain SET replaces the value and removes the old TTL unless KEEPTTL is requested.' : 'Expiration is checked on access and by active background work.', s === 1 ? 'Ключ уже недоступен, хотя его байты ещё могут занимать память.' : s === 5 ? 'Primary передаёт истечение репликам как удаление.' : s === 4 ? 'Обычный SET заменяет значение и снимает старый TTL, если не указан KEEPTTL.' : 'Срок проверяется при обращении и во время активной очистки.'));
}
function memory(s, lang) {
  const policies = ['allkeys-lru', 'allkeys-lfu', 'noeviction'];
  const policy = s <= 1 ? 0 : s === 2 ? 1 : 2;
  let out = text(60, 35, 'maxmemory', { bold: true });
  out += `<rect x="60" y="55" width="540" height="43" rx="4" fill="${C.pale}" stroke="${C.ink}"/>`;
  [180, 160, s === 0 ? 70 : 200].forEach((w, i) => { out += `<rect x="${60 + (i === 0 ? 0 : i === 1 ? 180 : 340)}" y="55" width="${w}" height="43" fill="${[C.red, C.green, C.blue][i]}" opacity="0.8"/>`; });
  out += text(60, 128, L(lang, s === 0 ? 'near the configured limit' : 'at the limit', s === 0 ? 'приближаемся к пределу' : 'предел достигнут'), { size: 16 });
  const names = ['hot:key', 'old:key', 'rare:key'];
  names.forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += chip(60 + i * 180, 158, 165, gone ? `${v} → ∅` : v, { color: gone ? '#b44c34' : undefined, size: 14 }); });
  out += box(660, 45, 265, 166, L(lang, 'Eviction policy', 'Политика вытеснения'), [policies[policy], L(lang, s === 1 ? 'old candidate evicted' : s === 2 ? 'rare candidate evicted' : s === 4 ? 'RSS includes overhead' : s >= 3 ? 'write → OOM error' : 'choose a candidate', s === 1 ? 'удалён старый кандидат' : s === 2 ? 'удалён редкий кандидат' : s === 4 ? 'RSS включает накладные расходы' : s >= 3 ? 'запись → ошибка OOM' : 'выбрать кандидата')], { active: true, code: true, size: 14 });
  if (s === 5) out += text(60, 244, L(lang, 'DEL: remove + free     UNLINK: remove → lazyfree', 'DEL: удалить + освободить     UNLINK: удалить → lazyfree'), { size: 16, code: true });
  return out + note(L(lang, s === 5 ? 'Allocator overhead and fragmentation also contribute to process memory.' : 'LRU and LFU select approximate candidates; they do not scan every key.', s === 5 ? 'Служебные данные аллокатора и фрагментация тоже расходуют память.' : 'LRU и LFU выбирают приближённого кандидата, не перебирая все ключи.'));
}
function latency(s, lang) {
  let out = text(70, 35, L(lang, 'Client', 'Клиент'), { bold: true, color: C.green });
  out += text(740, 35, 'Redis', { bold: true, color: C.red });
  out += `<path d="M110 55 V250 M790 55 V250" stroke="${C.line}" stroke-width="2"/>`;
  if (s === 0) {
    for (let i = 0; i < 3; i++) { out += arrow(125, 70 + i * 58, 775, 85 + i * 58, i === 0 ? 'GET a' : i === 1 ? 'GET b' : 'GET c'); out += arrow(775, 103 + i * 58, 125, 118 + i * 58, '', { color: C.green }); }
  } else if (s === 1) {
    out += arrow(125, 82, 775, 105, 'GET a · GET b · GET c');
    out += arrow(775, 181, 125, 207, 'a · b · c', { color: C.green });
    out += chip(323, 125, 300, L(lang, 'one network round trip', 'один сетевой обмен'), { code: false, color: C.blue });
  } else {
    out += arrow(125, 77, 775, 92, s === 3 ? 'SCAN 0 COUNT 100' : L(lang, 'slow command', 'долгая команда'));
    out += box(315, 123, 360, 88, s === 3 ? 'SCAN → cursor 84' : s === 5 ? 'INFO · SLOWLOG' : s === 4 ? L(lang, 'Large value / slow reader', 'Большой ответ / медленный клиент') : L(lang, 'Executor is busy', 'Исполнитель занят'), [L(lang, s === 3 ? 'more calls until cursor 0' : s === 5 ? 'measure before changing' : s === 4 ? 'output buffer grows' : 'other commands wait', s === 3 ? 'новые вызовы до курсора 0' : s === 5 ? 'измерить до изменений' : s === 4 ? 'растёт выходной буфер' : 'остальные команды ждут')], { active: true, size: 14, titleSize: 16 });
    out += arrow(775, 225, 125, 246, L(lang, 'reply', 'ответ'), { color: C.green });
  }
  return out + note(L(lang, s === 1 ? 'Pipelining saves network waits; commands still execute in order on the connection.' : s === 3 ? 'SCAN divides traversal into calls; a call can still take noticeable time.' : 'Latency includes both network time and work on the server.', s === 1 ? 'Pipeline убирает сетевые ожидания; команды соединения исполняются по порядку.' : s === 3 ? 'SCAN делит обход на вызовы; отдельный вызов тоже может занять время.' : 'Задержка включает и сеть, и работу на сервере.'));
}
function rdb(s, lang) {
  let out = text(165, 30, L(lang, 'Parent · live data', 'Родитель · рабочие данные'), { anchor: 'middle', bold: true });
  out += text(570, 30, L(lang, 'Child · snapshot', 'Потомок · снимок'), { anchor: 'middle', bold: true });
  for (let i = 0; i < 3; i++) {
    out += chip(55, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: ${i === 1 && s >= 2 ? 'Bob' : 'Alice'}`, { color: i === 1 && s >= 2 ? C.green : undefined });
    if (s >= 1) out += chip(460, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: Alice`, { color: C.blue });
    if (s >= 1 && (i !== 1 || s < 2)) out += arrow(290, 78 + i * 55, 445, 78 + i * 55, i === 1 ? L(lang, 'shared', 'общая') : '', { color: C.line });
  }
  if (s >= 2) out += text(365, 140, 'COW', { anchor: 'middle', color: C.green, bold: true });
  out += box(755, 89, 170, 105, 'dump.rdb', [s >= 4 ? 'Alice · Alice · Alice' : L(lang, 'writing…', 'запись…')], { active: s >= 4, code: true, size: 14 });
  if (s >= 2) out += arrow(695, 142, 740, 142, '', { color: C.blue });
  if (s === 5) out += chip(185, 230, 580, L(lang, 'Restart → restore the snapshot, not later writes', 'Перезапуск → снимок без более поздних записей'), { color: C.blue, code: false, size: 14 });
  return out + note(L(lang, s >= 2 ? 'After fork, a write copies the changed memory page; the child sees the old data.' : 'fork creates a snapshot view without eagerly copying every memory page.', s >= 2 ? 'После fork запись копирует изменяемую страницу; потомок видит старые данные.' : 'fork создаёт представление снимка без немедленного копирования всех страниц.'));
}
function aof(s, lang) {
  const layers = s >= 4 ? [L(lang, 'Current dataset', 'Текущие данные'), L(lang, 'New AOF files', 'Новые файлы AOF'), L(lang, 'Recovery', 'Восстановление')] : [L(lang, 'Redis RAM', 'RAM Redis'), L(lang, 'OS page cache', 'Кеш страниц ОС'), L(lang, 'Storage', 'Накопитель')];
  const body = s >= 4 ? [[L(lang, 'live data', 'рабочие данные'), L(lang, 'fork → new base', 'fork → новая основа')], [L(lang, 'base + incremental', 'основа + приращения'), 'manifest'], [s === 5 ? L(lang, 'load base → replay incr', 'основа → приращения') : L(lang, 'atomic file switch', 'смена файлов'), L(lang, 'current dataset', 'актуальные данные')]] : [[s === 3 ? '∅' : 'SET k v', L(lang, 'AOF buffer', 'буфер AOF')], [s === 3 ? '∅' : s >= 1 ? 'SET k v' : '∅', 'write()'], [s === 3 ? L(lang, 'last fsynced data', 'данные после fsync') : s >= 2 ? 'SET k v' : '∅', 'fsync()']];
  let out = layers.map((v, i) => box(45 + i * 315, 68, 240, 135, v, body[i], { active: i === Math.min(s, 2), code: true, size: 14 })).join('');
  out += arrow(298, 134, 345, 134, '', { color: s >= 1 ? C.red : C.line });
  out += arrow(613, 134, 660, 134, '', { color: s >= 2 ? C.red : C.line });
  out += chip(55, 231, 240, 'appendfsync always', { color: s === 2 ? C.blue : undefined, size: 14 });
  out += chip(360, 231, 240, 'appendfsync everysec', { color: s === 3 ? C.blue : undefined, size: 14 });
  out += chip(675, 231, 240, s >= 4 ? 'BGREWRITEAOF' : 'appendfsync no', { color: s >= 4 ? C.blue : undefined, size: 14 });
  const notes = [L(lang, 'The command changes memory and produces a record in the Redis AOF buffer.', 'Команда меняет память и создаёт запись в буфере AOF Redis.'), L(lang, 'write() hands bytes to the OS; they are not yet guaranteed on stable storage.', 'write() передаёт байты ОС; это ещё не гарантия устойчивого хранения.'), L(lang, 'The fsync policy chooses when Redis asks the OS to flush data.', 'Политика fsync определяет, когда Redis просит ОС сбросить данные.'), L(lang, 'Power loss discards RAM and unflushed OS cache; the fsynced prefix survives.', 'Потеря питания уничтожает RAM и несброшенный кеш ОС; остаётся префикс после fsync.'), L(lang, 'Rewrite produces a compact base while new writes go into an incremental file.', 'Rewrite создаёт компактную основу, а новые записи попадают в файл приращений.'), L(lang, 'The manifest identifies the base and incremental files to replay on startup.', 'Манифест определяет основу и файлы приращений для восстановления при запуске.')];
  return out + note(notes[s]);
}
function replication(s, lang) {
  const lag = s === 0;
  let out = server(165, 125, 'Primary', 'k = v · offset 120', true);
  out += server(785, 125, L(lang, 'Replica', 'Реплика'), lag ? 'k = ∅ · offset 100' : 'k = v · offset 120', !lag);
  out += arrow(235, 107, 715, 107, s === 2 ? L(lang, 'PSYNC → backlog 101…120', 'PSYNC → backlog 101…120') : s === 3 ? L(lang, 'FULLRESYNC → RDB + new writes', 'FULLRESYNC → RDB + новые записи') : 'SET k v · offset 120', { color: lag ? C.line : C.red, dashed: lag });
  out += arrow(715, 162, 235, 162, lag ? 'ACK 100' : 'ACK 120', { color: C.green });
  out += chip(270, 223, 420, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? L(lang, 'FULLRESYNC → snapshot + stream', 'FULLRESYNC → снимок + поток') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : L(lang, lag ? 'primary replied; replica is behind' : 'replica applies the command stream', lag ? 'primary ответил; реплика отстаёт' : 'реплика применяет поток команд'), { code: s >= 2, size: 14, color: C.blue });
  const notes = [L(lang, 'The primary can reply OK before a replica has applied the write.', 'Primary может вернуть OK до применения записи репликой.'), L(lang, 'Offsets track progress through the ordered replication stream.', 'Смещения показывают прогресс в упорядоченном потоке репликации.'), L(lang, 'A matching replication history and backlog permit partial synchronization.', 'Подходящая история и backlog позволяют частичную синхронизацию.'), L(lang, 'Without a usable backlog, a full sync sends the dataset and subsequent writes.', 'Без подходящего backlog полная синхронизация передаёт данные и новые записи.'), L(lang, 'WAIT counts replica acknowledgements; it does not turn Redis into Raft.', 'WAIT считает подтверждения реплик; он не превращает Redis в Raft.'), L(lang, 'WAITAOF waits for requested local and replica AOF fsync acknowledgements.', 'WAITAOF ждёт заданное число локальных и репличных подтверждений fsync AOF.')];
  return out + note(notes[s]);
}
function sentinel(s, lang) {
  let out = '';
  [180, 480, 780].forEach((x, i) => { out += `<circle cx="${x}" cy="56" r="30" fill="${C.pale}" stroke="${C.ink}" stroke-width="1.5"/>` + text(x, 61, `S${i + 1}`, { anchor: 'middle', size: 17, bold: true }); });
  out += text(480, 16, L(lang, s === 1 ? 'SDOWN · one observer suspects failure' : s === 2 ? 'ODOWN · configured quorum agrees' : 'Sentinel observers', s === 1 ? 'SDOWN · один наблюдатель видит сбой' : s === 2 ? 'ODOWN · кворум подтверждает сбой' : 'Наблюдатели Sentinel'), { anchor: 'middle', size: 15, color: C.muted });
  out += server(310, 180, L(lang, s >= 3 ? 'old primary' : 'Primary', s >= 3 ? 'бывший primary' : 'Primary'), s >= 1 ? L(lang, 'unreachable', 'недоступен') : 'k = v', false, s >= 1);
  out += server(665, 180, s >= 3 ? 'Primary' : L(lang, 'Replica', 'Реплика'), s >= 3 ? L(lang, 'promoted', 'повышена') : 'k = v', s >= 3);
  [180, 480, 780].forEach(x => { out += arrow(x, 95, 310 + (x - 480) * 0.1, 117, '', { color: s >= 1 ? C.muted : C.line, dashed: s >= 1 }); });
  if (s >= 3) out += arrow(530, 78, 665, 117, L(lang, 'failover', 'переключение'), { color: C.blue });
  return out + note(L(lang, s === 5 ? 'A promoted replica may not contain the primary’s most recent acknowledged write.' : 'Sentinels agree on failure and authorize a leader to coordinate promotion.', s === 5 ? 'Повышенная реплика может не содержать последнюю подтверждённую запись primary.' : 'Sentinel согласуют обнаружение сбоя; лидер координирует повышение реплики.'));
}
function cluster(s, lang) {
  const slot = s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182';
  let out = chip(200, 20, 560, slot, { color: C.green, size: 16 });
  out += `<circle cx="65" cy="65" r="24" fill="${C.green}" stroke="${C.ink}" stroke-width="1.5"/>` + text(65, 71, 'C', { anchor: 'middle', bold: true, color: C.white, size: 16 }) + text(65, 112, L(lang, 'Client', 'Клиент'), { anchor: 'middle', size: 14 });
  out += server(150, 170, 'A', '0 … 5460', s === 0);
  out += server(480, 170, 'B', '5461 … 10922', s === 4);
  out += server(810, 170, 'C', '10923 … 16383', s === 2 || s === 3);
  if (s === 0) out += text(480, 91, L(lang, '16384 slots', '16384 слота'), { anchor: 'middle', size: 17 });
  else if (s === 2) out += arrow(100, 65, 810, 110, 'GET key', { color: C.green });
  else if (s === 3) {
    out += arrow(130, 118, 88, 90, '', { color: C.red });
    out += text(215, 109, 'MOVED 12182 C', { size: 15, color: C.red });
    out += arrow(100, 65, 810, 110, L(lang, 'retry → C', 'повтор → C'), { color: C.green });
  } else if (s === 4) {
    out += arrow(100, 65, 480, 110, 'ASKING + GET key', { color: C.green });
    out += text(575, 100, L(lang, 'C → client: ASK 12182 B', 'C → клиент: ASK 12182 B'), { size: 15, color: C.red });
  } else out += text(480, 95, L(lang, 'same hash tag → same slot', 'одинаковый hash tag → один слот'), { anchor: 'middle', size: 16, color: C.green });
  return out + note(L(lang, s === 4 ? 'ASK redirects this request temporarily; the client sends ASKING to the target.' : s === 3 ? 'MOVED is a reply to the client, which updates its cached slot owner and retries.' : s === 5 ? 'Multi-key commands and scripts require the participating keys to share a slot.' : 'The client routes commands by slot, not by guessing which server holds the key.', s === 4 ? 'ASK временно перенаправляет запрос; клиент отправляет ASKING целевому серверу.' : s === 3 ? 'MOVED возвращается клиенту: он обновляет кеш владельца слота и повторяет запрос.' : s === 5 ? 'Ключи многоключевых команд и скриптов должны находиться в одном слоте.' : 'Клиент направляет команду по слоту, а не угадывает сервер с ключом.'));
}
function pubsub(s, lang) {
  let out = endpoint(5, 80, L(lang, 'Publisher', 'Издатель'), 'PUBLISH news hello', s >= 1);
  out += box(350, 98, 235, 90, s === 5 ? L(lang, 'shard: news', 'шард: news') : L(lang, 'channel: news', 'канал: news'), [s === 5 ? 'SPUBLISH / SSUBSCRIBE' : L(lang, 'live fan-out', 'живая рассылка')], { active: true, size: 15 });
  out += endpoint(745, 15, L(lang, 'Subscriber A', 'Подписчик A'), s >= 2 ? '"hello"' : 'SUBSCRIBE news', s >= 1, C.blue);
  out += endpoint(745, 167, L(lang, 'Subscriber B', 'Подписчик B'), s === 3 ? L(lang, 'disconnected', 'отключён') : s >= 4 ? L(lang, 'future messages only', 'только новые сообщения') : s >= 2 ? '"hello"' : 'SUBSCRIBE news', s !== 3, s === 3 ? C.muted : C.blue);
  out += arrow(215, 133, 335, 133, '', { color: C.green });
  out += arrow(600, 116, 755, 53, '', { color: C.blue });
  out += arrow(600, 169, 755, 205, s === 3 ? L(lang, 'missed', 'пропуск') : '', { color: s === 3 ? C.line : C.blue, dashed: s === 3 });
  return out + note(L(lang, s >= 3 ? 'A disconnected subscriber cannot replay this message: the channel stores no history.' : 'Only clients subscribed at delivery time receive a Pub/Sub message.', s >= 3 ? 'Отключённый подписчик не прочитает пропущенное: канал не хранит историю.' : 'Сообщение Pub/Sub получают клиенты, подписанные в момент доставки.'));
}
function streams(s, lang) {
  if (s === 5) {
    let out = chip(330, 25, 300, 'radix tree · rax', { active: true, color: C.red, size: 17 });
    out += arrow(420, 73, 245, 110, '1000-*', { color: C.blue });
    out += arrow(540, 73, 715, 110, '1001-*', { color: C.blue });
    out += box(80, 125, 330, 110, 'listpack', ['1000-0: job → A', '1000-1: job → B'], { code: true, size: 16 });
    out += box(550, 125, 330, 110, 'listpack', ['1001-0: job → C', L(lang, 'packed entries', 'плотно упакованные записи')], { code: true, size: 16 });
    return out + note(L(lang, 'A radix tree indexes entry-ID ranges; each leaf holds a listpack of entries.', 'Radix tree индексирует диапазоны ID; каждый лист хранит записи в listpack.'));
  }
  let out = text(30, 25, 'stream: jobs', { size: 17, bold: true });
  ['1000-0', '1000-1', '1001-0'].forEach((id, i) => { out += chip(30 + i * 220, 45, 195, `${id} · job:${i + 1}`, { color: i === 0 && s >= 1 ? C.red : undefined, size: 14 }); });
  out += box(710, 20, 225, 108, 'PEL', [s <= 1 || s === 3 ? '∅' : '1000-0 → A', L(lang, s <= 1 ? 'no group yet' : s === 3 ? 'acknowledged' : 'pending delivery', s <= 1 ? 'группы ещё нет' : s === 3 ? 'подтверждено' : 'ожидает ACK')], { active: s === 2 || s === 4, code: true, size: 14 });
  out += endpoint(30, 142, L(lang, 'Consumer A', 'Обработчик A'), s === 0 ? 'XADD jobs * job A' : s === 1 ? 'XREAD STREAMS jobs 0' : s === 3 ? 'XACK jobs g 1000-0' : s >= 4 ? L(lang, 'stopped before ACK', 'сбой до ACK') : 'XREADGROUP → 1000-0', s === 1 || s === 2);
  out += endpoint(570, 142, L(lang, 'Consumer B', 'Обработчик B'), s >= 4 ? 'XAUTOCLAIM → 1000-0' : 'XREADGROUP', s >= 4, C.blue);
  if (s >= 1) out += arrow(125, 94, 125, 127, '', { color: C.green });
  if (s >= 4) out += arrow(670, 127, 800, 142, L(lang, 'reclaim', 'забрать'), { color: C.blue });
  return out + note(L(lang, s === 4 ? 'Delivery can repeat. Make the business operation safe to retry.' : s === 3 ? 'XACK removes an entry from the pending list, not from the stream itself.' : s === 1 ? 'XREAD reads entries without removing them; every reader keeps its own position.' : 'The stream stores entries; a group separately tracks delivered, unacknowledged work.', s === 4 ? 'Доставка может повториться. Бизнес-операция должна безопасно повторяться.' : s === 3 ? 'XACK удаляет запись из списка ожидания, а не из самого Stream.' : s === 1 ? 'XREAD читает без удаления; каждый читатель хранит собственную позицию.' : 'Stream хранит записи; группа отдельно отслеживает доставленную работу без ACK.'));
}
function specialized(s, lang) {
  const items = [
    ['JSON', ['{ user: { age: 30 } }', L(lang, 'tree → path lookup', 'дерево → поиск по пути')]],
    [L(lang, 'Search', 'Поиск'), ['"redis" → doc:2, doc:7', L(lang, 'inverted index', 'инвертированный индекс')]],
    [L(lang, 'Vectors', 'Векторы'), [L(lang, '[0.2, 0.8] → neighbors', '[0.2, 0.8] → соседи'), 'HNSW / FLAT']],
    [L(lang, 'Time series', 'Ряды времени'), ['t1: 24 · t2: 25 · t3: 24', L(lang, 'chunks + aggregation', 'чанки и агрегация')]],
    [L(lang, 'Bits / Geo', 'Биты / Гео'), ['10100100 · geohash', 'String / Sorted Set']],
    [L(lang, 'Probabilistic', 'Вероятностные'), ['HyperLogLog · Bloom', L(lang, 'less memory, bounded error', 'меньше памяти, есть погрешность')]]
  ];
  let out = '';
  items.forEach(([name, body], i) => { out += box(25 + i % 3 * 312, 26 + Math.floor(i / 3) * 127, 290, 108, name, body, { active: s === i, size: 14, titleSize: 17 }); });
  return out + note(L(lang, 'Choose the structure for the operation; each index trades memory for a particular query.', 'Структуру выбирают под операции: каждый индекс меняет расход памяти и возможности поиска.'));
}
const renderers = { 'first-key': firstKey, request, 'event-loop': eventLoop, dictionary, encodings, atomicity, transactions, scripting, blocking, locks, expiry, memory, latency, rdb, aof, replication, sentinel, cluster, pubsub, streams, specialized };
/** Render one of the 21 bilingual chapter diagrams. Values outside the story range are clamped. */
export function storyScene(id, step, lang = 'en', compact = false) {
  const locale = lang === 'ru' ? 'ru' : 'en';
  const s = Math.max(0, Math.min(5, Math.trunc(Number(step) || 0)));
  const title = (titles[id] || titles['first-key'])[locale === 'ru' ? 1 : 0];
  const description = L(locale, `${compact ? "Compact diagram. " : ""}Educational simulation, step ${s + 1} of 6. ${title}.`, `${compact ? "Компактная схема. " : ""}Учебная симуляция, шаг ${s + 1} из 6. ${title}.`);
  const markers = [C.red, C.green, C.blue, C.muted, C.line].map(color => `<marker id="scene-arrow-${color.replace('#', '')}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8" fill="${color}"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${compact ? '0 0 420 360' : '0 0 960 310'}" role="img" aria-label="${E(title)}. ${E(description)}" focusable="false"><title>${E(title)}</title><desc>${E(description)}</desc><defs>${markers}</defs>${compact ? compactScene(id, s, locale) : (renderers[id] || firstKey)(s, locale)}</svg>`;
}

// Compact diagrams are composed at their native width rather than scaled down.
// They focus on the current mechanism; the full desktop view remains available.
function mCircle(x, y, mark, label = '', opt = {}) {
  const r = opt.r || 29;
  return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${opt.color || C.red}" stroke="${C.ink}" stroke-width="${opt.active ? 3 : 1.5}"/>${text(x, y + 6, mark, { anchor: 'middle', size: opt.size || 17, bold: true, color: C.white })}${label ? text(x, y + r + 24, label, { anchor: 'middle', size: 14 }) : ''}${opt.failed ? `<path d="M${x-r+8} ${y-r+8} L${x+r-8} ${y+r-8} M${x+r-8} ${y-r+8} L${x-r+8} ${y+r-8}" stroke="#b44c34" stroke-width="3"/>` : ''}</g>`;
}
function mCell(x, y, w, label, opt = {}) {
  const h = opt.h || 32;
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${opt.fill || C.pale}" stroke="${opt.color || C.line}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + h / 2 + 5, label, { anchor: 'middle', size: opt.size || 14, color: opt.color || C.ink, code: true, bold: opt.active })}</g>`;
}
function mNote(label) {
  const lines = [''];
  for (const word of String(label).split(' ')) { const i = lines.length - 1; if ((lines[i] + ' ' + word).trim().length > 43 && lines[i]) lines.push(word); else lines[i] += (lines[i] ? ' ' : '') + word; }
  return text(210, lines.length > 1 ? 320 : 338, lines, { size: 14, leading: 19, anchor: 'middle', color: C.muted });
}
function compactScene(id, s, lang) {
  const t = (en, ru) => L(lang, en, ru);
  let out = '';
  switch (id) {
    case 'first-key': {
      const cmd = s === 4 ? 'GET user:1' : s === 5 ? 'SET user:1 Bob · DEL user:1' : 'SET user:1 Alice';
      out += mCell(25, 16, 370, cmd, { active: true });
      out += mCircle(75, 112, 'C', t('Client', 'Клиент'), { color: C.green, r: 33 });
      out += mCircle(345, 112, 'R', 'Redis', { r: 33, active: s === 2 });
      out += arrow(121, 91, 299, 91, '', { color: s === 0 ? C.line : C.red, dashed: s === 0 });
      out += arrow(299, 132, 121, 132, s >= 3 ? s === 4 ? '"Alice"' : s === 5 ? '+OK · :1' : '+OK' : '', { color: s >= 3 ? C.green : C.line, dashed: s < 3 });
      out += box(40, 216, 340, 76, 'RAM', [s < 2 ? 'user:1 → ∅' : s === 5 ? 'user:1 → ∅' : 'user:1 → "Alice"'], { active: s === 2, size: 16, titleSize: 16, code: true });
      return out + mNote(t(s === 1 ? 'Locate the key in the key dictionary.' : s === 5 ? 'DEL removes the named entry.' : 'The key points to a value in memory.', s === 1 ? 'Найти ключ в словаре ключей.' : s === 5 ? 'DEL удаляет запись по этому имени.' : 'Ключ указывает на значение в памяти.'));
    }
    case 'request': {
      const fragment = s === 2 ? '*3 · SET · user:1 · Ali…' : s >= 3 ? 'SET · user:1 · Alice' : t('TCP byte stream', 'Поток байтов TCP');
      out += box(40, 18, 340, 70, 'TCP', [fragment], { active: s === 0, size: 14, titleSize: 16, code: true });
      out += arrow(210, 96, 210, 108, '', { color: C.blue });
      out += box(40, 118, 340, 70, t('Input buffer', 'Входной буфер'), [s === 2 ? t('incomplete → keep bytes', 'неполная команда → ждать') : s >= 3 ? t('3 complete arguments', '3 полных аргумента') : '*3 · $3 · SET · …'], { active: s >= 1 && s <= 3, size: 14, titleSize: 16, code: true });
      out += arrow(210, 196, 210, 208, '', { color: C.blue });
      out += box(40, 218, 340, 70, s === 5 ? t('Output buffer', 'Выходной буфер') : s === 4 ? t('Command checks', 'Проверки команды') : t('RESP parser', 'Разбор RESP'), [s === 5 ? '+OK\\r\\n' : s === 4 ? t('arity · ACL · type', 'аргументы · ACL · тип') : s < 3 ? t('need complete arguments', 'нужны полные аргументы') : 'SET user:1 Alice'], { active: s >= 4, size: 14, titleSize: 16, code: true });
      return out + mNote(t(s === 2 ? 'Incomplete commands do not execute.' : 'TCP chunks are not RESP boundaries.', s === 2 ? 'Неполная команда пока не исполняется.' : 'Границы TCP и RESP различаются.'));
    }
    case 'event-loop': {
      ['A', 'B', 'C'].forEach((name, i) => { out += mCircle(70 + i * 140, 43, name, ['SET', 'GET', 'PING'][i], { color: C.green, active: s === i + 2 }); out += arrow(70 + i * 140, 115, 70 + i * 140, 139, '', { color: s === 5 && i === 2 ? C.muted : s === 0 ? C.line : C.green, dashed: s === 5 && i === 2 }); });
      out += box(35, 151, 350, 91, 'Redis · event loop', [s === 2 ? 'A: SET k v' : s === 3 ? 'B: GET k → "v"' : s === 5 ? t('slow command · C waits', 'долгая команда · C ждёт') : t('poll → execute one command', 'poll → исполнить одну команду')], { active: true, size: 14, titleSize: 16, code: true });
      out += text(210, 279, s === 4 ? [t('I/O threads · network', 'I/O threads · сеть'), t('background · fsync / lazyfree', 'фон · fsync / lazyfree')] : [t('one ordinary command at a time', 'обычные команды идут по одной')], { anchor: 'middle', size: 14, leading: 20 });
      return out + mNote(t(s === 5 ? 'Long execution delays other commands.' : 'Ready sockets share one executor.', s === 5 ? 'Долгое исполнение задерживает команды.' : 'Готовые сокеты делят исполнитель.'));
    }
    case 'dictionary': {
      out += mCell(25, 15, 370, t('hash(user:1) → bucket 2', 'хеш(user:1) → ячейка 2'), { active: s <= 1 });
      out += text(95, 86, t('old · 4', 'старая · 4'), { anchor: 'middle', size: 14, bold: true });
      ['0 ∅', '1 ∅', s === 5 ? '2 ∅' : '2 user:2 → user:1', '3 c'].forEach((v, i) => { out += mCell(16, 101 + i * 34, 164, v, { active: i === 2 && s >= 1 && s <= 3, color: i === 2 && s >= 1 && s <= 3 ? C.red : undefined }); });
      if (s >= 4) {
        out += text(315, 73, t('new · 8', 'новая · 8'), { anchor: 'middle', size: 14, bold: true });
        Array.from({ length: 8 }, (_, i) => `${i} ${s === 5 && i === 2 ? 'user:2' : s === 5 && i === 6 ? 'user:1' : '∅'}`).forEach((v, i) => { out += mCell(235, 85 + i * 27, 169, v, { h: 25, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
        out += arrow(188, 182, 225, 182, '', { color: C.blue });
      } else {
        out += text(300, 130, s >= 2 ? ['user:2 ≠ user:1', '↓', 'user:1 = user:1', '↓', '"Alice"'] : [t('select bucket', 'выбрать ячейку'), '↓', '2'], { size: 14, leading: 26, anchor: 'middle' });
        out += arrow(188, 182, 215, 182, '', { color: C.blue });
      }
      return out + mNote(t(s >= 4 ? 'Rehash keeps both tables during transfer.' : 'A collision needs a full key comparison.', s >= 4 ? 'При rehash работают обе таблицы.' : 'При коллизии сравнивают полные ключи.'));
    }
    case 'encodings': {
      const names = ['String', 'List', 'Set', 'Hash', 'Sorted Set', t('Encoding growth', 'Смена представления')];
      out += text(210, 28, names[s], { anchor: 'middle', size: 18, bold: true });
      if (s === 0) {
        out += mCell(45, 75, 330, '"42" → int');
        out += mCell(45, 125, 330, '"hello" → SDS');
        out += mCell(45, 185, 330, 'len: 5 · alloc: 5');
        out += mCell(45, 235, 330, 'h | e | l | l | o', { active: true });
      } else if (s === 1) {
        out += text(210, 78, 'quicklist', { anchor: 'middle', size: 16 });
        out += box(30, 115, 160, 97, 'listpack', ['A | B | C'], { size: 14, titleSize: 16, code: true });
        out += box(230, 115, 160, 97, 'listpack', ['D | E | F'], { size: 14, titleSize: 16, code: true });
        out += arrow(197, 161, 222, 161, '', { color: C.blue });
        out += text(210, 268, t('linked compact blocks', 'связанные компактные блоки'), { anchor: 'middle', size: 14 });
      } else {
        const compact = s === 2 ? ['intset / listpack', '[ 2, 5, 8, 13 ]'] : s === 3 ? ['listpack', 'name | Alice | age | 30'] : s === 4 ? ['listpack', 'Alice: 10 | Bob: 20'] : ['listpack / intset', t('compact entries', 'плотные записи')];
        const expanded = s === 2 ? ['hashtable', '"apple" → ∅'] : s === 3 ? ['hashtable', 'name → "Alice"'] : s === 4 ? ['skiplist + hashtable', '10 → 20 → 35'] : ['hashtable / skiplist', t('more entries / larger values', 'больше записей / крупнее значения')];
        out += box(40, 67, 340, 84, compact[0], [compact[1]], { size: 14, titleSize: 16, code: true });
        out += arrow(210, 163, 210, 191, '', { color: C.blue });
        out += box(40, 203, 340, 84, expanded[0], [expanded[1]], { active: true, size: 14, titleSize: 16, code: true });
      }
      return out + mNote(t('One data type can use different encodings.', 'У одного типа бывают разные упаковки.'));
    }
    case 'atomicity': {
      const incr = s >= 4;
      out += mCircle(95, 39, 'A', '', { color: C.green });
      out += mCircle(325, 39, 'B', '', { color: C.blue });
      const a = incr ? ['INCR count → 1', '', ''] : [s >= 1 ? 'GET → 0' : '—', s >= 2 ? 'SET count 1' : '—', '—'];
      const b = incr ? ['—', s === 5 ? 'INCR count → 2' : '—', ''] : [s >= 1 ? 'GET → 0' : '—', '—', s >= 3 ? 'SET count 1' : '—'];
      a.forEach((v, i) => { if (v) out += mCell(15, 92 + i * 48, 180, v, { color: C.green }); });
      b.forEach((v, i) => { if (v) out += mCell(225, 92 + i * 48, 180, v, { color: C.blue }); });
      out += mCell(95, 258, 230, `count = ${s <= 1 ? 0 : s === 5 ? 2 : 1}`, { active: true, color: C.red, size: 18, h: 42 });
      return out + mNote(t(s === 3 ? 'Two writes of 1 lose one update.' : incr ? 'INCR reads and writes atomically.' : 'Time flows from top to bottom.', s === 3 ? 'Две записи числа 1 теряют обновление.' : incr ? 'INCR читает и записывает атомарно.' : 'Время идёт сверху вниз.'));
    }
    case 'transactions': {
      if (s === 2 || s === 3) {
        out += mCircle(80, 40, 'A', 'WATCH balance', { color: C.green });
        out += mCircle(340, 40, 'B', s === 3 ? 'SET balance 200' : '—', { color: C.blue });
        out += mCell(35, 133, 350, s === 3 ? 'balance = 200 · v2' : 'balance = 100 · v1', { active: true });
        out += arrow(210, 177, 210, 206, '', { color: C.blue });
        out += mCell(35, 220, 350, s === 3 ? 'EXEC → (nil)' : 'GET balance → "100"', { color: s === 3 ? '#b44c34' : C.green });
      } else {
        out += text(210, 29, s === 0 ? t('MULTI → queue', 'MULTI → очередь') : 'EXEC', { anchor: 'middle', size: 18, bold: true });
        out += mCell(35, 76, 350, 'SET balance 100', { color: s === 1 || s === 4 ? C.green : undefined });
        out += mCell(35, 127, 350, s === 4 ? 'LPUSH balance x → WRONGTYPE' : s === 5 ? 'SET only-key → ERR' : 'INCR balance', { color: s >= 4 ? '#b44c34' : undefined });
        out += arrow(210, 173, 210, 205, '', { color: C.blue });
        out += mCell(35, 220, 350, s === 0 ? 'QUEUED' : s === 5 ? t('EXECABORT · no writes', 'EXECABORT · без записей') : s === 4 ? 'balance = "100"' : 'balance = "101"', { active: true });
      }
      return out + mNote(t(s === 4 ? 'A runtime error does not roll back SET.' : s === 5 ? 'Queue-time errors abort execution.' : s === 3 ? 'A changed watched key cancels EXEC.' : 'EXEC runs queued commands together.', s === 4 ? 'Ошибка исполнения не откатывает SET.' : s === 5 ? 'Ошибка в очереди отменяет исполнение.' : s === 3 ? 'Изменённый ключ отменяет EXEC.' : 'EXEC исполняет очередь вместе.'));
    }
    case 'scripting': {
      out += mCircle(65, 35, 'A', s === 4 ? 'FCALL' : s === 3 ? 'EVALSHA' : 'EVAL', { color: C.green, r: 24 });
      out += mCircle(355, 35, 'B', t('waits', 'ждёт'), { color: C.muted, r: 24 });
      const lines = s === 3 ? ['EVAL → SHA1', t('EVALSHA → cached script', 'EVALSHA → кеш скрипта'), t('NOSCRIPT → load again', 'NOSCRIPT → загрузить заново')] : s === 4 ? ['FUNCTION LOAD', 'FCALL update 1 count', 'INCR + EXPIRE'] : ['INCR count', 'EXPIRE count 60', s === 2 ? 'error("oops")' : s === 5 ? t('long loop …', 'долгий цикл …') : 'return count'];
      out += text(210, 107, 'Redis · executor', { anchor: 'middle', size: 16, bold: true });
      lines.forEach((v, i) => { out += mCell(35, 132 + i * 48, 350, v, { active: i === (s === 1 ? 1 : s === 2 || s === 5 ? 2 : 0), color: s === 2 && i === 2 ? '#b44c34' : undefined }); });
      return out + mNote(t(s === 2 ? 'Earlier writes survive a script error.' : s === 5 ? 'The long loop keeps other commands waiting.' : s === 3 ? 'The cache may be missing: handle NOSCRIPT.' : 'Another client cannot interleave commands.', s === 2 ? 'Ранние записи остаются после ошибки.' : s === 5 ? 'Долгий цикл задерживает другие команды.' : s === 3 ? 'Кеш может исчезнуть: обработать NOSCRIPT.' : 'Другой клиент не вклинит свои команды.'));
    }
    case 'blocking': {
      out += mCircle(70, 39, 'A', s === 3 ? 'BLPOP jobs 2' : 'BLPOP jobs 0', { color: C.green });
      out += mCircle(350, 39, 'B', s === 2 ? 'RPUSH jobs x' : s === 4 ? 'BLPOP jobs 0' : 'GET other', { color: C.blue, active: s === 1 });
      out += text(210, 135, 'Redis · jobs', { anchor: 'middle', bold: true, size: 17 });
      out += mCell(60, 164, 300, s === 2 ? '[ "x" ] → A' : '[ ]', { active: s === 2, size: 18, h: 44 });
      out += mCell(25, 254, 370, s === 2 ? t('A resumes with "x"', 'A получает "x"') : s === 3 ? t('timeout → (nil)', 'таймаут → (nil)') : s === 4 ? t('waiters: A → B', 'ожидают: A → B') : s === 5 ? t('A crashed after pop · jobs = [ ]', 'A упал после pop · jobs = [ ]') : t('A is parked · executor is free', 'A ждёт · исполнитель свободен'), { color: s === 2 ? C.green : C.muted });
      if (s === 1) out += text(210, 232, 'B: GET other → \"v\"', { anchor: 'middle', size: 14, color: C.blue });
      if (s === 2) out += arrow(350, 111, 350, 150, '', { color: C.blue });
      return out + mNote(t(s === 5 ? 'A list pop has no acknowledgement step.' : 'Waiting for a list parks only that client.', s === 5 ? 'У pop из списка нет шага подтверждения.' : 'Ожидание списка паркует только клиента.'));
    }
    case 'locks': {
      out += mCircle(75, 42, 'A', s >= 3 ? t('old token-A', 'старый token-A') : 'token-A', { color: C.green });
      out += mCircle(345, 42, 'B', 'token-B', { color: C.blue });
      out += mCell(45, 142, 330, `lock → ${s < 2 ? 'token-A' : 'token-B'}`, { active: true, size: 17, h: 42 });
      out += text(210, 222, s === 1 ? 'SET … NX → (nil)' : s === 4 ? t('token-A ≠ token-B → keep lock', 'token-A ≠ token-B → не удалять') : s === 5 ? t('external fence: reject old token', 'внешний fence: старый номер отклонён') : s >= 2 ? t('A expired · B acquired the lease', 'срок A истёк · аренда у B') : 'SET lock token-A NX PX 5000', { anchor: 'middle', size: 14 });
      out += `<path d="M30 270 H390" stroke="${C.line}" stroke-width="3"/>`;
      out += mCell(30, 253, 170, t('token-A: 0…5s', 'token-A: 0…5с'), { color: s < 2 ? C.green : C.muted });
      if (s >= 2) out += mCell(220, 253, 170, t('token-B: 5…10s', 'token-B: 5…10с'), { color: C.blue });
      return out + mNote(t(s >= 3 ? 'An expired client can wake up later.' : 'NX grants a time-limited lease.', s >= 3 ? 'Старый клиент может проснуться позже.' : 'NX выдаёт аренду на ограниченный срок.'));
    }
    case 'expiry': {
      const gone = s === 2 || s === 3 || s === 5;
      out += mCircle(210, 35, 'T', s === 0 ? '10:00:02' : '10:00:06', { color: C.blue, r: 25 });
      out += text(25, 119, t('Key dictionary', 'Словарь ключей'), { size: 14, bold: true });
      out += mCell(25, 132, 370, gone ? 'session → ∅' : 'session → "abc"', { active: gone });
      out += text(25, 205, t('Expiry dictionary', 'Словарь сроков'), { size: 14, bold: true });
      out += mCell(25, 218, 370, gone || s === 4 ? 'session → ∅' : 'session → 10:00:05', { color: s === 1 ? '#b44c34' : C.blue });
      out += text(210, 286, s === 1 ? 'GET → (nil)' : s === 2 ? t('GET → lazy expiry', 'GET → ленивое удаление') : s === 3 ? t('active expiry → DEL', 'активная очистка → DEL') : s === 4 ? 'SET session abc → TTL -1' : s === 5 ? t('Primary → DEL → replica', 'Primary → DEL → реплика') : 'SET session abc EX 5', { size: 14, anchor: 'middle' });
      return out + mNote(t(s === 1 ? 'Logically absent; bytes may remain.' : s === 4 ? 'Plain SET removes the old TTL.' : 'Access and active expiry remove old keys.', s === 1 ? 'Ключ недоступен; байты ещё могут быть.' : s === 4 ? 'Обычный SET снимает прежний TTL.' : 'Ключи убирают при чтении и очистке.'));
    }
    case 'memory': {
      out += text(25, 28, 'maxmemory', { size: 17, bold: true });
      out += `<rect x="25" y="50" width="370" height="39" rx="3" fill="${C.pale}" stroke="${C.ink}"/>`;
      [130, 110, s === 0 ? 75 : 130].forEach((w, i) => { out += `<rect x="${25 + [0, 130, 240][i]}" y="50" width="${w}" height="39" fill="${[C.red, C.green, C.blue][i]}"/>`; });
      ['hot:key', 'old:key', 'rare:key'].forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += mCell(25 + i * 127, 135, 116, gone ? `${v} → ∅` : v, { color: gone ? '#b44c34' : undefined }); });
      out += mCell(25, 212, 370, s === 1 ? 'allkeys-lru → old:key' : s === 2 ? 'allkeys-lfu → rare:key' : s === 3 ? t('noeviction → OOM error', 'noeviction → ошибка OOM') : s === 4 ? t('RSS = data + overhead + fragmentation', 'RSS = данные + расходы + фрагментация') : s === 5 ? 'DEL / UNLINK' : t('space for data is bounded', 'объём памяти для данных ограничен'), { active: true });
      if (s === 5) out += text(210, 284, [t('DEL: remove + free', 'DEL: удалить + освободить'), t('UNLINK: remove → lazyfree', 'UNLINK: удалить → lazyfree')], { size: 14, anchor: 'middle', leading: 20 });
      return out + mNote(t(s === 5 ? 'UNLINK defers memory reclamation.' : 'Eviction uses approximate candidates.', s === 5 ? 'UNLINK откладывает освобождение памяти.' : 'Кандидат вытеснения выбирается примерно.'));
    }
    case 'latency': {
      out += text(40, 28, t('Client', 'Клиент'), { size: 14, color: C.green });
      out += text(380, 28, 'Redis', { size: 14, anchor: 'end', color: C.red });
      out += `<path d="M40 45 V282 M380 45 V282" stroke="${C.line}" stroke-width="2"/>`;
      if (s === 0) {
        for (let i = 0; i < 3; i++) { out += arrow(50, 60 + i * 69, 370, 82 + i * 69, `GET ${['a', 'b', 'c'][i]}`); out += arrow(370, 98 + i * 69, 50, 119 + i * 69, '', { color: C.green }); }
      } else if (s === 1) {
        out += arrow(50, 66, 370, 93, 'GET a · GET b · GET c');
        out += mCell(80, 142, 260, t('one round trip', 'один сетевой обмен'), { color: C.blue });
        out += arrow(370, 225, 50, 256, 'a · b · c', { color: C.green });
      } else {
        out += arrow(50, 67, 370, 93, s === 3 ? 'SCAN 0 COUNT 100' : s === 4 ? 'GET big:value' : s === 5 ? 'SLOWLOG GET' : 'EVAL …');
        out += box(75, 137, 270, 92, s === 3 ? t('cursor → 84 → … → 0', 'курсор → 84 → … → 0') : s === 4 ? t('Output buffer', 'Выходной буфер') : s === 5 ? 'INFO · SLOWLOG' : t('Executor busy', 'Исполнитель занят'), [s === 4 ? t('[reply][reply][reply]', '[ответ][ответ][ответ]') : s === 3 ? t('repeat cursor calls', 'повторять с курсором') : s === 5 ? t('measure the delay', 'измерить задержку') : t('short commands wait', 'короткие команды ждут')], { size: 14, titleSize: 14, active: true, code: true });
        out += arrow(370, 253, 50, 275, t('reply', 'ответ'), { color: C.green });
      }
      return out + mNote(t(s === 1 ? 'Pipelining saves network waits.' : 'Network and execution both take time.', s === 1 ? 'Pipeline сокращает сетевые ожидания.' : 'И сеть, и исполнение занимают время.'));
    }
    case 'rdb': {
      out += text(95, 25, t('Parent', 'Родитель'), { size: 16, anchor: 'middle', bold: true });
      out += text(325, 25, t('Child', 'Потомок'), { size: 16, anchor: 'middle', bold: true });
      for (let i = 0; i < 3; i++) {
        out += mCell(20, 65 + i * 55, 150, `${i + 1}: ${i === 1 && s >= 2 ? 'Bob' : 'Alice'}`, { color: i === 1 && s >= 2 ? C.green : undefined });
        if (s >= 1) out += mCell(250, 65 + i * 55, 150, `${i + 1}: Alice`, { color: C.blue });
        if (s >= 1 && (s < 2 || i !== 1)) out += arrow(182, 81 + i * 55, 238, 81 + i * 55, '', { color: C.line });
      }
      if (s >= 2) out += text(210, 142, 'COW', { size: 14, anchor: 'middle', color: C.green });
      out += mCell(65, 250, 290, s === 5 ? t('restart → user:1 = Alice', 'перезапуск → user:1 = Alice') : s === 3 ? t('dump.rdb → writing Alice', 'dump.rdb → запись Alice') : s === 4 ? t('dump.rdb → complete: Alice', 'dump.rdb → готово: Alice') : s === 0 ? 'RAM: user:1 = Alice' : t('fork → shared pages', 'fork → общие страницы'), { active: s >= 3 });
      return out + mNote(t(s === 5 ? 'Writes after the snapshot are absent.' : 'A write copies only changed pages.', s === 5 ? 'Записей после снимка здесь нет.' : 'Запись копирует изменяемые страницы.'));
    }
    case 'aof': {
      const titles = s >= 4 ? [t('Current data', 'Текущие данные'), t('AOF files', 'Файлы AOF'), t('Recovery', 'Восстановление')] : ['Redis RAM', t('OS page cache', 'Кеш страниц ОС'), t('Storage', 'Накопитель')];
      const rows = s >= 4 ? [t('fork → new base', 'fork → новая основа'), t('base + incremental + manifest', 'основа + приращения + манифест'), s === 5 ? t('load base → replay incremental', 'основа → проиграть приращения') : t('switch file set', 'сменить набор файлов')] : [s === 3 ? '∅' : t('SET k v · AOF buffer', 'SET k v · буфер AOF'), s === 3 ? '∅' : s >= 1 ? 'write() → SET k v' : '∅', s === 3 ? t('last fsynced prefix', 'префикс после fsync') : s >= 2 ? 'fsync() → SET k v' : '∅'];
      titles.forEach((name, i) => { out += box(40, 16 + i * 100, 340, 73, name, [rows[i]], { size: 14, titleSize: 16, active: i === Math.min(s, 2), code: true }); if (i < 2) out += arrow(210, 96 + i * 100, 210, 107 + i * 100, '', { color: C.blue }); });
      return out + mNote(t(s === 3 ? 'Power loss discards RAM and OS cache.' : s >= 4 ? 'The manifest selects files for recovery.' : 'write() and fsync() are separate steps.', s === 3 ? 'Без питания исчезнут RAM и кеш ОС.' : s >= 4 ? 'Манифест выбирает файлы восстановления.' : 'write() и fsync() — разные шаги.'));
    }
    case 'replication': {
      out += mCircle(75, 75, 'P', 'Primary', { r: 31 });
      out += mCircle(345, 75, 'R', t('Replica', 'Реплика'), { r: 31 });
      out += arrow(121, 56, 299, 56, s === 2 ? 'PSYNC' : s === 3 ? t('RDB + stream', 'RDB + поток') : 'SET k v', { color: s === 0 ? C.line : C.red, dashed: s === 0 });
      out += arrow(299, 96, 121, 96, s === 0 ? 'ACK 100' : 'ACK 120', { color: C.green });
      out += text(75, 174, ['k = v', t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += text(345, 174, [s === 0 ? 'k = ∅' : 'k = v', s === 0 ? t('offset 100', 'смещение 100') : t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += mCell(25, 245, 370, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? t('FULLRESYNC → RDB + suffix', 'FULLRESYNC → RDB + приращения') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : s === 0 ? t('primary OK · replica is behind', 'primary OK · реплика отстаёт') : t('replica applies offset 120', 'реплика применила смещение 120'), { active: true });
      return out + mNote(t(s === 5 ? 'WAITAOF waits for AOF fsync acknowledgements.' : 'An acknowledgement is not Raft consensus.', s === 5 ? 'WAITAOF ждёт подтверждений fsync AOF.' : 'Подтверждение — ещё не консенсус Raft.'));
    }
    case 'sentinel': {
      out += text(210, 20, s === 1 ? 'SDOWN' : s === 2 ? t('ODOWN · quorum', 'ODOWN · кворум') : s >= 3 ? t('election → failover', 'выборы → переключение') : 'Sentinel', { size: 16, anchor: 'middle', bold: true });
      [70, 210, 350].forEach((x, i) => { out += mCircle(x, 72, `S${i + 1}`, '', { r: 23, color: s >= 2 || s === 1 && i === 0 ? C.blue : C.muted, size: 14 }); out += arrow(x, 107, 110, 157, '', { color: C.line, dashed: s >= 1 }); });
      out += mCircle(110, 209, 'P', s >= 3 ? t('old primary', 'старый primary') : 'Primary', { r: 35, failed: s >= 1 });
      out += mCircle(310, 209, s >= 3 ? 'P' : 'R', s >= 3 ? 'Primary' : t('Replica', 'Реплика'), { r: 35, active: s >= 3 });
      if (s >= 3) out += arrow(160, 209, 260, 209, '', { color: C.blue });
      out += text(210, 294, s === 5 ? t('new primary may miss recent writes', 'новый primary может потерять записи') : s === 4 ? t('client reconnects to new primary', 'клиент подключается к новому primary') : s >= 3 ? t('replica is promoted', 'реплика повышена') : t('independent failure observations', 'независимые наблюдения за сбоем'), { anchor: 'middle', size: 14 });
      return out + mNote(t('Quorum detection and election are separate.', 'Кворум обнаружения и выборы различаются.'));
    }
    case 'cluster': {
      out += mCell(25, 13, 370, s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182');
      out += mCircle(210, 88, 'C', t('Client', 'Клиент'), { color: C.green, r: 24 });
      const target = s === 4 ? 1 : s === 2 || s === 3 ? 2 : -1;
      ['A', 'B', 'C'].forEach((name, i) => { out += mCircle(70 + i * 140, 224, name, ['0…5460', '5461…10922', '10923…16383'][i], { r: 29, active: i === target, size: 17 }); });
      if (target >= 0) out += arrow(210, 150, 70 + target * 140, 180, '', { color: C.green });
      if (s === 3) out += arrow(92, 182, 180, 150, '', { color: C.red });
      out += text(210, 294, s === 3 ? t('A → client: MOVED 12182 C', 'A → клиент: MOVED 12182 C') : s === 4 ? t('C → client: ASK 12182 B', 'C → клиент: ASK 12182 B') : s === 5 ? t('multi-key → same slot required', 'много ключей → нужен один слот') : s === 1 ? t('same tag → same slot', 'один hash tag → один слот') : s === 2 ? t('client routes directly to C', 'клиент обращается сразу к C') : t('16384 slots', '16384 слота'), { size: 14, anchor: 'middle' });
      return out + mNote(t(s === 4 ? 'Client retries with ASKING on B.' : s === 3 ? 'Client updates its map and retries on C.' : 'Slot ownership tells the client where to go.', s === 4 ? 'Клиент повторяет с ASKING на B.' : s === 3 ? 'Клиент меняет карту и повторяет на C.' : 'Владелец слота задаёт маршрут клиента.'));
    }
    case 'pubsub': {
      out += mCircle(210, 40, 'P', 'PUBLISH news hello', { color: C.green, r: 25, active: s === 1 });
      out += arrow(210, 108, 210, 123, '', { color: s === 0 ? C.line : C.green, dashed: s === 0 });
      out += mCell(105, 137, 210, s === 5 ? t('shard: news', 'шард: news') : t('channel: news', 'канал: news'), { active: true, h: 40 });
      out += arrow(155, 189, 100, 214, '', { color: C.blue });
      out += arrow(265, 189, 320, 214, '', { color: s === 3 ? C.line : C.blue, dashed: s === 3 });
      out += mCircle(100, 252, 'A', s >= 2 ? '"hello"' : 'SUBSCRIBE', { color: C.blue });
      out += mCircle(320, 252, 'B', s === 3 ? t('offline', 'отключён') : s >= 4 ? t('new only', 'только новое') : s >= 2 ? '"hello"' : 'SUBSCRIBE', { color: s === 3 ? C.muted : C.blue, failed: s === 3 });
      return out + mNote(t(s === 5 ? 'SPUBLISH limits delivery to a shard.' : s >= 3 ? 'No stored history to replay on reconnect.' : 'Messages go to current subscribers.', s === 5 ? 'SPUBLISH ограничивает доставку шардом.' : s >= 3 ? 'После подключения нет истории пропусков.' : 'Сообщения идут текущим подписчикам.'));
    }
    case 'streams': {
      if (s === 5) {
        out += mCell(100, 35, 220, 'radix tree · rax', { active: true });
        out += arrow(170, 82, 110, 123, '1000-*', { color: C.blue });
        out += arrow(250, 82, 310, 123, '1001-*', { color: C.blue });
        out += box(20, 145, 180, 102, 'listpack', ['1000-0', 'job → A'], { size: 14, titleSize: 16, code: true });
        out += box(220, 145, 180, 102, 'listpack', ['1001-0', 'job → B'], { size: 14, titleSize: 16, code: true });
        return out + mNote(t('ID ranges lead to compact entry blocks.', 'Диапазоны ID ведут к компактным блокам.'));
      }
      out += text(25, 25, 'stream: jobs', { size: 16, bold: true });
      out += mCell(25, 43, 180, '1000-0 · job:A');
      out += mCell(215, 43, 180, '1000-1 · job:B');
      out += mCell(25, 116, 370, s <= 1 ? t('no consumer group yet', 'группы обработчиков ещё нет') : s === 3 ? 'PEL: ∅ · XACK' : s === 4 ? 'PEL: 1000-0 → B' : 'PEL: 1000-0 → A', { active: s >= 2 });
      out += mCircle(90, 214, 'A', s === 0 ? 'XADD' : s === 1 ? 'XREAD' : s === 3 ? 'XACK' : s === 4 ? t('crashed', 'сбой') : 'XREADGROUP', { color: s === 4 ? C.muted : C.green });
      out += mCircle(330, 214, 'B', s === 4 ? 'XAUTOCLAIM' : 'XREADGROUP', { color: C.blue, active: s === 4 });
      return out + mNote(t(s === 3 ? 'XACK clears pending work, not the entry.' : s === 4 ? 'Retry delivery; keep processing idempotent.' : s === 1 ? 'XREAD reads without removing entries.' : 'The stream and its pending list differ.', s === 3 ? 'XACK убирает ожидание, не саму запись.' : s === 4 ? 'Повторная доставка требует идемпотентности.' : s === 1 ? 'XREAD читает без удаления записей.' : 'Stream и список ожидания — разные вещи.'));
    }
    case 'specialized': {
      const names = ['JSON', t('Search', 'Поиск'), t('Vectors', 'Векторы'), t('Time series', 'Ряды времени'), t('Bitmap / Geo', 'Биты / Гео'), t('Probabilistic', 'Вероятностные')];
      out += text(210, 30, names[s], { size: 18, anchor: 'middle', bold: true });
      if (s === 0) {
        out += mCell(135, 70, 150, 'user');
        out += arrow(170, 116, 110, 148, '', { color: C.blue });
        out += arrow(250, 116, 310, 148, '', { color: C.blue });
        out += mCell(25, 165, 170, 'name: Alice');
        out += mCell(225, 165, 170, 'age: 30');
        out += mCell(25, 247, 370, '$.user.age → 30', { active: true });
      } else if (s === 1) {
        out += mCell(80, 75, 260, '"redis"');
        out += arrow(210, 121, 210, 162, '', { color: C.blue });
        out += mCell(40, 181, 340, 'doc:2 → doc:7 → doc:12', { active: true });
        out += text(210, 272, t('term → inverted index → document IDs', 'термин → индекс → ID документов'), { size: 14, anchor: 'middle' });
      } else if (s === 2) {
        out += `<path d="M65 80 V260 H365" stroke="${C.line}" fill="none" stroke-width="2"/>`;
        [[100, 210], [148, 186], [200, 148], [230, 160], [315, 90]].forEach(([x, y], i) => { out += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 6}" fill="${i === 2 ? C.green : C.red}"/>`; });
        out += `<circle cx="200" cy="148" r="48" fill="none" stroke="${C.blue}" stroke-dasharray="5 4"/>`;
        out += text(210, 295, t('HNSW / FLAT → nearest neighbors', 'HNSW / FLAT → ближайшие соседи'), { size: 14, anchor: 'middle' });
      } else if (s === 3) {
        out += `<path d="M45 245 H380 M45 245 V70" fill="none" stroke="${C.line}" stroke-width="2"/><path d="M50 210 L110 180 L170 200 L230 130 L290 140 L365 95" fill="none" stroke="${C.red}" stroke-width="3"/>`;
        out += text(210, 290, 't1:24 · t2:25 · t3:24 → AVG', { size: 14, anchor: 'middle' });
      } else if (s === 4) {
        Array.from('10100100').forEach((bit, i) => { out += mCell(25 + i * 47, 85, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
        out += mCell(25, 182, 370, 'geo → geohash → Sorted Set');
        out += text(210, 266, t('bit position / geographic neighborhood', 'позиция бита / соседство на карте'), { size: 14, anchor: 'middle' });
      } else {
        out += text(25, 82, t('HyperLogLog · registers', 'HyperLogLog · регистры'), { size: 14 });
        ['3', '0', '2', '5', '1', '0'].forEach((v, i) => { out += mCell(25 + i * 63, 100, 54, v); });
        out += text(25, 195, t('Bloom · hash → bit positions', 'Bloom · хеш → позиции битов'), { size: 14 });
        Array.from('00101010').forEach((bit, i) => { out += mCell(25 + i * 47, 214, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
      }
      return out + mNote(t('An index trades memory for specific queries.', 'Индекс меняет память на удобство поиска.'));
    }
    default: return compactScene('first-key', s, lang);
  }
}

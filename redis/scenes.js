/* The diagrams deliberately use a small, deterministic teaching model.
 * They illustrate the current story step; no Redis server is contacted. */
// The vocabulary follows the Raft illustration: plain circles, black outlines,
// monospace labels, square log entries and colored messages on a white canvas.
const C = { ink: '#000000', muted: '#777777', line: '#d9dfdf', red: '#ff0000', green: '#008000', blue: '#0000ff', server: '#4682b4', pale: '#f5f5f5', white: '#fff' };
const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = (lang, en, ru) => lang === 'ru' ? ru : en;
function node(key, body, opt = {}) {
  const motion = opt.motion || 'context';
  return `<g class="${opt.flow ? 'flow' : 'scene-node'}${opt.active ? ' scene-active' : ''}" data-key="${E(key)}" data-motion="${motion}" data-stage="${opt.stage ?? (motion === 'change' ? 2 : 0)}"${opt.role ? ` data-role="${opt.role}"` : ''}${opt.sequence !== undefined ? ` data-sequence="${opt.sequence}"` : ''}${opt.transient ? ' data-transient="true"' : ''}${opt.previousUntil !== undefined ? ` data-previous-until="${opt.previousUntil}"` : ''}${opt.pass !== undefined ? ` data-pass="${opt.pass}"` : ''}>${body}</g>`;
}
function text(x, y, lines, opt = {}) {
  const rows = Array.isArray(lines) ? lines : [lines];
  const size = opt.size || 17;
  const body = `<text x="${x}" y="${y}" text-anchor="${opt.anchor || 'start'}" fill="${opt.color || C.ink}" font-family="Courier New, Courier, monospace" font-size="${size}" font-weight="${opt.bold ? 600 : 400}" class="${opt.code ? 'scene-code' : 'scene-label'}">${rows.map((r, i) => `<tspan x="${x}" dy="${i ? opt.leading || size + 7 : 0}">${E(r)}</tspan>`).join('')}</text>`;
  return opt.motion ? node(opt.key || `label-${x}-${y}`, body, opt) : body;
}
function box(x, y, w, h, title, body = [], opt = {}) {
  const size = opt.size || 16, max = Math.floor((w - 32) / (size * 0.61));
  const lines = [];
  for (const row of (Array.isArray(body) ? body : [body])) {
    let current = '';
    for (const word of String(row).split(' ')) { if ((current + ' ' + word).trim().length > max && current) { lines.push(current); current = word; } else current += (current ? ' ' : '') + word; }
    lines.push(current);
  }
  const key = opt.key || `structure-${x}-${y}`;
  const content = lines.length ? text(x + 16, y + 57, lines, { size, leading: size + 5, code: opt.code, color: opt.bodyColor, key: `${key}-value`, motion: opt.stateMotion || (body.length ? 'change' : 'context'), stage: opt.stage ?? 2, pass: opt.pass, previousUntil: opt.previousUntil }) : '';
  return node(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"${opt.dashed ? ' stroke-dasharray="5 5"' : ''}/>${text(x + 16, y + 29, title, { size: opt.titleSize || 18, color: opt.color })}${content}`, { active: opt.active });
}
function chip(x, y, w, label, opt = {}) {
  return node(opt.key || `entry-${x}-${y}`, `<rect x="${x}" y="${y}" width="${w}" height="${opt.h || 34}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + 23, label, { code: opt.code !== false, size: opt.size || 15, anchor: 'middle', color: opt.color || C.ink })}`, { active: opt.active, motion: opt.motion || 'change', stage: opt.stage, sequence: opt.sequence, transient: opt.transient, previousUntil: opt.previousUntil, pass: opt.pass });
}
function arrow(x1, y1, x2, y2, label = '', opt = {}) {
  const color = opt.color || C.red;
  const role = opt.role || (color === C.green ? 'reply' : color === C.blue ? 'sync' : 'request');
  const active = color !== C.line && !opt.dashed;
  const stage = opt.stage ?? (role === 'reply' ? 3 : 1);
  return node(opt.key || `flow-${x1}-${y1}-${x2}-${y2}`, `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.5"${opt.dashed ? ' stroke-dasharray="5 5"' : ''} marker-end="url(#scene-arrow-${color.replace('#', '')})"/>${label ? `<text x="${opt.labelX ?? (x1 + x2) / 2}" y="${opt.labelY ?? (y1 + y2) / 2 - 10}" text-anchor="middle" font-family="Courier New, Courier, monospace" font-size="15" fill="${color === C.line ? C.muted : color}" stroke="white" stroke-width="5" paint-order="stroke">${E(label)}</text>` : ''}`, { flow: true, role, motion: opt.motion || (active ? 'flow' : 'context'), stage, sequence: opt.sequence });
}
function note(label, opt = {}) {
  const words = String(label).split(' '), lines = [''];
  for (const word of words) { const last = lines.length - 1; if ((lines[last] + ' ' + word).trim().length > 100 && lines[last]) lines.push(word); else lines[last] += (lines[last] ? ' ' : '') + word; }
  return text(480, opt.y || (lines.length > 1 ? 277 : 290), lines, { size: opt.size || 14, leading: 19, anchor: 'middle', color: opt.color || C.muted, key: 'scene-caption', motion: 'change', stage: 4 });
}
function endpoint(x, y, label, detail, active = false, color = C.green) {
  const words = String(detail).split(' '), rows = [''];
  for (const word of words) { const i = rows.length - 1; if ((rows[i] + ' ' + word).trim().length > 24 && rows[i]) rows.push(word); else rows[i] += (rows[i] ? ' ' : '') + word; }
  const mark = /[ABCS][0-9]?$/.test(label) ? label.match(/[ABCS][0-9]?$/)[0] : 'C';
  return node(`client-${x}-${y}`, `<circle cx="${x + 90}" cy="${y + 29}" r="27" fill="${color === C.muted ? C.muted : C.green}" stroke="${C.ink}" stroke-width="${active ? 2 : 1}"/>${text(x + 90, y + 35, mark, { size: 18, anchor: 'middle', color: C.white })}${text(x + 90, y + 76, label, { size: 14, anchor: 'middle' })}${text(x + 90, y + 100, rows, { size: 14, leading: 18, anchor: 'middle', code: true, key: `client-${x}-${y}-command`, motion: 'change', stage: 0 })}`, { active });
}
function server(x, y, label, detail, active = false, failed = false) {
  const mark = /^[ABC]$/.test(label) ? label : /[Pp]rimary/.test(label) ? 'P' : 'R';
  return node(`server-${x}-${y}`, `<circle cx="${x}" cy="${y}" r="45" fill="${failed ? '#999999' : C.server}" stroke="${C.ink}" stroke-width="${active ? 3 : 1}"/>${text(x, y + 6, mark, { size: 22, anchor: 'middle', color: C.white })}${failed ? `<path d="M${x-24} ${y-24} L${x+24} ${y+24} M${x+24} ${y-24} L${x-24} ${y+24}" stroke="${C.ink}" stroke-width="2"/>` : ''}${text(x, y + 69, label, { size: 15, anchor: 'middle' })}${text(x, y + 92, detail, { size: 14, anchor: 'middle', key: `server-${x}-${y}-value`, motion: 'change', stage: 2 })}`, { active });
}
function dots(x, y, items, active = -1, w = 150) {
  return items.map((item, i) => text(x + i * (w + 10) + w / 2, y + 24, item, { size: 15, anchor: 'middle', color: i === active ? C.ink : C.muted, bold: i === active })).join('');
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
  let out = endpoint(95, 97, L(lang, 'Client', 'Клиент'), '', s === 0);
  out += server(765, 126, 'Redis', '', s === 2);
  const command = s === 4 ? 'GET user:1' : 'SET user:1 Alice';
  if (s === 5) {
    out += arrow(250, 106, 690, 106, 'SET user:1 Bob', { key: 'first-key-request-set', sequence: 0, role: 'request' });
    out += arrow(690, 158, 250, 158, '+OK', { key: 'first-key-reply-set', sequence: 0, role: 'reply', color: C.green });
    out += text(765, 244, 'user:1 → "Bob"', { key: 'first-key-replacement', motion: 'change', stage: 2, sequence: 0, transient: true, size: 18, anchor: 'middle', code: true });
    out += arrow(250, 106, 690, 106, 'DEL user:1', { key: 'first-key-request-del', sequence: 1, role: 'request' });
    out += arrow(690, 158, 250, 158, ':1', { key: 'first-key-reply-del', sequence: 1, role: 'reply', color: C.green });
    out += text(765, 244, 'user:1 → ∅', { key: 'first-key-value', motion: 'change', stage: 2, sequence: 1, previousUntil: 0, size: 18, anchor: 'middle', code: true });
  } else {
    out += arrow(250, 106, 690, 106, command, { key: 'first-key-request', role: 'request', color: C.red });
    if (s >= 3) out += arrow(690, 158, 250, 158, s === 4 ? '"Alice"' : '+OK', { key: 'first-key-reply', color: C.green, role: 'reply' });
    out += text(765, 244, s < 2 ? 'user:1 → ∅' : 'user:1 → "Alice"', { key: 'first-key-value', motion: s >= 2 ? 'change' : 'context', stage: 2, size: 18, anchor: 'middle', code: true });
  }
  out += text(765, 269, L(lang, 'RAM', 'RAM'), { size: 14, anchor: 'middle', color: C.muted });
  if (s === 1) out += text(480, 214, L(lang, 'Find user:1 → absent', 'Найти user:1 → нет ключа'), { key: 'first-key-lookup', motion: 'change', stage: 2, anchor: 'middle', size: 16 });
  return out + note(L(lang, ['A command starts at the client.', 'The server looks for the named key.', 'A key now points to a value in RAM.', 'OK confirms execution on this server.', 'GET reads the value from RAM.', 'Alice → Bob → missing: one named entry changes.'][s], ['Команда начинается у клиента.', 'Сервер ищет ключ с этим именем.', 'Ключ теперь указывает на значение в RAM.', 'OK подтверждает исполнение на этом сервере.', 'GET читает значение из RAM.', 'Alice → Bob → нет ключа: меняется одна запись.'][s]), { y: 305 });
}
function request(s, lang) {
  const labels = [L(lang, 'TCP socket', 'TCP-сокет'), L(lang, 'Input buffer', 'Входной буфер'), L(lang, 'RESP parser', 'Разбор RESP'), L(lang, 'Command checks', 'Проверки'), L(lang, 'Output buffer', 'Выходной буфер')];
  const bodies = [[L(lang, 'ordered bytes', 'поток байтов')], [s === 2 ? 'user:1 · Ali…' : s >= 3 ? 'user:1 · Alice' : '*3 · $3 · SET …'], [s < 3 ? L(lang, 'need more bytes', 'нужны ещё байты') : 'SET user:1 Alice'], [L(lang, 'arity · ACL · state', 'аргументы · ACL · режим')], ['+OK\\r\\n']];
  const stage = [0, 1, 1, 2, 3, 4][s];
  let out = labels.map((v, i) => i > stage ? '' : box(20 + i * 190, 89, 160, 110, v, bodies[i], { key: `request-part-${i}`, active: i === stage, stateMotion: i === stage ? 'change' : 'context', size: 14, titleSize: 16 })).join('');
  for (let i = 0; i < stage; i++) out += arrow(183 + i * 190, 143, 202 + i * 190, 143, '', { key: `request-transfer-${i}`, role: s === 5 && i === 3 ? 'reply' : 'internal', stage: 1, color: i === Math.max(0, stage - 1) ? s === 5 ? C.green : C.red : C.line });
  out += text(480, 239, s === 2 ? '*3 · $3 · SET · $6 · user:1 · $5 · Ali' : s === 3 ? 'ce + \\r\\n → SET user:1 Alice' : '*3 · $3 · SET · $6 · user:1 · $5 · Alice', { key: 'request-frame', motion: 'change', stage: 2, anchor: 'middle', size: 15, code: true });
  return out + note(L(lang, ['TCP delivers an ordered byte stream.', 'RESP encodes an array of command arguments.', 'The value ends at Ali: this command cannot execute yet.', 'The remaining ce completes the third argument.', 'Redis validates the command before its mutation.', 'The reply is buffered, then written to the socket.'][s], ['TCP доставляет упорядоченный поток байтов.', 'RESP кодирует массив аргументов команды.', 'Значение обрывается на Ali: команду пока нельзя исполнить.', 'Оставшиеся ce завершают третий аргумент.', 'Redis проверяет команду до изменения данных.', 'Ответ попадает в буфер и затем в сокет.'][s]));
}
function eventLoop(s, lang) {
  let out = '';
  ['A', 'B', 'C'].forEach((name, i) => {
    const y = 51 + i * 82, selected = s === 2 && i === 0 || s === 3 && i === 1 || s === 5 && i === 0;
    out += node(`event-client-${name}`, `<circle cx="65" cy="${y}" r="25" fill="${C.green}" stroke="${C.ink}" stroke-width="${selected ? 2 : 1}"/>${text(65, y + 6, name, { anchor: 'middle', color: C.white })}`);
    out += text(110, y + 6, [s === 5 ? 'EVAL …' : 'SET user:1 Alice', 'GET user:1', 'PING'][i], { size: 14, code: true });
    out += arrow(285, y, 375, y, s === 5 && i === 2 ? L(lang, 'wait', 'ждёт') : '', { key: `event-request-${name}`, role: 'request', color: selected || s === 1 ? C.red : C.line, dashed: s === 5 && i === 2 });
  });
  out += node('event-loop-server', `<circle cx="480" cy="132" r="81" fill="${C.server}" stroke="${C.ink}" stroke-width="2"/>${text(480, 130, 'Redis', { anchor: 'middle', color: C.white, size: 22 })}${text(480, 154, 'event loop', { anchor: 'middle', color: C.white, size: 14 })}`);
  out += text(480, 249, s === 2 ? 'SET → user:1 = Alice' : s === 3 ? 'GET → "Alice"' : s === 5 ? L(lang, 'EVAL occupies execution', 'EVAL занимает исполнителя') : L(lang, 'poll → read → execute → reply', 'poll → чтение → команда → ответ'), { key: 'event-loop-execution', motion: 'change', stage: 2, anchor: 'middle', size: 14 });
  if (s === 2 || s === 3) out += arrow(575, s === 2 ? 60 : 140, 684, s === 2 ? 60 : 140, s === 2 ? '+OK' : '"Alice"', { key: 'event-loop-reply', color: C.green, role: 'reply' });
  if (s >= 4) {
  out += text(780, 57, L(lang, 'I/O threads', 'Потоки I/O'), { anchor: 'middle', size: 16 });
  out += text(780, 83, L(lang, 'read · parse · write', 'чтение · разбор · запись'), { anchor: 'middle', size: 14, color: C.muted });
  out += text(780, 183, L(lang, 'Background work', 'Фоновая работа'), { anchor: 'middle', size: 16 });
  out += text(780, 209, 'fsync · lazyfree · RDB child', { anchor: 'middle', size: 14, color: C.muted });
  }
  if (s === 4) out += arrow(575, 92, 665, 72, '', { role: 'internal', stage: 1, color: C.blue }) + arrow(575, 173, 665, 190, '', { role: 'internal', stage: 1, color: C.blue });
  return out + note(L(lang, s === 5 ? 'A long command delays other commands, including PING.' : 'Ordinary commands share one executor; network and background work have other roles.', s === 5 ? 'Долгая команда задерживает остальные, в том числе PING.' : 'Обычные команды делят исполнителя; у сети и фоновой работы другие роли.'), { y: 298 });
}
function dictionary(s, lang) {
  let out = chip(25, 20, 170, 'key = "user:1"', { color: C.green });
  out += arrow(208, 37, 278, 37, 'hash', { role: 'internal', stage: 1, color: C.blue });
  out += chip(290, 20, 190, L(lang, 'hash → bucket 2', 'хеш → ячейка 2'), { active: s <= 1 });
  const oldRows = s >= 5 ? ['0   ∅', '1   ∅', '2   ∅', '3   c'] : ['0   ∅', '1   ∅', '2   user:2 → user:1', '3   c'];
  out += text(100, 91, L(lang, 'Table 0 · 4 buckets', 'Таблица 0 · 4 ячейки'), { bold: true });
  oldRows.forEach((v, i) => { out += chip(100, 106 + i * 34, 280, v, { h: 30, active: i === 2 && s >= 1 && s < 4, color: i === 2 && s >= 1 && s < 4 ? C.red : undefined }); });
  if (s < 4) {
    out += box(525, 108, 370, 122, L(lang, s >= 2 ? 'A collision is a chain' : 'Bucket index', s >= 2 ? 'Коллизия образует цепочку' : 'Индекс ячейки'), [s >= 2 ? L(lang, 'user:2 ≠ user:1 → next', 'user:2 ≠ user:1 → дальше') : 'hash & (size − 1)', s >= 3 ? L(lang, 'user:1 = user:1 → value', 'user:1 = user:1 → значение') : L(lang, 'compare the full key', 'сравнить весь ключ')], { active: s === 3, code: true, size: 16 });
  } else {
    out += text(590, 91, L(lang, 'Table 1 · 8 buckets', 'Таблица 1 · 8 ячеек'), { bold: true });
    ['0 ∅', '1 ∅', '2 user:2', '3 ∅', '4 ∅', '5 ∅', '6 user:1', '7 ∅'].forEach((v, i) => { out += chip(590 + (i >= 4 ? 155 : 0), 106 + i % 4 * 34, 145, s === 4 ? `${i}  ∅` : v, { h: 30, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
    out += arrow(395, 165, 570, 165, s === 5 ? L(lang, 'move a bucket', 'перенос ячейки') : L(lang, 'allocate', 'выделить'), { color: C.blue, role: 'internal', stage: 1 });
  }
  return out + note(L(lang, s < 4 ? 'The hash chooses a bucket; equality finds the actual key.' : 'Rehash moves entries gradually; lookups may inspect both tables.', s < 4 ? 'Хеш выбирает ячейку; сравнение находит нужный ключ.' : 'Rehash переносит записи постепенно; поиск может читать обе таблицы.'));
}
function encodings(s, lang) {
  const types = ['String', 'List', 'Set', 'Hash', 'Sorted Set', L(lang, 'Growth', 'Рост')];
  let out = dots(25, 18, types, s, 140);
  if (s === 0) {
    out += box(75, 88, 335, 137, 'String', ['"hello" → SDS', L(lang, '"42" → integer encoding', '"42" → целое число')], { active: true, code: true });
    out += box(555, 88, 330, 137, 'SDS', ['len: 5 · alloc: 5', 'h | e | l | l | o'], { code: true });
    out += arrow(425, 157, 540, 157, '', { color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 1) {
    out += text(200, 106, 'List → listpack', { anchor: 'middle', size: 17 });
    out += chip(65, 130, 270, 'A | B | C', { key: 'list-small', motion: 'context' });
    out += arrow(352, 147, 457, 147, L(lang, 'growth', 'рост'), { role: 'internal', stage: 1, color: C.blue });
    out += text(690, 106, 'quicklist', { anchor: 'middle', size: 17 });
    for (let i = 0; i < 2; i++) { out += box(480 + i * 225, 130, 195, 81, 'listpack', [i === 0 ? 'A | B | C' : 'D | E | F'], { key: `list-block-${i}`, titleSize: 16, size: 15, stateMotion: 'change' }); if (i === 0) out += arrow(682, 170, 699, 170, '', { color: C.ink, role: 'internal', stage: 1 }); }
  } else if (s === 2) {
    out += box(75, 88, 335, 137, 'Set → intset', ['[ 2, 5, 8, 13 ]', L(lang, 'other small sets: listpack', 'другие малые Set: listpack')], { active: true, code: true });
    out += box(555, 88, 330, 137, 'Set → hashtable', ['2 → ∅ · 5 → ∅', '8 → ∅ · 13 → ∅ · …'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'expand', 'рост'), { color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 3) {
    out += box(75, 88, 335, 137, 'Hash → listpack', ['name | Alice | age | 30', L(lang, 'fields beside their values', 'поля рядом со значениями')], { active: true, size: 15, code: true });
    out += box(555, 88, 330, 137, 'Hash → hashtable', ['name → "Alice"', 'age → "30"'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'growth', 'рост'), { color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 4) {
    out += box(75, 88, 335, 137, 'Sorted Set', ['alice: 10 · bob: 20', 'listpack'], { active: true, code: true });
    out += box(555, 88, 330, 137, 'skiplist + hashtable', ['10 → 20 → 35', 'alice → score 10'], { code: true });
    out += arrow(425, 157, 540, 157, L(lang, 'growth', 'рост'), { color: C.blue, role: 'internal', stage: 1 });
  } else {
    out += box(75, 88, 335, 137, L(lang, 'Compact encoding', 'Компактная форма'), ['listpack / intset', L(lang, 'small values, low overhead', 'мало данных и накладных расходов')], { active: true, size: 15 });
    out += box(555, 88, 330, 137, L(lang, 'Expanded encoding', 'Развёрнутая форма'), ['hashtable / skiplist', L(lang, 'efficient operations at scale', 'удобные операции при росте')], { active: true, size: 15 });
    out += arrow(425, 157, 540, 157, L(lang, 'threshold crossed', 'превышен порог'), { color: C.blue, role: 'internal', stage: 1 });
  }
  return out + note(L(lang, 'A public data type can have more than one internal representation.', 'Один тип данных может иметь разные внутренние представления.'));
}
function atomicity(s, lang) {
  const incr = s >= 4;
  const aCommand = s === 0 ? 'GET → +1 → SET' : s === 1 ? 'GET count' : s === 2 ? 'SET count 1' : s === 4 ? 'INCR count' : L(lang, 'local value: 1', 'локально: 1');
  const bCommand = s === 0 ? 'GET → +1 → SET' : s === 1 ? 'GET count' : s === 3 ? 'SET count 1' : s === 5 ? 'INCR count' : L(lang, 'local value: 1', 'локально: 1');
  let out = endpoint(0, 20, L(lang, 'Client A', 'Клиент A'), aCommand, s === 2 || s === 4);
  out += endpoint(0, 160, L(lang, 'Client B', 'Клиент B'), bCommand, s === 3 || s === 5);
  out += server(800, 140, 'Redis', '');
  out += text(800, 252, `count = ${s <= 1 ? 0 : s === 5 ? 2 : 1}`, { key: 'atomicity-value', motion: 'change', stage: 2, anchor: 'middle', size: 21 });
  if (s === 1 || s === 2 || s === 4) {
    out += arrow(235, 58, 730, 111, s === 1 ? 'GET count' : incr ? 'INCR count' : 'SET count 1', { key: 'atomicity-a-request', role: 'request' });
    out += arrow(730, 134, 235, 83, s === 1 ? '"0"' : incr ? ':1' : '+OK', { key: 'atomicity-a-reply', role: 'reply', color: C.green });
  }
  if (s === 1 || s === 3 || s === 5) {
    out += arrow(235, 205, 730, 165, s === 1 ? 'GET count' : incr ? 'INCR count' : 'SET count 1', { key: 'atomicity-b-request', role: 'request' });
    out += arrow(730, 189, 235, 230, s === 1 ? '"0"' : incr ? ':2' : '+OK', { key: 'atomicity-b-reply', role: 'reply', color: C.green });
  }
  return out + note(L(lang, s === 3 ? 'Both clients write 1: one update is lost.' : s === 5 ? 'The second INCR starts from 1 and returns 2.' : incr ? 'INCR reads and writes within one command.' : 'The application’s read and write are two separate commands.', s === 3 ? 'Оба клиента записали 1: одно обновление потеряно.' : s === 5 ? 'Второй INCR начинает с 1 и возвращает 2.' : incr ? 'INCR читает и записывает внутри одной команды.' : 'Чтение и запись приложения — две отдельные команды.'), { y: 305 });
}
function transactions(s, lang) {
  const watched = s === 2 || s === 3;
  let out = endpoint(15, 95, L(lang, 'Client A', 'Клиент A'), watched ? 'WATCH count' : s === 0 ? 'MULTI' : 'EXEC');
  out += box(320, 45, 365, 202, watched ? L(lang, 'Watched key', 'Наблюдаемый ключ') : L(lang, 'Transaction queue', 'Очередь транзакции'), [], { active: true });
  if (watched) {
    out += chip(345, 112, 315, s === 2 ? L(lang, 'count = 0 · WATCH active', 'count = 0 · WATCH активен') : L(lang, 'count = 1 · A dirty', 'count = 1 · попытка A изменена'), { size: 14, active: true });
    out += chip(345, 178, 315, s === 3 ? 'EXEC → (nil)' : 'GET count → "0"', { color: s === 3 ? '#b44c34' : C.green });
    out += endpoint(745, 85, L(lang, 'Client B', 'Клиент B'), 'INCR count', s === 3, C.blue);
    if (s === 3) out += arrow(730, 115, 700, 115, 'INCR', { key: 'transaction-b-request', role: 'request', color: C.red });
    out += arrow(216, 128, 305, 128, s === 2 ? 'WATCH' : 'EXEC', { key: 'transaction-a-request', role: 'request' });
  } else {
    out += chip(345, 97, 315, s === 4 ? 'SET a text → OK' : s === 5 ? 'MULTI' : 'SET a 1', { color: s === 1 || s === 4 ? C.green : undefined });
    out += chip(345, 140, 315, s === 5 ? 'SET a → ERR' : s === 4 ? 'INCR a → ERR integer' : 'INCR b', { size: 14, color: s >= 4 ? '#b44c34' : undefined });
    out += chip(345, 183, 315, s === 0 ? 'QUEUED' : s === 5 ? 'EXECABORT · no writes' : s === 4 ? 'SET b 2 → OK' : 'a = 1 · b = 1', { size: 14, color: s === 5 ? '#b44c34' : C.green });
    out += arrow(216, 128, 305, 128, s === 0 ? 'MULTI + commands' : 'EXEC');
    out += text(730, 105, [L(lang, 'Other clients', 'Другие клиенты'), L(lang, s === 0 ? 'may act before EXEC' : 'wait during EXEC', s === 0 ? 'работают до EXEC' : 'ждут во время EXEC')], { size: 14, color: C.muted });
  }
  const notes = [L(lang, 'MULTI queues commands; it does not execute them yet.', 'MULTI накапливает команды, но пока их не исполняет.'), L(lang, 'EXEC runs the queued commands without another client between them.', 'EXEC исполняет очередь без команд других клиентов между её командами.'), L(lang, 'WATCH starts optimistic concurrency control before the read.', 'WATCH включает оптимистичный контроль изменений до чтения.'), L(lang, 'A changed watched key aborts EXEC before the queued commands run.', 'Изменённый ключ отменяет EXEC до исполнения очереди.'), L(lang, 'A run-time error does not roll back SET that already succeeded.', 'Ошибка исполнения не откатывает уже выполненный SET.'), L(lang, 'A queue-time syntax error makes EXECABORT cancel the whole transaction.', 'Ошибка синтаксиса при постановке в очередь вызывает EXECABORT без исполнения.')];
  out += arrow(305, 212, 216, 212, s === 0 ? 'QUEUED' : s === 2 ? '+OK' : s === 3 ? '(nil)' : s === 5 ? 'EXECABORT' : s === 4 ? '[OK, ERR, OK]' : '[OK, 1]', { key: 'transaction-result', role: 'reply', color: C.green });
  return out + note(notes[s]);
}
function scripting(s, lang) {
  let out = endpoint(10, 86, L(lang, 'Client A', 'Клиент A'), s === 3 ? 'EVALSHA sha1' : s === 4 ? 'FCALL hello 0' : 'EVAL …', s === 0 || s === 3 || s === 4);
  const title = s === 3 ? L(lang, 'Script cache', 'Кеш скриптов') : s === 4 ? L(lang, 'Function library', 'Библиотека Functions') : L(lang, 'Server-side execution', 'Исполнение на сервере');
  out += box(315, 32, 365, 227, title, [], { active: true });
  const lines = s === 3 ? ['SCRIPT LOAD → SHA1', 'EVALSHA → cached script', 'NOSCRIPT → load again'] : s === 4 ? ['FUNCTION LOAD', 'FCALL hello 0', 'return "hello"'] : [s === 2 ? 'SET a 1' : 'INCR visits', s === 2 ? 'error("stop")' : 'if n == 1: EXPIRE visits 60', s === 5 ? 'long loop … → BUSY' : s === 2 ? 'a remains 1' : 'return n'];
  lines.forEach((v, i) => { out += chip(340, 91 + i * 45, 315, v, { active: s === 2 || s === 5 ? i === 2 : i === 0, color: s === 2 && i === 2 ? '#b44c34' : undefined, size: 14 }); });
  out += endpoint(745, 86, L(lang, 'Client B', 'Клиент B'), 'GET count', false, C.blue);
  out += arrow(218, 123, 300, 123, s === 3 ? 'EVALSHA' : s === 4 ? 'FCALL' : 'EVAL');
  out += arrow(730, 123, 695, 123, L(lang, 'wait', 'ждёт'), { color: C.muted, dashed: true });
  if (s !== 5) out += arrow(300, 230, 218, 230, s === 2 ? 'ERR' : s === 3 ? '"Alice"' : s === 4 ? '"hello"' : ':1', { key: 'script-reply', role: 'reply', color: C.green });
  if (s === 2) out += chip(735, 220, 195, 'a = 1', { size: 14, color: '#b44c34' });
  const notes = [L(lang, 'INCR and EXPIRE can be composed into one atomic server-side operation.', 'INCR и EXPIRE можно объединить в атомарную операцию внутри сервера.'), L(lang, 'No other client command runs in the middle of this script.', 'Команда другого клиента не вклинивается внутрь скрипта.'), L(lang, 'A script error leaves earlier writes in place; there is no automatic rollback.', 'Ошибка скрипта оставляет ранние записи: автоматического отката нет.'), L(lang, 'EVALSHA reuses a cached script; clients must handle a missing cache entry.', 'EVALSHA использует кеш скриптов; клиент должен обработать отсутствие скрипта.'), L(lang, 'Functions are named server-side code managed as persistent libraries.', 'Functions — именованный код сервера, который хранится в библиотеках.'), L(lang, 'After busy-reply-threshold, ordinary commands receive BUSY; the script keeps running.', 'После busy-reply-threshold обычные команды получают BUSY; скрипт продолжает работу.')];
  return out + note(notes[s]);
}
function blocking(s, lang) {
  const wake = s === 2;
  let out = endpoint(10, 35, L(lang, 'Client A', 'Клиент A'), s === 4 || s === 5 ? 'BLPOP jobs 0' : 'BLPOP jobs 5', s === 0);
  out += box(315, 50, 360, 145, 'Redis · jobs', [s === 2 ? '[ "task:1" ] → A' : '[ ]', L(lang, s === 5 ? 'item removed before worker crash' : 'command executor remains available', s === 5 ? 'элемент удалён до сбоя обработчика' : 'исполнитель команд доступен')], { active: s >= 1, code: true, size: 14 });
  out += endpoint(745, 35, L(lang, 'Client B', 'Клиент B'), s === 2 ? 'RPUSH jobs task:1' : s === 4 ? 'BLPOP jobs 0' : 'GET user:1', s === 1 || s === 2, C.blue);
  out += box(65, 201, 315, 62, L(lang, wake ? 'A resumed' : s === 3 ? 'timeout → (nil)' : s === 5 ? 'A crashed after pop' : 'A waits for an item', wake ? 'A продолжает работу' : s === 3 ? 'таймаут → (nil)' : s === 5 ? 'A упал после pop' : 'A ожидает элемент'), [], { titleSize: 16, dashed: !wake, color: wake ? C.green : C.muted });
  if (s === 0) out += arrow(218, 85, 300, 85, 'BLPOP', { key: 'blocking-wait-request', role: 'request' });
  if (s === 1) out += arrow(730, 85, 690, 85, 'GET', { key: 'blocking-b-request', role: 'request' }) + arrow(690, 160, 730, 160, '"Alice"', { key: 'blocking-b-reply', role: 'reply', color: C.green });
  if (s === 3) out += arrow(300, 128, 218, 128, '(nil)', { key: 'blocking-timeout-reply', role: 'reply', color: C.green });
  if (s === 2) out += arrow(730, 85, 690, 85, 'RPUSH', { key: 'blocking-push-request', role: 'request', color: C.red }) + arrow(495, 210, 395, 232, '"task:1"', { color: C.green });
  if (s === 4) out += chip(510, 226, 380, 'waiters: A → B', { color: C.blue });
  const notes = [L(lang, 'An empty list parks client A, not the command executor.', 'Пустой список оставляет клиента A ждать, но не занимает исполнитель.'), L(lang, 'While A waits, other clients continue to use Redis.', 'Пока A ждёт, остальные клиенты продолжают работать.'), L(lang, 'RPUSH adds an item and wakes a waiting consumer.', 'RPUSH добавляет элемент и будит ожидающего потребителя.'), L(lang, 'A finite timeout resumes the client even if no item arrived.', 'Конечный таймаут возвращает управление, даже если элемент не появился.'), L(lang, 'Clients waiting on the same list are served in arrival order.', 'Клиенты, ожидающие один список, обслуживаются по порядку ожидания.'), L(lang, 'After pop, the item is gone. A crashed worker needs a separate reliability design.', 'После pop элемент удалён. Для сбоя обработчика нужен отдельный механизм надёжности.')];
  return out + note(notes[s]);
}
function locks(s, lang) {
  if (s === 3 || s === 5) {
    const fenced=s===5;
    let out=endpoint(10, 53, L(lang, 'Stale A', 'Старый A'), fenced?'write(fence=41)':'write(resource)');
    out+=box(337, 53, 286, 160, L(lang, 'External resource', 'Внешний ресурс'), [fenced?'highest fence = 42':L(lang,'A and B can both write','A и B могут писать')], {key:'lock-external-resource',active:true,size:14,titleSize:16});
    if(!fenced)out+=endpoint(745, 53, L(lang,'Current B','Новый B'),'write(resource)',true,C.blue);
    out+=arrow(218,110,322,110,fenced?'41':'write',{key:'lock-external-a',role:'request'});
    if(!fenced)out+=arrow(730,140,638,140,'write',{key:'lock-external-b',role:'request'});
    if(fenced)out+=arrow(322,170,218,170,L(lang,'rejected','отклонено'),{key:'lock-fenced-reply',role:'reply',color:C.green});
    return out+note(L(lang,fenced?'The resource rejects a fence below the highest it has accepted. Redis SET does not create fencing numbers.':'A expired; B owns the lease. Expiration did not stop A.',fenced?'Ресурс отклоняет номер ниже уже принятого. SET не создаёт fencing-номера.':'Срок A истёк; арендой владеет B. Истечение не остановило A.'));
  }
  const owner = s < 2 ? 'token-A' : 'token-B';
  let out = endpoint(10, 53, L(lang, 'Client A', 'Клиент A'), s >= 3 ? 'release(token-A)' : 'SET lock token-A NX PX 5000', s === 0);
  out += box(337, 53, 286, 132, L(lang, 'Lease in Redis', 'Аренда в Redis'), [], { key: 'lock-lease' });
  if (s === 2) out += text(353, 110, 'lock → ∅', { key: 'lock-expired', motion: 'change', stage: 2, pass: 0, transient: true, size: 16 }) + text(353, 138, 'TTL: -2', { key: 'lock-expired-ttl', motion: 'change', stage: 2, pass: 0, transient: true, size: 15 });
  out += text(353, 110, `lock → ${owner}`, { key: 'lock-value', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 16 });
  out += text(353, 138, L(lang, s < 2 ? 'TTL: 5000 ms' : 'A expired · B owns', s < 2 ? 'TTL: 5000 ms' : 'срок A истёк · владеет B'), { key: 'lock-ttl', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 15 });
  out += endpoint(745, 53, L(lang, 'Client B', 'Клиент B'), s >= 2 ? 'SET … token-B NX PX 5000' : 'SET … NX → (nil)', s >= 1, C.blue);
  out += `<path d="M75 233 H885" stroke="${C.line}" stroke-width="3"/>`;
  [75, 475, 885].forEach((x, i) => { out += `<circle cx="${x}" cy="233" r="5" fill="${C.ink}"/>` + text(x, 260, ['0 s', '5 s', '6 s'][i], { size: 15, anchor: 'middle' }); });
  out += chip(105, 205, 280, 'token-A', { color: s < 2 ? C.green : C.muted });
  if (s >= 2) out += chip(545, 205, 280, 'token-B', { key: 'lock-b-timeline', pass: s === 2 ? 1 : 0, color: C.blue });
  if (s === 0 || s === 3 || s === 4) out += arrow(145, 89, 322, 89, '', { role: 'request', color: s >= 3 ? C.red : C.red });
  if (s === 1 || s === 2) out += arrow(790, 89, 638, 89, '', { role: 'request', color: C.red });
  if (s === 4) out += text(480, 30, L(lang, 'token-A ≠ token-B → do not delete', 'token-A ≠ token-B → не удалять'), { anchor: 'middle', size: 17, color: '#b44c34' });
  if (s === 5) out += text(480, 30, L(lang, 'External resource rejects an older fencing number', 'Внешний ресурс отклоняет старый fencing-номер'), { anchor: 'middle', size: 16, color: C.blue });
  if (s === 5) out += arrow(155, 190, 805, 190, L(lang, 'write with old fence', 'запись со старым fence'), { key: 'lock-fenced-write', role: 'request' }) + arrow(805, 169, 155, 169, L(lang, 'rejected', 'отклонено'), { key: 'lock-fenced-reply', role: 'reply', color: C.green });
  if (s === 0 || s === 1 || s === 4) out += arrow(s === 1 ? 638 : 322, 165, s === 1 ? 730 : 218, 165, s === 0 ? '+OK' : s === 1 ? '(nil)' : ':0', { key: 'lock-reply', role: 'reply', color: C.green });
  return out + note(L(lang, s >= 3 ? 'An expired owner can wake up; external writes need their own protection.' : 'NX grants ownership only if the key is absent; the TTL bounds the lease.', s >= 3 ? 'Старый владелец может проснуться; внешние записи требуют своей защиты.' : 'NX выдаёт владение только при отсутствии ключа; TTL ограничивает срок.'));
}
function expiry(s, lang) {
  if (s === 5) {
    let out = server(200, 105, 'Primary', '', true) + server(760, 105, L(lang, 'Replica', 'Реплика'), '');
    out += text(200, 223, 'session → ∅', { key: 'expiry-primary', motion: 'change', stage: 2, pass: 0, anchor: 'middle', size: 18 });
    out += arrow(270, 105, 690, 105, 'DEL / UNLINK', { key: 'expiry-propagation', role: 'sync', color: C.blue });
    out += text(760, 223, 'session → ∅', { key: 'expiry-replica', motion: 'change', stage: 2, pass: 1, anchor: 'middle', size: 18 });
    return out + note(L(lang, 'The primary propagates DEL, or UNLINK when lazyfree-lazy-expire is enabled.', 'Primary передаёт DEL, либо UNLINK при включённом lazyfree-lazy-expire.'));
  }

  const expired = s >= 1 && s <= 3, removed = s === 2 || s === 3 || s === 5;
  let out = box(55, 62, 270, 130, L(lang, 'Key dictionary', 'Словарь ключей'), [removed ? '∅' : 'session → "abc"', L(lang, removed ? 'entry removed' : 'entry in memory', removed ? 'запись удалена' : 'запись в памяти')], { active: s === 2, code: true, size: 15 });
  out += box(355, 62, 270, 130, L(lang, 'Expiry dictionary', 'Словарь сроков'), [removed || s === 4 ? '∅' : 'session → 10:00:05', L(lang, s === 4 ? 'SET cleared the TTL' : expired ? 'deadline has passed' : 'deadline in the future', s === 4 ? 'SET убрал TTL' : expired ? 'срок уже прошёл' : 'срок ещё не наступил')], { active: s === 1 || s === 4, code: true, size: 15 });
  out += box(655, 62, 250, 130, L(lang, 'Server clock', 'Часы сервера'), [s === 0 ? '10:00:02' : '10:00:06', expired || s === 5 ? 'GET → (nil)' : 'GET → "abc"'], { active: expired, code: true, size: 15 });
  out += chip(80, 226, 360, s === 5 ? L(lang, 'Primary → DEL → replica', 'Primary → DEL → реплика') : L(lang, 'Access path → delete expired key', 'При обращении → удалить ключ'), { color: s === 2 || s === 5 ? C.red : undefined, code: s === 5, size: 14 });
  out += chip(515, 226, 360, s === 4 ? 'SET session abc → TTL -1' : L(lang, 'Active expiry → sample and clean', 'Активная очистка → проверка ключей'), { color: s === 3 || s === 4 ? C.red : undefined, code: s === 4, size: 14 });
  if (s === 2 || s === 4) out += arrow(335, 202, 335, 226, s === 4 ? 'SET' : 'GET', { role: 'request' });
  if (s === 2 || s === 4) out += arrow(350, 227, 510, 227, s === 4 ? '+OK' : '(nil)', { role: 'reply', color: C.green });
  if (s === 3) out += arrow(640, 146, 640, 215, '', { role: 'internal', color: C.blue });
  return out + note(L(lang, s === 1 ? 'The key is logically expired even if its bytes are still allocated.' : s === 5 ? 'The primary propagates expiration as a deletion to its replicas.' : s === 4 ? 'A plain SET replaces the value and removes the old TTL unless KEEPTTL is requested.' : 'Expiration is checked on access and by active background work.', s === 1 ? 'Ключ уже недоступен, хотя его байты ещё могут занимать память.' : s === 5 ? 'Primary передаёт истечение репликам как удаление.' : s === 4 ? 'Обычный SET заменяет значение и снимает старый TTL, если не указан KEEPTTL.' : 'Срок проверяется при обращении и во время активной очистки.'));
}
function memory(s, lang) {
  if (s === 4) {
    const parts = [L(lang, 'Data', 'Данные'), L(lang, 'Bookkeeping', 'Служебные данные'), L(lang, 'Fragmentation', 'Фрагментация')];
    let out = text(480, 42, L(lang, 'Process RSS is not just key/value bytes', 'RSS процесса — это не только байты ключей'), { anchor: 'middle', size: 19 });
    parts.forEach((label, i) => { out += node(`memory-component-${i}`, `<rect x="${60 + i * 280}" y="90" width="280" height="90" fill="${[C.server, C.white, C.pale][i]}" stroke="${C.ink}"/>${text(200 + i * 280, 137, label, { anchor: 'middle', size: 16, color: i === 0 ? C.white : C.ink })}`, { motion: 'change', stage: 2 }); });
    out += text(480, 230, 'used_memory   +   allocator / process overhead   →   RSS', { anchor: 'middle', size: 16 });
    return out + note(L(lang, 'maxmemory, allocator usage and operating-system RSS measure different things.', 'maxmemory, память аллокатора и RSS операционной системы — разные показатели.'));
  }
  if (s === 5) {
    let out = text(230, 42, 'DEL', { anchor: 'middle', size: 20 }) + text(730, 42, 'UNLINK', { anchor: 'middle', size: 20 });
    out += chip(75, 94, 310, L(lang, 'key → absent', 'ключ → отсутствует'), { key: 'del-key', pass: 0 });
    out += chip(575, 94, 310, L(lang, 'key → absent', 'ключ → отсутствует'), { key: 'unlink-key', pass: 0 });
    out += chip(75, 190, 310, L(lang, 'memory freed synchronously', 'память освобождена сразу'), { key: 'del-allocation', pass: 0, size: 14 });
    out += chip(575, 190, 310, L(lang, 'memory awaits reclamation', 'память ждёт освобождения'), { key: 'unlink-pending', pass: 0, transient: true, size: 14 });
    out += arrow(730, 142, 730, 176, 'lazyfree', { key: 'unlink-background', role: 'internal', color: C.blue });
    out += chip(575, 190, 310, L(lang, 'background memory reclamation', 'фоновое освобождение памяти'), { key: 'unlink-freed', pass: 1, previousUntil: 0, size: 14 });
    return out + note(L(lang, 'Large container, default DEL settings. UNLINK frees cheap objects synchronously.', 'Большой контейнер, настройки DEL по умолчанию. Дешёвые объекты UNLINK освобождает сразу.'));
  }

  const policies = ['allkeys-lru', 'allkeys-lfu', 'noeviction'];
  const policy = s <= 1 ? 0 : s === 2 ? 1 : 2;
  let out = text(60, 35, 'maxmemory', { bold: true });
  out += `<rect x="60" y="55" width="540" height="43" fill="${C.pale}" stroke="${C.ink}"/>`;
  [180, 160, s === 0 ? 70 : 200].forEach((w, i) => { out += `<rect x="${60 + (i === 0 ? 0 : i === 1 ? 180 : 340)}" y="55" width="${w}" height="43" fill="${[C.red, C.green, C.blue][i]}" opacity="0.8"/>`; });
  out += text(60, 128, L(lang, s === 0 ? 'near the configured limit' : 'at the limit', s === 0 ? 'приближаемся к пределу' : 'предел достигнут'), { size: 16 });
  const names = ['hot:key', 'old:key', 'rare:key'];
  names.forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += chip(60 + i * 180, 158, 165, gone ? `${v} → ∅` : v, { color: gone ? '#b44c34' : undefined, size: 14 }); });
  out += box(660, 45, 265, 166, L(lang, 'Eviction policy', 'Политика вытеснения'), [policies[policy], L(lang, s === 1 ? 'old candidate evicted' : s === 2 ? 'rare candidate evicted' : s === 4 ? 'RSS includes overhead' : s >= 3 ? 'write → OOM error' : 'choose a candidate', s === 1 ? 'удалён старый кандидат' : s === 2 ? 'удалён редкий кандидат' : s === 4 ? 'RSS включает накладные расходы' : s >= 3 ? 'запись → ошибка OOM' : 'выбрать кандидата')], { active: true, code: true, size: 14 });
  if (s === 1 || s === 2) out += arrow(620, 131, 560, 170, L(lang, 'sample', 'выборка'), { role: 'internal', color: C.blue });
  if (s === 3) out += arrow(60, 230, 600, 230, 'SET new:key value', { role: 'request' }) + arrow(600, 265, 60, 265, 'OOM', { role: 'reply', color: C.green });
  if (s === 5) out += text(60, 244, L(lang, 'DEL: remove + free     UNLINK: remove → lazyfree', 'DEL: удалить + освободить     UNLINK: удалить → lazyfree'), { size: 16, code: true });
  return out + note(L(lang, s === 5 ? 'Allocator overhead and fragmentation also contribute to process memory.' : 'LRU and LFU select approximate candidates; they do not scan every key.', s === 5 ? 'Служебные данные аллокатора и фрагментация тоже расходуют память.' : 'LRU и LFU выбирают приближённого кандидата, не перебирая все ключи.'));
}
function latency(s, lang) {
  if (s === 5) {
    let out = text(480, 30, L(lang, 'Measure the part that is slow', 'Измерить, где именно задержка'), { anchor: 'middle', size: 20 });
    const labels = [L(lang, 'Network + waiting', 'Сеть и ожидание'), L(lang, 'Command execution', 'Исполнение команды'), L(lang, 'Output waiting', 'Ожидание отправки')];
    labels.forEach((label, i) => { out += box(30 + i * 310, 80, 280, 135, label, [i === 0 ? 'client latency' : i === 1 ? 'SLOWLOG GET' : 'INFO clients', i === 0 ? 'redis-cli --latency' : i === 1 ? 'LATENCY DOCTOR' : 'CLIENT LIST · omem'], { key: `latency-measure-${i}`, titleSize: 15, size: 14 }); });
    return out + note(L(lang, 'SLOWLOG records command execution time; it excludes network round trips.', 'SLOWLOG измеряет исполнение команды; сетевой обмен в это время не входит.'));
  }

  let out = text(70, 35, L(lang, 'Client', 'Клиент'), { bold: true, color: C.green });
  out += text(740, 35, 'Redis', { bold: true, color: C.red });
  out += `<path d="M110 55 V250 M790 55 V250" stroke="${C.line}" stroke-width="2"/>`;
  if (s === 0) {
    for (let i = 0; i < 3; i++) { out += arrow(125, 70 + i * 58, 775, 85 + i * 58, i === 0 ? 'GET a' : i === 1 ? 'GET b' : 'GET c'); out += arrow(775, 103 + i * 58, 125, 118 + i * 58, '', { color: C.green }); }
  } else if (s === 1) {
    out += arrow(125, 82, 775, 105, 'GET a · GET b · GET c');
    out += arrow(775, 181, 125, 207, 'a · b · c', { color: C.green });
    out += chip(323, 125, 300, L(lang, 'shared network waiting', 'общее сетевое ожидание'), { code: false, color: C.blue });
  } else {
    out += arrow(125, 77, 775, 92, s === 3 ? 'SCAN 0 COUNT 100' : s === 4 ? 'GET large:blob' : 'KEYS user:*');
    out += box(315, 123, 360, 88, s === 3 ? 'SCAN → cursor 84' : s === 5 ? 'INFO · SLOWLOG' : s === 4 ? L(lang, 'Large value / slow reader', 'Большой ответ / медленный клиент') : L(lang, 'Executor is busy', 'Исполнитель занят'), [L(lang, s === 3 ? 'more calls until cursor 0' : s === 5 ? 'measure before changing' : s === 4 ? 'output buffer grows' : 'other commands wait', s === 3 ? 'новые вызовы до курсора 0' : s === 5 ? 'измерить до изменений' : s === 4 ? 'растёт выходной буфер' : 'остальные команды ждут')], { active: true, size: 14, titleSize: 16 });
    out += arrow(775, 225, 125, 246, L(lang, 'reply', 'ответ'), { color: C.green });
  }
  return out + note(L(lang, s === 1 ? 'Pipelining saves network waits; commands still execute in order on the connection.' : s === 3 ? 'SCAN divides traversal into calls; a call can still take noticeable time.' : 'Latency includes both network time and work on the server.', s === 1 ? 'Pipeline убирает сетевые ожидания; команды соединения исполняются по порядку.' : s === 3 ? 'SCAN делит обход на вызовы; отдельный вызов тоже может занять время.' : 'Задержка включает и сеть, и работу на сервере.'));
}
function rdb(s, lang) {
  const childActive = s >= 1 && s <= 3;
  let out = text(165, 30, L(lang, 'Parent · live data', 'Родитель · рабочие данные'), { anchor: 'middle', bold: true });
  out += text(570, 30, L(lang, childActive ? 'Child · snapshot' : 'No active child', childActive ? 'Потомок · снимок' : 'Нет дочернего процесса'), { anchor: 'middle', bold: true });
  for (let i = 0; i < 3; i++) {
    const changed = i === 1 && s >= 2 && s < 5;
    out += chip(55, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: ${changed ? 'Bob' : 'Alice'}`, { key: `rdb-parent-${i}`, color: changed ? C.green : undefined });
    if (childActive) out += chip(460, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: Alice`, { key: `rdb-child-${i}`, color: C.blue });
    if (childActive && (i !== 1 || s < 2)) out += arrow(290, 78 + i * 55, 445, 78 + i * 55, i === 1 ? L(lang, 'shared', 'общая') : '', { color: C.blue, role: 'internal', motion: s === 1 ? 'flow' : 'context' });
  }
  if (s === 2) out += arrow(290, 133, 445, 133, 'COW', { key: 'rdb-copy', color: C.blue, role: 'internal' });
  if (s >= 2 && s < 5) out += text(365, 175, 'COW', { anchor: 'middle', color: C.green, bold: true });
  if (s >= 3) out += box(755, 89, 170, 105, 'dump.rdb', [s >= 4 ? 'Alice · Alice · Alice' : L(lang, 'writing Alice…', 'пишет Alice…')], { active: s >= 4, code: true, size: 14 });
  if (s === 3) out += arrow(695, 142, 740, 142, '', { key: 'rdb-write', color: C.blue, role: 'internal' });
  if (s === 5) out += arrow(755, 220, 275, 220, 'load RDB', { key: 'rdb-recovery', color: C.blue, role: 'internal' });
  if (s === 5) out += chip(185, 250, 580, L(lang, 'Restart → Alice; writes after the snapshot are absent', 'Перезапуск → Alice; более поздних записей нет'), { color: C.blue, code: false, size: 14 });
  return out + note(L(lang, s === 5 ? 'Loading this completed RDB restores Alice.' : s >= 2 ? 'A parent write copies a shared page; the child retains its snapshot view.' : 'fork creates a snapshot view without eagerly copying every memory page.', s === 5 ? 'Загрузка завершённого RDB возвращает Alice.' : s >= 2 ? 'Запись родителя копирует общую страницу; потомок сохраняет свой вид снимка.' : 'fork создаёт представление снимка без немедленного копирования всех страниц.'), { y: 310 });
}
function aof(s, lang) {
  const layers = s >= 4 ? [L(lang, 'Current dataset', 'Текущие данные'), L(lang, 'New AOF files', 'Новые файлы AOF'), L(lang, 'Recovery', 'Восстановление')] : [L(lang, 'Redis RAM', 'RAM Redis'), L(lang, 'OS page cache', 'Кеш страниц ОС'), L(lang, 'Storage', 'Накопитель')];
  const body = s >= 4 ? [[L(lang, 'live data', 'рабочие данные'), L(lang, 'fork → new base', 'fork → новая основа')], [L(lang, 'base + incremental', 'основа + приращения'), 'manifest'], [s === 5 ? L(lang, 'load base → replay incr', 'основа → приращения') : L(lang, 'publish manifest', 'публикация manifest'), L(lang, 'current dataset', 'актуальные данные')]] : [[s === 3 ? '∅' : 'SET user:1 Bob', L(lang, 'AOF buffer', 'буфер AOF')], [s === 3 ? '∅' : s >= 1 ? 'SET user:1 Bob' : '∅', 'write()'], [s === 3 ? 'Bob · fsynced' : s >= 2 ? 'SET user:1 Bob' : '∅', 'fsync()']];
  let out = layers.map((v, i) => box(45 + i * 315, 68, 240, 135, v, body[i], { active: i === Math.min(s, 2), code: true, size: 14, pass: s === 3 && i < 2 ? 1 : undefined, previousUntil: s === 3 && i < 2 ? 0 : undefined, stateMotion: s === 3 && i === 2 ? 'context' : undefined })).join('');
  if (s === 3) {
    out += text(61, 125, ['SET user:1 Carol', 'AOF buffer'], { key: 'aof-crash-ram', size: 14, motion: 'change', pass: 0, transient: true });
    out += text(376, 125, ['SET user:1 Carol', 'write()'], { key: 'aof-crash-os', size: 14, motion: 'change', pass: 0, transient: true });
  }
  out += arrow(298, 134, 345, 134, '', { color: s >= 1 ? C.blue : C.line, role: 'internal', stage: 1 });
  out += arrow(613, 134, 660, 134, '', { color: s >= 2 ? C.blue : C.line, role: 'internal', stage: 1 });
  out += chip(55, 231, 240, 'appendfsync always', { color: s === 2 ? C.blue : undefined, size: 14 });
  out += chip(360, 231, 240, 'appendfsync everysec', { color: s === 3 ? C.blue : undefined, size: 14 });
  out += chip(675, 231, 240, s >= 4 ? 'BGREWRITEAOF' : 'appendfsync no', { color: s >= 4 ? C.blue : undefined, size: 14 });
  const notes = [L(lang, 'The command changes memory and produces a record in the Redis AOF buffer.', 'Команда меняет память и создаёт запись в буфере AOF Redis.'), L(lang, 'write() hands bytes to the OS; they are not yet guaranteed on stable storage.', 'write() передаёт байты ОС; это ещё не гарантия устойчивого хранения.'), L(lang, 'The fsync policy chooses when Redis asks the OS to flush data.', 'Политика fsync определяет, когда Redis просит ОС сбросить данные.'), L(lang, 'Bob was fsynced; newer Carol is not. This power-loss scenario restores Bob.', 'Bob покрыт fsync, новая Carol — нет. В выбранном сбое восстановится Bob.'), L(lang, 'Rewrite produces a compact base while new writes go into an incremental file.', 'Rewrite создаёт компактную основу, а новые записи попадают в файл приращений.'), L(lang, 'The manifest identifies the base and incremental files to replay on startup.', 'Манифест определяет основу и файлы приращений для восстановления при запуске.')];
  return out + note(notes[s]);
}
function replication(s, lang) {
  const lag = s === 0;
  let out = server(165, 125, 'Primary', 'k = v · offset 120', true);
  out += server(785, 125, L(lang, 'Replica', 'Реплика'), lag ? 'k = ∅ · offset 100' : 'k = v · offset 120', !lag);
  if (s < 4) out += arrow(235, 107, 715, 107, s === 2 ? '+CONTINUE · bytes 101…120' : s === 3 ? L(lang, 'FULLRESYNC → RDB + new writes', 'FULLRESYNC → RDB + новые записи') : 'SET k v · offset 120', { key: 'replication-stream', role: 'sync', motion: s >= 4 ? 'context' : undefined, color: lag ? C.line : C.blue, dashed: lag });
  if (s === 0) out += mCircle(25, 125, 'C', '', { key: 'replication-client', color: C.green, r: 18 }) + arrow(105, 125, 51, 125, '+OK', { key: 'replication-client-ok', role: 'reply', color: C.green });
  if (s === 2 || s === 3) out += arrow(715, 55, 235, 55, s === 2 ? 'PSYNC <id> 101' : 'PSYNC ? -1', { key: 'replication-request', role: 'request', color: C.red });
  if (s >= 4) out += mCircle(480, 28, 'C', '', { key: 'replication-client', color: C.green, r: 19 }) + arrow(445, 43, 235, 72, s === 4 ? 'WAIT 1 1000' : 'WAITAOF 1 1 1000', { key: 'replication-request', role: 'request', color: C.red });
  if (s >= 4) {
    out += arrow(235, 107, 715, 107, 'REPLCONF GETACK *', { key: 'replication-getack', role: 'sync', color: C.blue });
  }
  out += arrow(715, 162, 235, 162, s === 5 ? 'ACK 120 · FACK 120' : lag ? 'ACK 100' : 'ACK 120', { key: 'replication-ack', role: s >= 4 ? 'sync' : 'reply', motion: lag ? 'context' : 'flow', color: C.green });
  if (s >= 4) {
    out += arrow(235, 78, 445, 43, s === 4 ? ':1' : '*2 → 1, 1', { key: 'replication-wait-reply', role: 'reply', color: C.green, labelY: 85 });
  }
  if (s === 5) out += chip(330, 190, 300, 'AOF fsync → offset 120', { key: 'replication-fsync', size: 14, color: C.blue });
  out += chip(270, 244, 420, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? L(lang, 'FULLRESYNC → snapshot + stream', 'FULLRESYNC → снимок + поток') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : L(lang, lag ? 'primary replied; replica is behind' : 'replica applies the command stream', lag ? 'primary ответил; реплика отстаёт' : 'реплика применяет поток команд'), { code: s >= 2, size: 14, color: C.blue, stage: s >= 4 ? 4 : 2 });
  const notes = [L(lang, 'The primary can reply OK before a replica has applied the write.', 'Primary может вернуть OK до применения записи репликой.'), L(lang, 'Offsets track progress through the ordered replication stream.', 'Смещения показывают прогресс в упорядоченном потоке репликации.'), L(lang, 'A matching replication history and backlog permit partial synchronization.', 'Подходящая история и backlog позволяют частичную синхронизацию.'), L(lang, 'Without a usable backlog, a full sync sends the dataset and subsequent writes.', 'Без подходящего backlog полная синхронизация передаёт данные и новые записи.'), L(lang, 'WAIT counts replica acknowledgements; it does not turn Redis into Raft.', 'WAIT считает подтверждения реплик; он не превращает Redis в Raft.'), L(lang, 'WAITAOF waits for requested local and replica AOF fsync acknowledgements.', 'WAITAOF ждёт заданное число локальных и репличных подтверждений fsync AOF.')];
  return out + note(notes[s], { y: 305 });
}
function sentinel(s, lang) {
  let out = '';
  [180, 480, 780].forEach((x, i) => { out += node(`sentinel-${i}`, `<circle cx="${x}" cy="56" r="28" fill="${C.server}" stroke="${C.ink}" stroke-width="${s === 1 && i === 0 || s >= 2 ? 2 : 1}"/>${text(x, 62, `S${i + 1}`, { anchor: 'middle', color: C.white, size: 17 })}`); });
  out += text(480, 14, L(lang, s === 1 ? 'SDOWN · one observer suspects failure' : s === 2 ? 'ODOWN · configured quorum agrees' : 'Sentinel observers', s === 1 ? 'SDOWN · один наблюдатель видит сбой' : s === 2 ? 'ODOWN · кворум подтверждает сбой' : 'Наблюдатели Sentinel'), { anchor: 'middle', size: 15, color: C.muted });
  out += server(310, 180, L(lang, s >= 3 ? 'old primary' : 'Primary', s >= 3 ? 'бывший primary' : 'Primary'), s === 5 ? L(lang, 'k = v2 · isolated', 'k = v2 · изолирован') : s >= 1 ? L(lang, 'unreachable', 'недоступен') : 'k = v1', false, s >= 1 && s !== 5);
  out += server(665, 180, s >= 3 ? 'Primary' : L(lang, 'Replica', 'Реплика'), s >= 3 ? 'k = v1' : 'k = v1', s >= 3);
  if (s <= 2) [180, 480, 780].forEach((x, i) => { out += arrow(x, 95, 310 + (x - 480) * 0.1, 117, '', { key: `sentinel-probe-${i}`, role: 'request', color: s >= 1 ? C.muted : C.blue, dashed: s >= 1 }); });
  if (s === 0) out += arrow(355, 113, 475, 88, 'PONG', { key: 'sentinel-pong', role: 'reply', color: C.green });
  if (s === 1) out += arrow(180, 95, 280, 117, 'PING', { key: 'sentinel-timeout-probe', role: 'request', color: C.red });
  if (s === 2) out += arrow(210, 56, 440, 56, 'SDOWN', { key: 'sentinel-report', role: 'sync', color: C.blue });
  if (s === 3) out += arrow(530, 78, 665, 117, L(lang, 'promote', 'повысить'), { key: 'sentinel-promote', role: 'sync', color: C.blue });
  if (s === 4) {
    out += mCircle(480, 205, 'C', L(lang, 'Client', 'Клиент'), { color: C.green, r: 23 });
    out += text(480, 103, 'SENTINEL get-master-addr-by-name', { anchor: 'middle', size: 14 });
    out += arrow(455, 172, 455, 107, '', { key: 'sentinel-discover', role: 'request' });
    out += arrow(505, 107, 505, 172, L(lang, 'address', 'адрес'), { key: 'sentinel-address-reply', role: 'reply', color: C.green });
    out += arrow(515, 205, 625, 205, L(lang, 'connect', 'подключиться'), { key: 'sentinel-reconnect', motion: 'change', role: 'internal', color: C.blue, stage: 2 });
  }
  if (s === 5) out += node('sentinel-partition', `<path d="M485 112 V277" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="5 5"/>${text(485, 103, L(lang, 'partition', 'разделение'), { anchor: 'middle', size: 14 })}`, { motion: 'change', stage: 2 });
  return out + note(L(lang, s === 5 ? 'The new primary lacks v2: the old primary acknowledged it before replication.' : s === 4 ? 'Clients ask Sentinel for the primary, then reconnect to Redis.' : 'Failure detection and leader election are separate parts of failover.', s === 5 ? 'В новом primary нет v2: прежний primary подтвердил запись до репликации.' : s === 4 ? 'Клиент узнаёт primary у Sentinel, затем подключается к Redis.' : 'Обнаружение сбоя и выбор лидера — разные части переключения.'), { y: 305 });
}
function cluster(s, lang) {
  const slot = s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182';
  let out = chip(200, 20, 560, slot, { color: C.green, size: 16 });
  out += `<circle cx="65" cy="65" r="24" fill="${C.green}" stroke="${C.ink}" stroke-width="1.5"/>` + text(65, 71, 'C', { anchor: 'middle', bold: true, color: C.white, size: 16 }) + text(65, 112, L(lang, 'Client', 'Клиент'), { anchor: 'middle', size: 14 });
  out += server(150, 170, 'A', '0 … 5460', s === 0);
  out += server(480, 170, 'B', '5461 … 10922', s === 4);
  out += server(810, 170, 'C', '10923 … 16383', s === 2 || s === 3);
  if (s === 1 || s === 5) out += arrow(480, 65, 480, 105, 'CRC16', { key: 'cluster-hash', role: 'internal', color: C.blue });
  if (s === 0) out += text(480, 91, L(lang, '16384 slots', '16384 слота'), { anchor: 'middle', size: 17 });
  else if (s === 2) out += arrow(100, 65, 810, 110, 'GET key', { role: 'request', color: C.red });
  else if (s === 3) {
    out += arrow(130, 118, 88, 90, '', { key: 'cluster-moved', role: 'reply', color: C.green });
    out += text(215, 109, 'MOVED 12182 C', { size: 15, color: C.red });
    out += arrow(100, 65, 810, 110, L(lang, 'retry → C', 'повтор → C'), { key: 'cluster-retry', role: 'request', color: C.red });
  } else if (s === 4) {
    out += arrow(100, 65, 480, 110, 'ASKING + GET key', { key: 'cluster-ask-retry', role: 'request', color: C.red });
    out += arrow(780, 110, 100, 65, 'ASK 12182 B', { key: 'cluster-ask', role: 'reply', color: C.green });
    out += text(575, 100, L(lang, 'C → client: ASK 12182 B', 'C → клиент: ASK 12182 B'), { size: 15, color: C.red });
  } else out += text(480, 95, L(lang, 'same hash tag → same slot', 'одинаковый hash tag → один слот'), { anchor: 'middle', size: 16, color: C.green });
  return out + note(L(lang, s === 4 ? 'ASK redirects this request temporarily; the client sends ASKING to the target.' : s === 3 ? 'MOVED is a reply to the client, which updates its cached slot owner and retries.' : s === 5 ? 'MGET, transactions, and declared script keys require a shared slot.' : 'The client routes commands by slot, not by guessing which server holds the key.', s === 4 ? 'ASK временно перенаправляет запрос; клиент отправляет ASKING целевому серверу.' : s === 3 ? 'MOVED возвращается клиенту: он обновляет кеш владельца слота и повторяет запрос.' : s === 5 ? 'MGET, транзакциям и объявленным ключам скрипта нужен общий слот.' : 'Клиент направляет команду по слоту, а не угадывает сервер с ключом.'));
}
function pubsub(s, lang) {
  const payload=s===3?'next':s===5?'shard:hello':'hello';
  const publishing=[1,2,3,5].includes(s);
  let out = endpoint(5, 102, L(lang, 'Publisher B', 'Издатель B'), `${s===5?'SPUBLISH':'PUBLISH'} news ${payload}`, s === 1);
  out += node('pubsub-server', `<circle cx="480" cy="140" r="48" fill="${C.server}" stroke="${C.ink}" stroke-width="1.5"/>${text(480, 146, 'Redis', { anchor: 'middle', size: 19, color: C.white })}${text(480, 213, s === 5 ? L(lang, 'shard: news', 'шард: news') : L(lang, 'channel: news', 'канал: news'), { anchor: 'middle', size: 16 })}`);
  out += endpoint(745, 102, L(lang, 'Subscriber A', 'Подписчик A'), '', s === 2, s === 3 ? C.muted : C.green);
  const inbox=s===3?L(lang,'disconnected','отключён'):s===4?L(lang,'future messages only','только новые сообщения'):s===5?'"shard:hello"':s===2?'"hello"':L(lang,'inbox: empty','входящих нет');
  out += text(835, 233, inbox, {key:'pubsub-inbox',motion:'change',stage:2,pass:s===5?1:0,anchor:'middle',size:14});
  out += text(480, 249, `news → ${s === 3 ? '∅' : 'A'}`, { key: 'pubsub-targets', motion: 'change', stage: 2, anchor: 'middle', size: 16 });
  if (s === 0 || s === 4) out += arrow(790, 106, 542, 106, 'SUBSCRIBE news', { key: 'pubsub-subscribe', role: 'request', color: C.red });
  out += arrow(215, 133, 415, 133, publishing?payload:'', { key: 'pubsub-publish', color: publishing?C.red:C.line, role: 'request' });
  out += arrow(542, 158, 790, 158, s === 3 ? L(lang, 'missed', 'пропуск') : '', { key: 'pubsub-delivery-a', color: s===2||s===5?C.blue:C.line, dashed:s===3, role: 'sync', stage: 1 });
  return out + note(L(lang, s >= 3 ? 'A cannot replay a missed message: the channel stores no history.' : 'A message goes only to clients subscribed at delivery time.', s >= 3 ? 'A не прочитает пропущенное: канал не хранит историю.' : 'Сообщение идёт клиентам, подписанным в момент доставки.'), { y: 308 });
}
function streams(s, lang) {
  if (s === 5) {
    let out = chip(330, 25, 300, 'radix tree · rax', { key: 'stream-index', motion: 'change', pass: 0, size: 17 });
    out += arrow(420, 73, 245, 110, '1000-0', { role: 'internal', stage: 1, color: C.blue });
    out += arrow(540, 73, 715, 110, '1001-0', { role: 'internal', stage: 1, color: C.blue });
    out += box(80, 125, 330, 110, 'listpack', ['1000-0: job → A', '1000-1: job → B'], { key: 'stream-leaf-a', pass: 1, code: true, size: 16 });
    out += box(550, 125, 330, 110, 'listpack', ['1001-0: job → C', L(lang, 'packed entries', 'плотно упакованные записи')], { key: 'stream-leaf-b', pass: 1, code: true, size: 16 });
    return out + note(L(lang, 'The radix tree finds an ID range; a listpack stores its entries.', 'Radix tree находит диапазон ID; listpack хранит его записи.'));
  }
  let out = text(30, 25, 'stream: orders', { size: 17 });
  out += chip(30, 45, 635, '1000-0 · order:42', { key:'stream-entry-0',motion:s===0?'change':'context',size:16 });
  out += box(710, 20, 225, 108, 'PEL', [s <= 1 || s === 3 ? '∅' : `1000-0 → ${s === 4 ? 'B' : 'A'}`, L(lang, s <= 1 ? 'no group yet' : s === 3 ? 'acknowledged' : 'pending delivery', s <= 1 ? 'группы ещё нет' : s === 3 ? 'подтверждено' : 'ожидает ACK')], { key: 'stream-pending', active: s >= 2, pass: s === 4 ? 1 : 0, previousUntil: s === 4 ? 0 : undefined, code: true, size: 14 });
  if (s === 4) out += text(726, 77, ['1000-0 → A', L(lang, 'pending delivery', 'ожидает ACK')], { key: 'stream-pending-before-claim', motion: 'change', stage: 2, pass: 0, transient: true, size: 14, leading: 19 });
  out += endpoint(30, 142, L(lang, 'Consumer A', 'Обработчик A'), s === 0 ? 'XADD orders * order 42' : s === 1 ? 'XREAD STREAMS orders 0' : s === 3 ? 'XACK orders workers 1000-0' : s === 4 ? L(lang, 'stopped before ACK', 'сбой до ACK') : 'XREADGROUP → 1000-0', s === 1 || s === 2, s === 4 ? C.muted : C.green);
  out += endpoint(570, 142, L(lang, 'Consumer B', 'Обработчик B'), s === 4 ? 'XAUTOCLAIM → 1000-0' : 'XREADGROUP', s === 4, C.green);
  if (s === 0) out += arrow(125, 127, 125, 94, 'XADD', { role: 'request' });
  if (s === 1 || s === 2) out += arrow(155, 127, 155, 94, s === 1 ? 'XREAD' : 'XREADGROUP', { key: 'stream-read-request', role: 'request' });
  if (s === 0) out += arrow(260, 94, 180, 127, '1000-0', { key: 'stream-id-reply', role: 'reply', color: C.green });
  if (s === 3) out += arrow(695, 120, 165, 165, ':1', { key: 'stream-ack-reply', role: 'reply', color: C.green });
  if (s === 1 || s === 2) out += arrow(125, 94, 125, 127, '', { role: 'reply', color: C.green });
  if (s === 3) out += arrow(160, 145, 695, 105, 'XACK', { role: 'request', color: C.red });
  if (s === 4) out += arrow(670, 142, 800, 133, 'XAUTOCLAIM', { key: 'stream-claim-request', role: 'request' }) + arrow(800, 142, 705, 170, L(lang, 'reclaim', 'забрать'), { key: 'stream-claim-delivery', role: 'reply', color: C.green });
  return out + note(L(lang, s === 4 ? 'Ownership moves A → B. Delivery can repeat: make processing safe to retry.' : s === 3 ? 'XACK clears pending work; the entry remains in the stream.' : s === 1 ? 'XREAD reads without removing entries; each reader keeps its own position.' : 'The stream holds entries; a group separately tracks unacknowledged work.', s === 4 ? 'Владение переходит A → B. Доставка может повториться: обработка должна это учитывать.' : s === 3 ? 'XACK убирает ожидание; сама запись остаётся в Stream.' : s === 1 ? 'XREAD читает без удаления; каждый читатель хранит свою позицию.' : 'Stream хранит записи; группа отдельно отслеживает работу без ACK.'), { y: 308 });
}
function specialized(s, lang) {
  const names = ['JSON', L(lang, 'Search', 'Поиск'), L(lang, 'Vectors', 'Векторы'), L(lang, 'Time series', 'Ряды времени'), 'Bitmap / Geo', L(lang, 'Probabilistic', 'Вероятностные')];
  let out = text(480, 28, names[s], { anchor: 'middle', size: 20 });
  if (s === 0) {
    out += chip(380, 60, 200, 'user:1', { motion: 'context' });
    out += arrow(425, 107, 245, 157, 'name', { role: 'internal', color: C.blue });
    out += arrow(535, 107, 715, 157, 'age', { role: 'internal', color: C.blue });
    out += chip(100, 178, 300, 'name: "Alice"', { key: 'json-name' });
    out += chip(560, 178, 300, 'age: 31', { key: 'json-age' });
    out += text(480, 255, '$.age: 30 → 31', { key: 'json-result', motion: 'change', stage: 2, anchor: 'middle', size: 18 });
  } else if (s === 1) {
    out += chip(80, 105, 230, '"redis"', { motion: 'context' });
    out += arrow(330, 122, 490, 122, L(lang, 'lookup', 'поиск'), { role: 'internal', color: C.blue });
    out += box(510, 77, 370, 105, L(lang, 'Inverted index', 'Инвертированный индекс'), ['doc:2 → doc:7 → doc:12'], { key: 'search-posting', titleSize: 17, size: 16 });
    out += text(480, 246, L(lang, 'term → posting list → document IDs', 'термин → список вхождений → ID документов'), { anchor: 'middle', size: 17 });
  } else if (s === 2) {
    out += `<path d="M160 58 V238 H795" fill="none" stroke="${C.ink}" stroke-width="1"/>`;
    [[235, 207], [345, 174], [460, 132], [515, 150], [710, 78]].forEach(([x, y], i) => { out += node(`vector-${i}`, `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 6}" fill="${i === 2 ? C.green : C.server}"/>`, { motion: i === 2 ? 'change' : 'context' }); });
    out += `<circle cx="460" cy="132" r="75" fill="none" stroke="${C.ink}" stroke-dasharray="5 5"/>`;
    out += arrow(460, 132, 515, 150, '', { role: 'internal', color: C.blue });
    out += text(480, 268, L(lang, 'HNSW / FLAT → candidates → nearest neighbors', 'HNSW / FLAT → кандидаты → ближайшие соседи'), { anchor: 'middle', size: 17 });
  } else if (s === 3) {
    out += `<path d="M100 225 H635 M100 225 V65" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M150 150 L300 125 L450 200 L600 100" fill="none" stroke="${C.server}" stroke-width="2"/>`;
    [[150,150,21],[300,125,22],[450,200,19],[600,100,23]].forEach(([x,y,value])=>{out+=text(x,y-10,String(value),{size:14,anchor:'middle'});});
    out += arrow(650, 140, 725, 140, 'AVG', { role: 'internal', color: C.blue });
    out += chip(745, 123, 150, '21.25', { key: 'timeseries-average', size: 19 });
    out += text(480, 270, L(lang, 'Timestamped chunks → range aggregation', 'Чанки с временными метками → агрегация диапазона'), { anchor: 'middle', size: 17 });
  } else if (s === 4) {
    Array.from('10100100').forEach((bit, i) => { out += chip(100 + i * 96, 78, 80, bit, { key: `bitmap-bit-${i}`, color: bit === '1' ? C.blue : C.ink }); });
    out += text(480, 159, 'GETBIT flags 2 → 1', { anchor: 'middle', size: 17 });
    out += chip(100, 212, 250, 'longitude · latitude', { motion: 'context', size: 14 });
    out += arrow(370, 229, 570, 229, 'geohash', { role: 'internal', color: C.blue });
    out += chip(590, 212, 270, 'Sorted Set', { key: 'geo-index' });
  } else {
    out += text(80, 70, L(lang, 'HyperLogLog registers', 'Регистры HyperLogLog'), { size: 16 });
    ['3', '0', '2', '5', '1', '0'].forEach((v, i) => { out += chip(80 + i * 90, 93, 75, v, { key: `hll-register-${i}` }); });
    out += arrow(650, 110, 740, 110, L(lang, 'estimate', 'оценить'), { role: 'internal', color: C.blue });
    out += text(790, 116, '≈ N', { key: 'hll-result', motion: 'change', stage: 2, anchor: 'middle', size: 20 });
    out += text(80, 185, L(lang, 'Bloom: hashes choose bit positions', 'Bloom: хеши выбирают позиции битов'), { size: 16 });
    Array.from('00101010').forEach((bit, i) => { out += chip(80 + i * 95, 207, 80, bit, { key: `bloom-bit-${i}`, color: bit === '1' ? C.blue : C.ink }); });
  }
  return out + note(L(lang, 'Each structure trades memory for particular operations and accuracy.', 'Каждая структура меняет расход памяти на операции и точность.'), { y: 315 });
}
const renderers = { 'first-key': firstKey, request, 'event-loop': eventLoop, dictionary, encodings, atomicity, transactions, scripting, blocking, locks, expiry, memory, latency, rdb, aof, replication, sentinel, cluster, pubsub, streams, specialized };
/** Render one of the 21 bilingual chapter diagrams. Values outside the story range are clamped. */
export function storyScene(id, step, lang = 'en', compact = false) {
  const locale = lang === 'ru' ? 'ru' : 'en';
  const s = Math.max(0, Math.min(5, Math.trunc(Number(step) || 0)));
  const title = (titles[id] || titles['first-key'])[locale === 'ru' ? 1 : 0];
  const description = L(locale, `${compact ? "Compact diagram. " : ""}Educational simulation, step ${s + 1} of 6. ${title}.`, `${compact ? "Компактная схема. " : ""}Учебная симуляция, шаг ${s + 1} из 6. ${title}.`);
  const markers = [C.red, C.green, C.blue, C.muted, C.line, C.ink].map(color => `<marker id="scene-arrow-${color.replace('#', '')}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8" fill="${color}"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${compact ? '0 0 420 360' : '0 0 960 330'}" data-chapter="${E(id)}" data-step="${s}" role="img" aria-label="${E(title)}. ${E(description)}" focusable="false"><title>${E(title)}</title><desc>${E(description)}</desc><defs>${markers}</defs>${compact ? compactScene(id, s, locale) : (renderers[id] || firstKey)(s, locale)}</svg>`;
}

// Compact diagrams are composed at their native width rather than scaled down.
// They focus on the current mechanism; the full desktop view remains available.
function mCircle(x, y, mark, label = '', opt = {}) {
  const r = opt.r || 29;
  return node(opt.key || `circle-${x}-${y}`, `<circle cx="${x}" cy="${y}" r="${r}" fill="${opt.failed ? '#999999' : opt.color || C.server}" stroke="${C.ink}" stroke-width="${opt.active ? 3 : 1}"/>${text(x, y + 6, mark, { anchor: 'middle', size: opt.size || 17, color: C.white })}${label ? text(x, y + r + 24, label, { anchor: 'middle', size: 14 }) : ''}${opt.failed ? `<path d="M${x-r+8} ${y-r+8} L${x+r-8} ${y+r-8} M${x+r-8} ${y-r+8} L${x-r+8} ${y+r-8}" stroke="${C.ink}" stroke-width="2"/>` : ''}`, { active: opt.active });
}
function mCell(x, y, w, label, opt = {}) {
  const h = opt.h || 32;
  return node(opt.key || `entry-${x}-${y}`, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + h / 2 + 5, label, { anchor: 'middle', size: opt.size || 14, color: opt.color || C.ink, code: true })}`, { active: opt.active, motion: opt.motion || 'change', stage: opt.stage, sequence: opt.sequence, transient: opt.transient, previousUntil: opt.previousUntil, pass: opt.pass });
}
function mNote(label) {
  const lines = [''];
  for (const word of String(label).split(' ')) { const i = lines.length - 1; if ((lines[i] + ' ' + word).trim().length > 43 && lines[i]) lines.push(word); else lines[i] += (lines[i] ? ' ' : '') + word; }
  return text(210, lines.length > 1 ? 320 : 338, lines, { size: 14, leading: 19, anchor: 'middle', color: C.muted, key: 'scene-caption', motion: 'change', stage: 4 });
}
function compactScene(id, s, lang) {
  const t = (en, ru) => L(lang, en, ru);
  let out = '';
  switch (id) {
    case 'first-key': {
      out += mCircle(75, 112, 'C', t('Client', 'Клиент'), { color: C.green, r: 29, key: 'first-key-client' });
      out += mCircle(345, 112, 'R', 'Redis', { r: 39, active: s === 2, key: 'first-key-server' });
      if (s === 5) {
        out += mCell(25, 16, 370, 'SET user:1 Bob', { key: 'first-key-command-set', motion: 'change', stage: 0, sequence: 0 });
        out += arrow(121, 91, 291, 91, '', { key: 'first-key-request-set', role: 'request', sequence: 0 });
        out += mCell(40, 235, 340, 'user:1 → "Bob"', { key: 'first-key-replacement', motion: 'change', stage: 2, sequence: 0, transient: true, size: 17 });
        out += arrow(291, 132, 121, 132, '+OK', { key: 'first-key-reply-set', color: C.green, role: 'reply', sequence: 0 });
        out += mCell(25, 16, 370, 'DEL user:1', { key: 'first-key-command-del', motion: 'change', stage: 0, sequence: 1 });
        out += arrow(121, 91, 291, 91, '', { key: 'first-key-request-del', role: 'request', sequence: 1 });
        out += mCell(40, 235, 340, 'user:1 → ∅', { key: 'first-key-value', motion: 'change', stage: 2, sequence: 1, previousUntil: 0, size: 17 });
        out += arrow(291, 132, 121, 132, ':1', { key: 'first-key-reply-del', color: C.green, role: 'reply', sequence: 1 });
      } else {
        out += mCell(25, 16, 370, s === 4 ? 'GET user:1' : 'SET user:1 Alice', { key: 'first-key-command', motion: 'context' });
        out += arrow(121, 91, 291, 91, '', { key: 'first-key-request', role: 'request' });
        out += mCell(40, 235, 340, s < 2 ? 'user:1 → ∅' : 'user:1 → "Alice"', { key: 'first-key-value', motion: s >= 2 ? 'change' : 'context', stage: 2, size: 17 });
        if (s >= 3) out += arrow(291, 132, 121, 132, s === 4 ? '"Alice"' : '+OK', { key: 'first-key-reply', color: C.green, role: 'reply' });
      }
      out += text(210, 219, 'RAM', { anchor: 'middle', size: 14 });
      return out + mNote(t(s === 1 ? 'Find the named key: it is absent.' : s === 5 ? 'Alice → Bob → missing: one named entry.' : 'The key points to a value in memory.', s === 1 ? 'Найти ключ: его пока нет.' : s === 5 ? 'Alice → Bob → нет ключа: одна запись.' : 'Ключ указывает на значение в памяти.'));
    }
    case 'request': {
      const fragment = s === 2 ? 'SET · user:1 · Ali…' : s >= 3 ? 'SET · user:1 · Alice' : t('TCP byte stream', 'Поток байтов TCP');
      out += box(40, 18, 340, 70, 'TCP', [fragment], { key: 'request-socket', active: s === 0, size: 14, titleSize: 16, code: true });
      if (s >= 1) out += arrow(210, 96, 210, 108, '', { key: 'request-buffer-transfer', role: 'internal', stage: 1, color: s <= 3 ? C.red : C.line });
      if (s >= 1) out += box(40, 118, 340, 70, t('Input buffer', 'Входной буфер'), [s === 2 ? t('ends at Ali → need ce', 'обрыв на Ali → нужны ce') : s >= 3 ? t('3 complete arguments', '3 полных аргумента') : '*3 · $3 · SET · …'], { key: 'request-buffer', active: s >= 1 && s <= 3, size: 14, titleSize: 16, code: true });
      if (s >= 3) out += arrow(210, 196, 210, 208, '', { key: 'request-parser-transfer', role: s === 5 ? 'reply' : 'internal', stage: 1, color: s >= 3 ? s === 5 ? C.green : C.red : C.line });
      if (s >= 3) out += box(40, 218, 340, 70, s === 5 ? t('Output buffer', 'Выходной буфер') : s === 4 ? t('Command checks', 'Проверки команды') : t('RESP parser', 'Разбор RESP'), [s === 5 ? '+OK\\r\\n' : s === 4 ? t('arity · ACL · state', 'аргументы · ACL · режим') : s < 3 ? t('need complete arguments', 'нужны полные аргументы') : 'SET user:1 Alice'], { key: 'request-parser', active: s >= 4, size: 14, titleSize: 16, code: true });
      return out + mNote(t(s === 2 ? 'Incomplete commands do not execute.' : 'TCP chunks are not RESP boundaries.', s === 2 ? 'Неполная команда пока не исполняется.' : 'Границы TCP и RESP различаются.'));
    }
    case 'event-loop': {
      ['A', 'B', 'C'].forEach((name, i) => { const selected = s === 2 && i === 0 || s === 3 && i === 1 || s === 5 && i === 0; out += mCircle(70 + i * 140, 43, name, [s === 5 ? 'EVAL' : 'SET', 'GET', 'PING'][i], { key: `event-client-${name}`, color: C.green, active: selected }); out += arrow(70 + i * 140, 115, 70 + i * 140, 139, '', { key: `event-request-${name}`, role: 'request', color: selected || s === 1 ? C.red : C.line, dashed: s === 5 && i === 2 }); });
      out += mCircle(210, 192, 'R', 'Redis · event loop', { key: 'event-loop-server', r: 40 });
      out += text(210, 292, s === 2 ? 'A: user:1 → Alice' : s === 3 ? 'B: GET → "Alice"' : s === 5 ? t('EVAL busy · C waits', 'EVAL занят · C ждёт') : s === 4 ? t('I/O threads · fsync · lazyfree', 'I/O threads · fsync · lazyfree') : t('poll → read → execute → reply', 'poll → чтение → команда → ответ'), { key: 'event-loop-execution', motion: 'change', stage: 2, anchor: 'middle', size: 14 });
      if (s === 2 || s === 3) out += arrow(s === 2 ? 174 : 246, 231, s === 2 ? 70 : 210, 270, s === 2 ? '+OK' : '"Alice"', { role: 'reply', color: C.green });
      return out + mNote(t(s === 5 ? 'Long execution delays other commands.' : 'Ready sockets share one executor.', s === 5 ? 'Долгое исполнение задерживает команды.' : 'Готовые сокеты делят исполнитель.'));
    }
    case 'dictionary': {
      out += mCell(25, 15, 370, t('hash(user:1) → bucket 2', 'хеш(user:1) → ячейка 2'), { active: s <= 1 });
      out += text(95, 86, t('old · 4', 'старая · 4'), { anchor: 'middle', size: 14, bold: true });
      ['0 ∅', '1 ∅', s === 5 ? '2 ∅' : '2 user:2 → user:1', '3 c'].forEach((v, i) => { out += mCell(16, 101 + i * 34, 164, v, { active: i === 2 && s >= 1 && s <= 3, color: i === 2 && s >= 1 && s <= 3 ? C.red : undefined }); });
      if (s >= 4) {
        out += text(315, 73, t('new · 8', 'новая · 8'), { anchor: 'middle', size: 14, bold: true });
        Array.from({ length: 8 }, (_, i) => `${i} ${s === 5 && i === 2 ? 'user:2' : s === 5 && i === 6 ? 'user:1' : '∅'}`).forEach((v, i) => { out += mCell(235, 85 + i * 27, 169, v, { h: 25, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
        out += arrow(188, 182, 225, 182, '', { color: C.blue, role: 'internal', stage: 1 });
      } else {
        out += text(300, 130, s >= 2 ? ['user:2 ≠ user:1', '↓', 'user:1 = user:1', '↓', '"Alice"'] : [t('select bucket', 'выбрать ячейку'), '↓', '2'], { size: 14, leading: 26, anchor: 'middle' });
        out += arrow(188, 182, 215, 182, '', { color: C.blue, role: 'internal', stage: 1 });
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
        out += arrow(210, 169, 210, 176, '', { role: 'internal', color: C.blue });
      } else if (s === 1) {
        out += text(210, 70, 'listpack → quicklist', { anchor: 'middle', size: 16 });
        out += box(30, 115, 160, 97, 'listpack', ['A | B | C'], { size: 14, titleSize: 16, code: true });
        out += box(230, 115, 160, 97, 'listpack', ['D | E | F'], { size: 14, titleSize: 16, code: true });
        out += arrow(197, 161, 222, 161, '', { color: C.blue, role: 'internal', stage: 1 });
        out += text(210, 268, t('linked compact blocks', 'связанные компактные блоки'), { anchor: 'middle', size: 14 });
      } else {
        const compact = s === 2 ? ['intset / listpack', '[ 2, 5, 8, 13 ]'] : s === 3 ? ['listpack', 'name | Alice | age | 30'] : s === 4 ? ['listpack', 'Alice: 10 | Bob: 20'] : ['listpack / intset', t('compact entries', 'плотные записи')];
        const expanded = s === 2 ? ['hashtable', '2 · 5 · 8 · 13 · …'] : s === 3 ? ['hashtable', 'name → "Alice"'] : s === 4 ? ['skiplist + hashtable', '10 → 20 → 35'] : ['hashtable / skiplist', t('more entries / larger values', 'больше записей / крупнее значения')];
        out += box(40, 67, 340, 84, compact[0], [compact[1]], { size: 14, titleSize: 16, code: true });
        out += arrow(210, 163, 210, 191, '', { color: C.blue, role: 'internal', stage: 1 });
        out += box(40, 203, 340, 84, expanded[0], [expanded[1]], { active: true, size: 14, titleSize: 16, code: true });
      }
      return out + mNote(t('One data type can use different encodings.', 'У одного типа бывают разные упаковки.'));
    }
    case 'atomicity': {
      const incr = s >= 4;
      out += mCircle(65, 42, 'A', s === 1 ? 'GET count' : s === 2 ? 'SET count 1' : s === 4 ? 'INCR count' : s === 0 ? 'GET → SET' : t('local: 1', 'локально: 1'), { color: C.green });
      out += mCircle(355, 42, 'B', s === 1 ? 'GET count' : s === 3 ? 'SET count 1' : s === 5 ? 'INCR count' : s === 0 ? 'GET → SET' : t('local: 1', 'локально: 1'), { color: C.green });
      out += mCircle(210, 185, 'R', 'Redis', { r: 37 });
      out += mCell(90, 270, 240, `count = ${s <= 1 ? 0 : s === 5 ? 2 : 1}`, { key: 'atomicity-value', size: 19 });
      if (s === 1 || s === 2 || s === 4) {
        out += arrow(85, 112, 171, 156, '', { key: 'atomicity-a-request', role: 'request' });
        out += arrow(165, 180, 60, 128, s === 1 ? '"0"' : incr ? ':1' : '+OK', { key: 'atomicity-a-reply', role: 'reply', color: C.green });
      }
      if (s === 1 || s === 3 || s === 5) {
        out += arrow(335, 112, 249, 156, '', { key: 'atomicity-b-request', role: 'request' });
        out += arrow(255, 180, 360, 128, s === 1 ? '"0"' : incr ? ':2' : '+OK', { key: 'atomicity-b-reply', role: 'reply', color: C.green });
      }
      return out + mNote(t(s === 3 ? 'Two writes of 1 lose one update.' : s === 5 ? 'The second INCR starts from 1.' : incr ? 'INCR reads and writes atomically.' : 'A read and a write are separate commands.', s === 3 ? 'Две записи числа 1 теряют обновление.' : s === 5 ? 'Второй INCR начинает с 1.' : incr ? 'INCR читает и записывает атомарно.' : 'Чтение и запись — отдельные команды.'));
    }
    case 'transactions': {
      if (s === 2 || s === 3) {
        out += mCircle(80, 40, 'A', 'WATCH count', { color: C.green });
        out += mCircle(340, 40, 'B', s === 3 ? 'INCR count' : '—', { color: C.green });
        out += mCell(35, 133, 350, s === 3 ? 'count = 1 · A dirty' : 'count = 0 · WATCH active', { active: true });
        out += arrow(210, 177, 210, 206, '', { color: C.blue });
        out += mCell(35, 220, 350, s === 3 ? 'EXEC → (nil)' : 'GET count → "0"', { color: s === 3 ? '#b44c34' : C.green });
      } else {
        out += text(210, 29, s === 0 ? t('MULTI → queue', 'MULTI → очередь') : 'EXEC', { anchor: 'middle', size: 18, bold: true });
        out += mCell(35, 76, 350, s === 4 ? 'SET a text → OK' : s === 5 ? 'MULTI' : 'SET a 1', { color: s === 1 || s === 4 ? C.green : undefined });
        out += mCell(35, 127, 350, s === 4 ? 'INCR a → ERR integer' : s === 5 ? 'SET a → ERR' : 'INCR b', { color: s >= 4 ? '#b44c34' : undefined });
        out += arrow(210, 173, 210, 205, '', { color: C.blue });
        out += mCell(35, 220, 350, s === 0 ? 'QUEUED' : s === 5 ? t('EXECABORT · no writes', 'EXECABORT · без записей') : s === 4 ? 'SET b 2 → OK' : 'a = 1 · b = 1', { active: true });
      }
      out += arrow(20, 65, 20, 115, '', { key: 'transaction-request', role: 'request' });
      out += arrow(400, 240, 400, 190, '', { key: 'transaction-result', role: 'reply', color: C.green });
      return out + mNote(t(s === 4 ? 'A runtime error does not roll back SET.' : s === 5 ? 'Queue-time errors abort execution.' : s === 3 ? 'A changed watched key cancels EXEC.' : 'EXEC runs queued commands together.', s === 4 ? 'Ошибка исполнения не откатывает SET.' : s === 5 ? 'Ошибка в очереди отменяет исполнение.' : s === 3 ? 'Изменённый ключ отменяет EXEC.' : 'EXEC исполняет очередь вместе.'));
    }
    case 'scripting': {
      out += mCircle(65, 35, 'A', s === 4 ? 'FCALL' : s === 3 ? 'EVALSHA' : 'EVAL', { color: C.green, r: 24 });
      out += mCircle(355, 35, 'B', t('waits', 'ждёт'), { color: C.green, r: 24 });
      const lines = s === 3 ? ['SCRIPT LOAD → SHA1', t('EVALSHA → cached script', 'EVALSHA → кеш скрипта'), t('NOSCRIPT → load again', 'NOSCRIPT → загрузить заново')] : s === 4 ? ['FUNCTION LOAD', 'FCALL hello 0', 'return "hello"'] : s === 2 ? ['SET a 1', 'error("stop")', 'a = 1'] : ['INCR visits', 'if n == 1: EXPIRE visits 60', s === 5 ? 'long loop … → BUSY' : 'return n'];
      out += text(210, 107, t('Redis · executor', 'Redis · исполнитель'), { anchor: 'middle', size: 16, bold: true });
      lines.forEach((v, i) => { out += mCell(35, 132 + i * 48, 350, v, { active: i === (s === 1 ? 1 : s === 2 || s === 5 ? 2 : 0), color: s === 2 && i === 2 ? '#b44c34' : undefined }); });
      out += arrow(80, 104, 120, 119, '', { key: 'script-request', role: 'request' });
      if (s !== 5) out += arrow(305, 119, 345, 104, s === 2 ? 'ERR' : s === 3 ? '"Alice"' : s === 4 ? '"hello"' : ':1', { key: 'script-reply', role: 'reply', color: C.green, labelX: 365 });
      return out + mNote(t(s === 2 ? 'Earlier writes survive a script error.' : s === 5 ? 'After the threshold: BUSY, not automatic termination.' : s === 3 ? 'The cache may be missing: handle NOSCRIPT.' : 'Another client cannot interleave commands.', s === 2 ? 'Ранние записи остаются после ошибки.' : s === 5 ? 'После порога: BUSY, без автоматической остановки.' : s === 3 ? 'Кеш может исчезнуть: обработать NOSCRIPT.' : 'Другой клиент не вклинит свои команды.'));
    }
    case 'blocking': {
      out += mCircle(70, 39, 'A', s === 4 || s === 5 ? 'BLPOP jobs 0' : 'BLPOP jobs 5', { color: C.green });
      out += mCircle(350, 39, 'B', s === 2 ? 'RPUSH … task:1' : s === 4 ? 'BLPOP jobs 0' : 'GET user:1', { color: C.green, active: s === 1 });
      out += text(210, 135, 'Redis · jobs', { anchor: 'middle', bold: true, size: 17 });
      out += mCell(60, 164, 300, s === 2 ? '[ "task:1" ] → A' : '[ ]', { active: s === 2, size: 18, h: 44 });
      out += mCell(25, 254, 370, s === 2 ? t('A resumes with task:1', 'A получает task:1') : s === 3 ? t('timeout → (nil)', 'таймаут → (nil)') : s === 4 ? t('waiters: A → B', 'ожидают: A → B') : s === 5 ? t('A crashed after pop · jobs = [ ]', 'A упал после pop · jobs = [ ]') : t('A is parked · executor is free', 'A ждёт · исполнитель свободен'), { color: s === 2 ? C.green : C.muted });
      if (s === 0) out += arrow(90, 113, 150, 150, 'BLPOP', { role: 'request' });
      if (s === 1) out += arrow(330, 113, 270, 150, 'GET', { role: 'request' }) + arrow(270, 174, 330, 145, '"Alice"', { role: 'reply', color: C.green, labelX: 335 });
      if (s === 3) out += arrow(150, 174, 90, 145, '(nil)', { role: 'reply', color: C.green });
      if (s === 1) out += text(210, 232, 'B: GET user:1 → \"Alice\"', { anchor: 'middle', size: 14, color: C.blue });
      if (s === 2) out += arrow(350, 111, 350, 150, 'RPUSH', { role: 'request', color: C.red }) + arrow(150, 174, 90, 145, 'task:1', { role: 'reply', color: C.green });
      return out + mNote(t(s === 5 ? 'A list pop has no acknowledgement step.' : 'Waiting for a list parks only that client.', s === 5 ? 'У pop из списка нет шага подтверждения.' : 'Ожидание списка паркует только клиента.'));
    }
    case 'locks': {
      if(s===3||s===5){
        const fenced=s===5;
        out+=mCircle(75,42,'A',fenced?'write(fence=41)':'write(resource)',{color:C.green});
        if(!fenced)out+=mCircle(345,42,'B','write(resource)',{color:C.green});
        out+=mCell(30,165,360,t('External resource','Внешний ресурс'),{key:'lock-external-resource',active:true});
        out+=mCell(30,226,360,fenced?'highest fence = 42':t('A and B can both write','A и B могут писать'));
        out+=arrow(75,115,175,150,fenced?'41':'write',{key:'lock-external-a',role:'request'});
        if(!fenced)out+=arrow(345,115,245,150,'write',{key:'lock-external-b',role:'request'});
        if(fenced)out+=arrow(175,205,75,145,t('rejected','отклонено'),{key:'lock-fenced-reply',role:'reply',color:C.green});
        return out+mNote(t(fenced?'Fencing is enforced by the external resource.':'A expires but can resume later.',fenced?'Fencing проверяет внешний ресурс.':'Срок A истёк, но A может проснуться.'));
      }
      out += mCircle(75, 42, 'A', s >= 3 ? t('old token-A', 'старый token-A') : 'token-A', { color: C.green });
      out += mCircle(345, 42, 'B', 'token-B', { color: C.green });
      if (s === 2) out += mCell(45, 142, 330, 'lock → ∅', { key: 'lock-expired', pass: 0, transient: true, size: 17, h: 42 });
      out += mCell(45, 142, 330, `lock → ${s < 2 ? 'token-A' : 'token-B'}`, { key: 'lock-value', pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 17, h: 42 });
      if (s === 0 || s >= 3) out += arrow(75, 111, 175, 132, '', { role: 'request' });
      if (s === 1 || s === 2) out += arrow(345, 111, 245, 132, '', { role: 'request' });
      if (s === 0 || s === 1 || s === 4) out += arrow(205, 190, s === 1 ? 345 : 75, 200, s === 0 ? '+OK' : s === 1 ? '(nil)' : ':0', { role: 'reply', color: C.green });
      out += text(210, 222, s === 1 ? 'SET … NX → (nil)' : s === 4 ? t('token-A ≠ token-B → keep lock', 'token-A ≠ token-B → не удалять') : s === 5 ? t('external fence: reject old token', 'внешний fence: старый номер отклонён') : s >= 2 ? t('A expired · B acquired the lease', 'срок A истёк · аренда у B') : 'SET lock token-A NX PX 5000', { key: 'lock-status', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, anchor: 'middle', size: 14 });
      out += `<path d="M30 270 H390" stroke="${C.line}" stroke-width="3"/>`;
      out += mCell(30, 253, 170, t('token-A: 0…5s', 'token-A: 0…5с'), { color: s < 2 ? C.green : C.muted });
      if (s >= 2) out += mCell(220, 253, 170, t('token-B: 5…10s', 'token-B: 5…10с'), { key: 'lock-b-timeline', pass: s === 2 ? 1 : 0, color: C.blue });
      if (s === 5) out += arrow(210, 210, 345, 200, t('rejected', 'отклонено'), { role: 'reply', color: C.green });
      return out + mNote(t(s >= 3 ? 'An expired client can wake up later.' : 'NX grants a time-limited lease.', s >= 3 ? 'Старый клиент может проснуться позже.' : 'NX выдаёт аренду на ограниченный срок.'));
    }
    case 'expiry': {
      if (s === 5) {
        out += mCircle(75, 90, 'P', 'Primary', { r: 31 });
        out += mCircle(345, 90, 'R', t('Replica', 'Реплика'), { r: 31 });
        out += mCell(15, 215, 180, 'session → ∅', { key: 'expiry-primary', pass: 0 });
        out += arrow(121, 90, 299, 90, 'DEL / UNLINK', { key: 'expiry-propagation', role: 'sync', color: C.blue });
        out += mCell(225, 215, 180, 'session → ∅', { key: 'expiry-replica', pass: 1 });
        return out + mNote(t('Delete on primary, then on replica.', 'Удалить в primary, затем в реплике.'));
      }

      const gone = s === 2 || s === 3 || s === 5;
      out += mCircle(210, 35, 'T', s === 0 ? '10:00:02' : '10:00:06', { color: C.blue, r: 25 });
      out += text(25, 119, t('Key dictionary', 'Словарь ключей'), { size: 14, bold: true });
      out += mCell(25, 132, 370, gone ? 'session → ∅' : 'session → "abc"', { active: gone });
      out += text(25, 205, t('Expiry dictionary', 'Словарь сроков'), { size: 14, bold: true });
      out += mCell(25, 218, 370, gone || s === 4 ? 'session → ∅' : 'session → 10:00:05', { color: s === 1 ? '#b44c34' : C.blue });
      out += text(210, 286, s === 1 ? 'GET → (nil)' : s === 2 ? t('GET → lazy expiry', 'GET → ленивое удаление') : s === 3 ? t('active expiry → DEL', 'активная очистка → DEL') : s === 4 ? 'SET session abc → TTL -1' : s === 5 ? t('Primary → DEL → replica', 'Primary → DEL → реплика') : 'SET session abc EX 5', { size: 14, anchor: 'middle' });
      if (s === 2 || s === 4) out += arrow(25, 141, 25, 203, s === 2 ? 'GET' : 'SET', { role: 'request' }) + arrow(390, 203, 390, 141, s === 2 ? '(nil)' : '+OK', { role: 'reply', color: C.green });
      if (s === 3) out += arrow(210, 180, 210, 204, '', { role: 'internal', color: C.blue });
      return out + mNote(t(s === 1 ? 'Logically absent; bytes may remain.' : s === 4 ? 'Plain SET removes the old TTL.' : 'Access and active expiry remove old keys.', s === 1 ? 'Ключ недоступен; байты ещё могут быть.' : s === 4 ? 'Обычный SET снимает прежний TTL.' : 'Ключи убирают при чтении и очистке.'));
    }
    case 'memory': {
      if (s === 5) {
        out += text(210, 28, 'DEL / UNLINK', { anchor: 'middle', size: 18 });
        out += mCell(30, 70, 360, t('key is absent immediately', 'ключ сразу отсутствует'), { key: 'unlink-key', pass: 0 });
        out += mCell(30, 140, 360, t('UNLINK: memory awaits reclamation', 'UNLINK: память ждёт освобождения'), { key: 'unlink-pending', pass: 0, transient: true });
        out += arrow(210, 185, 210, 218, 'lazyfree', { key: 'unlink-background', role: 'internal', color: C.blue });
        out += mCell(30, 238, 360, t('memory is reclaimed', 'память освобождена'), { key: 'unlink-freed', pass: 1 });
        return out + mNote(t('DEL also frees during its execution.', 'DEL освобождает во время команды.'));
      }

      out += text(25, 28, 'maxmemory', { size: 17, bold: true });
      out += `<rect x="25" y="50" width="370" height="39" fill="${C.pale}" stroke="${C.ink}"/>`;
      [130, 110, s === 0 ? 75 : 130].forEach((w, i) => { out += `<rect x="${25 + [0, 130, 240][i]}" y="50" width="${w}" height="39" fill="${[C.red, C.green, C.blue][i]}"/>`; });
      ['hot:key', 'old:key', 'rare:key'].forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += mCell(25 + i * 127, 135, 116, gone ? `${v} → ∅` : v, { color: gone ? '#b44c34' : undefined }); });
      out += mCell(25, 212, 370, s === 1 ? 'allkeys-lru → old:key' : s === 2 ? 'allkeys-lfu → rare:key' : s === 3 ? t('noeviction → OOM error', 'noeviction → ошибка OOM') : s === 4 ? t('RSS = data + overhead + fragmentation', 'RSS = данные + расходы + фрагментация') : s === 5 ? 'DEL / UNLINK' : t('space for data is bounded', 'объём памяти для данных ограничен'), { active: true });
      if (s === 1 || s === 2) out += arrow(210, 102, 210, 121, t('sample', 'выборка'), { role: 'internal', color: C.blue });
      if (s === 5) out += text(210, 284, [t('DEL: remove + free', 'DEL: удалить + освободить'), t('UNLINK: remove → lazyfree', 'UNLINK: удалить → lazyfree')], { size: 14, anchor: 'middle', leading: 20 });
      if (s === 3) out += arrow(30, 190, 150, 190, 'SET', { role: 'request' }) + arrow(390, 190, 270, 190, 'OOM', { role: 'reply', color: C.green });
      return out + mNote(t(s === 5 ? 'For this large container, UNLINK defers reclamation.' : 'Eviction uses approximate candidates.', s === 5 ? 'Для этого большого контейнера UNLINK откладывает освобождение.' : 'Кандидат вытеснения выбирается примерно.'));
    }
    case 'latency': {
      if (s === 5) {
        out += text(210, 25, t('Find the delay', 'Найти задержку'), { anchor: 'middle', size: 18 });
        out += box(30, 60, 360, 68, t('Client round trip', 'Сетевой обмен клиента'), ['redis-cli --latency'], { key: 'latency-roundtrip', titleSize: 15, size: 14 });
        out += box(30, 147, 360, 68, t('Command execution', 'Исполнение команды'), ['SLOWLOG GET · LATENCY DOCTOR'], { key: 'latency-execution', titleSize: 15, size: 14 });
        out += box(30, 234, 360, 68, t('Output waiting', 'Ожидание отправки'), ['INFO clients · CLIENT LIST'], { key: 'latency-output', titleSize: 15, size: 14 });
        return out + mNote(t('SLOWLOG excludes network round trips.', 'SLOWLOG не включает сетевой обмен.'));
      }

      out += text(40, 28, t('Client', 'Клиент'), { size: 14, color: C.green });
      out += text(380, 28, 'Redis', { size: 14, anchor: 'end', color: C.red });
      out += `<path d="M40 45 V282 M380 45 V282" stroke="${C.line}" stroke-width="2"/>`;
      if (s === 0) {
        for (let i = 0; i < 3; i++) { out += arrow(50, 60 + i * 69, 370, 82 + i * 69, `GET ${['a', 'b', 'c'][i]}`); out += arrow(370, 98 + i * 69, 50, 119 + i * 69, '', { color: C.green }); }
      } else if (s === 1) {
        out += arrow(50, 66, 370, 93, 'GET a · GET b · GET c');
        out += mCell(80, 142, 260, t('shared network wait', 'общее сетевое ожидание'), { color: C.blue });
        out += arrow(370, 225, 50, 256, 'a · b · c', { color: C.green });
      } else {
        out += arrow(50, 67, 370, 93, s === 3 ? 'SCAN 0 COUNT 100' : s === 4 ? 'GET large:blob' : s === 5 ? 'SLOWLOG GET' : 'KEYS user:*');
        out += box(75, 137, 270, 92, s === 3 ? t('cursor → 84 → … → 0', 'курсор → 84 → … → 0') : s === 4 ? t('Output buffer', 'Выходной буфер') : s === 5 ? 'INFO · SLOWLOG' : t('Executor busy', 'Исполнитель занят'), [s === 4 ? t('[reply][reply][reply]', '[ответ][ответ][ответ]') : s === 3 ? t('repeat cursor calls', 'повторять с курсором') : s === 5 ? t('measure the delay', 'измерить задержку') : t('short commands wait', 'короткие команды ждут')], { size: 14, titleSize: 14, active: true, code: true });
        out += arrow(370, 253, 50, 275, t('reply', 'ответ'), { color: C.green });
      }
      return out + mNote(t(s === 1 ? 'Pipelining saves network waits.' : 'Network and execution both take time.', s === 1 ? 'Pipeline сокращает сетевые ожидания.' : 'И сеть, и исполнение занимают время.'));
    }
    case 'rdb': {
      const childActive = s >= 1 && s <= 3;
      out += text(95, 25, t('Parent', 'Родитель'), { size: 16, anchor: 'middle', bold: true });
      out += text(325, 25, t(childActive ? 'Child' : 'No child', childActive ? 'Потомок' : 'Нет потомка'), { size: 16, anchor: 'middle', bold: true });
      for (let i = 0; i < 3; i++) {
        const changed = i === 1 && s >= 2 && s < 5;
        out += mCell(20, 65 + i * 55, 150, `${i + 1}: ${changed ? 'Bob' : 'Alice'}`, { key: `rdb-parent-${i}`, color: changed ? C.green : undefined });
        if (childActive) out += mCell(250, 65 + i * 55, 150, `${i + 1}: Alice`, { key: `rdb-child-${i}`, color: C.blue });
        if (childActive && (s < 2 || i !== 1)) out += arrow(182, 81 + i * 55, 238, 81 + i * 55, '', { color: s === 1 ? C.blue : C.line, role: 'internal' });
      }
      if (s === 2) out += arrow(182, 136, 238, 136, 'COW', { key: 'rdb-copy', role: 'internal', color: C.blue });
      if (s === 3) out += arrow(325, 222, 260, 240, '', { key: 'rdb-write', role: 'internal', color: C.blue });
      if (s === 5) out += arrow(210, 240, 95, 212, 'load RDB', { key: 'rdb-recovery', role: 'internal', color: C.blue });
      out += mCell(65, 250, 290, s === 5 ? t('restart → user:1 = Alice', 'перезапуск → user:1 = Alice') : s === 3 ? t('dump.rdb → writing Alice', 'dump.rdb → запись Alice') : s === 4 ? t('dump.rdb → complete: Alice', 'dump.rdb → готово: Alice') : s === 0 ? 'RAM: user:1 = Alice' : t('fork → shared pages', 'fork → общие страницы'), { active: s >= 3 });
      return out + mNote(t(s === 5 ? 'Writes after the snapshot are absent.' : 'A write copies changed shared pages.', s === 5 ? 'Записей после снимка здесь нет.' : 'Запись копирует изменяемые общие страницы.'));
    }
    case 'aof': {
      const titles = s >= 4 ? [t('Current data', 'Текущие данные'), t('AOF files', 'Файлы AOF'), t('Recovery', 'Восстановление')] : ['Redis RAM', t('OS page cache', 'Кеш страниц ОС'), t('Storage', 'Накопитель')];
      const rows = s >= 4 ? [t('fork → new base', 'fork → новая основа'), t('base + incremental + manifest', 'основа + приращения + манифест'), s === 5 ? t('load base → replay incremental', 'основа → проиграть приращения') : t('publish manifest', 'публикация manifest')] : [s === 3 ? '∅' : t('SET Bob · AOF buffer', 'SET Bob · буфер AOF'), s === 3 ? '∅' : s >= 1 ? 'write() → SET Bob' : '∅', s === 3 ? 'Bob · fsynced' : s >= 2 ? 'fsync() → SET Bob' : '∅'];
      titles.forEach((name, i) => { out += box(40, 16 + i * 100, 340, 73, name, [rows[i]], { size: 14, titleSize: 16, active: i === Math.min(s, 2), code: true, pass: s === 3 && i < 2 ? 1 : undefined, previousUntil: s === 3 && i < 2 ? 0 : undefined, stateMotion: s === 3 && i === 2 ? 'context' : undefined }); if (i < 2) out += arrow(210, 96 + i * 100, 210, 107 + i * 100, '', { color: C.blue, role: 'internal', stage: 1 }); });
      if (s === 3) {
        out += text(56, 73, 'SET Carol · AOF buffer', { key: 'aof-crash-ram', size: 14, motion: 'change', pass: 0, transient: true });
        out += text(56, 173, 'write() → SET Carol', { key: 'aof-crash-os', size: 14, motion: 'change', pass: 0, transient: true });
      }
      return out + mNote(t(s === 3 ? 'Chosen crash: Carol is lost; fsynced Bob survives.' : s >= 4 ? 'The manifest selects files for recovery.' : 'write() and fsync() are separate steps.', s === 3 ? 'Выбранный сбой: Carol потеряна, Bob сохранён.' : s >= 4 ? 'Манифест выбирает файлы восстановления.' : 'write() и fsync() — разные шаги.'));
    }
    case 'replication': {
      out += mCircle(75, 75, 'P', 'Primary', { r: 31 });
      out += mCircle(345, 75, 'R', t('Replica', 'Реплика'), { r: 31 });
      if (s < 4) out += arrow(121, 56, 299, 56, s === 2 ? 'CONTINUE 101…120' : s === 3 ? t('RDB + stream', 'RDB + поток') : 'SET k v', { key: 'replication-stream', role: 'sync', motion: s >= 4 ? 'context' : undefined, color: s === 0 ? C.line : C.blue, dashed: s === 0 });
      if (s === 0) out += mCircle(210, 185, 'C', '', { color: C.green, r: 18 }) + arrow(105, 120, 185, 165, '+OK', { role: 'reply', color: C.green });
      if (s === 2 || s === 3) out += arrow(299, 23, 121, 23, s === 2 ? 'PSYNC <id> 101' : 'PSYNC ? -1', { role: 'request', color: C.red });
      if (s >= 4) out += mCircle(210, 185, 'C', '', { color: C.green, r: 18 }) + arrow(185, 165, 105, 120, s === 4 ? 'WAIT' : 'WAITAOF', { role: 'request', color: C.red });
      if (s >= 4) {
        out += arrow(121, 23, 299, 23, 'REPLCONF GETACK *', { key: 'replication-getack', role: 'sync', color: C.blue });
      }
      out += arrow(299, 96, 121, 96, s === 5 ? 'ACK 120 · FACK 120' : s === 0 ? 'ACK 100' : 'ACK 120', { key: 'replication-ack', role: s >= 4 ? 'sync' : 'reply', motion: s === 0 ? 'context' : 'flow', color: C.green });
      if (s >= 4) {
        out += arrow(60, 120, 190, 205, s === 4 ? ':1' : '[1,1]', { key: 'replication-wait-reply', role: 'reply', color: C.green });
      }
      if (s === 5) out += text(210, 220, 'AOF fsync → offset 120', { key: 'replication-fsync', size: 13, anchor: 'middle', motion: 'change', stage: 2, color: C.blue });
      out += text(75, 174, ['k = v', t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += text(345, 174, [s === 0 ? 'k = ∅' : 'k = v', s === 0 ? t('offset 100', 'смещение 100') : t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += mCell(25, 245, 370, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? t('FULLRESYNC → RDB + suffix', 'FULLRESYNC → RDB + приращения') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : s === 0 ? t('primary OK · replica is behind', 'primary OK · реплика отстаёт') : t('replica applies offset 120', 'реплика применила смещение 120'), { active: true, stage: s >= 4 ? 4 : 2 });
      return out + mNote(t(s === 5 ? 'WAITAOF waits for AOF fsync acknowledgements.' : 'An acknowledgement is not Raft consensus.', s === 5 ? 'WAITAOF ждёт подтверждений fsync AOF.' : 'Подтверждение — ещё не консенсус Raft.'));
    }
    case 'sentinel': {
      out += text(210, 20, s === 1 ? 'SDOWN' : s === 2 ? t('ODOWN · quorum', 'ODOWN · кворум') : s >= 3 ? t('election → failover', 'выборы → переключение') : 'Sentinel', { size: 16, anchor: 'middle' });
      [70, 210, 350].forEach((x, i) => { out += mCircle(x, 72, `S${i + 1}`, '', { key: `sentinel-${i}`, r: 23, color: C.server, active: s === 1 && i === 0 || s >= 2, size: 14 }); if (s <= 2) out += arrow(x, 107, 110, 157, '', { key: `sentinel-probe-${i}`, role: 'request', color: s >= 1 ? C.muted : C.blue, dashed: s >= 1 }); });
      out += mCircle(110, 209, 'P', s >= 3 ? t('old primary', 'старый primary') : 'Primary', { r: 35, failed: s >= 1 && s !== 5 });
      out += mCircle(310, 209, s >= 3 ? 'P' : 'R', s >= 3 ? 'Primary' : t('Replica', 'Реплика'), { r: 35, active: s >= 3 });
      if (s === 0) out += arrow(139, 157, 210, 110, 'PONG', { role: 'reply', color: C.green });
      if (s === 1) out += arrow(70, 107, 110, 157, 'PING', { role: 'request', color: C.red });
      if (s === 2) out += arrow(105, 72, 176, 72, '', { role: 'sync', color: C.blue });
      if (s === 3) out += arrow(235, 107, 310, 158, '', { key: 'sentinel-promote', role: 'sync', color: C.blue });
      if (s === 4) {
        out += mCircle(210, 136, 'C', '', { color: C.green, r: 18 });
        out += arrow(210, 111, 210, 102, '', { key: 'sentinel-discover', role: 'request' });
        out += arrow(221, 106, 221, 114, '', { key: 'sentinel-address-reply', role: 'reply', color: C.green });
        out += arrow(235, 151, 278, 181, '', { key: 'sentinel-reconnect', motion: 'change', stage: 2, role: 'internal', color: C.blue });
      }
      if (s === 5) out += node('sentinel-partition', `<path d="M210 139 V285" stroke="${C.ink}" stroke-dasharray="5 5"/>${text(110, 293, 'k = v2', { size: 14, anchor: 'middle' })}${text(310, 293, 'k = v1', { size: 14, anchor: 'middle' })}`, { motion: 'change', stage: 2 });
      else out += text(210, 294, s === 4 ? t('discover → reconnect to new primary', 'узнать адрес → новый primary') : s >= 3 ? t('replica is promoted', 'реплика повышена') : t('independent failure observations', 'независимые наблюдения за сбоем'), { anchor: 'middle', size: 14 });
      return out + mNote(t(s === 5 ? 'An acknowledged v2 was not replicated.' : 'Detection and election are separate.', s === 5 ? 'Подтверждённая v2 не дошла до реплики.' : 'Обнаружение сбоя и выборы различаются.'));
    }
    case 'cluster': {
      out += mCell(25, 13, 370, s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182');
      out += mCircle(210, 88, 'C', t('Client', 'Клиент'), { color: C.green, r: 24 });
      const target = s === 4 ? 1 : s === 2 || s === 3 ? 2 : -1;
      ['A', 'B', 'C'].forEach((name, i) => { out += mCircle(70 + i * 140, 224, name, ['0…5460', '5461…10922', '10923…16383'][i], { r: 29, active: i === target, size: 17 }); });
      if (target >= 0) out += arrow(210, 150, 70 + target * 140, 180, s === 4 ? 'ASKING + GET' : 'GET key', { key: 'cluster-retry', role: 'request', color: C.red });
      if (s === 1 || s === 5) out += arrow(210, 55, 210, 61, '', { role: 'internal', color: C.blue });
      if (s === 4) out += arrow(330, 180, 240, 150, '', { key: 'cluster-ask', role: 'reply', color: C.green });
      if (s === 3) out += arrow(92, 182, 180, 150, '', { key: 'cluster-moved', role: 'reply', color: C.green });
      out += text(210, 294, s === 3 ? t('A → client: MOVED 12182 C', 'A → клиент: MOVED 12182 C') : s === 4 ? t('C → client: ASK 12182 B', 'C → клиент: ASK 12182 B') : s === 5 ? t('multi-key → same slot required', 'много ключей → нужен один слот') : s === 1 ? t('same tag → same slot', 'один hash tag → один слот') : s === 2 ? t('client routes directly to C', 'клиент обращается сразу к C') : t('16384 slots', '16384 слота'), { size: 14, anchor: 'middle' });
      return out + mNote(t(s === 4 ? 'Client retries with ASKING on B.' : s === 3 ? 'Client updates its map and retries on C.' : 'Slot ownership tells the client where to go.', s === 4 ? 'Клиент повторяет с ASKING на B.' : s === 3 ? 'Клиент меняет карту и повторяет на C.' : 'Владелец слота задаёт маршрут клиента.'));
    }
    case 'pubsub': {
      const payload=s===3?'next':s===5?'shard:hello':'hello';
      out += mCircle(210, 40, 'B', `${s===5?'SPUBLISH':'PUBLISH'} news ${payload}`, { color: C.green, r: 25, active: s === 1 });
      if (s === 0 || s === 4) out += arrow(190, 235, 190, 198, 'SUBSCRIBE', { key: 'pubsub-subscribe', role: 'request', color: C.red, labelX: 105 });
      out += arrow(210, 108, 210, 123, '', { key: 'pubsub-publish', role: 'request', color: [1,2,3,5].includes(s)?C.red:C.line });
      out += mCircle(210, 167, 'R', s === 5 ? t('shard: news', 'шард: news') : t('channel: news', 'канал: news'), { r: 29 });
      out += arrow(230, 198, 230, 235, '', { key: 'pubsub-delivery-a', role: 'sync', stage: 1, color:s===2||s===5?C.blue:C.line,dashed:s===3 });
      out += mCircle(210, 260, 'A', '', { color: s === 3 ? C.muted : C.green, failed:s===3 });
      out += text(210, 305, s===3?t('offline','отключён'):s===4?t('new only','только новое'):s===5?'"shard:hello"':s===2?'"hello"':t('inbox: empty','входящих нет'), {key:'pubsub-inbox',motion:'change',stage:2,pass:s===5?1:0,anchor:'middle',size:14});
      return out + mNote(t(s === 5 ? 'SPUBLISH limits delivery to a shard.' : s >= 3 ? 'A cannot replay a missed message.' : 'Messages go to current subscribers.', s === 5 ? 'SPUBLISH ограничивает доставку шардом.' : s >= 3 ? 'A не может получить пропущенное.' : 'Сообщения идут текущим подписчикам.'));
    }
    case 'streams': {
      if (s === 5) {
        out += mCell(100, 35, 220, 'radix tree · rax', { key: 'stream-index', pass: 0 });
        out += arrow(170, 82, 110, 123, '1000-0', { role: 'internal', color: C.blue });
        out += arrow(250, 82, 310, 123, '1001-0', { role: 'internal', color: C.blue });
        out += box(20, 145, 180, 102, 'listpack', ['1000-0', 'job → A'], { key: 'stream-leaf-a', pass: 1, size: 14, titleSize: 16, code: true });
        out += box(220, 145, 180, 102, 'listpack', ['1001-0', 'job → B'], { key: 'stream-leaf-b', pass: 1, size: 14, titleSize: 16, code: true });
        return out + mNote(t('ID ranges lead to compact entry blocks.', 'Диапазоны ID ведут к компактным блокам.'));
      }
      out += text(25, 25, 'stream: orders', { size: 16, bold: true });
      out += mCell(25, 43, 370, '1000-0 · order:42');
      out += mCell(25, 116, 370, s <= 1 ? t('no consumer group yet', 'группы обработчиков ещё нет') : s === 3 ? 'PEL: ∅ · XACK' : s === 4 ? 'PEL: 1000-0 → B' : 'PEL: 1000-0 → A', { key: 'stream-pending', pass: s === 4 ? 1 : 0, previousUntil: s === 4 ? 0 : undefined, active: s >= 2 });
      if (s === 4) out += mCell(25, 116, 370, 'PEL: 1000-0 → A', { key: 'stream-pending-before-claim', pass: 0, transient: true, active: true });
      out += mCircle(90, 214, 'A', s === 0 ? 'XADD' : s === 1 ? 'XREAD' : s === 3 ? 'XACK' : s === 4 ? t('crashed', 'сбой') : 'XREADGROUP', { color: s === 4 ? C.muted : C.green });
      out += mCircle(330, 214, 'B', s === 4 ? 'XAUTOCLAIM' : 'XREADGROUP', { color: C.green, active: s === 4 });
      if (s === 4) out += arrow(310, 177, 310, 159, 'XAUTOCLAIM', { key: 'stream-claim-request', role: 'request' }) + arrow(270, 159, 270, 177, '', { key: 'stream-claim-delivery', role: 'reply', color: C.green });
      else out += arrow(90, 177, 90, 159, '', { role: 'request' }) + arrow(125, 159, 125, 177, s === 3 ? ':1' : '1000-0', { role: 'reply', color: C.green });
      return out + mNote(t(s === 3 ? 'XACK clears pending work, not the entry.' : s === 4 ? 'Retry delivery; keep processing idempotent.' : s === 1 ? 'XREAD reads without removing entries.' : 'The stream and its pending list differ.', s === 3 ? 'XACK убирает ожидание, не саму запись.' : s === 4 ? 'Повторная доставка требует идемпотентности.' : s === 1 ? 'XREAD читает без удаления записей.' : 'Stream и список ожидания — разные вещи.'));
    }
    case 'specialized': {
      const names = ['JSON', t('Search', 'Поиск'), t('Vectors', 'Векторы'), t('Time series', 'Ряды времени'), t('Bitmap / Geo', 'Биты / Гео'), t('Probabilistic', 'Вероятностные')];
      out += text(210, 30, names[s], { size: 18, anchor: 'middle', bold: true });
      if (s === 0) {
        out += mCell(135, 70, 150, 'user:1', {motion:'context'});
        out += arrow(170, 116, 110, 148, '', { role: 'internal', color: C.blue });
        out += arrow(250, 116, 310, 148, '', { role: 'internal', color: C.blue });
        out += mCell(25, 165, 170, 'name: Alice');
        out += mCell(225, 165, 170, 'age: 31');
        out += mCell(25, 247, 370, '$.age: 30 → 31', { active: true });
      } else if (s === 1) {
        out += mCell(80, 75, 260, '"redis"');
        out += arrow(210, 121, 210, 162, '', { role: 'internal', color: C.blue });
        out += mCell(40, 181, 340, 'doc:2 → doc:7 → doc:12', { active: true });
        out += text(210, 272, t('term → inverted index → document IDs', 'термин → индекс → ID документов'), { size: 14, anchor: 'middle' });
      } else if (s === 2) {
        out += `<path d="M65 80 V260 H365" stroke="${C.line}" fill="none" stroke-width="2"/>`;
        [[100, 210], [148, 186], [200, 148], [230, 160], [315, 90]].forEach(([x, y], i) => { out += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 6}" fill="${i === 2 ? C.green : C.red}"/>`; });
        out += arrow(200, 148, 230, 160, '', { role: 'internal', color: C.blue });
        out += `<circle cx="200" cy="148" r="48" fill="none" stroke="${C.blue}" stroke-dasharray="5 4"/>`;
        out += text(210, 295, t('HNSW / FLAT → nearest neighbors', 'HNSW / FLAT → ближайшие соседи'), { size: 14, anchor: 'middle' });
      } else if (s === 3) {
        out += `<path d="M45 245 H380 M45 245 V70" fill="none" stroke="${C.line}" stroke-width="2"/><path d="M70 170 L160 145 L250 220 L340 120" fill="none" stroke="${C.red}" stroke-width="3"/>`;
        [[70,170,21],[160,145,22],[250,220,19],[340,120,23]].forEach(([x,y,value])=>{out+=text(x,y-10,String(value),{size:14,anchor:'middle'});});
        out += arrow(365, 120, 365, 60, 'AVG', { role: 'internal', color: C.blue });
        out += text(210, 290, 'AVG(21, 22, 19, 23) = 21.25', {key:'timeseries-average',motion:'change',stage:2,size:14,anchor:'middle'});
      } else if (s === 4) {
        Array.from('10100100').forEach((bit, i) => { out += mCell(25 + i * 47, 85, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
        out += arrow(210, 135, 210, 163, 'geohash', { role: 'internal', color: C.blue });
        out += mCell(25, 182, 370, 'geo → geohash → Sorted Set');
        out += text(210, 266, t('bit position / geographic neighborhood', 'позиция бита / соседство на карте'), { size: 14, anchor: 'middle' });
      } else {
        out += text(25, 82, t('HyperLogLog · registers', 'HyperLogLog · регистры'), { size: 14 });
        ['3', '0', '2', '5', '1', '0'].forEach((v, i) => { out += mCell(25 + i * 63, 100, 54, v); });
        out += arrow(325, 154, 385, 154, 'hash', { role: 'internal', color: C.blue });
        out += text(25, 195, t('Bloom · hash → bit positions', 'Bloom · хеш → позиции битов'), { size: 14 });
        Array.from('00101010').forEach((bit, i) => { out += mCell(25 + i * 47, 214, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
      }
      return out + mNote(t('An index trades memory for specific queries.', 'Индекс меняет память на удобство поиска.'));
    }
    default: return compactScene('first-key', s, lang);
  }
}

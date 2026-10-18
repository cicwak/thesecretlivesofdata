/* The diagrams deliberately use a small, deterministic teaching model.
 * They illustrate the current story step; no Redis server is contacted. */
// The vocabulary follows the Raft illustration: plain circles, black outlines,
// monospace labels, square log entries and colored messages on a white canvas.
import { composeActors, getComposition, actorMarkup } from './composition.js';
import { resolveBeat, storyLength } from './beats.js';

let identityCounts = Object.create(null);
const identity = kind => `${kind}-${identityCounts[kind] = (identityCounts[kind] || 0) + 1}`;

const C = { ink: '#000000', muted: '#777777', line: '#d9dfdf', red: '#ff0000', green: '#008000', blue: '#0000ff', server: '#4682b4', pale: '#f5f5f5', white: '#fff' };
const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = (lang, en, ru) => lang === 'ru' ? ru : en;
function node(key, body, opt = {}) {
  const motion = opt.motion || 'context';
  return `<g class="${opt.flow ? 'flow' : 'scene-node'}${opt.active ? ' scene-active' : ''}" data-key="${E(key)}" data-motion="${motion}" data-stage="${opt.stage ?? (motion === 'change' ? 2 : 0)}"${opt.role ? ` data-role="${opt.role}"` : ''}${opt.from ? ` data-from="${E(opt.from)}"` : ''}${opt.to ? ` data-to="${E(opt.to)}"` : ''}${opt.sequence !== undefined ? ` data-sequence="${opt.sequence}"` : ''}${opt.transient ? ' data-transient="true"' : ''}${opt.previousUntil !== undefined ? ` data-previous-until="${opt.previousUntil}"` : ''}${opt.pass !== undefined ? ` data-pass="${opt.pass}"` : ''}>${body}</g>`;
}
function text(x, y, lines, opt = {}) {
  const rows = Array.isArray(lines) ? lines : [lines];
  const size = opt.size || 17;
  const body = `<text x="${x}" y="${y}" text-anchor="${opt.anchor || 'start'}" fill="${opt.color || C.ink}" font-family="Courier New, Courier, monospace" font-size="${size}" font-weight="${opt.bold ? 600 : 400}" class="${opt.code ? 'scene-code' : 'scene-label'}">${rows.map((r, i) => `<tspan x="${x}" dy="${i ? opt.leading || size + 7 : 0}">${E(r)}</tspan>`).join('')}</text>`;
  return opt.motion ? node(opt.key || identity('label'), body, opt) : body;
}
function box(x, y, w, h, title, body = [], opt = {}) {
  const size = opt.size || 16, max = Math.floor((w - 32) / (size * 0.61));
  const lines = [];
  for (const row of (Array.isArray(body) ? body : [body])) {
    let current = '';
    for (const word of String(row).split(' ')) { if ((current + ' ' + word).trim().length > max && current) { lines.push(current); current = word; } else current += (current ? ' ' : '') + word; }
    lines.push(current);
  }
  const key = opt.key || identity('panel');
  const content = lines.length ? text(x + 16, y + 57, lines, { size, leading: size + 5, code: opt.code, color: opt.bodyColor, key: `${key}-value`, motion: opt.stateMotion || (body.length ? 'change' : 'context'), stage: opt.stage ?? 2, pass: opt.pass, previousUntil: opt.previousUntil }) : '';
  return node(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"${opt.dashed ? ' stroke-dasharray="5 5"' : ''}/>${text(x + 16, y + 29, title, { size: opt.titleSize || 18, color: opt.color })}${content}`, { active: opt.active });
}
function chip(x, y, w, label, opt = {}) {
  return node(opt.key || identity('entry'), `<rect x="${x}" y="${y}" width="${w}" height="${opt.h || 34}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + 23, label, { code: opt.code !== false, size: opt.size || 15, anchor: 'middle', color: opt.color || C.ink })}`, { active: opt.active, motion: opt.motion || 'change', stage: opt.stage, sequence: opt.sequence, transient: opt.transient, previousUntil: opt.previousUntil, pass: opt.pass });
}
function arrow(x1, y1, x2, y2, label = '', opt = {}) {
  const color = opt.color || C.red;
  const role = opt.role || (color === C.green ? 'reply' : color === C.blue ? 'sync' : 'request');
  const active = color !== C.line && !opt.dashed;
  const stage = opt.stage ?? (role === 'reply' ? 3 : 1);
  return node(opt.key || identity('flow'), `<path d="${opt.path || `M${x1} ${y1} L${x2} ${y2}`}" fill="none" stroke="${color}" stroke-width="1.5"${opt.dashed ? ' stroke-dasharray="5 5"' : ''} marker-end="url(#scene-arrow-${color.replace('#', '')})"/>${label ? `<text x="${opt.labelX ?? (x1 + x2) / 2}" y="${opt.labelY ?? (y1 + y2) / 2 - 10}" text-anchor="middle" font-family="Courier New, Courier, monospace" font-size="15" fill="${color === C.line ? C.muted : color}" stroke="white" stroke-width="5" paint-order="stroke">${E(label)}</text>` : ''}`, { flow: true, role, motion: opt.motion || (active ? 'flow' : 'context'), stage, sequence: opt.sequence, from: opt.from, to: opt.to });
}
function note() { return ''; }
function endpoint(x, y, label, detail, active = false, color = C.green, key = identity('client')) {
  const words = String(detail).split(' '), rows = [''];
  for (const word of words) { const i = rows.length - 1; if ((rows[i] + ' ' + word).trim().length > 24 && rows[i]) rows.push(word); else rows[i] += (rows[i] ? ' ' : '') + word; }
  const mark = /[ABCS][0-9]?$/.test(label) ? label.match(/[ABCS][0-9]?$/)[0] : 'C';
  return node(key, `<circle cx="${x + 90}" cy="${y + 29}" r="27" fill="${color === C.muted ? C.muted : C.green}" stroke="${C.ink}" stroke-width="${active ? 2 : 1}"/>${text(x + 90, y + 35, mark, { size: 18, anchor: 'middle', color: C.white })}${text(x + 90, y + 76, label, { size: 14, anchor: 'middle' })}${text(x + 90, y + 100, rows, { size: 14, leading: 18, anchor: 'middle', code: true, key: `${key}-command`, motion: 'change', stage: 0 })}`, { active });
}
function server(x, y, label, detail, active = false, failed = false, key = identity('server')) {
  const mark = /^[ABC]$/.test(label) ? label : /[Pp]rimary/.test(label) ? 'P' : 'R';
  return node(key, `<circle cx="${x}" cy="${y}" r="45" fill="${failed ? '#999999' : C.server}" stroke="${C.ink}" stroke-width="${active ? 3 : 1}"/>${text(x, y + 6, mark, { size: 22, anchor: 'middle', color: C.white })}${failed ? `<path d="M${x-24} ${y-24} L${x+24} ${y+24} M${x+24} ${y-24} L${x-24} ${y+24}" stroke="${C.ink}" stroke-width="2"/>` : ''}${text(x, y + 69, label, { size: 15, anchor: 'middle' })}${text(x, y + 92, detail, { size: 14, anchor: 'middle', key: `${key}-value`, motion: 'change', stage: 2 })}`, { active });
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
const placedActor = (actor, body, focus = false) => actorMarkup({ ...actor, x: 0, y: 0 }, body, focus, actor.x, actor.y);
function firstKey(s, lang, compact = false, operation) {
  const spec = getComposition('first-key', s, compact);
  const client = spec.actors.find(a => a.key === 'first-key-client');
  const redis = spec.actors.find(a => a.key === 'first-key-server');
  let out = placedActor(client, endpoint(-90, -29, L(lang, 'Client', 'Клиент'), s === 0 ? 'SET user:1 Alice' : '', s === 0, C.green, 'first-key-client'), spec.focal === client.key);
  if (!redis) return out;
  let memory = server(0, 0, 'Redis', '', s === 2, false, 'first-key-server');
  const value = s < 2 ? 'user:1 → ∅' : s === 5 ? operation === 1 ? 'user:1 → ∅' : 'user:1 → "Bob"' : 'user:1 → "Alice"';
  memory += text(0, 116, value, { key: 'first-key-value', motion: s >= 2 ? 'change' : 'context', stage: 2, sequence: s === 5 ? operation || 0 : undefined, anchor: 'middle', size: compact ? 16 : 18, code: true });
  memory += text(0, 140, 'RAM', { size: 14, anchor: 'middle', color: C.muted });
  out += placedActor(redis, memory, spec.focal === redis.key);
  const requestY = redis.y - 17, replyY = redis.y + 23;
  const command = s === 4 ? 'GET user:1' : s === 5 ? operation === 1 ? 'DEL user:1' : 'SET user:1 Bob' : 'SET user:1 Alice';
  const sequence = s === 5 ? operation || 0 : 0;
  out += arrow(client.x + 25, requestY, redis.x - 46, requestY, command, { from: client.key, to: redis.key, key: 'first-key-request', sequence, role: 'request', labelY: requestY - 13 });
  if (s >= 3) out += arrow(redis.x - 42, replyY, client.x + 18, replyY, s === 4 ? '"Alice"' : s === 5 && operation === 1 ? ':1' : '+OK', { from: redis.key, to: client.key, key: 'first-key-reply', sequence, role: 'reply', color: C.green });
  if (s === 1) out += text((client.x + redis.x) / 2, redis.y + 100, L(lang, 'Find user:1 → absent', 'Найти user:1 → нет ключа'), { key: 'first-key-lookup', motion: 'change', stage: 2, anchor: 'middle', size: compact ? 13 : 16 });
  return out;
}
function request(s, lang, compact = false) {
  const spec = getComposition('request', s, compact);
  const labels = [L(lang, 'TCP socket', 'TCP-сокет'), L(lang, 'Input buffer', 'Входной буфер'), L(lang, 'RESP parser', 'Разбор RESP'), L(lang, 'Command checks', 'Проверки'), L(lang, 'Output buffer', 'Выходной буфер')];
  const bodies = [L(lang, 'ordered bytes', 'поток байтов'), s === 2 ? 'SET user:1 Ali…' : s >= 3 ? 'SET user:1 Alice' : '*3 · $3 · SET …', 'SET user:1 Alice', compact ? L(lang, 'arity · ACL · state', 'аргументы · ACL · режим') : [L(lang, 'arity · ACL', 'аргументы · ACL'), L(lang, 'server state', 'режим сервера')], '+OK\\r\\n'];
  let out = '';
  spec.actors.forEach((a, i) => {
    const w = compact ? 340 : 160, h = compact ? 54 : 110;
    const x = -w / 2, y = -h / 2;
    const body = node(a.key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" stroke="black" stroke-width="${i === spec.actors.length - 1 ? 2 : 1}"/>${text(0, y + (compact ? 21 : 31), labels[i], { anchor: 'middle', size: compact ? 15 : 16 })}${text(0, y + (compact ? 43 : 67), bodies[i], { key: `${a.key}-value`, anchor: 'middle', size: compact ? 13 : 14, motion: i === spec.actors.length - 1 ? 'change' : 'context', stage: 2 })}`);
    out += placedActor(a, body, spec.focal === a.key);
    if (i) {
      const previous = spec.actors[i - 1];
      out += compact ? arrow(a.x, previous.y + h / 2 + 3, a.x, a.y - h / 2 - 3, '', { from: previous.key, to: a.key, key: `request-transfer-${i}`, role: 'internal', color: s === 5 ? C.line : i === spec.actors.length - 1 ? C.red : C.line, stage: 1 }) : arrow(previous.x + w / 2 + 3, a.y, a.x - w / 2 - 3, a.y, '', { from: previous.key, to: a.key, key: `request-transfer-${i}`, role: 'internal', color: s === 5 ? C.line : i === spec.actors.length - 1 ? C.red : C.line, stage: 1 });
    }
  });
  if (s === 5) {
    const socket = spec.actors[0], output = spec.actors.at(-1);
    const path = compact ? `M383 ${output.y} C414 ${output.y} 414 ${socket.y} 383 ${socket.y}` : `M${output.x} 79 C${output.x} 35 ${socket.x} 35 ${socket.x} 79`;
    out += node('request-socket-reply', `<path d="${path}" fill="none" stroke="${C.green}" stroke-width="1.5" marker-end="url(#scene-arrow-008000)"/>${compact ? '' : text(480, 34, '+OK', { anchor: 'middle', color: C.green, size: 14 })}`, { from: output.key, to: socket.key, flow: true, role: 'reply', motion: 'flow', stage: 3 });
  }
  return out;
}
function eventRequestTarget(x, y, compact = false) {
  const server = compact ? { x: 210, y: 192, r: 40 } : { x: 480, y: 132, r: 81 };
  const dx = x - server.x, dy = y - server.y;
  const distance = Math.hypot(dx, dy), radius = server.r + 4;
  return { x: server.x + dx / distance * radius, y: server.y + dy / distance * radius };
}
function eventReply(s, compact = false) {
  const toA = s === 2;
  const route = compact
    ? toA ? { start: [174, 171], end: [46, 65], path: 'M174 171 C130 175 24 146 46 65', labelX: 84, labelY: 185 }
      : { start: [229, 155], end: [236, 63], path: 'M229 155 C265 133 272 92 236 63', labelX: 294, labelY: 116 }
    : toA ? { start: [400, 118], end: [93, 63], path: 'M400 118 C300 108 170 102 93 63', labelX: 242, labelY: 118 }
      : { start: [400, 151], end: [93, 145], path: 'M400 151 C300 180 170 180 93 145', labelX: 245, labelY: 195 };
  return arrow(...route.start, ...route.end, toA ? '+OK' : '"Alice"', { ...route, key: 'event-loop-reply', color: C.green, role: 'reply', from: 'event-loop-server', to: `event-client-${toA ? 'A' : 'B'}` });
}
function eventLoop(s, lang) {
  let out = '';
  ['A', 'B', 'C'].forEach((name, i) => {
    const y = 51 + i * 82, selected = s === 2 && i === 0 || s === 3 && i === 1 || s === 5 && i === 0;
    out += node(`event-client-${name}`, `<circle cx="65" cy="${y}" r="25" fill="${C.green}" stroke="${C.ink}" stroke-width="${selected ? 2 : 1}"/>${text(65, y + 6, name, { anchor: 'middle', color: C.white })}`);
    const command = [s === 5 ? 'EVAL …' : 'SET user:1 Alice', 'GET user:1', 'PING'][i];
    out += text(110, y + 6, command, { key: `event-command-${name}`, motion: 'context', size: 14, code: true });
    const startX = 110 + command.length * 14 * .6 + 8;
    const target = eventRequestTarget(startX, y);
    out += arrow(startX, y, target.x, target.y, s === 5 && i === 2 ? L(lang, 'wait', 'ждёт') : '', { key: `event-request-${name}`, role: 'request', color: selected || s === 1 ? C.red : C.line, dashed: s === 5 && i === 2, from: `event-command-${name}`, to: 'event-loop-server' });
  });
  out += node('event-loop-server', `<circle cx="480" cy="132" r="81" fill="${C.server}" stroke="${C.ink}" stroke-width="2"/>${text(480, 130, 'Redis', { anchor: 'middle', color: C.white, size: 22 })}${text(480, 154, 'event loop', { anchor: 'middle', color: C.white, size: 14 })}`);
  out += text(480, 249, s === 2 ? 'SET → user:1 = Alice' : s === 3 ? 'GET → "Alice"' : s === 5 ? L(lang, 'EVAL occupies execution', 'EVAL занимает исполнителя') : L(lang, 'poll → read → execute → reply', 'poll → чтение → команда → ответ'), { key: 'event-loop-execution', motion: 'change', stage: 2, anchor: 'middle', size: 14 });
  if (s === 2 || s === 3) out += eventReply(s);
  if (s >= 4) {
  out += text(780, 57, L(lang, 'I/O threads', 'Потоки I/O'), { key: 'event-io-label', motion: 'context', anchor: 'middle', size: 16 });
  out += text(780, 83, L(lang, 'read · parse · write', 'чтение · разбор · запись'), { anchor: 'middle', size: 14, color: C.muted });
  out += text(780, 183, L(lang, 'Background work', 'Фоновая работа'), { key: 'event-background-label', motion: 'context', anchor: 'middle', size: 16 });
  out += text(780, 209, 'fsync · lazyfree · RDB child', { anchor: 'middle', size: 14, color: C.muted });
  }
  if (s === 4) out += arrow(552, 96, 780, 39, '', { role: 'internal', stage: 1, color: C.blue, from: 'event-loop-server', to: 'event-io-label' }) + arrow(552, 168, 780, 165, '', { role: 'internal', stage: 1, color: C.blue, from: 'event-loop-server', to: 'event-background-label' });
  return out + note(L(lang, s === 5 ? 'A long command delays other commands, including PING.' : 'Ordinary commands share one executor; network and background work have other roles.', s === 5 ? 'Долгая команда задерживает остальные, в том числе PING.' : 'Обычные команды делят исполнителя; у сети и фоновой работы другие роли.'), { y: 298 });
}
function dictionary(s, lang) {
  let out = chip(25, 20, 170, 'key = "user:1"', { key: 'dictionary-key', color: C.green });
  out += arrow(199, 37, 286, 37, 'hash', { key: 'dictionary-hash', from: 'dictionary-key', to: 'dictionary-bucket', role: 'internal', stage: 1, color: C.blue });
  out += chip(290, 20, 190, L(lang, 'hash → bucket 2', 'хеш → ячейка 2'), { key: 'dictionary-bucket', active: s <= 1 });
  const oldRows = s >= 5 ? ['0   ∅', '1   ∅', '2   ∅', '3   c'] : ['0   ∅', '1   ∅', '2   user:2 → user:1', '3   c'];
  out += text(100, 91, L(lang, 'Table 0 · 4 buckets', 'Таблица 0 · 4 ячейки'), { bold: true });
  oldRows.forEach((v, i) => { out += chip(100, 106 + i * 34, 280, v, { key: `dictionary-old-bucket-${i}`, h: 30, active: i === 2 && s >= 1 && s < 4, color: i === 2 && s >= 1 && s < 4 ? C.red : undefined }); });
  if (s >= 2 && s < 4) {
    out += box(525, 108, 370, 122, L(lang, s >= 2 ? 'A collision is a chain' : 'Bucket index', s >= 2 ? 'Коллизия образует цепочку' : 'Индекс ячейки'), [s >= 2 ? L(lang, 'user:2 ≠ user:1 → next', 'user:2 ≠ user:1 → дальше') : 'hash & (size − 1)', s >= 3 ? L(lang, 'user:1 = user:1 → value', 'user:1 = user:1 → значение') : L(lang, 'compare the full key', 'сравнить весь ключ')], { active: s === 3, code: true, size: 16 });
  } else if (s >= 4) {
    out += text(590, 91, L(lang, 'Table 1 · 8 buckets', 'Таблица 1 · 8 ячеек'), { bold: true });
    ['0 ∅', '1 ∅', '2 user:2', '3 ∅', '4 ∅', '5 ∅', '6 user:1', '7 ∅'].forEach((v, i) => { out += chip(590 + (i >= 4 ? 155 : 0), 106 + i % 4 * 34, 145, s === 4 ? `${i}  ∅` : v, { key: `dictionary-new-bucket-${i}`, h: 30, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
    out += arrow(384, 189, 586, 189, s === 5 ? L(lang, 'move a bucket', 'перенос ячейки') : L(lang, 'allocate', 'выделить'), { key: 'dictionary-rehash', from: 'dictionary-old-bucket-2', to: 'dictionary-new-bucket-2', color: C.blue, role: 'internal', stage: 1 });
  }
  return out + note(L(lang, s < 4 ? 'The hash chooses a bucket; equality finds the actual key.' : 'Rehash moves entries gradually; lookups may inspect both tables.', s < 4 ? 'Хеш выбирает ячейку; сравнение находит нужный ключ.' : 'Rehash переносит записи постепенно; поиск может читать обе таблицы.'));
}
function encodings(s, lang) {
  let out = ''; // The chapter caption introduces the current data type.
  if (s === 0) {
    out += box(75, 88, 335, 137, 'String', ['"hello" → SDS', L(lang, '"42" → integer encoding', '"42" → целое число')], { key: 'encoding-compact', active: true, code: true });
    out += box(555, 88, 330, 137, 'SDS', ['len: 5 · alloc: 5', 'h | e | l | l | o'], { key: 'encoding-expanded', code: true });
    out += arrow(414, 157, 551, 157, '', { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 1) {
    out += text(200, 106, 'List → listpack', { anchor: 'middle', size: 17 });
    out += chip(65, 130, 270, 'A | B | C', { key: 'list-small', motion: 'context' });
    out += arrow(339, 147, 476, 147, L(lang, 'growth', 'рост'), { key: 'encoding-list-growth', from: 'list-small', to: 'list-block-0', role: 'internal', stage: 1, color: C.blue });
    out += text(690, 106, 'quicklist', { anchor: 'middle', size: 17 });
    for (let i = 0; i < 2; i++) { out += box(480 + i * 225, 130, 195, 81, 'listpack', [i === 0 ? 'A | B | C' : 'D | E | F'], { key: `list-block-${i}`, titleSize: 16, size: 15, stateMotion: 'change' }); if (i === 0) out += arrow(682, 170, 699, 170, '', { key: 'encoding-list-next', from: 'list-block-0', to: 'list-block-1', color: C.ink, role: 'internal', stage: 1 }); }
  } else if (s === 2) {
    out += box(75, 88, 335, 137, 'Set → intset', ['[ 2, 5, 8, 13 ]', L(lang, 'other small sets: listpack', 'другие малые Set: listpack')], { key: 'encoding-compact', active: true, code: true });
    out += box(555, 88, 330, 137, 'Set → hashtable', ['2 → ∅ · 5 → ∅', '8 → ∅ · 13 → ∅ · …'], { key: 'encoding-expanded', code: true });
    out += arrow(414, 157, 551, 157, L(lang, 'expand', 'рост'), { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 3) {
    out += box(75, 88, 335, 137, 'Hash → listpack', ['name | Alice | age | 30', L(lang, 'fields beside their values', 'поля рядом со значениями')], { key: 'encoding-compact', active: true, size: 15, code: true });
    out += box(555, 88, 330, 137, 'Hash → hashtable', ['name → "Alice"', 'age → "30"'], { key: 'encoding-expanded', code: true });
    out += arrow(414, 157, 551, 157, L(lang, 'growth', 'рост'), { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
  } else if (s === 4) {
    out += box(75, 88, 335, 137, 'Sorted Set', ['alice: 10 · bob: 20', 'listpack'], { key: 'encoding-compact', active: true, code: true });
    out += box(555, 88, 330, 137, 'skiplist + hashtable', ['10 → 20 → 35', 'alice → score 10'], { key: 'encoding-expanded', code: true });
    out += arrow(414, 157, 551, 157, L(lang, 'growth', 'рост'), { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
  } else {
    out += box(75, 88, 335, 137, L(lang, 'Compact encoding', 'Компактная форма'), ['listpack / intset', L(lang, 'small values, low overhead', 'мало данных и накладных расходов')], { key: 'encoding-compact', active: true, size: 15 });
    out += box(555, 88, 330, 137, L(lang, 'Expanded encoding', 'Развёрнутая форма'), ['hashtable / skiplist', L(lang, 'efficient operations at scale', 'удобные операции при росте')], { key: 'encoding-expanded', active: true, size: 15 });
    out += arrow(414, 157, 551, 157, L(lang, 'threshold crossed', 'превышен порог'), { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
  }
  return out + note(L(lang, 'A public data type can have more than one internal representation.', 'Один тип данных может иметь разные внутренние представления.'));
}
function atomicity(s, lang) {
  const incr = s >= 4;
  const aCommand = s === 0 ? 'GET → +1 → SET' : s === 1 ? 'GET count' : s === 2 ? 'SET count 1' : s === 4 ? 'INCR count' : L(lang, 'local value: 1', 'локально: 1');
  const bCommand = s === 0 ? 'GET → +1 → SET' : s === 1 ? 'GET count' : s === 3 ? 'SET count 1' : s === 5 ? 'INCR count' : L(lang, 'local value: 1', 'локально: 1');
  let out = endpoint(0, 20, L(lang, 'Client A', 'Клиент A'), aCommand, s === 2 || s === 4, C.green, 'atomicity-client-a');
  out += endpoint(0, 160, L(lang, 'Client B', 'Клиент B'), bCommand, s === 3 || s === 5, C.green, 'atomicity-client-b');
  out += server(800, 140, 'Redis', '', false, false, 'atomicity-server');
  out += text(800, 252, `count = ${s <= 1 ? 0 : s === 5 ? 2 : 1}`, { key: 'atomicity-value', motion: 'change', stage: 2, anchor: 'middle', size: 21 });
  if (s === 1 || s === 2 || s === 4) {
    out += arrow(119, 43, 754, 124, s === 1 ? 'GET count' : incr ? 'INCR count' : 'SET count 1', { key: 'atomicity-a-request', from: 'atomicity-client-a', to: 'atomicity-server', role: 'request', path: 'M119 43 C300 15 530 35 754 124', labelX: 430, labelY: 47 });
    out += arrow(754, 139, 119, 63, s === 1 ? '"0"' : incr ? ':1' : '+OK', { key: 'atomicity-a-reply', from: 'atomicity-server', to: 'atomicity-client-a', role: 'reply', color: C.green, path: 'M754 139 C530 135 300 116 119 63', labelX: 430, labelY: 110 });
  }
  if (s === 1 || s === 3 || s === 5) {
    out += arrow(119, 185, 754, 154, s === 1 ? 'GET count' : incr ? 'INCR count' : 'SET count 1', { key: 'atomicity-b-request', from: 'atomicity-client-b', to: 'atomicity-server', role: 'request', labelX: 430, labelY: 157 });
    out += arrow(758, 163, 116, 206, s === 1 ? '"0"' : incr ? ':2' : '+OK', { key: 'atomicity-b-reply', from: 'atomicity-server', to: 'atomicity-client-b', role: 'reply', color: C.green, path: 'M758 163 C540 235 300 245 116 206', labelX: 430, labelY: 222 });
  }
  return out + note(L(lang, s === 3 ? 'Both clients write 1: one update is lost.' : s === 5 ? 'The second INCR starts from 1 and returns 2.' : incr ? 'INCR reads and writes within one command.' : 'The application’s read and write are two separate commands.', s === 3 ? 'Оба клиента записали 1: одно обновление потеряно.' : s === 5 ? 'Второй INCR начинает с 1 и возвращает 2.' : incr ? 'INCR читает и записывает внутри одной команды.' : 'Чтение и запись приложения — две отдельные команды.'), { y: 305 });
}
function transactions(s, lang) {
  const watched = s === 2 || s === 3;
  let out = endpoint(15, 95, L(lang, 'Client A', 'Клиент A'), watched ? 'WATCH count' : s === 0 ? 'MULTI' : 'EXEC', false, C.green, 'transaction-client-a');
  out += box(320, 45, 365, 202, watched ? L(lang, 'Watched key', 'Наблюдаемый ключ') : L(lang, 'Transaction queue', 'Очередь транзакции'), [], { key: 'transaction-server', active: true });
  if (watched) {
    out += chip(345, 112, 315, s === 2 ? L(lang, 'count = 0 · WATCH active', 'count = 0 · WATCH активен') : L(lang, 'count = 1 · A dirty', 'count = 1 · попытка A изменена'), { size: 14, active: true });
    out += chip(345, 178, 315, s === 3 ? 'EXEC → (nil)' : 'GET count → "0"', { color: s === 3 ? '#b44c34' : C.green });
    out += endpoint(745, 85, L(lang, 'Client B', 'Клиент B'), 'INCR count', s === 3, C.blue, 'transaction-client-b');
    if (s === 3) out += arrow(804, 114, 689, 114, 'INCR', { from: 'transaction-client-b', to: 'transaction-server', key: 'transaction-b-request', role: 'request', color: C.red });
    out += arrow(135, 114, 316, 114, s === 2 ? 'WATCH' : 'EXEC', { from: 'transaction-client-a', to: 'transaction-server', key: 'transaction-a-request', role: 'request' });
  } else {
    out += chip(345, 97, 315, s === 4 ? 'SET a text → OK' : s === 5 ? 'MULTI' : 'SET a 1', { color: s === 1 || s === 4 ? C.green : undefined });
    out += chip(345, 140, 315, s === 5 ? 'SET a → ERR' : s === 4 ? 'INCR a → ERR integer' : 'INCR b', { size: 14, color: s >= 4 ? '#b44c34' : undefined });
    out += chip(345, 183, 315, s === 0 ? 'QUEUED' : s === 5 ? 'EXECABORT · no writes' : s === 4 ? 'SET b 2 → OK' : 'a = 1 · b = 1', { size: 14, color: s === 5 ? '#b44c34' : C.green });
    out += arrow(135, 114, 316, 114, s === 0 ? 'MULTI + commands' : 'EXEC', { from: 'transaction-client-a', to: 'transaction-server', key: 'transaction-a-request', role: 'request' });
    out += text(730, 105, [L(lang, 'Other clients', 'Другие клиенты'), L(lang, s === 0 ? 'may act before EXEC' : 'wait during EXEC', s === 0 ? 'работают до EXEC' : 'ждут во время EXEC')], { size: 14, color: C.muted });
  }
  const notes = [L(lang, 'MULTI queues commands; it does not execute them yet.', 'MULTI накапливает команды, но пока их не исполняет.'), L(lang, 'EXEC runs the queued commands without another client between them.', 'EXEC исполняет очередь без команд других клиентов между её командами.'), L(lang, 'WATCH starts optimistic concurrency control before the read.', 'WATCH включает оптимистичный контроль изменений до чтения.'), L(lang, 'A changed watched key aborts EXEC before the queued commands run.', 'Изменённый ключ отменяет EXEC до исполнения очереди.'), L(lang, 'A run-time error does not roll back SET that already succeeded.', 'Ошибка исполнения не откатывает уже выполненный SET.'), L(lang, 'A queue-time syntax error makes EXECABORT cancel the whole transaction.', 'Ошибка синтаксиса при постановке в очередь вызывает EXECABORT без исполнения.')];
  out += arrow(316, 160, 118, 154, s === 0 ? 'QUEUED' : s === 2 ? '+OK' : s === 3 ? '(nil)' : s === 5 ? 'EXECABORT' : s === 4 ? '[OK, ERR, OK]' : '[OK, 1]', { from: 'transaction-server', to: 'transaction-client-a', path: 'M316 160 C240 210 180 190 118 154', labelX: 220, labelY: 207, key: 'transaction-result', role: 'reply', color: C.green });
  return out + note(notes[s]);
}
function scripting(s, lang) {
  let out = endpoint(10, 86, L(lang, 'Client A', 'Клиент A'), s === 3 ? 'EVALSHA sha1' : s === 4 ? 'FCALL hello 0' : 'EVAL …', s === 0 || s === 3 || s === 4, C.green, 'script-client-a');
  const title = s === 3 ? L(lang, 'Script cache', 'Кеш скриптов') : s === 4 ? L(lang, 'Function library', 'Библиотека Functions') : L(lang, 'Server-side execution', 'Исполнение на сервере');
  out += box(315, 32, 365, 227, title, [], { key: 'script-execution', active: true });
  const lines = s === 3 ? ['SCRIPT LOAD → SHA1', 'EVALSHA → cached script', 'NOSCRIPT → load again'] : s === 4 ? ['FUNCTION LOAD', 'FCALL hello 0', 'return "hello"'] : [s === 2 ? 'SET a 1' : 'INCR visits', s === 2 ? 'error("stop")' : 'if n == 1: EXPIRE visits 60', s === 5 ? 'long loop … → BUSY' : s === 2 ? 'a remains 1' : 'return n'];
  lines.forEach((v, i) => { out += chip(340, 91 + i * 45, 315, v, { active: s === 2 || s === 5 ? i === 2 : i === 0, color: s === 2 && i === 2 ? '#b44c34' : undefined, size: 14 }); });
  out += endpoint(745, 86, L(lang, 'Client B', 'Клиент B'), 'GET count', false, C.blue, 'script-client-b');
  out += arrow(131, 115, 311, 115, s === 3 ? 'EVALSHA' : s === 4 ? 'FCALL' : 'EVAL', { from: 'script-client-a', to: 'script-execution' });
  out += arrow(804, 115, 684, 115, L(lang, 'wait', 'ждёт'), { from: 'script-client-b', to: 'script-execution', color: C.muted, dashed: true });
  if (s !== 5) out += arrow(311, 210, 128, 128, s === 2 ? 'ERR' : s === 3 ? '"Alice"' : s === 4 ? '"hello"' : ':1', { key: 'script-reply', from: 'script-execution', to: 'script-client-a', path: 'M311 210 C230 210 170 175 128 128', role: 'reply', color: C.green });
  if (s === 5) out += arrow(684, 200, 807, 128, 'BUSY', { key: 'script-busy-reply', from: 'script-execution', to: 'script-client-b', path: 'M684 200 C740 200 780 160 807 128', role: 'reply', color: C.green });
  if (s === 2) out += chip(735, 220, 195, 'a = 1', { size: 14, color: '#b44c34' });
  const notes = [L(lang, 'INCR and EXPIRE can be composed into one atomic server-side operation.', 'INCR и EXPIRE можно объединить в атомарную операцию внутри сервера.'), L(lang, 'No other client command runs in the middle of this script.', 'Команда другого клиента не вклинивается внутрь скрипта.'), L(lang, 'A script error leaves earlier writes in place; there is no automatic rollback.', 'Ошибка скрипта оставляет ранние записи: автоматического отката нет.'), L(lang, 'EVALSHA reuses a cached script; clients must handle a missing cache entry.', 'EVALSHA использует кеш скриптов; клиент должен обработать отсутствие скрипта.'), L(lang, 'Functions are named server-side code managed as persistent libraries.', 'Functions — именованный код сервера, который хранится в библиотеках.'), L(lang, 'After busy-reply-threshold, ordinary commands receive BUSY; the script keeps running.', 'После busy-reply-threshold обычные команды получают BUSY; скрипт продолжает работу.')];
  return out + note(notes[s]);
}
function blocking(s, lang) {
  const wake = s === 2;
  let out = endpoint(10, 35, L(lang, 'Client A', 'Клиент A'), s === 4 || s === 5 ? 'BLPOP jobs 0' : 'BLPOP jobs 5', s === 0, C.green, 'blocking-client-a');
  out += box(315, 50, 360, 145, 'Redis · jobs', [s === 2 ? '[ "task:1" ] → A' : '[ ]', L(lang, s === 5 ? 'item removed before worker crash' : 'command executor remains available', s === 5 ? 'элемент удалён до сбоя обработчика' : 'исполнитель команд доступен')], { key: 'blocking-server', active: s >= 1, code: true, size: 14 });
  out += endpoint(745, 35, L(lang, 'Client B', 'Клиент B'), s === 2 ? 'RPUSH jobs task:1' : s === 4 ? 'BLPOP jobs 0' : 'GET user:1', s === 1 || s === 2, C.blue, 'blocking-client-b');
  out += box(65, 201, 315, 62, L(lang, wake ? 'A resumed' : s === 3 ? 'timeout → (nil)' : s === 5 ? 'A crashed after pop' : 'A waits for an item', wake ? 'A продолжает работу' : s === 3 ? 'таймаут → (nil)' : s === 5 ? 'A упал после pop' : 'A ожидает элемент'), [], { titleSize: 16, dashed: !wake, color: wake ? C.green : C.muted });
  if (s === 0) out += arrow(131, 64, 311, 64, 'BLPOP', { key: 'blocking-wait-request', from: 'blocking-client-a', to: 'blocking-server', role: 'request' });
  if (s === 1) out += arrow(804, 64, 679, 64, 'GET', { key: 'blocking-b-request', from: 'blocking-client-b', to: 'blocking-server', role: 'request' }) + arrow(679, 110, 807, 76, '"Alice"', { key: 'blocking-b-reply', from: 'blocking-server', to: 'blocking-client-b', role: 'reply', color: C.green });
  if (s === 3) out += arrow(311, 110, 128, 76, '(nil)', { key: 'blocking-timeout-reply', from: 'blocking-server', to: 'blocking-client-a', role: 'reply', color: C.green });
  if (s === 2) out += arrow(804, 64, 679, 64, 'RPUSH', { key: 'blocking-push-request', from: 'blocking-client-b', to: 'blocking-server', role: 'request', color: C.red }) + arrow(311, 110, 128, 76, '"task:1"', { from: 'blocking-server', to: 'blocking-client-a', color: C.green });
  if (s === 4) out += chip(510, 226, 380, 'waiters: A → B', { color: C.blue });
  const notes = [L(lang, 'An empty list parks client A, not the command executor.', 'Пустой список оставляет клиента A ждать, но не занимает исполнитель.'), L(lang, 'While A waits, other clients continue to use Redis.', 'Пока A ждёт, остальные клиенты продолжают работать.'), L(lang, 'RPUSH adds an item and wakes a waiting consumer.', 'RPUSH добавляет элемент и будит ожидающего потребителя.'), L(lang, 'A finite timeout resumes the client even if no item arrived.', 'Конечный таймаут возвращает управление, даже если элемент не появился.'), L(lang, 'Clients waiting on the same list are served in arrival order.', 'Клиенты, ожидающие один список, обслуживаются по порядку ожидания.'), L(lang, 'After pop, the item is gone. A crashed worker needs a separate reliability design.', 'После pop элемент удалён. Для сбоя обработчика нужен отдельный механизм надёжности.')];
  return out + note(notes[s]);
}
function locks(s, lang) {
  if (s === 3 || s === 5) {
    const fenced=s===5;
    let out=endpoint(10, 53, L(lang, 'Stale A', 'Старый A'), fenced?'write(fence=41)':'write(resource)',false,C.green,'lock-client-a');
    out+=box(337, 53, 286, 160, L(lang, 'External resource', 'Внешний ресурс'), [fenced?'highest fence = 42':L(lang,'A and B can both write','A и B могут писать')], {key:'lock-external-resource',active:true,size:14,titleSize:16});
    if(!fenced)out+=endpoint(745, 53, L(lang,'Current B','Новый B'),'write(resource)',true,C.blue,'lock-client-b');
    out+=arrow(131,82,333,82,fenced?'41':'write',{key:'lock-external-a',from:'lock-client-a',to:'lock-external-resource',role:'request'});
    if(!fenced)out+=arrow(804,82,627,82,'write',{key:'lock-external-b',from:'lock-client-b',to:'lock-external-resource',role:'request'});
    if(fenced)out+=arrow(333,172,128,94,L(lang,'rejected','отклонено'),{key:'lock-fenced-reply',from:'lock-external-resource',to:'lock-client-a',path:'M333 172 C250 172 180 135 128 94',role:'reply',color:C.green});
    return out+note(L(lang,fenced?'The resource rejects a fence below the highest it has accepted. Redis SET does not create fencing numbers.':'A expired; B owns the lease. Expiration did not stop A.',fenced?'Ресурс отклоняет номер ниже уже принятого. SET не создаёт fencing-номера.':'Срок A истёк; арендой владеет B. Истечение не остановило A.'));
  }
  const owner = s < 2 ? 'token-A' : 'token-B';
  let out = endpoint(10, 53, L(lang, 'Client A', 'Клиент A'), s >= 3 ? 'release(token-A)' : 'SET lock token-A NX PX 5000', s === 0, C.green, 'lock-client-a');
  out += box(337, 53, 286, 132, L(lang, 'Lease in Redis', 'Аренда в Redis'), [], { key: 'lock-lease' });
  if (s === 2) out += text(353, 110, 'lock → ∅', { key: 'lock-expired', motion: 'change', stage: 2, pass: 0, transient: true, size: 16 }) + text(353, 138, 'TTL: -2', { key: 'lock-expired-ttl', motion: 'change', stage: 2, pass: 0, transient: true, size: 15 });
  out += text(353, 110, `lock → ${owner}`, { key: 'lock-value', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 16 });
  out += text(353, 138, L(lang, s < 2 ? 'TTL: 5000 ms' : 'A expired · B owns', s < 2 ? 'TTL: 5000 ms' : 'срок A истёк · владеет B'), { key: 'lock-ttl', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 15 });
  out += endpoint(745, 53, L(lang, 'Client B', 'Клиент B'), s >= 2 ? 'SET … token-B NX PX 5000' : 'SET … NX → (nil)', s >= 1, C.blue, 'lock-client-b');
  out += `<path d="M75 233 H885" stroke="${C.line}" stroke-width="3"/>`;
  [75, 475, 885].forEach((x, i) => { out += `<circle cx="${x}" cy="233" r="5" fill="${C.ink}"/>` + text(x, 260, ['0 s', '5 s', '6 s'][i], { size: 15, anchor: 'middle' }); });
  out += chip(105, 205, 280, 'token-A', { color: s < 2 ? C.green : C.muted });
  if (s >= 2) out += chip(545, 205, 280, 'token-B', { key: 'lock-b-timeline', pass: s === 2 ? 1 : 0, color: C.blue });
  if (s === 0 || s === 3 || s === 4) out += arrow(131, 82, 333, 82, '', { from: 'lock-client-a', to: 'lock-lease', role: 'request', color: C.red });
  if (s === 1 || s === 2) out += arrow(804, 82, 627, 82, '', { from: 'lock-client-b', to: 'lock-lease', role: 'request', color: C.red });
  if (s === 4) out += text(480, 30, L(lang, 'token-A ≠ token-B → do not delete', 'token-A ≠ token-B → не удалять'), { anchor: 'middle', size: 17, color: '#b44c34' });
  if (s === 0 || s === 1 || s === 4) out += arrow(s === 1 ? 627 : 333, 150, s === 1 ? 807 : 128, 94, s === 0 ? '+OK' : s === 1 ? '(nil)' : ':0', { key: 'lock-reply', from: 'lock-lease', to: s === 1 ? 'lock-client-b' : 'lock-client-a', role: 'reply', color: C.green });
  return out + note(L(lang, s >= 3 ? 'An expired owner can wake up; external writes need their own protection.' : 'NX grants ownership only if the key is absent; the TTL bounds the lease.', s >= 3 ? 'Старый владелец может проснуться; внешние записи требуют своей защиты.' : 'NX выдаёт владение только при отсутствии ключа; TTL ограничивает срок.'));
}
function expiry(s, lang) {
  if (s === 5) {
    let out = server(200, 105, 'Primary', '', true, false, 'expiry-primary-server') + server(760, 105, L(lang, 'Replica', 'Реплика'), '', false, false, 'expiry-replica-server');
    out += text(200, 223, 'session → ∅', { key: 'expiry-primary', motion: 'change', stage: 2, pass: 0, anchor: 'middle', size: 18 });
    out += arrow(249, 105, 711, 105, 'DEL / UNLINK', { key: 'expiry-propagation', from: 'expiry-primary-server', to: 'expiry-replica-server', role: 'sync', color: C.blue });
    out += text(760, 223, 'session → ∅', { key: 'expiry-replica', motion: 'change', stage: 2, pass: 1, anchor: 'middle', size: 18 });
    return out + note(L(lang, 'The primary propagates DEL, or UNLINK when lazyfree-lazy-expire is enabled.', 'Primary передаёт DEL, либо UNLINK при включённом lazyfree-lazy-expire.'));
  }

  const expired = s >= 1 && s <= 3, removed = s === 2 || s === 3 || s === 5;
  let out = box(55, 62, 270, 130, L(lang, 'Key dictionary', 'Словарь ключей'), [removed ? '∅' : 'session → "abc"', L(lang, removed ? 'entry removed' : 'entry in memory', removed ? 'запись удалена' : 'запись в памяти')], { key: 'expiry-key-dictionary', active: s === 2, code: true, size: 15 });
  out += box(355, 62, 270, 130, L(lang, 'Expiry dictionary', 'Словарь сроков'), [removed || s === 4 ? '∅' : 'session → 10:00:05', L(lang, s === 4 ? 'SET cleared the TTL' : expired ? 'deadline has passed' : 'deadline in the future', s === 4 ? 'SET убрал TTL' : expired ? 'срок уже прошёл' : 'срок ещё не наступил')], { key: 'expiry-deadline-dictionary', active: s === 1 || s === 4, code: true, size: 15 });
  out += box(655, 62, 250, 130, L(lang, 'Server clock', 'Часы сервера'), [s === 0 ? '10:00:02' : '10:00:06', expired || s === 5 ? 'GET → (nil)' : 'GET → "abc"'], { active: expired, code: true, size: 15 });
  if (s === 2 || s === 4) {
    out += mCircle(480, 260, 'C', '', { key: 'expiry-client', color: C.green, r: 21 });
    out += arrow(456, 249, 280, 196, s === 4 ? 'SET session abc' : 'GET session', { key: 'expiry-access-request', from: 'expiry-client', to: 'expiry-key-dictionary', role: 'request', labelX: 365, labelY: 222 });
    out += arrow(115, 196, 454, 263, s === 4 ? '+OK' : '(nil)', { key: 'expiry-access-reply', from: 'expiry-key-dictionary', to: 'expiry-client', path: 'M115 196 C115 292 365 292 454 263', role: 'reply', color: C.green, labelX: 275, labelY: 286 });
  } else {
    out += chip(80, 226, 360, L(lang, 'Access path → delete expired key', 'При обращении → удалить ключ'), { key: 'expiry-passive-path', size: 14 });
    out += chip(515, 226, 360, L(lang, 'Active expiry → sample and clean', 'Активная очистка → проверка ключей'), { key: 'expiry-active-path', color: s === 3 ? C.red : undefined, size: 14 });
    if (s === 3) out += arrow(511, 243, 315, 196, '', { key: 'expiry-active-delete', from: 'expiry-active-path', to: 'expiry-key-dictionary', path: 'M511 243 C440 243 390 225 315 196', role: 'internal', color: C.blue });
  }
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
    out += arrow(730, 132, 730, 186, 'lazyfree', { key: 'unlink-background', from: 'unlink-key', to: 'unlink-freed', role: 'internal', color: C.blue });
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
  names.forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += chip(60 + i * 180, 158, 165, gone ? `${v} → ∅` : v, { key: `memory-key-${i}`, color: gone ? '#b44c34' : undefined, size: 14 }); });
  out += box(660, 45, 265, 166, L(lang, 'Eviction policy', 'Политика вытеснения'), [policies[policy], L(lang, s === 1 ? 'old candidate evicted' : s === 2 ? 'rare candidate evicted' : s === 4 ? 'RSS includes overhead' : s >= 3 ? 'write → OOM error' : 'choose a candidate', s === 1 ? 'удалён старый кандидат' : s === 2 ? 'удалён редкий кандидат' : s === 4 ? 'RSS включает накладные расходы' : s >= 3 ? 'запись → ошибка OOM' : 'выбрать кандидата')], { key: 'memory-eviction-policy', active: true, code: true, size: 14 });
  if (s === 1 || s === 2) out += arrow(656, 128, s === 1 ? 409 : 589, 175, L(lang, 'sample', 'выборка'), { from: 'memory-eviction-policy', to: `memory-key-${s === 1 ? 1 : 2}`, role: 'internal', color: C.blue });
  if (s === 3) {
    out += mCircle(75, 250, 'C', '', { key: 'memory-client', color: C.green, r: 21 });
    out += arrow(99, 250, 656, 180, 'SET new:key value', { key: 'memory-oom-request', from: 'memory-client', to: 'memory-eviction-policy', role: 'request' });
    out += arrow(656, 200, 98, 261, 'OOM', { key: 'memory-oom-reply', from: 'memory-eviction-policy', to: 'memory-client', path: 'M656 200 C600 300 200 300 98 261', labelX: 390, labelY: 290, role: 'reply', color: C.green });
  }
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
  out += node('latency-client-line', `<path d="M110 55 V250" stroke="${C.line}" stroke-width="2"/>`) + node('latency-server-line', `<path d="M790 55 V250" stroke="${C.line}" stroke-width="2"/>`);
  if (s === 0) {
    for (let i = 0; i < 3; i++) { out += arrow(110, 70 + i * 58, 790, 85 + i * 58, i === 0 ? 'GET a' : i === 1 ? 'GET b' : 'GET c', { from: 'latency-client-line', to: 'latency-server-line' }); out += arrow(790, 103 + i * 58, 110, 118 + i * 58, '', { from: 'latency-server-line', to: 'latency-client-line', color: C.green }); }
  } else if (s === 1) {
    out += arrow(110, 82, 790, 105, 'GET a · GET b · GET c', { from: 'latency-client-line', to: 'latency-server-line' });
    out += arrow(790, 181, 110, 207, 'a · b · c', { from: 'latency-server-line', to: 'latency-client-line', color: C.green });
    out += chip(323, 110, 300, L(lang, 'shared network waiting', 'общее сетевое ожидание'), { code: false, color: C.blue });
  } else {
    out += arrow(110, 77, 790, 92, s === 3 ? 'SCAN 0 COUNT 100' : s === 4 ? 'GET large:blob' : 'KEYS user:*', { from: 'latency-client-line', to: 'latency-server-line' });
    out += box(315, 123, 360, 88, s === 3 ? 'SCAN → cursor 84' : s === 5 ? 'INFO · SLOWLOG' : s === 4 ? L(lang, 'Large value / slow reader', 'Большой ответ / медленный клиент') : L(lang, 'Executor is busy', 'Исполнитель занят'), [L(lang, s === 3 ? 'more calls until cursor 0' : s === 5 ? 'measure before changing' : s === 4 ? 'output buffer grows' : 'other commands wait', s === 3 ? 'новые вызовы до курсора 0' : s === 5 ? 'измерить до изменений' : s === 4 ? 'растёт выходной буфер' : 'остальные команды ждут')], { active: true, size: 14, titleSize: 16 });
    out += arrow(790, 225, 110, 246, L(lang, 'reply', 'ответ'), { from: 'latency-server-line', to: 'latency-client-line', color: C.green });
  }
  return out + note(L(lang, s === 1 ? 'Pipelining saves network waits; commands still execute in order on the connection.' : s === 3 ? 'SCAN divides traversal into calls; a call can still take noticeable time.' : 'Latency includes both network time and work on the server.', s === 1 ? 'Pipeline убирает сетевые ожидания; команды соединения исполняются по порядку.' : s === 3 ? 'SCAN делит обход на вызовы; отдельный вызов тоже может занять время.' : 'Задержка включает и сеть, и работу на сервере.'));
}
function rdb(s, lang) {
  const childActive = s >= 1 && s <= 3;
  let out = text(165, 30, L(lang, 'Parent · live data', 'Родитель · рабочие данные'), { anchor: 'middle', bold: true });
  if (childActive) out += text(570, 30, L(lang, 'Child · snapshot', 'Потомок · снимок'), { anchor: 'middle', bold: true });
  for (let i = 0; i < 3; i++) {
    const changed = i === 1 && s >= 2 && s < 5;
    out += chip(55, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: ${changed ? 'Bob' : 'Alice'}`, { key: `rdb-parent-${i}`, color: changed ? C.green : undefined });
    if (childActive) out += chip(460, 61 + i * 55, 220, `${L(lang, 'page', 'стр.')} ${i + 1}: Alice`, { key: `rdb-child-${i}`, color: C.blue });
    if (childActive && (i !== 1 || s < 2)) out += arrow(279, 78 + i * 55, 456, 78 + i * 55, i === 1 ? L(lang, 'shared', 'общая') : '', { from: `rdb-parent-${i}`, to: `rdb-child-${i}`, color: C.blue, role: 'internal', motion: s === 1 ? 'flow' : 'context' });
  }
  if (s === 2) out += arrow(456, 133, 279, 133, 'COW', { key: 'rdb-copy', from: 'rdb-child-1', to: 'rdb-parent-1', color: C.blue, role: 'internal' });
  if (s >= 2 && s < 5) out += text(365, 175, 'COW', { anchor: 'middle', color: C.green, bold: true });
  if (s >= 3) out += box(755, 89, 170, 105, 'dump.rdb', [s >= 4 ? 'Alice · Alice · Alice' : L(lang, 'writing Alice…', 'пишет Alice…')], { key: 'rdb-file', active: s >= 4, code: true, size: 14 });
  if (s === 3) out += arrow(684, 142, 751, 142, '', { key: 'rdb-write', from: 'rdb-child-1', to: 'rdb-file', color: C.blue, role: 'internal' });
  if (s === 5) out += arrow(751, 142, 279, 133, 'load RDB', { key: 'rdb-recovery', from: 'rdb-file', to: 'rdb-parent-1', color: C.blue, role: 'internal' });
  if (s === 5) out += chip(185, 250, 580, L(lang, 'Restart → Alice; writes after the snapshot are absent', 'Перезапуск → Alice; более поздних записей нет'), { color: C.blue, code: false, size: 14 });
  return out + note(L(lang, s === 5 ? 'Loading this completed RDB restores Alice.' : s >= 2 ? 'A parent write copies a shared page; the child retains its snapshot view.' : 'fork creates a snapshot view without eagerly copying every memory page.', s === 5 ? 'Загрузка завершённого RDB возвращает Alice.' : s >= 2 ? 'Запись родителя копирует общую страницу; потомок сохраняет свой вид снимка.' : 'fork создаёт представление снимка без немедленного копирования всех страниц.'), { y: 310 });
}
function aof(s, lang) {
  const layers = s >= 4 ? [L(lang, 'Current dataset', 'Текущие данные'), L(lang, 'New AOF files', 'Новые файлы AOF'), L(lang, 'Recovery', 'Восстановление')] : [L(lang, 'Redis RAM', 'RAM Redis'), L(lang, 'OS page cache', 'Кеш страниц ОС'), L(lang, 'Storage', 'Накопитель')];
  const body = s >= 4 ? [[L(lang, 'live data', 'рабочие данные'), L(lang, 'fork → new base', 'fork → новая основа')], [L(lang, 'base + incremental', 'основа + приращения'), 'manifest'], [s === 5 ? L(lang, 'load base → replay incr', 'основа → приращения') : L(lang, 'publish manifest', 'публикация manifest'), L(lang, 'current dataset', 'актуальные данные')]] : [[s === 3 ? '∅' : 'SET user:1 Bob', L(lang, 'AOF buffer', 'буфер AOF')], [s === 3 ? '∅' : s >= 1 ? 'SET user:1 Bob' : '∅', 'write()'], [s === 3 ? 'Bob · fsynced' : s >= 2 ? 'SET user:1 Bob' : '∅', 'fsync()']];
  let out = layers.map((v, i) => box(45 + i * 315, 68, 240, 135, v, body[i], { key: `aof-layer-${i}`, active: i === Math.min(s, 2), code: true, size: 14, pass: s === 3 && i < 2 ? 1 : undefined, previousUntil: s === 3 && i < 2 ? 0 : undefined, stateMotion: s === 3 && i === 2 ? 'context' : undefined })).join('');
  if (s === 3) {
    out += text(61, 125, ['SET user:1 Carol', 'AOF buffer'], { key: 'aof-crash-ram', size: 14, motion: 'change', pass: 0, transient: true });
    out += text(376, 125, ['SET user:1 Carol', 'write()'], { key: 'aof-crash-os', size: 14, motion: 'change', pass: 0, transient: true });
  }
  out += arrow(289, 134, 356, 134, '', { from: 'aof-layer-0', to: 'aof-layer-1', color: s >= 1 ? C.blue : C.line, role: 'internal', stage: 1 });
  out += arrow(604, 134, 671, 134, '', { from: 'aof-layer-1', to: 'aof-layer-2', color: s >= 2 ? C.blue : C.line, role: 'internal', stage: 1 });
  out += chip(55, 231, 240, 'appendfsync always', { color: s === 2 ? C.blue : undefined, size: 14 });
  out += chip(360, 231, 240, 'appendfsync everysec', { color: s === 3 ? C.blue : undefined, size: 14 });
  out += chip(675, 231, 240, s >= 4 ? 'BGREWRITEAOF' : 'appendfsync no', { color: s >= 4 ? C.blue : undefined, size: 14 });
  const notes = [L(lang, 'The command changes memory and produces a record in the Redis AOF buffer.', 'Команда меняет память и создаёт запись в буфере AOF Redis.'), L(lang, 'write() hands bytes to the OS; they are not yet guaranteed on stable storage.', 'write() передаёт байты ОС; это ещё не гарантия устойчивого хранения.'), L(lang, 'The fsync policy chooses when Redis asks the OS to flush data.', 'Политика fsync определяет, когда Redis просит ОС сбросить данные.'), L(lang, 'Bob was fsynced; newer Carol is not. This power-loss scenario restores Bob.', 'Bob покрыт fsync, новая Carol — нет. В выбранном сбое восстановится Bob.'), L(lang, 'Rewrite produces a compact base while new writes go into an incremental file.', 'Rewrite создаёт компактную основу, а новые записи попадают в файл приращений.'), L(lang, 'The manifest identifies the base and incremental files to replay on startup.', 'Манифест определяет основу и файлы приращений для восстановления при запуске.')];
  return out + note(notes[s]);
}
function replication(s, lang) {
  const lag = s === 0;
  let out = server(165, 125, 'Primary', 'k = v · offset 120', true, false, 'replication-primary');
  out += server(785, 125, L(lang, 'Replica', 'Реплика'), lag ? 'k = ∅ · offset 100' : 'k = v · offset 120', !lag, false, 'replication-replica');
  if (s < 4) out += arrow(214, 107, 736, 107, s === 2 ? '+CONTINUE · bytes 101…120' : s === 3 ? L(lang, 'FULLRESYNC → RDB + new writes', 'FULLRESYNC → RDB + новые записи') : 'SET k v · offset 120', { key: 'replication-stream', from: 'replication-primary', to: 'replication-replica', role: 'sync', motion: s >= 4 ? 'context' : undefined, color: lag ? C.line : C.blue, dashed: lag });
  if (s === 0) out += mCircle(25, 125, 'C', '', { key: 'replication-client', color: C.green, r: 18 }) + arrow(116, 125, 47, 125, '+OK', { key: 'replication-client-ok', from: 'replication-primary', to: 'replication-client', role: 'reply', color: C.green });
  if (s === 2 || s === 3) out += arrow(785, 76, 165, 76, s === 2 ? 'PSYNC <id> 101' : 'PSYNC ? -1', { key: 'replication-request', from: 'replication-replica', to: 'replication-primary', path: 'M785 76 C785 20 165 20 165 76', labelX: 480, labelY: 22, role: 'request', color: C.red });
  if (s >= 4) out += mCircle(480, 28, 'C', '', { key: 'replication-client', color: C.green, r: 19 }) + arrow(455, 38, 210, 103, s === 4 ? 'WAIT 1 1000' : 'WAITAOF 1 1 1000', { key: 'replication-request', from: 'replication-client', to: 'replication-primary', role: 'request', color: C.red, labelY: 48 });
  if (s >= 4) {
    out += arrow(214, 107, 736, 107, 'REPLCONF GETACK *', { key: 'replication-getack', from: 'replication-primary', to: 'replication-replica', role: 'sync', color: C.blue });
  }
  out += arrow(736, 145, 214, 145, s === 5 ? 'ACK 120 · FACK 120' : lag ? 'ACK 100' : 'ACK 120', { key: 'replication-ack', from: 'replication-replica', to: 'replication-primary', role: s >= 4 ? 'sync' : 'reply', motion: lag ? 'context' : 'flow', color: C.green, labelY: 166 });
  if (s >= 4) {
    out += arrow(210, 116, 455, 29, s === 4 ? ':1' : '*2 → 1, 1', { key: 'replication-wait-reply', from: 'replication-primary', to: 'replication-client', role: 'reply', color: C.green, labelY: 91 });
  }
  if (s === 5) out += chip(330, 190, 300, 'AOF fsync → offset 120', { key: 'replication-fsync', size: 14, color: C.blue });
  out += chip(270, 244, 420, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? L(lang, 'FULLRESYNC → snapshot + stream', 'FULLRESYNC → снимок + поток') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : L(lang, lag ? 'primary replied; replica is behind' : 'replica applies the command stream', lag ? 'primary ответил; реплика отстаёт' : 'реплика применяет поток команд'), { code: s >= 2, size: 14, color: C.blue, stage: s >= 4 ? 4 : 2 });
  const notes = [L(lang, 'The primary can reply OK before a replica has applied the write.', 'Primary может вернуть OK до применения записи репликой.'), L(lang, 'Offsets track progress through the ordered replication stream.', 'Смещения показывают прогресс в упорядоченном потоке репликации.'), L(lang, 'A matching replication history and backlog permit partial synchronization.', 'Подходящая история и backlog позволяют частичную синхронизацию.'), L(lang, 'Without a usable backlog, a full sync sends the dataset and subsequent writes.', 'Без подходящего backlog полная синхронизация передаёт данные и новые записи.'), L(lang, 'WAIT counts replica acknowledgements; it does not turn Redis into Raft.', 'WAIT считает подтверждения реплик; он не превращает Redis в Raft.'), L(lang, 'WAITAOF waits for requested local and replica AOF fsync acknowledgements.', 'WAITAOF ждёт заданное число локальных и репличных подтверждений fsync AOF.')];
  return out + note(notes[s], { y: 305 });
}
// Only Sentinel changes a node's identity within this story. Keep the old
// identity visible until the promotion phase, just like a changed key value.
function sentinelRole(markup, key) {
  let index = 0;
  return markup.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, label => ++index <= 2 ? node(`${key}-${index}`, label, { motion: 'change', stage: 2 }) : label);
}
function sentinel(s, lang) {
  let out = '';
  [180, 480, 780].forEach((x, i) => { out += node(`sentinel-${i}`, `<circle cx="${x}" cy="56" r="28" fill="${C.server}" stroke="${C.ink}" stroke-width="${s === 1 && i === 0 || s >= 2 ? 2 : 1}"/>${text(x, 62, `S${i + 1}`, { anchor: 'middle', color: C.white, size: 17 })}`); });
  out += text(480, 14, L(lang, s === 1 ? 'SDOWN · one observer suspects failure' : s === 2 ? 'ODOWN · configured quorum agrees' : 'Sentinel observers', s === 1 ? 'SDOWN · один наблюдатель видит сбой' : s === 2 ? 'ODOWN · кворум подтверждает сбой' : 'Наблюдатели Sentinel'), { anchor: 'middle', size: 15, color: C.muted });
  out += sentinelRole(server(310, 180, L(lang, s >= 3 ? 'old primary' : 'Primary', s >= 3 ? 'бывший primary' : 'Primary'), s === 5 ? L(lang, 'k = v2 · isolated', 'k = v2 · изолирован') : s >= 1 ? L(lang, 'unreachable', 'недоступен') : 'k = v1', false, s >= 1 && s !== 5, 'sentinel-old-server'), 'sentinel-old-role');
  out += sentinelRole(server(665, 180, s >= 3 ? 'Primary' : L(lang, 'Replica', 'Реплика'), 'k = v1', s >= 3, false, 'sentinel-new-server'), 'sentinel-new-role');
  const probes = [180, 480, 780].map(x => {
    const dx = 310 - x, dy = 180 - 56, length = Math.hypot(dx, dy);
    return [x + dx / length * 32, 56 + dy / length * 32, 310 - dx / length * 49, 180 - dy / length * 49];
  });
  if (s <= 2) probes.forEach((route, i) => { out += arrow(...route, '', { key: `sentinel-probe-${i}`, from: `sentinel-${i}`, to: 'sentinel-old-server', role: 'request', color: s >= 1 ? C.muted : C.blue, dashed: s >= 1 }); });
  if (s === 0) out += arrow(probes[1][2], probes[1][3], probes[1][0], probes[1][1], 'PONG', { key: 'sentinel-pong', from: 'sentinel-old-server', to: 'sentinel-1', role: 'reply', color: C.green });
  if (s === 1) out += arrow(...probes[0], 'PING', { key: 'sentinel-timeout-probe', from: 'sentinel-0', to: 'sentinel-old-server', role: 'request', color: C.red });
  if (s === 2) out += arrow(212, 56, 448, 56, 'SDOWN', { key: 'sentinel-report', from: 'sentinel-0', to: 'sentinel-1', role: 'sync', color: C.blue });
  if (s === 3) out += arrow(507, 74, 624, 153, L(lang, 'promote', 'повысить'), { key: 'sentinel-promote', from: 'sentinel-1', to: 'sentinel-new-server', role: 'sync', color: C.blue });
  if (s === 4) {
    out += mCircle(480, 205, 'C', L(lang, 'Client', 'Клиент'), { key: 'sentinel-client', color: C.green, r: 23 });
    out += text(480, 103, 'SENTINEL get-master-addr-by-name', { anchor: 'middle', size: 14 });
    out += arrow(469, 179, 469, 86, '', { key: 'sentinel-discover', from: 'sentinel-client', to: 'sentinel-1', role: 'request' });
    out += arrow(491, 86, 491, 179, L(lang, 'address', 'адрес'), { key: 'sentinel-address-reply', from: 'sentinel-1', to: 'sentinel-client', labelX: 535, role: 'reply', color: C.green });
    out += arrow(508, 205, 616, 190, L(lang, 'connect', 'подключиться'), { key: 'sentinel-reconnect', from: 'sentinel-client', to: 'sentinel-new-server', motion: 'change', role: 'internal', color: C.blue, stage: 2 });
  }
  if (s === 5) out += node('sentinel-partition', `<path d="M485 112 V277" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="5 5"/>${text(485, 103, L(lang, 'partition', 'разделение'), { anchor: 'middle', size: 14 })}`, { motion: 'change', stage: 2 });
  return out + note(L(lang, s === 5 ? 'The new primary lacks v2: the old primary acknowledged it before replication.' : s === 4 ? 'Clients ask Sentinel for the primary, then reconnect to Redis.' : 'Failure detection and leader election are separate parts of failover.', s === 5 ? 'В новом primary нет v2: прежний primary подтвердил запись до репликации.' : s === 4 ? 'Клиент узнаёт primary у Sentinel, затем подключается к Redis.' : 'Обнаружение сбоя и выбор лидера — разные части переключения.'), { y: 305 });
}
function cluster(s, lang) {
  const slot = s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182';
  let out = chip(200, 20, 560, slot, { key: 'cluster-hash-value', color: C.green, size: 16 });
  out += node('cluster-client', `<circle cx="65" cy="65" r="24" fill="${C.green}" stroke="${C.ink}" stroke-width="1.5"/>` + text(65, 71, 'C', { anchor: 'middle', bold: true, color: C.white, size: 16 }) + text(65, 112, L(lang, 'Client', 'Клиент'), { anchor: 'middle', size: 14 }));
  out += server(150, 170, 'A', '0 … 5460', s === 0, false, 'cluster-a');
  out += server(480, 170, 'B', '5461 … 10922', s === 4, false, 'cluster-b');
  out += server(810, 170, 'C', '10923 … 16383', s === 2 || s === 3, false, 'cluster-c');
  if (s === 1 || s === 5) out += chip(330, 85, 300, L(lang, 'same tag → same slot', 'один hash tag → один слот'), { key: 'cluster-shared-slot', size: 14 }) + arrow(480, 58, 480, 81, '', { key: 'cluster-hash', from: 'cluster-hash-value', to: 'cluster-shared-slot', role: 'internal', color: C.blue });
  if (s === 0) out += text(480, 91, L(lang, '16384 slots', '16384 слота'), { anchor: 'middle', size: 17 });
  else if (s === 2) out += arrow(93, 69, 761, 163, 'GET key', { key: 'cluster-direct-request', from: 'cluster-client', to: 'cluster-c', role: 'request', color: C.red });
  else if (s === 3) {
    out += arrow(119, 132, 83, 87, '', { key: 'cluster-moved', from: 'cluster-a', to: 'cluster-client', role: 'reply', color: C.green });
    out += text(215, 109, 'MOVED 12182 C', { size: 15, color: C.red });
    out += arrow(93, 69, 761, 163, L(lang, 'retry → C', 'повтор → C'), { key: 'cluster-retry', from: 'cluster-client', to: 'cluster-c', role: 'request', color: C.red });
  } else if (s === 4) {
    out += arrow(93, 72, 432, 158, 'ASKING + GET key', { key: 'cluster-ask-retry', from: 'cluster-client', to: 'cluster-b', role: 'request', color: C.red });
    out += arrow(762, 160, 91, 57, 'ASK 12182 B', { key: 'cluster-ask', from: 'cluster-c', to: 'cluster-client', labelY: 83, role: 'reply', color: C.green });
    out += text(575, 100, L(lang, 'C → client: ASK 12182 B', 'C → клиент: ASK 12182 B'), { size: 15, color: C.red });
  }
  return out + note(L(lang, s === 4 ? 'ASK redirects this request temporarily; the client sends ASKING to the target.' : s === 3 ? 'MOVED is a reply to the client, which updates its cached slot owner and retries.' : s === 5 ? 'MGET, transactions, and declared script keys require a shared slot.' : 'The client routes commands by slot, not by guessing which server holds the key.', s === 4 ? 'ASK временно перенаправляет запрос; клиент отправляет ASKING целевому серверу.' : s === 3 ? 'MOVED возвращается клиенту: он обновляет кеш владельца слота и повторяет запрос.' : s === 5 ? 'MGET, транзакциям и объявленным ключам скрипта нужен общий слот.' : 'Клиент направляет команду по слоту, а не угадывает сервер с ключом.'));
}
function pubsub(s, lang) {
  const payload=s===3?'next':s===5?'shard:hello':'hello';
  const publishing=[1,2,3,5].includes(s);
  let out = endpoint(5, 102, L(lang, 'Publisher B', 'Издатель B'), `${s===5?'SPUBLISH':'PUBLISH'} news ${payload}`, s === 1, C.green, 'pubsub-publisher');
  out += node('pubsub-server', `<circle cx="480" cy="140" r="48" fill="${C.server}" stroke="${C.ink}" stroke-width="1.5"/>${text(480, 146, 'Redis', { anchor: 'middle', size: 19, color: C.white })}${text(480, 213, s === 5 ? L(lang, 'shard: news', 'шард: news') : L(lang, 'channel: news', 'канал: news'), { anchor: 'middle', size: 16 })}`);
  out += endpoint(745, 102, L(lang, 'Subscriber A', 'Подписчик A'), '', s === 2, s === 3 ? C.muted : C.green, 'pubsub-subscriber');
  const inbox=s===3?L(lang,'disconnected','отключён'):s===4?L(lang,'future messages only','только новые сообщения'):s===5?'"shard:hello"':s===2?'"hello"':L(lang,'inbox: empty','входящих нет');
  out += text(835, 233, inbox, {key:'pubsub-inbox',motion:'change',stage:2,pass:s===5?1:0,anchor:'middle',size:14});
  out += text(480, 249, `news → ${s === 3 ? '∅' : 'A'}`, { key: 'pubsub-targets', motion: 'change', stage: 2, anchor: 'middle', size: 16 });
  if (s === 0 || s === 4) out += arrow(803, 116, 529, 130, 'SUBSCRIBE news', { key: 'pubsub-subscribe', from: 'pubsub-subscriber', to: 'pubsub-server', role: 'request', color: C.red });
  out += arrow(126, 132, 428, 139, publishing?payload:'', { key: 'pubsub-publish', from: 'pubsub-publisher', to: 'pubsub-server', color: publishing?C.red:C.line, role: 'request' });
  out += arrow(529, 158, 804, 139, s === 3 ? L(lang, 'missed', 'пропуск') : '', { key: 'pubsub-delivery-a', from: 'pubsub-server', to: 'pubsub-subscriber', color: s===2||s===5?C.blue:C.line, dashed:s===3, role: 'sync', stage: 1 });
  return out + note(L(lang, s >= 3 ? 'A cannot replay a missed message: the channel stores no history.' : 'A message goes only to clients subscribed at delivery time.', s >= 3 ? 'A не прочитает пропущенное: канал не хранит историю.' : 'Сообщение идёт клиентам, подписанным в момент доставки.'), { y: 308 });
}
function streams(s, lang) {
  if (s === 5) {
    let out = chip(330, 25, 300, 'radix tree · rax', { key: 'stream-index', motion: 'change', pass: 0, size: 17 });
    out += arrow(420, 63, 245, 121, '1000-0', { from: 'stream-index', to: 'stream-leaf-a', role: 'internal', stage: 1, color: C.blue });
    out += arrow(540, 63, 715, 121, '1001-0', { from: 'stream-index', to: 'stream-leaf-b', role: 'internal', stage: 1, color: C.blue });
    out += box(80, 125, 330, 110, 'listpack', ['1000-0: job → A', '1000-1: job → B'], { key: 'stream-leaf-a', pass: 1, code: true, size: 16 });
    out += box(550, 125, 330, 110, 'listpack', ['1001-0: job → C', L(lang, 'packed entries', 'плотно упакованные записи')], { key: 'stream-leaf-b', pass: 1, code: true, size: 16 });
    return out + note(L(lang, 'The radix tree finds an ID range; a listpack stores its entries.', 'Radix tree находит диапазон ID; listpack хранит его записи.'));
  }
  let out = text(30, 25, 'stream: orders', { size: 17 });
  out += chip(30, 45, 635, '1000-0 · order:42', { key:'stream-entry-0',motion:s===0?'change':'context',size:16 });
  out += box(710, 20, 225, 108, 'PEL', [s <= 1 || s === 3 ? '∅' : `1000-0 → ${s === 4 ? 'B' : 'A'}`, L(lang, s <= 1 ? 'no group yet' : s === 3 ? 'acknowledged' : 'pending delivery', s <= 1 ? 'группы ещё нет' : s === 3 ? 'подтверждено' : 'ожидает ACK')], { key: 'stream-pending', active: s >= 2, pass: s === 4 ? 1 : 0, previousUntil: s === 4 ? 0 : undefined, code: true, size: 14 });
  if (s === 4) out += text(726, 77, ['1000-0 → A', L(lang, 'pending delivery', 'ожидает ACK')], { key: 'stream-pending-before-claim', motion: 'change', stage: 2, pass: 0, transient: true, size: 14, leading: 19 });
  out += endpoint(30, 142, L(lang, 'Consumer A', 'Обработчик A'), s === 0 ? 'XADD orders * order 42' : s === 1 ? 'XREAD STREAMS orders 0' : s === 3 ? 'XACK orders workers 1000-0' : s === 4 ? L(lang, 'stopped before ACK', 'сбой до ACK') : 'XREADGROUP → 1000-0', s === 1 || s === 2, s === 4 ? C.muted : C.green, 'stream-a');
  out += endpoint(570, 142, L(lang, 'Consumer B', 'Обработчик B'), s === 4 ? 'XAUTOCLAIM → 1000-0' : 'XREADGROUP', s === 4, C.green, 'stream-b');
  if (s === 0) out += arrow(125, 140, 125, 83, 'XADD', { key: 'stream-add-request', from: 'stream-a', to: 'stream-entry-0', role: 'request' });
  if (s === 1 || s === 2) out += arrow(132, 142, 155, 83, s === 1 ? 'XREAD' : 'XREADGROUP', { key: 'stream-read-request', from: 'stream-a', to: 'stream-entry-0', role: 'request' });
  if (s === 0) out += arrow(260, 83, 147, 154, '1000-0', { key: 'stream-id-reply', from: 'stream-entry-0', to: 'stream-a', role: 'reply', color: C.green });
  if (s === 3) out += arrow(706, 119, 151, 180, ':1', { key: 'stream-ack-reply', from: 'stream-pending', to: 'stream-a', role: 'reply', color: C.green });
  if (s === 1 || s === 2) out += arrow(104, 83, 104, 140, '', { key: 'stream-read-reply', from: 'stream-entry-0', to: 'stream-a', role: 'reply', color: C.green });
  if (s === 3) out += arrow(151, 167, 706, 105, 'XACK', { key: 'stream-ack-request', from: 'stream-a', to: 'stream-pending', role: 'request', color: C.red });
  if (s === 4) out += arrow(689, 160, 774, 132, 'XAUTOCLAIM', { key: 'stream-claim-request', from: 'stream-b', to: 'stream-pending', role: 'request' }) + arrow(806, 132, 690, 185, L(lang, 'reclaim', 'забрать'), { key: 'stream-claim-delivery', from: 'stream-pending', to: 'stream-b', role: 'reply', color: C.green });
  return out + note(L(lang, s === 4 ? 'Ownership moves A → B. Delivery can repeat: make processing safe to retry.' : s === 3 ? 'XACK clears pending work; the entry remains in the stream.' : s === 1 ? 'XREAD reads without removing entries; each reader keeps its own position.' : 'The stream holds entries; a group separately tracks unacknowledged work.', s === 4 ? 'Владение переходит A → B. Доставка может повториться: обработка должна это учитывать.' : s === 3 ? 'XACK убирает ожидание; сама запись остаётся в Stream.' : s === 1 ? 'XREAD читает без удаления; каждый читатель хранит свою позицию.' : 'Stream хранит записи; группа отдельно отслеживает работу без ACK.'), { y: 308 });
}
function specialized(s, lang) {
  const names = ['JSON', L(lang, 'Search', 'Поиск'), L(lang, 'Vectors', 'Векторы'), L(lang, 'Time series', 'Ряды времени'), 'Bitmap / Geo', L(lang, 'Probabilistic', 'Вероятностные')];
  let out = text(480, 28, names[s], { anchor: 'middle', size: 20 });
  if (s === 0) {
    out += chip(380, 60, 200, 'user:1', { key: 'json-root', motion: 'context' });
    out += arrow(425, 98, 245, 174, 'name', { from: 'json-root', to: 'json-name', role: 'internal', color: C.blue });
    out += arrow(535, 98, 715, 174, 'age', { from: 'json-root', to: 'json-age', role: 'internal', color: C.blue });
    out += chip(100, 178, 300, 'name: "Alice"', { key: 'json-name' });
    out += chip(560, 178, 300, 'age: 31', { key: 'json-age' });
    out += text(480, 255, '$.age: 30 → 31', { key: 'json-result', motion: 'change', stage: 2, anchor: 'middle', size: 18 });
  } else if (s === 1) {
    out += chip(80, 105, 230, '"redis"', { key: 'search-query', motion: 'context' });
    out += arrow(314, 122, 506, 122, L(lang, 'lookup', 'поиск'), { from: 'search-query', to: 'search-posting', role: 'internal', color: C.blue });
    out += box(510, 77, 370, 105, L(lang, 'Inverted index', 'Инвертированный индекс'), ['doc:2 → doc:7 → doc:12'], { key: 'search-posting', titleSize: 17, size: 16 });
    out += text(480, 246, L(lang, 'term → posting list → document IDs', 'термин → список вхождений → ID документов'), { anchor: 'middle', size: 17 });
  } else if (s === 2) {
    out += `<path d="M160 58 V238 H795" fill="none" stroke="${C.ink}" stroke-width="1"/>`;
    [[235, 207], [345, 174], [460, 132], [515, 150], [710, 78]].forEach(([x, y], i) => { out += node(`vector-${i}`, `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 6}" fill="${i === 2 ? C.green : C.server}"/>`, { motion: i === 2 ? 'change' : 'context' }); });
    out += `<circle cx="460" cy="132" r="75" fill="none" stroke="${C.ink}" stroke-dasharray="5 5"/>`;
    out += arrow(472, 136, 505, 147, '', { from: 'vector-2', to: 'vector-3', role: 'internal', color: C.blue });
    out += text(480, 268, L(lang, 'HNSW / FLAT → candidates → nearest neighbors', 'HNSW / FLAT → кандидаты → ближайшие соседи'), { anchor: 'middle', size: 17 });
  } else if (s === 3) {
    out += `<path d="M100 225 H635 M100 225 V65" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M150 150 L300 125 L450 200 L600 100" fill="none" stroke="${C.server}" stroke-width="2"/>`;
    [[150,150,21],[300,125,22],[450,200,19],[600,100,23]].forEach(([x,y,value],i)=>{out+=node(`timeseries-point-${i}`, `<circle cx="${x}" cy="${y}" r="4" fill="${C.server}"/>${text(x,y-10,String(value),{size:14,anchor:'middle'})}`);});
    out += arrow(607, 104, 741, 140, 'AVG', { from: 'timeseries-point-3', to: 'timeseries-average', role: 'internal', color: C.blue });
    out += chip(745, 123, 150, '21.25', { key: 'timeseries-average', size: 19 });
    out += text(480, 270, L(lang, 'Timestamped chunks → range aggregation', 'Чанки с временными метками → агрегация диапазона'), { anchor: 'middle', size: 17 });
  } else if (s === 4) {
    Array.from('10100100').forEach((bit, i) => { out += chip(100 + i * 96, 78, 80, bit, { key: `bitmap-bit-${i}`, color: bit === '1' ? C.blue : C.ink }); });
    out += text(480, 159, 'GETBIT flags 2 → 1', { anchor: 'middle', size: 17 });
    out += chip(100, 212, 250, 'longitude · latitude', { key: 'geo-coordinates', motion: 'context', size: 14 });
    out += arrow(354, 229, 586, 229, 'geohash', { from: 'geo-coordinates', to: 'geo-index', role: 'internal', color: C.blue });
    out += chip(590, 212, 270, 'Sorted Set', { key: 'geo-index' });
  } else {
    out += text(80, 70, L(lang, 'HyperLogLog registers', 'Регистры HyperLogLog'), { size: 16 });
    ['3', '0', '2', '5', '1', '0'].forEach((v, i) => { out += chip(80 + i * 90, 93, 75, v, { key: `hll-register-${i}` }); });
    out += arrow(609, 110, 741, 110, L(lang, 'estimate', 'оценить'), { from: 'hll-register-5', to: 'hll-result', role: 'internal', color: C.blue });
    out += chip(745, 93, 150, '≈ N', { key: 'hll-result', motion: 'change', stage: 2, size: 20 });
    out += text(80, 185, L(lang, 'Bloom: hashes choose bit positions', 'Bloom: хеши выбирают позиции битов'), { size: 16 });
    Array.from('00101010').forEach((bit, i) => { out += chip(80 + i * 95, 207, 80, bit, { key: `bloom-bit-${i}`, color: bit === '1' ? C.blue : C.ink }); });
  }
  return out + note(L(lang, 'Each structure trades memory for particular operations and accuracy.', 'Каждая структура меняет расход памяти на операции и точность.'), { y: 315 });
}
const renderers = { 'first-key': firstKey, request, 'event-loop': eventLoop, dictionary, encodings, atomicity, transactions, scripting, blocking, locks, expiry, memory, latency, rdb, aof, replication, sentinel, cluster, pubsub, streams, specialized };
/** Render one of the 21 bilingual chapter diagrams. Values outside the story range are clamped. */
export function storyScene(id, step, lang = 'en', compact = false) {
  id = Object.hasOwn(renderers, id) ? id : 'first-key';
  const locale = lang === 'ru' ? 'ru' : 'en';
  identityCounts = Object.create(null);
  const beat = resolveBeat(id, step);
  const s = beat.scene;
  const title = (titles[id] || titles['first-key'])[locale === 'ru' ? 1 : 0];
  const description = L(locale, `${compact ? "Compact diagram. " : ""}Educational simulation, step ${Math.max(0, Math.trunc(Number(step) || 0)) + 1} of ${storyLength(id)}. ${title}.`, `${compact ? "Компактная схема. " : ""}Учебная симуляция, шаг ${Math.max(0, Math.trunc(Number(step) || 0)) + 1} из ${storyLength(id)}. ${title}.`);
  const markers = [C.red, C.green, C.blue, C.muted, C.line, C.ink].map(color => `<marker id="scene-arrow-${color.replace('#', '')}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8" fill="${color}"/></marker>`).join('');
  const special = id === 'first-key' ? firstKey(s, locale, compact, beat.operation) : id === 'request' ? request(s, locale, compact) : null;
  const composed = special === null ? composeActors(id, s, compact, compact ? compactScene(id, s, locale) : (renderers[id] || firstKey)(s, locale)) : { markup: special, focal: `actor:${getComposition(id, s, compact).focal}` };
  // These chapters switch to a different data structure at each stop. A String
  // must leave the stage before a List arrives; JSON is not a vector in disguise.
  if (id === 'encodings' || id === 'specialized') {
    const variants = id === 'encodings' ? ['string', 'list', 'set', 'hash', 'sorted-set', 'growth'] : ['json', 'search', 'vectors', 'time-series', 'bitmap-geo', 'probabilistic'];
    const namespace = `${id}:${variants[s]}:`;
    composed.markup = composed.markup.replace(/data-(key|from|to)="([^"]+)"/g, (_, attribute, key) => `data-${attribute}="${namespace}${key}"`);
    composed.focal = namespace + composed.focal;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${compact ? '0 0 420 360' : '0 0 960 330'}" data-chapter="${E(id)}" data-step="${s}" data-focal="${E(composed.focal)}" role="img" aria-label="${E(title)}. ${E(description)}" focusable="false"><title>${E(title)}</title><desc>${E(description)}</desc><defs>${markers}</defs>${composed.markup}</svg>`;
}

// Compact diagrams are composed at their native width rather than scaled down.
// They focus on the current mechanism; the full desktop view remains available.
function mCircle(x, y, mark, label = '', opt = {}) {
  const r = opt.r || 29;
  return node(opt.key || identity('circle'), `<circle cx="${x}" cy="${y}" r="${r}" fill="${opt.failed ? '#999999' : opt.color || C.server}" stroke="${C.ink}" stroke-width="${opt.active ? 3 : 1}"/>${text(x, y + 6, mark, { anchor: 'middle', size: opt.size || 17, color: C.white })}${label ? text(x, y + r + 24, label, { anchor: 'middle', size: 14, key: opt.labelKey, motion: opt.labelKey ? 'context' : undefined }) : ''}${opt.failed ? `<path d="M${x-r+8} ${y-r+8} L${x+r-8} ${y+r-8} M${x+r-8} ${y-r+8} L${x-r+8} ${y+r-8}" stroke="${C.ink}" stroke-width="2"/>` : ''}`, { active: opt.active });
}
function mCell(x, y, w, label, opt = {}) {
  const h = opt.h || 32;
  return node(opt.key || identity('entry'), `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opt.fill || C.white}" stroke="${C.ink}" stroke-width="${opt.active ? 2 : 1}"/>${text(x + w / 2, y + h / 2 + 5, label, { anchor: 'middle', size: opt.size || 14, color: opt.color || C.ink, code: true })}`, { active: opt.active, motion: opt.motion || 'change', stage: opt.stage, sequence: opt.sequence, transient: opt.transient, previousUntil: opt.previousUntil, pass: opt.pass });
}
function mNote() { return ''; }
function compactScene(id, s, lang) {
  const t = (en, ru) => L(lang, en, ru);
  let out = '';
  switch (id) {
    case 'first-key': return firstKey(s, lang, true);
    case 'request': return request(s, lang, true);
    case 'event-loop': {
      ['A', 'B', 'C'].forEach((name, i) => { const selected = s === 2 && i === 0 || s === 3 && i === 1 || s === 5 && i === 0; out += mCircle(70 + i * 140, 43, name, [s === 5 ? 'EVAL' : 'SET', 'GET', 'PING'][i], { key: `event-client-${name}`, labelKey: `event-command-${name}`, color: C.green, active: selected }); const target = eventRequestTarget(70 + i * 140, 108, true); out += arrow(70 + i * 140, 108, target.x, target.y, '', { key: `event-request-${name}`, role: 'request', color: selected || s === 1 ? C.red : C.line, dashed: s === 5 && i === 2, from: `event-command-${name}`, to: 'event-loop-server' }); });
      out += mCircle(210, 192, 'R', 'Redis · event loop', { key: 'event-loop-server', r: 40 });
      out += text(210, 292, s === 2 ? 'A: user:1 → Alice' : s === 3 ? 'B: GET → "Alice"' : s === 5 ? t('EVAL busy · C waits', 'EVAL занят · C ждёт') : s === 4 ? t('I/O threads · fsync · lazyfree', 'I/O threads · fsync · lazyfree') : t('poll → read → execute → reply', 'poll → чтение → команда → ответ'), { key: 'event-loop-execution', motion: 'change', stage: 2, anchor: 'middle', size: 14 });
      if (s === 2 || s === 3) out += eventReply(s, true);
      return out + mNote(t(s === 5 ? 'Long execution delays other commands.' : 'Ready sockets share one executor.', s === 5 ? 'Долгое исполнение задерживает команды.' : 'Готовые сокеты делят исполнитель.'));
    }
    case 'dictionary': {
      out += mCell(25, 15, 370, t('hash(user:1) → bucket 2', 'хеш(user:1) → ячейка 2'), { key: 'dictionary-key', active: s <= 1 });
      out += text(95, 86, t('old · 4', 'старая · 4'), { anchor: 'middle', size: 14, bold: true });
      ['0 ∅', '1 ∅', s === 5 ? '2 ∅' : '2 user:2 → user:1', '3 c'].forEach((v, i) => { out += mCell(16, 101 + i * 34, 164, v, { key: `dictionary-old-bucket-${i}`, active: i === 2 && s >= 1 && s <= 3, color: i === 2 && s >= 1 && s <= 3 ? C.red : undefined }); });
      if (s >= 4) {
        out += text(315, 73, t('new · 8', 'новая · 8'), { anchor: 'middle', size: 14, bold: true });
        Array.from({ length: 8 }, (_, i) => `${i} ${s === 5 && i === 2 ? 'user:2' : s === 5 && i === 6 ? 'user:1' : '∅'}`).forEach((v, i) => { out += mCell(235, 85 + i * 27, 169, v, { key: `dictionary-new-bucket-${i}`, h: 25, color: s === 5 && (i === 2 || i === 6) ? C.red : undefined }); });
        out += arrow(184, 182, 231, 152, '', { key: 'dictionary-rehash', from: 'dictionary-old-bucket-2', to: 'dictionary-new-bucket-2', color: C.blue, role: 'internal', stage: 1 });
      } else {
        out += node('dictionary-comparison', `<rect x="235" y="106" width="169" height="164" fill="white" stroke="black"/>${text(319, 130, s >= 2 ? ['user:2 ≠ user:1', '↓', 'user:1 = user:1', '↓', '"Alice"'] : [t('select bucket', 'выбрать ячейку'), '↓', '2'], { size: 14, leading: 26, anchor: 'middle' })}`);
        out += arrow(184, 182, 231, 182, '', { key: 'dictionary-compare', from: 'dictionary-old-bucket-2', to: 'dictionary-comparison', color: C.blue, role: 'internal', stage: 1 });
      }
      return out + mNote(t(s >= 4 ? 'Rehash keeps both tables during transfer.' : 'A collision needs a full key comparison.', s >= 4 ? 'При rehash работают обе таблицы.' : 'При коллизии сравнивают полные ключи.'));
    }
    case 'encodings': {
      const names = ['String', 'List', 'Set', 'Hash', 'Sorted Set', t('Encoding growth', 'Смена представления')];
      out += text(210, 28, names[s], { anchor: 'middle', size: 18, bold: true });
      if (s === 0) {
        out += mCell(45, 75, 330, '"42" → int');
        out += mCell(45, 125, 330, '"hello" → SDS', { key: 'encoding-sds-reference' });
        out += mCell(45, 185, 330, 'len: 5 · alloc: 5', { key: 'encoding-sds-header' });
        out += mCell(45, 235, 330, 'h | e | l | l | o', { active: true });
        out += arrow(210, 161, 210, 181, '', { key: 'encoding-sds-layout', from: 'encoding-sds-reference', to: 'encoding-sds-header', role: 'internal', color: C.blue });
      } else if (s === 1) {
        out += text(210, 70, 'listpack → quicklist', { anchor: 'middle', size: 16 });
        out += box(30, 115, 160, 97, 'listpack', ['A | B | C'], { key: 'encoding-compact', size: 14, titleSize: 16, code: true });
        out += box(230, 115, 160, 97, 'listpack', ['D | E | F'], { key: 'encoding-expanded', size: 14, titleSize: 16, code: true });
        out += arrow(194, 161, 226, 161, '', { key: 'encoding-list-next', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
        out += text(210, 268, t('linked compact blocks', 'связанные компактные блоки'), { anchor: 'middle', size: 14 });
      } else {
        const compact = s === 2 ? ['intset / listpack', '[ 2, 5, 8, 13 ]'] : s === 3 ? ['listpack', 'name | Alice | age | 30'] : s === 4 ? ['listpack', 'Alice: 10 | Bob: 20'] : ['listpack / intset', t('compact entries', 'плотные записи')];
        const expanded = s === 2 ? ['hashtable', '2 · 5 · 8 · 13 · …'] : s === 3 ? ['hashtable', 'name → "Alice"'] : s === 4 ? ['skiplist + hashtable', '10 → 20 → 35'] : ['hashtable / skiplist', t('more entries / larger values', 'больше записей / крупнее значения')];
        out += box(40, 67, 340, 84, compact[0], [compact[1]], { key: 'encoding-compact', size: 14, titleSize: 16, code: true });
        out += arrow(210, 155, 210, 199, '', { key: 'encoding-transfer', from: 'encoding-compact', to: 'encoding-expanded', color: C.blue, role: 'internal', stage: 1 });
        out += box(40, 203, 340, 84, expanded[0], [expanded[1]], { key: 'encoding-expanded', active: true, size: 14, titleSize: 16, code: true });
      }
      return out + mNote(t('One data type can use different encodings.', 'У одного типа бывают разные упаковки.'));
    }
    case 'atomicity': {
      const incr = s >= 4;
      out += mCircle(65, 42, 'A', s === 1 ? 'GET count' : s === 2 ? 'SET count 1' : s === 4 ? 'INCR count' : s === 0 ? 'GET → SET' : t('local: 1', 'локально: 1'), { key: 'atomicity-client-a', color: C.green });
      out += mCircle(355, 42, 'B', s === 1 ? 'GET count' : s === 3 ? 'SET count 1' : s === 5 ? 'INCR count' : s === 0 ? 'GET → SET' : t('local: 1', 'локально: 1'), { key: 'atomicity-client-b', color: C.green });
      out += mCircle(210, 185, 'R', 'Redis', { key: 'atomicity-server', r: 37 });
      out += mCell(90, 270, 240, `count = ${s <= 1 ? 0 : s === 5 ? 2 : 1}`, { key: 'atomicity-value', size: 19 });
      if (s === 1 || s === 2 || s === 4) {
        out += arrow(87, 64, 178, 160, '', { from: 'atomicity-client-a', to: 'atomicity-server', key: 'atomicity-a-request', role: 'request', path: 'M87 64 C140 70 150 120 178 160' });
        out += arrow(174, 171, 35, 44, s === 1 ? '"0"' : incr ? ':1' : '+OK', { from: 'atomicity-server', to: 'atomicity-client-a', key: 'atomicity-a-reply', role: 'reply', color: C.green, path: 'M174 171 C90 180 15 100 35 44', labelX: 65, labelY: 177 });
      }
      if (s === 1 || s === 3 || s === 5) {
        out += arrow(333, 64, 242, 160, '', { from: 'atomicity-client-b', to: 'atomicity-server', key: 'atomicity-b-request', role: 'request', path: 'M333 64 C280 70 270 120 242 160' });
        out += arrow(246, 171, 385, 44, s === 1 ? '"0"' : incr ? ':2' : '+OK', { from: 'atomicity-server', to: 'atomicity-client-b', key: 'atomicity-b-reply', role: 'reply', color: C.green, path: 'M246 171 C330 180 405 100 385 44', labelX: 355, labelY: 177 });
      }
      return out + mNote(t(s === 3 ? 'Two writes of 1 lose one update.' : s === 5 ? 'The second INCR starts from 1.' : incr ? 'INCR reads and writes atomically.' : 'A read and a write are separate commands.', s === 3 ? 'Две записи числа 1 теряют обновление.' : s === 5 ? 'Второй INCR начинает с 1.' : incr ? 'INCR читает и записывает атомарно.' : 'Чтение и запись — отдельные команды.'));
    }
    case 'transactions': {
      const watched = s === 2 || s === 3;
      if (watched) {
        out += mCircle(80, 40, 'A', 'WATCH count', { key: 'transaction-client-a', color: C.green });
        out += mCircle(340, 40, 'B', s === 3 ? 'INCR count' : '—', { key: 'transaction-client-b', color: C.green });
        out += mCell(35, 133, 350, s === 3 ? 'count = 1 · A dirty' : 'count = 0 · WATCH active', { key: 'transaction-watch-state', active: true });
        out += arrow(210, 169, 210, 216, '', { key: 'transaction-check', from: 'transaction-watch-state', to: 'transaction-result-cell', role: 'internal', color: C.blue });
        out += mCell(35, 220, 350, s === 3 ? 'EXEC → (nil)' : 'GET count → "0"', { key: 'transaction-result-cell', color: s === 3 ? '#b44c34' : C.green });
        out += arrow(106, 57, 165, 129, '', { key: 'transaction-request', from: 'transaction-client-a', to: 'transaction-watch-state', role: 'request', path: 'M106 57 C140 65 165 96 165 129' });
        if (s === 3) out += arrow(314, 57, 270, 129, '', { key: 'transaction-b-request', from: 'transaction-client-b', to: 'transaction-watch-state', role: 'request', path: 'M314 57 C280 65 270 96 270 129' });
        const resultY = s === 3 ? 236 : 149;
        out += arrow(31, resultY, 49, 44, s === 3 ? '(nil)' : '+OK', { key: 'transaction-result', from: s === 3 ? 'transaction-result-cell' : 'transaction-watch-state', to: 'transaction-client-a', role: 'reply', color: C.green, path: `M31 ${resultY} C10 ${resultY} 10 80 49 44`, labelX: 31, labelY: s === 3 ? 202 : 123 });
      } else {
        out += mCircle(65, 28, 'A', '', { key: 'transaction-client-a', color: C.green, r: 22 });
        out += text(245, 35, s === 0 ? t('MULTI → queue', 'MULTI → очередь') : 'EXEC', { anchor: 'middle', size: 18, bold: true });
        out += mCell(35, 76, 350, s === 4 ? 'SET a text → OK' : s === 5 ? 'MULTI' : 'SET a 1', { key: 'transaction-command-0', color: s === 1 || s === 4 ? C.green : undefined });
        out += mCell(35, 127, 350, s === 4 ? 'INCR a → ERR integer' : s === 5 ? 'SET a → ERR' : 'INCR b', { key: 'transaction-command-1', color: s >= 4 ? '#b44c34' : undefined });
        out += arrow(210, 163, 210, 216, '', { key: 'transaction-queue-result', from: 'transaction-command-1', to: 'transaction-result-cell', role: 'internal', color: C.blue });
        out += mCell(35, 220, 350, s === 0 ? 'QUEUED' : s === 5 ? t('EXECABORT · no writes', 'EXECABORT · без записей') : s === 4 ? 'SET b 2 → OK' : 'a = 1 · b = 1', { key: 'transaction-result-cell', active: true });
        out += arrow(65, 54, 65, 72, '', { key: 'transaction-request', from: 'transaction-client-a', to: 'transaction-command-0', role: 'request' });
        out += arrow(31, 236, 39, 28, '', { key: 'transaction-result', from: 'transaction-result-cell', to: 'transaction-client-a', role: 'reply', color: C.green, path: 'M31 236 C5 236 5 28 39 28' });
      }
      return out + mNote(t(s === 4 ? 'A runtime error does not roll back SET.' : s === 5 ? 'Queue-time errors abort execution.' : s === 3 ? 'A changed watched key cancels EXEC.' : 'EXEC runs queued commands together.', s === 4 ? 'Ошибка исполнения не откатывает SET.' : s === 5 ? 'Ошибка в очереди отменяет исполнение.' : s === 3 ? 'Изменённый ключ отменяет EXEC.' : 'EXEC исполняет очередь вместе.'));
    }
    case 'scripting': {
      out += mCircle(65, 35, 'A', s === 4 ? 'FCALL' : s === 3 ? 'EVALSHA' : 'EVAL', { key: 'script-client-a', color: C.green, r: 24 });
      out += mCircle(355, 35, 'B', t('waits', 'ждёт'), { key: 'script-client-b', color: C.green, r: 24 });
      const lines = s === 3 ? ['SCRIPT LOAD → SHA1', t('EVALSHA → cached script', 'EVALSHA → кеш скрипта'), t('NOSCRIPT → load again', 'NOSCRIPT → загрузить заново')] : s === 4 ? ['FUNCTION LOAD', 'FCALL hello 0', 'return "hello"'] : s === 2 ? ['SET a 1', 'error("stop")', 'a = 1'] : ['INCR visits', 'if n == 1: EXPIRE visits 60', s === 5 ? 'long loop … → BUSY' : 'return n'];
      out += text(210, 107, t('Redis · executor', 'Redis · исполнитель'), { anchor: 'middle', size: 16, bold: true });
      lines.forEach((v, i) => { out += mCell(35, 132 + i * 48, 350, v, { key: `script-line-${i}`, active: i === (s === 1 ? 1 : s === 2 || s === 5 ? 2 : 0), color: s === 2 && i === 2 ? '#b44c34' : undefined }); });
      out += arrow(78, 59, 120, 128, '', { key: 'script-request', from: 'script-client-a', to: 'script-line-0', role: 'request' });
      out += arrow(342, 59, 300, 128, '', { key: 'script-b-request', from: 'script-client-b', to: 'script-line-0', role: 'request', color: C.muted, dashed: true });
      if (s !== 5) out += arrow(31, 149, 38, 40, s === 2 ? 'ERR' : s === 3 ? '"Alice"' : s === 4 ? '"hello"' : ':1', { key: 'script-reply', from: 'script-line-0', to: 'script-client-a', path: 'M31 149 C5 149 5 40 38 40', role: 'reply', color: C.green, labelX: 55, labelY: 119 });
      if (s === 5) out += arrow(389, 244, 382, 40, 'BUSY', { key: 'script-busy-reply', from: 'script-line-2', to: 'script-client-b', path: 'M389 244 C412 244 412 40 382 40', role: 'reply', color: C.green, labelX: 365, labelY: 119 });
      return out + mNote(t(s === 2 ? 'Earlier writes survive a script error.' : s === 5 ? 'After the threshold: BUSY, not automatic termination.' : s === 3 ? 'The cache may be missing: handle NOSCRIPT.' : 'Another client cannot interleave commands.', s === 2 ? 'Ранние записи остаются после ошибки.' : s === 5 ? 'После порога: BUSY, без автоматической остановки.' : s === 3 ? 'Кеш может исчезнуть: обработать NOSCRIPT.' : 'Другой клиент не вклинит свои команды.'));
    }
    case 'blocking': {
      out += mCircle(70, 39, 'A', s === 4 || s === 5 ? 'BLPOP jobs 0' : 'BLPOP jobs 5', { key: 'blocking-client-a', color: C.green });
      out += mCircle(350, 39, 'B', s === 2 ? 'RPUSH … task:1' : s === 4 ? 'BLPOP jobs 0' : 'GET user:1', { key: 'blocking-client-b', color: C.green, active: s === 1 });
      out += node('blocking-server', '<rect x="45" y="113" width="330" height="105" fill="white" stroke="black"/>');
      out += text(210, 135, 'Redis · jobs', { anchor: 'middle', bold: true, size: 17 });
      out += mCell(60, 164, 300, s === 2 ? '[ "task:1" ] → A' : '[ ]', { active: s === 2, size: 18, h: 44 });
      out += mCell(25, 254, 370, s === 2 ? t('A resumes with task:1', 'A получает task:1') : s === 3 ? t('timeout → (nil)', 'таймаут → (nil)') : s === 4 ? t('waiters: A → B', 'ожидают: A → B') : s === 5 ? t('A crashed after pop · jobs = [ ]', 'A упал после pop · jobs = [ ]') : t('A is parked · executor is free', 'A ждёт · исполнитель свободен'), { color: s === 2 ? C.green : C.muted });
      if (s === 0) out += arrow(103, 39, 150, 109, 'BLPOP', { from: 'blocking-client-a', to: 'blocking-server', path: 'M103 39 C148 39 157 80 150 109', role: 'request', labelX: 165, labelY: 92 });
      if (s === 1) out += arrow(317, 39, 270, 109, 'GET', { from: 'blocking-client-b', to: 'blocking-server', path: 'M317 39 C272 39 263 80 270 109', role: 'request', labelX: 255, labelY: 92 }) + arrow(379, 185, 380, 56, '"Alice"', { key: 'blocking-b-reply', from: 'blocking-server', to: 'blocking-client-b', path: 'M379 185 C409 185 409 90 380 56', role: 'reply', color: C.green, labelX: 345, labelY: 122 });
      if (s === 3) out += arrow(41, 185, 40, 56, '(nil)', { key: 'blocking-timeout-reply', from: 'blocking-server', to: 'blocking-client-a', path: 'M41 185 C11 185 11 90 40 56', role: 'reply', color: C.green, labelX: 70, labelY: 122 });
      if (s === 1) out += text(210, 232, 'B: GET user:1 → "Alice"', { anchor: 'middle', size: 14, color: C.blue });
      if (s === 2) out += arrow(317, 39, 270, 109, 'RPUSH', { from: 'blocking-client-b', to: 'blocking-server', path: 'M317 39 C272 39 263 80 270 109', role: 'request', color: C.red, labelX: 255, labelY: 92 }) + arrow(41, 185, 40, 56, 'task:1', { from: 'blocking-server', to: 'blocking-client-a', path: 'M41 185 C11 185 11 90 40 56', role: 'reply', color: C.green, labelX: 70, labelY: 122 });
      return out + mNote(t(s === 5 ? 'A list pop has no acknowledgement step.' : 'Waiting for a list parks only that client.', s === 5 ? 'У pop из списка нет шага подтверждения.' : 'Ожидание списка паркует только клиента.'));
    }
    case 'locks': {
      if(s===3||s===5){
        const fenced=s===5;
        out+=mCircle(75,42,'A',fenced?'write(fence=41)':'write(resource)',{key:'lock-client-a',color:C.green});
        if(!fenced)out+=mCircle(345,42,'B','write(resource)',{key:'lock-client-b',color:C.green});
        out+=mCell(30,165,360,t('External resource','Внешний ресурс'),{key:'lock-external-resource',active:true});
        out+=mCell(30,226,360,fenced?'highest fence = 42':t('A and B can both write','A и B могут писать'));
        out+=arrow(108,42,150,161,fenced?'41':'write',{key:'lock-external-a',from:'lock-client-a',to:'lock-external-resource',path:'M108 42 C165 42 175 110 150 161',labelX:171,labelY:130,role:'request'});
        if(!fenced)out+=arrow(312,42,270,161,'write',{key:'lock-external-b',from:'lock-client-b',to:'lock-external-resource',path:'M312 42 C255 42 245 110 270 161',labelX:249,labelY:130,role:'request'});
        if(fenced)out+=arrow(26,181,45,56,t('rejected','отклонено'),{key:'lock-fenced-reply',from:'lock-external-resource',to:'lock-client-a',path:'M26 181 C5 181 5 100 45 56',labelX:80,labelY:132,role:'reply',color:C.green});
        return out+mNote(t(fenced?'Fencing is enforced by the external resource.':'A expires but can resume later.',fenced?'Fencing проверяет внешний ресурс.':'Срок A истёк, но A может проснуться.'));
      }
      out += mCircle(75, 42, 'A', s >= 3 ? t('old token-A', 'старый token-A') : 'token-A', { key: 'lock-client-a', color: C.green });
      out += mCircle(345, 42, 'B', 'token-B', { key: 'lock-client-b', color: C.green });
      if (s === 2) out += mCell(45, 142, 330, 'lock → ∅', { key: 'lock-expired', pass: 0, transient: true, size: 17, h: 42 });
      out += mCell(45, 142, 330, `lock → ${s < 2 ? 'token-A' : 'token-B'}`, { key: 'lock-value', pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, size: 17, h: 42 });
      if (s === 0 || s >= 3) out += arrow(108, 42, 145, 138, '', { from: 'lock-client-a', to: 'lock-value', path: 'M108 42 C150 42 155 100 145 138', role: 'request' });
      if (s === 1 || s === 2) out += arrow(312, 42, 275, 138, '', { from: 'lock-client-b', to: 'lock-value', path: 'M312 42 C270 42 265 100 275 138', role: 'request' });
      if (s === 0 || s === 1 || s === 4) out += arrow(s === 1 ? 379 : 41, 164, s === 1 ? 375 : 45, 56, s === 0 ? '+OK' : s === 1 ? '(nil)' : ':0', { from: 'lock-value', to: s === 1 ? 'lock-client-b' : 'lock-client-a', path: s === 1 ? 'M379 164 C411 164 411 100 375 56' : 'M41 164 C9 164 9 100 45 56', labelX: s === 1 ? 365 : 55, labelY: 125, role: 'reply', color: C.green });
      out += text(210, 222, s === 1 ? 'SET … NX → (nil)' : s === 4 ? t('token-A ≠ token-B → keep lock', 'token-A ≠ token-B → не удалять') : s === 5 ? t('external fence: reject old token', 'внешний fence: старый номер отклонён') : s >= 2 ? t('A expired · B acquired the lease', 'срок A истёк · аренда у B') : 'SET lock token-A NX PX 5000', { key: 'lock-status', motion: 'change', stage: 2, pass: s === 2 ? 1 : 0, previousUntil: s === 2 ? 0 : undefined, anchor: 'middle', size: 14 });
      out += `<path d="M30 270 H390" stroke="${C.line}" stroke-width="3"/>`;
      out += mCell(30, 253, 170, t('token-A: 0…5s', 'token-A: 0…5с'), { color: s < 2 ? C.green : C.muted });
      if (s >= 2) out += mCell(220, 253, 170, t('token-B: 5…10s', 'token-B: 5…10с'), { key: 'lock-b-timeline', pass: s === 2 ? 1 : 0, color: C.blue });
      return out + mNote(t(s >= 3 ? 'An expired client can wake up later.' : 'NX grants a time-limited lease.', s >= 3 ? 'Старый клиент может проснуться позже.' : 'NX выдаёт аренду на ограниченный срок.'));
    }
    case 'expiry': {
      if (s === 5) {
        out += mCircle(75, 90, 'P', 'Primary', { key: 'expiry-primary-server', r: 31 });
        out += mCircle(345, 90, 'R', t('Replica', 'Реплика'), { key: 'expiry-replica-server', r: 31 });
        out += mCell(15, 215, 180, 'session → ∅', { key: 'expiry-primary', pass: 0 });
        out += arrow(110, 90, 310, 90, 'DEL / UNLINK', { key: 'expiry-propagation', from: 'expiry-primary-server', to: 'expiry-replica-server', role: 'sync', color: C.blue });
        out += mCell(225, 215, 180, 'session → ∅', { key: 'expiry-replica', pass: 1 });
        return out + mNote(t('Delete on primary, then on replica.', 'Удалить в primary, затем в реплике.'));
      }

      const gone = s === 2 || s === 3 || s === 5;
      out += mCircle(210, 35, 'T', s === 0 ? '10:00:02' : '10:00:06', { color: C.blue, r: 25 });
      out += text(25, 119, t('Key dictionary', 'Словарь ключей'), { size: 14, bold: true });
      out += mCell(25, 132, 370, gone ? 'session → ∅' : 'session → "abc"', { key: 'expiry-key-dictionary', active: gone });
      out += text(25, 205, t('Expiry dictionary', 'Словарь сроков'), { size: 14, bold: true });
      out += mCell(25, 218, 370, gone || s === 4 ? 'session → ∅' : 'session → 10:00:05', { key: 'expiry-deadline-dictionary', color: s === 1 ? '#b44c34' : C.blue });
      out += text(210, s === 2 || s === 4 ? 332 : 286, s === 1 ? 'GET → (nil)' : s === 2 ? t('GET → lazy expiry', 'GET → ленивое удаление') : s === 3 ? t('active expiry → DEL', 'активная очистка → DEL') : s === 4 ? 'SET session abc → TTL -1' : s === 5 ? t('Primary → DEL → replica', 'Primary → DEL → реплика') : 'SET session abc EX 5', { size: 14, anchor: 'middle' });
      if (s === 2 || s === 4) {
        out += mCircle(210, 285, 'C', '', { key: 'expiry-client', color: C.green, r: 18 });
        out += arrow(190, 275, 21, 148, s === 2 ? 'GET' : 'SET', { key: 'expiry-access-request', from: 'expiry-client', to: 'expiry-key-dictionary', path: 'M190 275 C5 275 5 148 21 148', role: 'request', labelX: 40, labelY: 193 });
        out += arrow(399, 148, 232, 285, s === 2 ? '(nil)' : '+OK', { key: 'expiry-access-reply', from: 'expiry-key-dictionary', to: 'expiry-client', path: 'M399 148 C414 148 414 285 232 285', role: 'reply', color: C.green, labelX: 372, labelY: 193 });
      }
      if (s === 3) out += arrow(21, 234, 21, 148, '', { from: 'expiry-deadline-dictionary', to: 'expiry-key-dictionary', path: 'M21 234 C5 234 5 148 21 148', role: 'internal', color: C.blue });
      return out + mNote(t(s === 1 ? 'Logically absent; bytes may remain.' : s === 4 ? 'Plain SET removes the old TTL.' : 'Access and active expiry remove old keys.', s === 1 ? 'Ключ недоступен; байты ещё могут быть.' : s === 4 ? 'Обычный SET снимает прежний TTL.' : 'Ключи убирают при чтении и очистке.'));
    }
    case 'memory': {
      if (s === 5) {
        out += text(210, 28, 'DEL / UNLINK', { anchor: 'middle', size: 18 });
        out += mCell(30, 70, 360, t('key is absent immediately', 'ключ сразу отсутствует'), { key: 'unlink-key', pass: 0 });
        out += mCell(30, 140, 360, t('UNLINK: memory awaits reclamation', 'UNLINK: память ждёт освобождения'), { key: 'unlink-pending', pass: 0, transient: true });
        out += arrow(210, 176, 210, 234, 'lazyfree', { key: 'unlink-background', from: 'unlink-pending', to: 'unlink-freed', role: 'internal', color: C.blue });
        out += mCell(30, 238, 360, t('memory is reclaimed', 'память освобождена'), { key: 'unlink-freed', pass: 1 });
        return out + mNote(t('DEL also frees during its execution.', 'DEL освобождает во время команды.'));
      }

      out += text(25, 28, 'maxmemory', { size: 17, bold: true });
      out += node('memory-limit-bar', `<rect x="25" y="50" width="370" height="39" fill="${C.pale}" stroke="${C.ink}"/>`);
      [130, 110, s === 0 ? 75 : 130].forEach((w, i) => { out += `<rect x="${25 + [0, 130, 240][i]}" y="50" width="${w}" height="39" fill="${[C.red, C.green, C.blue][i]}"/>`; });
      ['hot:key', 'old:key', 'rare:key'].forEach((v, i) => { const gone = s === 1 && i === 1 || s === 2 && i === 2; out += mCell(25 + i * 127, 135, 116, gone ? `${v} → ∅` : v, { key: `memory-key-${i}`, color: gone ? '#b44c34' : undefined }); });
      out += mCell(25, s === 3 ? 259 : 212, 370, s === 1 ? 'allkeys-lru → old:key' : s === 2 ? 'allkeys-lfu → rare:key' : s === 3 ? t('noeviction → OOM error', 'noeviction → ошибка OOM') : s === 4 ? t('RSS = data + overhead + fragmentation', 'RSS = данные + расходы + фрагментация') : s === 5 ? 'DEL / UNLINK' : t('space for data is bounded', 'объём памяти для данных ограничен'), { key: 'memory-eviction-policy', active: true });
      if (s === 1 || s === 2) out += arrow(210, 208, s === 1 ? 210 : 335, 171, t('sample', 'выборка'), { from: 'memory-eviction-policy', to: `memory-key-${s === 1 ? 1 : 2}`, role: 'internal', color: C.blue });
      if (s === 5) out += text(210, 284, [t('DEL: remove + free', 'DEL: удалить + освободить'), t('UNLINK: remove → lazyfree', 'UNLINK: удалить → lazyfree')], { size: 14, anchor: 'middle', leading: 20 });
      if (s === 3) {
        out += mCircle(210, 215, 'C', '', { key: 'memory-client', color: C.green, r: 18 });
        out += arrow(188, 215, 21, 74, 'SET', { key: 'memory-oom-request', from: 'memory-client', to: 'memory-limit-bar', path: 'M188 215 C5 215 5 74 21 74', role: 'request', labelX: 40, labelY: 113 });
        out += arrow(399, 74, 232, 215, 'OOM', { key: 'memory-oom-reply', from: 'memory-limit-bar', to: 'memory-client', path: 'M399 74 C415 74 415 215 232 215', role: 'reply', color: C.green, labelX: 375, labelY: 113 });
      }
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
      out += node('latency-client-line', `<path d="M40 45 V282" stroke="${C.line}" stroke-width="2"/>`) + node('latency-server-line', `<path d="M380 45 V282" stroke="${C.line}" stroke-width="2"/>`);
      if (s === 0) {
        for (let i = 0; i < 3; i++) { out += arrow(40, 60 + i * 69, 380, 82 + i * 69, `GET ${['a', 'b', 'c'][i]}`, { from: 'latency-client-line', to: 'latency-server-line' }); out += arrow(380, 98 + i * 69, 40, 119 + i * 69, '', { from: 'latency-server-line', to: 'latency-client-line', color: C.green }); }
      } else if (s === 1) {
        out += arrow(40, 66, 380, 93, 'GET a · GET b · GET c', { from: 'latency-client-line', to: 'latency-server-line' });
        out += mCell(80, 142, 260, t('shared network wait', 'общее сетевое ожидание'), { color: C.blue });
        out += arrow(380, 225, 40, 256, 'a · b · c', { from: 'latency-server-line', to: 'latency-client-line', color: C.green });
      } else {
        out += arrow(40, 67, 380, 93, s === 3 ? 'SCAN 0 COUNT 100' : s === 4 ? 'GET large:blob' : s === 5 ? 'SLOWLOG GET' : 'KEYS user:*', { from: 'latency-client-line', to: 'latency-server-line' });
        out += box(75, 137, 270, 92, s === 3 ? t('cursor → 84 → … → 0', 'курсор → 84 → … → 0') : s === 4 ? t('Output buffer', 'Выходной буфер') : s === 5 ? 'INFO · SLOWLOG' : t('Executor busy', 'Исполнитель занят'), [s === 4 ? t('[reply][reply][reply]', '[ответ][ответ][ответ]') : s === 3 ? t('repeat cursor calls', 'повторять с курсором') : s === 5 ? t('measure the delay', 'измерить задержку') : t('short commands wait', 'короткие команды ждут')], { size: 14, titleSize: 14, active: true, code: true });
        out += arrow(380, 253, 40, 275, t('reply', 'ответ'), { from: 'latency-server-line', to: 'latency-client-line', color: C.green });
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
        if (childActive && (s < 2 || i !== 1)) out += arrow(174, 81 + i * 55, 246, 81 + i * 55, '', { from: `rdb-parent-${i}`, to: `rdb-child-${i}`, color: s === 1 ? C.blue : C.line, role: 'internal' });
      }
      if (s === 2) out += arrow(246, 136, 174, 136, 'COW', { key: 'rdb-copy', from: 'rdb-child-1', to: 'rdb-parent-1', role: 'internal', color: C.blue });
      if (s === 3) out += arrow(325, 211, 325, 246, '', { key: 'rdb-write', from: 'rdb-child-2', to: 'rdb-file', role: 'internal', color: C.blue });
      if (s === 5) out += arrow(95, 246, 95, 211, 'load RDB', { key: 'rdb-recovery', from: 'rdb-file', to: 'rdb-parent-2', role: 'internal', color: C.blue });
      out += mCell(65, 250, 290, s === 5 ? t('restart → user:1 = Alice', 'перезапуск → user:1 = Alice') : s === 3 ? t('dump.rdb → writing Alice', 'dump.rdb → запись Alice') : s === 4 ? t('dump.rdb → complete: Alice', 'dump.rdb → готово: Alice') : s === 0 ? 'RAM: user:1 = Alice' : t('fork → shared pages', 'fork → общие страницы'), { key: 'rdb-file', active: s >= 3 });
      return out + mNote(t(s === 5 ? 'Writes after the snapshot are absent.' : 'A write copies changed shared pages.', s === 5 ? 'Записей после снимка здесь нет.' : 'Запись копирует изменяемые общие страницы.'));
    }
    case 'aof': {
      const titles = s >= 4 ? [t('Current data', 'Текущие данные'), t('AOF files', 'Файлы AOF'), t('Recovery', 'Восстановление')] : ['Redis RAM', t('OS page cache', 'Кеш страниц ОС'), t('Storage', 'Накопитель')];
      const rows = s >= 4 ? [t('fork → new base', 'fork → новая основа'), t('base + incremental + manifest', 'основа + приращения + манифест'), s === 5 ? t('load base → replay incremental', 'основа → проиграть приращения') : t('publish manifest', 'публикация manifest')] : [s === 3 ? '∅' : t('SET Bob · AOF buffer', 'SET Bob · буфер AOF'), s === 3 ? '∅' : s >= 1 ? 'write() → SET Bob' : '∅', s === 3 ? 'Bob · fsynced' : s >= 2 ? 'fsync() → SET Bob' : '∅'];
      titles.forEach((name, i) => { out += box(40, 16 + i * 100, 340, 73, name, [rows[i]], { key: `aof-layer-${i}`, size: 14, titleSize: 16, active: i === Math.min(s, 2), code: true, pass: s === 3 && i < 2 ? 1 : undefined, previousUntil: s === 3 && i < 2 ? 0 : undefined, stateMotion: s === 3 && i === 2 ? 'context' : undefined }); if (i < 2) out += arrow(210, 93 + i * 100, 210, 112 + i * 100, '', { from: `aof-layer-${i}`, to: `aof-layer-${i + 1}`, color: C.blue, role: 'internal', stage: 1 }); });
      if (s === 3) {
        out += text(56, 73, 'SET Carol · AOF buffer', { key: 'aof-crash-ram', size: 14, motion: 'change', pass: 0, transient: true });
        out += text(56, 173, 'write() → SET Carol', { key: 'aof-crash-os', size: 14, motion: 'change', pass: 0, transient: true });
      }
      return out + mNote(t(s === 3 ? 'Chosen crash: Carol is lost; fsynced Bob survives.' : s >= 4 ? 'The manifest selects files for recovery.' : 'write() and fsync() are separate steps.', s === 3 ? 'Выбранный сбой: Carol потеряна, Bob сохранён.' : s >= 4 ? 'Манифест выбирает файлы восстановления.' : 'write() и fsync() — разные шаги.'));
    }
    case 'replication': {
      out += mCircle(75, 75, 'P', 'Primary', { key: 'replication-primary', r: 31 });
      out += mCircle(345, 75, 'R', t('Replica', 'Реплика'), { key: 'replication-replica', r: 31 });
      if (s < 4) out += arrow(104, 56, 316, 56, s === 2 ? 'CONTINUE 101…120' : s === 3 ? t('RDB + stream', 'RDB + поток') : 'SET k v', { key: 'replication-stream', from: 'replication-primary', to: 'replication-replica', role: 'sync', motion: s >= 4 ? 'context' : undefined, color: s === 0 ? C.line : C.blue, dashed: s === 0 });
      if (s === 0) out += mCircle(210, 185, 'C', '', { key: 'replication-client', color: C.green, r: 18 }) + arrow(101, 98, 190, 173, '+OK', { key: 'replication-client-ok', from: 'replication-primary', to: 'replication-client', role: 'reply', color: C.green });
      if (s === 2 || s === 3) out += arrow(345, 40, 75, 40, s === 2 ? 'PSYNC <id> 101' : 'PSYNC ? -1', { key: 'replication-request', from: 'replication-replica', to: 'replication-primary', path: 'M345 40 C345 10 75 10 75 40', labelX: 210, labelY: 13, role: 'request', color: C.red });
      if (s >= 4) out += mCircle(210, 185, 'C', '', { key: 'replication-client', color: C.green, r: 18 }) + arrow(190, 173, 101, 98, s === 4 ? 'WAIT' : 'WAITAOF', { key: 'replication-request', from: 'replication-client', to: 'replication-primary', role: 'request', color: C.red });
      if (s >= 4) {
        out += arrow(75, 40, 345, 40, 'REPLCONF GETACK *', { key: 'replication-getack', from: 'replication-primary', to: 'replication-replica', path: 'M75 40 C75 10 345 10 345 40', labelX: 210, labelY: 13, role: 'sync', color: C.blue });
      }
      out += arrow(316, 96, 104, 96, s === 5 ? 'ACK 120 · FACK 120' : s === 0 ? 'ACK 100' : 'ACK 120', { key: 'replication-ack', from: 'replication-replica', to: 'replication-primary', role: s >= 4 ? 'sync' : 'reply', motion: s === 0 ? 'context' : 'flow', color: C.green });
      if (s >= 4) {
        out += arrow(83, 110, 192, 197, s === 4 ? ':1' : '[1,1]', { key: 'replication-wait-reply', from: 'replication-primary', to: 'replication-client', labelX: 118, labelY: 155, role: 'reply', color: C.green });
      }
      if (s === 5) out += text(210, 220, 'AOF fsync → offset 120', { key: 'replication-fsync', size: 13, anchor: 'middle', motion: 'change', stage: 2, color: C.blue });
      out += text(75, 174, ['k = v', t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += text(345, 174, [s === 0 ? 'k = ∅' : 'k = v', s === 0 ? t('offset 100', 'смещение 100') : t('offset 120', 'смещение 120')], { anchor: 'middle', size: 14, leading: 22 });
      out += mCell(25, 245, 370, s === 2 ? 'PSYNC → +CONTINUE' : s === 3 ? t('FULLRESYNC → RDB + suffix', 'FULLRESYNC → RDB + приращения') : s === 4 ? 'WAIT 1 1000 → 1' : s === 5 ? 'WAITAOF 1 1 1000 → [1, 1]' : s === 0 ? t('primary OK · replica is behind', 'primary OK · реплика отстаёт') : t('replica applies offset 120', 'реплика применила смещение 120'), { active: true, stage: s >= 4 ? 4 : 2 });
      return out + mNote(t(s === 5 ? 'WAITAOF waits for AOF fsync acknowledgements.' : 'An acknowledgement is not Raft consensus.', s === 5 ? 'WAITAOF ждёт подтверждений fsync AOF.' : 'Подтверждение — ещё не консенсус Raft.'));
    }
    case 'sentinel': {
      out += text(210, 20, s === 1 ? 'SDOWN' : s === 2 ? t('ODOWN · quorum', 'ODOWN · кворум') : s >= 3 ? t('election → failover', 'выборы → переключение') : 'Sentinel', { size: 16, anchor: 'middle' });
      const probes = [70, 210, 350].map(x => {
        const dx = 110 - x, dy = 209 - 72, length = Math.hypot(dx, dy);
        return [x + dx / length * 27, 72 + dy / length * 27, 110 - dx / length * 39, 209 - dy / length * 39];
      });
      [70, 210, 350].forEach((x, i) => { out += mCircle(x, 72, `S${i + 1}`, '', { key: `sentinel-${i}`, r: 23, color: C.server, active: s === 1 && i === 0 || s >= 2, size: 14 }); if (s <= 2) out += arrow(...probes[i], '', { key: `sentinel-probe-${i}`, from: `sentinel-${i}`, to: 'sentinel-old-server', role: 'request', color: s >= 1 ? C.muted : C.blue, dashed: s >= 1 }); });
      out += sentinelRole(mCircle(110, 209, 'P', s >= 3 ? t('old primary', 'старый primary') : 'Primary', { r: 35, failed: s >= 1 && s !== 5, key: 'sentinel-old-server' }), 'sentinel-old-role');
      out += sentinelRole(mCircle(310, 209, s >= 3 ? 'P' : 'R', s >= 3 ? 'Primary' : t('Replica', 'Реплика'), { r: 35, active: s >= 3, key: 'sentinel-new-server' }), 'sentinel-new-role');
      if (s === 0) out += arrow(probes[1][2], probes[1][3], probes[1][0], probes[1][1], 'PONG', { key: 'sentinel-pong', from: 'sentinel-old-server', to: 'sentinel-1', role: 'reply', color: C.green });
      if (s === 1) out += arrow(...probes[0], 'PING', { key: 'sentinel-timeout-probe', from: 'sentinel-0', to: 'sentinel-old-server', role: 'request', color: C.red });
      if (s === 2) out += arrow(97, 72, 183, 72, '', { key: 'sentinel-report', from: 'sentinel-0', to: 'sentinel-1', role: 'sync', color: C.blue });
      if (s === 3) out += arrow(226, 94, 287, 178, '', { key: 'sentinel-promote', from: 'sentinel-1', to: 'sentinel-new-server', role: 'sync', color: C.blue });
      if (s === 4) {
        out += mCircle(210, 136, 'C', '', { key: 'sentinel-client', color: C.green, r: 18 });
        out += arrow(202, 114, 202, 98, '', { key: 'sentinel-discover', from: 'sentinel-client', to: 'sentinel-1', role: 'request' });
        out += arrow(218, 98, 218, 114, '', { key: 'sentinel-address-reply', from: 'sentinel-1', to: 'sentinel-client', role: 'reply', color: C.green });
        out += arrow(230, 145, 278, 187, '', { key: 'sentinel-reconnect', from: 'sentinel-client', to: 'sentinel-new-server', motion: 'change', stage: 2, role: 'internal', color: C.blue });
      }
      if (s === 5) out += node('sentinel-partition', `<path d="M210 139 V285" stroke="${C.ink}" stroke-dasharray="5 5"/>${text(110, 293, 'k = v2', { size: 14, anchor: 'middle' })}${text(310, 293, 'k = v1', { size: 14, anchor: 'middle' })}`, { motion: 'change', stage: 2 });
      else out += text(210, 294, s === 4 ? t('discover → reconnect to new primary', 'узнать адрес → новый primary') : s >= 3 ? t('replica is promoted', 'реплика повышена') : t('independent failure observations', 'независимые наблюдения за сбоем'), { anchor: 'middle', size: 14 });
      return out + mNote(t(s === 5 ? 'An acknowledged v2 was not replicated.' : 'Detection and election are separate.', s === 5 ? 'Подтверждённая v2 не дошла до реплики.' : 'Обнаружение сбоя и выборы различаются.'));
    }
    case 'cluster': {
      out += mCell(25, 13, 370, s === 1 || s === 5 ? '{user:7}:cart · {user:7}:profile' : 'CRC16(key) mod 16384 = 12182', { key: 'cluster-hash-value' });
      out += mCircle(210, 88, 'C', t('Client', 'Клиент'), { key: 'cluster-client', color: C.green, r: 24 });
      const target = s === 4 ? 1 : s === 2 || s === 3 ? 2 : -1;
      ['A', 'B', 'C'].forEach((name, i) => { out += mCircle(70 + i * 140, 224, name, ['0…5460', '5461…10922', '10923…16383'][i], { key: `cluster-${name.toLowerCase()}`, r: 29, active: i === target, size: 17 }); });
      if (target >= 0) out += arrow(s === 4 ? 210 : 230, s === 4 ? 116 : 108, target === 1 ? 210 : 326, target === 1 ? 191 : 201, s === 4 ? 'ASKING + GET' : 'GET key', { key: 'cluster-retry', from: 'cluster-client', to: `cluster-${target === 1 ? 'b' : 'c'}`, role: 'request', color: C.red });
      if (s === 1 || s === 5) out += arrow(210, 49, 210, 60, '', { key: 'cluster-hash', from: 'cluster-hash-value', to: 'cluster-client', role: 'internal', color: C.blue });
      if (s === 4) out += arrow(333, 196, 236, 98, '', { key: 'cluster-ask', from: 'cluster-c', to: 'cluster-client', role: 'reply', color: C.green });
      if (s === 3) out += arrow(94, 201, 190, 108, '', { key: 'cluster-moved', from: 'cluster-a', to: 'cluster-client', role: 'reply', color: C.green });
      out += text(210, 294, s === 3 ? t('A → client: MOVED 12182 C', 'A → клиент: MOVED 12182 C') : s === 4 ? t('C → client: ASK 12182 B', 'C → клиент: ASK 12182 B') : s === 5 ? t('multi-key → same slot required', 'много ключей → нужен один слот') : s === 1 ? t('same tag → same slot', 'один hash tag → один слот') : s === 2 ? t('client routes directly to C', 'клиент обращается сразу к C') : t('16384 slots', '16384 слота'), { size: 14, anchor: 'middle' });
      return out + mNote(t(s === 4 ? 'Client retries with ASKING on B.' : s === 3 ? 'Client updates its map and retries on C.' : 'Slot ownership tells the client where to go.', s === 4 ? 'Клиент повторяет с ASKING на B.' : s === 3 ? 'Клиент меняет карту и повторяет на C.' : 'Владелец слота задаёт маршрут клиента.'));
    }
    case 'pubsub': {
      const payload=s===3?'next':s===5?'shard:hello':'hello';
      out += mCircle(210, 40, 'B', `${s===5?'SPUBLISH':'PUBLISH'} news ${payload}`, { key: 'pubsub-publisher', color: C.green, r: 25, active: s === 1 });
      if (s === 0 || s === 4) out += arrow(190, 235, 190, 192, 'SUBSCRIBE', { key: 'pubsub-subscribe', from: 'pubsub-subscriber', to: 'pubsub-server', role: 'request', color: C.red, labelX: 105 });
      out += arrow(239, 45, 244, 158, '', { key: 'pubsub-publish', from: 'pubsub-publisher', to: 'pubsub-server', path: 'M239 45 C290 75 290 134 244 158', role: 'request', color: [1,2,3,5].includes(s)?C.red:C.line });
      out += mCircle(210, 167, 'R', s === 5 ? t('shard: news', 'шард: news') : t('channel: news', 'канал: news'), { key: 'pubsub-server', r: 29 });
      out += arrow(230, 192, 230, 235, '', { key: 'pubsub-delivery-a', from: 'pubsub-server', to: 'pubsub-subscriber', role: 'sync', stage: 1, color:s===2||s===5?C.blue:C.line,dashed:s===3 });
      out += mCircle(210, 260, 'A', '', { key: 'pubsub-subscriber', color: s === 3 ? C.muted : C.green, failed:s===3 });
      out += text(210, 305, s===3?t('offline','отключён'):s===4?t('new only','только новое'):s===5?'"shard:hello"':s===2?'"hello"':t('inbox: empty','входящих нет'), {key:'pubsub-inbox',motion:'change',stage:2,pass:s===5?1:0,anchor:'middle',size:14});
      return out + mNote(t(s === 5 ? 'SPUBLISH limits delivery to a shard.' : s >= 3 ? 'A cannot replay a missed message.' : 'Messages go to current subscribers.', s === 5 ? 'SPUBLISH ограничивает доставку шардом.' : s >= 3 ? 'A не может получить пропущенное.' : 'Сообщения идут текущим подписчикам.'));
    }
    case 'streams': {
      if (s === 5) {
        out += mCell(100, 35, 220, 'radix tree · rax', { key: 'stream-index', pass: 0 });
        out += arrow(170, 71, 110, 141, '1000-0', { from: 'stream-index', to: 'stream-leaf-a', role: 'internal', color: C.blue });
        out += arrow(250, 71, 310, 141, '1001-0', { from: 'stream-index', to: 'stream-leaf-b', role: 'internal', color: C.blue });
        out += box(20, 145, 180, 102, 'listpack', ['1000-0', 'job → A'], { key: 'stream-leaf-a', pass: 1, size: 14, titleSize: 16, code: true });
        out += box(220, 145, 180, 102, 'listpack', ['1001-0', 'job → B'], { key: 'stream-leaf-b', pass: 1, size: 14, titleSize: 16, code: true });
        return out + mNote(t('ID ranges lead to compact entry blocks.', 'Диапазоны ID ведут к компактным блокам.'));
      }
      out += text(25, 25, 'stream: orders', { size: 16, bold: true });
      out += mCell(25, 43, 370, '1000-0 · order:42', { key: 'stream-entry-0' });
      if (s >= 2) out += mCell(25, 116, 370, s <= 1 ? t('no consumer group yet', 'группы обработчиков ещё нет') : s === 3 ? 'PEL: ∅ · XACK' : s === 4 ? 'PEL: 1000-0 → B' : 'PEL: 1000-0 → A', { key: 'stream-pending', pass: s === 4 ? 1 : 0, previousUntil: s === 4 ? 0 : undefined, active: s >= 2 });
      if (s === 4) out += mCell(25, 116, 370, 'PEL: 1000-0 → A', { key: 'stream-pending-before-claim', pass: 0, transient: true, active: true });
      out += mCircle(90, 214, 'A', s === 0 ? 'XADD' : s === 1 ? 'XREAD' : s === 3 ? 'XACK' : s === 4 ? t('crashed', 'сбой') : 'XREADGROUP', { key: 'stream-a', color: s === 4 ? C.muted : C.green });
      out += mCircle(330, 214, 'B', s === 4 ? 'XAUTOCLAIM' : 'XREADGROUP', { key: 'stream-b', color: C.green, active: s === 4 });
      if (s === 4) out += arrow(330, 181, 330, 152, 'XAUTOCLAIM', { key: 'stream-claim-request', from: 'stream-b', to: 'stream-pending', role: 'request', labelX: 260 }) + arrow(306, 152, 309, 189, '', { key: 'stream-claim-delivery', from: 'stream-pending', to: 'stream-b', role: 'reply', color: C.green });
      else if (s <= 1) out += arrow(90, 181, 90, 79, s === 0 ? 'XADD' : 'XREAD', { key: s === 0 ? 'stream-add-request' : 'stream-read-request', from: 'stream-a', to: 'stream-entry-0', role: 'request', labelX: 62 }) + arrow(125, 79, 108, 184, '1000-0', { key: s === 0 ? 'stream-id-reply' : 'stream-read-reply', from: 'stream-entry-0', to: 'stream-a', role: 'reply', color: C.green, labelX: 170 });
      else out += arrow(90, 181, 90, 152, '', { key: s === 3 ? 'stream-ack-request' : 'stream-read-request', from: 'stream-a', to: 'stream-pending', role: 'request' }) + arrow(125, 152, 108, 184, s === 3 ? ':1' : '1000-0', { key: s === 3 ? 'stream-ack-reply' : 'stream-read-reply', from: 'stream-pending', to: 'stream-a', role: 'reply', color: C.green, labelX: 180 });
      return out + mNote(t(s === 3 ? 'XACK clears pending work, not the entry.' : s === 4 ? 'Retry delivery; keep processing idempotent.' : s === 1 ? 'XREAD reads without removing entries.' : 'The stream and its pending list differ.', s === 3 ? 'XACK убирает ожидание, не саму запись.' : s === 4 ? 'Повторная доставка требует идемпотентности.' : s === 1 ? 'XREAD читает без удаления записей.' : 'Stream и список ожидания — разные вещи.'));
    }
    case 'specialized': {
      const names = ['JSON', t('Search', 'Поиск'), t('Vectors', 'Векторы'), t('Time series', 'Ряды времени'), t('Bitmap / Geo', 'Биты / Гео'), t('Probabilistic', 'Вероятностные')];
      out += text(210, 30, names[s], { size: 18, anchor: 'middle', bold: true });
      if (s === 0) {
        out += mCell(135, 70, 150, 'user:1', {key: 'json-root', motion:'context'});
        out += arrow(170, 106, 110, 161, '', { from: 'json-root', to: 'json-name', role: 'internal', color: C.blue });
        out += arrow(250, 106, 310, 161, '', { from: 'json-root', to: 'json-age', role: 'internal', color: C.blue });
        out += mCell(25, 165, 170, 'name: Alice', { key: 'json-name' });
        out += mCell(225, 165, 170, 'age: 31', { key: 'json-age' });
        out += mCell(25, 247, 370, '$.age: 30 → 31', { active: true });
      } else if (s === 1) {
        out += mCell(80, 75, 260, '"redis"', { key: 'search-query' });
        out += arrow(210, 111, 210, 177, '', { from: 'search-query', to: 'search-posting', role: 'internal', color: C.blue });
        out += mCell(40, 181, 340, 'doc:2 → doc:7 → doc:12', { key: 'search-posting', active: true });
        out += text(210, 272, t('term → inverted index → document IDs', 'термин → индекс → ID документов'), { size: 14, anchor: 'middle' });
      } else if (s === 2) {
        out += `<path d="M65 80 V260 H365" stroke="${C.line}" fill="none" stroke-width="2"/>`;
        [[100, 210], [148, 186], [200, 148], [230, 160], [315, 90]].forEach(([x, y], i) => { out += node(`vector-${i}`, `<circle cx="${x}" cy="${y}" r="${i === 2 ? 8 : 6}" fill="${i === 2 ? C.green : C.red}"/>`, { motion: i === 2 ? 'change' : 'context' }); });
        out += arrow(211, 152, 220, 156, '', { from: 'vector-2', to: 'vector-3', role: 'internal', color: C.blue });
        out += `<circle cx="200" cy="148" r="48" fill="none" stroke="${C.blue}" stroke-dasharray="5 4"/>`;
        out += text(210, 295, t('HNSW / FLAT → nearest neighbors', 'HNSW / FLAT → ближайшие соседи'), { size: 14, anchor: 'middle' });
      } else if (s === 3) {
        out += `<path d="M45 245 H380 M45 245 V70" fill="none" stroke="${C.line}" stroke-width="2"/><path d="M70 170 L160 145 L250 220 L340 120" fill="none" stroke="${C.red}" stroke-width="3"/>`;
        [[70,170,21],[160,145,22],[250,220,19],[340,120,23]].forEach(([x,y,value],i)=>{out+=node(`timeseries-point-${i}`, `<circle cx="${x}" cy="${y}" r="4" fill="${C.red}"/>${text(x,y-10,String(value),{size:14,anchor:'middle'})}`);});
        out += arrow(340, 128, 320, 280, 'AVG', { from: 'timeseries-point-3', to: 'timeseries-average', path: 'M340 128 C390 210 365 248 320 280', labelX: 380, labelY: 224, role: 'internal', color: C.blue });
        out += mCell(100, 284, 220, 'AVG = 21.25', {key:'timeseries-average',motion:'change',stage:2,size:14});
      } else if (s === 4) {
        Array.from('10100100').forEach((bit, i) => { out += mCell(25 + i * 47, 85, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
        out += text(210, 149, 'GETBIT flags 2 → 1', { anchor: 'middle', size: 14 });
        out += mCell(25, 190, 150, 'lon · lat', { key: 'geo-coordinates', motion: 'context' });
        out += arrow(179, 206, 221, 206, 'geohash', { from: 'geo-coordinates', to: 'geo-index', labelY: 180, role: 'internal', color: C.blue });
        out += mCell(225, 190, 170, 'Sorted Set', { key: 'geo-index' });
        out += text(210, 266, t('bit position / geographic neighborhood', 'позиция бита / соседство на карте'), { size: 14, anchor: 'middle' });
      } else {
        out += text(25, 82, t('HyperLogLog · registers', 'HyperLogLog · регистры'), { size: 14 });
        ['3', '0', '2', '5', '1', '0'].forEach((v, i) => { out += mCell(25 + i * 63, 100, 54, v, { key: `hll-register-${i}` }); });
        out += arrow(365, 136, 274, 168, t('estimate', 'оценить'), { from: 'hll-register-5', to: 'hll-result', labelX: 330, labelY: 155, role: 'internal', color: C.blue });
        out += mCell(150, 152, 120, '≈ N', { key: 'hll-result' });
        out += text(25, 195, t('Bloom · hash → bit positions', 'Bloom · хеш → позиции битов'), { size: 14 });
        Array.from('00101010').forEach((bit, i) => { out += mCell(25 + i * 47, 214, 41, bit, { color: bit === '1' ? C.blue : undefined }); });
      }
      return out + mNote(t('An index trades memory for specific queries.', 'Индекс меняет память на удобство поиска.'));
    }
    default: return compactScene('first-key', s, lang);
  }
}

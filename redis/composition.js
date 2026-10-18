/* Geometry is independent of narration and locale. The motion player moves whole
 * semantic actors: a table moves as one object, not as eight unrelated cells. */
const point = (key, x, y, extra = {}) => ({ key, x, y, ...extra });
const requestKeys = ['request-socket', 'request-buffer', 'request-parser', 'request-checks', 'request-output'];
const chapterIds = ['first-key', 'request', 'event-loop', 'dictionary', 'encodings', 'atomicity', 'transactions', 'scripting', 'blocking', 'locks', 'expiry', 'memory', 'latency', 'rdb', 'aof', 'replication', 'sentinel', 'cluster', 'pubsub', 'streams', 'specialized'];
export const compositionIds = Object.freeze([...chapterIds]);

/** The first two scenes use an explicitly growing row rather than empty slots. */
export function getComposition(id, step = 0, compact = false) {
  const s = Math.max(0, Math.min(5, Math.trunc(Number(step) || 0)));
  const centerX = compact ? 210 : 480, centerY = compact ? 165 : 140;
  if (id === 'request') {
    const count = [1, 2, 2, 3, 4, 5][s];
    const spacing = compact ? 66 : 184;
    const previousCount = [1, 2, 2, 3, 4, 5][Math.max(0, s - 1)];
    const previousFocusX = compact ? centerX : centerX + (previousCount - 1) * spacing / 2;
    const previousFocusY = compact ? centerY + (previousCount - 1) * spacing / 2 : centerY;
    const actors = requestKeys.slice(0, count).map((key, index) => point(key,
      compact ? centerX : centerX + (index - (count - 1) / 2) * spacing,
      compact ? centerY + (index - (count - 1) / 2) * spacing : centerY,
      { originX: previousFocusX, originY: previousFocusY }));
    return { focal: actors.at(-1).key, actors };
  }
  if (id === 'first-key') {
    const actors = [point('first-key-client', s === 0 ? centerX : compact ? 65 : s === 1 ? 270 : 200, compact ? 106 : 126, { originX: centerX, originY: centerY })];
    if (s) actors.push(point('first-key-server', compact ? 335 : s === 1 ? 690 : 760, compact ? 106 : 126, { originX: centerX, originY: centerY }));
    return { focal: s ? 'first-key-server' : 'first-key-client', actors };
  }
  const actors = zones(id, s, compact);
  return { focal: focus(id, s, actors), actors };
}

/** Actor wrapper keys deliberately differ from the causal keys inside them. */
export function actorMarkup(actor, body, focus = false, offsetX = 0, offsetY = 0) {
  if (!body || !actor) return '';
  const x = actor.x + offsetX, y = actor.y + offsetY;
  const ox = actor.originX ?? actor.x, oy = actor.originY ?? actor.y;
  return `<g data-key="actor:${actor.key}" data-layout="actor" data-anchor-x="${x}" data-anchor-y="${y}" data-origin-x="${ox}" data-origin-y="${oy}" data-enter-x="${ox}" data-enter-y="${oy}"${focus ? ' data-focus="true"' : ''}>${offsetX || offsetY ? `<g transform="translate(${offsetX} ${offsetY})">${body}</g>` : body}</g>`;
}

function focus(id, s, actors) {
  const names = {
    'event-loop': s >= 4 ? 'event-background' : 'event-executor', dictionary: s >= 4 ? 'dictionary-new-table' : s >= 2 ? 'dictionary-comparison' : 'dictionary-table',
    encodings: 'encoding-expanded', atomicity: 'atomicity-redis', transactions: 'transaction-state', scripting: 'script-executor', blocking: 'blocking-redis',
    locks: s === 3 || s === 5 ? 'lock-resource' : 'lock-lease', expiry: s === 5 ? 'expiry-primary' : s === 1 ? 'expiry-clock' : 'expiry-key',
    memory: s === 4 ? 'memory-overhead' : s === 5 ? 'memory-unlink' : 'memory-data', latency: s === 5 ? 'latency-execution' : 'latency-server',
    rdb: s >= 3 ? 'rdb-file' : s >= 1 ? 'rdb-child' : 'rdb-parent', aof: s >= 2 ? 'aof-storage' : s === 1 ? 'aof-cache' : 'aof-ram',
    replication: s === 0 ? 'replication-primary' : 'replication-replica', sentinel: s >= 3 ? 'sentinel-new-primary' : s === 2 ? 'sentinel-observer-2' : 'sentinel-observer-1',
    cluster: s >= 2 ? s === 4 ? 'cluster-b' : 'cluster-c' : 'cluster-client', pubsub: 'pubsub-server', streams: s === 5 ? 'stream-index' : s >= 2 ? 'stream-pending' : 'stream-entries',
    specialized: 'specialized-structure'
  };
  return names[id] || actors[0]?.key || 'scene';
}

function zones(id, s, compact) {
  const p = (...args) => point(...args);
  if (compact) {
    const rows = {
      'event-loop': [p('event-client-a',70,43),p('event-client-b',210,43),p('event-client-c',350,43),p('event-executor',210,192)],
      dictionary: [p('dictionary-key',210,30),p('dictionary-table',95,170),p(s>=4?'dictionary-new-table':'dictionary-comparison',310,180)],
      encodings: s===1?[p('encoding-compact',110,163),p('encoding-expanded',310,163)]:[p('encoding-compact',210,100),p('encoding-expanded',210,235)],
      atomicity: [p('atomicity-a',65,42),p('atomicity-b',355,42),p('atomicity-redis',210,185)],
      transactions: s===2||s===3?[p('transaction-a',80,40),p('transaction-b',340,40),p('transaction-state',210,190)]:[p('transaction-state',210,165)],
      scripting: [p('script-a',65,35),p('script-b',355,35),p('script-executor',210,185)],
      blocking: [p('blocking-a',70,39),p('blocking-b',350,39),p('blocking-redis',210,165),p('blocking-wait',210,265)],
      locks: [p('lock-a',65,45),p('lock-b',355,45),p(s===3||s===5?'lock-resource':'lock-lease',210,175)],
      expiry: s===5?[p('expiry-primary',70,110),p('expiry-replica',350,110)]:[p('expiry-key',210,148),p('expiry-deadline',210,234),p('expiry-clock',210,35),...(s===2||s===4?[p('expiry-client',210,285)]:[])],
      memory: s===4?[p('memory-data',210,80),p('memory-overhead',210,165),p('memory-fragmentation',210,250)]:s===5?[p('memory-del',110,165),p('memory-unlink',310,165)]:[p('memory-data',210,95),p('memory-policy',210,240),...(s===3?[p('memory-client',210,215)]:[])],
      latency: s===5?[p('latency-network',210,65),p('latency-execution',210,160),p('latency-output',210,260)]:[p('latency-client',45,30),p('latency-server',375,30),p('latency-result',210,190)],
      rdb: [p('rdb-parent',95,140),...(s>=1&&s<=3?[p('rdb-child',325,140)]:[]),p('rdb-file',210,265)],
      aof: [p('aof-ram',210,52),p('aof-cache',210,152),p('aof-storage',210,252)],
      replication: [p('replication-primary',75,90),p('replication-replica',345,90),p('replication-client',210,185),p('replication-progress',210,260)],
      sentinel: [p('sentinel-observer-1',70,72),p('sentinel-observer-2',210,72),p('sentinel-observer-3',350,72),p('sentinel-old-primary',110,210),p('sentinel-new-primary',310,210)],
      cluster: [p('cluster-client',210,75),p('cluster-a',70,224),p('cluster-b',210,224),p('cluster-c',350,224)],
      pubsub: [p('pubsub-publisher',210,40),p('pubsub-server',210,167),p('pubsub-subscriber',210,270)],
      streams: s===5?[p('stream-index',210,50),p('stream-leaf-a',110,195),p('stream-leaf-b',310,195)]:[p('stream-entries',210,50),p('stream-pending',210,130),p('stream-a',90,220),p('stream-b',330,220)],
      specialized: [p('specialized-structure',210,175)]
    };
    return rows[id] || [p('scene',210,165)];
  }
  const rows = {
    'event-loop': [p('event-client-a',170,51),p('event-client-b',170,133),p('event-client-c',170,215),p('event-executor',480,132),...(s>=4?[p('event-io',780,70),p('event-background',780,195)]:[])],
    dictionary: [p('dictionary-key',105,37),p('dictionary-bucket',385,37),p('dictionary-table',240,175),...(s>=2?[p(s>=4?'dictionary-new-table':'dictionary-comparison',710,169)]:[])],
    encodings: [p('encoding-compact',242,157),p('encoding-expanded',720,157)],
    atomicity: [p('atomicity-a',90,60),p('atomicity-b',90,200),p('atomicity-redis',800,145)],
    transactions: [p('transaction-a',105,125),p('transaction-state',502,145),p('transaction-b',835,125)],
    scripting: [p('script-a',100,120),p('script-executor',497,145),p('script-b',835,120)],
    blocking: [p('blocking-a',100,65),p('blocking-redis',495,125),p('blocking-b',835,65),p('blocking-wait',222,232)],
    locks: [p('lock-a',100,82),p(s===3||s===5?'lock-resource':'lock-lease',480,120),...(s===5?[]:[p('lock-b',835,82)]),...(s===3||s===5?[]:[p('lock-timeline',480,240)])],
    expiry: s===5?[p('expiry-primary',200,105),p('expiry-replica',760,105)]:[p('expiry-key',190,127),p('expiry-deadline',490,127),p('expiry-clock',780,127),p('expiry-passive',260,243),p('expiry-active',695,243),...(s===2||s===4?[p('expiry-client',480,260)]:[])],
    memory: s===4?[p('memory-data',200,135),p('memory-overhead',480,135),p('memory-fragmentation',760,135)]:s===5?[p('memory-del',230,145),p('memory-unlink',730,145)]:[p('memory-data',330,125),p('memory-policy',792,125),...(s===3?[p('memory-client',75,250)]:[])],
    latency: s===5?[p('latency-network',170,147),p('latency-execution',480,147),p('latency-output',790,147)]:[p('latency-client',110,35),p('latency-server',790,35),...(s>=1?[p('latency-result',495,167)]:[])],
    rdb: [p('rdb-parent',165,130),...(s>=1&&s<=3?[p('rdb-child',570,130)]:[]),...(s>=3?[p('rdb-file',840,140)]:[])],
    aof: [p('aof-ram',165,135),p('aof-cache',480,135),p('aof-storage',795,135)],
    replication: [p('replication-primary',165,125),p('replication-replica',785,125),p('replication-client',s>=4?480:25,s>=4?28:125),p('replication-progress',480,240)],
    sentinel: [p('sentinel-observer-1',180,56),p('sentinel-observer-2',480,56),p('sentinel-observer-3',780,56),p('sentinel-old-primary',310,180),p('sentinel-new-primary',665,180),...(s===4?[p('sentinel-client',480,205)]:[])],
    cluster: [p('cluster-client',65,65),p('cluster-hash',480,37),p('cluster-a',150,170),p('cluster-b',480,170),p('cluster-c',810,170)],
    pubsub: [p('pubsub-publisher',95,131),p('pubsub-server',480,140),p('pubsub-subscriber',835,131)],
    streams: s===5?[p('stream-index',480,42),p('stream-leaf-a',245,180),p('stream-leaf-b',715,180)]:[p('stream-entries',347,60),p('stream-pending',822,75),p('stream-a',120,171),p('stream-b',660,171)],
    specialized: s===0?[p('specialized-key',480,77),p('specialized-structure',250,195),p('specialized-field',710,195)]:s===1?[p('specialized-query',195,122),p('specialized-structure',695,130)]:[p('specialized-structure',480,165)]
  };
  return rows[id] || [p('scene',480,150)];
}

// Split only at the SVG root. Nested state/causal groups stay inside their actor.
function fragments(markup) {
  const result = []; let depth = 0, start = 0;
  for (const match of markup.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    const token = match[0], closing = token.startsWith('</'), single = token.endsWith('/>');
    if (!depth && !closing) start = match.index;
    if (closing) depth--; else if (!single) depth++;
    if (!depth) result.push(markup.slice(start, match.index + token.length));
  }
  return result;
}
function center(fragment) {
  const circle = fragment.match(/<circle\b[^>]*cx="([\d.-]+)"[^>]*cy="([\d.-]+)"/);
  if (circle) return { x:Number(circle[1]),y:Number(circle[2]) };
  const rect = fragment.match(/<rect\b[^>]*x="([\d.-]+)"[^>]*y="([\d.-]+)"[^>]*width="([\d.-]+)"[^>]*height="([\d.-]+)"/);
  if (rect) return {x:Number(rect[1])+Number(rect[3])/2,y:Number(rect[2])+Number(rect[4])/2};
  const text = fragment.match(/<text\b[^>]*x="([\d.-]+)"[^>]*y="([\d.-]+)"/);
  if (text) return {x:Number(text[1]),y:Number(text[2])-8};
  return null;
}


function horizontalBounds(markup) {
  let left = Infinity, right = -Infinity;
  const include=(a,b)=>{if(Number.isFinite(a)&&Number.isFinite(b)){left=Math.min(left,a);right=Math.max(right,b);}};
  const attrs=source=>Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));
  for (const match of markup.matchAll(/<(rect|circle)\b([^>]*)>/g)) {
    const a=attrs(match[2]);
    if(match[1]==='rect')include(Number(a.x),Number(a.x)+Number(a.width));
    else include(Number(a.cx)-Number(a.r||0),Number(a.cx)+Number(a.r||0));
  }
  return Number.isFinite(left) ? {left,right} : null;
}

/** Group the remaining chapters by their real semantic objects. Geometry stays
 * absolute, so message paths retain their attachment points and causal order. */
export function composeActors(id, step, compact, markup) {
  const spec = getComposition(id, step, compact);
  const groups = new Map(spec.actors.map(actor => [actor.key,{actor,body:''}]));
  let outside = '';
  for (const fragment of fragments(markup)) {
    if (/^<g\b[^>]*class="flow/.test(fragment)) { outside += fragment; continue; }
    const c = center(fragment);
    const observer = id === 'sentinel' && fragment.match(/data-key="sentinel-([0-2])"/);
    const timeline = id === 'locks' && step !== 3 && step !== 5 && (c?.y >= 200 || /d="M75 233/.test(fragment));
    const selected = observer ? groups.get(`sentinel-observer-${Number(observer[1]) + 1}`) : timeline ? groups.get('lock-timeline') : !c && spec.actors.length === 1 ? groups.values().next().value : null;
    if (selected) { selected.body += fragment; continue; }
    if (!c) { outside += fragment; continue; }
    const nearest = spec.actors.reduce((winner,a) => Math.hypot(a.x-c.x,a.y-c.y) < Math.hypot(winner.x-c.x,winner.y-c.y) ? a : winner,spec.actors[0]);
    groups.get(nearest.key).body += fragment;
  }
  const present = [...groups.values()].filter(group => group.body);
  const actualFocus = groups.get(spec.focal)?.body ? spec.focal : present[0]?.actor.key || spec.focal;
  // Natural growth in these chapters changes the occupied width. Center that
  // occupied composition; introducing a child/table then shifts its predecessor.
  let offsetX = 0;
  if (!compact && ['dictionary','event-loop','rdb','streams'].includes(id) && present.length) {
    const bounds = horizontalBounds(present.map(group => group.body).join(''));
    if (bounds) offsetX = 480 - (bounds.left + bounds.right) / 2;
    // Text-only I/O/background actors already occupy the right-hand column.
    // Their native layout is complete, and must not follow the circle bounds.
    if (id === 'event-loop' && step >= 4) offsetX = 0;
  }
  const actors = present.map(({actor,body}) => actorMarkup(actor,body,actor.key===actualFocus,offsetX));
  const flows = offsetX ? `<g transform="translate(${offsetX} 0)">${outside}</g>` : outside;
  return {markup: actors.join('')+flows,focal:`actor:${actualFocus}`};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { storyScene } from '../scenes.js';

// Attachment alone cannot detect a response sent to the wrong visible client.
// These expectations cover protocol roles independently of SVG coordinates.
function scene(id, step, lang, compact) {
  const markup = storyScene(id, step, lang, compact);
  const flows = [...markup.matchAll(/<g\b[^>]*class="flow"[^>]*>/g)].map(match =>
    Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]])));
  return { flows, label: `${id}/${step}/${lang}/${compact ? 'compact' : 'desktop'}` };
}
function variants(check) {
  for (const lang of ['ru', 'en']) for (const compact of [false, true]) check(lang, compact);
}
function route(view, from, to, role, key) {
  const matches = key ? view.flows.filter(flow => flow['data-key'] === key)
    : view.flows.filter(flow => flow['data-from'] === from && flow['data-to'] === to && flow['data-role'] === role);
  assert.equal(matches.length, 1, `${view.label}: exactly one ${key || `${role} ${from} → ${to}`}`);
  assert.deepEqual(['data-from', 'data-to', 'data-role'].map(attr => matches[0][attr]), [from, to, role], `${view.label}/${key || role}: correct sender and recipient`);
  return matches[0];
}
function replies(view, ...recipients) {
  assert.deepEqual(view.flows.filter(flow => flow['data-role'] === 'reply').map(flow => flow['data-to']).sort(), [...recipients].sort(), `${view.label}: replies belong to their requesters`);
}

test('script results and runtime errors return to A; BUSY belongs to waiting B', () => {
  variants((lang, compact) => {
    for (let step = 0; step < 5; step++) {
      const view = scene('scripting', step, lang, compact), executor = compact ? 'script-line-0' : 'script-execution';
      route(view, 'script-client-a', executor, 'request');
      route(view, executor, 'script-client-a', 'reply', 'script-reply');
      replies(view, 'script-client-a');
    }
    const busy = scene('scripting', 5, lang, compact);
    route(busy, 'script-client-b', compact ? 'script-line-0' : 'script-execution', 'request');
    route(busy, compact ? 'script-line-2' : 'script-execution', 'script-client-b', 'reply', 'script-busy-reply');
    replies(busy, 'script-client-b');
  });
});

test('BLPOP wake-up and timeout resume A; the independent GET reply returns to B', () => {
  variants((lang, compact) => {
    const waiting = scene('blocking', 0, lang, compact);
    route(waiting, 'blocking-client-a', 'blocking-server', 'request');
    replies(waiting);
    const other = scene('blocking', 1, lang, compact);
    route(other, 'blocking-client-b', 'blocking-server', 'request');
    route(other, 'blocking-server', 'blocking-client-b', 'reply', 'blocking-b-reply');
    replies(other, 'blocking-client-b');
    const wake = scene('blocking', 2, lang, compact);
    route(wake, 'blocking-client-b', 'blocking-server', 'request');
    route(wake, 'blocking-server', 'blocking-client-a', 'reply');
    replies(wake, 'blocking-client-a');
    const timeout = scene('blocking', 3, lang, compact);
    route(timeout, 'blocking-server', 'blocking-client-a', 'reply', 'blocking-timeout-reply');
    replies(timeout, 'blocking-client-a');
  });
});

test('lease acquisition, refusal and token-checked release reply to the attempting client', () => {
  variants((lang, compact) => {
    const lease = compact ? 'lock-value' : 'lock-lease';
    for (const [step, client] of [[0, 'a'], [1, 'b'], [4, 'a']]) {
      const view = scene('locks', step, lang, compact), requester = `lock-client-${client}`;
      route(view, requester, lease, 'request');
      route(view, lease, requester, 'reply');
      replies(view, requester);
    }
    const replacement = scene('locks', 2, lang, compact);
    route(replacement, 'lock-client-b', lease, 'request');
    assert.ok(!replacement.flows.some(flow => flow['data-from'] === 'lock-client-a'), `${replacement.label}: expired A does not acquire B's lease`);
  });
});

test('stale writes and fencing replies attach to the external resource, not the Redis lease', () => {
  variants((lang, compact) => {
    const overlap = scene('locks', 3, lang, compact);
    for (const client of ['a', 'b']) route(overlap, `lock-client-${client}`, 'lock-external-resource', 'request', `lock-external-${client}`);
    replies(overlap);
    const fenced = scene('locks', 5, lang, compact);
    route(fenced, 'lock-client-a', 'lock-external-resource', 'request', 'lock-external-a');
    route(fenced, 'lock-external-resource', 'lock-client-a', 'reply', 'lock-fenced-reply');
    replies(fenced, 'lock-client-a');
    assert.ok(fenced.flows.every(flow => ![flow['data-from'], flow['data-to']].includes('lock-lease')), `${fenced.label}: the external resource enforces fencing`);
  });
});

test('expiry access returns to its client; deletion propagates from primary to replica', () => {
  variants((lang, compact) => {
    for (const step of [2, 4]) {
      const view = scene('expiry', step, lang, compact);
      route(view, 'expiry-client', 'expiry-key-dictionary', 'request', 'expiry-access-request');
      route(view, 'expiry-key-dictionary', 'expiry-client', 'reply', 'expiry-access-reply');
      replies(view, 'expiry-client');
    }
    const active = scene('expiry', 3, lang, compact);
    route(active, compact ? 'expiry-deadline-dictionary' : 'expiry-active-path', 'expiry-key-dictionary', 'internal');
    replies(active);
    route(scene('expiry', 5, lang, compact), 'expiry-primary-server', 'expiry-replica-server', 'sync', 'expiry-propagation');
  });
});

test('eviction targets the old or rare candidate; OOM returns to the writing client', () => {
  variants((lang, compact) => {
    for (const [step, candidate] of [[1, 1], [2, 2]]) {
      const view = scene('memory', step, lang, compact);
      route(view, 'memory-eviction-policy', `memory-key-${candidate}`, 'internal');
      assert.equal(view.flows.length, 1, `${view.label}: no unrelated key is targeted`);
    }
    const oom = scene('memory', 3, lang, compact), server = compact ? 'memory-limit-bar' : 'memory-eviction-policy';
    route(oom, 'memory-client', server, 'request', 'memory-oom-request');
    route(oom, server, 'memory-client', 'reply', 'memory-oom-reply');
    replies(oom, 'memory-client');
    route(scene('memory', 5, lang, compact), compact ? 'unlink-pending' : 'unlink-key', 'unlink-freed', 'internal', 'unlink-background');
  });
});

test('latency requests and replies stay on their client and Redis lifelines', () => {
  variants((lang, compact) => {
    for (let step = 0; step < 5; step++) {
      const view = scene('latency', step, lang, compact);
      assert.equal(view.flows.length, (step === 0 ? 3 : 1) * 2, view.label);
      for (const flow of view.flows) {
        const request = flow['data-role'] === 'request';
        assert.ok(['request', 'reply'].includes(flow['data-role']), view.label);
        assert.equal(flow['data-from'], request ? 'latency-client-line' : 'latency-server-line', view.label);
        assert.equal(flow['data-to'], request ? 'latency-server-line' : 'latency-client-line', view.label);
      }
    }
    assert.equal(scene('latency', 5, lang, compact).flows.length, 0, 'diagnostic labels invent no requests');
  });
});

test('RDB writes originate in the snapshot child and recovery loads the file into the parent', () => {
  variants((lang, compact) => {
    const shared = scene('rdb', 1, lang, compact);
    for (let page = 0; page < 3; page++) route(shared, `rdb-parent-${page}`, `rdb-child-${page}`, 'internal');
    route(scene('rdb', 2, lang, compact), 'rdb-child-1', 'rdb-parent-1', 'internal', 'rdb-copy');
    const page = compact ? 2 : 1;
    route(scene('rdb', 3, lang, compact), `rdb-child-${page}`, 'rdb-file', 'internal', 'rdb-write');
    route(scene('rdb', 5, lang, compact), 'rdb-file', `rdb-parent-${page}`, 'internal', 'rdb-recovery');
  });
});

test('AOF transfers follow RAM to OS cache to storage and the rewrite/recovery layer order', () => {
  variants((lang, compact) => {
    for (let step = 0; step < 6; step++) {
      const view = scene('aof', step, lang, compact);
      assert.equal(view.flows.length, 2, view.label);
      route(view, 'aof-layer-0', 'aof-layer-1', 'internal');
      route(view, 'aof-layer-1', 'aof-layer-2', 'internal');
    }
  });
});

test('replication distinguishes replica PSYNC/ACK from client WAIT and WAITAOF replies', () => {
  variants((lang, compact) => {
    route(scene('replication', 0, lang, compact), 'replication-primary', 'replication-client', 'reply', 'replication-client-ok');
    for (let step = 0; step < 4; step++) {
      const view = scene('replication', step, lang, compact);
      route(view, 'replication-primary', 'replication-replica', 'sync', 'replication-stream');
      route(view, 'replication-replica', 'replication-primary', 'reply', 'replication-ack');
      if (step >= 2) route(view, 'replication-replica', 'replication-primary', 'request', 'replication-request');
    }
    for (const step of [4, 5]) {
      const view = scene('replication', step, lang, compact);
      route(view, 'replication-client', 'replication-primary', 'request', 'replication-request');
      route(view, 'replication-primary', 'replication-replica', 'sync', 'replication-getack');
      route(view, 'replication-replica', 'replication-primary', 'sync', 'replication-ack');
      route(view, 'replication-primary', 'replication-client', 'reply', 'replication-wait-reply');
      replies(view, 'replication-client');
    }
  });
});

test('Sentinel probes the old primary, promotes the replica and returns discovery to the client', () => {
  variants((lang, compact) => {
    for (const step of [0, 1, 2]) {
      const view = scene('sentinel', step, lang, compact);
      for (let i = 0; i < 3; i++) route(view, `sentinel-${i}`, 'sentinel-old-server', 'request', `sentinel-probe-${i}`);
    }
    route(scene('sentinel', 0, lang, compact), 'sentinel-old-server', 'sentinel-1', 'reply', 'sentinel-pong');
    route(scene('sentinel', 1, lang, compact), 'sentinel-0', 'sentinel-old-server', 'request', 'sentinel-timeout-probe');
    route(scene('sentinel', 2, lang, compact), 'sentinel-0', 'sentinel-1', 'sync', 'sentinel-report');
    route(scene('sentinel', 3, lang, compact), 'sentinel-1', 'sentinel-new-server', 'sync', 'sentinel-promote');
    const discovery = scene('sentinel', 4, lang, compact);
    route(discovery, 'sentinel-client', 'sentinel-1', 'request', 'sentinel-discover');
    route(discovery, 'sentinel-1', 'sentinel-client', 'reply', 'sentinel-address-reply');
    route(discovery, 'sentinel-client', 'sentinel-new-server', 'internal', 'sentinel-reconnect');
    replies(discovery, 'sentinel-client');
    assert.equal(scene('sentinel', 5, lang, compact).flows.length, 0, 'the partition invents no cross-partition route');
  });
});

test('Cluster MOVED comes from A and retries C; ASK comes from C and retries B', () => {
  variants((lang, compact) => {
    route(scene('cluster', 2, lang, compact), 'cluster-client', 'cluster-c', 'request', compact ? 'cluster-retry' : 'cluster-direct-request');
    const moved = scene('cluster', 3, lang, compact);
    route(moved, 'cluster-a', 'cluster-client', 'reply', 'cluster-moved');
    route(moved, 'cluster-client', 'cluster-c', 'request', 'cluster-retry');
    replies(moved, 'cluster-client');
    const ask = scene('cluster', 4, lang, compact);
    route(ask, 'cluster-c', 'cluster-client', 'reply', 'cluster-ask');
    route(ask, 'cluster-client', 'cluster-b', 'request', compact ? 'cluster-retry' : 'cluster-ask-retry');
    replies(ask, 'cluster-client');
  });
});

test('Pub/Sub subscribes from A, publishes from B and delivers to A', () => {
  variants((lang, compact) => {
    for (let step = 0; step < 6; step++) {
      const view = scene('pubsub', step, lang, compact);
      route(view, 'pubsub-publisher', 'pubsub-server', 'request', 'pubsub-publish');
      const delivery = route(view, 'pubsub-server', 'pubsub-subscriber', 'sync', 'pubsub-delivery-a');
      if (step === 0 || step === 4) route(view, 'pubsub-subscriber', 'pubsub-server', 'request', 'pubsub-subscribe');
      if (step === 3) assert.equal(delivery['data-motion'], 'context', `${view.label}: offline A gets no animated delivery`);
    }
  });
});

test('Streams writes/plain reads use entries; ACK and reclaim use pending work and the correct consumer', () => {
  variants((lang, compact) => {
    for (const [step, request, response] of [[0, 'stream-add-request', 'stream-id-reply'], [1, 'stream-read-request', 'stream-read-reply']]) {
      const view = scene('streams', step, lang, compact);
      route(view, 'stream-a', 'stream-entry-0', 'request', request);
      route(view, 'stream-entry-0', 'stream-a', 'reply', response);
      replies(view, 'stream-a');
    }
    const group = scene('streams', 2, lang, compact), state = compact ? 'stream-pending' : 'stream-entry-0';
    route(group, 'stream-a', state, 'request', 'stream-read-request');
    route(group, state, 'stream-a', 'reply', 'stream-read-reply');
    const ack = scene('streams', 3, lang, compact);
    route(ack, 'stream-a', 'stream-pending', 'request', 'stream-ack-request');
    route(ack, 'stream-pending', 'stream-a', 'reply', 'stream-ack-reply');
    const claim = scene('streams', 4, lang, compact);
    route(claim, 'stream-b', 'stream-pending', 'request', 'stream-claim-request');
    route(claim, 'stream-pending', 'stream-b', 'reply', 'stream-claim-delivery');
    replies(claim, 'stream-b');
    const index = scene('streams', 5, lang, compact);
    for (const leaf of ['a', 'b']) route(index, 'stream-index', `stream-leaf-${leaf}`, 'internal');
  });
});

test('specialized structures connect real fields, index entries and results; bitmap does not feed Geo', () => {
  variants((lang, compact) => {
    const prefix = variant => `specialized:${variant}:`, json = scene('specialized', 0, lang, compact);
    for (const field of ['name', 'age']) route(json, `${prefix('json')}json-root`, `${prefix('json')}json-${field}`, 'internal');
    route(scene('specialized', 1, lang, compact), `${prefix('search')}search-query`, `${prefix('search')}search-posting`, 'internal');
    route(scene('specialized', 2, lang, compact), `${prefix('vectors')}vector-2`, `${prefix('vectors')}vector-3`, 'internal');
    route(scene('specialized', 3, lang, compact), `${prefix('time-series')}timeseries-point-3`, `${prefix('time-series')}timeseries-average`, 'internal');
    const geo = scene('specialized', 4, lang, compact);
    route(geo, `${prefix('bitmap-geo')}geo-coordinates`, `${prefix('bitmap-geo')}geo-index`, 'internal');
    assert.equal(geo.flows.length, 1, `${geo.label}: bitmap and Geo remain independent`);
    route(scene('specialized', 5, lang, compact), `${prefix('probabilistic')}hll-register-5`, `${prefix('probabilistic')}hll-result`, 'internal');
  });
});

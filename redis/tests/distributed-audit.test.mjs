import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab, reduceLab, clusterSlot} from '../model.js';
import {storyScene} from '../scenes.js';
const run = (id, actions) => actions.reduce((state, action) => Array.isArray(action) ? reduceLab(state, ...action) : reduceLab(state, action), createLab(id));

test('completed RDB remains the source of recovery after later parent mutations', () => {
  let state = run('rdb', ['fork', 'finish', 'modify']);
  assert.equal(state.parent.A, 'v2');
  state = reduceLab(state, 'crash');
  assert.equal(state.parent.A, 'v1');
  assert.equal(state.child, null);
  for (const lang of ['ru', 'en']) for (const compact of [false, true]) {
    const scene = storyScene('rdb', 5, lang, compact);
    assert.ok(scene.includes('Alice'));
    assert.ok(!scene.includes('Bob'));
    assert.ok(!scene.includes('data-key="rdb-child-'));
    assert.ok(scene.includes('data-key="rdb-recovery"'));
  }
});

test('chosen machine failure preserves an older fsynced prefix but loses a later suffix', () => {
  const state = run('aof', ['write', 'fsync', 'write', 'crash']);
  assert.equal(state.ram, 1);
  assert.equal(state.os.length, 1);
  assert.equal(state.disk.length, 1);
});

test('replica application and replica AOF fsync provide different acknowledgments', () => {
  let state = run('replication', ['write', 'fsync', 'sync', 'wait']);
  assert.equal(state.waitResult, 'WAIT 1 1000 → 1');
  state = reduceLab(state, 'waitaof');
  assert.equal(state.waitResult, 'WAITAOF 1 1 1000 → [1,0]');
  state = reduceLab(reduceLab(state, 'fsync'), 'waitaof');
  assert.equal(state.waitResult, 'WAITAOF 1 1 1000 → [1,1]');
});

test('ASKING returns OK without migration while the subsequent GET still routes normally', () => {
  let state = createLab('cluster');
  const owner = state.owner;
  const staleMap = state.client;
  state = reduceLab(state, 'asking');
  assert.equal(state.reply, `ASKING → OK; GET → MOVED ${clusterSlot(state.key)} node-${owner}:6379`);
  assert.equal(state.client, staleMap);
  state = reduceLab(state, 'follow');
  state = reduceLab(state, 'asking');
  assert.equal(state.reply, 'ASKING → OK; GET → Alice');
});

test('ASKING during migration retrieves the moved key without changing the permanent route', () => {
  let state = run('cluster', ['follow', 'migrate', 'move', 'request']);
  assert.ok(state.reply.startsWith('ASK '));
  const route = state.client;
  state = reduceLab(state, 'asking');
  assert.equal(state.reply, 'ASKING → OK; GET → Alice');
  assert.equal(state.client, route);
  state = reduceLab(state, 'finish');
  state = reduceLab(state, 'request');
  assert.ok(state.reply.startsWith('MOVED '));
});

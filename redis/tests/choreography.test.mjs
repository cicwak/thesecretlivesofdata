import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../content.js';
import { choreography, choreographyIds } from '../choreography.js';

test('every chapter and every story step has an explicit finite animation score', () => {
  assert.deepEqual(choreographyIds, chapters.map(chapter => chapter.id));
  let count = 0;
  for (const chapter of chapters) {
    assert.equal(chapter.steps.length, 6);
    for (let index = 0; index < chapter.steps.length; index++) {
      const { phases, total } = choreography(chapter.id, index);
      count++;
      assert.equal(phases[0].kind, 'context', `${chapter.id}/${index} begins with stable context`);
      assert.equal(phases.at(-1).kind, 'note', `${chapter.id}/${index} concludes after the action`);
      assert.equal(total, phases.reduce((sum, phase) => sum + phase.duration, 0));
      assert.ok(total >= 1200 && total <= 5000, `${chapter.id}/${index}: ${total}`);
      for (const phase of phases) {
        assert.ok(['context', 'message', 'change', 'note', 'hold'].includes(phase.kind));
        assert.ok(Number.isInteger(phase.stage) && phase.stage >= 0 && phase.stage <= 4);
        assert.ok(Number.isFinite(phase.duration) && phase.duration > 0);
        assert.ok(['parallel', 'sequential'].includes(phase.order));
        if (phase.kind === 'message') {
          assert.ok(['request', 'reply', 'sync', 'internal'].includes(phase.role));
          assert.equal(phase.stage, phase.role === 'reply' ? 3 : 1);
        }
      }
    }
  }
  assert.equal(count, 126);
});

const actionOrder = (id, index) => choreography(id, index).phases
  .filter(phase => !['context', 'note'].includes(phase.kind))
  .map(phase => phase.kind === 'message' ? phase.role : phase.kind);

test('ordinary writes update memory after receipt and reply after the update', () => {
  for (const [id, index] of [['event-loop', 2], ['atomicity', 2], ['transactions', 0], ['locks', 0], ['expiry', 2]]) {
    assert.deepEqual(actionOrder(id, index), ['request', 'change', 'reply'], `${id}/${index}`);
  }
});

test('the replacement/deletion step has two separate causal operation beats', () => {
  const actions = choreography('first-key', 5).phases.slice(1, -1);
  assert.deepEqual(actions.map(phase => phase.beat), [0, 0, 0, 1, 1, 1]);
  assert.deepEqual(actionOrder('first-key', 5), ['request', 'change', 'reply', 'request', 'change', 'reply']);
});

test('replication applies a received stream before sending its acknowledgement', () => {
  assert.deepEqual(actionOrder('replication', 1), ['sync', 'change', 'reply']);
  assert.ok(!actionOrder('replication', 0).includes('sync'), 'the lagging replica receives no invented message');
});

test('MOVED and ASK return to the client before the client sends a new request', () => {
  assert.deepEqual(actionOrder('cluster', 3), ['reply', 'change', 'request']);
  assert.deepEqual(actionOrder('cluster', 4), ['reply', 'request', 'change']);
});

test('concurrent fan-out differs from a sequential chain and diagnostics send no invented command', () => {
  const fanOut = choreography('pubsub', 2).phases.find(phase => phase.kind === 'message');
  assert.equal(fanOut.role, 'sync');
  assert.equal(fanOut.order, 'parallel');
  assert.ok(!choreography('latency', 5).phases.some(phase => phase.kind === 'message'));
});

test('scores are fresh on replay and invalid positions are safely clamped', () => {
  const first = choreography('first-key', 0);
  first.phases[0].duration = 1;
  assert.notEqual(choreography('first-key', 0).phases[0].duration, 1);
  assert.deepEqual(choreography('first-key', -3), choreography('first-key', 0));
  assert.deepEqual(choreography('first-key', 999), choreography('first-key', 5));
  assert.deepEqual(choreography('unknown'), choreography('first-key', 0));
});

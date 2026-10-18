/**
 * The story's animation score. Each step has its own causal sequence; a line in
 * a diagram is not, by itself, permission to send a message over that line.
 *
 * Stages are shared by the desktop and compact SVGs:
 *   0: context, 1: request/internal/sync, 2: state change, 3: reply, 4: note.
 * The player resolves the score against data-stage, data-role, and (for a
 * multi-operation step) data-sequence. Durations are teaching time, not Redis
 * performance measurements. The player owns playback rate and reduced motion.
 */

const context = (duration = 450) => ({ kind: 'context', stage: 0, duration, order: 'parallel' });
const message = (role = 'request', duration = 700, order = 'sequential', beat) => ({
  kind: 'message', stage: role === 'reply' ? 3 : 1, role, duration, order,
  ...(beat === undefined ? {} : { beat }),
});
const change = (duration = 600, order = 'sequential', beat) => ({
  kind: 'change', stage: 2, duration, order,
  ...(beat === undefined ? {} : { beat }),
});
const note = (duration = 250) => ({ kind: 'note', stage: 4, duration, order: 'parallel' });
// A hold represents visible ongoing work or waiting, never completion guessed
// with a timeout. It is driven by the same pausable animation timeline.
const hold = (duration = 600, stage = 2) => ({ kind: 'hold', stage, duration, order: 'parallel' });
const step = (...actions) => [context(), ...actions, note()];

const scores = {
  'first-key': [
    step(message('request', 900)),                         // The client sends SET.
    step(message(), change(500)),                         // Arrive, then locate the key.
    step(change(950)),                                    // The association enters RAM.
    step(message('reply', 950)),                          // Only now can OK travel back.
    step(message(), change(600), message('reply')),        // GET, lookup, value reply.
    step(message('request', 650, 'sequential', 0),          // SET Bob, then DEL: two operations.
      change(550, 'sequential', 0), message('reply', 600, 'sequential', 0),
      message('request', 650, 'sequential', 1),
      change(550, 'sequential', 1), message('reply', 600, 'sequential', 1)),
  ],
  request: [
    step(change(900)),                                    // Establish per-client context.
    step(change(900)),                                    // Encode the arguments as RESP.
    step(message('internal'), change(600), hold(450)),     // Retain an incomplete fragment.
    step(message('internal'), change(700)),               // More bytes, then parse arguments.
    step(message('internal', 650), change(650)),           // Check before any mutation.
    step(change(600), message('reply', 950)),              // Prepare output before socket write.
  ],
  'event-loop': [
    step(change(800, 'parallel')),                         // Connections exist independently.
    step(message('request', 900, 'parallel')),             // Several sockets become ready.
    step(message(), change(600), message('reply')),        // A executes first in this schedule.
    step(message(), change(600), message('reply')),        // B reads the completed mutation.
    step(change(650, 'parallel'), hold(450)),               // Helpers do separate kinds of work.
    step(message(), change(450), hold(1200)),              // A busy executor makes C wait.
  ],
  dictionary: [
    step(message('internal', 800), change(550)),           // Hash a key.
    step(message('internal', 700), change(650)),           // Select its bucket.
    step(message('internal', 700), change(650)),           // Compare the first colliding key.
    step(message('internal', 700), change(650)),           // Follow the chain, then match.
    step(change(1000)),                                   // Allocate table 1 before transfer.
    step(message('internal', 1050), change(700)),          // Transfer entries, then clear old slot.
  ],
  encodings: [
    step(change(600), message('internal', 700)),            // String object leads to its bytes.
    step(change(650), message('internal', 850)),           // Reveal packed blocks and their links.
    step(message('internal', 800), change(650)),           // Compact Set expands after growth.
    step(message('internal', 800), change(650)),           // Compact Hash becomes a dictionary.
    step(message('internal', 900), change(650)),           // Ordered traversal plus member lookup.
    step(message('internal', 900), change(850)),           // Cross the threshold, then convert.
  ],
  atomicity: [
    step(change(850)),                                    // Establish count = 0.
    step(message('request', 1000), message('reply', 850)),  // A and B read the same old value.
    step(message(), change(600), message('reply')),        // A writes 1.
    step(message(), change(600), message('reply')),        // B overwrites with its stale result.
    step(message(), change(700), message('reply')),        // A's INCR reads and writes together.
    step(message(), change(700), message('reply')),        // B's INCR begins with 1, ends with 2.
  ],
  transactions: [
    step(message(), change(650), message('reply')),        // Queue; do not execute yet.
    step(message(), change(1100), message('reply')),       // EXEC runs the queue in order.
    step(message(), change(600), message('reply')),        // WATCH is established before the read.
    step(message(), change(700), message('reply')),        // A competing write precedes aborted EXEC.
    step(message(), change(1100), message('reply')),       // Success, then WRONGTYPE; no rollback.
    step(message(), change(650), message('reply')),        // Queueing error, then EXECABORT.
  ],
  scripting: [
    step(message(), change(1000), message('reply')),       // Server-side statements run in order.
    step(message(), change(650), hold(600), message('reply')), // B waits until the script ends.
    step(message(), change(1000), message('reply')),       // Mutation precedes the script error.
    step(message(), change(600), message('reply')),        // Cache lookup, then script/result.
    step(message(), change(650), message('reply')),        // FCALL selects the stored function.
    step(message(), change(450), hold(1400)),              // Long execution delays other clients.
  ],
  blocking: [
    step(message(), change(750)),                         // Empty-list BLPOP parks just A.
    step(message(), change(550), message('reply')),        // B still receives an ordinary result.
    step(message(), change(750), message('reply', 850)),   // Add item, pop it, wake A.
    step(hold(1100), change(500), message('reply')),        // Timeout, then nil; no producer needed.
    step(change(1000)),                                   // Show A then B in waiting order.
    step(change(600), hold(650)),                          // Removal precedes worker failure.
  ],
  locks: [
    step(message(), change(600), message('reply')),        // NX succeeds for A.
    step(message(), change(450), message('reply')),        // Existing lease rejects B.
    step(hold(650), change(450), message(), change(550)),  // A expires before B acquires.
    step(message(), change(700)),                         // A wakes after ownership changed.
    step(message(), change(650), message('reply')),        // Token check prevents stale deletion.
    step(message(), change(650), message('reply')),        // Resource checks the fencing number.
  ],
  expiry: [
    step(change(900)),                                    // Associate the key with a deadline.
    step(hold(700), change(650)),                          // Clock passes deadline; bytes may remain.
    step(message(), change(650), message('reply')),        // Access checks deadline, deletes, returns nil.
    step(message('internal', 800), change(650)),           // Active sampling removes an expired entry.
    step(message(), change(650), message('reply')),        // SET removes old expiration metadata.
    step(change(500), message('sync', 850), change(500)),  // Primary deletion precedes replica deletion.
  ],
  memory: [
    step(change(950)),                                    // Allocations approach maxmemory.
    step(message('internal', 650), change(750)),           // LRU samples, chooses, evicts.
    step(message('internal', 650), change(750)),           // LFU samples frequency candidates.
    step(message(), change(500), message('reply')),        // Reject allocation, then return OOM.
    step(change(1000, 'parallel')),                        // Explain the separate memory components.
    step(change(600), message('internal', 700), change(650)), // Unlink first, reclaim afterward.
  ],
  latency: [
    step(message('request', 950), message('reply', 950)),   // Each command waits for a round trip.
    step(message('request', 850), change(500), message('reply', 850)), // Batch network waiting.
    step(message(), change(450), hold(1000), message('reply')), // Execution duration occupies the server.
    step(message(), change(600), message('reply')),        // One cursor batch, then a response.
    step(message(), change(650), message('reply', 1000)),  // Preparing output and draining it differ.
    step(change(1100)),                                   // Reveal measurements; no synthetic request.
  ],
  rdb: [
    step(change(850)),                                    // Live pages hold Alice.
    step(change(650), message('internal', 700, 'parallel')), // Child shares the snapshot pages.
    step(message('internal', 750), change(850)),           // Copy a changed page before parent mutation.
    step(message('internal', 950), change(600)),           // Child writes its old snapshot view.
    step(change(900)),                                    // Snapshot becomes a completed RDB file.
    step(message('internal', 950), change(700)),           // Load file before restoring live memory.
  ],
  aof: [
    step(change(950)),                                    // Mutation creates an AOF record.
    step(message('internal', 850), change(550)),           // write() reaches OS page cache.
    step(message('internal', 850), change(700)),           // fsync reaches storage.
    step(change(750), hold(450)),                          // Crash removes volatile layers only.
    step(message('internal', 950), change(750)),           // New base + incremental file before switch.
    step(message('internal', 1000), change(750)),          // Read manifest, load base, replay incremental.
  ],
  replication: [
    step(change(550), message('reply', 950)),              // Primary can reply while replica stays stale.
    step(message('sync', 900), change(600), message('reply', 700)), // Apply before ACK advances.
    step(message('request', 650), message('sync', 900), change(550)), // Request offset, replay backlog.
    step(message('request', 600), message('sync', 1100), change(700)), // Snapshot, then subsequent writes.
    step(message('request', 600), message('sync', 750), change(500), message('reply', 750)),
    step(message('request', 600), change(600), message('sync', 750), message('reply', 750)),
  ],
  sentinel: [
    step(message('request', 950, 'parallel'), message('reply', 650, 'parallel')), // Independent probes.
    step(message('request', 750), hold(800), change(550)),  // Missing reply precedes SDOWN.
    step(message('sync', 950, 'parallel'), change(650)),    // Reports meet configured quorum.
    step(message('sync', 850), change(850)),               // Failover authorization before promotion.
    step(message('request', 700), message('reply', 600), change(650)), // Discover address, reconnect.
    step(change(650), hold(900)),                          // Partition exposes stale accepted data.
  ],
  cluster: [
    step(change(950, 'parallel')),                         // Show stable slot ranges first.
    step(message('internal', 800), change(650)),           // Hash tag/key determines one slot.
    step(message('request', 1000), change(500)),           // Send directly to its owner.
    step(message('reply', 850), change(450), message('request', 850)), // MOVED, cache update, retry.
    step(message('reply', 850), message('request', 1050), change(500)), // ASK, ASKING, original request.
    step(message('internal', 800), change(700)),           // Compare the keys' shared hash slot.
  ],
  pubsub: [
    step(message('request', 850), change(650)),            // Register subscription before delivery.
    step(message('request', 900), change(600)),            // Publish reaches the live channel.
    step(message('sync', 950, 'parallel'), change(550, 'parallel')), // Real fan-out is concurrent.
    step(change(600), message('sync', 850, 'parallel')),   // Remove disconnected target before fan-out.
    step(message('request', 800), change(650)),            // Re-subscribe, without replaying old data.
    step(message('request', 700), change(500), message('sync', 850, 'parallel')), // Shard-scoped fan-out.
  ],
  streams: [
    step(message('request', 700), change(700), message('reply', 650)), // Assign ID, append, return ID.
    step(message('request', 700), message('reply', 900)),  // Read without removing stored entry.
    step(message('request', 650), change(650), message('reply', 750)), // Delivery enters the group's PEL.
    step(message('request', 700), change(700), message('reply', 650)), // XACK removes pending, not stream.
    step(change(450), hold(600), message('request', 700), change(600), message('reply', 700)), // Reclaim A→B.
    step(change(500), message('internal', 1000), change(650)), // Radix range lookup reaches listpack.
  ],
  specialized: [
    step(change(650), message('internal', 800)),            // JSON tree traversal.
    step(message('internal', 850), change(650)),           // Term lookup finds posting list.
    step(message('internal', 950), change(650)),           // Similarity search visits candidates.
    step(message('internal', 800), change(700)),           // Chunks precede aggregation.
    step(message('internal', 800), change(700)),           // Bit position / spatial index lookup.
    step(message('internal', 850), change(700)),           // Compact summary estimates the answer.
  ],
};

export const choreographyIds = Object.freeze(Object.keys(scores));

/** Return a fresh score so a player cannot modify future replays. */
export function choreography(id, stepIndex = 0) {
  const chapter = scores[id] || scores['first-key'];
  const index = Math.max(0, Math.min(chapter.length - 1, Math.trunc(Number(stepIndex) || 0)));
  const phases = chapter[index].map(phase => ({ ...phase }));
  return { phases, total: phases.reduce((sum, phase) => sum + phase.duration, 0) };
}

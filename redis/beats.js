// Story stops may split or combine the original audited scene states. Keeping
// this map shared prevents captions, diagrams, scores and evidence drifting.
const chapterIds = ['first-key', 'request', 'event-loop', 'dictionary', 'encodings', 'atomicity', 'transactions', 'scripting', 'blocking', 'locks', 'expiry', 'memory', 'latency', 'rdb', 'aof', 'replication', 'sentinel', 'cluster', 'pubsub', 'streams', 'specialized'];
const ordinary = Array.from({ length: 6 }, (_, scene) => ({ scene }));
const beats = Object.fromEntries(chapterIds.map(id => [id, ordinary]));
beats['first-key'] = [...ordinary.slice(0, 5), { scene: 5, operation: 0 }, { scene: 5, operation: 1 }];
beats.dictionary = ordinary.slice(1);

/** Number of user-controlled stops; independent of the audited source states. */
export function storyLength(id) {
  return (beats[id] || beats['first-key']).length;
}

/** Resolve a logical stop to a source scene and, when split, its operation. */
export function resolveBeat(id, stepIndex = 0) {
  const chapter = beats[id] || beats['first-key'];
  const index = Math.max(0, Math.min(chapter.length - 1, Math.trunc(Number(stepIndex) || 0)));
  return { ...chapter[index] };
}

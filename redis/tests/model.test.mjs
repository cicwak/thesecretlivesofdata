import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab, reduceLab, labView, clusterSlot, LAB_IDS} from '../model.js';
const run = (id, actions) => actions.reduce((state, action) => Array.isArray(action) ? reduceLab(state, ...action) : reduceLab(state, action), createLab(id));
const freeze = value => { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };
const bilingual = value => assert.ok(value && typeof value.ru === 'string' && typeof value.en === 'string');

test('all 21 models have bilingual serializable views and immutable reducers', () => {
  assert.equal(LAB_IDS.length, 21);
  for (const id of LAB_IDS) {
    const original = createLab(id);
    const before = JSON.stringify(original);
    freeze(original);
    const view = labView(original);
    bilingual(view.note);
    for (const panel of view.panels) {
      bilingual(panel.title);
      for (const row of panel.rows) {
        if (typeof row.label !== 'string') bilingual(row.label);
        if (typeof row.value !== 'string') bilingual(row.value);
      }
    }
    for (const control of view.controls) {
      bilingual(control.label);
      const values = control.options?.map(option => {bilingual(option.label);return option.value;}) || [undefined];
      for (const value of values) {
        const next = reduceLab(original, control.id, value);
        assert.notEqual(next, original, id);
        assert.equal(JSON.stringify(original), before, `${id}/${control.id} mutated input`);
        assert.deepEqual(JSON.parse(JSON.stringify(next)), next);
        const afterView = labView(next);
        for (const event of afterView.events) bilingual(event);
      }
    }
    assert.deepEqual(reduceLab(original, 'reset'), createLab(id));
    assert.deepEqual(reduceLab(original, 'unknown'), original);
  }
});

test('SET overwrites, GET reads, DEL is idempotent', () => {
  let s=run('first-key',['set','get']);assert.equal(s.reply,'Alice');
  s=reduceLab(s,'overwrite');assert.equal(s.data['user:1'],'Bob');
  s=reduceLab(s,'delete');assert.equal(s.reply,'1');
  s=reduceLab(s,'delete');assert.equal(s.reply,'0');
  assert.equal(reduceLab(s,'get').reply,'(nil)');
});

test('RESP cannot execute until a complete frame is parsed and validated', () => {
  let s=run('request',['receive','parse','validate','execute']);
  assert.equal(s.argv,null);assert.deepEqual(s.data,{});
  s=reduceLab(s,'receive');s=reduceLab(s,'receive');s=reduceLab(s,'parse');
  assert.deepEqual(s.argv,['SET','user:1','Alice']);assert.equal(s.input,'');
  assert.deepEqual(reduceLab(s,'execute').data,{});
  s=reduceLab(s,'validate');s=reduceLab(s,'execute');
  assert.equal(s.data['user:1'],'Alice');assert.equal(s.output,'+OK\r\n');assert.equal(s.reply,'—');
  s=reduceLab(s,'flush');assert.equal(s.output,'');assert.equal(s.reply,'+OK\r\n');
  assert.equal(reduceLab(s,'execute').output,'');
});

test('a long command delays ready clients despite I/O progress', () => {
  let s=run('event-loop',['tick','tick','expensive','enqueue','tick']);
  assert.equal(s.busy.client,'C');assert.equal(s.busy.remaining,7);
  const ready=JSON.stringify(s.ready);s=reduceLab(s,'io');assert.equal(JSON.stringify(s.ready),ready);assert.equal(s.counter,1);
  for(let i=0;i<7;i++)s=reduceLab(s,'tick');
  assert.equal(s.busy,null);assert.equal(s.counter,1);
  s=reduceLab(s,'tick');assert.equal(s.counter,2);
});

test('rehash keeps colliding keys available throughout gradual migration', () => {
  let s=run('dictionary',['insert','insert','insert','grow','lookup']);
  assert.equal(s.capacity,8);assert.equal(s.entries.length,3);assert.ok(s.lookup.includes('act'));
  s=reduceLab(s,'insert');
  for(let i=0;i<4;i++){
    s=reduceLab(s,'rehash');s=reduceLab(s,'lookup');assert.ok(s.lookup.includes('act'));assert.equal(s.entries.length,4);
  }
  assert.equal(s.old,null);
  assert.equal(new Set(s.entries).size,4);
});

test('encoding transitions reflect numeric/compact/general representations', () => {
  const encoding = state => labView(state).panels[0].rows.find(row=>row.label==='OBJECT ENCODING').value;
  assert.equal(encoding(createLab('encodings')),'int');
  assert.equal(encoding(run('encodings',['text'])),'embstr');
  assert.equal(encoding(run('encodings',['grow'])),'raw');
  for(const [type,small,big] of [['hash','listpack','hashtable'],['list','listpack','quicklist'],['set','intset','hashtable'],['zset','listpack','skiplist']]){
    let s=run('encodings',[['type',type]]);assert.equal(encoding(s),small);
    s=reduceLab(s,'grow');assert.equal(encoding(s),big);
  }
  assert.equal(encoding(run('encodings',[['type','set'],'text'])),'listpack');
});

test('unsafe read-modify-write loses an update, two atomic INCRs preserve both', () => {
  const unsafe=run('atomicity',['unsafe','unsafe','unsafe','unsafe']);
  assert.deepEqual(unsafe.reads,{A:10,B:10});assert.equal(unsafe.value,11);
  const safe=run('atomicity',['incr','incr']);assert.equal(safe.value,12);assert.equal(safe.increments,2);
  assert.equal(reduceLab(unsafe,'incr').value,11);
});

test('WATCH aborts EXEC without executing any queued command', () => {
  const s=run('transactions',['watch','multi','external','exec']);
  assert.equal(s.result,'(nil)');assert.equal(s.data.balance,11);assert.equal(s.data.name,'Alice');assert.deepEqual(s.queue,[]);assert.equal(s.watched,false);
});

test('EXEC executes valid queue without interference and clears WATCH', () => {
  const s=run('transactions',['watch','multi','exec']);
  assert.equal(s.data.name,'Bob');assert.equal(s.data.balance,11);assert.equal(s.result,'["OK",11]');assert.equal(s.watched,false);
});

test('EXEC runtime errors keep writes before and after the failed command', () => {
  const s=run('transactions',['runtime-error']);
  assert.equal(s.data.before,'saved');assert.equal(s.data.after,'saved');assert.equal(s.data.bad,'hello');assert.ok(s.result.includes('ERR'));
});

test('Lua execution is atomic against clients but has no rollback on failure', () => {
  let s=run('scripting',['run','client']);assert.equal(s.balance,13);
  s=reduceLab(s,'fail');assert.equal(s.balance,14);assert.equal(s.last,'ERR simulated script failure');
});

test('BLPOP waits without stopping other clients and wakes on LPUSH', () => {
  let s=run('blocking',['block','other','other']);assert.equal(s.waiting,true);assert.equal(s.counter,2);
  s=reduceLab(s,'push');assert.equal(s.waiting,false);assert.deepEqual(s.list,[]);assert.deepEqual(s.received,['job:1']);
  s=reduceLab(s,'push');assert.equal(s.list.length,1);
  s=reduceLab(s,'block');assert.equal(s.list.length,0);assert.equal(s.waiting,false);assert.equal(s.received.length,2);
});

test('stale owner cannot remove a subsequent owner’s lock', () => {
  let s=run('locks',['acquire-a']);assert.equal(s.owner,'A:a1');
  s=reduceLab(s,'acquire-b');assert.equal(s.reply,'(nil)');assert.equal(s.owner,'A:a1');
  s=reduceLab(s,'advance');s=reduceLab(s,'acquire-b');assert.equal(s.owner,'B:b1');
  s=reduceLab(s,'release-a');assert.equal(s.reply,'0');assert.equal(s.owner,'B:b1');
  s=reduceLab(s,'release-b');assert.equal(s.owner,null);assert.equal(s.reply,'1');
});

test('reacquisition creates fresh tokens; old A does not release even a new A lock', () => {
  const s=run('locks',['acquire-a','advance','acquire-a','release-a']);
  assert.equal(s.owner,'A:a2');assert.equal(s.reply,'0');
});

test('Redis lock token alone cannot fence an external stale owner', () => {
  const s=run('locks',['acquire-a','advance','acquire-b','external-a']);
  assert.equal(s.owner,'B:b1');assert.equal(s.externalWrites,1);
});

test('TTL expiry precedes physical deletion; GET and active cleanup each reclaim', () => {
  const expired=run('expiry',['advance']);assert.equal(expired.present,true);assert.ok(expired.now>=expired.deadline);
  const get=reduceLab(expired,'get');assert.equal(get.present,false);assert.equal(get.reply,'(nil)');
  assert.equal(reduceLab(expired,'sweep').present,false);
  const refreshed=reduceLab(expired,'set');assert.equal(refreshed.deadline,11);assert.equal(reduceLab(refreshed,'get').reply,'Alice');
});

test('LRU evicts the least recent while LFU evicts least frequent', () => {
  let s=run('memory',['write']);assert.deepEqual(s.items.map(item=>item.key),['b','c','d']);
  s=run('memory',['touch','write']);assert.deepEqual(s.items.map(item=>item.key),['a','c','d']);
  s=run('memory',[['policy','allkeys-lfu'],'write']);assert.deepEqual(s.items.map(item=>item.key),['a','c','d']);
});

test('noeviction rejects over-budget writes; eviction models remain bounded', () => {
  const rejected=run('memory',[['policy','noeviction'],'write']);
  assert.equal(rejected.items.length,3);assert.ok(rejected.reply.startsWith('OOM'));assert.deepEqual(rejected.items,createLab('memory').items);
  for(const policy of ['allkeys-lru','allkeys-lfu','noeviction']){
    let s=run('memory',[['policy',policy]]);
    for(let i=0;i<20;i++){s=reduceLab(s,'write');assert.ok(s.items.length<=s.limit);}
  }
});

test('UNLINK removes visibility before deferred reclamation', () => {
  const s=run('memory',['unlink']);assert.equal(s.items.length,2);assert.equal(s.pending,1);
  assert.equal(reduceLab(s,'reclaim').pending,0);
});

test('pipelining saves RTT without removing command execution', () => {
  assert.equal(run('latency',['run']).total,36);
  assert.equal(run('latency',[['mode','pipeline'],'run']).total,12);
  assert.equal(run('latency',['slow']).longest,20);
  assert.equal(run('latency',['scan']).longest,3);
});

test('RDB snapshot preserves fork-time pages while parent changes through COW', () => {
  let s=run('rdb',['fork','modify','modify']);
  assert.equal(s.parent.A,'v3');assert.equal(s.child.A,'v1');assert.equal(s.copied.length,1);
  s=reduceLab(s,'fork');assert.equal(s.child.A,'v1');
  s=reduceLab(s,'finish');assert.equal(s.snapshot.A,'v1');assert.equal(s.parent.A,'v3');
  s=reduceLab(s,'crash');assert.equal(s.parent.A,'v1');
});

test('unfinished RDB cannot be used for recovery', () => {
  const s=run('rdb',['fork','modify','crash']);assert.deepEqual(s.parent,{});assert.equal(s.snapshot,null);
});

test('AOF everysec can acknowledge a write before durable fsync', () => {
  let s=run('aof',['write']);assert.equal(s.ram,1);assert.equal(s.os.length,1);assert.equal(s.disk.length,0);
  assert.equal(reduceLab(s,'crash').ram,0);
  s=reduceLab(s,'fsync');s=reduceLab(s,'write');assert.equal(s.ram,2);assert.equal(reduceLab(s,'crash').ram,1);
});

test('AOF always and completed rewrite survive the modelled power loss', () => {
  assert.equal(run('aof',[['policy','always'],'write','crash']).ram,1);
  const s=run('aof',['write','write','write','rewrite']);assert.equal(s.disk.length,1);assert.deepEqual(s.disk[0],{kind:'BASE',value:3});assert.equal(reduceLab(s,'crash').ram,3);
});

test('WAIT acknowledges replica application, WAITAOF also requires fsync', () => {
  let s=run('replication',['write','wait']);assert.equal(s.waitResult,'WAIT 1 1000 → 0');
  s=reduceLab(s,'sync');s=reduceLab(s,'wait');assert.equal(s.waitResult,'WAIT 1 1000 → 1');
  s=reduceLab(s,'waitaof');assert.equal(s.waitResult,'WAITAOF 1 1 1000 → [0,0]');
  s=reduceLab(s,'fsync');s=reduceLab(s,'waitaof');assert.equal(s.waitResult,'WAITAOF 1 1 1000 → [1,1]');
  s=reduceLab(s,'write');s=reduceLab(s,'waitaof');assert.equal(s.waitResult,'WAITAOF 1 1 1000 → [0,0]');
});

test('replication backlog permits partial sync until the gap outgrows it', () => {
  const partial=run('replication',['disconnect','write','write','reconnect','sync']);
  assert.equal(partial.sync,'CONTINUE');assert.deepEqual(partial.replica,partial.primary);
  const full=run('replication',['disconnect','write','write','write','write','reconnect','sync']);
  assert.equal(full.sync,'FULLRESYNC');assert.deepEqual(full.replica,full.primary);
  const blocked=run('replication',['disconnect','write','sync']);assert.deepEqual(blocked.replica,[]);
});

test('Sentinel failover needs majority and can lose a client-acknowledged write', () => {
  let s=run('sentinel',['write','crash','vote','failover']);assert.equal(s.promoted,false);assert.equal(s.primary,11);
  s=reduceLab(s,'vote');s=reduceLab(s,'failover');assert.equal(s.promoted,true);assert.equal(s.primary,10);assert.equal(s.original,11);assert.equal(s.client,'R');
  s=reduceLab(s,'rejoin');assert.equal(s.original,10);
});

test('replicated writes survive Sentinel failover and isolated observer cannot promote', () => {
  assert.equal(run('sentinel',['write','sync','crash','vote','vote','failover']).primary,11);
  const partition=run('sentinel',['crash','partition','vote','vote','vote','failover']);assert.equal(partition.votes,1);assert.equal(partition.promoted,false);
});

test('CRC16/XMODEM matches the official check vector and hash tag example', () => {
  assert.equal(clusterSlot('123456789'),0x31c3%16384);
  assert.equal(clusterSlot('{user1000}.following'),3443);
  assert.equal(clusterSlot('{user1000}.followers'),3443);
  assert.equal(clusterSlot('foo{bar}{zap}'),clusterSlot('bar'));
  assert.equal(clusterSlot('foo{}bar{tag}'),clusterSlot('foo{}bar{tag}'));
  assert.notEqual(clusterSlot('foo{}bar{tag}'),clusterSlot('tag'));
  assert.ok(clusterSlot('ключ')>=0&&clusterSlot('ключ')<16384);
});

test('Cluster MOVED updates routing; ASK permits one request without map update', () => {
  let s=run('cluster',['request']);assert.equal(s.reply,'MOVED 3443 node-A:6379');
  s=reduceLab(s,'follow');s=reduceLab(s,'request');assert.equal(s.reply,'Alice');
  s=reduceLab(s,'migrate');s=reduceLab(s,'move');s=reduceLab(s,'request');assert.equal(s.reply,'ASK 3443 node-B:6379');
  s=reduceLab(s,'asking');assert.equal(s.client,'A');assert.ok(s.reply.includes('GET → Alice'));
  s=reduceLab(s,'finish');s=reduceLab(s,'request');assert.equal(s.reply,'MOVED 3443 node-B:6379');
  s=reduceLab(s,'follow');s=reduceLab(s,'request');assert.equal(s.reply,'Alice');
});

test('Cluster multi-key operations reject CROSSSLOT and accept shared hash tags', () => {
  assert.equal(run('cluster',['multi']).reply,'MGET → [Alice, Bob]');
  assert.ok(run('cluster',[['pair','untagged'],'multi']).reply.startsWith('CROSSSLOT'));
});

test('Pub/Sub never replays messages missed while disconnected', () => {
  const s=run('pubsub',['publish','disconnect','publish','reconnect','publish']);
  assert.deepEqual(s.inbox,['message:1','message:3']);assert.equal(s.missed,1);
});

test('Streams pending entries are reclaimed after idle; XACK does not delete entries', () => {
  let s=run('streams',['read','crash','claim']);assert.equal(s.pending['1-0'].consumer,'A');assert.equal(s.reply,'[]');
  s=reduceLab(s,'advance');s=reduceLab(s,'claim');assert.equal(s.pending['1-0'].consumer,'B');assert.equal(s.pending['1-0'].attempts,2);
  s=reduceLab(s,'ack');assert.deepEqual(s.pending,{});assert.deepEqual(s.acked,['1-0']);assert.equal(s.entries.length,1);
  s=reduceLab(s,'read');assert.equal(s.reply,'(nil)');
});

test('specialized views derive results from inserted data', () => {
  for(const type of ['json','search','vector','timeseries','bitmap','geo','probabilistic']){
    const s=run('specialized',[['type',type],'insert','insert','query']);
    assert.equal(s.count,2);assert.equal(s.queried,true);
    assert.notEqual(labView(s).panels[1].rows[0].value,'—');
  }
});

test('event histories stay bounded and locale-independent through long sessions', () => {
  let s=createLab('atomicity');for(let i=0;i<50;i++)s=reduceLab(s,'incr');
  assert.equal(s.events.length,8);assert.equal(s.value,60);
  const snapshot=JSON.stringify(s);labView(s);assert.equal(JSON.stringify(s),snapshot);
});


test('WATCH uses a dirty attempt flag: watching again does not erase a conflict', () => {
  let s=run('transactions',['watch','external','watch','multi','exec']);
  assert.equal(s.result,'(nil)');assert.equal(s.data.name,'Alice');assert.equal(s.watchDirty,false);
  assert.equal('version' in s,false);
});

test('WATCH inside MULTI is rejected and does not start watching a key', () => {
  const s=run('transactions',['multi','watch']);
  assert.equal(s.result,'ERR WATCH inside MULTI is not allowed');assert.equal(s.watched,false);assert.equal(s.queue.length,2);
});

test('UNLINK of a cheap object reclaims it synchronously, unlike a large container', () => {
  let s=run('memory',['unlink']);
  assert.equal(s.pending,1);assert.deepEqual(s.items.map(x=>x.key),['b','c']);
  s=reduceLab(s,'unlink');assert.equal(s.pending,1);assert.deepEqual(s.items.map(x=>x.key),['c']);
  assert.match(s.events.at(-1).en,/synchronously/);
  s=reduceLab(s,'reclaim');assert.equal(s.pending,0);
});

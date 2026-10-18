import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../content.js';
import {evidence,stepEvidence,REDIS_VERSION,SOURCE_COMMITS} from '../evidence.js';
import {storyScene} from '../scenes.js';
import {choreography} from '../choreography.js';
import {createLab,reduceLab} from '../model.js';

test('all 126 steps have official documentation and immutable implementation references',()=>{
  assert.equal(REDIS_VERSION,'8.0.0');
  assert.deepEqual(Object.keys(evidence),chapters.map(c=>c.id));
  let checked=0;
  for(const chapter of chapters){
    assert.equal(evidence[chapter.id].length,chapter.steps.length);
    for(let index=0;index<chapter.steps.length;index++){
      const refs=stepEvidence(chapter.id,index);checked++;
      assert.ok(refs.docs.length&&refs.code.length,`${chapter.id}:${index}`);
      for(const ref of refs.docs){assert.ok(ref.label);assert.equal(new URL(ref.url).hostname,'redis.io');}
      for(const ref of refs.code){
        const url=new URL(ref.url),parts=url.pathname.split('/').slice(1);
        assert.equal(url.hostname,'github.com');
        assert.equal(parts[2],'blob');
        assert.equal(parts[3],SOURCE_COMMITS[parts.slice(0,2).join('/')]);
        assert.match(url.hash,/^#L\d+(?:-L\d+)?$/);
      }
    }
    for(const ref of chapter.sources)assert.ok(!ref.url.includes('/blob/8.0/'),'chapter references must not float');
  }
  assert.equal(checked,126);
});

test('a disconnected PubSub scene has no invented subscriber or push',()=>{
  for(const lang of ['ru','en'])for(const compact of [false,true]){
    const scene=storyScene('pubsub',3,lang,compact);
    assert.ok(!scene.includes('pubsub-delivery-b'));
    assert.ok(!scene.includes('A, B'));
    assert.ok(scene.includes('PUBLISH news next'));
  }
  const actions=choreography('pubsub',3).phases.filter(p=>p.kind==='message');
  assert.deepEqual(actions.map(p=>p.role),['request']);
});

test('the JSON path and update match the actual document example in both layouts',()=>{
  for(const lang of ['ru','en'])for(const compact of [false,true]){
    const scene=storyScene('specialized',0,lang,compact);
    assert.ok(scene.includes('$.age: 30 → 31'));
    assert.ok(!scene.includes('$.user.age'));
  }
  assert.deepEqual(choreography('specialized',0).phases.slice(1,-1).map(p=>p.kind),['message','change']);
});

test('the eviction experiment reads its large List with LLEN, including a missing List',()=>{
  let state=reduceLab(createLab('memory'),'touch');
  assert.equal(state.reply,'128');
  assert.ok(state.events.at(-1).en.startsWith('LLEN a'));
  state=reduceLab(reduceLab(state,'unlink'),'touch');
  assert.equal(state.reply,'0');
});

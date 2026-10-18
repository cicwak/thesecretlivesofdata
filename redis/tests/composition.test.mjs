import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../content.js';
import { storyScene } from '../scenes.js';
import { compositionIds, getComposition } from '../composition.js';

const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const actors = svg => [...svg.matchAll(/<g\b[^>]*data-layout="actor"[^>]*>/g)].map(match => attributes(match[0]));

test('every chapter has semantic composition in both responsive layouts', () => {
  assert.deepEqual(compositionIds, chapters.map(chapter => chapter.id));
  for (const chapter of chapters) for (let index=0;index<chapter.steps.length;index++) for (const compact of [false,true]) {
    const english = storyScene(chapter.id,index,'en',compact);
    const russian = storyScene(chapter.id,index,'ru',compact);
    const en=actors(english),ru=actors(russian);
    assert.ok(en.length>=1 && en.length<=7,`${chapter.id}/${index}: whole objects form a small composition`);
    assert.deepEqual(en,ru,`${chapter.id}/${index}: locale changes text without changing geometry or identity`);
    assert.equal(en.filter(actor=>actor['data-focus']==='true').length,1,`${chapter.id}/${index}: one focus`);
    for (const actor of en) for (const coordinate of ['data-anchor-x','data-anchor-y','data-enter-x','data-enter-y']) assert.ok(Number.isFinite(Number(actor[coordinate])),`${chapter.id}: finite ${coordinate}`);
    const allKeys=[...english.matchAll(/data-key="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(new Set(allKeys).size,allKeys.length,`${chapter.id}/${index}: wrapper and causal keys are unique`);
    assert.doesNotMatch(english,/scene-caption/,'the diagram does not repeat the narrative caption');
    let depth=0;
    for(const match of english.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
      const token=match[0];
      if(token.startsWith('</'))depth--;
      else if(!token.endsWith('/>')) {
        if(token.includes('data-layout="actor"'))assert.equal(depth,1,`${chapter.id}/${index}: actors belong directly to the SVG root`);
        depth++;
      }
    }
    assert.equal(depth,0,`${chapter.id}: balanced SVG structure`);
  }
});

test('the request grows from one centered object to a centered sequence without empty slots', () => {
  const expected=[1,2,2,3,4,5];
  for(const compact of [false,true])for(let index=0;index<expected.length;index++) {
    const spec=getComposition('request',index,compact);
    assert.equal(spec.actors.length,expected[index]);
    assert.equal(spec.focal,spec.actors.at(-1).key);
    const values=spec.actors.map(actor=>compact?actor.y:actor.x);
    assert.equal((Math.min(...values)+Math.max(...values))/2,compact?165:480);
    if(index>0) {
      const previous=getComposition('request',index-1,compact).actors.at(-1);
      assert.equal(spec.actors.at(-1).originX,previous.x);
      assert.equal(spec.actors.at(-1).originY,previous.y);
    }
  }
  assert.equal(actors(storyScene('request',0)).length,1);
  assert.equal(actors(storyScene('request',1))[0]['data-key'],'actor:request-socket');
  assert.notEqual(actors(storyScene('request',0))[0]['data-anchor-x'],actors(storyScene('request',1))[0]['data-anchor-x']);
});

test('the first story introduces Redis after the client and keeps values in a stable local frame', () => {
  assert.equal(actors(storyScene('first-key',0)).length,1);
  assert.equal(actors(storyScene('first-key',1)).length,2);
  const first=storyScene('first-key',1),second=storyScene('first-key',2);
  assert.match(first,/data-key="first-key-value"[^>]*><text x="0"/);
  assert.match(second,/data-key="first-key-value"[^>]*><text x="0"/);
  assert.match(storyScene('first-key',5),/SET user:1 Bob/);
  assert.doesNotMatch(storyScene('first-key',5),/DEL user:1/);
  assert.match(storyScene('first-key',6),/DEL user:1/);
  assert.doesNotMatch(storyScene('first-key',6),/SET user:1 Bob/);
});

test('a child or a new table changes the existing composition rather than filling a reserved hole', () => {
  const before=actors(storyScene('rdb',0)),after=actors(storyScene('rdb',1));
  assert.ok(!before.some(actor=>actor['data-key']==='actor:rdb-child'));
  assert.ok(after.some(actor=>actor['data-key']==='actor:rdb-child'));
  assert.notEqual(before.find(actor=>actor['data-key']==='actor:rdb-parent')['data-anchor-x'],after.find(actor=>actor['data-key']==='actor:rdb-parent')['data-anchor-x']);
  const table=actors(storyScene('dictionary',0)).find(actor=>actor['data-key']==='actor:dictionary-table');
  const chain=actors(storyScene('dictionary',1)).find(actor=>actor['data-key']==='actor:dictionary-table');
  assert.notEqual(table['data-anchor-x'],chain['data-anchor-x']);
});


test('unrelated types leave and enter rather than morph into a different structure', () => {
  for(const id of ['encodings','specialized']) for(const compact of [false,true]) for(let step=1;step<6;step++) {
    const keys=svg=>[...svg.matchAll(/data-key="([^"]+)"/g)].map(match=>match[1]);
    const previous=new Set(keys(storyScene(id,step-1,'en',compact)));
    const next=keys(storyScene(id,step,'en',compact));
    assert.ok(next.every(key=>!previous.has(key)),`${id}/${step}: unrelated structures have distinct identities`);
  }
});


test('the request reply travels from output to the socket after output is prepared', () => {
  for(const compact of [false,true]) {
    const svg=storyScene('request',5,'en',compact);
    const reply=svg.match(/<g class="flow" data-key="request-socket-reply"[^>]*>([\s\S]*?)<\/g>/);
    assert.ok(reply);
    assert.match(reply[0],/data-role="reply"/);
    assert.match(reply[0],/data-stage="3"/);
    assert.match(reply[1],compact?/M383 297 C414 297 414 33 383 33/:/M848 79 C848 35 112 35 112 79/);
    const transfer=svg.match(/<g class="flow" data-key="request-transfer-4"[^>]*>/)[0];
    assert.match(transfer,/data-role="internal"/);
    assert.match(transfer,/data-motion="context"/);
  }
});

test('Sentinel promotion updates the same keyed role during the change phase', () => {
  for(const compact of [false,true])for(const lang of ['en','ru']) {
    const before=storyScene('sentinel',2,lang,compact),after=storyScene('sentinel',3,lang,compact);
    for(const key of ['sentinel-new-role-1','sentinel-new-role-2']) {
      const pattern=new RegExp(`<g class="scene-node" data-key="${key}" data-motion="change" data-stage="2">`);
      assert.match(before,pattern);assert.match(after,pattern);
    }
    assert.match(before,/>R<\/tspan>/);assert.match(after,/>P<\/tspan>/);
    assert.match(after,/data-key="sentinel-promote"/);
  }
});

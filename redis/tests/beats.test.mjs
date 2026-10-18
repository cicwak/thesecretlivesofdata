import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../content.js';
import {resolveBeat,storyLength} from '../beats.js';

test('chapter pacing agrees with captions instead of imposing six stops',()=>{
  assert.equal(storyLength('first-key'),7);
  assert.equal(storyLength('dictionary'),5);
  assert.equal(storyLength('rdb'),6);
  for(const chapter of chapters)assert.equal(storyLength(chapter.id),chapter.steps.length);
});

test('the first-key finale splits SET and DEL without changing the other scenes',()=>{
  for(let index=0;index<5;index++)assert.deepEqual(resolveBeat('first-key',index),{scene:index});
  assert.deepEqual(resolveBeat('first-key',5),{scene:5,operation:0});
  assert.deepEqual(resolveBeat('first-key',6),{scene:5,operation:1});
});

test('dictionary hashing and bucket selection share one stop before collision and rehash',()=>{
  for(let index=0;index<5;index++)assert.deepEqual(resolveBeat('dictionary',index),{scene:index+1});
});

test('beat resolution clamps safely and returns independent records',()=>{
  assert.deepEqual(resolveBeat('first-key',-1),resolveBeat('first-key',0));
  assert.deepEqual(resolveBeat('dictionary',999),resolveBeat('dictionary',4));
  assert.deepEqual(resolveBeat('unknown',999),resolveBeat('first-key',6));
  const first=resolveBeat('first-key',5);
  first.operation=9;
  assert.equal(resolveBeat('first-key',5).operation,0);
});

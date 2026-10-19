import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../content.js';
import {nextStop,previousStop,chapterCardAnimations} from '../navigation.js';
import {Playback} from '../playback.js';

const story=(chapterIndex,stepIndex=0)=>({chapterIndex,stepIndex,intro:false});
const card=chapterIndex=>({chapterIndex,stepIndex:0,intro:true});
const last=chapterIndex=>story(chapterIndex,chapters[chapterIndex].steps.length-1);

test('every chapter boundary shows the next topic card before its first database event',()=>{
  for(let index=0;index<chapters.length;index++) {
    const destination=(index+1)%chapters.length;
    const transition=nextStop(chapters,last(index));
    assert.deepEqual(transition,card(destination),chapters[index].id);
    assert.deepEqual(nextStop(chapters,transition),story(destination),chapters[destination].id);
  }
});

test('cards preserve all 400 real stops and do not insert or skip database events',()=>{
  const before=JSON.stringify(chapters);
  const expected=new Set(chapters.flatMap((chapter,index)=>chapter.steps.map((_,step)=>`${index}:${step}`)));
  const visited=new Set(),cards=new Set();
  let position=story(0),count=0;
  do {
    const key=`${position.chapterIndex}:${position.stepIndex}`;
    if(position.intro) {
      assert.equal(position.stepIndex,0);
      assert.ok(!cards.has(position.chapterIndex),'a card occurs once per pass');
      cards.add(position.chapterIndex);
    } else {
      assert.ok(expected.has(key),'every stop belongs to authored content');
      assert.ok(!visited.has(key),'a real stop occurs once per pass');
      visited.add(key);
    }
    position=nextStop(chapters,position);
    assert.ok(++count<=expected.size+chapters.length,'the route completes a finite pass');
  } while(position.chapterIndex!==0||position.stepIndex!==0||position.intro);
  assert.equal(expected.size,400);
  assert.deepEqual(visited,expected);
  assert.equal(cards.size,70);
  assert.equal(count,470);
  assert.equal(JSON.stringify(chapters),before,'navigation cannot alter the source material');
});

test('backwards navigation restores the preceding chapter result from every card, including restart',()=>{
  for(let index=0;index<chapters.length;index++) {
    const preceding=(index-1+chapters.length)%chapters.length;
    assert.deepEqual(previousStop(chapters,card(index)),last(preceding),chapters[index].id);
  }
});

test('going back from a chapter opening reopens its title card before the previous result',()=>{
  for(let index=1;index<chapters.length;index++) {
    const transition=previousStop(chapters,story(index));
    assert.deepEqual(transition,card(index));
    assert.deepEqual(nextStop(chapters,transition),story(index));
    assert.deepEqual(previousStop(chapters,transition),last(index-1));
  }
  assert.deepEqual(previousStop(chapters,story(0)),story(0),'the first screen remains the application example');
});

test('ordinary steps remain reversible without inserting a title card inside the explanation',()=>{
  for(const [index,chapter]of chapters.entries())for(let step=0;step<chapter.steps.length-1;step++) {
    const original=story(index,step),following=nextStop(chapters,original);
    assert.deepEqual(following,story(index,step+1));
    assert.deepEqual(previousStop(chapters,following),original);
  }
});

class Animation {
  constructor(frames,options) {
    this.frames=frames;this.options=options;this.currentTime=0;this.playState='running';
    this.finished=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});
  }
  pause(){this.playState='paused';}
  play(){this.playState='running';}
  cancel(){this.playState='idle';this.reject(new Error('cancelled'));}
  updatePlaybackRate(rate){this.playbackRate=rate;}
  finish(){this.currentTime=this.options.delay+this.options.duration;this.playState='finished';this.resolve();}
}
function elements() {
  const records=[];
  const element=()=>({animate(frames,options){const animation=new Animation(frames,options);records.push(animation);return animation;}});
  return {title:element(),question:element(),controls:element(),records};
}

test('the Raft-style card uses a finite reveal and waits for the final controls animation',async()=>{
  const parts=elements(),animations=chapterCardAnimations(parts),playback=new Playback();
  assert.equal(animations.length,3);
  assert.ok(animations.every(a=>a.playState==='paused'),'construction cannot run ahead of playback');
  assert.equal(Math.max(...animations.map(a=>a.options.delay+a.options.duration)),1000);
  for(const animation of animations) {
    assert.ok(Number.isFinite(animation.options.delay)&&Number.isFinite(animation.options.duration));
    assert.equal(animation.options.duration,600,'match the Raft fade duration');
    assert.equal(animation.options.iterations??1,1,'the card has no looping animation');
  }
  const ready=playback.start(animations);
  assert.equal(playback.busy,true);
  animations[0].finish();animations[1].finish();
  await Promise.resolve();
  assert.equal(playback.busy,true,'Continue stays gated until it has appeared');
  animations[2].finish();
  assert.equal(await ready,true);
  assert.equal(playback.busy,false);
  assert.equal(playback.state,'ready','a settled card waits for the reader, without advancing chapters');
});

test('rebuilding a paused card preserves position for language or viewport changes',async()=>{
  const playback=new Playback(),initial=chapterCardAnimations(elements());
  const obsolete=playback.start(initial);
  for(const animation of initial)animation.currentTime=450;
  playback.pause();
  const elapsed=playback.elapsed,paused=playback.paused;
  const replacement=chapterCardAnimations(elements());
  const ready=playback.start(replacement,{elapsed,paused});
  assert.equal(await obsolete,false,'the old card cannot mark its replacement ready');
  assert.equal(playback.busy,true);
  assert.equal(playback.paused,true);
  assert.ok(replacement.every(a=>a.currentTime===450&&a.playState==='paused'));
  playback.resume();
  for(const animation of replacement)animation.finish();
  assert.equal(await ready,true);
});

test('reduced motion reaches the manual card pause immediately without advancing the story',async()=>{
  let position=nextStop(chapters,last(0));
  const playback=new Playback();
  assert.equal(await playback.start([]),true);
  assert.equal(playback.busy,false);
  assert.deepEqual(position,card(1),'completion alone does not start database work');
  position=nextStop(chapters,position);
  assert.deepEqual(position,story(1),'Continue is the explicit entry into the new chapter');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {Playback} from '../playback.js';

class Animation {
  constructor(end=Infinity){this.currentTime=0;this.end=end;this.playState='paused';this.finished=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
  pause(){this.playState='paused';}
  play(){if(this.currentTime>=this.end)this.currentTime=0;this.playState='running';}
  updatePlaybackRate(rate){this.playbackRate=rate;}
  cancel(){this.playState='idle';this.reject(new Error('cancelled'));}
  finish(){this.playState='finished';this.resolve();}
}
test('navigation remains locked until the last animation including controls finishes',async()=>{
  const states=[],p=new Playback(state=>states.push(state));
  const message=new Animation(),controls=new Animation();
  const ready=p.start([message,controls]);
  assert.equal(p.busy,true);message.finish();await Promise.resolve();assert.equal(p.busy,true);
  controls.finish();assert.equal(await ready,true);assert.equal(p.busy,false);assert.equal(states.at(-1),'ready');
});
test('pause keeps navigation locked and speed preserves the timeline position',async()=>{
  const p=new Playback(),a=new Animation();const ready=p.start([a]);a.currentTime=720;
  p.pause();assert.equal(p.paused,true);assert.equal(p.busy,true);
  p.setRate(.5);assert.equal(a.currentTime,720);assert.equal(a.playbackRate,.5);
  p.resume();assert.equal(p.state,'running');a.finish();await ready;assert.equal(p.busy,false);
});
test('a canceled scene cannot unlock the replacement scene',async()=>{
  const p=new Playback(),old=new Animation();const oldReady=p.start([old]);
  const replacement=new Animation();const ready=p.start([replacement]);
  assert.equal(await oldReady,false);assert.equal(p.busy,true);
  replacement.finish();assert.equal(await ready,true);assert.equal(p.busy,false);
});
test('rebuilding for language or layout restores elapsed time and paused state',async()=>{
  const p=new Playback(),a=new Animation();const ready=p.start([a],{elapsed:1450,rate:2,paused:true});
  assert.equal(p.elapsed,1450);assert.equal(p.paused,true);assert.equal(a.playbackRate,2);
  p.resume();a.finish();await ready;
});
test('reduced-motion completion has no artificial timer',async()=>{
  const p=new Playback();assert.equal(await p.start([]),true);assert.equal(p.state,'ready');assert.equal(p.busy,false);
});
test('seeking and resuming past an early phase does not rewind it',async()=>{
  const p=new Playback(),caption=new Animation(600),controls=new Animation(3000);
  const ready=p.start([caption,controls],{elapsed:1450});
  assert.equal(caption.currentTime,1450);
  p.pause();p.resume();assert.equal(caption.currentTime,1450);
  caption.finish();controls.finish();assert.equal(await ready,true);
});

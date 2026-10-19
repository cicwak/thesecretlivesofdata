import test from 'node:test';
import assert from 'node:assert/strict';
import {Playback} from '../playback.js';
import {chapterAnimations, afterChapterTitle} from '../chapter-transition.js';

// A deterministic Web Animations clock: no DOM package or wall-clock timers.
class Animation {
  constructor(node, frames, timing) {
    this.node = node;
    this.frames = frames;
    this.timing = {...timing};
    this.playState = 'paused';
    this.time = 0;
    this.finished = new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;});
    this.effect = {
      getTiming: () => ({...this.timing}),
      getComputedTiming: () => ({endTime: this.end}),
      updateTiming: timing => Object.assign(this.timing, timing),
    };
  }
  get end() {return this.timing.delay + this.timing.duration;}
  get currentTime() {return this.time;}
  set currentTime(value) {
    this.time = value;
    if (value >= this.end) {this.playState = 'finished'; this.resolve();}
  }
  pause() {this.playState = 'paused';}
  play() {
    // Native play() rewinds finished effects; Playback must restore the seek.
    if (this.time >= this.end) this.time = 0;
    this.playState = 'running';
  }
  cancel() {this.playState = 'idle'; this.reject(new Error('cancelled'));}
  updatePlaybackRate(rate) {this.playbackRate = rate;}
  opacityAt(time) {
    const progress = Math.max(0, Math.min(1, (time - this.timing.delay) / this.timing.duration));
    return this.frames[0].opacity + (this.frames.at(-1).opacity - this.frames[0].opacity) * progress;
  }
}

class Node {
  constructor(name) {this.name = name; this.animations = [];}
  animate(frames, timing) {
    const animation = new Animation(this, frames, timing);
    this.animations.push(animation);
    return animation;
  }
}

function titleTimeline(withDeparture = true) {
  const title = new Node('title'), controls = new Node('controls');
  const departure = withDeparture ? new Node('previous chapter') : undefined;
  return {title, controls, departure, ...chapterAnimations({title, controls, departure})};
}

function sceneTimeline() {
  const departure = new Node('chapter title'), scene = new Node('scene');
  const actor = new Node('first object'), caption = new Node('caption'), controls = new Node('controls');
  const animations = [
    actor.animate([{opacity: 0}, {opacity: 1}], {delay: 0, duration: 1000, fill: 'both'}),
    caption.animate([{opacity: 0}, {opacity: 1}], {delay: 0, duration: 600, fill: 'both'}),
    controls.animate([{opacity: 0}, {opacity: 1}], {delay: 1500, duration: 600, fill: 'both'}),
  ];
  const baseDuration = Math.max(...animations.map(animation => animation.end));
  const timeline = afterChapterTitle({animations, duration: baseDuration}, {departure, scene});
  return {departure, scene, actor, caption, controls, ...timeline};
}

function advance(playback, time) {
  for (const animation of playback.animations) {
    if (animation.playState === 'running') animation.currentTime = time;
  }
}

test('a chapter fades out completely, pauses on white, then reveals its title and controls', () => {
  const timeline = titleTimeline();
  const old = timeline.departure.animations[0], title = timeline.title.animations[0];
  const controls = timeline.controls.animations[0];
  assert.ok(title.timing.delay > old.end, 'there is a real white interval after the old scene has gone');
  const white = (old.end + title.timing.delay) / 2;
  assert.equal(old.opacityAt(white), 0);
  assert.equal(title.opacityAt(white), 0);
  assert.equal(controls.opacityAt(white), 0);
  assert.equal(title.opacityAt(timeline.duration), 1);
  assert.equal(controls.opacityAt(timeline.duration), 1);
  for (const animation of timeline.animations) {
    assert.ok(Number.isFinite(animation.end));
    assert.ok(animation.timing.duration > 0);
    assert.equal(animation.timing.fill, 'both', 'initial and final visibility cannot flash between phases');
  }
  assert.equal(timeline.duration, Math.max(...timeline.animations.map(animation => animation.end)));
});

test('Continue remains locked after the old scene and title finish, until controls have finished too', async () => {
  const timeline = titleTimeline(), playback = new Playback();
  const ready = playback.start(timeline.animations);
  advance(playback, timeline.departure.animations[0].end);
  assert.equal(playback.busy, true);
  advance(playback, timeline.title.animations[0].end);
  await Promise.resolve();
  assert.equal(playback.busy, true);
  advance(playback, timeline.controls.animations[0].end - 1);
  assert.equal(playback.busy, true);
  advance(playback, timeline.duration);
  assert.equal(await ready, true);
  assert.equal(playback.busy, false);
});

test('direct chapter entry still begins on white and gates input through the title reveal', async () => {
  const timeline = titleTimeline(false), playback = new Playback();
  assert.equal(timeline.animations.length, 2);
  const title = timeline.title.animations[0];
  assert.ok(title.timing.delay > 0);
  assert.equal(title.opacityAt(title.timing.delay / 2), 0);
  const ready = playback.start(timeline.animations);
  advance(playback, title.end);
  assert.equal(playback.busy, true);
  advance(playback, timeline.duration);
  assert.equal(await ready, true);
});

test('the first object and caption cannot appear until the title leaves and the white interval ends', async () => {
  const timeline = sceneTimeline(), playback = new Playback();
  const title = timeline.departure.animations[0];
  const scene = timeline.scene.animations[0];
  const actor = timeline.actor.animations[0], caption = timeline.caption.animations[0];
  assert.ok(actor.timing.delay > title.end);
  assert.ok(caption.timing.delay >= actor.timing.delay);
  assert.equal(scene.timing.delay, actor.timing.delay, 'the scene gate and first object share the delayed clock');
  const white = (title.end + actor.timing.delay) / 2;
  assert.equal(title.opacityAt(white), 0);
  assert.equal(scene.opacityAt(white), 0);
  assert.equal(actor.opacityAt(white), 0);
  assert.equal(caption.opacityAt(white), 0);
  const ready = playback.start(timeline.animations);
  advance(playback, Math.max(title.end, scene.end, actor.end, caption.end));
  assert.equal(playback.busy, true, 'early scene effects cannot unlock a later controls phase');
  advance(playback, timeline.duration);
  assert.equal(await ready, true);
  assert.equal(timeline.duration, Math.max(...timeline.animations.map(animation => animation.end)));
});

test('cancelling in the white interval cannot unlock a replacement chapter', async () => {
  const old = titleTimeline(), replacement = titleTimeline(false), playback = new Playback();
  const oldReady = playback.start(old.animations);
  advance(playback, (old.departure.animations[0].end + old.title.animations[0].timing.delay) / 2);
  const replacementReady = playback.start(replacement.animations);
  assert.equal(await oldReady, false);
  assert.equal(playback.busy, true);
  assert.ok(old.animations.every(animation => animation.playState === 'idle'));
  advance(playback, replacement.duration);
  assert.equal(await replacementReady, true);
});

test('language or viewport rebuild preserves the elapsed transition and a background pause', async () => {
  const old = titleTimeline(), rebuilt = titleTimeline(), playback = new Playback();
  const oldReady = playback.start(old.animations);
  const seek = old.title.animations[0].timing.delay + old.title.animations[0].timing.duration / 2;
  advance(playback, seek);
  playback.pause();
  const elapsed = playback.elapsed;
  const rebuiltReady = playback.start(rebuilt.animations, {elapsed, paused: playback.paused});
  assert.equal(await oldReady, false);
  assert.equal(playback.paused, true);
  assert.equal(playback.busy, true);
  assert.equal(playback.elapsed, seek);
  assert.equal(rebuilt.title.animations[0].opacityAt(playback.elapsed), old.title.animations[0].opacityAt(elapsed));
  playback.resume();
  assert.equal(playback.elapsed, seek, 'an already completed departure must not rewind on resume');
  assert.equal(rebuilt.departure.animations[0].currentTime, seek);
  advance(playback, rebuilt.duration);
  assert.equal(await rebuiltReady, true);
});

test('seeking through the title into the first scene preserves ordering and cancellation releases no stale callback', async () => {
  const timeline = sceneTimeline(), playback = new Playback();
  const seek = timeline.actor.animations[0].timing.delay + 50;
  const ready = playback.start(timeline.animations, {elapsed: seek, paused: true});
  assert.equal(playback.elapsed, seek);
  assert.equal(playback.paused, true);
  assert.equal(timeline.departure.animations[0].opacityAt(seek), 0);
  assert.ok(timeline.actor.animations[0].opacityAt(seek) > 0);
  assert.equal(timeline.controls.animations[0].opacityAt(seek), 0);
  playback.cancel();
  assert.equal(await ready, false);
  assert.equal(playback.busy, false);
  assert.equal(playback.animations.length, 0);
  assert.equal(await playback.start([]), true, 'reduced motion can settle immediately with no artificial wait');
});

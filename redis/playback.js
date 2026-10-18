/** A scene is ready only when every finite Web Animation has finished. */
export class Playback {
  constructor(onState = () => {}) {
    this.onState = onState;
    this.animations = [];
    this.state = 'ready';
    this.rate = 1;
    this.generation = 0;
  }

  get busy() { return this.state === 'running' || this.state === 'paused'; }
  get paused() { return this.state === 'paused'; }
  get elapsed() { return Math.max(0,...this.animations.map(a=>Number(a.currentTime)||0)); }

  start(animations, {rate=this.rate, elapsed=0, paused=false} = {}) {
    this.cancel(false);
    const generation = this.generation;
    this.animations = animations;
    this.rate = rate;
    this.state = animations.length ? paused ? 'paused' : 'running' : 'ready';
    for (const animation of animations) {
      animation.pause();
      animation.playbackRate = rate;
      if (!paused) animation.play();
      // play() rewinds an animation already at its end. Seek afterwards so
      // completed early phases stay completed when rebuilding a later scene.
      animation.currentTime = elapsed;
    }
    this.onState(this.state);
    return Promise.all(animations.map(a=>a.finished.then(()=>true,()=>false))).then(results=>{
      if (generation !== this.generation || results.some(done=>!done)) return false;
      this.state = 'ready';
      this.onState(this.state);
      return true;
    });
  }

  pause() {
    if (this.state !== 'running') return;
    for (const a of this.animations) if (a.playState !== 'finished') a.pause();
    this.state = 'paused'; this.onState(this.state);
  }

  resume() {
    if (!this.paused) return;
    for (const a of this.animations) if (a.playState !== 'finished') {
      const elapsed=a.currentTime;
      a.play(); a.currentTime=elapsed;
    }
    this.state = 'running'; this.onState(this.state);
  }

  setRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) return;
    this.rate = rate;
    for (const a of this.animations) a.updatePlaybackRate(rate);
  }

  cancel(notify=true) {
    this.generation++;
    for (const a of this.animations) a.cancel();
    this.animations = [];
    this.state = 'ready';
    if (notify) this.onState(this.state);
  }
}

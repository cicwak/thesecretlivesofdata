const FADE = 600;
const WHITE_PAUSE = 500;

/** Preserve a settled screen while the next chapter fades through white. */
export function chapterDeparture(player) {
  const clone = player.cloneNode(true);
  clone.removeAttribute('id');
  clone.className = 'chapter-departure';
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  clone.querySelectorAll('[data-ghost],.message-dot,.chapter-departure').forEach(node => node.remove());
  return clone;
}

/** Finite Web Animations share the player's pause, cancellation and seek clock. */
export function chapterAnimations({title, controls, departure}) {
  const animations = [];
  const add = (node, from, to, delay, duration) => {
    const animation = node.animate([{opacity:from}, {opacity:to}], {delay, duration, fill:'both', easing:'ease-in-out'});
    animation.pause();
    animations.push(animation);
  };
  if (departure) add(departure, 1, 0, 0, FADE);
  const titleAt = (departure ? FADE : 0) + WHITE_PAUSE;
  add(title, 0, 1, titleAt, FADE);
  add(controls, 0, 1, titleAt + 200, FADE);
  return {animations, duration:titleAt + 200 + FADE};
}

/** Let the title leave before the first objects and caption enter. */
export function afterChapterTitle(timeline, {departure, scene}) {
  const delay = FADE + 300;
  for (const animation of timeline.animations) {
    animation.effect.updateTiming({delay:Number(animation.effect.getTiming().delay) + delay});
  }
  for (const [node, frames, at, duration] of [
    [departure, [{opacity:1}, {opacity:0}], 0, FADE],
    [scene, [{opacity:0}, {opacity:1}], delay, 300],
  ]) {
    const animation = node.animate(frames, {delay:at, duration, fill:'both', easing:'ease-in-out'});
    animation.pause();
    timeline.animations.push(animation);
  }
  return {...timeline, duration:timeline.duration + delay};
}

/**
 * Advance one user-controlled stop, including the title before each chapter.
 * `lengths` contains the positive scene count for each chapter in story order.
 */
export function nextStoryPosition(position, lengths) {
  const {chapter, step, view} = position;
  if (view === 'chapter') return {chapter, step: 0, view: 'scene'};
  if (step + 1 < lengths[chapter]) return {chapter, step: step + 1, view: 'scene'};
  return {chapter: (chapter + 1) % lengths.length, step: 0, view: 'chapter'};
}

/** Go back one stop; the opening title is the beginning of the story. */
export function previousStoryPosition(position, lengths) {
  const {chapter, step, view} = position;
  if (view === 'scene') {
    if (step > 0) return {chapter, step: step - 1, view: 'scene'};
    return {chapter, step: 0, view: 'chapter'};
  }
  if (chapter === 0) return {chapter: 0, step: 0, view: 'chapter'};
  return {chapter: chapter - 1, step: lengths[chapter - 1] - 1, view: 'scene'};
}

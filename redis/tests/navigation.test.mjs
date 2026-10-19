import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../content.js';
import {storyLength} from '../beats.js';
import {nextStoryPosition, previousStoryPosition} from '../navigation.js';

const lengths = chapters.map(chapter => storyLength(chapter.id));
const intro = chapter => ({chapter, step: 0, view: 'chapter'});
const scene = (chapter, step) => ({chapter, step, view: 'scene'});
const expected = chapters.flatMap((chapter, index) => [
  intro(index),
  ...chapter.steps.map((_, step) => scene(index, step)),
]);

test('navigation uses all 126 real stops, including the seven- and five-stop chapters', () => {
  assert.equal(chapters.length, 21);
  assert.deepEqual(lengths, [7, 6, 6, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
  assert.deepEqual(lengths, chapters.map(chapter => chapter.steps.length));
  assert.equal(lengths.reduce((total, length) => total + length, 0), 126);
  assert.equal(expected.length, 147);
});

test('a complete forward traversal visits every scene and every chapter title exactly once', () => {
  let position = intro(0);
  const visited = [];
  for (const stop of expected) {
    assert.deepEqual(position, stop);
    visited.push(position);
    position = nextStoryPosition(position, lengths);
  }
  assert.equal(new Set(visited.map(stop => JSON.stringify(stop))).size, 147);
  assert.equal(visited.filter(stop => stop.view === 'chapter').length, 21);
  assert.deepEqual(
    visited.filter(stop => stop.view === 'scene').map(stop => `${chapters[stop.chapter].id}:${stop.step}`),
    chapters.flatMap(chapter => chapter.steps.map((_, step) => `${chapter.id}:${step}`)),
  );
  assert.deepEqual(position, intro(0), 'the final scene returns to the first title');
});

test('a complete backward traversal loses no scenes or chapter titles and stops at the beginning', () => {
  let position = expected.at(-1);
  for (const stop of [...expected].reverse()) {
    assert.deepEqual(position, stop);
    position = previousStoryPosition(position, lengths);
  }
  assert.deepEqual(position, intro(0));
  assert.deepEqual(previousStoryPosition(position, lengths), intro(0));
});

test('Continue opens the first scene from each title and inserts a title at each chapter boundary', () => {
  for (let chapter = 0; chapter < lengths.length; chapter++) {
    assert.deepEqual(nextStoryPosition(intro(chapter), lengths), scene(chapter, 0));
    assert.deepEqual(
      nextStoryPosition(scene(chapter, lengths[chapter] - 1), lengths),
      intro((chapter + 1) % lengths.length),
    );
  }
});

test('Back opens the current title from scene zero and the previous finale from later titles', () => {
  for (let chapter = 0; chapter < lengths.length; chapter++) {
    assert.deepEqual(previousStoryPosition(scene(chapter, 0), lengths), intro(chapter));
    assert.deepEqual(
      previousStoryPosition(intro(chapter), lengths),
      chapter === 0 ? intro(0) : scene(chapter - 1, lengths[chapter - 1] - 1),
    );
  }
});

test('all adjacent stops are reversible except the intentional final-to-opening wrap', () => {
  for (let index = 0; index < expected.length - 1; index++) {
    const before = expected[index];
    const after = expected[index + 1];
    assert.deepEqual(nextStoryPosition(before, lengths), after);
    assert.deepEqual(previousStoryPosition(after, lengths), before);
  }
});

test('a single-scene chapter still has a distinct title and never skips its only scene', () => {
  const shortLengths = [1, 3, 2];
  assert.deepEqual(nextStoryPosition(intro(0), shortLengths), scene(0, 0));
  assert.deepEqual(nextStoryPosition(scene(0, 0), shortLengths), intro(1));
  assert.deepEqual(previousStoryPosition(intro(1), shortLengths), scene(0, 0));
  assert.deepEqual(nextStoryPosition(scene(1, 1), shortLengths), scene(1, 2));
  assert.deepEqual(previousStoryPosition(scene(1, 2), shortLengths), scene(1, 1));
  assert.deepEqual(nextStoryPosition(scene(2, 1), shortLengths), intro(0));
});

test('navigation returns fresh records without mutating history positions or chapter lengths', () => {
  const frozenLengths = Object.freeze([...lengths]);
  for (const stop of expected) {
    const position = Object.freeze({...stop});
    const forward = nextStoryPosition(position, frozenLengths);
    const backward = previousStoryPosition(position, frozenLengths);
    assert.notEqual(forward, position);
    assert.notEqual(backward, position);
    assert.deepEqual(position, stop);
  }
  assert.deepEqual(frozenLengths, lengths);
});

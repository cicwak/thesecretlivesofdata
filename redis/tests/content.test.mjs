import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../content.js';
import {storyScene} from '../scenes.js';

const ids = ['first-key','request','event-loop','dictionary','encodings','atomicity','transactions','scripting','blocking','locks','expiry','memory','latency','rdb','aof','replication','sentinel','cluster','pubsub','streams','specialized'];
const bilingual = (value, path) => {
  for (const lang of ['ru','en']) {
    assert.equal(typeof value?.[lang], 'string', `${path}.${lang} is translated`);
    assert.ok(value[lang].trim().length > 0, `${path}.${lang} is nonempty`);
    assert.doesNotMatch(value[lang], /\b(TODO|TBD|Lorem ipsum)\b/i);
  }
};

test('the full agreed route has 21 stable chapter identifiers', () => {
  assert.deepEqual(chapters.map(c => c.id), ids);
});

for (const chapter of chapters) {
  test(`${chapter.id}: complete bilingual narrative and primary sources`, () => {
    bilingual(chapter.title, 'title');
    bilingual(chapter.summary, 'summary');
    assert.ok(Number.isInteger(chapter.group) && chapter.group >= 0 && chapter.group <= 6);
    assert.ok(chapter.steps.length >= 5 && chapter.steps.length <= 8);
    for (const [i,step] of chapter.steps.entries()) {
      bilingual(step.title, `steps[${i}].title`);
      bilingual(step.body, `steps[${i}].body`);
      bilingual(step.detail, `steps[${i}].detail`);
      for(const lang of ['ru','en'])assert.ok(step.body[lang].length<=160,'one short thought per caption');
      assert.equal(typeof step.command, 'string');
    }
    assert.ok(chapter.deeper.length >= 2);
    for (const value of chapter.deeper) bilingual(value, 'deeper');
    assert.ok(chapter.sources.length > 0);
    for (const source of chapter.sources) {
      const url = new URL(source.url);
      assert.ok(url.hostname === 'redis.io' || (url.hostname === 'github.com' && url.pathname.startsWith('/redis/')));
    }
  });
  test(`${chapter.id}: every translated diagram is accessible and changes across the story`, () => {
    for (const lang of ['ru','en']) for (const compact of [false,true]) {
      const scenes = chapter.steps.map((_,i) => storyScene(chapter.id,i,lang,compact));
      for (const svg of scenes) {
        assert.equal(typeof svg, 'string');
        assert.match(svg, /<svg\b/);
        assert.match(svg, /role=["']img["']/);
        assert.match(svg, /<title[\s>]/);
        if (compact) assert.match(svg, /viewBox=["']0 0 420 (360|390)["']/);
        assert.doesNotMatch(svg, /undefined|NaN|<script\b|foreignObject/);
      }
      assert.ok(new Set(scenes).size >= 3, 'at least three distinct explanatory states');
    }
  });
}

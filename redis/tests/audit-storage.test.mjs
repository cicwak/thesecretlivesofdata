import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab, reduceLab, labView} from '../model.js';

test('rehash releases the old table as soon as its last entries move', () => {
  let state=createLab('dictionary');
  state=reduceLab(state,'insert'); // cat: byte sum312, bucket0 in4 buckets
  state=reduceLab(state,'grow');
  assert.ok(state.old);
  state=reduceLab(state,'rehash');
  assert.equal(state.old,null);
  state=reduceLab(state,'lookup');
  assert.match(state.lookup,/cat.*ht\[0\]/);
  assert.deepEqual(state.entries,['cat']);
  assert.equal(reduceLab(createLab('dictionary'),'grow').old,null);
});

test('SET demo hello replaces a grown String and restores its short-string encoding', () => {
  let state=reduceLab(createLab('encodings'),'grow');
  state=reduceLab(state,'text');
  const view=labView(state);
  assert.equal(view.panels[0].rows.find(row=>row.label==='OBJECT ENCODING').value,'embstr');
  assert.equal(state.count,5);
  assert.equal(view.controls.find(control=>control.id==='text').label.en,'SET demo hello');
  assert.match(view.note.en,/Strings are replaced using SET/);
});

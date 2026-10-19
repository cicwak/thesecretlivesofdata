import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chapters} from '../content.js';
import {storyScene,layoutScene} from '../scenes.js';
import {choreography} from '../choreography.js';
import {stepEvidence} from '../evidence.js';
import {messages,chooseLanguage,chapterUrl} from '../i18n.js';

test('the complete agreed route has seventy unique, ordered chapters and ten groups',()=>{
  assert.equal(chapters.length,70);
  assert.deepEqual(chapters.map(c=>c.number),Array.from({length:70},(_,i)=>i+1));
  assert.equal(new Set(chapters.map(c=>c.id)).size,70);
  assert.equal(chapters[0].id,'first-order');
  assert.deepEqual([...new Set(chapters.map(c=>c.group))],Array.from({length:10},(_,i)=>i));
  assert.ok(chapters[0].steps.some(step=>step.command.includes('INSERT')));
  assert.ok(chapters[0].steps.some(step=>step.command.includes('SELECT')));
});

for(const chapter of chapters)test(`${chapter.number}: ${chapter.id} has a complete bilingual causal story and sources`,()=>{
  assert.ok(chapter.steps.length>=4&&chapter.steps.length<=10);
  for(const field of ['title','question','next'])for(const lang of ['ru','en'])assert.ok(chapter[field]?.[lang]?.trim(),field);
  assert.ok(chapter.steps.some(step=>step.command));
  for(const [index,step]of chapter.steps.entries()){
    for(const lang of ['ru','en']){
      assert.ok(step.body[lang]?.trim());assert.ok(step.detail[lang]?.trim());
      assert.ok(step.body[lang].length<=260,`${chapter.id}:${index}:${lang}: caption ${step.body[lang].length}`);
    }
    assert.ok(step.diagram.actors.length>0&&step.diagram.actors.length<=5);
    const keys=step.diagram.actors.map(a=>a.key);assert.equal(new Set(keys).size,keys.length);
    for(const flow of step.diagram.flows){assert.ok(keys.includes(flow.from),flow.from);assert.ok(keys.includes(flow.to),flow.to);assert.notEqual(flow.from,flow.to);}
    const proof=stepEvidence(chapter.id,index);assert.ok(proof.docs.length>0);
    for(const ref of proof.docs)assert.match(ref.url,/^https:\/\/(www\.postgresql\.org|postgrespro\.ru|edu\.postgrespro\.ru)\//);
    for(const ref of proof.book)assert.match(ref.url,/postgresql_internals-18\.pdf#page=\d+$/);
    const score=choreography(chapter.id,index);
    const change=score.phases.findIndex(p=>p.kind==='change');
    assert.ok(change>0);
    for(const [i,phase]of score.phases.entries())if(phase.role==='reply')assert.ok(i>change);
    for(const compact of [false,true])for(const lang of ['ru','en']){
      const svg=storyScene(chapter.id,index,lang,compact),layout=layoutScene(step.diagram,compact);
      assert.ok(!svg.includes('undefined')&&!svg.includes('NaN'),`${chapter.id}:${index}`);
      assert.match(svg,/role="img"/);
      const allKeys=[...svg.matchAll(/data-key="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(allKeys).size,allKeys.length);
      for(const actor of layout.actors){assert.ok(actor.x-actor.w/2>=0);assert.ok(actor.x+actor.w/2<=layout.width);assert.ok(actor.y-actor.h/2>=0);assert.ok(actor.y+actor.h/2<=layout.height);}
      for(let i=0;i<layout.actors.length;i++)for(let j=i+1;j<layout.actors.length;j++){
        const a=layout.actors[i],b=layout.actors[j];assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2,'actor overlap');
      }
    }
  }
});

test('same minimal controls and storage-independent language selection as Redis',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="replay"/);assert.match(html,/id="next"/);assert.match(html,/id="details"/);
  assert.ok(!html.includes('speed')&&!html.includes('experiment'));
  for(const lang of ['ru','en'])assert.equal(messages[lang].groups.length,10);
  assert.equal(chooseLanguage({search:'?lang=en',stored:'ru',languages:['ru']}),'en');
  assert.equal(chapterUrl('snapshots','ru'),'/postgres/?lang=ru#snapshots');
});

test('a table keeps its semantic heading after layout measures its title',()=>{
  assert.match(storyScene('first-order',2,'en'),/>Orders<\/text>/);
  assert.match(storyScene('first-order',2,'ru'),/>Заказы<\/text>/);
  assert.match(storyScene('first-order',2,'en'),/>Book<\/text>/);
});

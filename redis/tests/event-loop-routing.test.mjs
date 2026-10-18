import test from 'node:test';
import assert from 'node:assert/strict';
import {storyScene} from '../scenes.js';
import {choreography} from '../choreography.js';

const group = (svg, key) => svg.match(new RegExp(`<g\\b[^>]*data-key="${key}"[^>]*>([\\s\\S]*?)<\\/g>`));
const circle = (svg, key) => {
  const markup = group(svg,key)?.[1].match(/<circle\b[^>]*>/)?.[0];
  assert.ok(markup,`${key} has an actual circle`);
  return Object.fromEntries([...markup.matchAll(/(cx|cy|r)="([^"]+)"/g)].map(([,name,value])=>[name,Number(value)]));
};
const ends = markup => {
  const values=markup.match(/<path\b[^>]*?\sd="([^"]+)"/)[1].match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
  return {start:values.slice(0,2),end:values.slice(-2)};
};
const nearBoundary = (point,node,label) => {
  const distance=Math.hypot(point[0]-node.cx,point[1]-node.cy);
  assert.ok(distance>=node.r-1&&distance<=node.r+12,`${label}: path must meet the visible circle, got ${distance} for radius ${node.r}`);
};

test('event-loop replies return to the requesting client in both languages and layouts',()=>{
  for(const lang of ['ru','en'])for(const compact of [false,true])for(const [step,recipient,label] of [[2,'A','+OK'],[3,'B','"Alice"']]){
    const svg=storyScene('event-loop',step,lang,compact),reply=group(svg,'event-loop-reply');
    assert.ok(reply);
    assert.match(reply[0],/data-role="reply"/);
    assert.match(reply[0],/data-stage="3"/);
    assert.ok(reply[1].replaceAll('&quot;','"').includes(label));
    assert.equal([...svg.matchAll(/<g\b[^>]*data-role="reply"/g)].length,1);
    const path=ends(reply[1]);
    nearBoundary(path.start,circle(svg,'event-loop-server'),'reply source');
    nearBoundary(path.end,circle(svg,`event-client-${recipient}`),'reply recipient');
    assert.deepEqual(choreography('event-loop',step).phases.slice(1,-1).map(phase=>phase.kind),['message','change','message']);
  }
});

test('event-loop requests reach Redis and a busy script does not invent a reply',()=>{
  for(const lang of ['ru','en'])for(const compact of [false,true])for(let step=0;step<6;step++){
    const svg=storyScene('event-loop',step,lang,compact),redis=circle(svg,'event-loop-server');
    for(const client of ['A','B','C'])nearBoundary(ends(group(svg,`event-request-${client}`)[1]).end,redis,`${client} request destination`);
    if(step===5)assert.equal(group(svg,'event-loop-reply'),null);
  }
});

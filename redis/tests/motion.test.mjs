import test from 'node:test';
import assert from 'node:assert/strict';
import {actorMatrix} from '../motion.js';

const coefficients = value => value.slice(7,-1).split(',').map(Number);
const project = (matrix,x,y) => {
  const [a,b,c,d,e,f]=coefficients(matrix);
  return {x:a*x+c*y+e,y:b*x+d*y+f};
};

test('a moved actor starts at its previous world position and settles at the new one',()=>{
  const base={a:1,b:0,c:0,d:1,e:120,f:40};
  const anchor={x:480,y:144};
  assert.deepEqual(project(actorMatrix(base,anchor,{x:-170,y:20}),360,104),{x:310,y:164});
  assert.deepEqual(project(actorMatrix(base,anchor),360,104),anchor);
});

test('a newly introduced actor grows around its source instead of the canvas origin',()=>{
  const base={a:1,b:0,c:0,d:1,e:0,f:0};
  const anchor={x:700,y:144},delta={x:-220,y:0};
  for(const scale of [.04,.4,1]) {
    assert.deepEqual(project(actorMatrix(base,anchor,delta,scale),700,144),{x:480,y:144});
  }
});

test('the final frame preserves existing scaled or translated SVG geometry',()=>{
  const base={a:2,b:0,c:0,d:2,e:-70,f:30};
  assert.deepEqual(coefficients(actorMatrix(base,{x:480,y:144})),[2,0,0,2,-70,30]);
});

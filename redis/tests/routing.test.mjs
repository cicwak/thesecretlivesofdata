import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../content.js';
import { storyScene } from '../scenes.js';
import { resolveBeat } from '../beats.js';

// Read SVG structure rather than matching a flow's first closing </g>. Endpoint
// groups can contain nested state labels, and actors add translated wrappers.
// Real endpoint distances, including transforms, are checked by the browser QA.
function parseSvg(markup) {
  const document = { tag: '#document', attrs: {}, children: [], text: '' };
  const stack = [document];
  for (const token of markup.match(/<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w:-]+)/)?.[1];
      assert.equal(stack.at(-1).tag, tag, `balanced SVG element ${tag}`);
      stack.pop();
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([\w:-]+)/)?.[1];
      if (!tag) continue;
      const attrs = Object.fromEntries([...token.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
      const node = { tag, attrs, children: [], text: '' };
      stack.at(-1).children.push(node);
      if (!token.endsWith('/>')) stack.push(node);
    } else {
      stack.at(-1).text += token;
    }
  }
  assert.equal(stack.length, 1, 'SVG elements all close');
  return document;
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

function inspect(id, index, lang, compact) {
  const nodes = descendants(parseSvg(storyScene(id, index, lang, compact)));
  const keys = new Map();
  const duplicates = [];
  for (const node of nodes) {
    const key = node.attrs['data-key'];
    if (!key) continue;
    if (keys.has(key)) duplicates.push(key);
    keys.set(key, node);
  }
  const flows = nodes.filter(node => (node.attrs.class || '').split(/\s+/).includes('flow'));
  return { nodes, keys, duplicates, flows };
}

function hasVisibleGeometry(endpoint) {
  const visible = node => {
    if (node.attrs.display === 'none' || node.attrs.visibility === 'hidden' || node.attrs.opacity === '0') return false;
    if (node.tag === 'circle') return Number(node.attrs.r) > 0;
    if (node.tag === 'rect') return Number(node.attrs.width) > 0 && Number(node.attrs.height) > 0;
    if (node.tag === 'path') return /[MLCQAHVSTZ]/i.test(node.attrs.d || '');
    if (node.tag === 'text') return descendants(node).some(child => child.text.trim());
    return node.children.some(visible);
  };
  return visible(endpoint);
}

const views = function* (ids = chapters.map(chapter => chapter.id)) {
  for (const id of ids) {
    const chapter = chapters.find(item => item.id === id);
    for (let index = 0; index < chapter.steps.length; index++) {
      for (const lang of ['ru', 'en']) for (const compact of [false, true]) {
        yield { id, index, lang, compact, label: `${id}/${index}/${lang}/${compact ? 'compact' : 'desktop'}` };
      }
    }
  }
};

const flowByKey = (view, key) => view.flows.find(flow => flow.attrs['data-key'] === key)?.attrs;
const flowRole = (flow, role, label) => {
  assert.ok(flow, `${label}: flow exists`);
  assert.equal(flow['data-role'], role, `${label}: ${role} phase`);
};

function sameOperation(request, reply, label) {
  assert.equal(reply['data-sequence'], request['data-sequence'], `${label}: reply belongs to the same operation`);
}

test('all 504 localized responsive story views connect every flow to unique visible endpoints', () => {
  const failures = [];
  let checked = 0;
  for (const view of views()) {
    checked++;
    const svg = inspect(view.id, view.index, view.lang, view.compact);
    if (svg.duplicates.length) failures.push(`${view.label}: duplicate ${svg.duplicates.join(', ')}`);
    for (const flow of svg.flows) {
      const key = flow.attrs['data-key'] || '(unkeyed flow)';
      for (const end of ['from', 'to']) {
        const endpointKey = flow.attrs[`data-${end}`];
        const endpoint = svg.keys.get(endpointKey);
        const issue = !endpointKey ? 'missing key' : !endpoint ? `absent ${endpointKey}` : !hasVisibleGeometry(endpoint) ? `empty ${endpointKey}` : null;
        if (issue) failures.push(`${view.label} ${key}.${end}: ${issue}`);
      }
      assert.notEqual(flow.attrs['data-from'], flow.attrs['data-key'], `${view.label}/${key}: flow is not its own source`);
      assert.notEqual(flow.attrs['data-to'], flow.attrs['data-key'], `${view.label}/${key}: flow is not its own destination`);
    }
  }
  assert.equal(checked, 504, '126 story stops × two languages × two layouts');
  assert.equal(failures.length, 0, `Unresolved endpoints (${failures.length}):\n${failures.slice(0, 60).join('\n')}${failures.length > 60 ? '\n…' : ''}`);
});

test('first-key replies return to the requesting client for SET, GET, replacement and deletion', () => {
  for (const view of views(['first-key'])) {
    const svg = inspect(view.id, view.index, view.lang, view.compact);
    const request = flowByKey(svg, 'first-key-request');
    const reply = flowByKey(svg, 'first-key-reply');
    if (view.index === 0) {
      assert.equal(request, undefined, `${view.label}: server has not appeared`);
      assert.equal(reply, undefined, `${view.label}: no invented reply`);
      continue;
    }
    flowRole(request, 'request', view.label);
    assert.equal(request['data-from'], 'first-key-client', view.label);
    assert.equal(request['data-to'], 'first-key-server', view.label);
    if (view.index < 3) continue;
    flowRole(reply, 'reply', view.label);
    assert.equal(reply['data-from'], request['data-to'], view.label);
    assert.equal(reply['data-to'], request['data-from'], view.label);
    sameOperation(request, reply, view.label);
    if (view.index >= 5) assert.equal(Number(reply['data-sequence']), resolveBeat(view.id, view.index).operation, `${view.label}: Bob and DEL remain separate operations`);
  }
});

test('atomicity never routes one client’s response to the other client', () => {
  for (const view of views(['atomicity'])) {
    const svg = inspect(view.id, view.index, view.lang, view.compact);
    for (const client of ['a', 'b']) {
      const request = flowByKey(svg, `atomicity-${client}-request`);
      const reply = flowByKey(svg, `atomicity-${client}-reply`);
      if (!request && !reply) continue;
      flowRole(request, 'request', view.label);
      flowRole(reply, 'reply', view.label);
      assert.equal(request['data-from'], `atomicity-client-${client}`, view.label);
      assert.equal(request['data-to'], 'atomicity-server', view.label);
      assert.equal(reply['data-from'], request['data-to'], view.label);
      assert.equal(reply['data-to'], request['data-from'], view.label);
      sameOperation(request, reply, view.label);
    }
  }
});

test('transaction and WATCH results return to A even when B changes the watched key', () => {
  for (const view of views(['transactions'])) {
    const svg = inspect(view.id, view.index, view.lang, view.compact);
    const request = flowByKey(svg, view.compact ? 'transaction-request' : 'transaction-a-request');
    const reply = flowByKey(svg, 'transaction-result');
    flowRole(request, 'request', view.label);
    flowRole(reply, 'reply', view.label);
    assert.equal(request['data-from'], 'transaction-client-a', view.label);
    assert.equal(reply['data-to'], request['data-from'], view.label);
    sameOperation(request, reply, view.label);
    const otherRequest = flowByKey(svg, 'transaction-b-request');
    if (view.index === 3) {
      flowRole(otherRequest, 'request', view.label);
      assert.equal(otherRequest['data-from'], 'transaction-client-b', view.label);
      assert.notEqual(reply['data-to'], otherRequest['data-from'], `${view.label}: EXEC result belongs to A`);
    } else {
      assert.equal(otherRequest, undefined, `${view.label}: no invented B command`);
    }
  }
});

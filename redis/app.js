import {chapters} from './content.js';
import {storyScene} from './scenes.js';
import {messages, localize, chooseLanguage, chapterUrl} from './i18n.js';
import {Playback} from './playback.js';
import {sceneAnimations} from './motion.js';
import {choreography} from './choreography.js';
import {stepEvidence} from './evidence.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name, size=17) => {
  const paths = {next:'m6 3 9 7-9 7', replay:'M4 7a7 7 0 1 1-1 6M4 2v5h5', close:'m4 4 12 12M16 4 4 16'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><path d="${paths[name]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
};
let stored = '';
try { stored = localStorage.getItem('redis-language') || ''; } catch { /* Private/storage-disabled browsing is supported. */ }
let lang = chooseLanguage({search:location.search, stored, languages:navigator.languages || [navigator.language]});
let chapterIndex = Math.max(0,chapters.findIndex(c=>c.id===decodeHash()));
let stepIndex = 0;
let autoPaused = false;
let timelineDuration = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const smallViewport = matchMedia('(max-width: 680px)');
const t = key => messages[lang][key];
const l = value => localize(value,lang);
const current = () => chapters[chapterIndex];
const playback = new Playback(renderPlaybackState);
function decodeHash() { try {return decodeURIComponent(location.hash.slice(1));} catch {return '';} }
function updateUrl(push=false) {
  history[push?'pushState':'replaceState']({chapter:current().id,step:stepIndex},'',chapterUrl(current().id,lang,location.pathname));
}
function stopAnimation() {
  playback.cancel(false);
}
function renderPlaybackState() {
  const busy=playback.busy;
  $('scene').setAttribute('aria-busy',String(busy));
  $('player').dataset.playback=playback.state;
  $('player').dataset.duration=String(timelineDuration);
  $('next').disabled=busy;
  $('replay').disabled=busy||reducedMotion.matches;
  $('about').disabled=busy;
}
function beginAnimation({elapsed=0,paused=false}={}) {
  stopAnimation();
  renderDiagram();
  if(reducedMotion.matches) {timelineDuration=0;playback.start([]);return;}
  const previousMarkup=stepIndex>0?storyScene(current().id,stepIndex-1,lang,smallViewport.matches):null;
  const timeline=sceneAnimations({host:$('scene'),previousMarkup,caption:$('explanation'),controls:document.querySelector('.player-controls'),score:choreography(current().id,stepIndex),entry:stepIndex===0,sceneId:current().id});
  timelineDuration=timeline.duration;
  playback.start(timeline.animations,{rate:1,elapsed,paused});
}
function renderDiagram() {
  $('scene').innerHTML=storyScene(current().id,stepIndex,lang,smallViewport.matches);
  settleDiagram($('scene'));
}
function settleDiagram(host) {
  host.querySelectorAll('[data-transient="true"]').forEach(el=>{el.style.opacity='0';});
  const sequenced=[...host.querySelectorAll('[data-sequence]')];
  for(const el of sequenced)if(sequenced.some(other=>other.dataset.motion===el.dataset.motion&&other.dataset.role===el.dataset.role&&Number(other.dataset.sequence)>Number(el.dataset.sequence)))el.style.opacity='0';
}
function renderMenu() {
  $('contentsTitle').textContent=t('app'); $('chapterCount').textContent=t('chapters');
  $('chapterLinks').innerHTML=messages[lang].groups.map((group,i)=>`<section class="chapter-group"><h3>${escape(group)}</h3>${chapters.filter(c=>c.group===i).map(c=>`<a class="chapter-link" href="${chapterUrl(c.id,lang,location.pathname)}" data-chapter="${c.id}"${c.id===current().id?' aria-current="page"':''}><span>${String(chapters.indexOf(c)+1).padStart(2,'0')}</span>${escape(l(c.title))}</a>`).join('')}</section>`).join('');
}
function renderDetails() {
  const chapter=current();
  $('detailsTitle').textContent=`${t('about')} · ${l(chapter.title)}`;
  const command=chapter.steps[stepIndex].command;
  const detail=chapter.steps[stepIndex].detail;
  const proof=stepEvidence(chapter.id,stepIndex);
  const links=refs=>`<ul class="source-list">${refs.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(l(s.label))}</a></li>`).join('')}</ul>`;
  const evidenceHtml=proof?`<section data-step-evidence="${chapter.id}:${stepIndex}"><h3>${escape(t('stepSources'))}</h3><p>${escape(t('auditNote'))}</p><h4>${escape(t('documentation'))}</h4>${links(proof.docs)}<h4>${escape(t('implementation'))}</h4>${links(proof.code)}<p><a href="audit/README.md" target="_blank" rel="noopener noreferrer">${escape(t('audit'))}</a></p></section>`:'';
  $('detailsBody').innerHTML=`${detail?`<p>${escape(l(detail))}</p>`:''}${command?`<h3>${escape(t('command'))}</h3><pre>${escape(command)}</pre>`:''}${evidenceHtml}${chapter.deeper.map(p=>`<p>${escape(l(p))}</p>`).join('')}<h3>${escape(t('sources'))}</h3>${links(chapter.sources)}`;
}
function render({animate=false}={}) {
  document.documentElement.lang=lang;
  document.querySelector('meta[name="description"]').content=t('description');
  document.title=`${l(current().title)} · ${t('app')} · The Secret Lives of Data`;
  $('skip').textContent=t('skip');
  document.querySelectorAll('.languages').forEach(group=>group.setAttribute('aria-label',t('language')));
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  $('menuButton').setAttribute('aria-label',t('contents')); $('menuButton').title=t('contents');
  $('chapterMeta').textContent=l(current().title);
  $('stepTitle').textContent=l(current().steps[stepIndex].title);
  $('explanation').textContent=l(current().steps[stepIndex].body);
  $('replay').innerHTML=icon('replay'); $('replay').setAttribute('aria-label',t('replay')); $('replay').title=t('replay');
  $('replay').disabled=reducedMotion.matches;
  $('next').innerHTML=`${escape(t('next'))}${icon('next',14)}`;
  $('about').textContent=t('about');
  document.querySelectorAll('.close-dialog').forEach(b=>{b.innerHTML=icon('close',14);b.setAttribute('aria-label',t('close'));});
  renderDiagram(); renderMenu(); renderDetails(); renderPlaybackState();
  if(animate) beginAnimation();
}
function navigate(index,step=0,push=true) {
  stopAnimation(); chapterIndex=index; stepIndex=step;
  updateUrl(push); render({animate:true});
}
function next() {
  if(playback.busy)return;
  if(stepIndex<current().steps.length-1) navigate(chapterIndex,stepIndex+1,false);
  else navigate((chapterIndex+1)%chapters.length,0,true);
}
function previous() {
  if(playback.busy)return;
  if(stepIndex>0) navigate(chapterIndex,stepIndex-1,false);
  else if(chapterIndex>0) navigate(chapterIndex-1,chapters[chapterIndex-1].steps.length-1,true);
}
function switchLanguage(nextLang) {
  if(nextLang===lang) return;
  const wasPlaying=playback.busy,wasPaused=playback.paused,elapsed=playback.elapsed;
  stopAnimation(); lang=nextLang;
  try {localStorage.setItem('redis-language',lang);} catch { /* URL still preserves the choice. */ }
  updateUrl(true); render();
  if(wasPlaying)beginAnimation({elapsed,paused:wasPaused});
}
$('next').addEventListener('click',next);
$('skip').addEventListener('click',e=>{e.preventDefault();$('explanation').focus();$('explanation').scrollIntoView({block:'nearest'});});
$('replay').addEventListener('click',()=>{if(!playback.busy)beginAnimation();});
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>switchLanguage(button.dataset.lang)));
$('menuButton').addEventListener('click',()=>{$('contents').showModal();});
$('about').addEventListener('click',()=>{$('contents').close();$('details').showModal();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('chapterLinks').addEventListener('click',e=>{const link=e.target.closest('[data-chapter]');if(!link)return;e.preventDefault();$('contents').close();navigate(chapters.findIndex(c=>c.id===link.dataset.chapter));});
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('dialog,input,textarea,[contenteditable]'))return;
  if(e.key==='ArrowRight'){e.preventDefault();next();}
  if(e.key==='ArrowLeft'){e.preventDefault();previous();}
});
function routeFromUrl() {
  const nextIndex=chapters.findIndex(c=>c.id===decodeHash());
  chapterIndex=nextIndex<0?0:nextIndex;
  lang=chooseLanguage({search:location.search,stored:lang,languages:navigator.languages});
  const candidate=history.state?.chapter===current().id?history.state.step:0;
  stepIndex=Number.isInteger(candidate)&&candidate>=0&&candidate<current().steps.length?candidate:0;
  stopAnimation();updateUrl(false);render({animate:true});
}
window.addEventListener('popstate',routeFromUrl);window.addEventListener('hashchange',routeFromUrl);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playback.state==='running'){autoPaused=true;playback.pause();}
  else if(!document.hidden&&autoPaused){autoPaused=false;playback.resume();}
});
reducedMotion.addEventListener('change',()=>{stopAnimation();render();});
smallViewport.addEventListener('change',()=>{
  const busy=playback.busy,paused=playback.paused,elapsed=playback.elapsed;
  if(busy)beginAnimation({elapsed,paused});else{stopAnimation();renderDiagram();renderPlaybackState();}
});
updateUrl(false); render({animate:true});

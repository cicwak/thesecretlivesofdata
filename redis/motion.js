const SVG_NS = 'http://www.w3.org/2000/svg';
const sameContent = (a,b) => a && a.textContent === b.textContent && a.innerHTML === b.innerHTML;
const topLevel = elements => elements.filter(el=>!elements.some(other=>other!==el&&other.contains(el)));

/** Construct a finite, seekable animation score. Nothing uses a wall-clock timeout. */
export function sceneAnimations({host, previousMarkup, caption, controls, score}) {
  const svg = host.querySelector('svg');
  const previous = previousMarkup ? new DOMParser().parseFromString(previousMarkup,'image/svg+xml').documentElement : null;
  const previousByKey = new Map(previous ? [...previous.querySelectorAll('[data-key]')].map(el=>[el.dataset.key,el]) : []);
  const animations = [];
  const scheduled = new Set();
  const elements = [...svg.querySelectorAll('[data-motion]')];
  const changes = elements.filter(el=>el.dataset.motion==='change');
  const flows = elements.filter(el=>el.dataset.motion==='flow');
  const ghosts = new Map();
  const schedule = [];
  let cursor = 0;
  let changePass = 0;

  const add = (el,frames,delay,duration,easing='ease-in-out',fill='both') => {
    const animation=el.animate(frames,{delay,duration:Math.max(1,duration),easing,fill});
    animation.pause();
    animations.push(animation);
    return animation;
  };
  const reveal = (el,at,duration=350) => {
    if(scheduled.has(el))return;
    scheduled.add(el);
    add(el,[{opacity:0},{opacity:1}],at,duration);
  };

  // Retain the old value until the request has arrived, instead of flashing
  // the completed result before a decorative message starts moving.
  for(const el of changes) {
    if(Number(el.dataset.stage)!==2)continue;
    const old=previousByKey.get(el.dataset.key);
    if(old&&!sameContent(old,el)) {
      const ghost=old.cloneNode(true);
      ghost.removeAttribute('data-key');
      ghost.setAttribute('data-ghost','');
      ghost.setAttribute('aria-hidden','true');
      ghost.querySelectorAll('[data-key]').forEach(child=>child.removeAttribute('data-key'));
      el.parentNode.insertBefore(ghost,el);
      ghosts.set(el,ghost);
    }
  }

  const targetsFor = phase => {
    if(phase.kind==='hold') return [svg];
    if(phase.kind==='context') return topLevel(elements.filter(el=>el.dataset.motion==='context'));
    if(phase.kind==='note')return changes.filter(el=>Number(el.dataset.stage)===4);
    if(phase.kind==='change') {
      const pass=phase.beat===undefined?changePass:0;
      return topLevel(changes.filter(el=>Number(el.dataset.stage)===2 &&
        (phase.beat===undefined ? Number(el.dataset.pass||0)===pass : Number(el.dataset.sequence||0)===phase.beat)));
    }
    let candidates=flows.filter(el=>!scheduled.has(el)&&
      (phase.beat===undefined||Number(el.dataset.sequence||0)===phase.beat));
    const exact=candidates.filter(el=>el.dataset.role===phase.role);
    if(exact.length)return exact;
    // Internal diagrams use the same blue transfer vocabulary as replication.
    if(phase.role==='internal')return candidates.filter(el=>el.dataset.role==='sync'||el.dataset.role==='internal');
    if(phase.role==='sync')return candidates.filter(el=>el.dataset.role==='internal');
    return [];
  };

  for(const phase of score.phases) {
    const targets=targetsFor(phase);
    if(phase.kind==='change'&&phase.beat===undefined)changePass++;
    if(!targets.length)continue;
    schedule.push({...phase,targets,at:cursor});
    // Reserve each flow just once, unless explicitly split into separate beats.
    if(phase.kind==='message')targets.forEach(el=>scheduled.add(el));
    cursor+=phase.duration;
  }
  scheduled.clear();

  // A value tagged with pass=1 must still appear if the score contains only
  // one change phase (for example a compact view merges two physical boxes).
  const finalChange=schedule.findLast(phase=>phase.kind==='change');
  const covered=new Set(schedule.flatMap(phase=>phase.targets));
  const leftovers=topLevel(changes.filter(el=>Number(el.dataset.stage)===2&&!covered.has(el)));
  if(leftovers.length) {
    if(finalChange)finalChange.targets.push(...leftovers);
    else {schedule.push({kind:'change',stage:2,targets:leftovers,at:Math.max(450,cursor-250),duration:450});cursor=Math.max(cursor,900);}
  }

  add(caption,[{opacity:0},{opacity:1}],0,600);
  for(const el of elements.filter(el=>el.dataset.motion==='change'&&Number(el.dataset.stage)===0))reveal(el,100,450);

  for(const phase of schedule) {
    const {at,duration,targets}=phase;
    if(phase.kind==='context') {
      for(const el of targets) {
        if(previousByKey.has(el.dataset.key))continue;
        el.style.transformBox='fill-box';el.style.transformOrigin='center';
        scheduled.add(el);
        add(el,[{opacity:0,transform:'scale(.75)'},{opacity:1,transform:'scale(1)'}],at,duration);
      }
    } else if(phase.kind==='message') {
      targets.forEach((el,index)=>{
        const offset=phase.order==='parallel'?0:index*duration/targets.length;
        const flight=phase.order==='parallel'?duration:duration/targets.length;
        reveal(el,at+offset,Math.min(160,flight/3));
        const path=el.querySelector('path');if(!path)return;
        const dot=document.createElementNS(SVG_NS,'circle');
        dot.setAttribute('r','5');dot.setAttribute('class','message-dot');
        const color=path.getAttribute('stroke')||'black';
        dot.setAttribute('fill',el.dataset.role==='reply'?'white':color);
        dot.setAttribute('stroke',color);dot.setAttribute('stroke-width','2');
        dot.style.offsetPath=`path('${path.getAttribute('d')}')`;
        dot.style.opacity='0';svg.appendChild(dot);
        add(dot,[
          {offset:0,offsetDistance:'0%',opacity:0},
          {offset:.03,offsetDistance:'3%',opacity:1},
          {offset:.97,offsetDistance:'97%',opacity:1},
          {offset:1,offsetDistance:'100%',opacity:0},
        ],at+offset,flight,'linear');
      });
    } else if(phase.kind==='change'||phase.kind==='note') {
      targets.forEach((el,index)=>{
        const atElement=at+(phase.order==='parallel'?0:index*Math.min(90,duration/targets.length));
        const old=previousByKey.get(el.dataset.key);
        if(old&&sameContent(old,el)) {
          scheduled.add(el);
          add(el,[{opacity:1},{opacity:.45},{opacity:1}],atElement,Math.min(500,duration));
        } else reveal(el,atElement,Math.min(400,duration));
        const ghost=ghosts.get(el);
        if(ghost) {
          let replaceAt=atElement;
          if(el.dataset.previousUntil!==undefined) {
            replaceAt=schedule.find(p=>p.kind==='change'&&Number(p.beat??0)===Number(el.dataset.previousUntil))?.at??replaceAt;
          }
          add(ghost,[{opacity:1},{opacity:0}],replaceAt,200);
        }
      });
    } else if(phase.kind==='hold') {
      // Waiting is visible story time, paused and sped up with the scene.
      add(svg,[{opacity:1},{opacity:1}],at,duration,'linear');
    }
  }

  for(const el of elements.filter(el=>el.dataset.transient==='true'||el.dataset.sequence!==undefined)) {
    const sequence=Number(el.dataset.sequence||0);
    const next=schedule.find(p=>p.beat!==undefined&&p.beat>sequence);
    const nextPass=el.dataset.transient==='true'&&el.dataset.pass!==undefined
      ?schedule.filter(p=>p.kind==='change'&&p.beat===undefined)[Number(el.dataset.pass)+1]:null;
    if(next||nextPass)add(el,[{opacity:1},{opacity:0}],(next||nextPass).at,180,'ease-in-out','forwards');
    else if(el.dataset.transient==='true')add(el,[{opacity:1},{opacity:0}],Math.max(0,cursor-250),180,'ease-in-out','forwards');
  }

  // Unused connections remain reference lines: no invented traffic.
  // Missing captions still settle deterministically before Continue is shown.
  for(const el of changes)if(!scheduled.has(el)&&!elements.some(parent=>parent!==el&&scheduled.has(parent)&&parent.contains(el)))reveal(el,Math.max(0,cursor-300),300);
  add(controls,[{opacity:0},{opacity:1}],cursor,600);
  return {animations,duration:cursor+600};
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const sameContent = (a,b) => a && a.textContent === b.textContent && a.innerHTML === b.innerHTML;
const topLevel = elements => elements.filter(el=>!elements.some(other=>other!==el&&other.contains(el)));
const EASE = 'cubic-bezier(.4,0,.2,1)';
const point = el => ({x:Number(el.dataset.anchorX),y:Number(el.dataset.anchorY)});

/** A scale around a point in SVG coordinates, followed by a world-space move.
 * Keeping the actor's base transform prevents a jump at the end of a FLIP. */
export function actorMatrix(base, anchor, delta={x:0,y:0}, scale=1) {
  return `matrix(${base.a*scale},${base.b*scale},${base.c*scale},${base.d*scale},${base.e*scale+anchor.x*(1-scale)+delta.x},${base.f*scale+anchor.y*(1-scale)+delta.y})`;
}

function settledClone(element) {
  const clone=element.cloneNode(true);
  clone.removeAttribute('data-key');
  clone.setAttribute('data-ghost','');
  clone.setAttribute('aria-hidden','true');
  clone.querySelectorAll('[data-key]').forEach(child=>child.removeAttribute('data-key'));
  clone.querySelectorAll('[data-transient="true"]').forEach(child=>{child.style.opacity='0';});
  const sequenced=[...clone.querySelectorAll('[data-sequence]')];
  for(const child of sequenced)if(sequenced.some(other=>other.dataset.motion===child.dataset.motion&&other.dataset.role===child.dataset.role&&Number(other.dataset.sequence)>Number(child.dataset.sequence)))child.style.opacity='0';
  return clone;
}

/** Construct a finite, seekable animation score. Nothing uses a wall-clock timeout. */
export function sceneAnimations({host, previousMarkup, caption, controls, score, entry=false}) {
  const svg = host.querySelector('svg');
  const previous = previousMarkup ? new DOMParser().parseFromString(previousMarkup,'image/svg+xml').documentElement : null;
  const previousByKey = new Map(previous ? [...previous.querySelectorAll('[data-key]')].map(el=>[el.dataset.key,el]) : []);
  const animations = [];
  const scheduled = new Set();
  const elements = [...svg.querySelectorAll('[data-motion]')];
  const changes = elements.filter(el=>el.dataset.motion==='change');
  const flows = elements.filter(el=>el.dataset.motion==='flow');
  const ghosts = new Map();
  const actors=[...svg.querySelectorAll('[data-layout="actor"]')];
  const oldActors=new Map(previous?[...previous.querySelectorAll('[data-layout="actor"]')].map(el=>[el.dataset.key,el]):[]);
  const focal=actors.find(el=>el.dataset.focus==='true')||actors.find(el=>el.dataset.key===svg.dataset.focal)||actors[0];
  const oldFocal=oldActors.get(previous?.dataset.focal)||[...oldActors.values()].find(el=>el.dataset.focus==='true');
  const view=svg.viewBox.baseVal;
  const center={x:view.x+view.width/2,y:view.y+view.height*.43};
  const focus=focal?point(focal):center;
  const entering=actors.filter(el=>!oldActors.has(el.dataset.key));
  const leaving=[...oldActors.values()].filter(el=>!actors.some(next=>next.dataset.key===el.dataset.key));
  const moving=actors.some(el=>{const old=oldActors.get(el.dataset.key);return old&&(point(old).x!==point(el).x||point(old).y!==point(el).y);});
  const layoutDuration=entry&&actors.length>1?1450:entering.length||moving||leaving.length?1050:400;
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

  // Membership changes move the existing composition, rather than reserving
  // empty slots. New actors grow from the point currently being explained.
  for(const el of actors) {
    const anchor=point(el),old=oldActors.get(el.dataset.key);
    const m=el.transform.baseVal.consolidate()?.matrix||{a:1,b:0,c:0,d:1,e:0,f:0};
    const base={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};
    el.style.transformOrigin='0 0';el.style.transformBox='view-box';
    const final=actorMatrix(base,anchor);
    if(old) {
      const from=point(old),delta={x:from.x-anchor.x,y:from.y-anchor.y};
      if(delta.x||delta.y)add(el,[{transform:actorMatrix(base,anchor,delta)},{transform:final}],0,900,EASE);
      continue;
    }
    let origin={x:Number(el.dataset.enterX??el.dataset.originX??focus.x),y:Number(el.dataset.enterY??el.dataset.originY??focus.y)};
    if(oldFocal)origin=point(oldFocal);
    if(entry)origin=center;
    const delta={x:origin.x-anchor.x,y:origin.y-anchor.y};
    if(entry&&el===focal) {
      add(el,[
        {offset:0,opacity:0,transform:actorMatrix(base,anchor,delta,.04)},
        {offset:.28,opacity:1,transform:actorMatrix(base,anchor,delta)},
        {offset:.42,opacity:1,transform:actorMatrix(base,anchor,delta)},
        {offset:1,opacity:1,transform:final},
      ],0,layoutDuration,EASE);
    } else {
      const index=entering.filter(actor=>actor!==focal).indexOf(el);
      const delay=entry?440+Math.max(0,index)*Math.min(110,450/Math.max(1,entering.length-1)):100;
      add(el,[
        {offset:0,opacity:0,transform:actorMatrix(base,anchor,delta,.04)},
        {offset:.22,opacity:1,transform:actorMatrix(base,anchor,{x:delta.x*.85,y:delta.y*.85},.4)},
        {offset:1,opacity:1,transform:final},
      ],delay,layoutDuration-delay,EASE);
    }
  }
  for(const old of leaving) {
    const clone=settledClone(old);svg.appendChild(clone);
    const anchor=point(old),m=clone.transform.baseVal.consolidate()?.matrix||{a:1,b:0,c:0,d:1,e:0,f:0};
    clone.style.transformOrigin='0 0';clone.style.transformBox='view-box';
    add(clone,[{opacity:1,transform:actorMatrix(m,anchor)},{opacity:0,transform:actorMatrix(m,anchor,{x:(focus.x-anchor.x)*.3,y:(focus.y-anchor.y)*.3},.25)}],0,650,EASE);
  }

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
    if(!targets.length&&!(phase.kind==='context'&&actors.length))continue;
    const duration=phase.kind==='context'&&actors.length?layoutDuration:phase.duration;
    schedule.push({...phase,duration,targets,at:cursor});
    // Reserve each flow just once, unless explicitly split into separate beats.
    if(phase.kind==='message')targets.forEach(el=>scheduled.add(el));
    cursor+=duration;
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
  // Reference connections move with the composition as well. Connections that
  // carry a new message remain hidden until both endpoints have settled.
  for(const el of [...svg.querySelectorAll('.flow')]) {
    const old=previousByKey.get(el.dataset.key),path=el.querySelector('path');
    if(old&&path&&!covered.has(el)) {
      const before=old.querySelector('path')?.getAttribute('d'),after=path.getAttribute('d');
      if(before&&before!==after)add(path,[{d:`path('${before}')`},{d:`path('${after}')`}],0,900,EASE);
    }
    if(el.dataset.motion==='flow'&&!covered.has(el)&&!old)reveal(el,Math.max(0,layoutDuration-180),180);
  }
  for(const el of elements.filter(el=>el.dataset.motion==='change'&&Number(el.dataset.stage)===0)) {
    if(previousByKey.has(el.dataset.key)&&sameContent(previousByKey.get(el.dataset.key),el))scheduled.add(el);
    else reveal(el,Math.max(100,layoutDuration-350),350);
  }

  for(const phase of schedule) {
    const {at,duration,targets}=phase;
    if(phase.kind==='context') {
      for(const el of targets) {
        if(el.closest('[data-layout="actor"]'))continue;
        if(el.classList.contains('flow')) {
          if(!previousByKey.has(el.dataset.key))reveal(el,Math.max(0,duration-180),180);
          continue;
        }
        if(previousByKey.has(el.dataset.key))continue;
        el.style.transformBox='fill-box';el.style.transformOrigin='center';
        scheduled.add(el);
        add(el,[{opacity:0,transform:'scale(.08)'},{opacity:1,transform:'scale(1)'}],at,duration,EASE);
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
        dot.style.opacity='0';el.appendChild(dot);
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
          // An unchanged value is context, not a fresh event to blink at.
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

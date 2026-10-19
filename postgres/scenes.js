import {chapterById} from './content.js';
import {localize as L} from './i18n.js';

const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={ink:'#111',muted:'#777',blue:'#4682b4',green:'#008000',request:'#d63224',internal:'#275caa',sync:'#275caa',reply:'#008000',wait:'#888'};
const tr=(value,lang)=>typeof value==='object'&&value!==null&&!Array.isArray(value)?L(value,lang):String(value??'');
const list=value=>Array.isArray(value)?value:value==null?[]:[value];
const text=(x,y,value,lang,{size=15,anchor='middle',fill=C.ink,weight=400}={})=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Courier New,Courier,monospace" font-size="${size}" font-weight="${weight}">${E(tr(value,lang))}</text>`;
export function wrap(value,max=28) {
  const out=[];
  for(const row of String(value??'').split('\n')) {
    let line='';
    for(const word of row.split(/\s+/)) {
      if(line&&line.length+word.length+1>max){out.push(line);line='';}
      if(word.length>max){if(line){out.push(line);line='';}for(let i=0;i<word.length;i+=max)out.push(word.slice(i,i+max));}
      else line+=(line?' ':'')+word;
    }
    if(line||!row)out.push(line);
  }
  return out;
}
const rowsOf=actor=>list(actor.rows).map(row=>Array.isArray(row)?row:[row]);
const contentLines=(actor,lang,width)=>list(actor.lines).flatMap(line=>wrap(tr(line,lang),Math.floor((width-28)/8.4)));
const titleLines=(actor,lang,width)=>wrap(tr(actor.title,lang),Math.floor((width-24)/9.1));
function tableRows(actor,w) {
  const rows=rowsOf(actor),cols=actor.columns||[],count=Math.max(1,cols.length,...rows.map(row=>row.length)),cw=(w-24)/count;
  return {cw,count,rows:[...(cols.length?[{cells:cols,header:true,index:-1}]:[]),...rows.map((cells,index)=>({cells,index}))].map(row=>({...row,h:Math.max(29,Math.max(...['ru','en'].flatMap(lang=>row.cells.map(cell=>wrap(tr(cell,lang),Math.max(4,Math.floor((cw-10)/7.8))).length)))*16+10)}))};
}
function treeLayout(actor,w) {
  const raw=list(actor.nodes),nodes=raw.length?raw:[{id:'root',label:actor.kind==='plan'?'Scan':'root'}],edges=list(actor.edges).map(edge=>Array.isArray(edge)?edge:[edge.from,edge.to]);
  const ids=nodes.map((node,i)=>String(node.id??node.key??i)),depth=new Map(ids.map(id=>[id,0]));
  for(let pass=0;pass<nodes.length;pass++)for(const [from,to]of edges)if(depth.has(String(from))&&depth.has(String(to)))depth.set(String(to),Math.min(nodes.length-1,Math.max(depth.get(String(to)),depth.get(String(from))+1)));
  const levels=[...new Set(depth.values())].sort((a,b)=>a-b),maximum=Math.max(...levels.map(level=>ids.filter(id=>depth.get(id)===level).length));
  const nodeW=Math.min(100,(w-30)/maximum-8),maxChars=Math.max(4,Math.floor((nodeW-9)/7.2));
  const lineCount=Math.max(...nodes.flatMap(node=>['ru','en'].map(lang=>wrap(tr(node.label??node.value??node.id??node.key,lang),maxChars).length)));
  return {nodes,edges,ids,depth,levels,nodeW,maxChars,nodeH:Math.max(28,lineCount*15+10)};
}

function dimensions(actor,compact) {
  if(['client','server'].includes(actor.kind)) {
    const n=Math.max(...['ru','en'].map(lang=>list(actor.lines).flatMap(line=>wrap(tr(line,lang),20)).length));
    const titles=Math.max(...['ru','en'].map(lang=>titleLines(actor,lang,190).length));
    return {w:170,h:(actor.kind==='server'?134:114)+n*19+Math.max(0,titles-1)*19,circle:true};
  }
  const w=compact?360:300;
  const title=Math.max(...['ru','en'].map(lang=>titleLines(actor,lang,w).length))*21+19;
  const lines=Math.max(...['ru','en'].map(lang=>contentLines(actor,lang,w).length))*21;
  let body=lines+14;
  if(['table','rows','page','matrix'].includes(actor.kind))body+=Math.max(29,tableRows(actor,w).rows.reduce((sum,row)=>sum+row.h,0))+(actor.kind==='page'?25:0)+8;
  if(['tree','plan'].includes(actor.kind)){const t=treeLayout(actor,w);body+=t.levels.length*(t.nodeH+29)+12;}
  if(['wal','timeline','queue','buckets','bitmap'].includes(actor.kind))body+=Math.max(1,list(actor.items).length)*29;
  if(actor.kind==='space')body+=190;
  if(actor.kind==='ring')body+=170;
  return {w,h:Math.max(100,title+body),circle:false};
}

/** Pack only present actors. Stable keys let the shared Redis motion preserve identity. */
export function layoutScene(diagram,compact=false) {
  const width=compact?420:1100,gapX=compact?34:105,gapY=compact?88:100;
  const actors=diagram.actors.map(actor=>({...actor,...dimensions(actor,compact)}));
  const rows=[];let row=[],used=0;
  for(const actor of actors) {
    if(row.length&&used+gapX+actor.w>width-32){rows.push(row);row=[];used=0;}
    used+=(row.length?gapX:0)+actor.w;row.push(actor);
  }
  if(row.length)rows.push(row);
  let y=30;
  for(const members of rows) {
    const h=Math.max(...members.map(actor=>actor.h));
    const occupied=members.reduce((sum,actor)=>sum+actor.w,0)+gapX*(members.length-1);
    let x=(width-occupied)/2;
    for(const actor of members){actor.x=x+actor.w/2;actor.y=y+h/2;x+=actor.w+gapX;}
    y+=h+gapY;
  }
  const height=Math.max(compact?280:300,y-gapY+35);
  return {width,height,actors,focal:diagram.focus||actors.at(-1)?.key};
}

function tableBody(actor,lang,w,y) {
  const {rows,count,cw}=tableRows(actor,w);
  let out='';
  if(actor.kind==='page'){out+=`<rect x="${-w/2+12}" y="${y}" width="${w-24}" height="20" fill="#edf3f8" stroke="#111"/>${text(0,y+14,'page header · 8 KiB',lang,{size:12})}`;y+=25;}
  const drawRow=({cells:row,index,header=false,h})=>{
    const selected=list(actor.highlight??actor.selected).includes(index);
    let content=`<rect x="${-w/2+12}" y="${y}" width="${w-24}" height="${h}" fill="${header?'#edf3f8':selected?'#e6f1e5':'white'}" stroke="#777" stroke-width=".8"/>`;
    for(let i=0;i<count;i++){
      if(i)content+=`<path d="M${-w/2+12+i*cw} ${y}v${h}" stroke="#bbb"/>`;
      const lines=wrap(tr(row[i]??'',lang),Math.max(4,Math.floor((cw-10)/7.8)));
      lines.forEach((line,j)=>{content+=text(-w/2+12+cw*(i+.5),y+18+j*16,line,lang,{size:13,weight:header?600:400});});
    }
    y+=h;return content;
  };
  rows.forEach(row=>out+=drawRow(row));
  if(!rows.length)out+=text(0,y+19,'∅',lang,{fill:C.muted});
  return {markup:out,y:y+12};
}

function treeBody(actor,lang,w,y) {
  const {nodes,edges,ids,depth,levels,nodeW,nodeH,maxChars}=treeLayout(actor,w),positions=new Map();
  for(const level of levels){const here=ids.filter(id=>depth.get(id)===level);here.forEach((id,i)=>positions.set(id,{x:(i-(here.length-1)/2)*(nodeW+8),y:y+levels.indexOf(level)*(nodeH+29)+nodeH/2}));}
  let out='';
  for(const [from,to] of edges){const a=positions.get(String(from)),b=positions.get(String(to));if(a&&b)out+=`<path d="M${a.x} ${a.y+nodeH/2}L${b.x} ${b.y-nodeH/2}" fill="none" stroke="#777"/>`;}
  nodes.forEach((node,i)=>{const p=positions.get(ids[i]),lines=wrap(tr(node.label??node.value??node.id??node.key,lang),maxChars);const selected=node.active||list(actor.highlight).includes(ids[i]);out+=`<rect x="${p.x-nodeW/2}" y="${p.y-nodeH/2}" width="${nodeW}" height="${nodeH}" fill="${selected?'#dbeaf5':'white'}" stroke="#111"/>`;lines.forEach((line,j)=>out+=text(p.x,p.y-(lines.length-1)*7.5+4+j*15,line,lang,{size:12}));});
  return {markup:out,y:y+levels.length*(nodeH+29)+12};
}

function specialBody(actor,lang,w,y) {
  if(actor.kind==='space'){
    const x=-w/2+20,bw=w-40,bh=166;
    let out=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="white" stroke="#aaa"/>`;
    for(const region of list(actor.regions)){const rx=x+Number(region.x||0)*bw/100,ry=y+Number(region.y||0)*bh/100;out+=`<rect x="${rx}" y="${ry}" width="${Number(region.w??region.width??50)*bw/100}" height="${Number(region.h??region.height??50)*bh/100}" fill="#4682b4" fill-opacity=".08" stroke="#4682b4"/>${text(rx+6,ry+15,region.label||'',lang,{size:11,anchor:'start'})}`;}
    for(const point of list(actor.points)){const px=x+Number(point.x||0)*bw/100,py=y+Number(point.y||0)*bh/100;out+=`<circle cx="${px}" cy="${py}" r="4" fill="#008000"/>${text(px+7,py-6,point.label||'',lang,{size:11,anchor:'start'})}`;}
    return {markup:out,y:y+190};
  }
  if(actor.kind==='ring'){
    let out=`<circle cx="0" cy="${y+76}" r="61" fill="none" stroke="#4682b4" stroke-width="16"/>`;
    list(actor.items?.length?actor.items:['0','2³¹','2³²']).forEach((item,i,items)=>{const angle=-Math.PI/2+i*2*Math.PI/items.length;out+=text(Math.cos(angle)*83,y+80+Math.sin(angle)*69,item,lang,{size:12});});
    out+=text(0,y+80,actor.value||'XID',lang,{size:16});return {markup:out,y:y+173};
  }
  const items=list(actor.items);
  if(['wal','timeline','queue','buckets','bitmap'].includes(actor.kind)){
    let out='';
    items.forEach((item,i)=>{const selected=list(actor.highlight??actor.selected).includes(i);out+=`<rect x="${-w/2+14}" y="${y}" width="${w-28}" height="26" fill="${selected?'#dbeaf5':'white'}" stroke="#777"/>${text(-w/2+23,y+18,item,lang,{size:13,anchor:'start'})}`;y+=29;});
    return {markup:out,y:y+10};
  }
  return {markup:'',y};
}

function actorBody(actor,lang) {
  const {w,h}=actor;let out='';
  if(actor.circle){
    const radius=actor.kind==='server'?40:30,cy=-h/2+radius+7;
    out+=`<circle cx="0" cy="${cy}" r="${radius}" fill="${actor.failed?'#999':actor.kind==='server'?C.blue:C.green}" stroke="black" stroke-width="2"/>${text(0,cy+6,actor.symbol||(actor.kind==='server'?'P':'A'),lang,{fill:'white',size:20})}`;
    if(actor.failed)out+=`<path d="M-23 ${cy-23}L23 ${cy+23}M23 ${cy-23}L-23 ${cy+23}" stroke="black" stroke-width="2"/>`;
    let y=cy+radius+23;
    for(const line of titleLines(actor,lang,190)){out+=text(0,y,line,lang,{size:14});y+=19;}
    const lines=list(actor.lines).flatMap(line=>wrap(tr(line,lang),20));
    out+=`<g data-key="${E(actor.key)}:value" data-motion="change" data-stage="${actor.kind==='client'?0:2}">${lines.map((line,i)=>text(0,y+i*19,line,lang,{size:13})).join('')}</g>`;
    return out;
  }
  out+=`<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="white" stroke="black" stroke-width="1.3"/>`;
  let y=-h/2+25;
  for(const line of titleLines(actor,lang,w)){out+=text(0,y,line,lang,{size:15,weight:500});y+=21;}
  out+=`<path d="M${-w/2} ${y-9}H${w/2}" stroke="#ddd"/>`;
  let body='';y+=7;
  for(const line of contentLines(actor,lang,w)){body+=text(-w/2+14,y+14,line,lang,{size:14,anchor:'start'});y+=21;}
  if(['table','rows','page','matrix'].includes(actor.kind)){const result=tableBody(actor,lang,w,y);body+=result.markup;y=result.y;}
  else if(['tree','plan'].includes(actor.kind)){const result=treeBody(actor,lang,w,y);body+=result.markup;y=result.y;}
  else{const result=specialBody(actor,lang,w,y);body+=result.markup;y=result.y;}
  out+=`<g data-key="${E(actor.key)}:value" data-motion="change" data-stage="${actor.stage??2}">${body}</g>`;
  return out;
}

function boundary(actor,toward) {
  if(actor.circle){const r=actor.kind==='server'?40:30,center={x:actor.x,y:actor.y-actor.h/2+r+7},dx=toward.x-center.x,dy=toward.y-center.y,len=Math.hypot(dx,dy)||1;return{x:center.x+dx/len*(r+3),y:center.y+dy/len*(r+3)};}
  const dx=toward.x-actor.x,dy=toward.y-actor.y,k=Math.min((actor.w/2+3)/(Math.abs(dx)||.0001),(actor.h/2+3)/(Math.abs(dy)||.0001));
  return{x:actor.x+dx*k,y:actor.y+dy*k};
}

function flowMarkup(flow,index,actors,lang,compact) {
  const from=actors.find(actor=>actor.key===flow.from),to=actors.find(actor=>actor.key===flow.to);
  if(!from||!to)throw new Error(`Missing flow actor: ${flow.from} → ${flow.to}`);
  const role=flow.role||'request',color=C[role]||C.internal;
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
  const bend=role==='reply'?-25:18;
  const mid={x:(from.x+to.x)/2-dy/length*bend,y:(from.y+to.y)/2+dx/length*bend};
  const start=boundary(from,mid),end=boundary(to,mid);
  const d=`M${start.x} ${start.y}Q${mid.x} ${mid.y} ${end.x} ${end.y}`;
  const vertical=Math.abs(dy)>Math.abs(dx),label=tr(flow.label,lang),lines=wrap(label,vertical?18:12);
  // Center a label in the actual edge-to-edge flight, not between actor
  // centers: a wide table would otherwise pull it across its own border.
  const labelMid={x:(start.x+2*mid.x+end.x)/4,y:(start.y+2*mid.y+end.y)/4};
  let x=labelMid.x,y=labelMid.y-12-(lines.length-1)*8,anchor='middle';
  if(vertical){x=Math.min(compact?258:labelMid.x+18,labelMid.x+18);anchor='start';y=labelMid.y-(lines.length-1)*8;}
  const labels=lines.filter(Boolean).map((line,i)=>`<text x="${x}" y="${y+i*16}" text-anchor="${anchor}" fill="${color}" stroke="white" stroke-width="5" paint-order="stroke" font-family="Courier New,Courier,monospace" font-size="12">${E(line)}</text>`).join('');
  return `<g class="flow" data-key="flow:${E(flow.from)}:${E(flow.to)}:${index}" data-from="${E(flow.from)}" data-to="${E(flow.to)}" data-role="${E(role)}" data-motion="${role==='wait'?'context':'flow'}" data-stage="${role==='reply'?3:1}" data-sequence="${index}"><path d="${d}" stroke="${color}" stroke-width="1.5" fill="none"${role==='wait'?' stroke-dasharray="4 4"':''} marker-end="url(#arrow-${role})"/>${labels}</g>`;
}

export function storyScene(id,index,lang='ru',compact=false) {
  const chapter=chapterById.get(id),step=chapter?.steps[index];
  if(!step)throw new RangeError(`Unknown scene ${id}:${index}`);
  const layout=layoutScene(step.diagram,compact),keys=new Set();
  for(const actor of layout.actors){if(keys.has(actor.key))throw new Error(`Duplicate actor ${actor.key}`);keys.add(actor.key);}
  const defs=Object.entries(C).filter(([role])=>['request','internal','sync','reply','wait'].includes(role)).map(([role,color])=>`<marker id="arrow-${role}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${color}"/></marker>`).join('');
  const actors=layout.actors.map(actor=>`<g data-key="actor:${E(actor.key)}" data-actor="${E(actor.key)}" data-layout="actor" data-anchor-x="${actor.x}" data-anchor-y="${actor.y}" data-enter-x="${layout.width/2}" data-enter-y="${layout.height/2}"${layout.focal===actor.key?' data-focus="true"':''} transform="translate(${actor.x} ${actor.y})">${actorBody(actor,lang)}</g>`).join('');
  const flows=(step.diagram.flows||[]).map((flow,i)=>flowMarkup(flow,i,layout.actors,lang,compact)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="scene-title scene-description" data-focal="actor:${E(layout.focal)}"><title id="scene-title">${E(tr(chapter.title,lang))}</title><desc id="scene-description">${E(tr(step.body,lang))}</desc><defs>${defs}</defs>${actors}${flows}</svg>`;
}

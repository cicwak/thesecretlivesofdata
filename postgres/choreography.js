import {chapterById} from './content.js';

export function choreography(id,index) {
  const scene=chapterById.get(id)?.steps[index]?.diagram;
  if(!scene)throw new RangeError(`Unknown story stop: ${id}:${index}`);
  const phases=[{kind:'context',stage:0,duration:450,order:'parallel'}];
  const flows=scene.flows||[];
  for(const [i,flow] of flows.entries())if(flow.role!=='reply'&&flow.role!=='wait')
    phases.push({kind:'message',stage:1,role:flow.role||'request',beat:i,duration:700,order:'sequential'});
  phases.push({kind:'change',stage:2,duration:650,order:'parallel'});
  for(const [i,flow] of flows.entries())if(flow.role==='reply')
    phases.push({kind:'message',stage:3,role:'reply',beat:i,duration:750,order:'sequential'});
  if(flows.some(flow=>flow.role==='wait'))phases.push({kind:'hold',stage:2,duration:850,order:'parallel'});
  phases.push({kind:'note',stage:4,duration:200,order:'parallel'});
  return {phases,total:phases.reduce((sum,p)=>sum+p.duration,0)};
}

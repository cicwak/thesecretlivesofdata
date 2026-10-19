/** Chapter cards sit between real story stops; they are not database events. */
export function nextStop(chapters, {chapterIndex, stepIndex, intro=false}) {
  if(intro)return {chapterIndex,stepIndex:0,intro:false};
  if(stepIndex<chapters[chapterIndex].steps.length-1)
    return {chapterIndex,stepIndex:stepIndex+1,intro:false};
  return {chapterIndex:(chapterIndex+1)%chapters.length,stepIndex:0,intro:true};
}

export function previousStop(chapters, {chapterIndex, stepIndex, intro=false}) {
  if(intro) {
    const previous=(chapterIndex-1+chapters.length)%chapters.length;
    return {chapterIndex:previous,stepIndex:chapters[previous].steps.length-1,intro:false};
  }
  if(stepIndex>0)return {chapterIndex,stepIndex:stepIndex-1,intro:false};
  return {chapterIndex,stepIndex:0,intro:chapterIndex>0};
}

export function chapterCardAnimations({title,question,controls}) {
  return [title,question,controls].map((element,index)=>{
    const animation=element.animate([{opacity:0},{opacity:1}],
      {delay:200+index*100,duration:600,easing:'ease-in-out',fill:'both'});
    animation.pause();
    return animation;
  });
}

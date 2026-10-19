// Shared authoring vocabulary. Narration, SQL and geometry stay independent.
export const b = (ru, en) => ({ru, en});
export const a = (key, kind, ru, en, lines = [], extra = {}) => ({key,kind,title:b(ru,en),lines,...extra});
export const f = (from, to, label = '', role = 'request', extra = {}) => ({from,to,label,role,...extra});
export const s = (ru, en, actors, flows = [], command = '', detailRu = ru, detailEn = en, extra = {}) => ({body:b(ru,en),detail:b(detailRu,detailEn),command,diagram:{actors,flows,focus:extra.focus||actors.at(-1)?.key,...extra}});
export const c = ({number,id,group,title,question,next,docs,book,steps,...rest}) => ({number,id,group,title:b(...title),question:b(...question),summary:b(...question),next:b(...next),docs,book,steps,...rest});

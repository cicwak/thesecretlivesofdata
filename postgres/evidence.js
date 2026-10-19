import {chapterById} from './content.js';
import {b} from './authoring.js';
import {implementation} from './audit/source-map.js';

export const POSTGRES_COMMIT='724edf9bde9d356724ad384a2e196edc3c9f80f7';
export const POSTGRES_RELEASE='18.6';
export const BOOK_URL='https://edu.postgrespro.ru/postgresql_internals-18.pdf';
const label=path=>path.replace(/\.html.*$/,'').replaceAll('-',' ');

export function stepEvidence(id,index) {
  const chapter=chapterById.get(id),step=chapter?.steps[index];
  if(!step)throw new RangeError(`Unknown evidence stop: ${id}:${index}`);
  const refs=step.docs||step.diagram?.docs||chapter.docs||[];
  const docs=refs.map(ref=>typeof ref==='string'?{url:ref.startsWith('https://')?ref:`https://www.postgresql.org/docs/18/${ref}`,label:b(label(ref),label(ref))}:ref);
  const pages=step.book||step.diagram?.book||chapter.book;
  const ranges=pages?.length?(Array.isArray(pages[0])?pages:[pages]):[];
  const book=ranges.map(range=>({url:`${BOOK_URL}#page=${Number(range[0])+1}`,label:b(`Егор Рогов · с. ${range.join('–')}`,`Egor Rogov · pp. ${range.join('–')}`)}));
  const code=(step.code||chapter.code||implementation[id]||[]).map(ref=>typeof ref==='string'?{url:`https://github.com/postgres/postgres/blob/${POSTGRES_COMMIT}/${ref}`,label:b(ref,ref)}:ref.path?{url:`https://github.com/postgres/postgres/blob/${POSTGRES_COMMIT}/${ref.path}#L${ref.start}-L${ref.end}`,label:b(`${ref.label} · ${ref.path}`,`${ref.label} · ${ref.path}`)}:ref);
  return {docs,book,code};
}

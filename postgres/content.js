import {chapters as first} from './chapters/01-24.js';
import {chapters as middle} from './chapters/25-50.js';
import {chapters as last} from './chapters/51-70.js';

export const chapters = [...first,...middle,...last].sort((a,b)=>a.number-b.number);
export const chapterById = new Map(chapters.map(chapter=>[chapter.id,chapter]));

import storage from './audit/01-05.js';
import concurrency from './audit/06-13.js';
import distributed from './audit/14-18.js';
import messaging from './audit/19-21.js';

export const REDIS_VERSION='8.0.0';
export const REDIS_COMMIT='e91a340e241cf0abe3c6a0c254214fbe4aa1d95f';
export const AUDITED_AT='2026-10-18';
export const SOURCE_COMMITS=Object.freeze({
  'redis/redis':REDIS_COMMIT,
  'redisjson/redisjson':'11834e8cbe817c6ba602bfda00cba8907ae1e5e9',
  'redisearch/redisearch':'61787b7a36eb629877aa24bcb6174af2af46c25f',
  'redistimeseries/redistimeseries':'de1ad5089c15c42355806bbf51a0d0cf36f223f6',
  'redisbloom/redisbloom':'971d9f40e0eace536cc26d83be12ab7adf5c4e01',
});
export const evidence=Object.freeze({...storage,...concurrency,...distributed,...messaging});
export const stepEvidence=(chapter,index)=>evidence[chapter]?.[index];

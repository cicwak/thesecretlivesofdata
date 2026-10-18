const core=(path,line,label)=>({label,url:`https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/${path}#L${line}`});
const moduleSource=(repo,sha,path,line,label)=>({label,url:`https://github.com/${repo}/blob/${sha}/${path}#L${line}`});
const doc=(path,label)=>({label,url:`https://redis.io/docs/latest/${path}/`});
const pubsub=doc('develop/pubsub','Pub/Sub semantics');
const entry=(docs,code)=>({docs,code});
export default {
  pubsub:[
    entry([pubsub,doc('commands/subscribe','SUBSCRIBE')],[core('src/pubsub.c',239,'pubsubSubscribeChannel')]),
    entry([pubsub,doc('commands/publish','PUBLISH')],[core('src/pubsub.c',454,'pubsubPublishMessageInternal'),core('src/pubsub.c',599,'publishCommand')]),
    entry([pubsub],[core('src/pubsub.c',87,'addReplyPubsubMessage'),core('src/pubsub.c',454,'Current subscriber iteration')]),
    entry([pubsub],[core('src/pubsub.c',276,'pubsubUnsubscribeChannel'),core('src/pubsub.c',454,'No subscriber history')]),
    entry([pubsub],[core('src/pubsub.c',239,'Subscribe to future publications'),core('src/pubsub.c',454,'Per-subscription delivery')]),
    entry([pubsub,doc('commands/spublish','SPUBLISH')],[core('src/pubsub.c',699,'spublishCommand'),core('src/pubsub.c',584,'Sharded cluster propagation')]),
  ],
  streams:[
    entry([doc('commands/xadd','XADD')],[core('src/t_stream.c',121,'streamNextID'),core('src/t_stream.c',410,'streamAppendItem')]),
    entry([doc('commands/xread','XREAD')],[core('src/t_stream.c',2178,'xreadCommand'),core('src/t_stream.c',1670,'streamReplyWithRange')]),
    entry([doc('commands/xreadgroup','XREADGROUP'),doc('commands/xgroup-create','XGROUP CREATE')],[core('src/t_stream.c',2178,'XREADGROUP parsing and dispatch'),core('src/t_stream.c',1751,'Create a pending entry'),core('src/t_stream.c',2512,'Group and consumer PEL trees')]),
    entry([doc('commands/xack','XACK')],[core('src/t_stream.c',2853,'xackCommand removes PEL state')]),
    entry([doc('commands/xautoclaim','XAUTOCLAIM')],[core('src/t_stream.c',3374,'xautoclaimCommand'),core('src/t_stream.c',3458,'Idle check, ownership, delivery count')]),
    entry([doc('commands/xtrim','XTRIM'),doc('commands/xpending','XPENDING')],[core('src/stream.h',10,'Stream, group, consumer and NACK structures'),core('src/t_stream.c',48,'streamNew radix tree'),core('src/t_stream.c',484,'Listpack node capacity and layout')]),
  ],
  specialized:[
    entry([doc('develop/data-types/json','JSON'),doc('commands/json.numincrby','JSON.NUMINCRBY')],[moduleSource('redisjson/redisjson','11834e8cbe817c6ba602bfda00cba8907ae1e5e9','redis_json/src/commands.rs',160,'json_set'),moduleSource('redisjson/redisjson','11834e8cbe817c6ba602bfda00cba8907ae1e5e9','redis_json/src/ivalue_manager.rs',36,'follow_path and typed IValue updates')]),
    entry([doc('develop/ai/search-and-query','Search and query'),doc('commands/ft.create','FT.CREATE')],[moduleSource('redisearch/redisearch','61787b7a36eb629877aa24bcb6174af2af46c25f','src/inverted_index.c',440,'InvertedIndex_WriteEntryGeneric'),moduleSource('redisearch/redisearch','61787b7a36eb629877aa24bcb6174af2af46c25f','src/spec.c',3059,'Hash and JSON indexing')]),
    entry([doc('develop/ai/search-and-query/vectors','Vector search concepts')],[moduleSource('redisearch/redisearch','61787b7a36eb629877aa24bcb6174af2af46c25f','src/vector_index.c',240,'FLAT/BF and HNSW index parameters'),core('modules/redisearch/Makefile',1,'Search version shipped by Redis 8.0.0')]),
    entry([doc('commands/ts.create','TS.CREATE retention and chunks'),doc('commands/ts.createrule','TS.CREATERULE')],[moduleSource('redistimeseries/redistimeseries','de1ad5089c15c42355806bbf51a0d0cf36f223f6','src/tsdb.c',198,'SeriesTrim retention relative to lastTimestamp'),moduleSource('redistimeseries/redistimeseries','de1ad5089c15c42355806bbf51a0d0cf36f223f6','src/compressed_chunk.c',27,'Compressed_NewChunk')]),
    entry([doc('commands/setbit','SETBIT'),doc('commands/geosearch','GEOSEARCH')],[core('src/bitops.c',550,'setbitCommand'),core('src/geo.c',445,'geoaddCommand'),core('src/geohash_helper.c',229,'Spherical geohashGetDistance')]),
    entry([doc('develop/data-types/probabilistic/hyperloglogs','HyperLogLog'),doc('develop/data-types/probabilistic/bloom-filter','Bloom filter')],[core('src/hyperloglog.c',180,'HLL registers and encodings'),core('src/hyperloglog.c',1460,'pfcountCommand'),moduleSource('redisbloom/redisbloom','971d9f40e0eace536cc26d83be12ab7adf5c4e01','src/sb.c',76,'SBChain_Add / SBChain_Check')]),
  ],
};

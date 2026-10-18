// Per-step evidence, audited against Redis 8.0.0 on 2026-10-18.
export default {
  "first-key": [
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        },
        {
          "label": "Keyspace",
          "url": "https://redis.io/docs/latest/develop/using-commands/keyspace/"
        }
      ],
      "code": [
        {
          "label": "setCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L276-L287"
        },
        {
          "label": "setGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64-L106"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "lookupKeyWriteWithDictEntry → setKeyWithDictEntry · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L78-L95"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "setKeyWithDictEntry · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L404-L436"
        },
        {
          "label": "dbAddInternal/dbAdd · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L253-L283"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "setGenericCommand: write, then addReply · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L93-L110"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "GET",
          "url": "https://redis.io/docs/latest/commands/get/"
        }
      ],
      "code": [
        {
          "label": "getGenericCommand/getCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L304-L321"
        },
        {
          "label": "lookupKey · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L142-L184"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        },
        {
          "label": "GET",
          "url": "https://redis.io/docs/latest/commands/get/"
        },
        {
          "label": "DEL",
          "url": "https://redis.io/docs/latest/commands/del/"
        }
      ],
      "code": [
        {
          "label": "setKeyWithDictEntry · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L410-L436"
        },
        {
          "label": "delGenericCommand/delCommand · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L940-L966"
        }
      ]
    }
  ],
  "request": [
    {
      "docs": [
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        }
      ],
      "code": [
        {
          "label": "createClient · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L120-L207"
        },
        {
          "label": "readQueryFromClient reusable query buffer · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2919-L2945"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RESP",
          "url": "https://redis.io/docs/latest/develop/reference/protocol-spec/"
        }
      ],
      "code": [
        {
          "label": "processMultibulkBuffer · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2440-L2556"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RESP",
          "url": "https://redis.io/docs/latest/develop/reference/protocol-spec/"
        }
      ],
      "code": [
        {
          "label": "processMultibulkBuffer incomplete bulk → C_ERR · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2557-L2601"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RESP",
          "url": "https://redis.io/docs/latest/develop/reference/protocol-spec/"
        }
      ],
      "code": [
        {
          "label": "processMultibulkBuffer argv completion · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2570-L2601"
        },
        {
          "label": "processInputBuffer loop · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2777-L2848"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "ACL",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/"
        },
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "processCommand existence/arity/ACL · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L4010-L4099"
        },
        {
          "label": "GET handler checkType · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L304-L314"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        },
        {
          "label": "RESP",
          "url": "https://redis.io/docs/latest/develop/reference/protocol-spec/"
        }
      ],
      "code": [
        {
          "label": "addReply · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L438-L454"
        },
        {
          "label": "writeToClient · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2097-L2144"
        },
        {
          "label": "handleClientsWithPendingWrites fast write · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2191-L2238"
        }
      ]
    }
  ],
  "event-loop": [
    {
      "docs": [
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        },
        {
          "label": "Latency",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/"
        }
      ],
      "code": [
        {
          "label": "aeProcessEvents · src/ae.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/ae.c#L393-L435"
        },
        {
          "label": "aeMain · src/ae.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/ae.c#L492-L500"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        }
      ],
      "code": [
        {
          "label": "aeProcessEvents fired events · src/ae.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/ae.c#L396-L449"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Latency",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/"
        }
      ],
      "code": [
        {
          "label": "processInputBuffer sends execution to main thread · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2830-L2847"
        },
        {
          "label": "processCommand guards · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L3979-L3986"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        },
        {
          "label": "GET",
          "url": "https://redis.io/docs/latest/commands/get/"
        }
      ],
      "code": [
        {
          "label": "getGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L304-L321"
        },
        {
          "label": "event dispatch order · src/ae.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/ae.c#L409-L449"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Redis8 GA",
          "url": "https://redis.io/blog/redis-8-ga/"
        }
      ],
      "code": [
        {
          "label": "I/O parser enqueues to main · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2830-L2839"
        },
        {
          "label": "IOThreadMain/initThreadedIO · src/iothread.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/iothread.c#L540-L600"
        },
        {
          "label": "io-threads default1 · src/config.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/config.c#L3170"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Programmability",
          "url": "https://redis.io/docs/latest/develop/programmability/"
        },
        {
          "label": "Latency",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/"
        }
      ],
      "code": [
        {
          "label": "scriptInterrupt · src/script.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L120-L149"
        },
        {
          "label": "processCommand BUSY · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L4285-L4299"
        },
        {
          "label": "busy-reply-threshold default5000 · src/config.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/config.c#L3223"
        }
      ]
    }
  ],
  "dictionary": [
    {
      "docs": [
        {
          "label": "Keyspace",
          "url": "https://redis.io/docs/latest/develop/using-commands/keyspace/"
        }
      ],
      "code": [
        {
          "label": "dictSdsHash · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L373-L375"
        },
        {
          "label": "dictGenHashFunction → siphash · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L94-L112"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Keyspace",
          "url": "https://redis.io/docs/latest/develop/using-commands/keyspace/"
        }
      ],
      "code": [
        {
          "label": "dictFindByHash bucket mask · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L770-L790"
        },
        {
          "label": "standalone kvstore1dict / Cluster per-slot dicts · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L2757-L2766"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Keyspace",
          "url": "https://redis.io/docs/latest/develop/using-commands/keyspace/"
        }
      ],
      "code": [
        {
          "label": "rehashEntriesInBucketAtIndex chained entries · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L326-L369"
        },
        {
          "label": "dictFindByHash follows next · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L793-L806"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "GET",
          "url": "https://redis.io/docs/latest/commands/get/"
        }
      ],
      "code": [
        {
          "label": "dictFindByHash equality and chain · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L793-L808"
        },
        {
          "label": "dictSdsKeyCompareWithLen/dictSdsKeyCompare · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L298-L315"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Memory optimization",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/"
        }
      ],
      "code": [
        {
          "label": "_dictResize/dictExpand · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L228-L299"
        },
        {
          "label": "new-size bucket calculation · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L326-L341"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Memory optimization",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/"
        }
      ],
      "code": [
        {
          "label": "dictRehash moves whole bucket · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L383-L423"
        },
        {
          "label": "dictFindByHash skip migrated buckets / early return · src/dict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/dict.c#L787-L809"
        },
        {
          "label": "databasesCron incremental rehash · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L1185-L1198"
        }
      ]
    }
  ],
  "encodings": [
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        }
      ],
      "code": [
        {
          "label": "createRawStringObject/createEmbeddedStringObject/createStringObject · src/object.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/object.c#L65-L107"
        },
        {
          "label": "tryObjectEncodingEx · src/object.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/object.c#L613-L680"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        },
        {
          "label": "LINDEX",
          "url": "https://redis.io/docs/latest/commands/lindex/"
        }
      ],
      "code": [
        {
          "label": "listTypeTryConvertListpack/listTypeTryConvertQuicklist · src/t_list.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_list.c#L17-L124"
        },
        {
          "label": "quicklistNodeLimit/isLargeElement · src/quicklist.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/quicklist.c#L472-L516"
        },
        {
          "label": "pushGenericCommand · src/t_list.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_list.c#L465-L499"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        },
        {
          "label": "SADD",
          "url": "https://redis.io/docs/latest/commands/sadd/"
        }
      ],
      "code": [
        {
          "label": "setTypeCreate/setTypeMaybeConvert · src/t_set.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_set.c#L31-L53"
        },
        {
          "label": "setTypeAddAux conversions · src/t_set.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_set.c#L145-L216"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        },
        {
          "label": "HEXPIRE",
          "url": "https://redis.io/docs/latest/commands/hexpire/"
        }
      ],
      "code": [
        {
          "label": "hashTypeSet thresholds · src/t_hash.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_hash.c#L895-L935"
        },
        {
          "label": "hashTypeSetExInit → LISTPACK_EX · src/t_hash.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_hash.c#L1158-L1166"
        },
        {
          "label": "hashTypeConvertListpack adds TTL entries · src/t_hash.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_hash.c#L1571-L1594"
        },
        {
          "label": "strEncoding listpackex · src/object.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/object.c#L942-L955"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        },
        {
          "label": "Sorted Sets",
          "url": "https://redis.io/docs/latest/develop/data-types/sorted-sets/"
        }
      ],
      "code": [
        {
          "label": "zsetConvertAndExpand · src/t_zset.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_zset.c#L1255-L1300"
        },
        {
          "label": "zsetAdd dict and skiplist · src/t_zset.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_zset.c#L1480-L1534"
        },
        {
          "label": "zslInsert tie ordering · src/t_zset.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_zset.c#L121-L145"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "OBJECT ENCODING",
          "url": "https://redis.io/docs/latest/commands/object-encoding/"
        },
        {
          "label": "Memory optimization",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/"
        }
      ],
      "code": [
        {
          "label": "strEncoding · src/object.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/object.c#L942-L955"
        },
        {
          "label": "list-max-listpack-size · src/config.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/config.c#L3173"
        },
        {
          "label": "aggregate encoding defaults · src/config.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/config.c#L3238-L3246"
        }
      ]
    }
  ]
};

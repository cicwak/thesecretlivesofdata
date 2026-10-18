// Sources inspected against Redis 8.0.0, commit e91a340e241cf0abe3c6a0c254214fbe4aa1d95f.
export default {
  "atomicity": [
    {
      "docs": [
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        },
        {
          "label": "INCR",
          "url": "https://redis.io/docs/latest/commands/incr/"
        }
      ],
      "code": [
        {
          "label": "setGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "INCR",
          "url": "https://redis.io/docs/latest/commands/incr/"
        },
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "getGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L304"
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
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "setGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64"
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
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "setGenericCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "INCR",
          "url": "https://redis.io/docs/latest/commands/incr/"
        }
      ],
      "code": [
        {
          "label": "incrDecrCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L586"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "INCR",
          "url": "https://redis.io/docs/latest/commands/incr/"
        },
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "incrDecrCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L586"
        }
      ]
    }
  ],
  "transactions": [
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "multiCommand / queueMultiCommand · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L40"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "execCommand · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L128"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        },
        {
          "label": "WATCH",
          "url": "https://redis.io/docs/latest/commands/watch/"
        }
      ],
      "code": [
        {
          "label": "watchCommand / watchForKey · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L459"
        },
        {
          "label": "touchWatchedKey · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L365"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        },
        {
          "label": "WATCH",
          "url": "https://redis.io/docs/latest/commands/watch/"
        }
      ],
      "code": [
        {
          "label": "touchWatchedKey · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L365"
        },
        {
          "label": "execCommand · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L140"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "execCommand command loop · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L177"
        },
        {
          "label": "incrDecrCommand · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L586"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "CLIENT_DIRTY_EXEC / abort · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L86"
        },
        {
          "label": "execCommand · src/multi.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/multi.c#L150"
        }
      ]
    }
  ],
  "scripting": [
    {
      "docs": [
        {
          "label": "EVAL",
          "url": "https://redis.io/docs/latest/develop/programmability/eval-intro/"
        },
        {
          "label": "INCR",
          "url": "https://redis.io/docs/latest/commands/incr/"
        }
      ],
      "code": [
        {
          "label": "evalGenericCommand / luaCallFunction · src/eval.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/eval.c#L614"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EVAL",
          "url": "https://redis.io/docs/latest/develop/programmability/eval-intro/"
        }
      ],
      "code": [
        {
          "label": "luaCallFunction · src/script_lua.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script_lua.c#L1605"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EVAL",
          "url": "https://redis.io/docs/latest/develop/programmability/eval-intro/"
        },
        {
          "label": "Lua API",
          "url": "https://redis.io/docs/latest/develop/programmability/lua-api/"
        }
      ],
      "code": [
        {
          "label": "luaCallFunction error handling · src/script_lua.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script_lua.c#L1605"
        },
        {
          "label": "scriptCall · src/script.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L610"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EVAL",
          "url": "https://redis.io/docs/latest/develop/programmability/eval-intro/"
        },
        {
          "label": "SCRIPT LOAD",
          "url": "https://redis.io/docs/latest/commands/script-load/"
        }
      ],
      "code": [
        {
          "label": "SCRIPT LOAD returns SHA1 · src/eval.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/eval.c#L709"
        },
        {
          "label": "evalShaCommand · src/eval.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/eval.c#L641"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Functions",
          "url": "https://redis.io/docs/latest/develop/programmability/functions-intro/"
        }
      ],
      "code": [
        {
          "label": "fcallCommandGeneric · src/functions.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/functions.c#L614"
        },
        {
          "label": "rdbSaveFunctions · src/rdb.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1350"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Programmability: execution limits",
          "url": "https://redis.io/docs/latest/develop/programmability/"
        },
        {
          "label": "SCRIPT KILL",
          "url": "https://redis.io/docs/latest/commands/script-kill/"
        }
      ],
      "code": [
        {
          "label": "scriptInterrupt · src/script.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L120"
        },
        {
          "label": "scriptKill · src/script.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L337"
        },
        {
          "label": "busy-reply-threshold alias · src/config.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/config.c#L3223"
        }
      ]
    }
  ],
  "blocking": [
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "blockingPopGenericCommand · src/t_list.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_list.c#L1205"
        },
        {
          "label": "blockForKeys · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L361"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "blockForKeys · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L361"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "pushGenericCommand · src/t_list.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_list.c#L466"
        },
        {
          "label": "handleClientsBlockedOnKey · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L552"
        },
        {
          "label": "unblockClientOnKey · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L633"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "replyToBlockedClientTimedOut · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L212"
        },
        {
          "label": "unblockClientOnTimeout · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L702"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "FIFO waiters · src/blocked.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/blocked.c#L552"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BLPOP",
          "url": "https://redis.io/docs/latest/commands/blpop/"
        }
      ],
      "code": [
        {
          "label": "blockingPopGenericCommand removes item · src/t_list.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_list.c#L1243"
        }
      ]
    }
  ],
  "locks": [
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        },
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "setGenericCommand NX/PX · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        },
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        }
      ],
      "code": [
        {
          "label": "SET NX precondition · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L80"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        },
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "keyIsExpiredInternal · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2217"
        },
        {
          "label": "SET NX precondition · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L80"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        }
      ],
      "code": [
        {
          "label": "Expiration only changes Redis keyspace · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2169"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        }
      ],
      "code": [
        {
          "label": "Lua atomic execution · src/script_lua.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script_lua.c#L1605"
        },
        {
          "label": "delGenericCommand · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L941"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Distributed locks",
          "url": "https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/"
        }
      ],
      "code": [
        {
          "label": "SET does not generate fencing numbers · src/t_string.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/t_string.c#L64"
        }
      ]
    }
  ],
  "expiry": [
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "setExpireWithDictEntry · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2069"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "keyIsExpiredInternal · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2217"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "expireIfNeededWithSlot · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2272"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "activeExpireCycle · src/expire.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/expire.c#L187"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        },
        {
          "label": "SET",
          "url": "https://redis.io/docs/latest/commands/set/"
        },
        {
          "label": "TTL",
          "url": "https://redis.io/docs/latest/commands/ttl/"
        }
      ],
      "code": [
        {
          "label": "setKeyWithDictEntry clears TTL · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L410"
        },
        {
          "label": "ttlGenericCommand · src/expire.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/expire.c#L764"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "EXPIRE",
          "url": "https://redis.io/docs/latest/commands/expire/"
        }
      ],
      "code": [
        {
          "label": "propagateDeletion DEL/UNLINK · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2197"
        },
        {
          "label": "replica expiry handling · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L2272"
        }
      ]
    }
  ],
  "memory": [
    {
      "docs": [
        {
          "label": "Key eviction",
          "url": "https://redis.io/docs/latest/develop/reference/eviction/"
        }
      ],
      "code": [
        {
          "label": "getMaxmemoryState · src/evict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/evict.c#L380"
        },
        {
          "label": "performEvictions before command · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L4161"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Key eviction",
          "url": "https://redis.io/docs/latest/develop/reference/eviction/"
        }
      ],
      "code": [
        {
          "label": "evictionPoolPopulate · src/evict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/evict.c#L126"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Key eviction",
          "url": "https://redis.io/docs/latest/develop/reference/eviction/"
        }
      ],
      "code": [
        {
          "label": "LFULogIncr / LFUDecrAndReturn · src/evict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/evict.c#L282"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Key eviction",
          "url": "https://redis.io/docs/latest/develop/reference/eviction/"
        }
      ],
      "code": [
        {
          "label": "performEvictions · src/evict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/evict.c#L521"
        },
        {
          "label": "is_denyoom_command · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L4067"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "MEMORY USAGE",
          "url": "https://redis.io/docs/latest/commands/memory-usage/"
        },
        {
          "label": "Key eviction",
          "url": "https://redis.io/docs/latest/develop/reference/eviction/"
        }
      ],
      "code": [
        {
          "label": "freeMemoryGetNotCountedMemory · src/evict.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/evict.c#L319"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "UNLINK",
          "url": "https://redis.io/docs/latest/commands/unlink/"
        }
      ],
      "code": [
        {
          "label": "delGenericCommand / unlinkCommand · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L941"
        },
        {
          "label": "lazyfreeGetFreeEffort · src/lazyfree.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/lazyfree.c#L129"
        },
        {
          "label": "freeObjAsync threshold · src/lazyfree.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/lazyfree.c#L181"
        },
        {
          "label": "lazyfree-lazy-user-del default · redis.conf",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/redis.conf#L1293"
        }
      ]
    }
  ],
  "latency": [
    {
      "docs": [
        {
          "label": "Pipelining",
          "url": "https://redis.io/docs/latest/develop/using-commands/pipelining/"
        }
      ],
      "code": [
        {
          "label": "writeToClient · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2097"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Pipelining",
          "url": "https://redis.io/docs/latest/develop/using-commands/pipelining/"
        },
        {
          "label": "Transactions",
          "url": "https://redis.io/docs/latest/develop/using-commands/transactions/"
        }
      ],
      "code": [
        {
          "label": "processInputBuffer · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2776"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "KEYS",
          "url": "https://redis.io/docs/latest/commands/keys/"
        }
      ],
      "code": [
        {
          "label": "keysCommand · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L1014"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SCAN",
          "url": "https://redis.io/docs/latest/commands/scan/"
        }
      ],
      "code": [
        {
          "label": "scanGenericCommand · src/db.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/db.c#L1199"
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
          "label": "SLOWLOG",
          "url": "https://redis.io/docs/latest/commands/slowlog/"
        }
      ],
      "code": [
        {
          "label": "writeToClient · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L2097"
        },
        {
          "label": "addReply · src/networking.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/networking.c#L438"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "SLOWLOG",
          "url": "https://redis.io/docs/latest/commands/slowlog/"
        },
        {
          "label": "Client handling",
          "url": "https://redis.io/docs/latest/develop/reference/clients/"
        }
      ],
      "code": [
        {
          "label": "slowlogPushEntryIfNeeded · src/slowlog.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/slowlog.c#L103"
        },
        {
          "label": "command execution duration · src/server.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L3684"
        }
      ]
    }
  ]
};

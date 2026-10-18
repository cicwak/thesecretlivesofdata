// Reviewed against Redis Open Source 8.0.0, e91a340e241cf0abe3c6a0c254214fbe4aa1d95f.
export default {
  "rdb": [
    {
      "docs": [
        {
          "label": "RDB persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        },
        {
          "label": "BGSAVE",
          "url": "https://redis.io/docs/latest/commands/bgsave/"
        }
      ],
      "code": [
        {
          "label": "rdbSaveBackground, rdb.c:1642",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1642"
        },
        {
          "label": "rdbSaveRio, rdb.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1458"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RDB persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        },
        {
          "label": "BGSAVE",
          "url": "https://redis.io/docs/latest/commands/bgsave/"
        }
      ],
      "code": [
        {
          "label": "redisFork, server.c:6754",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L6754"
        },
        {
          "label": "rdbSaveBackground, rdb.c:1652",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1652"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RDB persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        },
        {
          "label": "BGSAVE",
          "url": "https://redis.io/docs/latest/commands/bgsave/"
        }
      ],
      "code": [
        {
          "label": "rdbSaveBackground, rdb.c:1652-1664",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1652"
        },
        {
          "label": "redisFork, server.c:6766",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L6766"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RDB persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        },
        {
          "label": "BGSAVE",
          "url": "https://redis.io/docs/latest/commands/bgsave/"
        }
      ],
      "code": [
        {
          "label": "rdbSaveInternal, rdb.c:1530-1572",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1530"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BGSAVE",
          "url": "https://redis.io/docs/latest/commands/bgsave/"
        },
        {
          "label": "INFO persistence",
          "url": "https://redis.io/docs/latest/commands/info/"
        },
        {
          "label": "LASTSAVE",
          "url": "https://redis.io/docs/latest/commands/lastsave/"
        }
      ],
      "code": [
        {
          "label": "rdbSaveInternal, rdb.c:1563",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1563"
        },
        {
          "label": "rdbSave, rdb.c:1599-1639",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1599"
        },
        {
          "label": "exitFromChild, rdb.c:1663",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/rdb.c#L1663"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "RDB recovery",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "loadDataFromDisk, server.c:6936-6960",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/server.c#L6936"
        }
      ]
    }
  ],
  "aof": [
    {
      "docs": [
        {
          "label": "AOF persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "feedAppendOnlyFile, aof.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1405"
        },
        {
          "label": "flushAppendOnlyFile, aof.c:1143",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1143"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "AOF persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "aofWrite, aof.c:1214",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1214"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "AOF persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "flushAppendOnlyFile, aof.c:1324-1359",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1324"
        },
        {
          "label": "redis.conf:1486",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/redis.conf#L1486"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "AOF persistence",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "flushAppendOnlyFile, aof.c:1143-1359",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1143"
        },
        {
          "label": "loadAppendOnlyFiles, aof.c:1734",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1734"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "BGREWRITEAOF",
          "url": "https://redis.io/docs/latest/commands/bgrewriteaof/"
        },
        {
          "label": "Multipart AOF",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "rewriteAppendOnlyFileBackground, aof.c:2534-2596",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L2534"
        },
        {
          "label": "backgroundRewriteDoneHandler, aof.c:2686-2790",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L2686"
        },
        {
          "label": "persistAofManifest, aof.c:608",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L608"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "AOF recovery",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"
        }
      ],
      "code": [
        {
          "label": "loadAppendOnlyFiles, aof.c:1762-1838",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/aof.c#L1762"
        },
        {
          "label": "redis.conf:1530-1535",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/redis.conf#L1530"
        }
      ]
    }
  ],
  "replication": [
    {
      "docs": [
        {
          "label": "Replication",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/"
        }
      ],
      "code": [
        {
          "label": "replicationFeedSlaves, replication.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L496"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Replication",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/"
        }
      ],
      "code": [
        {
          "label": "replicationSendAck, replication.c:4109-4126",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4109"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "PSYNC",
          "url": "https://redis.io/docs/latest/commands/psync/"
        },
        {
          "label": "Partial replication",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/"
        }
      ],
      "code": [
        {
          "label": "masterTryPartialResynchronization, replication.c:816-889",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L816"
        },
        {
          "label": "slaveTryPartialResynchronization, replication.c:2638-2666",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L2638"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Full synchronization",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/"
        }
      ],
      "code": [
        {
          "label": "syncCommand, replication.c:1092",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L1092"
        },
        {
          "label": "readSyncBulkPayload, replication.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L2026"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "WAIT",
          "url": "https://redis.io/docs/latest/commands/wait/"
        }
      ],
      "code": [
        {
          "label": "replicationCountAcksByOffset, replication.c:4342",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4342"
        },
        {
          "label": "waitCommand, replication.c:4376-4406",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4376"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "WAITAOF",
          "url": "https://redis.io/docs/latest/commands/waitaof/"
        }
      ],
      "code": [
        {
          "label": "replicationSendAck, replication.c:4109-4126",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4109"
        },
        {
          "label": "replicationCountAOFAcksByOffset, replication.c:4359",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4359"
        },
        {
          "label": "waitaofCommand, replication.c:4410-4448",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/replication.c#L4410"
        }
      ]
    }
  ],
  "sentinel": [
    {
      "docs": [
        {
          "label": "Sentinel",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/"
        }
      ],
      "code": [
        {
          "label": "sentinelSendPeriodicCommands, sentinel.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L3096"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Sentinel",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/"
        }
      ],
      "code": [
        {
          "label": "sentinelCheckSubjectivelyDown, sentinel.c:4517",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L4517"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Sentinel",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/"
        }
      ],
      "code": [
        {
          "label": "sentinelCheckObjectivelyDown, sentinel.c:4591-4623",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L4591"
        },
        {
          "label": "sentinelGetLeader, sentinel.c:4785-4854",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L4785"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Sentinel",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/"
        }
      ],
      "code": [
        {
          "label": "compareSlavesForPromotion, sentinel.c:5014",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L5014"
        },
        {
          "label": "sentinelSelectSlave, sentinel.c:5042-5085",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L5042"
        },
        {
          "label": "sentinelSendSlaveOf, sentinel.c:4852",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L4852"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Sentinel client specification",
          "url": "https://redis.io/docs/latest/develop/reference/sentinel-clients/"
        }
      ],
      "code": [
        {
          "label": "sentinelCommand, sentinel.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L3845"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Sentinel partitions",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/"
        }
      ],
      "code": [
        {
          "label": "sentinelGetLeader, sentinel.c:4841",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L4841"
        },
        {
          "label": "sentinelFailoverReconfNextSlave, sentinel.c",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/sentinel.c#L5240"
        }
      ]
    }
  ],
  "cluster": [
    {
      "docs": [
        {
          "label": "Cluster specification",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"
        }
      ],
      "code": [
        {
          "label": "CLUSTER_SLOTS, cluster.h",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.h#L9"
        },
        {
          "label": "getNodeByQuery, cluster.c:1147",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1147"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "CLUSTER KEYSLOT",
          "url": "https://redis.io/docs/latest/commands/cluster-keyslot/"
        },
        {
          "label": "Hash tags",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"
        }
      ],
      "code": [
        {
          "label": "keyHashSlot, cluster.h:43-62",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.h#L43"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "CLUSTER SHARDS",
          "url": "https://redis.io/docs/latest/commands/cluster-shards/"
        }
      ],
      "code": [
        {
          "label": "getNodeByQuery, cluster.c:1059",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1059"
        },
        {
          "label": "clusterRedirectClient, cluster.c:1300",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1300"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "MOVED",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"
        }
      ],
      "code": [
        {
          "label": "clusterRedirectClient, cluster.c:1300-1329",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1300"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "ASKING",
          "url": "https://redis.io/docs/latest/commands/asking/"
        },
        {
          "label": "CLUSTER SETSLOT",
          "url": "https://redis.io/docs/latest/commands/cluster-setslot/"
        }
      ],
      "code": [
        {
          "label": "getNodeByQuery, cluster.c:1249-1276",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1249"
        },
        {
          "label": "askingCommand, cluster.c:1541-1548",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1541"
        }
      ]
    },
    {
      "docs": [
        {
          "label": "Multi-key requests",
          "url": "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"
        },
        {
          "label": "Script flags",
          "url": "https://redis.io/docs/latest/develop/programmability/lua-api/#script-flags"
        }
      ],
      "code": [
        {
          "label": "getNodeByQuery, cluster.c:1147-1190",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/cluster.c#L1147"
        },
        {
          "label": "scriptPrepareForRun, script.c:288",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L288"
        },
        {
          "label": "scriptVerifyClusterState, script.c:480-526",
          "url": "https://github.com/redis/redis/blob/e91a340e241cf0abe3c6a0c254214fbe4aa1d95f/src/script.c#L480"
        }
      ]
    }
  ]
};

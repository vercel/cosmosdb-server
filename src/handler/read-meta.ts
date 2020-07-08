export default () => ({
  _rid: "localhost",
  _self: "",
  _dbs: "//dbs/",
  id: "localhost",
  media: "//media/",
  addresses: "//addresses/",
  writableLocations: [
    {
      name: "South Central US",
      databaseAccountEndpoint: `https://localhost:3000/`
    }
  ],
  readableLocations: [
    {
      name: "South Central US",
      databaseAccountEndpoint: `https://localhost:3000/`
    }
  ],
  enableMultipleWriteLocations: false,
  userReplicationPolicy: {
    asyncReplication: false,
    minReplicaSetSize: 1,
    maxReplicasetSize: 4
  },
  userConsistencyPolicy: {
    defaultConsistencyLevel: "Session"
  },
  systemReplicationPolicy: {
    minReplicaSetSize: 1,
    maxReplicasetSize: 4
  },
  readPolicy: {
    primaryReadCoefficient: 1,
    secondaryReadCoefficient: 1
  },
  queryEngineConfiguration:
    '{"maxSqlQueryInputLength":262144,"maxJoinsPerSqlQuery":5,"maxLogicalAndPerSqlQuery":500,"maxLogicalOrPerSqlQuery":500,"maxUdfRefPerSqlQuery":10,"maxInExpressionItemsCount":16000,"queryMaxInMemorySortDocumentCount":500,"maxQueryRequestTimeoutFraction":0.9,"sqlAllowNonFiniteNumbers":false,"sqlAllowAggregateFunctions":true,"sqlAllowSubQuery":true,"sqlAllowScalarSubQuery":true,"allowNewKeywords":true,"sqlAllowLike":false,"maxSpatialQueryCells":12,"spatialMaxGeometryPointCount":256,"sqlAllowTop":true,"enableSpatialIndexing":true}'
});

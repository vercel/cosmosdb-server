/* eslint-disable class-methods-use-this, no-underscore-dangle */
import Databases from "./databases";
import Item from "./item";

export default class Account extends Item {
  databases: Databases;
  
  ssl: boolean;

  constructor(host: string, port: number, ssl: boolean) {
    super({
      _rid: host,
      _self: "",
      _dbs: "//dbs/",
      id: host,
      media: "//media/",
      addresses: "//addresses/",
      writableLocations: [
        {
          name: "South Central US",
          databaseAccountEndpoint: `http${ssl ? "s" : ""}://${host}:${port}/`
        }
      ],
      readableLocations: [
        {
          name: "South Central US",
          databaseAccountEndpoint: `http${ssl ? "s" : ""}://${host}:${port}/`
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
    this.ssl = ssl;
    this.databases = new Databases(this, ["/id"]);
  }

  updateHostName(host: string){
    // when running this server in a dockerized environment, the hostname becomes the servername
    // and databaseAccountEndpoint needs to point to the hostname provided by the caller
    this._data.writableLocations[0].databaseAccountEndpoint = `http${this.ssl ? "s" : ""}://${host}/`;
    this._data.readableLocations[0].databaseAccountEndpoint = `http${this.ssl ? "s" : ""}://${host}/`;
  }

  database(idOrRid: string) {
    return this.databases._item("/id", idOrRid, idOrRid);
  }
}

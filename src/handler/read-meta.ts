import * as http from "http";
import { TLSSocket } from "tls";

export default (account: Account, req: http.IncomingMessage, res: http.ServerResponse) => {
    const isSecure = (req.socket as TLSSocket).encrypted;
    const host = "localhost";
    const port = req.socket.localPort;

    return {
    _self: "",
    id: host,
    _rid: host,
    media: "//media/",
    addresses: "//addresses/",
    _dbs: "//dbs/",
    writableLocations: [
        {
            name: "Emulator",
            databaseAccountEndpoint: `${isSecure ? 'https' : 'http'}://${host}:${port}/`
        }
    ],
    readableLocations: [
        {
            name: "Emulator",
            databaseAccountEndpoint: `${isSecure ? 'https' : 'http'}://${host}:${port}/`
        }
    ],
    enableMultipleWriteLocations: false,
    userReplicationPolicy: {
        asyncReplication: false,
        minReplicaSetSize: 3,
        maxReplicasetSize: 4
    },
    userConsistencyPolicy: {
        defaultConsistencyLevel: "Session"
    },
    systemReplicationPolicy: {
        minReplicaSetSize: 3,
        maxReplicasetSize: 4
    },
    readPolicy: {
        primaryReadCoefficient: 1,
        secondaryReadCoefficient: 1
    },
    queryEngineConfiguration: "{\"maxSqlQueryInputLength\":262144,\"maxJoinsPerSqlQuery\":5,\"maxLogicalAndPerSqlQuery\":500,\"maxLogicalOrPerSqlQuery\":500,\"maxUdfRefPerSqlQuery\":10,\"maxInExpressionItemsCount\":16000,\"queryMaxInMemorySortDocumentCount\":500,\"maxQueryRequestTimeoutFraction\":0.9,\"sqlAllowNonFiniteNumbers\":false,\"sqlAllowAggregateFunctions\":true,\"sqlAllowSubQuery\":true,\"sqlAllowScalarSubQuery\":true,\"allowNewKeywords\":true,\"sqlAllowLike\":false,\"sqlAllowGroupByClause\":true,\"maxSpatialQueryCells\":12,\"spatialMaxGeometryPointCount\":256,\"sqlAllowTop\":true,\"enableSpatialIndexing\":true}"
}};

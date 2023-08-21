import * as http from "http";
import Account from "../account";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId
  }: {
    dbId: string;
    collId: string;
  }
) => {
    console.log("returning random query plan")
    
    return {
    "partitionedQueryExecutionInfoVersion": "2",
    "queryInfo": {
        "distinctType": "None",
        "top": null,
        "offset": null,
        "limit": null,
        "orderBy": [],
        "orderByExpressions": [],
        "groupByExpressions": [],
        "groupByAliases": [],
        "aggregates": [],
        "groupByAliasToAggregateType": {},
        "rewrittenQuery": "",
        "hasSelectValue": false,
        "dCountInfo": null
    },
    "queryRanges": [
        {
            "min": "05C1A3C5D33F20083200",
            "max": "05C1A3C5D33F20083200",
            "isMinInclusive": true,
            "isMaxInclusive": true
        }
    ]
} as any}

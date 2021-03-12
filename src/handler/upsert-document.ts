import * as http from "http";
import { upsertOperation } from "./_document-operations";
import Account from "../account";
import json from "../json";
import getPartitionFromHeader from "../utils/get-partition-from-header";

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
  const body = await json(req);
  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  const partitionKey = getPartitionFromHeader(req);
  const result = upsertOperation(collection, {
    partitionKey,
    ifMatch: req.headers["if-match"],
    resourceBody: body
  });
  res.statusCode = result.statusCode;
  return result.body;
};

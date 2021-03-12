import * as http from "http";
import { replaceOperation } from "./_document-operations";
import Account from "../account";
import json from "../json";
import getPartitionFromHeader, {
  parsePartitionKey
} from "../utils/get-partition-from-header";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId,
    docId
  }: {
    dbId: string;
    collId: string;
    docId: string;
  }
) => {
  const body = await json(req);
  const collection = account.database(dbId).collection(collId);

  const partitionKey = getPartitionFromHeader(req);
  const parsedPartitionKey = parsePartitionKey(partitionKey, docId);
  const data = collection.document(docId, parsedPartitionKey).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  const result = replaceOperation(collection, {
    partitionKey,
    ifMatch: req.headers["if-match"],
    resourceBody: body
  });
  res.statusCode = result.statusCode;
  return result.body;
};

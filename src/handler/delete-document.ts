import * as http from "http";
import { deleteOperation } from "./_document-operations";
import Account from "../account";
import getPartitionFromHeader from "../utils/get-partition-from-header";

export default (
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
  const collection = account.database(dbId).collection(collId);
  const partitionKey = getPartitionFromHeader(req);

  const result = deleteOperation(collection, {
    partitionKey,
    ifMatch: req.headers["if-match"],
    id: docId
  });

  res.statusCode = result.statusCode;
  return result.body;
};

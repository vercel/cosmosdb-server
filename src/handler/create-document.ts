import * as http from "http";
import { createOperation } from "./_document-operations";
import Account from "../account";
import json from "../json";

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
  const result = createOperation(collection, { resourceBody: body });
  res.statusCode = result.statusCode;
  return result.body;
};

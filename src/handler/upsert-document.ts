import * as http from "http";
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
  if (!body.id) {
    res.statusCode = 400;
    return { Message: "missing id" };
  }

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  return collection.documents.upsert(body);
};

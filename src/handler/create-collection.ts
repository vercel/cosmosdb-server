import * as http from "http";
import Account from "../account";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId
  }: {
    dbId: string;
  }
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { Message: "missing id" };
  }

  if (body.partitionKey && !Array.isArray(body.partitionKey.paths)) {
    res.statusCode = 400;
    return { Message: "invalid partitionKey" };
  }

  const database = account.database(dbId);
  if (!database.read()) {
    res.statusCode = 404;
    return {};
  }

  if (database.collection(body.id).read()) {
    res.statusCode = 409;
    return { Message: "conflict" };
  }

  return database.collections.create(body);
};

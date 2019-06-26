import assert from "assert";
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

  const database = account.database(dbId);
  const data = database.collection(collId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  try {
    assert.deepStrictEqual(body.partitionKey, data.partitionKey);
  } catch (err) {
    res.statusCode = 400;
    return { Message: "replacing partitionKey is not allowed" };
  }

  try {
    return database.collections.replace(body);
  } catch (err) {
    if (err.badRequest) {
      res.statusCode = 400;
      return { Message: err.message };
    }

    throw err;
  }
};

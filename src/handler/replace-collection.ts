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
    return { message: "missing id" };
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
    return { message: "replacing partitionKey is not allowed" };
  }

  try {
    return await database.collections.replace(body, data);
  } catch (err) {
    if (err.badRequest) {
      res.statusCode = 400;
      return { message: err.message };
    }
    if (err.conflict) {
      res.statusCode = 409;
      return { message: err.message, code: "Conflict" };
    }

    throw err;
  }
};

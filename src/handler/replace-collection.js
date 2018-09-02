// @flow
import type Account from "../account";

const assert = require("assert");
const json = require("../json");

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
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

  if (data.id !== body.id) {
    res.statusCode = 400;
    return { Message: "replacing id is not allowed" };
  }

  try {
    assert.deepStrictEqual(body.partitionKey, data.partitionKey);
  } catch (err) {
    res.statusCode = 400;
    return { Message: "replacing partitionKey is not allowed" };
  }

  return database.collections.replace(body);
};

// @flow
import type Account from "../account";

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

  if (!body.body) {
    res.statusCode = 400;
    return { Message: "missing body" };
  }

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  return collection.userDefinedFunctions.upsert(body);
};

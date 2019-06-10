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

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  try {
    return collection.documents.create(body);
  } catch (err) {
    if (err.conflict) {
      res.statusCode = 409;
      return { code: "Conflict", message: err.message };
    }

    throw err;
  }
};

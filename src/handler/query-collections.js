// @flow
import type Account from "../account";

const json = require("../json");

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) => {
  const body = await json(req);
  const DocumentCollections = account.database(dbId).collections.query(body);
  if (!DocumentCollections) {
    res.statusCode = 404;
    return {};
  }

  return { DocumentCollections };
};

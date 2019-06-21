// @flow
import type Account from "../account";

module.exports = (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const database = account.database(dbId);
  if (!database.collection(collId).read()) {
    res.statusCode = 404;
    return {};
  }

  return database.collections.delete(collId);
};

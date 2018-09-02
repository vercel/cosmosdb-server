// @flow
import type Account from "../account";

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const coll = account
    .database(dbId)
    .collection(collId)
    .read();
  if (!coll) {
    res.statusCode = 404;
    return {};
  }

  return coll;
};

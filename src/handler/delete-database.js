// @flow
import type Account from "../account";

module.exports = (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) => {
  if (!account.database(dbId).read()) {
    res.statusCode = 404;
    return {};
  }

  return account.databases.delete(dbId);
};

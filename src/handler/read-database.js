// @flow
import type Account from "../account";

module.exports = async (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) => {
  const data = account.database(dbId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  return data;
};

// @flow
import type Account from "../account";

module.exports = (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId, udfId }: { dbId: string, collId: string, udfId: string }
) => {
  const collection = account.database(dbId).collection(collId);
  if (!collection.userDefinedFunction(udfId).read()) {
    res.statusCode = 404;
    return {};
  }

  return collection.userDefinedFunctions.delete(udfId);
};
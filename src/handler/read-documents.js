// @flow
import type Account from "../account";

module.exports = (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const Documents = account
    .database(dbId)
    .collection(collId)
    .documents.read();
  if (!Documents) {
    res.statusCode = 404;
    return {};
  }

  return { Documents, _count: Documents.length };
};

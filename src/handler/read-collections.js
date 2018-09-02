// @flow
import type Account from "../account";

module.exports = (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) => {
  const DocumentCollections = account.database(dbId).collections.read();
  if (!DocumentCollections) return null;

  return { DocumentCollections, _count: DocumentCollections.length };
};

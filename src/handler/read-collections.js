// @flow
import type Account from "../account";

const readItems = require("./_read-items");

module.exports = (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) =>
  readItems(
    req,
    res,
    "DocumentCollections",
    async ({ continuation, maxItemCount }) =>
      account.database(dbId).collections.read({ continuation, maxItemCount })
  );

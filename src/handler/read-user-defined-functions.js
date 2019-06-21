// @flow
import type Account from "../account";

const readItems = require("./_read-items");

module.exports = (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) =>
  readItems(
    req,
    res,
    "UserDefinedFunctions",
    async ({ continuation, maxItemCount }) =>
      account
        .database(dbId)
        .collection(collId)
        .userDefinedFunctions.read({ continuation, maxItemCount })
  );

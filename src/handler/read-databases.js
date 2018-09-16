// @flow
import type Account from "../account";

const readItems = require("./_read-items");

module.exports = (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse
) =>
  readItems(req, res, "Databases", async ({ continuation, maxItemCount }) =>
    account.databases.read({ continuation, maxItemCount })
  );

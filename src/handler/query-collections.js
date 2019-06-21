// @flow
import type Account from "../account";

const json = require("../json");
const readItems = require("./_read-items");

module.exports = async (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) =>
  readItems(
    req,
    res,
    "DocumentCollections",
    async ({ continuation, maxItemCount }) => {
      const body = await json(req);
      return account
        .database(dbId)
        .collections.query(body, { continuation, maxItemCount });
    }
  );

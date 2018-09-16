// @flow
import type Account from "../account";

const json = require("../json");
const readItems = require("./_read-items");

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse
) =>
  readItems(req, res, "Databases", async ({ continuation, maxItemCount }) => {
    const body = await json(req);
    return account.databases.query(body, { continuation, maxItemCount });
  });

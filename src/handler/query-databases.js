// @flow
import type Account from "../account";

const json = require("../json");

module.exports = async (account: Account, req: http$IncomingMessage) => {
  const body = await json(req);
  const Databases = account.databases.query(body);
  return { Databases };
};

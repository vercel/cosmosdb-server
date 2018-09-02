// @flow
import type Account from "../account";

const json = require("../json");

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { Message: "missing id" };
  }

  if (account.database(body.id).read()) {
    res.statusCode = 409;
    return { Message: "conflict" };
  }

  return account.databases.create(body);
};

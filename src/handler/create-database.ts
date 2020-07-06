import * as http from "http";
import Account from "../account";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { message: "missing id" };
  }

  if (account.database(body.id).read()) {
    res.statusCode = 409;
    return { message: "conflict" };
  }

  res.statusCode = 201;
  return account.databases.create(body);
};

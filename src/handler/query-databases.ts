import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse
) =>
  readItems(req, res, "Databases", async ({ continuation, maxItemCount }) => {
    const body = await json(req);
    return account.databases.query(body, { continuation, maxItemCount });
  });

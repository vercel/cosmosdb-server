import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId
  }: {
    dbId: string;
  }
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

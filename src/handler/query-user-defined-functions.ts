import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId
  }: {
    dbId: string;
    collId: string;
  }
) =>
  readItems(
    req,
    res,
    "UserDefinedFunctions",
    async ({ continuation, maxItemCount }) => {
      const body = await json(req);
      if (!body.query) {
        res.statusCode = 400;
        return { message: "missing query" };
      }

      const collection = account.database(dbId).collection(collId);
      return collection.userDefinedFunctions.query(body, {
        continuation,
        maxItemCount
      });
    }
  );

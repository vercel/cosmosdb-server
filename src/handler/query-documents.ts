import query from "@zeit/cosmosdb-query";
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
  readItems(req, res, "Documents", async ({ continuation, maxItemCount }) => {
    const body = await json(req);
    if (!body.query) {
      res.statusCode = 400;
      return { Message: "missing query" };
    }

    const collection = account.database(dbId).collection(collId);

    if (req.headers["x-ms-documentdb-query-enablecrosspartition"] !== "true") {
      const { partitionKey }: { partitionKey?: any } = collection.read() || {};
      const paths = (partitionKey || {}).paths || [];
      if (paths.length && !query(body.query).containsPartitionKeys(paths)) {
        res.statusCode = 400;
        return { Message: "missing partition keys" };
      }
    }

    return collection.documents.query(body, { continuation, maxItemCount });
  });

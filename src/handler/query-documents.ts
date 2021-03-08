import query from "@zeit/cosmosdb-query";
import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";
import json from "../json";
import trueHeader from "../true-header";

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
      return { message: "missing query" };
    }

    const collection = account.database(dbId).collection(collId);

    if (!trueHeader(req, "x-ms-documentdb-query-enablecrosspartition")) {
      const { partitionKey }: { partitionKey?: any } = collection.read() || {};
      const paths = (partitionKey || {}).paths || [];
      if (paths.length && !query(body.query).containsPartitionKeys(paths)) {
        res.statusCode = 400;
        return { message: "missing partition keys" };
      }
    }

    try {
      return collection.documents.query(body, { continuation, maxItemCount });
    } catch (err) {
      if (err.badRequest) {
        res.statusCode = 400;
        return { message: err.message };
      }

      throw err;
    }
  });

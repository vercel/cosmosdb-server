// @flow
import type Account from "../account";

const query = require("@zeit/cosmosdb-query");
const json = require("../json");

module.exports = async (
  account: Account,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const body = await json(req);
  if (!body.query) {
    res.statusCode = 400;
    return { Message: "missing query" };
  }

  const collection = account.database(dbId).collection(collId);

  if (req.headers["x-ms-documentdb-query-enablecrosspartition"] !== "true") {
    const { partitionKey } = collection.read() || {};
    const paths = partitionKey ? partitionKey.paths : [];
    if (!query(body.query).containsPartitionKeys(paths || [])) {
      res.statusCode = 400;
      return { Message: "missing partition keys" };
    }
  }

  const Documents = collection.documents.query(body);
  if (!Documents) {
    res.statusCode = 404;
    return {};
  }

  return { Documents };
};

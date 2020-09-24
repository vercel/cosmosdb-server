import * as http from "http";
import Account from "../account";
import getPartitionKey from "../get-partition-key";
import json from "../json";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId,
    docId
  }: {
    dbId: string;
    collId: string;
    docId: string;
  }
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { message: "missing id" };
  }

  const collection = account.database(dbId).collection(collId);
  const data = collection.document(docId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  /**
   * Falling back to `id` partitionKey for now.
   */
  const partitionKey = getPartitionKey(collection) || "id";
  if (data[partitionKey] !== body[partitionKey]) {
    res.statusCode = 400;
    return {
      code: "BadRequest",
      message: `replacing partition key "${partitionKey}" is not allowed`
    };
  }

  if (req.headers["if-match"] && req.headers["if-match"] !== data._etag) {
    res.statusCode = 412;
    return {
      code: "PreconditionFailed",
      message:
        "Operation cannot be performed because one of the specified precondition is not met."
    };
  }

  return collection.documents.replace(body);
};

import * as http from "http";
import Account from "../account";
import json from "../json";
import getPartitionHeader from "../utils/get-partition-header";

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
  const data = collection
    .document(docId, getPartitionHeader(req) || docId)
    .read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  if (req.headers["if-match"] && req.headers["if-match"] !== data._etag) {
    res.statusCode = 412;
    return {
      code: "PreconditionFailed",
      message:
        "Operation cannot be performed because one of the specified precondition is not met."
    };
  }

  try {
    return collection.documents.replace(body, data);
  } catch (error) {
    if (error.badRequest) {
      res.statusCode = 400;
      return { code: "BadRequest", message: error.message };
    }
    throw error;
  }
};

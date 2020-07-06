import * as http from "http";
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
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { message: "missing id" };
  }

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  if (req.headers["if-match"]) {
    const data = collection.document(body.id).read();
    if (data && req.headers["if-match"] !== data._etag) {
      res.statusCode = 412;
      return {
        code: "PreconditionFailed",
        message:
          "Operation cannot be performed because one of the specified precondition is not met."
      };
    }
  }

  return collection.documents.upsert(body);
};

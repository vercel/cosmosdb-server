import * as http from "http";
import Account from "../account";
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
    return { Message: "missing id" };
  }

  const collection = account.database(dbId).collection(collId);
  const data = collection.document(docId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  if (data.id !== body.id) {
    res.statusCode = 400;
    return {
      code: "BadRequest",
      message: "replacing id is not allowed"
    };
  }

  if (req.headers["if-match"] && req.headers["if-match"] !== data._etag) {
    res.statusCode = 412;
    return {
      code: "PreconditionFailed",
      message:
        "There is already an operation in progress which requires exlusive lock on this service"
    };
  }

  return collection.documents.replace(body);
};

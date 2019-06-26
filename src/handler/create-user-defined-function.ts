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
    return { Message: "missing id" };
  }

  if (!body.body) {
    res.statusCode = 400;
    return { Message: "missing body" };
  }

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  try {
    return collection.userDefinedFunctions.create(body);
  } catch (err) {
    if (err.conflict) {
      res.statusCode = 409;
      return { Message: err.message };
    }

    throw err;
  }
};

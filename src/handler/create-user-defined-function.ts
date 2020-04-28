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

  if (!body.body) {
    res.statusCode = 400;
    return { message: "missing body" };
  }

  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  res.statusCode = 201;
  try {
    return collection.userDefinedFunctions.create(body);
  } catch (err) {
    if (err.conflict) {
      res.statusCode = 409;
      return { message: err.message };
    }

    throw err;
  }
};

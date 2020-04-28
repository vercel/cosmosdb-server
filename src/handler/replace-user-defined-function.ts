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
    udfId
  }: {
    dbId: string;
    collId: string;
    udfId: string;
  }
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { message: "missing id" };
  }

  const collection = account.database(dbId).collection(collId);
  const data = collection.userDefinedFunction(udfId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  try {
    return collection.userDefinedFunctions.replace(body);
  } catch (err) {
    if (err.badRequest) {
      res.statusCode = 400;
      return { message: err.message };
    }

    throw err;
  }
};

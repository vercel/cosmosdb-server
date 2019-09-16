import * as http from "http";
import Account from "../account";

export default (
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
  const collection = account.database(dbId).collection(collId);
  if (!collection.userDefinedFunction(udfId).read()) {
    res.statusCode = 404;
    return {};
  }

  res.statusCode = 204;
  return collection.userDefinedFunctions.delete(udfId);
};

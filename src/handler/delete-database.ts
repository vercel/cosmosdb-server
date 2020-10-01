import * as http from "http";
import Account from "../account";

export default (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId
  }: {
    dbId: string;
  }
) => {
  if (!account.database(dbId).read()) {
    res.statusCode = 404;
    return {};
  }

  res.statusCode = 204;
  return account.databases.delete(dbId, dbId);
};

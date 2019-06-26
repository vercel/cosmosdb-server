import * as http from "http";
import Account from "../account";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId
  }: {
    dbId: string;
  }
) => {
  const data = account.database(dbId).read();
  if (!data) {
    res.statusCode = 404;
    return {};
  }

  return data;
};

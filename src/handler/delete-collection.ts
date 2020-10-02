import * as http from "http";
import Account from "../account";
import getPartitionFromHeader from "../utils/get-partition-from-header";

export default (
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
  const database = account.database(dbId);
  if (!database.collection(collId).read()) {
    res.statusCode = 404;
    return {};
  }

  res.statusCode = 204;
  return database.collections.delete(
    collId,
    getPartitionFromHeader(req, collId)
  );
};

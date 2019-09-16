import * as http from "http";
import Account from "../account";

export default (
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
  const collection = account.database(dbId).collection(collId);
  if (!collection.document(docId).read()) {
    res.statusCode = 404;
    return {};
  }

  res.statusCode = 204;
  return collection.documents.delete(docId);
};

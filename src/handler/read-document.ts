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
  const data = account
    .database(dbId)
    .collection(collId)
    .document(docId)
    .read();
  if (!data) {
    res.statusCode = 404;
    return {
      code: "NotFound",
      message: "Entity with the specified id does not exist in the system.,"
    };
  }

  return data;
};

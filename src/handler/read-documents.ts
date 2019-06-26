import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";

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
) =>
  readItems(req, res, "Documents", async ({ continuation, maxItemCount }) =>
    account
      .database(dbId)
      .collection(collId)
      .documents.read({ continuation, maxItemCount })
  );

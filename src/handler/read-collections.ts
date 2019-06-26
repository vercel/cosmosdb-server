import * as http from "http";
import readItems from "./_read-items";
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
) =>
  readItems(
    req,
    res,
    "DocumentCollections",
    async ({ continuation, maxItemCount }) =>
      account.database(dbId).collections.read({ continuation, maxItemCount })
  );

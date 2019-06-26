import * as http from "http";
import readItems from "./_read-items";
import Account from "../account";

export default (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse
) =>
  readItems(req, res, "Databases", async ({ continuation, maxItemCount }) =>
    account.databases.read({ continuation, maxItemCount })
  );

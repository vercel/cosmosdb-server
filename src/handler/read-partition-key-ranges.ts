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
  readItems(
    req,
    res,
    "PartitionKeyRanges",
    async ({ continuation, maxItemCount }) =>
      account
        .database(dbId)
        .collection(collId)
        .partitionKeyRanges.read({ continuation, maxItemCount })
  );

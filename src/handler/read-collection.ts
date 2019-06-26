import * as http from "http";
import Account from "../account";

export default async (
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
  const coll = account
    .database(dbId)
    .collection(collId)
    .read();
  if (!coll) {
    res.statusCode = 404;
    return {};
  }

  res.setHeader(
    "x-ms-documentdb-collection-index-transformation-progress",
    "-1"
  );
  if (coll.indexingPolicy && coll.indexingPolicy.indexingMode === "lazy") {
    res.setHeader("x-ms-documentdb-collection-lazy-indexing-progress", "-1");
  }

  return coll;
};

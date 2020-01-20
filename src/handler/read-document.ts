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

  const collection = account
    .database(dbId)
    .collection(collId)
    .read();

  // We need to check the collection config so if it's not there it's 404
  if (!collection) {
    res.statusCode = 404;
    return {
      code: "NotFound",
      message: "Entity with the specified id does not exist in the system.,"
    };
  }

  // We get the paths for the partitionKeys
  const paths = collection.partitionKey.paths
    .map(path => path.slice(1))
    .filter(path => path !== "_partitionKey");

  // Get the partition keys coming from the header
  const partitionKeys = JSON.parse((req.headers[
    "x-ms-documentdb-partitionkey"
  ] || "[]") as string);

  // If there is a mismatch between provided partition keys and collection 400
  if (paths.length !== partitionKeys.length) {
    res.statusCode = 400;
    return {
      code: "BadRequest",
      message:
        "The partition key supplied in x-ms-partitionkey header has fewer components than defined in the collection"
    };
  }

  // If the partition keys are not matching the data or there is no data 404
  if (
    !data ||
    paths.some(
      (path, idx) => (data as { [k: string]: any })[path] !== partitionKeys[idx]
    )
  ) {
    res.statusCode = 404;
    return {
      code: "NotFound",
      message: "Entity with the specified id does not exist in the system.,"
    };
  }

  return data;
};

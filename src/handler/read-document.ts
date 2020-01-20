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

  if (!collection) {
    res.statusCode = 404;
    return {
      code: "NotFound",
      message: "Entity with the specified id does not exist in the system.,"
    };
  }

  // Get partition key paths defined in the collection
  const paths = collection.partitionKey.paths
    .map(path => path.slice(1))
    .filter(path => path !== "_partitionKey");

  // Get partition keys given by the client
  const partitionkeyHeader =
    req.headers["x-ms-documentdb-partitionkey"] || "[{}]";
  const partitionkeys: string[] =
    partitionkeyHeader !== "[{}]"
      ? JSON.parse(partitionkeyHeader as string)
      : [];

  // If there is a mismatch between client and server keys it is a 400
  if (paths.length > partitionkeys.length) {
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
      (path, idx) => data[path as keyof typeof data] !== partitionkeys[idx]
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

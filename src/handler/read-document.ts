import * as http from "http";
import { readOperation } from "./_document-operations";
import Account from "../account";
import ItemObject from "../account/item-object";
import trueHeader from "../true-header";
import getPartitionFromHeader, {
  parsePartitionKey
} from "../utils/get-partition-from-header";

/**
 * Given a collection configuration this filters out _partitionKey which
 * is legacy and parses each partitionKey into a key of the collection
 * data.
 */
function getCollectionPartitionKeys(collection: ItemObject) {
  if (!collection.partitionKey) return [];

  return collection.partitionKey.paths
    .map(path => path.slice(1))
    .filter(path => path !== "_partitionKey");
}

/**
 * Given some headers it will parse the provided partition keys into
 * an array of paths. It ignores array of empty object as it is what
 * the client provides when no partition key is given.
 */
function getClientPartitionKeys(headers: http.IncomingHttpHeaders) {
  const key = headers["x-ms-documentdb-partitionkey"] as string;

  if (!key || key === "[{}]") {
    return [];
  }

  try {
    return JSON.parse(key);
  } catch (error) {
    return [];
  }
}

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
  if (!collection.read()) {
    res.statusCode = 404;
    return {
      code: "NotFound",
      message: "Entity with the specified id does not exist in the system.,"
    };
  }

  const partitionKey = getPartitionFromHeader(req);

  if (!trueHeader(req, "x-ms-documentdb-query-enablecrosspartition")) {
    const collectionKeys = getCollectionPartitionKeys(collection.read());
    const clientKeys = getClientPartitionKeys(req.headers);

    if (collectionKeys.length > clientKeys.length) {
      res.statusCode = 400;
      return {
        code: "BadRequest",
        message:
          "The partition key supplied in x-ms-partitionkey header has fewer components than defined in the collection"
      };
    }

    const parsedPartitionKey = parsePartitionKey(partitionKey, docId);
    const data = collection.document(docId, parsedPartitionKey).read();

    for (let i = 0; i <= collectionKeys.length; i += 1) {
      const path = collectionKeys[i] as keyof typeof data;
      if (data[path] !== clientKeys[i]) {
        res.statusCode = 404;
        return {
          code: "NotFound",
          message: "Entity with the specified id does not exist in the system.,"
        };
      }
    }
  }

  const result = readOperation(collection, { partitionKey, id: docId });
  res.statusCode = result.statusCode;
  return result.body;
};

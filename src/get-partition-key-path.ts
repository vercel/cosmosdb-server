import Collection from "./account/collection";

/**
 * @returns string[] of partition key paths for a given collection
 */
export default function getPartitionKeyPath(collection: Collection) {
  const [firstPath] = collection.read().partitionKey.paths;
  if (!firstPath) {
    return null;
  }
  return firstPath.slice(1).split("/");
}

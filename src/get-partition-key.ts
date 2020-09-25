import Collection from "./account/collection";

/**
 * Assumes only 1 partition key path in the following format:
 *  - paths: ["/<partitionKey>"]
 * @returns "<partitionKey>" string or null
 */
export default function getPartitionKey(collection: Collection) {
  const [firstPath] = collection.read().partitionKey.paths;
  if (!firstPath) {
    return null;
  }
  return firstPath.slice(1); // removes "/" from path
}

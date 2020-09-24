import Collection from "./account/collection";

/**
 * Assumes only 1 partition key path in the following format:
 *  - paths: ["/<partitionKey>"]
 * @returns "<partitionKey>" string or null
 */
export default function getPartitionKey(collection: Collection) {
  // eslint-disable-next-line
  const partitionKey = collection.partitionKeyRanges._parent._data.partitionKey;
  if (!partitionKey) {
    return null;
  }
  const [firstPath] = partitionKey.paths;
  if (!firstPath) {
    return null;
  }
  return firstPath.slice(1); // removes "/" from path
}

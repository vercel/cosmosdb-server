import * as http from "http";
import { PartitionValue } from "../types";

const PARTITION_HEADER_KEY = `x-ms-documentdb-partitionkey`;

function transform(value: any, defaultValue: any): PartitionValue {
  if (!value) {
    return value;
  }
  return typeof value === "object" ? defaultValue : value;
}

/**
 * @returns partition head from incoming request if it exists
 */
export default function getPartitionFromHeader(
  req: http.IncomingMessage,
  defaultValue: PartitionValue
) {
  const header = req.headers[PARTITION_HEADER_KEY];
  if (!header) {
    return defaultValue;
  }
  if (Array.isArray(header)) {
    return transform(header[0], defaultValue);
  }
  const parsedHeader = JSON.parse(header);
  if (typeof parsedHeader === "string") {
    return transform(parsedHeader, defaultValue);
  }
  if (Array.isArray(parsedHeader)) {
    return transform(parsedHeader[0], defaultValue);
  }
  throw new Error(
    `Failed to parse ${PARTITION_HEADER_KEY} headers in ${req.rawHeaders.join(
      "; "
    )}`
  );
}

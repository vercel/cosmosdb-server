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
export default function getPartitionFromHeader(req: http.IncomingMessage) {
  const header = req.headers[PARTITION_HEADER_KEY];
  return Array.isArray(header) ? header[0] : header;
}

export function parsePartitionKey(
  partitionKey: string,
  defaultValue: PartitionValue
) {
  let parsedHeader;
  try {
    parsedHeader = JSON.parse(partitionKey);
  } catch (error) {
    throw new Error(
      `Failed to parse ${PARTITION_HEADER_KEY} headers: ${partitionKey}`
    );
  }

  if (typeof parsedHeader === "string") {
    return transform(parsedHeader, defaultValue);
  }
  if (Array.isArray(parsedHeader)) {
    return transform(parsedHeader[0], defaultValue);
  }

  throw new Error(
    `Failed to parse ${PARTITION_HEADER_KEY} headers: ${partitionKey}`
  );
}

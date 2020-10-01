import * as http from "http";

const PARTITION_HEADER_KEY = `x-ms-documentdb-partitionkey`;

function stringOrNull(x: any): string | null {
  return typeof x === "string" ? x : null;
}

/**
 * @returns partition head from incoming request if it exists
 */
export default function getPartitionHeader(
  req: http.IncomingMessage
): string | null {
  const header = req.headers[PARTITION_HEADER_KEY];
  if (!header) {
    return null;
  }
  if (Array.isArray(header)) {
    return stringOrNull(header[0]);
  }
  const parsedHeader = JSON.parse(header);
  if (typeof parsedHeader === "string") {
    return parsedHeader;
  }
  if (Array.isArray(parsedHeader)) {
    return stringOrNull(parsedHeader[0]);
  }
  throw new Error(
    `Failed to parse ${PARTITION_HEADER_KEY} headers in ${req.rawHeaders.join(
      "; "
    )}`
  );
}

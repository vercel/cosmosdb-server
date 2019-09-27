import { SyntaxError } from "@zeit/cosmosdb-query";
import * as http from "http";

const parseJSONOrNull = (s: string) => {
  try {
    return JSON.parse(s);
  } catch (err) {
    return null;
  }
};

const parseHeaders = (headers: { [x: string]: any }) => {
  const maxItemCount = headers["x-ms-max-item-count"]
    ? parseInt(headers["x-ms-max-item-count"], 10)
    : null;
  const continuation = headers["x-ms-continuation"]
    ? parseJSONOrNull(headers["x-ms-continuation"])
    : null;
  return { maxItemCount, continuation };
};

export default async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  itemsName: string,
  fn: (arg: {
    maxItemCount?: number | null;
    continuation?: {
      token: string;
    } | null;
  }) => Promise<any> | any
) => {
  const { maxItemCount, continuation } = parseHeaders(req.headers);
  let result;
  try {
    result = await fn({ maxItemCount, continuation });
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.statusCode = 400;
      return {
        code: "BadRequest",
        message: err.message
      };
    }
    throw err;
  }
  if (!result) {
    res.statusCode = 404;
    return {};
  }

  if (!result.result) {
    return result;
  }

  const count = result.result.length;
  if (result.continuation) {
    res.setHeader("x-ms-continuation", JSON.stringify(result.continuation));
  }
  res.setHeader("x-ms-item-count", String(count));

  return { [itemsName]: result.result, _count: count };
};

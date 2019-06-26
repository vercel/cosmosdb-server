import * as http from "http";
import getRawBody from "raw-body";

export default async (req: http.IncomingMessage) => {
  const body = await getRawBody(req);
  return JSON.parse(body.toString());
};

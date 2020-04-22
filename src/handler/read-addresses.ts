import * as http from "http";
import Account from "../account";

export default (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  res.statusCode = 501;
  return { Message: "Not implemented" };
};

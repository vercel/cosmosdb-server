import * as http from "http";
import Account from "../account";

export default (account: Account, req: http.IncomingMessage) => {
    account.updateHostName(req.headers.host);
    return account.read();
}

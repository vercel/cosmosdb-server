import Account from "../account";
import * as http from "http";

export default (account: Account, req: http.IncomingMessage) => {
    account.updateHostName(req.headers.host);
    account.read();
}

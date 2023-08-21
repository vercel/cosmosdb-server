import * as http from "http";
import { parse } from "url";
import pathMatch from "./path-match";
import trueHeader from "./true-header";

export default (rules: { [x: string]: { [y: string]: Function } }) => {
  const routes: { [x: string]: [(p: string) => any, Function][] } = {};
  Object.entries(rules).forEach(([method, route]) => {
    routes[method] = Object.entries(route).map(([path, handler]) => [
      pathMatch(path),
      handler
    ]);
  });

  return (req: http.IncomingMessage) => {
    let { pathname } = parse(req.url);

    // fix @azure/cosmos sends double slash url
    if (pathname && pathname.slice(0, 2) === "//") {
      pathname = pathname.slice(1);
    }

    let { method } = req;
    if (
      req.method === "POST" &&
      (trueHeader(req, "x-ms-documentdb-isquery") ||
        req.headers["content-type"] === "application/query+json")
    ) {
      method += "_QUERY";
    } else if (trueHeader(req, "x-ms-documentdb-is-upsert")) {
      method += "_UPSERT";
    } else if (trueHeader(req, "x-ms-cosmos-is-batch-request")) {
      method += "_BATCH";
    }

    const methodRoutes = routes[method] || [];
    for (let i = 0, l = methodRoutes.length; i < l; i += 1) {
      const [match, handler] = methodRoutes[i];
      const params = match(pathname);
      if (params) {
        return [params, handler];
      }
    }
    return undefined;
  };
};

// @flow
const { parse } = require("url");
const pathMatch = require("./path-match");

module.exports = (rules: Object) => {
  const routes = {};
  Object.entries(rules).forEach(([method, route]) => {
    routes[method] = Object.entries(route).map(([path, handler]) => [
      pathMatch(path),
      handler
    ]);
  });

  return (req: http$IncomingMessage) => {
    let { pathname } = parse(req.url);

    // fix @azure/cosmos sends double slash url
    if (pathname && pathname.slice(0, 2) === "//") {
      pathname = pathname.slice(1);
    }

    let { method } = req;
    if (
      req.headers["x-ms-documentdb-isquery"] === "true" ||
      req.headers["content-type"] === "application/query+json"
    ) {
      method += "_QUERY";
    } else if (req.headers["x-ms-documentdb-is-upsert"] === "true") {
      method += "_UPSERT";
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

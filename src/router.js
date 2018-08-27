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
    const { pathname } = parse(req.url);
    const isQuery =
      req.headers["x-ms-documentdb-isquery"] === "true" ||
      req.headers["content-type"] === "application/query+json";

    const methodRoutes =
      routes[`${req.method}${isQuery ? "_QUERY" : ""}`] || [];
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

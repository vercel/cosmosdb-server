// @flow
const pathToRegexp = require("path-to-regexp");

module.exports = (path: string, opts?: {}) => {
  const keys = [];
  const regexp = pathToRegexp(path, keys, opts);

  return (pathname: string) => {
    const m = regexp.exec(pathname);
    if (!m) return undefined;

    const params = {};
    for (let i = 0, l = keys.length; i < l; i += 1) {
      const { name } = keys[i];
      params[name] = m[i + 1];
    }
    return params;
  };
};

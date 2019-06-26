import pathToRegexp from "path-to-regexp";

export default (path: string, opts?: {}) => {
  const keys: any[] = [];
  const regexp = pathToRegexp(path, keys, opts);

  return (pathname: string) => {
    const m = regexp.exec(pathname);
    if (!m) return undefined;

    const params: { [x: string]: string } = {};
    for (let i = 0, l = keys.length; i < l; i += 1) {
      const { name } = keys[i];
      params[name] = decodeURIComponent(m[i + 1]);
    }
    return params;
  };
};

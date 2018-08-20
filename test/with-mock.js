// @flow
/* eslint-disable no-underscore-dangle */

// $FlowFixMe
const Module = require("module");

const originalLoad = Module._load;

module.exports = function withMock(fn: () => any) {
  return async (...args: any[]) => {
    const mocks = new Map();

    Module._load = function _load(request, parent, isMain) {
      const filename = Module._resolveFilename(request, parent, isMain);
      if (mocks.has(filename)) {
        return mocks.get(filename);
      }
      return originalLoad.call(this, request, parent, isMain);
    };

    function register(request: string, mock: any) {
      if (request[0] === ".") {
        throw new Error(`Cannot register a relative path: ${request}`);
      }

      const filename = require.resolve(request);
      mocks.set(filename, mock);
    }

    const originalCache = Module._cache;
    Module._cache = {};

    try {
      return await fn(...args, register);
    } finally {
      Module._cache = originalCache;
      Module._load = originalLoad;
    }
  };
};

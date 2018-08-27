// @flow
const { INTERNAL_DB, DATABASES_COLL } = require("../constants");

module.exports = (dbs: Map<string, Map<string, Object>>) => {
  const db = dbs.get(INTERNAL_DB) || new Map();
  const coll = db.get(DATABASES_COLL) || new Map();
  return {
    Databases: [...coll.values()]
  };
};

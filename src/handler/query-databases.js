// @flow
const query = require("@zeit/cosmosdb-query");
const { INTERNAL_DB, DATABASES_COLL } = require("../constants");
const json = require("../json");

module.exports = async (
  dbs: Map<string, Map<string, any>>,
  req: http$IncomingMessage
) => {
  const body = await json(req);
  const db = dbs.get(INTERNAL_DB) || new Map();
  const coll = db.get(DATABASES_COLL) || new Map();
  const Databases = query([...coll.values()], body);
  return { Databases };
};

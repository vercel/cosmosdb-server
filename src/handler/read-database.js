// @flow
const { INTERNAL_DB, DATABASES_COLL } = require("../constants");

module.exports = async (
  dbs: Map<string, any>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId }: { dbId: string }
) => {
  const db: Map<string, any> = dbs.get(INTERNAL_DB) || new Map();
  const coll: Map<string, {}> = db.get(DATABASES_COLL) || new Map();
  return coll.get(dbId);
};

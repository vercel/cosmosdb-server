// @flow
module.exports = (
  dbs: Map<string, Map<string, Object>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbName, collName }: { dbName: string, collName: string }
) => {
  const db = dbs.get(dbName) || new Map();
  const coll = db.get(collName) || new Map();
  return {
    Documents: [...coll.values()],
    _count: coll.size
  };
};

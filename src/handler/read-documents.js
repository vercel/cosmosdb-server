// @flow
module.exports = (
  dbs: Map<string, Map<string, any>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const db = dbs.get(dbId) || new Map();
  const coll = db.get(collId) || new Map();
  return {
    Documents: [...coll.values()],
    _count: coll.size
  };
};

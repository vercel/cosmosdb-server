// @flow
const getRawBody = require("raw-body");

module.exports = async (req: http$IncomingMessage<>) => {
  const body = await getRawBody(req);
  return JSON.parse(body);
};

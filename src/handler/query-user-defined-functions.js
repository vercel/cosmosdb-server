// @flow
import type Account from "../account";

const json = require("../json");
const readItems = require("./_read-items");

module.exports = async (
  account: Account,
  req: http$IncomingMessage<>,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) =>
  readItems(
    req,
    res,
    "UserDefinedFunctions",
    async ({ continuation, maxItemCount }) => {
      const body = await json(req);
      if (!body.query) {
        res.statusCode = 400;
        return { Message: "missing query" };
      }

      const collection = account.database(dbId).collection(collId);
      return collection.userDefinedFunctions.query(body, {
        continuation,
        maxItemCount
      });
    }
  );

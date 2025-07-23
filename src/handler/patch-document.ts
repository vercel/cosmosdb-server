import * as http from "http";
import { patchOperation } from "./_patch-operations";
import Account from "../account";
import json from "../json";
import getPartitionFromHeader from "../utils/get-partition-from-header";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId,
    docId
  }: {
    dbId: string;
    collId: string;
    docId: string;
  }
) => {
  const body = await json(req);
  const collection = account.database(dbId).collection(collId);

  // Handle both formats: Azure SDK sends operations directly as array,
  // while our REST API expects { operations: [...] }
  let operations: any[];
  if (Array.isArray(body)) {
    // Azure SDK format: operations sent directly as array
    operations = body;
  } else if (body.operations && Array.isArray(body.operations)) {
    // REST API format: operations wrapped in object
    operations = body.operations;
  } else {
    res.statusCode = 400;
    return {
      code: "BadRequest",
      message: "Invalid patch request: check syntax of patch specification."
    };
  }

  const partitionKey = getPartitionFromHeader(req);

  const result = patchOperation(collection, {
    id: docId,
    partitionKey,
    ifMatch: req.headers["if-match"],
    operations,
    condition: Array.isArray(body) ? undefined : body.condition
  });

  res.statusCode = result.statusCode;
  return result.body;
};

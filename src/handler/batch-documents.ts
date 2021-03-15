import * as http from "http";
import * as documentOperations from "./_document-operations";
import Account from "../account";
import Collection from "../account/collection";
import json from "../json";
import trueHeader from "../true-header";
import { BulkOperationType } from "../types";

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId,
    collId
  }: {
    dbId: string;
    collId: string;
  }
) => {
  const body = await json(req);
  const isAtomic = trueHeader(req, "x-ms-cosmos-batch-atomic");
  const continueOnError = trueHeader(
    req,
    "x-ms-cosmos-batch-continue-on-error"
  );
  const collection = account.database(dbId).collection(collId);
  if (!collection.read()) {
    res.statusCode = 404;
    return {};
  }

  if (!Array.isArray(body)) {
    res.statusCode = 400;
    return { message: "Invalid request body" };
  }

  const responseBody = [];
  let failed = false;

  for (let i = 0, l = body.length; i < l; i += 1) {
    const input = body[i];
    if (failed && !continueOnError) {
      responseBody.push({ statusCode: 424, requestCharge: 0 });
      // eslint-disable-next-line no-continue
      continue;
    }

    const operationType = input ? input.operationType : null;
    let result: documentOperations.OperationResult | undefined;

    switch (operationType) {
      case BulkOperationType.Create:
        result = documentOperations.createOperation(collection, input);
        break;
      case BulkOperationType.Upsert:
        result = documentOperations.upsertOperation(collection, input);
        break;
      case BulkOperationType.Read:
        result = documentOperations.readOperation(collection, input);
        break;
      case BulkOperationType.Delete:
        result = documentOperations.deleteOperation(collection, input);
        break;
      case BulkOperationType.Replace:
        result = documentOperations.replaceOperation(collection, input);
        break;
      default:
        res.statusCode = 400;
        return {
          message: `Operation type '${operationType}' is not supported in Batch.`
        };
    }

    failed = result.statusCode >= 400;

    if (failed) {
      responseBody.push({
        statusCode: result.statusCode,
        requestCharge: 0
      });
    } else {
      responseBody.push({
        statusCode: result.statusCode,
        requestCharge: 1,
        eTag: result.body ? result.body._etag : undefined,
        resourceBody: result.body
      });
    }
  }

  return responseBody;
};

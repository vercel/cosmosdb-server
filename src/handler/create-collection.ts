import * as http from "http";
import Account from "../account";
import json from "../json";

const INDEX_ORDERS = new Set(["ascending", "descending"]);

function validateCompositeIndexes(compositeIndexes: any) {
  if (!Array.isArray(compositeIndexes)) {
    return { message: "One of the specified inputs is invalid" };
  }

  for (let i = 0, l = compositeIndexes.length; i < l; i += 1) {
    const indexes = compositeIndexes[i];
    if (!Array.isArray(indexes)) {
      return { message: "One of the specified inputs is invalid" };
    }

    if (indexes.length < 2) {
      return {
        message: `The composite index at 'indexingPolicy.additionalIndexes.composite['${i}']' must have at least 2 paths.`
      };
    }

    const paths = new Set();
    for (let j = 0, ll = indexes.length; j < ll; j += 1) {
      const index = indexes[j];
      if (typeof index !== "object" || Array.isArray(index) || !index) {
        return { message: "One of the specified inputs is invalid" };
      }

      if (!/^\/[^/]+/.test(index.path)) {
        return {
          message: `The indexing path '${index.path ||
            ""}' could not be accepted. Please ensure that the path is a valid path. Common errors include invalid characters or absence of quotes around labels.`
        };
      }

      if (paths.has(index.path)) {
        return {
          message: `The following path '${index.path}' was specified more than once in 'additionalIndexes.composite[${i}][${j}]'. Remove the duplicated field.`
        };
      }

      paths.add(index.path);

      if (index.order && !INDEX_ORDERS.has(index.order)) {
        return {
          message: `The composite order '${index.order}' is invalid. Choose between 'ascending' and 'descending'.`
        };
      }
    }
  }

  return null;
}

export default async (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  {
    dbId
  }: {
    dbId: string;
  }
) => {
  const body = await json(req);
  if (!body.id) {
    res.statusCode = 400;
    return { message: "missing id" };
  }

  if (body.partitionKey && !Array.isArray(body.partitionKey.paths)) {
    res.statusCode = 400;
    return { message: "invalid partitionKey" };
  }

  if (body.indexingPolicy && body.indexingPolicy.compositeIndexes) {
    const invalid = validateCompositeIndexes(
      body.indexingPolicy.compositeIndexes
    );
    if (invalid) {
      res.statusCode = 400;
      return invalid;
    }
  }

  const database = account.database(dbId);
  if (!database.read()) {
    res.statusCode = 404;
    return {};
  }

  if (database.collection(body.id).read()) {
    res.statusCode = 409;
    return { message: "conflict" };
  }

  res.statusCode = 201;
  return database.collections.create(body);
};

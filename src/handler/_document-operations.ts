import Collection from "../account/collection";
import { parsePartitionKey } from "../utils/get-partition-from-header";
import {
  CreateOperationInput,
  DeleteOperationInput,
  JSONObject,
  ReadOperationInput,
  ReplaceOperationInput,
  UpsertOperationInput
} from "../types";

export interface OperationResult {
  statusCode: number;
  body?: JSONObject;
}

export function createOperation(
  collection: Collection,
  input: CreateOperationInput
): OperationResult {
  if (!input.resourceBody || !input.resourceBody.id) {
    return {
      statusCode: 400,
      body: { message: "missing id" }
    };
  }

  let body;
  try {
    body = collection.documents.create(input.resourceBody);
  } catch (err) {
    if (err.conflict) {
      return {
        statusCode: 409,
        body: { code: "Conflict", message: err.message }
      };
    }

    throw err;
  }

  return {
    statusCode: 201,
    body
  };
}

export function deleteOperation(
  collection: Collection,
  input: DeleteOperationInput
): OperationResult {
  const partitionKey = parsePartitionKey(input.partitionKey, input.id);
  const data = collection.document(input.id, partitionKey).read();
  if (!data) {
    return {
      statusCode: 404,
      body: {}
    };
  }

  if (input.ifMatch && input.ifMatch !== data._etag) {
    return {
      statusCode: 412,
      body: {
        code: "PreconditionFailed",
        message:
          "Operation cannot be performed because one of the specified precondition is not met."
      }
    };
  }

  collection.documents.delete(input.id, partitionKey);

  return { statusCode: 204 };
}

export function readOperation(
  collection: Collection,
  input: ReadOperationInput
): OperationResult {
  const partitionKey = parsePartitionKey(input.partitionKey, input.id);
  const data = collection.document(input.id, partitionKey).read();
  if (!data) {
    return {
      statusCode: 404,
      body: {
        code: "NotFound",
        message: "Entity with the specified id does not exist in the system.,"
      }
    };
  }

  return {
    statusCode: 200,
    body: data
  };
}

export function replaceOperation(
  collection: Collection,
  input: ReplaceOperationInput
): OperationResult {
  if (!input.resourceBody || !input.resourceBody.id) {
    return {
      statusCode: 400,
      body: { message: "missing id" }
    };
  }

  const { id } = input.resourceBody;
  const partitionKey = parsePartitionKey(input.partitionKey, id as string);
  const data = collection.document(id as string, partitionKey).read();
  if (!data) {
    return {
      statusCode: 404,
      body: {}
    };
  }

  if (input.ifMatch && input.ifMatch !== data._etag) {
    return {
      statusCode: 412,
      body: {
        code: "PreconditionFailed",
        message:
          "Operation cannot be performed because one of the specified precondition is not met."
      }
    };
  }

  let body;
  try {
    body = collection.documents.replace(input.resourceBody, data);
  } catch (error) {
    if (error.badRequest) {
      return {
        statusCode: 400,
        body: {
          code: "BadRequest",
          message: error.message
        }
      };
    }
    if (error.conflict) {
      return {
        statusCode: 409,
        body: {
          code: "Conflict",
          message: error.message
        }
      };
    }

    throw error;
  }

  return { statusCode: 200, body };
}

export function upsertOperation(
  collection: Collection,
  input: UpsertOperationInput
): OperationResult {
  if (!input.resourceBody || !input.resourceBody.id) {
    return {
      statusCode: 400,
      body: { message: "missing id" }
    };
  }

  const { id } = input.resourceBody;
  const partitionKey = parsePartitionKey(input.partitionKey, id as string);
  const data = collection.document(id as string, partitionKey).read();

  if (input.ifMatch) {
    if (data && input.ifMatch !== data._etag) {
      return {
        statusCode: 412,
        body: {
          code: "PreconditionFailed",
          message:
            "Operation cannot be performed because one of the specified precondition is not met."
        }
      };
    }
  }

  const body = collection.documents.upsert(input.resourceBody);
  return {
    statusCode: data ? 200 : 201,
    body
  };
}

import Collection from "../account/collection";
import { parsePartitionKey } from "../utils/get-partition-from-header";
import { JSONObject, PatchOperation, PatchOperationInput } from "../types";

export interface PatchOperationResult {
  statusCode: number;
  body?: JSONObject;
}

// When doing Patch updates, we specify the JSON path to the property we want to update.
// This function is used to get the value at the specified path.
// It also supports creating the path if it doesn't exist (for set operations).
function getValueAtPath(
  obj: any,
  pathSegments: string[],
  createPath = false
): any {
  let current = obj;

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i];

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        if (createPath) {
          throw new Error(
            "Add Operation can only create a child object of an existing node (array or object) and can't create path recursively."
          );
        }
        return undefined;
      }
      current = current[index];
    } else if (typeof current === "object" && current !== null) {
      if (createPath && !(segment in current)) {
        if (i === pathSegments.length - 1) {
          // This is the last segment, we don't need to create it here
          return current;
        }
        throw new Error(
          "Add Operation can only create a child object of an existing node (array or object) and can't create path recursively."
        );
      }
      current = current[segment];
    } else {
      if (createPath) {
        throw new Error(
          "Add Operation can only create a child object of an existing node (array or object) and can't create path recursively."
        );
      }
      return undefined;
    }

    if (current === undefined && !createPath) {
      return undefined;
    }
  }

  return current;
}

function removePatchOperation(
  document: JSONObject,
  pathSegments: string[]
): JSONObject {
  if (pathSegments.length === 0) {
    throw new Error("Cannot remove root document.");
  }

  const result = JSON.parse(JSON.stringify(document));
  const parentPath = pathSegments.slice(0, -1);
  const key = pathSegments[pathSegments.length - 1];

  const parent = getValueAtPath(result, parentPath);

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10);
    if (Number.isNaN(index) || index < 0 || index >= parent.length) {
      throw new Error("Index to operate on is out of array bounds.");
    }
    parent.splice(index, 1);
  } else if (typeof parent === "object" && parent !== null) {
    if (!(key in parent)) {
      throw new Error("Node to be removed is absent.");
    }
    delete parent[key];
  } else {
    throw new Error("Node to be removed is absent.");
  }

  return result;
}

function replacePatchOperation(
  document: JSONObject,
  pathSegments: string[],
  value: any
): JSONObject {
  if (pathSegments.length === 0) {
    throw new Error("Cannot replace root document.");
  }

  const result = JSON.parse(JSON.stringify(document));
  const parentPath = pathSegments.slice(0, -1);
  const key = pathSegments[pathSegments.length - 1];

  const parent = getValueAtPath(result, parentPath);

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10);
    if (Number.isNaN(index) || index < 0 || index >= parent.length) {
      throw new Error("Index to operate on is out of array bounds.");
    }
    parent[index] = value;
  } else if (typeof parent === "object" && parent !== null) {
    if (!(key in parent)) {
      throw new Error("Node to be replaced is absent.");
    }
    parent[key] = value;
  } else {
    throw new Error("Node to be replaced is absent.");
  }

  return result;
}

function setPatchOperation(
  document: JSONObject,
  pathSegments: string[],
  value: any
): JSONObject {
  if (pathSegments.length === 0) {
    throw new Error("Cannot set root document.");
  }

  const result = JSON.parse(JSON.stringify(document));
  const parentPath = pathSegments.slice(0, -1);
  const key = pathSegments[pathSegments.length - 1];

  const parent = getValueAtPath(result, parentPath, true);

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10);
    if (Number.isNaN(index) || index < 0) {
      throw new Error("Invalid array index.");
    }
    if (index >= parent.length) {
      throw new Error("Index to operate on is out of array bounds.");
    }
    parent[index] = value;
  } else if (typeof parent === "object" && parent !== null) {
    parent[key] = value;
  } else {
    throw new Error(
      "Set Operation can only create a child object of an existing node (array or object)."
    );
  }

  return result;
}

function addPatchOperation(
  document: JSONObject,
  pathSegments: string[],
  value: any
): JSONObject {
  if (pathSegments.length === 0) {
    throw new Error("Cannot add root document.");
  }

  const result = JSON.parse(JSON.stringify(document));
  const parentPath = pathSegments.slice(0, -1);
  const key = pathSegments[pathSegments.length - 1];

  const parent = getValueAtPath(result, parentPath, true);

  if (Array.isArray(parent)) {
    if (key === "-") {
      // Special case: append to end of array
      parent.push(value);
    } else {
      const index = parseInt(key, 10);
      if (Number.isNaN(index) || index < 0) {
        throw new Error("Invalid array index.");
      }
      if (index > parent.length) {
        throw new Error("Index to operate on is out of array bounds.");
      }
      // Insert at index (or append if index === length)
      parent.splice(index, 0, value);
    }
  } else if (typeof parent === "object" && parent !== null) {
    // For objects, add/replace the property
    parent[key] = value;
  } else {
    throw new Error(
      "Add Operation can only create a child object of an existing node (array or object)."
    );
  }

  return result;
}

function incrPatchOperation(
  document: JSONObject,
  pathSegments: string[],
  value: any
): JSONObject {
  if (pathSegments.length === 0) {
    throw new Error("Cannot increment root document.");
  }

  if (typeof value !== "number") {
    throw new Error("Increment value must be a number.");
  }

  const result = JSON.parse(JSON.stringify(document));
  const parentPath = pathSegments.slice(0, -1);
  const key = pathSegments[pathSegments.length - 1];

  const parent = getValueAtPath(result, parentPath, true);

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10);
    if (Number.isNaN(index) || index < 0 || index >= parent.length) {
      throw new Error("Index to operate on is out of array bounds.");
    }
    const currentValue = parent[index];
    if (typeof currentValue === "number") {
      parent[index] = currentValue + value;
    } else if (currentValue === undefined || currentValue === null) {
      parent[index] = value;
    } else {
      throw new Error("Cannot increment non-numeric value.");
    }
  } else if (typeof parent === "object" && parent !== null) {
    const currentValue = parent[key];
    if (typeof currentValue === "number") {
      parent[key] = currentValue + value;
    } else if (currentValue === undefined || currentValue === null) {
      parent[key] = value;
    } else {
      throw new Error("Cannot increment non-numeric value.");
    }
  } else {
    throw new Error(
      "Increment Operation can only operate on numeric properties of existing nodes (array or object)."
    );
  }

  return result;
}

function movePatchOperation(
  document: JSONObject,
  pathSegments: string[],
  from?: string
): JSONObject {
  if (!from || typeof from !== "string" || !from.startsWith("/")) {
    throw new Error("Move operation requires a valid 'from' path.");
  }

  if (from === `/${pathSegments.join("/")}`) {
    throw new Error("Cannot move a value to itself.");
  }

  // Don't allow moving from system properties
  if (from.startsWith("/_")) {
    const systemProperty = from.split("/")[1];
    throw new Error(`Can't move from system property ${systemProperty}.`);
  }

  // Check if 'path' is a child of 'from'
  const fromPath = `/${pathSegments.join("/")}`;
  if (fromPath.startsWith(`${from}/`)) {
    throw new Error("Cannot move a value to a child of itself.");
  }

  const fromSegments = from
    .slice(1)
    .split("/")
    .map(segment => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

  // First, get the value from the source location
  const result = JSON.parse(JSON.stringify(document));
  const sourceValue = getValueAtPath(result, fromSegments);

  if (sourceValue === undefined) {
    throw new Error("Source location for move operation does not exist.");
  }

  // Remove the value from the source location
  const removedResult = removePatchOperation(result, fromSegments);

  // Add the value to the target location
  return addPatchOperation(removedResult, pathSegments, sourceValue);
}

function applySinglePatchOperation(
  document: JSONObject,
  operation: PatchOperation
): JSONObject {
  const { op, path, value, from } = operation;

  if (!path || typeof path !== "string" || !path.startsWith("/")) {
    throw new Error("Invalid path in patch operation.");
  }

  // Don't allow patching system properties
  if (path.startsWith("/_")) {
    const systemProperty = path.split("/")[1];
    throw new Error(`Can't patch system property ${systemProperty}.`);
  }

  const pathSegments = path
    .slice(1)
    .split("/")
    .map(segment =>
      // Unescape JSON Pointer characters (RFC 6901, which is the standard used by
      // JSON Patch operations)
      segment.replace(/~1/g, "/").replace(/~0/g, "~")
    );

  switch (op) {
    case "remove":
      return removePatchOperation(document, pathSegments);
    case "replace":
      return replacePatchOperation(document, pathSegments, value);
    case "set":
      return setPatchOperation(document, pathSegments, value);
    case "add":
      return addPatchOperation(document, pathSegments, value);
    case "incr":
      return incrPatchOperation(document, pathSegments, value);
    case "move":
      return movePatchOperation(document, pathSegments, from);
    default:
      throw new Error(`Unsupported patch operation: ${op}`);
  }
}

function applyPatchOperations(
  document: JSONObject,
  operations: PatchOperation[]
): JSONObject {
  if (operations.length > 10) {
    throw new Error("The number of patch operations can't exceed 10.");
  }

  let result = document;
  for (let i = 0; i < operations.length; i += 1) {
    const operation = operations[i];
    try {
      result = applySinglePatchOperation(result, operation);
    } catch (error) {
      throw new Error(`For Operation(${i}): ${error.message}`);
    }
  }

  return result;
}

export function patchOperation(
  collection: Collection,
  input: PatchOperationInput
): PatchOperationResult {
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

  // Check conditional patch
  if (input.condition) {
    try {
      // Build a complete query to check the condition against the specific document
      let conditionQuery: string;

      // Handle both formats: full query vs condition clause
      if (input.condition.toLowerCase().includes("select")) {
        // Already a complete query
        conditionQuery = input.condition;
      } else {
        // Just a condition clause, build a complete query
        const conditionClause = input.condition.toLowerCase().trim();

        if (conditionClause.startsWith("from c where")) {
          // Azure SDK format: "from c where NOT IS_DEFINED(c.newImproved)"
          const whereClause = conditionClause
            .substring("from c where".length)
            .trim();
          conditionQuery = `SELECT * FROM c WHERE c.id = @id AND (${whereClause})`;
        } else if (conditionClause.startsWith("where")) {
          // Alternative format: "where c.status = 'active'"
          const whereClause = conditionClause.substring("where".length).trim();
          conditionQuery = `SELECT * FROM c WHERE c.id = @id AND (${whereClause})`;
        } else {
          // Legacy format: "FROM c WHERE c.status = 'active'"
          conditionQuery = `SELECT * ${input.condition} AND c.id = @id`;
        }
      }

      const query = collection.documents.query(
        {
          query: conditionQuery,
          parameters: [{ name: "@id", value: input.id }]
        },
        {}
      );

      if (query.result.length === 0) {
        return {
          statusCode: 412,
          body: {
            code: "PreconditionFailed",
            message:
              "Condition specified in the patch request is not satisfied."
          }
        };
      }
    } catch (err) {
      return {
        statusCode: 400,
        body: {
          code: "BadRequest",
          message: "Invalid condition in patch request."
        }
      };
    }
  }

  let patchedData: JSONObject;
  try {
    patchedData = applyPatchOperations({ ...data }, input.operations);
  } catch (error) {
    return {
      statusCode: 400,
      body: {
        code: "BadRequest",
        message: error.message
      }
    };
  }

  // Use the replace operation to update the document
  try {
    const body = collection.documents.replace(patchedData, data);
    return { statusCode: 200, body };
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
}

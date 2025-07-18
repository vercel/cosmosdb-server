export type PartitionValue = any;

// eslint-disable-next-line no-use-before-define
export interface JSONArray extends ArrayLike<JSONValue> {}

export interface JSONObject {
  // eslint-disable-next-line no-use-before-define
  [key: string]: JSONValue;
}

export type JSONValue =
  | boolean
  | number
  | string
  | null
  | JSONArray
  | JSONObject;

// eslint-disable-next-line
export const BulkOperationType = {
  Create: "Create",
  Upsert: "Upsert",
  Read: "Read",
  Delete: "Delete",
  Replace: "Replace",
  Patch: "Patch"
};

export interface CreateOperationInput {
  operationType?: typeof BulkOperationType.Create;
  resourceBody: JSONObject;
}

export interface UpsertOperationInput {
  partitionKey?: string;
  ifMatch?: string;
  ifNoneMatch?: string;
  operationType?: typeof BulkOperationType.Upsert;
  resourceBody: JSONObject;
}

export interface ReadOperationInput {
  partitionKey?: string;
  operationType?: typeof BulkOperationType.Read;
  id: string;
}

export interface DeleteOperationInput {
  partitionKey?: string;
  ifMatch?: string;
  ifNoneMatch?: string;
  operationType?: typeof BulkOperationType.Delete;
  id: string;
}

export interface ReplaceOperationInput {
  partitionKey?: string;
  ifMatch?: string;
  ifNoneMatch?: string;
  operationType?: typeof BulkOperationType.Replace;
  resourceBody: JSONObject;
}

export interface PatchOperation {
  op: "remove" | "replace" | "set" | "add" | "incr" | "move";
  path: string;
  value?: any;
  from?: string; // Required for move operations
}

export interface PatchOperationInput {
  partitionKey?: string;
  ifMatch?: string;
  ifNoneMatch?: string;
  operationType?: typeof BulkOperationType.Patch;
  id: string;
  operations: PatchOperation[];
  condition?: string;
}

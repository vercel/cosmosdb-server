// Derives from:
// https://github.com/Azure/azure-cosmos-js/blob/c1be5cc0fcc80670ae6c2a6b5f133530e7889db9/src/common/resourceId.ts
// https://github.com/Azure/azure-cosmosdb-java/blob/v2.6.0/commons/src/main/java/com/microsoft/azure/cosmosdb/internal/ResourceId.java

/* eslint-disable no-bitwise, no-plusplus */
import { Uint64LE } from "int64-buffer";

export const EMPTY = "0"; // TODO: This is kinda hacky

export default class ResourceId {
  public static Length = 20;

  public static OfferIdLength = 3;

  public static DocumentByte = 0;

  public static StoredProcedureByte = 8;

  public static TriggerByte = 7;

  public static UserDefinedFunctionByte = 6;

  public static ConflictByte = 4;

  public static PartitionKeyRangeByte = 5;

  public offer: string;

  public database: string;

  public documentCollection: string;

  public storedProcedure: string;

  public trigger: string;

  public userDefinedFunction: string;

  public document: string;

  public partitionKeyRange: string;

  public user: string;

  public conflict: string;

  public permission: string;

  public attachment: string;

  constructor() {
    this.offer = EMPTY;
    this.database = EMPTY;
    this.documentCollection = EMPTY;
    this.storedProcedure = EMPTY;
    this.trigger = EMPTY;
    this.userDefinedFunction = EMPTY;
    this.document = EMPTY;
    this.partitionKeyRange = EMPTY;
    this.user = EMPTY;
    this.conflict = EMPTY;
    this.permission = EMPTY;
    this.attachment = EMPTY;
  }

  public static parse(id: string) {
    const pair = ResourceId.tryParse(id);

    if (!pair[0]) {
      throw new Error(`invalid resource id ${id}`);
    }
    return pair[1];
  }

  public static newDatabaseId(dbId: string) {
    const resourceId = new ResourceId();
    resourceId.database = dbId;
    return resourceId;
  }

  public static newDocumentCollectionId(
    databaseId: string,
    collectionId: string
  ) {
    const dbId = ResourceId.parse(databaseId);

    const collectionResourceId = new ResourceId();
    collectionResourceId.database = dbId.database;
    collectionResourceId.documentCollection = collectionId;

    return collectionResourceId;
  }

  public static newUserId(databaseId: string, userId: string) {
    const dbId = ResourceId.parse(databaseId);

    const userResourceId = new ResourceId();
    userResourceId.database = dbId.database;
    userResourceId.user = userId;

    return userResourceId;
  }

  public static newPermissionId(userId: string, permissionId: string) {
    const usrId = ResourceId.parse(userId);

    const permissionResourceId = new ResourceId();
    permissionResourceId.database = usrId.database;
    permissionResourceId.user = usrId.user;
    permissionResourceId.permission = permissionId;
    return permissionResourceId;
  }

  public static newAttachmentId(documentId: string, attachmentId: string) {
    const docId = ResourceId.parse(documentId);

    const attachmentResourceId = new ResourceId();
    attachmentResourceId.database = docId.database;
    attachmentResourceId.documentCollection = docId.documentCollection;
    attachmentResourceId.document = docId.document;
    attachmentResourceId.attachment = attachmentId;

    return attachmentResourceId;
  }

  public static tryParse(id: string): [boolean, ResourceId] {
    if (!id) {
      return [false, undefined];
    }

    const pair = ResourceId.verify(id);

    if (!pair[0]) {
      return [false, undefined];
    }

    const buffer = pair[1];

    const intArray = new Int8Array(buffer);

    if (buffer.length % 4 !== 0 && buffer.length !== ResourceId.OfferIdLength) {
      return [false, undefined];
    }

    const rid = new ResourceId();

    // if length < 4 bytes, the resource is an offer
    if (buffer.length === ResourceId.OfferIdLength) {
      let offer = 0;

      for (let index = 0; index < ResourceId.OfferIdLength; index++) {
        offer |= intArray[index] << (index * 8);
      }

      rid.offer = offer.toString();
      return [true, rid];
    }

    // first 4 bytes represent the database
    if (buffer.length >= 4) {
      rid.database = buffer.readUIntLE(0, 4).toString();
    }

    if (buffer.length >= 8) {
      const isCollection = (intArray[4] & 0x80) != 0;

      if (isCollection) {
        // 5th - 8th bytes represents the collection

        rid.documentCollection = buffer.readUIntLE(4, 4).toString();

        if (buffer.length >= 16) {
          // 9th - 15th bytes represent one of document, trigger, sproc, udf, conflict, pkrange
          const subCollectionResourceLower = buffer.readUIntLE(8, 4);
          const subCollectionResourceUpper = buffer.readUIntLE(12, 4);
          const subCollectionResource = new Uint64LE(subCollectionResourceUpper & 0x00FFFFFF, subCollectionResourceLower).toString();

          const type = (intArray[15] >> 4) & 0x0F;
          if (type === ResourceId.DocumentByte) {
            rid.document = subCollectionResource;

            // 16th - 20th bytes represent the attachment
            if (buffer.length === 20) {
              rid.attachment = buffer.readUIntLE(16, 4).toString();
            }
          } else if (type === ResourceId.StoredProcedureByte) {
            rid.storedProcedure = subCollectionResource;
          } else if (type === ResourceId.TriggerByte) {
            rid.trigger = subCollectionResource;
          } else if (type === ResourceId.UserDefinedFunctionByte) {
            rid.userDefinedFunction = subCollectionResource;
          } else if (type === ResourceId.ConflictByte) {
            rid.conflict = subCollectionResource;
          } else if (type === ResourceId.PartitionKeyRangeByte) {
            rid.partitionKeyRange = subCollectionResource;
          } else {
            return [false, rid];
          }
        } else if (buffer.length !== 8) {
          return [false, rid];
        }
      } else {
        // 5th - 8th bytes represents the user

        const rawUser = buffer.readUIntLE(4, 4);
        rid.user = (((rawUser & 0xFFFFFF00) >> 1) | (rawUser & 0x0000007F)).toString();

        // 9th - 15th bytes represent the permission
        if (buffer.length === 16) {
          const upper = buffer.readUIntLE(8, 4);
          const lower = buffer.readUIntLE(12, 4);
          rid.permission = new Uint64LE(upper, lower).toString();
        } else if (buffer.length !== 8) {
          return [false, rid];
        }
      }
    }

    return [true, rid];
  }

  public static verify(id: string): [boolean, Buffer] {
    if (!id) {
      throw new Error(`invalid resource id ${id}`);
    }

    let buffer = ResourceId.fromBase64String(id);
    if (!buffer || buffer.length > ResourceId.Length) {
      buffer = undefined;
      return [false, buffer];
    }

    return [true, buffer];
  }

  public static verifyBool(id: string) {
    return ResourceId.verify(id)[0];
  }

  public static fromBase64String(s: string) {
    return Buffer.from(s.replace("-", "/"), "base64");
  }

  public static toBase64String(buffer: Buffer) {
    return buffer.toString("base64");
  }

  public isDatabaseId() {
    return (
      this.database !== EMPTY &&
      (this.documentCollection === EMPTY && this.user === EMPTY)
    );
  }

  public getDatabaseId() {
    const rid = new ResourceId();
    rid.database = this.database;
    return rid;
  }

  public getDocumentCollectionId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    return rid;
  }

  /*
  public getUniqueDocumentCollectionId() {
    const db = BigInt(this.database);
    const coll = BigInt(this.documentCollection);
    return db
      .shiftLeft(32)
      .or(coll)
      .toString();
  }
*/
  public getStoredProcedureId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.storedProcedure = this.storedProcedure;
    return rid;
  }

  public getTriggerId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.trigger = this.trigger;
    return rid;
  }

  public getUserDefinedFunctionId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.userDefinedFunction = this.userDefinedFunction;
    return rid;
  }

  public getConflictId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.conflict = this.conflict;
    return rid;
  }

  public getDocumentId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.document = this.document;
    return rid;
  }

  public getPartitonKeyRangeId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.partitionKeyRange = this.partitionKeyRange;
    return rid;
  }

  public getUserId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.user = this.user;
    return rid;
  }

  public getPermissionId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.user = this.user;
    rid.permission = this.permission;
    return rid;
  }

  public getAttachmentId() {
    const rid = new ResourceId();
    rid.database = this.database;
    rid.documentCollection = this.documentCollection;
    rid.document = this.document;
    rid.attachment = this.attachment;
    return rid;
  }

  public getOfferId() {
    const rid = new ResourceId();
    rid.offer = this.offer;
    return rid;
  }

  public getValue() {
    let len = 0;
    if (this.offer !== EMPTY) {
      len += ResourceId.OfferIdLength;
    } else if (this.database !== EMPTY) {
      len += 4;
    }
    if (this.documentCollection !== EMPTY || this.user !== EMPTY) {
      len += 4;
    }
    if (
      this.document !== EMPTY ||
      this.permission !== EMPTY ||
      this.storedProcedure !== EMPTY ||
      this.trigger !== EMPTY ||
      this.userDefinedFunction !== EMPTY ||
      this.conflict !== EMPTY ||
      this.partitionKeyRange !== EMPTY
    ) {
      len += 8;
    }
    if (this.attachment !== EMPTY) {
      len += 4;
    }

    const buffer = Buffer.alloc(len);
    buffer.fill(0);

    if (this.offer !== EMPTY) {
      buffer.writeUIntLE(Number(this.offer), 0, ResourceId.OfferIdLength);
    } else if (this.database !== EMPTY) {
      buffer.writeUIntLE(Number(this.database), 0, 4);
    }

    if (this.documentCollection !== EMPTY) {
      const rawCollection = Number(this.documentCollection);
      buffer.writeUIntLE(((rawCollection & 0x7FFFFF80) << 1) | 0x80 | (rawCollection & 0x0000007F), 4, 4);

      let value: string;
      let type: number;
      if (this.storedProcedure !== EMPTY) {
        value = this.storedProcedure;
        type = ResourceId.StoredProcedureByte;
      }
      else if (this.trigger !== EMPTY) {
        value = this.trigger;
        type = ResourceId.TriggerByte;
      }
      else if (this.userDefinedFunction !== EMPTY) {
        value = this.userDefinedFunction;
        type = ResourceId.UserDefinedFunctionByte;
      }
      else if (this.conflict !== EMPTY) {
        value = this.conflict;
        type = ResourceId.ConflictByte;
      }
      else if (this.document !== EMPTY) {
        value = this.document;
        type = ResourceId.DocumentByte;
      }
      else if (this.partitionKeyRange !== EMPTY) {
        value = this.partitionKeyRange;
        type = ResourceId.PartitionKeyRangeByte;
      }

      if (value && type) {
        new Uint64LE(value).toBuffer().copy(buffer, 8, 0, 7);
        buffer[15] = type << 4;
      }

      if (this.attachment !== EMPTY)
        buffer.writeUIntLE(Number(this.attachment), 16, 4);
    }
    else if (this.user !== EMPTY) {
      const rawUser = Number(this.user);
      buffer.writeUIntLE(((rawUser & 0x7FFFFF80) << 1) | 0x00 | (rawUser & 0x0000007F), 4, 4);

      if (this.permission !== EMPTY)
        new Uint64LE(this.permission).toBuffer().copy(buffer, 8, 0, 8);
    }

    return buffer;
  }

  public toString() {
    return ResourceId.toBase64String(this.getValue());
  }
}

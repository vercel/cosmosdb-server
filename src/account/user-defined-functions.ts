/* eslint-disable class-methods-use-this, no-bitwise, no-underscore-dangle, no-use-before-define */
import Collection from "./collection";
import ItemObject from "./item-object";
import Items from "./items";
import UserDefinedFunction from "./user-defined-function";
import ResourceId from "./resource-id";

function define(body: string) {
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict";return (${body})`)();
}

export default class UserDefinedFunctions extends Items<
  Collection,
  UserDefinedFunction
> {
  functions: {
    [x: string]: any;
  };

  constructor(parent: Collection) {
    super(parent, ["/id"]);
    this.functions = {};
  }

  _newItem(data: ItemObject | undefined | null) {
    return new UserDefinedFunction(data);
  }

  _rid(id: number) {
    const idBuffer = Buffer.alloc(8, 0);
    idBuffer.writeInt32LE(id, 0);
    idBuffer.writeInt8(ResourceId.UserDefinedFunctionByte << 4, 7);
    const idString = ResourceId.bigNumberReadIntBE(idBuffer, 0, 8).toString();

    const collection = this._parent.read();
    const rid = ResourceId.parse(collection._rid);
    rid.userDefinedFunction = idString;
    return rid.toString();
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/udfs/${rid}`;
  }

  replace({ id, body }: { id: string; body: string }) {
    const oldData = this._item("/id", id, id).read();
    if (!oldData) {
      throw new Error("does not exist");
    }

    this.functions[oldData.id] = define(body);
    return super.replace({ id, body }, oldData);
  }

  create({ id, body }: { id: string; body: string }) {
    this.functions[id] = define(body);
    return super.create({ id, body });
  }

  upsert({ id, body }: { id: string; body: string }) {
    this.functions[id] = define(body);
    return super.upsert({ id, body });
  }

  delete(idOrRid: string) {
    const data = this._item("/id", idOrRid, idOrRid).read();
    if (!data) {
      throw new Error("does not exist");
    }

    delete this.functions[data.id];
    return super.delete(idOrRid, idOrRid);
  }
}

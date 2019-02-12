// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";
import type Collection from "./collection";

const Items = require("./items");
const UserDefinedFunction = require("./user-defined-function");

function define(body) {
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict";return (${body})`)();
}

module.exports = class UserDefinedFunctions extends Items<
  Collection,
  UserDefinedFunction
> {
  functions: Object;

  constructor(parent: Collection) {
    super(parent);
    this.functions = {};
  }

  _newItem(data: ?ItemObject) {
    return new UserDefinedFunction(data);
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/udfs/${rid}`;
  }

  replace({ id, body }: { id: string, body: string }) {
    const oldData = this._item(id).read();
    if (!oldData) {
      throw new Error("does not exist");
    }

    this.functions[oldData.id] = define(body);
    return super.replace({ id, body });
  }

  create({ id, body }: { id: string, body: string }) {
    this.functions[id] = define(body);
    return super.create({ id, body });
  }

  upsert({ id, body }: { id: string, body: string }) {
    this.functions[id] = define(body);
    return super.upsert({ id, body });
  }

  delete(idOrRid: string) {
    const data = this._item(idOrRid).read();
    if (!data) {
      throw new Error("does not exist");
    }

    delete this.functions[data.id];
    return super.delete(idOrRid);
  }
};

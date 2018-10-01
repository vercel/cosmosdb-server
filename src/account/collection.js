// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";

const Item = require("./item");
const Documents = require("./documents");
const UserDefinedFunctions = require("./user-defined-functions");

module.exports = class Collection extends Item {
  documents: Documents;

  userDefinedFunctions: UserDefinedFunctions;

  constructor(data: ?ItemObject) {
    super(data);
    this.documents = new Documents(this);
    this.userDefinedFunctions = new UserDefinedFunctions(this);
  }

  document(idOrRid: string) {
    return this.documents._item(idOrRid);
  }

  userDefinedFunction(idOrRid: string) {
    return this.userDefinedFunctions._item(idOrRid);
  }
};

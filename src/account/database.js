// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";

const Collections = require("./collections");
const Item = require("./item");

module.exports = class Database extends Item {
  collections: Collections;

  constructor(data: ?ItemObject) {
    super(data);
    this.collections = new Collections(this);
  }

  collection(idOrRid: string) {
    return this.collections._item(idOrRid);
  }
};

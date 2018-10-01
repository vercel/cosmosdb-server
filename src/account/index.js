// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle */
const Databases = require("./databases");
const Item = require("./item");

module.exports = class Account extends Item {
  databases: Databases;

  constructor() {
    super({
      id: "",
      _etag: "",
      _rid: "",
      _self: "",
      _ts: 0
    });
    this.databases = new Databases(this);
  }

  database(idOrRid: string) {
    return this.databases._item(idOrRid);
  }
};

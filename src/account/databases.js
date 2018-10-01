// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";

const Account = require("./");
const Database = require("./database");
const Items = require("./items");

module.exports = class Databases extends Items<Account, Database> {
  _newItem(data: ?ItemObject) {
    return new Database(data);
  }

  _self(rid: string) {
    return `/dbs/${rid}`;
  }
};

/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */

import Account from ".";
import Database from "./database";
import ItemObject from "./item-object";
import Items from "./items";

export default class Databases extends Items<Account, Database> {
  _newItem(data: ItemObject | undefined | null) {
    return new Database(data);
  }

  _self(rid: string) {
    return `/dbs/${rid}`;
  }
}

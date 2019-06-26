/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import ItemObject from "./item-object";
import Item from "./item";
import Documents from "./documents";
import UserDefinedFunctions from "./user-defined-functions";

export default class Collection extends Item {
  documents: Documents;

  userDefinedFunctions: UserDefinedFunctions;

  constructor(data: ItemObject | undefined | null) {
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
}

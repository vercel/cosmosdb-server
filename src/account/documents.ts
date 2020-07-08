/* eslint-disable class-methods-use-this, no-bitwise, no-underscore-dangle, no-use-before-define */
import Collection from "./collection";
import Document from "./document";
import ItemObject from "./item-object";
import Items from "./items";
import ResourceId from "./resource-id";

export default class Documents extends Items<Collection, Document> {
  _newItem(data: ItemObject | undefined | null) {
    return new Document(data);
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/docs/${rid}/`;
  }

  _rid(id: number) {
    const idBuffer = Buffer.alloc(8, 0);
    idBuffer.writeInt32LE(id, 0);
    idBuffer.writeInt8(ResourceId.DocumentByte << 4, 7);
    const idString = ResourceId.bigNumberReadIntBE(idBuffer, 0, 8).toString();

    const collection = this._parent.read();
    const rid = ResourceId.parse(collection._rid);
    rid.document = idString;
    return rid.toString();
  }

  _userDefinedFunctions() {
    const collection = this._parent.read();
    if (!collection) return null;

    return this._parent.userDefinedFunctions.functions;
  }
}

/* eslint-disable no-underscore-dangle */

interface ItemObject {
  id: string;
  indexingPolicy?: {
    indexingMode: string | undefined | null;
  };
  partitionKey?: {
    paths: string[];
  };
  uniqueKeyPolicy?: {
    uniqueKeys: { paths: string[] }[];
  };
  _etag?: string;
  _rid: string;
  _self: string;
  _ts?: number;
  [key: string]: any;
}

// eslint-disable-next-line no-undef
export default ItemObject;

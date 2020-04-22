/* eslint-disable no-underscore-dangle */

type ItemObject = {
  id: string;
  indexingPolicy?: {
    indexingMode: string | undefined | null;
  };
  partitionKey?: {
    paths: string[];
  };
  _etag?: string;
  _rid: string;
  _self: string;
  _ts?: number;
};

// eslint-disable-next-line no-undef
export default ItemObject;

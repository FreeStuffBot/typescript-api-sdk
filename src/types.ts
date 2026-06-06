import { Bitfield } from './bitfield';


//#region Dummy

export type CompatibilityDate = string;
export type JsonSchema = {
  type: 'object',
  properties: Record<string, unknown>,
};

//#endregion
//#region Data Models

export type Channel
  = 'keep'
  | 'timed'
  | 'other'
  | 'prime'
  | 'gamepass'
  | 'mobile'
  | 'news'
  | 'unknown'
  | 'assets'
  | 'debug';

export type ProductPrice = {
  /** @see https://www.iban.com/currency-codes */
  currency: string,
  oldValue: number,
  newValue: number,
  converted: boolean,
};

export type ProductKind
  = 'game'
  | 'dlc'
  | 'loot'
  | 'software'
  | 'art'
  | 'ost'
  | 'book'
  | 'storeitem'
  | 'other';

export type ProductImageFlags = Bitfield<
  'PROXIED'
  | 'AR_WIDE'
  | 'AR_SQUARE'
  | 'AR_TALL'
  | 'TP_PROMO'
  | 'TP_LOGO'
  | 'TP_SHOWCASE'
  | 'TP_OTHER'
  | 'FT_WATERMARK'
  | 'FT_TAGS'
>;

export type ProductImage = {
  url: string,
  flags: ProductImageFlags,
  priority: number,
};

export type ProductUrlFlags = Bitfield<
  'ORIGINAL'
  | 'PROXIED'
  | 'TRACKING'
  | 'OPENS_IN_BROWSER'
  | 'OPENS_IN_CLIENT'
>;

export type Store
  = 'other'
  | 'steam'
  | 'epic'
  | 'humble'
  | 'gog'
  | 'origin'
  | 'ubi'
  | 'itch'
  | 'prime';

export type Platform
  = 'windows'
  | 'mac'
  | 'linux'
  | 'android'
  | 'ios'
  | 'xbox'
  | 'playstation';

export type ProductFlags = Bitfield<
  'TRASH'
  | 'THIRDPARTY'
  | 'PERMANENT'
  | 'STAFF_PICK'
  | 'FIRSTPARTY_EXCLUSIVE'
>;

export type ProductMetaKey
  = 'slug'
  | 'scraper.sources'
  | 'scraper.version'
  | 'igdb.gameid'
  | 'steam.subids'
  | 'steam.achievements'
  | 'steam.recommendations'
  | 'epic.namespace'
  | 'epic.id'
  | 'itch.creator'
  | 'prime.itemid'
  | 'prime.offerid'
  | 'prime.codegrant'
  | 'prime.direct'
  | 'prime.linkitem'
  | 'prime.fgwp'
  | 'prime.priority';

export type ProductUrl = {
  url: string,
  flags: ProductUrlFlags,
  priority: number,
  store: Store,
  platforms: Platform[],
};

export type ProductMeta = {
  key: ProductMetaKey,
  value: string,
};

export type LocalizedProductDescription = {
  lang: string,
  text: string,
};

export type Product = {
  id: number,
  title: string,
  prices: ProductPrice[],
  kind: ProductKind,
  tags: string[],
  images: ProductImage[],
  description: LocalizedProductDescription[],
  rating: number,
  copyright: string,
  until: Date | null,
  type: Channel,
  urls: ProductUrl[],
  store: Store,
  platforms: Platform[],
  flags: ProductFlags,
  notice: string,
  meta: ProductMeta[],
  staffApproved: boolean,
  updatedAt: number,
};

export type ProductApprovalStatus
  = 'approved'
  | 'published'
  | 'expired';

export type PartialProduct = Pick<
  Product,
  'id' | 'kind' | 'until' | 'type' | 'store' | 'flags'
>;

export type Announcement = {
  id: number,
  products: number[],
};

export type ResolvedAnnouncement = Announcement & {
  resolvedProducts: Product[],
};

//#endregion
//#region Events

export type FsbEventPing = {
  type: 'fsb:event:ping',
  timestamp: Date, // needs parsing
  data: {
    manual: boolean,
  },
};

export type FsbEventAnnouncementCreated = {
  type: 'fsb:event:announcement_created',
  timestamp: Date, // needs parsing
  data: ResolvedAnnouncement,
};

export type FsbEventProductUpdated = {
  type: 'fsb:event:product_updated',
  timestamp: Date, // needs parsing
  data: Product,
};

export type FsbEvent = FsbEventPing | FsbEventAnnouncementCreated | FsbEventProductUpdated;

//#endregion
//#region Static

export type FsbStaticApiV2SchemaList = {
  type: 'fsb:static:apiv2:schema_list',
  list: Array<{
    name: string,
    urn: string,
    active: boolean,
    latestVersion: CompatibilityDate,
  }>,
};

export type FsbStaticApiV2Schema = {
  type: 'fsb:static:apiv2:schema',
  schema: JsonSchema,
};

export type FsbStaticApiV2ProblemList = {
  type: 'fsb:static:apiv2:problem_list',
  list: Array<{
    urn: string,
    status: number,
    title: string,
  }>,
};

export type FsbStaticApiV2EventList = {
  type: 'fsb:static:apiv2:event_list',
  list: Array<{
    urn: Event['type'],
    description: string,
    payloadDescription: string,
    payloadSchema: JsonSchema,
  }>,
};

//#endregion

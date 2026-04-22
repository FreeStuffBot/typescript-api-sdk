import { createBitfield } from './bitfield'
import type { FsbEvent, Product, ResolvedAnnouncement } from './types';


const productFlags = {
  TRASH: 1<<0,
  THIRDPARTY: 1<<1,
  PERMANENT: 1<<2,
  STAFF_PICK: 1<<3,
  FIRSTPARTY_EXCLUSIVE: 1<<4,
};

const productUrlFlags = {
  ORIGINAL: 1<<0,
  PROXIED: 1<<1,
  TRACKING: 1<<2,
  OPENS_IN_BROWSER: 1<<3,
  OPENS_IN_CLIENT: 1<<4,
};

const productImageFlags = {
  PROXIED: 1<<0,
  AR_WIDE: 1<<1,
  AR_SQUARE: 1<<2,
  AR_TALL: 1<<3,
  TP_PROMO: 1<<4,
  TP_LOGO: 1<<5,
  TP_SHOWCASE: 1<<6,
  TP_OTHER: 1<<7,
  FT_WATERMARK: 1<<8,
  FT_TAGS: 1<<9,
};

export function parseProduct(product: Record<string, unknown>): Product {
  product.until = product.until
    ? new Date(product.until as string)
    : null;
  product.flags = createBitfield(product.flags as number, productFlags);
  (product.urls as Array<Record<string, unknown>>).forEach(url => url.flags = createBitfield(url.flags as number, productUrlFlags));
  (product.images as Array<Record<string, unknown>>).forEach(image => image.flags = createBitfield(image.flags as number, productImageFlags));
  return product as Product;
}

export function parseResolvedAnnouncement(announcement: Record<string, unknown>): ResolvedAnnouncement {
  announcement.resolvedProducts = (announcement.resolvedProducts as Array<Record<string, unknown>>).map(parseProduct);
  return announcement as ResolvedAnnouncement;
}

const epochBegin = new Date('2025-01-01T00:00:00Z').getTime()
export function parseEpochTimestamp(timestamp: unknown): Date | null {
  const asNumber = Number(timestamp);
  if (isNaN(asNumber) || asNumber < 0) {
    return null;
  }
  return new Date(epochBegin + asNumber * 1000);
}

export function parseEvent(event: Record<string, unknown>): FsbEvent {
  if (event.type as string === 'fsb:event:product_updated') {
    event.data = parseProduct(event.data as Record<string, unknown>);
  } else if (event.type as string === 'fsb:event:announcement_created') {
    event.data = parseResolvedAnnouncement(event.data as Record<string, unknown>);
  }
  event.timestamp = new Date(String(event.timestamp));
  return event as FsbEvent;
}

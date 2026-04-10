export const CARRIERS = [
  "auspost",
  "tge",
  "toll",
  "allied_express",
  "tnt",
  "other",
] as const;

export type Carrier = (typeof CARRIERS)[number];

export const CARRIER_LABELS: Record<Carrier, string> = {
  auspost: "Australia Post",
  tge: "TGE",
  toll: "Toll",
  allied_express: "Allied Express",
  tnt: "TNT",
  other: "Other",
};

export const ORDER_STATUSES = [
  "draft",
  "awaiting_pick",
  "picking",
  "awaiting_pack",
  "packing",
  "packed",
  "shipped",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PO_STATUSES = [
  "draft",
  "awaiting_arrival",
  "receiving",
  "received",
  "closed",
] as const;

export type PoStatus = (typeof PO_STATUSES)[number];

export const WAVE_PICK_STATUSES = [
  "created",
  "in_progress",
  "completed",
] as const;

export type WavePickStatus = (typeof WAVE_PICK_STATUSES)[number];

export const LOCATION_TYPES = [
  "rack",
  "floor",
  "office",
  "receiving",
  "dispatch",
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const LOCATION_CAPACITIES = [
  "single_pallet",
  "multiple_pallets",
] as const;

export type LocationCapacity = (typeof LOCATION_CAPACITIES)[number];

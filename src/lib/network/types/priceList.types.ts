// Mirrors kgr-backend interfaces/priceList.interface.ts. Dollar prices
// and weights are stored; naira totals are always usd times the single
// current exchange rate.

export interface PriceListItem {
  _id: string;
  name: string;
  weight: string;
  usd: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListData {
  rate: number;
  rateUpdatedByName: string;
  rateUpdatedAt?: string;
  notes: string;
  items: PriceListItem[];
}

export interface CreatePriceItemPayload {
  name: string;
  weight?: string;
  usd: number;
}

export interface UpdatePriceItemPayload {
  name?: string;
  weight?: string;
  usd?: number;
}

export interface UpdatePriceSettingsPayload {
  rate?: number;
  notes?: string;
}

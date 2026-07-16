// Mirrors kgr-backend interfaces/tripPrice.interface.ts + models/TripPrice.ts.

export interface TripPriceSetter {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface TripPrice {
  _id: string;
  amount: string; // money as strings end-to-end
  effectiveFrom: string;
  setBy: TripPriceSetter | string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetTripPricePayload {
  amount: string;
  effectiveFrom?: string;
  note?: string;
}

export interface TripPriceHistoryQueryParams {
  page?: number;
  pageSize?: number;
}

// Mirrors kgr-backend interfaces/companyAsset.interface.ts. The Price
// List format turned into a register of what the company owns.

export type AssetCategory = "appreciating" | "depreciating";
export type AssetCurrency = "USD" | "NGN";

export interface CompanyAsset {
  _id: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  currency: AssetCurrency;
  unitPrice: string;
  acquiredOn?: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // worked out by the server through the Price List rate
  unitUsd: number;
  unitNgn: number;
  totalUsd: number;
  totalNgn: number;
}

export interface AssetCategoryTotals {
  count: number;
  totalUsd: number;
  totalNgn: number;
}

export interface CompanyAssetsData {
  rate: number;
  items: CompanyAsset[];
  totals: {
    count: number;
    totalUsd: number;
    totalNgn: number;
    appreciating: AssetCategoryTotals;
    depreciating: AssetCategoryTotals;
  };
}

export interface CreateCompanyAssetPayload {
  name: string;
  category: AssetCategory;
  quantity: number;
  currency: AssetCurrency;
  unitPrice: number;
  acquiredOn?: string;
  note?: string;
}

export type UpdateCompanyAssetPayload = Partial<CreateCompanyAssetPayload>;

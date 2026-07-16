// Mirrors kgr-backend interfaces/inventory.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type ItemCategory = "part" | "battery" | "consumable";
export type StockMovementType = "in" | "out" | "adjust";

export interface InventoryItem {
  _id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  quantityOnHand: number;
  unitCost: string;
  minLevel: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  item: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  note: string;
  relatedRequest?: { _id: string; requestId: number; busNumber: string } | string;
  by: ReceiptUserRef | string;
  createdAt: string;
}

export interface CreateItemPayload {
  name: string;
  category: ItemCategory;
  unit?: string;
  quantityOnHand?: number;
  unitCost: string;
  minLevel?: number;
}

export interface UpdateItemPayload {
  name?: string;
  category?: ItemCategory;
  unit?: string;
  unitCost?: string;
  minLevel?: number;
  isActive?: boolean;
}

export interface AdjustStockPayload {
  type: StockMovementType;
  quantity: number; // absolute target when type is "adjust"
  note?: string;
}

export interface ItemsQueryParams {
  page?: number;
  pageSize?: number;
  category?: ItemCategory;
  isActive?: "true" | "false";
  search?: string;
  lowStock?: "true";
}

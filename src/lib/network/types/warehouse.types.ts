// Mirrors kgr-backend interfaces/warehouse.interface.ts. The off-site
// warehouse takes exactly the same shapes as yard inventory, so these
// are aliases of the inventory types rather than copies.
import type { ReceiptUserRef } from "./receipt.types";
import type {
  InventoryItem,
  StockMovementType,
  CreateItemPayload,
  UpdateItemPayload,
  AdjustStockPayload,
  ItemsQueryParams,
} from "./inventory.types";

export type WarehouseItem = InventoryItem;

export interface WarehouseMovement {
  _id: string;
  item: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  note: string;
  by: ReceiptUserRef | string;
  createdAt: string;
}

export type CreateWarehouseItemPayload = CreateItemPayload;
export type UpdateWarehouseItemPayload = UpdateItemPayload;
export type AdjustWarehouseStockPayload = AdjustStockPayload;
export type WarehouseItemsQueryParams = ItemsQueryParams;

// types/Order.ts

import { Item } from "./item";

export interface Order {
  id?: number;
  items: Item[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  status: "pending" | "completed" | "canceled";
  customerName?: string;
  paid: boolean;
  note?: string;
  user?: string;
}

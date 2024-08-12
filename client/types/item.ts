// types/Item.ts

export interface Item {
  quantity?: number;
  updatedAt: Date;
  id?: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  stock: number;
  removed?: boolean;
}

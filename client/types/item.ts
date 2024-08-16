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
  createdAt: Date;
  stock: number;
  removed?: boolean;
  user: string;
}

import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  fetchItems,
  insertItem,
  deleteItem,
  updateItem as updateItemServive,
  fetchUniqueCategories,
  fetchItemById,
} from "../storage/database";
import { Item } from "../types/item"; // Adjust import based on your file structure
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncOrders } from "./syncOrder";

interface ItemContextType {
  items: Item[];
  categories: string[];
  addItem: (item: Item) => Promise<void>;
  fetchItem: (item: number) => Promise<Item | undefined>;
  updateItem: (item: Item) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isOnline = useOnlineStatus();
  const { isSyncing } = useSyncOrders();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const loadItems = async () => {
    if (isSyncing) return;

    try {
      const localItems = await new Promise<Item[]>((resolve) => {
        fetchItems(resolve);
      });
      setItems(localItems);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const uniqueCategories = await new Promise<string[]>((resolve) => {
          fetchUniqueCategories(resolve);
        });
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    loadCategories();
    loadItems();
  }, [isOnline, isSyncing]);

  const addItem = async (item: Item) => {
    try {
      const res = await insertItem(item);
      if (res) {
        setItems((prevItems) => [...prevItems, res]);
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const fetchItem = async (itemId: number) => {
    try {
      const storedOrder = await new Promise<Item>((resolve) => {
        fetchItemById(itemId, (item) => resolve(item as unknown as Item));
      });
      return storedOrder;
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const updateItem = async (item: Item) => {
    try {
      await updateItemServive(item);
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? { ...i, ...item } : i))
      );
      loadItems();
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const removeItem = async (id: number) => {
    try {
      await deleteItem(id);
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      loadItems();
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  return (
    <ItemContext.Provider
      value={{ items, categories, addItem, fetchItem, updateItem, removeItem }}
    >
      {children}
    </ItemContext.Provider>
  );
};

export const useItem = (): ItemContextType => {
  const context = React.useContext(ItemContext);
  if (!context) {
    throw new Error("useItem must be used within an ItemProvider");
  }
  return context;
};

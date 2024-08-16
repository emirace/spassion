import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  fetchOrders,
  insertOrder,
  deleteOrder,
  fetchItems,
  initDatabase,
  insertItem,
  updateOrder,
  updateItem,
  deleteItem,
} from "../storage/database";
import { apiGetOrders, apiPostOrder, apiDeleteOrder } from "@/servers/order";
import { Order } from "@/types/order";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Item } from "@/types/item";
import { apiDeleteItem, apiGetItems, apiPostItem } from "@/servers/item";
import { useAuth } from "./Auth";

interface SyncOrdersContextProps {
  isSyncing: boolean;
  syncError: string | null;
  syncFromServer: () => Promise<void>;
  syncToServer: () => Promise<void>;
}

const SyncOrdersContext = createContext<SyncOrdersContextProps | undefined>(
  undefined
);

const retryOperation = async (
  operation: () => Promise<void | boolean>,
  retries: number = 3
) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === retries - 1) throw error;
      // Optionally, implement an exponential backoff
      await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt));
    }
  }
};

const SyncOrdersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncFromServer = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const [serverOrders, serverItems] = await Promise.all([
        apiGetOrders(),
        apiGetItems(),
      ]);

      // Fetch local orders and items concurrently
      const [localOrders, localItems] = await Promise.all([
        new Promise<Order[]>(fetchOrders),
        new Promise<Item[]>(fetchItems),
      ]);

      const localOrdersMap = new Map(
        localOrders.map((order) => [order.id, order])
      );
      const localItemsMap = new Map(localItems.map((item) => [item.id, item]));

      // Sync Orders: Insert or update based on existence and timestamp
      await Promise.all(
        serverOrders.map(async (serverOrder) => {
          const localOrder = localOrdersMap.get(serverOrder.id);
          if (localOrder) {
            if (serverOrder.updatedAt > localOrder.updatedAt) {
              await updateOrder(serverOrder); // Update existing order
            }
          } else {
            await insertOrder(serverOrder); // Insert new order
          }
        })
      );

      // Sync Items: Insert or update based on existence and timestamp
      await Promise.all(
        serverItems.map(async (serverItem) => {
          const localItem = localItemsMap.get(serverItem.id);
          if (localItem) {
            if (serverItem.updatedAt > localItem.updatedAt) {
              await updateItem(serverItem); // Update existing item
            }
          } else {
            await insertItem(serverItem); // Insert new item
          }
        })
      );

      // Delete items from local DB that are no longer on the server
      const serverItemIds = new Set(serverItems.map((item) => item.id));
      await Promise.all(
        localItems.map(async (localItem) => {
          if (!serverItemIds.has(localItem.id)) {
            await deleteItem(localItem.id as number); // Delete missing items
          }
        })
      );

      console.log("Sync from server successfully");
    } catch (error) {
      console.error("Error syncing from server:", error);
      setSyncError("Failed to sync from server");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToServer = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Fetch local orders and items concurrently
      const [localOrders, localItems] = await Promise.all([
        new Promise<Order[]>(fetchOrders),
        new Promise<Item[]>(fetchItems),
      ]);

      // Fetch server orders and items concurrently
      const [serverOrders, serverItems] = await Promise.all([
        apiGetOrders(),
        apiGetItems(),
      ]);
      console.log(serverItems);
      const serverOrdersMap = new Map(
        serverOrders.map((order) => [order.id, order])
      );
      const serverItemsMap = new Map(
        serverItems.map((item) => [item.id, item])
      );

      // Sync Orders
      await Promise.all(
        localOrders.map(async (localOrder) => {
          const matchingServerOrder = serverOrdersMap.get(localOrder.id);
          if (
            !matchingServerOrder ||
            localOrder.updatedAt > matchingServerOrder.updatedAt
          ) {
            await retryOperation(() => apiPostOrder(localOrder));
          }
        })
      );

      // Sync Items
      await Promise.all(
        localItems.map(async (localItem) => {
          const matchingServerItem = serverItemsMap.get(localItem.id);
          if (
            !matchingServerItem ||
            localItem.updatedAt > matchingServerItem.updatedAt
          ) {
            await retryOperation(() => apiPostItem(localItem));
          }
        })
      );

      // Handle deletions for manager role
      if (user?.role === "manager") {
        await Promise.all(
          serverItems.map(async (serverItem) => {
            if (!localItems.some((item) => item.id === serverItem.id)) {
              await retryOperation(() =>
                apiDeleteItem(serverItem.id as number)
              );
            }
          })
        );
      }

      console.log("Sync to server successfully");
    } catch (error) {
      console.error("Error syncing to server:", error);
      setSyncError("Failed to sync to server");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncOnOnlineStatus = async () => {
      await initDatabase();
      if (isOnline) {
        await syncFromServer();
        await syncToServer();
      }
    };

    syncOnOnlineStatus();
  }, [isOnline]);

  return (
    <SyncOrdersContext.Provider
      value={{
        isSyncing,
        syncError,
        syncFromServer,
        syncToServer,
      }}
    >
      {children}
    </SyncOrdersContext.Provider>
  );
};

const useSyncOrders = () => {
  const context = React.useContext(SyncOrdersContext);
  if (context === undefined) {
    throw new Error("useSyncOrders must be used within a SyncOrdersProvider");
  }
  return context;
};

export { SyncOrdersProvider, useSyncOrders };

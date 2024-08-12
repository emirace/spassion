// contexts/SyncOrdersContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  fetchOrders,
  insertOrder,
  deleteOrder,
  fetchItems,
  initDatabase,
} from "../storage/database";
import { apiGetOrders, apiPostOrder, apiDeleteOrder } from "@/servers/order";
import { Order } from "@/types/order";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Item } from "@/types/item";
import { apiGetItems, apiPostItem, apiUpdateItem } from "@/servers/item";

interface SyncOrdersContextProps {
  isSyncing: boolean;
  syncError: string | null;
  syncOrdersWithServer: () => Promise<void>;
  syncItemsWithServer: () => Promise<void>;
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncOrdersWithServer = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      // Fetch local orders
      const localOrders = await new Promise<Order[]>((resolve) => {
        fetchOrders(resolve);
      });

      // Fetch orders from the server
      const serverOrders = await apiGetOrders();

      // Convert server orders to a map for quick lookup
      const serverOrdersMap = new Map(
        serverOrders.map((order) => [order.id, order])
      );

      // Sync local orders with the server
      await Promise.all(
        localOrders.map(async (localOrder) => {
          const matchingServerOrder = serverOrdersMap.get(localOrder.id);

          if (!matchingServerOrder) {
            // Order is local only, push to server
            await retryOperation(() => apiPostOrder(localOrder));
          } else {
            // Resolve any conflicts
            if (localOrder.updatedAt > matchingServerOrder.updatedAt) {
              await retryOperation(() => apiPostOrder(localOrder));
            }
          }
        })
      );

      // Sync server orders with local
      await Promise.all(
        serverOrders.map(async (serverOrder) => {
          if (!localOrders.find((o) => o.id === serverOrder.id)) {
            await retryOperation(() =>
              apiDeleteOrder(serverOrder.id as number)
            );
          }
        })
      );
    } catch (error) {
      console.error("Error during sync:", error);
      setSyncError("Failed to sync orders");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncItemsWithServer = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      const localItems = await new Promise<Item[]>((resolve) => {
        fetchItems(resolve);
      });

      const serverItems = await apiGetItems();
      console.log(serverItems);
      const serverItemsMap = new Map(
        serverItems.map((item) => [item.id, item])
      );

      await Promise.all(
        localItems.map(async (localItem) => {
          const matchingServerItem = serverItemsMap.get(localItem.id);

          if (!matchingServerItem) {
            await retryOperation(() => apiPostItem(localItem));
          } else {
            if (localItem.updatedAt > matchingServerItem.updatedAt) {
              await retryOperation(() => {
                return apiUpdateItem(localItem, localItem.id as number);
              });
            }
          }
        })
      );

      await Promise.all(
        serverItems.map(async (serverItem) => {
          if (!localItems.find((o) => o.id === serverItem.id)) {
            await retryOperation(() => apiDeleteItem(serverItem.id));
          }
        })
      );
    } catch (error) {
      setSyncError("Failed to sync items");
      console.error("Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncStatus = async () => {
      await initDatabase();
      if (isOnline) {
        await syncItemsWithServer();
        await syncOrdersWithServer();
      }
    };

    syncStatus();
  }, [isOnline]);

  return (
    <SyncOrdersContext.Provider
      value={{
        isSyncing,
        syncError,
        syncOrdersWithServer,
        syncItemsWithServer,
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
function apiDeleteItem(id: any): Promise<boolean | void> {
  throw new Error("Function not implemented.");
}

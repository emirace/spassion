import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  fetchOrders,
  insertOrder,
  deleteOrder as deleteLocalOrder,
  fetchOrderById,
  updateOrder,
} from "../storage/database";
import { Order } from "@/types/order";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncOrders } from "./syncOrder";
import { Item } from "@/types/item";
import { useAuth } from "./Auth";

interface OrdersContextType {
  orders: Order[];
  userOrders: Order[];
  loading: boolean;
  error: string | null;
  addOrder: (order: Order) => void;
  fetchOrder: (orderId: number) => Promise<Order | undefined>;
  markOrderAsPaid: (orderId: number) => void;
  removeItemFromOrder: (orderId: number, itemId: number) => void;
  addItemToOrder: (orderId: number, newItem: Item) => void;
  deleteOrder: (orderId: number) => void;
  fetchUserOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isOnline = useOnlineStatus();
  const { isSyncing } = useSyncOrders();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (isSyncing) return;
      try {
        const storedOrders = await new Promise<Order[]>((resolve) => {
          fetchOrders((orders) => resolve(orders as unknown as Order[]));
        });
        setOrders(storedOrders);
      } catch (err) {
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isOnline, isSyncing]);

  const fetchUserOrders = async () => {
    try {
      const storedOrders = await new Promise<Order[]>((resolve) => {
        fetchOrders((orders) => resolve(orders as unknown as Order[]));
      });
      const filterOrder = storedOrders.filter(
        (order) => order.user === user?.username
      );
      setUserOrders(filterOrder);
    } catch (err) {
      setError("Failed to fetch orders");
      throw err;
    }
  };

  const updateOrdersState = async () => {
    try {
      const storedOrders = await new Promise<Order[]>((resolve) => {
        fetchOrders((orders) => resolve(orders as unknown as Order[]));
      });
      setOrders(storedOrders);
      const filterOrder = storedOrders.filter(
        (order) => order.user === user?.username
      );
      setUserOrders(filterOrder);
    } catch (error) {
      console.error("Error updating orders state:", error);
    }
  };

  const addOrder = async (order: Order) => {
    try {
      await insertOrder(order);
      await updateOrdersState();
    } catch (err) {
      console.error("Error adding order:", err);
      throw err;
    }
  };

  const fetchOrder = async (orderId: number) => {
    try {
      const storedOrder = await new Promise<Order>((resolve) => {
        fetchOrderById(orderId, (order) => resolve(order as unknown as Order));
      });
      return storedOrder;
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const addItemToOrder = async (orderId: number, newItem: Item) => {
    try {
      // Fetch the current orders directly
      const orders = await new Promise<Order[]>((resolve) => {
        fetchOrders((orders) => resolve(orders as unknown as Order[]));
      });

      const order = orders.find((order) => order.id === orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
      }

      // Find the index of the item being added or updated
      const existingItemIndex = order.items.findIndex(
        (item) => item.id === newItem.id
      );

      // Update items based on whether the item exists or not
      const updatedItems =
        existingItemIndex > -1
          ? order.items.map((item, index) =>
              index === existingItemIndex
                ? item.removed
                  ? { ...item, removed: false, quantity: 1 }
                  : { ...item, quantity: (item.quantity ?? 0) + 1 }
                : item
            )
          : [...order.items, { ...newItem, quantity: 1 }];

      // Filter out removed items and calculate the new total price
      const validItems = updatedItems.filter((item) => !item.removed);
      const newTotalPrice = validItems.reduce((total, item) => {
        return total + item.price * (item.quantity ?? 1);
      }, 0);

      // Create the updated order with new totalPrice
      const updatedOrder = {
        ...order,
        items: updatedItems,
        totalPrice: newTotalPrice,
      };

      // Update the order in the database and refresh the orders state
      await updateOrder(updatedOrder);
      await updateOrdersState();
      console.log(`Item added to order with ID ${orderId}.`);
    } catch (error) {
      console.error(`Error adding item to order with ID ${orderId}:`, error);
    }
  };

  const removeItemFromOrder = async (orderId: number, itemId: number) => {
    try {
      // Fetch the current order
      const orders = await new Promise<Order[]>((resolve) => {
        fetchOrders((orders) => resolve(orders as unknown as Order[]));
      });

      const order = orders.find((order) => order.id === orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
      }

      // Mark the item as removed
      const updatedItems = order.items.map((item) =>
        item.id === itemId ? { ...item, removed: true } : item
      );

      // Filter out removed items and calculate the new total price
      const validItems = updatedItems.filter((item) => !item.removed);
      const newTotalPrice = validItems.reduce((total, item) => {
        return total + item.price * (item.quantity ?? 1);
      }, 0);

      const updatedOrder = {
        ...order,
        items: updatedItems,
        totalPrice: newTotalPrice,
      };

      // Update the order in the database
      await updateOrder(updatedOrder);
      await updateOrdersState();
      console.log(
        `Item with ID ${itemId} marked as removed in order with ID ${orderId}.`
      );
    } catch (error) {
      console.error("Error removing item from order:", error);
    }
  };

  const markOrderAsPaid = async (orderId: number) => {
    try {
      // Fetch the current order
      const orders = await new Promise<Order[]>((resolve) => {
        fetchOrders((orders) => resolve(orders as unknown as Order[]));
      });

      const order = orders.find((order) => order.id === orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
      }

      // Mark the order as paid
      const updatedOrder = { ...order, paid: true };

      // Update the order in the database
      await updateOrder(updatedOrder);
      await updateOrdersState();
      console.log(`Order with ID ${orderId} marked as paid.`);
    } catch (error) {
      console.error("Error marking order as paid:", error);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      // Delete the order from the database
      await deleteLocalOrder(orderId);
      await updateOrdersState();
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        error,
        userOrders,
        addOrder,
        fetchOrder,
        addItemToOrder,
        markOrderAsPaid,
        removeItemFromOrder,
        fetchUserOrders,
        deleteOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = React.useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};

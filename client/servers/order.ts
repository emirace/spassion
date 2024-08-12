import { Order } from "@/types/order";
import axiosInstance from "./api";

// Fetch orders from the backend
export const apiGetOrders = async (): Promise<Order[]> => {
  try {
    const response = await axiosInstance.get("/orders");
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Post a new order to the backend
export const apiPostOrder = async (order: Order) => {
  try {
    const response = await axiosInstance.post("/orders", order);
    return response.data;
  } catch (error) {
    console.error("Error posting order:", error);
    return null;
  }
};

// Delete an order from the backend
export const apiDeleteOrder = async (orderId: number) => {
  try {
    await axiosInstance.delete(`/orders/${orderId}`);
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    return false;
  }
};

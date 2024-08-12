import { Item } from "@/types/item";
import axiosInstance from "./api";

// Fetch items from the backend
export const apiGetItems = async (): Promise<Item[]> => {
  try {
    const response = await axiosInstance.get("/items");
    return response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
};

// Post a new item to the backend
export const apiPostItem = async (item: Item) => {
  try {
    const response = await axiosInstance.post("/items", item);
    return response.data;
  } catch (error) {
    console.error("Error posting item:", error);
    return null;
  }
};

// Updste a item to the backend
export const apiUpdateItem = async (item: Item, id: number) => {
  try {
    const response = await axiosInstance.post(`/items/${id}`, item);
    return response.data;
  } catch (error) {
    console.error("Error posting item:", error);
    return null;
  }
};

// Delete an item from the backend
export const apiDeleteItem = async (orderId: number) => {
  try {
    await axiosInstance.delete(`/items/${orderId}`);
    return true;
  } catch (error) {
    console.error("Error deleting item:", error);
    return false;
  }
};

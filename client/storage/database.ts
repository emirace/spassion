// storage/database.ts

import { Order } from "@/types/order";
import { Item } from "@/types/item";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("pos_app.db");

// Initialize the database with required tables
export const initDatabase = async () => {
  try {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY NOT NULL,
          items TEXT,
          totalPrice REAL,
          createdAt TEXT,
          updatedAt TEXT,
          status TEXT,
          customerName TEXT,
          paid INTEGER,
          note TEXT,
          user TEXT
        )`
    );

    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT,
          price REAL,
          category TEXT,
          description TEXT,
          imageUrl TEXT,
          stock INTEGER,
          removed INTEGER
        )`
    );
  } catch (error) {
    console.log("creating db errof", error);
  }
};

// Convert Order to a format suitable for SQLite
const serializeOrder = (order: Order) => {
  return {
    ...order,
    items: JSON.stringify(order.items),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paid: order.paid ? 1 : 0,
  };
};

// Convert SQLite result to Order
const deserializeOrder = (row: any): Order => {
  return {
    ...row,
    items: JSON.parse(row.items),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    paid: row.paid === 1,
  };
};

// Insert an item into the database and return the created item
export const insertItem = async (item: Item): Promise<Item | null> => {
  try {
    // Insert the item into the database
    await db.runAsync(
      `INSERT INTO items (${
        item.id !== undefined ? "id," : ""
      } name, price, category, description, imageUrl, stock,removed) VALUES (${
        item.id !== undefined ? "?," : ""
      } ?, ?, ?, ?, ?, ?,?)`,
      ...(item.id !== undefined ? [item.id] : []),
      item.name ?? null,
      item.price ?? null,
      item.category ?? null,
      item.description ?? null,
      item.imageUrl ?? null,
      item.stock ?? null,
      item.removed ?? false
    );

    // If you need to retrieve the ID of the newly inserted item,
    // and if your database supports returning IDs, you can use a query like:
    const [newItem] = await db.getAllAsync(
      `SELECT * FROM items WHERE id = last_insert_rowid()`
    );

    // Return the newly inserted item
    return newItem as Item;
  } catch (error) {
    console.error("Error inserting item:", error);
    return null;
  }
};

// Fetch all items from the database
export const fetchItems = async (callback: (items: Item[]) => void) => {
  try {
    const allRows: Item[] = await db.getAllAsync(`SELECT * FROM items `);
    // Map the rows to the Item interface
    const items: Item[] = allRows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      category: row.category,
      description: row.description || "",
      imageUrl: row.imageUrl || "",
      stock: Number(row.stock),
      updatedAt: row.updatedAt,
      removed: row.removed,
    }));
    callback(items);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    callback([]);
  }
};

// Fetch unique categories from the database
export const fetchUniqueCategories = async (
  callback: (categories: string[]) => void
) => {
  const result = await db.getAllAsync("SELECT DISTINCT category FROM items");
  callback(result.map((row: any) => row.category));
};

// Delete an item from the database
export const deleteItem = async (id: number) => {
  await db.runAsync(`DELETE FROM items WHERE id = ?`, id);
};

// Update an item in the database
export const updateItem = async (item: Item) => {
  try {
    console.log("Starting update for item:", item);

    await db.runAsync(
      `UPDATE items SET name = ?, price = ?, category = ?, description = ?, imageUrl = ?, stock = ?, removed = ? WHERE id = ?`,
      item.name,
      item.price,
      item.category,
      item.description || "",
      item.imageUrl || "",
      item.stock,
      item.removed || false,
      item.id!
    );

    console.log(`Item with ID ${item.id} updated successfully.`);
  } catch (error) {
    console.error(`Failed to update item with ID ${item.id}:`, error);
    throw error; // Re-throw the error if you want to handle it further up the call stack
  }
};

export const fetchOrderById = async (
  orderId: number,
  callback: (order: Order | null) => void
) => {
  try {
    const result = await db.getAllAsync(
      `SELECT * FROM orders WHERE id = ?`,
      orderId
    );
    if (result.length > 0) {
      const order: Order = deserializeOrder(result[0]);
      callback(order);
    } else {
      callback(null);
    }
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    callback(null);
  }
};

// Fetch an item by its ID from the database
export const fetchItemById = async (
  itemId: number,
  callback: (item: Item | null) => void
) => {
  try {
    const result: any = await db.getAllAsync(
      `SELECT * FROM items WHERE id = ?`,
      itemId
    );
    if (result.length > 0) {
      const item: Item = {
        id: result[0].id,
        name: result[0].name,
        price: result[0].price,
        category: result[0].category,
        description: result[0].description || "",
        imageUrl: result[0].imageUrl || "",
        stock: Number(result[0].stock),
        updatedAt: result[0].updatedAt,
      };
      callback(item);
    } else {
      callback(null);
    }
  } catch (error) {
    console.error("Error fetching item by ID:", error);
    callback(null);
  }
};

// Insert an order into the database
export const insertOrder = async (order: Order) => {
  try {
    const serializedOrder = serializeOrder(order);

    const query = order.id
      ? `INSERT INTO orders (id, items, totalPrice, createdAt, updatedAt, status, customerName, paid, note, user)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`
      : `INSERT INTO orders (items, totalPrice, createdAt, updatedAt, status, customerName, paid, note, user)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = order.id
      ? [
          serializedOrder.id ?? null, // Ensure no undefined values
          serializedOrder.items ?? null,
          serializedOrder.totalPrice ?? null,
          serializedOrder.createdAt ?? null,
          serializedOrder.updatedAt ?? null,
          serializedOrder.status ?? null,
          serializedOrder.customerName ?? null,
          serializedOrder.paid ?? null,
          serializedOrder.note ?? null,
          serializedOrder.user ?? null,
        ]
      : [
          serializedOrder.items ?? null,
          serializedOrder.totalPrice ?? null,
          serializedOrder.createdAt ?? null,
          serializedOrder.updatedAt ?? null,
          serializedOrder.status ?? null,
          serializedOrder.customerName ?? null,
          serializedOrder.paid ?? null,
          serializedOrder.note ?? null,
          serializedOrder.user ?? null,
        ];

    await db.runAsync(query, ...params);

    const [newItem] = await db.getAllAsync(
      `SELECT * FROM orders WHERE id = last_insert_rowid()`
    );
    return newItem as Order;
  } catch (error) {
    console.error("Error inserting order:", error);
  }
};

// Fetch all orders from the database, ordered by the latest createdAt
export const fetchOrders = async (callback: (orders: Order[]) => void) => {
  try {
    // Order by createdAt in descending order to get the latest orders first
    const result = await db.getAllAsync(
      `SELECT * FROM orders ORDER BY createdAt DESC`
    );
    const orders: Order[] = result.map(deserializeOrder);
    callback(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    callback([]);
  }
};

export const updateOrder = async (order: Order) => {
  try {
    const serializedOrder = serializeOrder(order);

    await db.runAsync(
      `UPDATE orders SET 
        items = ?, 
        totalPrice = ?, 
        createdAt = ?, 
        updatedAt = ?, 
        status = ?, 
        customerName = ?, 
        paid = ?, 
        note = ?
      WHERE id = ?`,
      serializedOrder.items,
      serializedOrder.totalPrice,
      serializedOrder.createdAt,
      serializedOrder.updatedAt,
      serializedOrder.status,
      serializedOrder.customerName || "",
      serializedOrder.paid,
      serializedOrder.note || "",
      serializedOrder.id!
    );

    console.log(`Order with ID ${order.id} updated successfully.`);
  } catch (error) {
    console.error("Error updating order:", error);
  }
};

// Delete an order from the database
export const deleteOrder = async (id: number) => {
  try {
    await db.runAsync(`DELETE FROM orders WHERE id = ?`, id);
  } catch (error) {
    console.error("Error deleting order:", error);
  }
};

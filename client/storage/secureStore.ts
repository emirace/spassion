// storage/secureStore.ts

import * as SecureStore from "expo-secure-store";

// Save a value to SecureStore
export async function saveToSecureStore(
  key: string,
  value: string
): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to save ${key} to SecureStore`, error);
  }
}

// Retrieve a value from SecureStore
export async function getFromSecureStore(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key} from SecureStore`, error);
    return null;
  }
}

// Delete a value from SecureStore
export async function deleteFromSecureStore(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete ${key} from SecureStore`, error);
  }
}

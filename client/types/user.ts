// types/User.ts

export interface User {
  _id: string;
  username: string;
  password?: string; // Optional if you're storing hashed passwords securely
  role: "waiter" | "manager";
}

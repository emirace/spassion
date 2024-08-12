// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_REGION || "";

const s3 = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB", err));

// Item Schema and Model
const itemSchema = new mongoose.Schema({
  quantity: Number,
  updatedAt: Date,
  id: Number,
  name: String,
  price: Number,
  category: String,
  description: String,
  imageUrl: String,
  stock: Number,
  removed: { type: Boolean, default: false },
});

const Item = mongoose.model("Item", itemSchema);

// Order Schema and Model
const orderSchema = new mongoose.Schema({
  id: Number,
  createdAt: Date,
  updatedAt: Date,
  status: String,
  customerName: String,
  paid: { type: Boolean, default: false },
  note: String,
  user: String,
  items: [itemSchema],
  totalPrice: Number,
  removed: { type: Boolean, default: false },
});

const Order = mongoose.model("Order", orderSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String },
});

const User = mongoose.model("User", userSchema);

// Register Route
app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login Route
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "60d",
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Failed to log in" });
    console.log(error);
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
    console.log(error);
  }
});

app.post("/users", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
    console.log(error);
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server Error");
  }
});

app.put("/users/:id", async (req, res) => {
  const { username, role, password } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update fields
    if (username) user.username = username;
    if (role) user.role = role;

    // Hash password if it's being updated
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Save the updated user
    await user.save();

    res.json({ msg: "User updated successfully", user });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server Error");
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server Error");
  }
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get all items
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find({ removed: false });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Create a new item
app.post("/items", async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Update an item
app.put("/items/:id", async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete an item (soft delete by setting removed to true)
app.delete("/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { removed: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ removed: false }).populate("items");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Create a new order
app.post("/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
    console.log(error);
  }
});

// Delete an order (soft delete by setting removed to true)
app.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ id: req.params.id });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete order" });
    console.log(error);
  }
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME, // Replace with your bucket name
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // The file object is automatically added to the req object by multer
  res.json({ url: process.env.BACKEND_URL + "/images/" + req.file.key });
});

app.get("/images/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const response = await s3.send(command);
    if (!response.Body) {
      return res.status(404).json({ message: "Image not found" });
    }
    const bodyChunks = [];
    const str = await response.Body.transformToByteArray();

    const bodyBuffer = Buffer.from(str);
    res.writeHead(200, {
      "Content-Type": response.ContentType,
      "Content-Length": bodyBuffer.length,
    });
    res.end(bodyBuffer);
  } catch (error) {
    console.error("Image download error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

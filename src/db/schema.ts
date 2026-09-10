import { pgTable, serial, text, varchar, timestamp, integer, boolean, decimal, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 255 }).notNull(),
  ram: varchar("ram", { length: 100 }).notNull(),
  storage: varchar("storage", { length: 100 }).notNull(),
  display: varchar("display", { length: 255 }).notNull(),
  condition: varchar("condition", { length: 100 }).notNull(),
  batteryCondition: varchar("battery_condition", { length: 100 }).notNull(),
  warranty: varchar("warranty", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  images: jsonb("images").notNull().default([]),
  description: text("description"),
  specifications: jsonb("specifications").notNull().default({}),
  category: varchar("category", { length: 50 }).notNull().default("laptop"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 20 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceBookings = pgTable("service_bookings", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  deviceType: varchar("device_type", { length: 100 }).notNull(),
  deviceModel: varchar("device_model", { length: 255 }),
  serviceType: varchar("service_type", { length: 255 }).notNull(),
  problem: text("problem").notNull(),
  preferredDate: varchar("preferred_date", { length: 50 }),
  preferredTime: varchar("preferred_time", { length: 50 }),
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: integer("rating").notNull().default(5),
  text: text("text").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
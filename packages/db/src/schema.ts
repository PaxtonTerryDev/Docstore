import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] })
    .notNull()
    .default("user"),
  department: text("department").notNull().default("recorder"),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  objectKey: text("object_key").notNull().unique(),
  sha256: text("sha256"),
  docType: text("doc_type").notNull(),
  department: text("department").notNull().default("recorder"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status", { enum: ["pending", "ready"] })
    .notNull()
    .default("pending"),
  restricted: boolean("restricted").notNull().default(false),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at").notNull().defaultNow(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action", {
    enum: ["upload", "view", "download", "search"],
  }).notNull(),
  documentId: uuid("document_id").references(() => documents.id),
  ip: text("ip"),
  detail: text("detail"),
})

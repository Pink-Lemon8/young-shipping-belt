import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  int,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  twoFactorEnabled: boolean("two_factor_enabled"),
  phoneNumber: text("phone_number"),
  language: text("language").default("en-US"),
  timezone: text("timezone").default("UTC"),
  timeFormat: text("time_format").default("dd MMM yyyy, hh:mm a"),
  bio: text("bio"),
  department: text("department"),
  beltCode: text("belt_code"),
  affiliates: text("affiliates"),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const jwks = mysqlTable("jwks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const twoFactor = mysqlTable("two_factor", {
  id: varchar("id", { length: 36 }).primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const passkey = mysqlTable("passkey", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_i_d").notNull(),
  counter: int("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at"),
  aaguid: text("aaguid"),
});

export const apikey = mysqlTable("apikey", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name"),
  start: text("start"),
  prefix: text("prefix"),
  key: text("key").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  refillInterval: int("refill_interval"),
  refillAmount: int("refill_amount"),
  lastRefillAt: timestamp("last_refill_at"),
  enabled: boolean("enabled").default(true),
  rateLimitEnabled: boolean("rate_limit_enabled").default(true),
  rateLimitTimeWindow: int("rate_limit_time_window").default(86400000),
  rateLimitMax: int("rate_limit_max").default(10),
  requestCount: int("request_count"),
  remaining: int("remaining"),
  lastRequest: timestamp("last_request"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  permissions: text("permissions"),
  metadata: text("metadata"),
});

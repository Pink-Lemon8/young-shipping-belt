import { relations, sql } from "drizzle-orm";
import {
  int,
  varchar,
  timestamp,
  text,
  mysqlEnum,
  decimal,
  mysqlTable,
  json,
  datetime,
  boolean,
  date,
  primaryKey,
  float,
  AnyMySqlColumn,
  year,
  foreignKey,
  index,
} from "drizzle-orm/mysql-core";
import { Address, AffiliateMetadata } from "./type";

import {
  user,
  session,
  account,
  verification,
  jwks,
  twoFactor,
  passkey,
  apikey,
} from "./schema/auth-schema";

export {
  user,
  account,
  apikey,
  passkey,
  session,
  verification,
  jwks,
  twoFactor,
};

const prefix = "belt_";

export const loginTypes = ["CREDENTIAL", "GOOGLE", "APPLE"] as const;
export const roleTypes = [
  "ADMIN",
  "COORDINATOR",
  "PHARMACIST",
  "BELT",
] as const;

export const statusTypes = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export const users = mysqlTable(`${prefix}users`, {
  id: int("id").primaryKey().autoincrement(),

  loginType: mysqlEnum("login_type", loginTypes).default("CREDENTIAL"),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),

  role: mysqlEnum("role", roleTypes).default("BELT"),

  emailVerifyToken: varchar("email_verify_token", { length: 255 }),
  emailVerifiedAt: timestamp("email_verified_at"),

  rememberToken: varchar("remember_token", { length: 100 }),
  rememberTokenCreatedAt: timestamp("remember_token_created_at"),

  forgetPasswordToken: varchar("forget_password_token", { length: 100 }),
  forgetPasswordTokenCreatedAt: timestamp("forget_password_token_created_at"),

  status: mysqlEnum("status", statusTypes).default("PENDING"),

  createdBy: int("created_by").references((): AnyMySqlColumn => users.id, {
    onDelete: "set null",
  }),

  beltCode: varchar("belt_code", { length: 3 }),

  kicker: int("kicker").default(0),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

///////

export const shippingMethods = [
  "FEDEX",
  "CANADA_POST",
  "UPS",
  "DEFAULT",
] as const;

export const beltQueueStatusTypes = [
  "PENDING",
  "SENT_TO_BELT",
  "STAGE1",
  "STAGE2",
  "STAGE3",
  "COMPLETED",
  "FAILED",
] as const;

export const pharmacistReviewStatusTypes = [
  "PENDING",
  "APPROVED",
  "DENIED",
] as const;

const queueTableAttributes = {
  id: int("id").primaryKey().autoincrement(),

  beltCode: varchar("belt_code", { length: 3 }),

  batchId: int("batch_id").notNull(),

  affiliateId: int("affiliate_id"),

  orderId: varchar("order_id", { length: 255 }).unique().notNull(),
  fullOrderId: varchar("full_order_id", { length: 255 }),
  patientId: varchar("patient_id", { length: 255 }).notNull(),
  patientName: varchar("patient_name", { length: 255 }),

  shippingMethod: varchar("shipping_method", { length: 50 })
    .$type<(typeof shippingMethods)[number]>()
    .default("DEFAULT"),

  trackingNumber: varchar("tracking_number", { length: 255 }),
  transactionId: varchar("transaction_id", { length: 255 }),

  lockedForUserId: varchar("locked_for_user_id", { length: 36 }).references(
    () => user.id,
    {
      onDelete: "set null",
      onUpdate: "cascade",
    },
  ),
  lockedAt: timestamp("locked_at"),

  label: json("label").$type<any>(),
  labelCreatedAt: timestamp("label_created_at"),

  files: json("files").$type<Array<any>>(),

  extraFiles: json("extra_files").$type<Array<any>>(),
  extraFilesCreatedAt: timestamp("extra_files_created_at"),

  images: json("images").$type<Array<any>>(),

  boxSizeId: int("box_size_id").references(() => boxSizes.id, {
    onDelete: "set null",
  }),

  tempaidBoxId: int("tempaid_box_id"),

  status: mysqlEnum("status", beltQueueStatusTypes).default("SENT_TO_BELT"),

  comments: json("comments").$type<Array<any>>(),

  cageCode: varchar("cage_code", { length: 255 }),

  skipped: boolean("skipped").default(false),

  skippedAt: timestamp("skipped_at"),

  skippedBy: varchar("skipped_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),

  shippedAt: timestamp("shipped_at"),

  groupId: int("group_id"),

  isCv: boolean("is_cv").default(false),
  cvFiles: json("cv_files").$type<Array<any>>(),
  cvFilesCreatedAt: timestamp("cv_files_created_at"),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
};

export const beltQueues = mysqlTable(
  `${prefix}queues`,
  queueTableAttributes,
  (table) => ({
    beltCodeIdx: index("belt_code_idx").on(table.beltCode),
    statusIdx: index("status_idx").on(table.status),
    patientIdIdx: index("patient_id_idx").on(table.patientId),
    trackingNumberIdx: index("tracking_number_idx").on(table.trackingNumber),
    labelCreatedAtIdx: index("label_created_at_idx").on(table.labelCreatedAt),
    beltCodeStatusIdx: index("belt_code_status_idx").on(
      table.beltCode,
      table.status,
    ),
    lockedForUserIdIdx: index("locked_for_user_id_idx").on(
      table.lockedForUserId,
    ),
    orderIdIdx: index("order_id_idx").on(table.orderId),
    queueLookupIdx: index("queue_lookup_idx").on(
      table.lockedForUserId,
      table.status,
      table.beltCode,
      table.skipped,
    ),
  }),
);

export const beltQueuesHistory = mysqlTable(`${prefix}queues_history`, {
  ...queueTableAttributes,
  orderId: varchar("order_id", { length: 255 }),
});

export const beltQueuePharmacistReview = mysqlTable(
  `${prefix}queues_pharmacist_review`,
  {
    orderId: varchar("order_id", { length: 255 }).notNull(),

    pharmacistId: varchar("pharmacist_id", { length: 36 }),

    status: mysqlEnum("status", pharmacistReviewStatusTypes).default("PENDING"),

    reason: text("reason"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    ),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orderId, table.pharmacistId] }),
    foreign: foreignKey({
      columns: [table.pharmacistId],
      foreignColumns: [user.id],
      name: "fk_pharmacist_id",
    }).onUpdate("cascade"),
  }),
);

export const logs = mysqlTable(
  `${prefix}logs`,
  {
    id: int("id").primaryKey().autoincrement(),
    userId: varchar("user_id", { length: 36 }).references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    beltCode: varchar("belt_code", { length: 3 }),
    orderId: varchar("order_id", { length: 255 }),
    action: varchar("action", { length: 255 }),
    description: text("description"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userActionCreatedIdx: index("user_action_created_idx").on(
      table.userId,
      table.action,
      table.createdAt,
    ),
    orderActionIdx: index("order_action_idx").on(table.orderId, table.action),
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

export const configTypes = [
  "PHARMACIST_DENIED_SMS_NOTIFICATION",
  "NOT_DRUG_PACKAGES",
] as const;

/////// tables must be same as shipping app

export const config = mysqlTable(`config`, {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 255 }).notNull(),
  value: json("value").$type<any>().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const files = mysqlTable("files", {
  id: int("id").primaryKey().autoincrement(),

  customId: varchar("custom_id", { length: 255 }),

  url: varchar("url", { length: 255 }),
  key: varchar("key", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  size: int("size").default(0),
  type: varchar("type", { length: 255 }),
  hash: varchar("hash", { length: 255 }),

  description: text("description"),
  isPublic: boolean("is_public").default(false),

  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orderFileTypes = [
  "LABEL",
  "COMMERCIAL_INVOICE",
  "PRESCRIPTION",
  "ORGINAL_PRESCRIPTION",
  "INVOICE",
  "BELT_STAGE1",
  "BELT_STAGE2",
  "BELT_STAGE3",
  "OTHER",
] as const;

// export const orderFiles = mysqlTable(
//   "order_files",
//   {
//     orderId: varchar("order_id", { length: 255 }),
//     fileId: int("file_id").references(() => files.id, {
//       onDelete: "no action",
//     }),
//     type: varchar("type", { length: 255 })
//       .$type<(typeof orderFileTypes)[number]>()
//       .default("OTHER"),
//     createdAt: timestamp("created_at").defaultNow(),
//     updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
//   },
//   (table) => ({
//     pk: primaryKey({ columns: [table.orderId, table.fileId] }),
//   })
// );

export const orderItems = mysqlTable(
  `order_items`,
  {
    orderId: varchar("order_id", { length: 255 }).notNull(),

    packageId: varchar("package_id", { length: 255 }).notNull(),
    lotNumber: varchar("lot_number", { length: 255 }),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 8, scale: 2 }),
    din: varchar("din", { length: 255 }),

    legacyId: varchar("legacy_id", { length: 255 }),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    ),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.orderId, table.packageId, table.lotNumber],
    }),
  }),
);

export const orderExpectedItems = mysqlTable(`order_expected_items`, {
  orderId: varchar("order_id", { length: 255 }).notNull(),

  packageId: varchar("package_id", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }),
  din: varchar("din", { length: 255 }),

  legacyId: varchar("legacy_id", { length: 255 }),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const affiliateCategories = [
  "WHOLE_SALE",
  "PARTNER",
  "PBM",
  "DEFAULT",
] as const;

export const affiliateShippingPreferences = shippingMethods;

export const affiliateStatusTypes = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export const affiliates = mysqlTable("affiliates", {
  id: int("id").primaryKey().autoincrement(),

  logo: json("logo").$type<any>(),

  name: varchar("name", { length: 255 }).unique().notNull(),
  code: varchar("code", { length: 25 }).unique().notNull(),

  pwAuthUsername: varchar("pw_auth_username", { length: 255 }),
  pwAuthPassword: varchar("pw_auth_password", { length: 255 }),
  pwLocal: boolean("pw_local").default(true),

  category: mysqlEnum("category", affiliateCategories).default("DEFAULT"),

  shippingPreference: varchar("shipping_preference", { length: 50 })
    .$type<(typeof affiliateShippingPreferences)[number]>()
    .default("DEFAULT"),

  defaultBoxSizeId: int("default_box_size_id").references(() => boxSizes.id, {
    onDelete: "set null",
  }),

  status: mysqlEnum("status", affiliateStatusTypes).default("PENDING"),

  metadata: json("metadata").$type<AffiliateMetadata>(),

  createdBy: varchar("created_by", { length: 36 }),

  pwAffiliateId: varchar("pw_affiliate_id", { length: 255 }),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const boxTypes = ["COLD_CHAIN", "DRY_MEDS", "DEFAULT"] as const;

export const boxUnitTypes = ["CM", "MM", "IN", "DEFAULT"] as const;

export const boxSizes = mysqlTable("box_sizes", {
  id: int("id").primaryKey().autoincrement(),

  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", boxTypes).default("DEFAULT"),

  h: decimal("h", { precision: 8, scale: 2 }).notNull(),
  w: decimal("w", { precision: 8, scale: 2 }).notNull(),
  l: decimal("l", { precision: 8, scale: 2 }).notNull(),

  unit: mysqlEnum("unit", boxUnitTypes).default("IN"),

  description: varchar("description", { length: 255 }),
  status: mysqlEnum("status", statusTypes).default("ACTIVE"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

/////////////////////// Tempaid Box System

export const tempaidDrugs = mysqlTable("tempaid_drugs", {
  id: int("id").primaryKey().autoincrement(),
  drugId: int("drug_id")
    .notNull()
    .references(() => drugs.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tempaidBoxStatusTypes = [
  "AVAILABLE",
  "IN_USE",
  "IN_TRANSIT",
  "RECEIVED",
  "RETIRED",
] as const;

export const tempaidBoxes = mysqlTable("tempaid_boxes", {
  id: int("id").primaryKey().autoincrement(),
  boxNumber: varchar("box_number", { length: 50 }).unique().notNull(),
  boxSizeId: int("box_size_id").references(() => boxSizes.id, {
    onDelete: "set null",
  }),
  status: mysqlEnum("status", tempaidBoxStatusTypes).default("AVAILABLE"),
  currentOrderId: varchar("current_order_id", { length: 255 }),

  trackingNumber: varchar("tracking_number", { length: 255 }),
  returnTrackingNumber: varchar("return_tracking_number", { length: 255 }),

  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const tempaidBoxHistoryActionTypes = [
  "CREATED",
  "ASSIGNED",
  "SHIPPED",
  "RECEIVED",
  "RETIRED",
  "RETURN_TRACKING_ADDED",
] as const;

export const tempaidBoxHistory = mysqlTable("tempaid_box_history", {
  id: int("id").primaryKey().autoincrement(),
  tempaidBoxId: int("tempaid_box_id")
    .notNull()
    .references(() => tempaidBoxes.id, { onDelete: "cascade" }),
  orderId: varchar("order_id", { length: 255 }),
  action: varchar("action", { length: 50 })
    .$type<(typeof tempaidBoxHistoryActionTypes)[number]>()
    .notNull(),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  returnTrackingNumber: varchar("return_tracking_number", { length: 255 }),
  performedBy: varchar("performed_by", { length: 36 }).references(
    () => user.id,
    {
      onDelete: "set null",
    },
  ),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

const tempaidBoxHistoryRelationships = relations(
  tempaidBoxHistory,
  ({ one }) => ({
    TempaidBox: one(tempaidBoxes, {
      fields: [tempaidBoxHistory.tempaidBoxId],
      references: [tempaidBoxes.id],
    }),
    PerformedBy: one(user, {
      fields: [tempaidBoxHistory.performedBy],
      references: [user.id],
    }),
  }),
);

export const returnLabels = mysqlTable("return_labels", {
  id: int("id").primaryKey().autoincrement(),
  orderId: varchar("order_id", { length: 255 }),
  tempaidBoxId: int("tempaid_box_id").references(() => tempaidBoxes.id, {
    onDelete: "set null",
  }),

  // Shippo transaction info
  shippoTransactionId: varchar("shippo_transaction_id", { length: 255 }),
  shippoShipmentId: varchar("shippo_shipment_id", { length: 255 }),
  shippoCarrierAccount: varchar("shippo_carrier_account", { length: 255 }),

  // Label details
  labelUrl: varchar("label_url", { length: 512 }).notNull(),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrlProvider: varchar("tracking_url_provider", { length: 512 }),

  // Carrier/service info
  carrier: varchar("carrier", { length: 50 }),
  serviceLevel: varchar("service_level", { length: 100 }),
  shippingCost: decimal("shipping_cost", { precision: 8, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),

  // Pickup address (stored from order for scheduling pickup later)
  pickupAddress: json("pickup_address").$type<{
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  }>(),

  // Pickup info (for when pickup is scheduled)
  pickupObjectId: varchar("pickup_object_id", { length: 255 }),
  pickupConfirmationCode: varchar("pickup_confirmation_code", { length: 255 }),
  pickupStatus: varchar("pickup_status", { length: 50 }),
  pickupScheduledAt: timestamp("pickup_scheduled_at"),
  pickupReadyTime: varchar("pickup_ready_time", { length: 4 }), // HHMM format
  pickupCloseTime: varchar("pickup_close_time", { length: 4 }), // HHMM format
  pickupConfirmedStart: timestamp("pickup_confirmed_start"),
  pickupConfirmedEnd: timestamp("pickup_confirmed_end"),

  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

/// PharmacyWire

export const countries = mysqlTable("countries", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
  code2: varchar("code_two", { length: 3 }).unique(),
  code3: varchar("code_three", { length: 3 }).unique(),
});

export const drugSchedules = mysqlTable("drug_schedules", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),

  countryId: int("country_id").references(() => countries.id, {
    onDelete: "set null",
  }),

  exportable: boolean("exportable").notNull(),
  prescriptionRequired: boolean("prescription_required").notNull(),
  alwaysConsult: boolean("always_consult").notNull(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const manufacturers = mysqlTable("manufacturers", {
  id: int("id").primaryKey(),

  name: varchar("name", { length: 255 }),

  address: json("address").$type<Address>(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const drugs = mysqlTable("drugs", {
  id: int("id").primaryKey().autoincrement(),

  name: varchar("name", { length: 255 }).notNull(),
  drugFamilyName: varchar("drug_family_name", { length: 255 }),
  strengthFreeForm: varchar("strength_free_form", { length: 255 }),
  form: varchar("form", { length: 255 }),
  ingredient: json("ingredient").$type<Array<String>>(),

  scheduleId: int("schedule_id").references(() => drugSchedules.id, {
    onDelete: "set null",
  }),
  manufacturerId: int("manufacturer_id"),
  // .references(() => manufacturers.id, {
  //   onDelete: "set null",
  // }),

  generic: boolean("generic").default(true),

  din: varchar("din", { length: 255 }),

  comments: json("comments").$type<Array<String>>(),

  pwConditionId: varchar("pw_condition_id", { length: 255 }),
  pwConditionName: varchar("pw_condition_name", { length: 255 }),

  species: json("species").$type<Array<String>>(),

  dosageForm: varchar("dosage_form", { length: 255 }),

  fridge: boolean("fridge").default(false),

  status: varchar("status", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const packages = mysqlTable("packages", {
  id: int("id").primaryKey().autoincrement(),

  drugId: int("drug_id").references(() => drugs.id, { onDelete: "cascade" }),

  product: varchar("product", { length: 255 }),
  ndc: json("ndc").$type<Array<String>>(),

  originCountryId: int("origin_country_id").references(() => countries.id, {
    onDelete: "set null",
  }),

  upc: varchar("upc", { length: 255 }),
  packagingFreeForm: varchar("packaging_free_form", { length: 255 }),
  unit: varchar("unit", { length: 255 }).notNull(),

  packageQuantity: decimal("package_quantity", {
    precision: 8,
    scale: 2,
  })
    .$type<number>()
    .notNull(),

  minitemqty: int("minitemqty").default(0),
  maxitemqty: int("maxitemqty").default(0),

  lymlightPackageId: int("lymlight_package_id"),

  comments: json("comments").$type<Array<String>>(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const packageBarcodes = mysqlTable("package_barcode", {
  packageId: int("package_id"),
  barcode: varchar("barcode", { length: 255 }),
  lymlightPackageId: varchar("lymlight_package_id", { length: 255 }),
});

export const packageExtras = mysqlTable("package_extras", {
  id: int("id").primaryKey().autoincrement(),
  packageId: int("package_id"),
  // .references(() => packages.id, {
  //   onDelete: "no action"
  // }),
  fdaApprovalYear: year("fda_approval_year"),
  conditionTreated: varchar("condition_treated", { length: 255 }),
  ndc11: varchar("ndc_11", { length: 255 }),
  din: varchar("din", { length: 255 }),
  monographUrl: varchar("monograph_url", { length: 255 }),
});

///////////////////////

/////////////////////// Relationships

export const userRelationships = relations(user, ({ one, many }) => ({
  Logs: many(logs),
  LockedForBeltOrders: many(beltQueues),
  LockedForPharmacistOrders: many(beltQueues),
  PharmacistReviewOrders: many(beltQueues),
  AffiliateOrders: many(beltQueues),
  BoxSizeOrders: many(beltQueues),
  SkippedOrders: many(beltQueues),
}));

export const logsRelationships = relations(logs, ({ one }) => ({
  User: one(user, {
    fields: [logs.userId],
    references: [user.id],
  }),
  BeltQueue: one(beltQueues, {
    fields: [logs.orderId],
    references: [beltQueues.orderId],
  }),
}));

export const boxSizesRelationships = relations(boxSizes, ({ many }) => ({
  BeltQueues: many(beltQueues),
}));

export const beltQueuesRelationships = relations(
  beltQueues,
  ({ one, many }) => ({
    BoxSize: one(boxSizes, {
      fields: [beltQueues.boxSizeId],
      references: [boxSizes.id],
    }),
    Affiliate: one(affiliates, {
      fields: [beltQueues.affiliateId],
      references: [affiliates.id],
    }),
    LockedForBeltUser: one(user, {
      fields: [beltQueues.lockedForUserId],
      references: [user.id],
    }),
    SkippedBy: one(user, {
      fields: [beltQueues.skippedBy],
      references: [user.id],
    }),
    Logs: many(logs),
    TempaidBox: one(tempaidBoxes, {
      fields: [beltQueues.tempaidBoxId],
      references: [tempaidBoxes.id],
    }),
  }),
);

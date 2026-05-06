import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  out: "./src/db/migrations",
  dbCredentials: {
    host: process.env.DATABASE_HOST ?? "",
    port: parseInt(process.env.DATABASE_PORT ?? "3306"),
    database: process.env.DATABASE_NAME ?? "",
    user: process.env.DATABASE_USERNAME ?? "",
    password: process.env.DATABASE_PASSWORD ?? "",
    ssl: {
      rejectUnauthorized: process.env.DATABASE_SSL?.toLowerCase() === "true",
    },
  },
  tablesFilter: [
    "belt_*",
    "config",
    "!affiliates",
    "box_sizes",
    "order_items",
    "countries",
    "drug_schedules",
    "drugs",
    "manufacturers",
    "packages",
    "package_barcode",
    "package_extras",
    "files",
    "order_expected_items",
  ],
} satisfies Config;

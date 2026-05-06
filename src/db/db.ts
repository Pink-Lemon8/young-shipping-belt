import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import "dotenv/config";


const pool = mysql.createPool({
  host: process.env["DATABASE_HOST"],
  port: parseInt(process.env["DATABASE_PORT"] ?? "3306"),
  database: process.env["DATABASE_NAME"],
  user: process.env["DATABASE_USERNAME"],
  password: process.env["DATABASE_PASSWORD"],
  ssl: {
    rejectUnauthorized: process.env["DATABASE_SSL"]?.toLowerCase() === "true"
  },
  // Connection pool configuration
  connectionLimit: 10,              // Maximum number of connections in the pool
  waitForConnections: true,         // Wait for connections when pool is full
  queueLimit: 0,                    // Unlimited queued connection requests
  connectTimeout: 60000,            // 60 seconds to establish connection
  enableKeepAlive: true,            // Enable TCP keep-alive
  keepAliveInitialDelay: 0,         // Start keep-alive immediately
  // Handle connection timeouts gracefully
  idleTimeout: 60000,               // 60 seconds before idle connections are closed
  maxIdle: 5,                       // Keep at least 5 idle connections
});

// Test the connection pool on startup (only log in development)
if (process.env.NODE_ENV === 'development') {
  pool.getConnection()
    .then(connection => {
      console.log('Database connection pool established successfully');
      connection.release();
    })
    .catch(err => {
      console.error('Failed to establish database connection pool:', err);
    });
}

export const db = drizzle(pool, { schema, mode: "default" });


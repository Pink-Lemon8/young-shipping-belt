import { db } from "./db";

const CONNECTION_ERROR_CODES = [
  'PROTOCOL_CONNECTION_LOST',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'EPIPE',
  'ENOTFOUND',
];

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a connection error that should be retried
      const isConnectionError = 
        error.message?.includes("closed state") ||
        error.message?.includes("connection") ||
        CONNECTION_ERROR_CODES.includes(error.code) ||
        error.errno === -4077 || // ECONNRESET
        error.errno === -4078;   // ETIMEDOUT
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      console.log(`Retrying in ${retryDelay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw lastError;
}

// Example usage wrapper for database queries
export async function executeQuery<T>(
  queryFn: () => Promise<T>
): Promise<T> {
  return withRetry(queryFn);
}
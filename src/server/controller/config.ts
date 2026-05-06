"use server";

import { db } from "@/db/db";
import { config } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";

export async function getConfig(type: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 }); // 5min stale, 10min revalidate, 1hr expire
  cacheTag(`config-${type}`);
  
  try {
    const [getConfig] = await db
      .select()
      .from(config)
      .where(eq(config.type, type))
      .orderBy(desc(config.createdAt))
      .limit(1);
    return getConfig;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function setConfig(
  type: string,
  value: any,
  description: string | undefined = undefined
) {
  try {
    // Check if config exists (bypass cache for fresh check)
    const [existingConfig] = await db
      .select()
      .from(config)
      .where(eq(config.type, type))
      .limit(1);

    if (existingConfig) {
      const [updatedResult] = await db
        .update(config)
        .set({ value, description })
        .where(eq(config.type, type))
        .execute();

      if (updatedResult.affectedRows === 0) return null;
      
      // Invalidate cache for this config type
      revalidateTag(`config-${type}`, "max");
      
      return { ...existingConfig, type, value };
    }

    const [insertedResult] = await db
      .insert(config)
      .values({ type, value, description })
      .execute();
    if (insertedResult.affectedRows === 0) return null;
    
    // Invalidate cache for this config type
    revalidateTag(`config-${type}`, "max");
    
    const newConfig = await getConfig(type);
    return newConfig;
  } catch (error) {
    console.error(error);
    return null;
  }
}

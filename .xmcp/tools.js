import { z } from "zod";

import * as tool0 from "../src/tools/get-belt-logs.ts";
import * as tool1 from "../src/tools/get-belt-performance.ts";
import * as tool2 from "../src/tools/get-belt-queue.ts";
import * as tool3 from "../src/tools/get-belt-users.ts";
import * as tool4 from "../src/tools/get-cage-status.ts";
import * as tool5 from "../src/tools/get-dashboard-stats.ts";
import * as tool6 from "../src/tools/get-leaderboard.ts";
import * as tool7 from "../src/tools/get-order-belt-status.ts";
import * as tool8 from "../src/tools/get-pharmacist-review-stats.ts";
import * as tool9 from "../src/tools/get-pharmacist-reviews.ts";
import * as tool10 from "../src/tools/get-processing-times.ts";
import * as tool11 from "../src/tools/get-queue-item-details.ts";
import * as tool12 from "../src/tools/get-queue-stats.ts";
import * as tool13 from "../src/tools/get-shipping-dates.ts";
import * as tool14 from "../src/tools/get-skipped-orders.ts";
import * as tool15 from "../src/tools/get-user-activity.ts";
import * as tool16 from "../src/tools/search-belt.ts";

/** 
 * Runtime-accessible tools function that works from any context.
 * Generated at build time - always up to date with discovered tools.
 * @returns {Promise<ToolRegistry>}
 */
export async function getTools() {
  const toolsData = [
    {
          path: "src/tools/get-belt-logs.ts",
          name: "get-belt-logs",
          module: tool0
        },
  {
          path: "src/tools/get-belt-performance.ts",
          name: "get-belt-performance",
          module: tool1
        },
  {
          path: "src/tools/get-belt-queue.ts",
          name: "get-belt-queue",
          module: tool2
        },
  {
          path: "src/tools/get-belt-users.ts",
          name: "get-belt-users",
          module: tool3
        },
  {
          path: "src/tools/get-cage-status.ts",
          name: "get-cage-status",
          module: tool4
        },
  {
          path: "src/tools/get-dashboard-stats.ts",
          name: "get-dashboard-stats",
          module: tool5
        },
  {
          path: "src/tools/get-leaderboard.ts",
          name: "get-leaderboard",
          module: tool6
        },
  {
          path: "src/tools/get-order-belt-status.ts",
          name: "get-order-belt-status",
          module: tool7
        },
  {
          path: "src/tools/get-pharmacist-review-stats.ts",
          name: "get-pharmacist-review-stats",
          module: tool8
        },
  {
          path: "src/tools/get-pharmacist-reviews.ts",
          name: "get-pharmacist-reviews",
          module: tool9
        },
  {
          path: "src/tools/get-processing-times.ts",
          name: "get-processing-times",
          module: tool10
        },
  {
          path: "src/tools/get-queue-item-details.ts",
          name: "get-queue-item-details",
          module: tool11
        },
  {
          path: "src/tools/get-queue-stats.ts",
          name: "get-queue-stats",
          module: tool12
        },
  {
          path: "src/tools/get-shipping-dates.ts",
          name: "get-shipping-dates",
          module: tool13
        },
  {
          path: "src/tools/get-skipped-orders.ts",
          name: "get-skipped-orders",
          module: tool14
        },
  {
          path: "src/tools/get-user-activity.ts",
          name: "get-user-activity",
          module: tool15
        },
  {
          path: "src/tools/search-belt.ts",
          name: "search-belt",
          module: tool16
        }
  ];

  const registry = {};

  for (const toolData of toolsData) {
    const { path, name: defaultName, module } = toolData;
    const { default: handler, metadata, schema } = module;

    const toolConfig = {
      name: defaultName,
      description: "No description provided",
      ...((typeof metadata === "object" && metadata !== null) ? metadata : {})
    };

    // Determine the actual schema to use
    let toolSchema = {};
    if (schema && typeof schema === "object" && schema !== null) {
      // Basic validation for Zod schema object
      const isValidSchema = Object.entries(schema).every(([key, val]) => {
        if (typeof key !== "string") return false;
        if (typeof val !== "object" || val === null) return false;
        if (!("parse" in val) || typeof val.parse !== "function") return false;
        return true;
      });
      
      if (isValidSchema) {
        toolSchema = schema;
      } else {
        console.warn(`Invalid schema for tool "${toolConfig.name}" at ${path}. Expected Record<string, z.ZodType>`);
      }
    }

    // Make sure tools has annotations with a title
    if (toolConfig.annotations === undefined) {
      toolConfig.annotations = {};
    }
    if (toolConfig.annotations.title === undefined) {
      toolConfig.annotations.title = toolConfig.name;
    }

    // Add to registry in the formatted structure
    registry[toolConfig.name] = {
      description: toolConfig.description,
      inputSchema: z.object(toolSchema || {}),
      execute: async (args, extra) => {
        const result = await handler(args, extra);
        return result;
      },
    };
  }

  return registry;
}

export const tools = await getTools();
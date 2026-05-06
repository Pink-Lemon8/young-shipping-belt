import {
  beltQueuePharmacistReview,
  beltQueues,
  beltQueuesHistory,
  logs,
  user,
  users,
} from "@/db/schema";
// import {
//   migrateUser,
//   updateForeignKeyReferences,
// } from "@/db/migrate-users-to-better-auth";
import { eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db/db";

const fileName = "move-user";

// admin - 1
// test Belt  - 14,15,16,21
// test pharmacist - 17,22

export const Run = async (args?: string[]) => {
  try {
    console.log("🔄 Running Drizzle Migration for Better Auth...\n");

    const getAllUsers = await db.select().from(users);

    const [BeltUnlockResult] = await db
      .update(beltQueues)
      .set({
        lockedForUserId: null,
        lockedAt: null,
      })
      .where(
        or(
          isNotNull(beltQueues.lockedForUserId),
          isNotNull(beltQueues.lockedAt)
        )
      )
      .execute();

    console.log("Belt Unlocked: ", BeltUnlockResult.affectedRows);

    const [BeltHistoryUnlockResult] = await db
      .update(beltQueuesHistory)
      .set({
        lockedForUserId: null,
        lockedAt: null,
        skippedBy: null,
      })
      .where(
        or(
          isNotNull(beltQueuesHistory.lockedForUserId),
          isNotNull(beltQueuesHistory.lockedAt),
          isNotNull(beltQueuesHistory.skippedBy)
        )
      )
      .execute();

    console.log(
      "Belt History Unlocked: ",
      BeltHistoryUnlockResult.affectedRows
    );

    const [getParkwayAppUsers, getParkwayAppUsersSchema] = await db.execute(
      sql`SELECT id,name,email,role FROM user;`
    );

    const userRemoveIds = ["14", "15", "16", "17", "21", "22"];

    const [removeBeltLog] = await db
      .delete(logs)
      .where(inArray(logs.userId, userRemoveIds as any));

    console.log("Belt Log Removed: ", removeBeltLog.affectedRows);

    const [removeBeltPharmacistReview] = await db
      .delete(beltQueuePharmacistReview)
      .where(
        inArray(beltQueuePharmacistReview.pharmacistId, userRemoveIds as any)
      );

    console.log(
      "Belt Pharmacist Review Removed: ",
      removeBeltPharmacistReview.affectedRows
    );

    const userMoveIds = {
      "1": "5a044cb725072e81b1677099dca12590",
      "20": "873714c3d0f2fb70fd182250b9ac3126",
      "23": "9Ha2406BWTZxajyItgOw1I6Q3BcOiiJC",
      "24": "5a044cb725072e81b1677099dca12590",
      "25": "ec141cd59ec17ea033826e7e0ec8f48a",
      "26": "YZk1rYwdpYI2can6XTLIS1cYf6zrix1u",
      "27": "d51ac3ecd855040f11bd039e63f45244",
      "28": "873714c3d0f2fb70fd182250b9ac3126",
      "29": "873714c3d0f2fb70fd182250b9ac3126",
      "30": "0e94c7d580bc26db178bc3ae3f3168c8",
      "31": "yc13P8kinFvcYgCxb1E1zNlKOuKoRg33",
      "32": "0tHJQvBPMjwWmcMspaCWK5KzNvZOFXBc",
      "33": "bZnTiAApjTu3llQ2oAxvutjKWa1tC1ul",
      "34": "82da26f47362c1d867de0cc81b0724cd",
      "35": "dHKu5hkdz3dKLl2OOwKg1D7MItyYSoOV",
      "36": "a4ec38b710d5a75e6b3a92da9f59d844",
      "37": "4x4hxemo5m0jWdCmAKNqC3wMKzSla4qL",
      "38": "8DXTPrqR43tKfc0QdRhNPAHVmWymqa46",
      "39": "UHJaNTIk5NIJgqsCZ8QTsXlU1tNEF05z",
      "40": "5a044cb725072e81b1677099dca12590",
      "41": "ec141cd59ec17ea033826e7e0ec8f48a",
      "42": "82da26f47362c1d867de0cc81b0724cd",
      "43": "463daeae8d33f6d7ed8673b605226323",
      "44": "0f99cfdc3638efc7e35498e623412215",
      "45": "eXttEjPfBhxr6dJc1HeDcEwp0dbWMwoY",
    };

    let totalUpdated = 1;
    for (const userId of Object.keys(userMoveIds) as any) {
      const findUser = getAllUsers.find(
        (user: any) => user.id.toString() === userId.toString()
      );

      const newUserId = userMoveIds[userId as keyof typeof userMoveIds];
      const [updateBeltLog] = await db
        .update(logs)
        .set({ userId: newUserId })
        .where(eq(logs.userId, userId as any));
      console.log(
        `${totalUpdated} - ${findUser?.name} - Belt Log Updated: `,
        updateBeltLog.affectedRows
      );

      const [updateBeltPharmacistReview] = await db
        .update(beltQueuePharmacistReview)
        .set({ pharmacistId: newUserId })
        .where(eq(beltQueuePharmacistReview.pharmacistId, userId as any));
      console.log(
        `${totalUpdated} - ${findUser?.name} - Belt Pharmacist Review Updated: `,
        updateBeltPharmacistReview.affectedRows
      );

      const [updateBeltQueue] = await db
        .update(beltQueues)
        .set({ skippedBy: newUserId })
        .where(or(eq(beltQueues.skippedBy, userId as any)));
      console.log(
        `${totalUpdated} - ${findUser?.name} - Belt Queue Skipped By Updated: `,
        updateBeltQueue.affectedRows
      );

      const [updateBeltQueueHistory] = await db
        .update(beltQueuesHistory)
        .set({ skippedBy: newUserId })
        .where(or(eq(beltQueuesHistory.skippedBy, userId as any)));
      console.log(
        `${totalUpdated} - ${findUser?.name} - Belt Queue History Skipped By Updated: `,
        updateBeltQueueHistory.affectedRows
      );

      totalUpdated++;
    }

    return true;
  } catch (error) {
    console.error("❌ Migration to Better Auth is failed:", error);
    return false;
  }
};

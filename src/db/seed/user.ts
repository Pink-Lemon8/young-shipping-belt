import { statusTypes, users } from "../schema";
import { db } from "@/db/db";
import bcrypt from "bcryptjs";

export async function userSeeder() {
  try {
    // old
    // const password = "123456789";
    // const passwordHashed = await bcrypt.hash(password, 10);
    // console.log("Default password: ", password);
    // console.log("ADMIN is being seeded.");
    // const adminInfo = {
    //   name: "admin",
    //   email: "admin@admin.com",
    //   loginType: "CREDENTIAL",
    //   role: "ADMIN",
    //   password: passwordHashed,
    //   status: statusTypes[1],
    // } as const;
    // const admin = await db
    //   .insert(users)
    //   .values(adminInfo)
    //   .onDuplicateKeyUpdate({
    //     set: { ...adminInfo },
    //   })
    //   .execute();
    console.log("ADMIN is seeded.");
    return true;
  } catch (error) {
    console.log("User Seeder Error");
    console.log(error);
    return error;
  }
}

"use server";
import "dotenv/config";

export async function ProductionDevelopmentChecker() {
  const app_env = process.env.APP_ENV || "development";
  if (["development", "dev"].includes(app_env)) {
    return (
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-1/2 z-50 h-5 rounded-b-md flex items-center justify-center bg-red-600">
        <p className="text-md font-extrabold text-white">Development (TEST)</p>
      </div>
    );
  }
  return null;
}

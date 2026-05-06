import fs from "fs";
import path from "path";

export const tempFolder = path.resolve("src/manage/temp");

const main = async (args?: string[]) => {
  try {
    const test = args?.[0];
    const testArgs = args?.slice(1);

    if (!test) {
      console.error("\nNo management file name provided.\n");
      console.error("\nPlease check the management file name and arguments.");
      console.error("Helper: bun run manage --help or bun run manage -h\n");
      return false;
    }

    const functionsPath = path.resolve("src/manage/functions");
    const files = fs.readdirSync(functionsPath);

    if (test === "--help" || test === "-h") {
      console.log("\n--- Manage Helper --- \n");
      console.log("Available management:");
      files.forEach((file, index) => {
        if (file.endsWith(".ts") && file !== "main.ts") {
          console.log("  " + (index + 1) + ". " + file.replace(".ts", ""));
        }
      });
      console.log("\n--------------------------------\n");
      return;
    }

    console.log("--- Manage script is running... --- \n");

    const functionModules: { [key: string]: any } = {};

    for (const file of files) {
      if (file.endsWith(".ts") && file !== "main.ts") {
        const moduleName = path.basename(file, ".ts");
        const modulePath = path.join(functionsPath, file);
        functionModules[moduleName] = await import(modulePath);
      }
    }

    if (test && functionModules[test]) {
      const result = await functionModules[test].Run(testArgs);
      return result;
    } else {
      console.error("Manage is not found");
      console.error("\nPlease check the manage file name and arguments.");
      console.error("Helper: bun run manage --help or bun run manage -h\n");
      return false;
    }
  } catch (error) {
    console.error("Manage Error");
    console.error(error);
    return false;
  }
};

main(process.argv.slice(2)).then((res) => {
  if (res) {
    console.log("--- Manage is completed ---");
    process.exit(0);
  } else if (res === undefined) {
    process.exit(0);
  } else {
    console.error("--- Manage is failed ---");
    process.exit(1);
  }
});

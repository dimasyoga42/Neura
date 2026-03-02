import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const commands = new Map();

export const loadCommand = async () => {
  const basePath = path.join(__dirname, "../commands");

  const files = fs.readdirSync(basePath).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(basePath, file);
    const moduleUrl = pathToFileURL(filePath).href;

    const commandModule = await import(moduleUrl);
    const command = commandModule.default || commandModule;

    if (!command.name || typeof command.execute !== "function") continue;

    commands.set(command.name, command);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        commands.set(alias, command);
      }
    }
  }

  return commands;
};

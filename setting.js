import fetch from "node-fetch"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
global.Name = "Neura Sama"
global.prefix = "."
global.version = "1,34,2"

export const fetchdata = async (url) => {
  try {
    const res = await fetch(url)

    return res.json()
  } catch (error) {
    console.log(error.message)
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.join(__dirname, "plugins")
export const loadPlugins = async () => {
  const files = fs.readFileSync(pluginDir).filter(file => file.endsWith(".js"))
  for (const file of files) {
    const filePath = path.join(pluginDir, file)
    try {
      const module = await import(`file://${filePath}`);
      if (module.cmd && module.cmd.name) {
        commands.set(module.cmd.name, module.cmd);

        // Daftarkan alias jika ada
        if (module.cmd.alias) {
          module.cmd.alias.forEach(alias => commands.set(alias, module.cmd));
        }
        console.log(`Successfully loaded plugin: ${file}`);
      }
    } catch (error) {
      console.error(`Failed to load plugin ${file}:`, error);
    }
  }
}

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

export const commands = new Map();
export const registerCommand = (config) => {
  const { name, alias, category, desc, run } = config;
  commands.set({ name, alias, category, desc, run });

  if (config.alias) {
    config.alias.forEach(alias => commands.set(alias, commands.get(name)));
  }
};

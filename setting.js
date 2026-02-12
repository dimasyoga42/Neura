import fetch from "node-fetch"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
global.Name = "Neura Sama"
global.prefix = "."
global.version = "1,34,2"
global.dev = "dimasyoga"

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
  const { name, alias = [], category, desc, run } = config;

  const commandObj = { name, alias, category, desc, run };

  commands.set(name, commandObj);

  alias.forEach(a => commands.set(a, commandObj));
};



export const message = [
  "waktu terus berjalan",
  "ayo tidur bersamaku...",
  "dunia ini kejam tapi kan ada aku",
  "butuh pelukan?",
  "dingin dingin ngopi",
  "aku tau kamu bosan",
  "kamu capek?",
  "aku tau kamu jomblo",
  "sini peluk",
  "ayo bobo",
  "hai ganteng",
  "hai cantik",
  "hai sayang",
  "bakaa",
  "Neura Sama"
]

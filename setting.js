import fetch from "node-fetch"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { error } from "console"
//import { ability } from "./src/plugins/toram/anyitems"

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

export const Resapi = {
  neuradev: "https://dev-neura.vercel.app/api",
  waifu: "https://api.waifu.pics",
  menu: "https://raw.githubusercontent.com/dimasyoga42/dataset/main/image/menu/menu.json",
  toramjp: "https://id.toram.jp"
}

export const messageEn = {
  errors: "An error occurred while processing your request. Please try again later.",
  noCommand: "Command not found. Please check the available commands and try again.",
  missingArgs: "Missing arguments. Please check the command usage and try again.",
  invalidArgs: "Invalid arguments. Please check the command usage and try again.",
  success: "Command executed successfully!",
  null: "No data found for your request.",
  notfound: "The requested resource was not found.",
  xtalnotfound: "Xtal not found. Please check the available xtals and try again.",
  regisnotfound: "Regis not found. Please check the available regis and try again.",
  abilitynotfound: "Ability not found. Please check the available abilities and try again.",
  itemnotfound: "Item not found. Please check the available items and try again.",
  bosnotfound: "Boss not found. Please check the available bosses and try again.",
  monsternotfound: "Monster not found. Please check the available monsters and try again.",
}

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
  "Neura Sama",
  "jangan lupa donasi"
]






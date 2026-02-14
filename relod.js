import axios from "axios"
import fs from "fs"
import path from "path"

const PROTO_URL = "https://raw.githubusercontent.com/wppconnect-team/wa-proto/refs/heads/main/dist/index.js"

const OUTPUT_PATH = path.resolve(
  "node_modules/@whiskeysockets/baileys/WAProto/index.js"
)

async function updateProto() {
  try {
    console.log("Downloading proto...")

    const response = await axios.get(PROTO_URL)

    fs.writeFileSync(OUTPUT_PATH, response.data)

    console.log("Proto updated successfully ✅")
  } catch (err) {
    console.error("Failed to update proto ❌")
    console.error(err.message)
  }
}

updateProto()

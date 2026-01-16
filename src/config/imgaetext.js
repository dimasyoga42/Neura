import { createCanvas, loadImage } from "canvas"
import axios from "axios"

export const generateWelcomeImage = async (ppUrl, userName, groupName) => {
  const WIDTH = 800
  const HEIGHT = 300

  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext("2d")

  /* ================= BACKGROUND ================= */

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // card
  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(20, 20, WIDTH - 40, HEIGHT - 40)

  /* ================= AVATAR ================= */

  let avatar
  try {
    const res = await axios.get(ppUrl, { responseType: "arraybuffer" })
    avatar = await loadImage(res.data)
  } catch {
    avatar = await loadImage("https://i.imgur.com/6VBx3io.png")
  }

  const AVATAR_X = 100
  const AVATAR_Y = HEIGHT / 2
  const AVATAR_RADIUS = 60

  ctx.save()
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    avatar,
    AVATAR_X - AVATAR_RADIUS,
    AVATAR_Y - AVATAR_RADIUS,
    AVATAR_RADIUS * 2,
    AVATAR_RADIUS * 2
  )
  ctx.restore()

  /* ================= TEXT ================= */

  const TEXT_X = 200

  ctx.fillStyle = "#000000"

  ctx.font = "bold 34px Sans"
  ctx.fillText("Hai,", TEXT_X, 90)

  ctx.font = "28px Sans"
  ctx.fillText(userName, TEXT_X, 135)

  ctx.font = "20px Sans"
  ctx.fillText(`Selamat datang di ${groupName}`, TEXT_X, 175)

  ctx.font = "18px Sans"
  ctx.fillStyle = "#374151"
  ctx.fillText("Gunakan !menu untuk menggunakan Neura", TEXT_X, 215)

  return canvas.toBuffer()
}



export const generateWelcome = async (ppUrl, groupName, Count) => {
  const WIDTH = 1024
  const HEIGHT = 450

  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext("2d")


  ctx.fillStyle = "#2d2d2d"
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bgGradient.addColorStop(0, "#4a4a4a")
  bgGradient.addColorStop(0.5, "#2d2d2d")
  bgGradient.addColorStop(1, "#1a1a1a")
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const centerOverlay = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH / 2)
  centerOverlay.addColorStop(0, "rgba(0,0,0,0.3)")
  centerOverlay.addColorStop(1, "rgba(0,0,0,0.8)")
  ctx.fillStyle = centerOverlay
  ctx.fillRect(0, 0, WIDTH, HEIGHT)


  let avatar
  try {
    const res = await axios.get(ppUrl, { responseType: "arraybuffer" })
    avatar = await loadImage(res.data)
  } catch {
    avatar = await loadImage("https://i.imgur.com/6VBx3io.png")
  }

  const AVATAR_X = WIDTH / 2
  const AVATAR_Y = 145
  const AVATAR_RADIUS = 85

  ctx.save()
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS + 8, 0, Math.PI * 2)
  ctx.fillStyle = "#5bb5f0"
  ctx.fill()
  ctx.closePath()

  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS + 4, 0, Math.PI * 2)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.closePath()

  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    avatar,
    AVATAR_X - AVATAR_RADIUS,
    AVATAR_Y - AVATAR_RADIUS,
    AVATAR_RADIUS * 2,
    AVATAR_RADIUS * 2
  )
  ctx.restore()

  /* ================= TEXT ================= */

  // Nama pengguna (besar, bold)
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 52px Sans-serif"
  ctx.shadowColor = "rgba(0,0,0,0.8)"
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
  ctx.fillText(groupName, WIDTH / 2, 295)

  ctx.font = "32px Sans-serif"
  ctx.shadowBlur = 12
  ctx.fillText(`salamat datang di grub semoga betah`, WIDTH / 2, 355)

  // Member count
  ctx.font = "24px Sans-serif"
  ctx.shadowBlur = 10
  ctx.fillStyle = "#d1d5db"
  ctx.fillText(`Member ke ${Count}`, WIDTH / 2, 395)

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  return canvas.toBuffer()
}

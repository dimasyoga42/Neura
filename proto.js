import {
  proto,
  generateWAMessage,
  areJidsSameUser,
  getContentType
} from "@whiskeysockets/baileys"

export default function smsg(conn, m) {
  if (!m) return m
  const M = proto.WebMessageInfo

  // ================= KEY =================
  if (m.key) {
    m.id = m.key.id
    m.isBaileys = m.id?.startsWith("BAE5") && m.id.length === 16
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat?.endsWith("@g.us")

    m.sender = conn.decodeJid(
      m.fromMe
        ? conn.user.id
        : m.participant || m.key.participant || m.chat || ""
    )

    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || ""
  }

  // ================= MESSAGE =================
  if (m.message) {
    m.mtype = getContentType(m.message)

    m.msg =
      m.mtype === "viewOnceMessage"
        ? m.message[m.mtype].message[
        getContentType(m.message[m.mtype].message)
        ]
        : m.message[m.mtype]

    // ================= BODY =================
    m.body =
      m.message.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      m.msg?.selectedId ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      ""

    // ================= MENTION =================
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

    // ================= QUOTED =================
    let quoted = m.msg?.contextInfo?.quotedMessage || null

    if (quoted) {
      let type = Object.keys(quoted)[0]
      let q = quoted[type]

      if (["productMessage"].includes(type)) {
        type = Object.keys(q)[0]
        q = q[type]
      }

      if (typeof q === "string") q = { text: q }

      m.quoted = q
      m.quoted.mtype = type
      m.quoted.id = m.msg.contextInfo.stanzaId
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat

      m.quoted.sender = conn.decodeJid(
        m.msg.contextInfo.participant || ""
      )

      m.quoted.fromMe =
        m.quoted.sender === conn.decodeJid(conn.user.id)

      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        ""

      m.quoted.mentionedJid =
        m.msg.contextInfo.mentionedJid || []

      const vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      }))

      m.quoted.delete = () =>
        conn.sendMessage(m.quoted.chat, { delete: vM.key })

      m.quoted.copyNForward = (jid, force = false, options = {}) =>
        conn.copyNForward(jid, vM, force, options)

      m.quoted.download = () =>
        conn.downloadMediaMessage(m.quoted)
    }
  }

  // ================= MEDIA =================
  if (m.msg?.url) {
    m.download = () => conn.downloadMediaMessage(m.msg)
  }

  // ================= TEXT =================
  m.text = String(
    m.msg?.text ||
    m.msg?.caption ||
    m.message?.conversation ||
    m.body ||
    ""
  )

  // ================= REPLY =================
  m.reply = (text, chatId = m.chat, options = {}) => {
    return Buffer.isBuffer(text)
      ? conn.sendMessage(chatId, { document: text }, { quoted: m, ...options })
      : conn.sendMessage(chatId, { text: String(text) }, { quoted: m, ...options })
  }

  // ================= COPY =================
  m.copy = () => smsg(conn, M.fromObject(M.toObject(m)))

  // ================= FORWARD =================
  m.copyNForward = (jid = m.chat, force = false, options = {}) =>
    conn.copyNForward(jid, m, force, options)

  // ================= APPEND TEXT =================
  conn.appendTextMessage = async (text, chatUpdate) => {
    let messages = await generateWAMessage(
      m.chat,
      { text: String(text), mentions: m.mentionedJid },
      {
        userJid: conn.user.id,
        quoted: m.quoted?.fakeObj
      }
    )

    messages.key.fromMe = areJidsSameUser(
      m.sender,
      conn.user.id
    )
    messages.key.id = m.key.id
    messages.pushName = m.pushName
    if (m.isGroup) messages.participant = m.sender

    const msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append"
    }

    conn.ev.emit("messages.upsert", msg)
  }

  return m
}

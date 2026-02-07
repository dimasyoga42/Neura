import { jidDecode } from "@whiskeysockets/baileys"

export function decodeJid(jid) {
  if (!jid) return jid
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {}
    return (decode.user && decode.server)
      ? `${decode.user}@${decode.server}`
      : jid
  }
  return jid
}

import { getContentType, downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";



const getMediaMessage = (msg) => {
  if (msg.message?.imageMessage || msg.message?.videoMessage) return msg

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted }
  }
  return null
}


export const hd = async (sock, chatId, msg) => {
  try {
    const mediaType = getMediaMessage(msg);
    if (!mediaType) {
      return sock.sendMessage(
        chatId,
        { text: "Kirim atau reply gambar untuk di-HD-kan" },
        { quoted: msg }
      );
    }

    // download image
    const buffer = await downloadMediaMessage(
      mediaType,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    );

    // upload ke imgbb
    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    const imgUrl = upload.data.data.url;

    // HD API
    const hdUrl = `https://api.deline.web.id/tools/hd?url=${encodeURIComponent(imgUrl)}`;
    console.log(hdUrl)
    sock.sendMessage(chatId, { text: "mohon tunggu..." }, { quoted: msg })
    await sock.sendMessage(
      chatId,
      { image: { url: hdUrl }, caption: "HD Result" },
      { quoted: msg }
    );

  } catch (error) {
    sock.sendMessage(
      chatId,
      { text: `[HD ERROR]\n${error.message}` },
      { quoted: msg }
    );
  }
};


import fetch from "node-fetch";

// Database emoji populer untuk mix
const popularEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😌', '😔', '😪',
  '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵',
  '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
  '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
  '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
  '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
  '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻',
  '😼', '😽', '🙀', '😿', '😾', '🐶', '🐱', '🐭', '🐹', '🐰',
  '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
  '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥',
  '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛',
  '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍',
  '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠',
  '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍',
  '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '⭐',
  '🌟', '✨', '⚡', '💥', '💫', '💦', '💨', '🔥', '🌈', '☀️',
  '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️',
  '☃️', '⛄', '🌬️', '💨', '💧', '💦', '🌊', '🌫️'
];

// Fungsi untuk encode emoji ke URL format
function encodeEmoji(emoji) {
  return encodeURIComponent(emoji);
}

// Fungsi untuk random pick emoji
function getRandomEmoji() {
  return popularEmojis[Math.floor(Math.random() * popularEmojis.length)];
}

// Fungsi mix 2 emoji menggunakan API
async function mixTwoEmojis(emoji1, emoji2) {
  try {
    const url = `https://api.deline.web.id/maker/emojimix?emoji1=${encodeEmoji(emoji1)}&emoji2=${encodeEmoji(emoji2)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // API biasanya return { status: true, result: "url_gambar" }
    if (data.status && data.result) {
      return {
        success: true,
        imageUrl: data.result,
        emoji1: emoji1,
        emoji2: emoji2
      };
    } else {
      return {
        success: false,
        message: "Kombinasi emoji tidak tersedia"
      };
    }

  } catch (error) {
    console.error('Error mixing emojis:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Handler untuk bot WhatsApp
export const mix = async (sock, chatId, msg, args) => {
  try {
    const text = args.join(' ').trim();

    let emoji1, emoji2;

    if (text.length === 0) {
      // Jika kosong, random 2 emoji
      emoji1 = getRandomEmoji();
      emoji2 = getRandomEmoji();
    } else {
      // Extract emoji dari text
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const emojis = text.match(emojiRegex);

      if (emojis && emojis.length >= 2) {
        emoji1 = emojis[0];
        emoji2 = emojis[1];
      } else if (emojis && emojis.length === 1) {
        emoji1 = emojis[0];
        emoji2 = getRandomEmoji();
      } else {
        // Jika tidak ada emoji, random
        emoji1 = getRandomEmoji();
        emoji2 = getRandomEmoji();
      }
    }

    // Kirim "processing" message
    const processingMsg = await sock.sendMessage(chatId, {
      text: `Mixing ${emoji1} + ${emoji2}...`
    }, { quoted: msg });

    // Mix emoji
    const result = await mixTwoEmojis(emoji1, emoji2);

    if (result.success) {
      // Kirim hasil gambar
      await sock.sendMessage(chatId, {
        image: { url: result.imageUrl },
        caption: `${emoji1} + ${emoji2}`
      });

      // Hapus processing message
      await sock.sendMessage(chatId, { delete: processingMsg.key });

    } else {
      // Kirim error message
      await sock.sendMessage(chatId, {
        text: `Gagal mix ${emoji1} + ${emoji2}\n\n${result.message}\n\nCoba emoji lain atau !mix random`
      });
    }

  } catch (err) {
    console.error('Error mix command:', err);
    sock.sendMessage(chatId, {
      text: 'Terjadi kesalahan saat mix emoji.'
    }, { quoted: msg });
  }
};

export default mix;
